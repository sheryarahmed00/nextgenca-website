// Automatic ID check (Didit). A passed check goes to the admin "To do" list so the fee can be set;
// failed or flagged checks go there too, marked for review.
//
// Cloudflare variables:
//   DIDIT_API_KEY         secret, from Didit console (API & Webhooks)
//   DIDIT_WEBHOOK_SECRET  secret, the webhook "secret shared key" from Didit
//   DIDIT_WORKFLOW_ID     text, the KYC workflow ID from Didit console
import {
  nowIso, gbp, sendEmail, audit, getSettings, renderLetter, sha256, nextInvoiceNumber, DEFAULT_LETTER,
} from "./portal.js";

// Creates the engagement letter, the invoice and the document checklist, then emails the client.
export async function sendAgreementAndInvoice(env, request, c, { service, period, scope, pence, checklist, actor, idChecked }) {
  const st = await getSettings(env);
  const letter = renderLetter(st.letter_template || DEFAULT_LETTER, {
    date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
    name: c.name, company: c.company, service, period, scope: scope || "", fee: gbp(pence),
  });
  const now = nowIso();
  const e = await env.DB.prepare("INSERT INTO engagements (client_id, service, period, scope, fee_pence, letter_text, letter_hash, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'sent', ?)")
    .bind(c.id, service, period || null, scope || null, pence, letter, await sha256(letter), now).run();
  const eid = e.meta.last_row_id;
  const number = await nextInvoiceNumber(env);
  await env.DB.prepare("INSERT INTO invoices (number, client_id, engagement_id, description, amount_pence, status, created_at) VALUES (?, ?, ?, ?, ?, 'unpaid', ?)")
    .bind(number, c.id, eid, service + (period ? " (" + period + ")" : ""), pence, now).run();
  const items = (checklist || []).map(x => String(x).trim().slice(0, 150)).filter(Boolean).slice(0, 30);
  if (items.length) await env.DB.batch(items.map(label => env.DB.prepare("INSERT INTO checklist (client_id, engagement_id, label, created_at) VALUES (?, ?, ?, ?)").bind(c.id, eid, label, now)));
  await env.DB.prepare("UPDATE clients SET stage = 'active', active = 1 WHERE id = ?").bind(c.id).run();
  await audit(env, request, actor, idChecked ? "kyc_approved_and_agreement_sent" : "agreement_sent", `client#${c.id} ${service} ${gbp(pence)} ${number}`);
  await sendEmail(env, c.email, "Your NextGen agreement and invoice are ready",
    `Dear ${c.name},\n\n${idChecked ? "Thank you, your ID has been checked. " : ""}Your agreement and invoice for ${service} (${gbp(pence)}) are ready in your client portal.\n\n1. Read and sign the agreement\n2. Pay the invoice (${number})\n3. Upload the documents on your checklist\n\nIt takes about 2 minutes on your phone: ${env.SITE_URL || "https://nextgenca.co.uk"}/portal\n\nKind regards,\nNextGen Chartered Accountant`);
  return { engagement_id: eid, invoice: number };
}

// ---------- Didit ----------
export async function ensureKycTable(env) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS kyc_checks (id INTEGER PRIMARY KEY AUTOINCREMENT, client_id INTEGER NOT NULL, provider TEXT NOT NULL, session_id TEXT NOT NULL UNIQUE, status TEXT NOT NULL, summary TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`).run();
}
export const diditOn = env => !!(env.DIDIT_API_KEY && env.DIDIT_WORKFLOW_ID);

export async function diditStart(env, c, origin) {
  await ensureKycTable(env);
  const r = await fetch("https://verification.didit.me/v3/session/", {
    method: "POST",
    headers: { "x-api-key": env.DIDIT_API_KEY, "content-type": "application/json" },
    body: JSON.stringify({
      workflow_id: env.DIDIT_WORKFLOW_ID,
      vendor_data: `client-${c.id}`,
      callback: `${origin}/portal?kyc=done`,
      callback_method: "both",
      metadata: { client_id: String(c.id) },
      language: "en",
      contact_details: { email: c.email, send_notification_emails: false },
    }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.url || !j.session_id) { console.log("didit create failed", r.status, JSON.stringify(j)); throw new Error("ID check could not start"); }
  const now = nowIso();
  await env.DB.prepare("INSERT INTO kyc_checks (client_id, provider, session_id, status, created_at, updated_at) VALUES (?, 'didit', ?, ?, ?, ?) ON CONFLICT(session_id) DO UPDATE SET updated_at = excluded.updated_at")
    .bind(c.id, j.session_id, j.status || "Not Started", now, now).run();
  return j.url;
}

export async function diditDecision(env, sessionId) {
  const r = await fetch(`https://verification.didit.me/v3/session/${encodeURIComponent(sessionId)}/decision/`, { headers: { "x-api-key": env.DIDIT_API_KEY } });
  if (!r.ok) { console.log("didit decision failed", r.status); return null; }
  return r.json();
}

function summarise(d) {
  if (!d) return "";
  const parts = [];
  for (const k of ["id_verifications", "liveness_checks", "face_matches", "aml_screenings"]) {
    const arr = d[k] || (d[k.replace(/s$/, "")] ? [d[k.replace(/s$/, "")]] : []);
    for (const x of arr) if (x && x.status) parts.push(`${k.replace(/_/g, " ")}: ${x.status}${x.total_hits ? " (" + x.total_hits + " hits)" : ""}`);
  }
  return parts.join("; ").slice(0, 900);
}

// Applies a Didit result to a client. Safe to call many times.
export async function diditApply(env, request, sessionId, status, decision, actor) {
  await ensureKycTable(env);
  const k = await env.DB.prepare("SELECT * FROM kyc_checks WHERE session_id = ?").bind(sessionId).first();
  if (!k) return { ok: false };
  const summary = summarise(decision);
  await env.DB.prepare("UPDATE kyc_checks SET status = ?, summary = COALESCE(NULLIF(?, ''), summary), updated_at = ? WHERE id = ?").bind(status, summary, nowIso(), k.id).run();
  const c = await env.DB.prepare("SELECT * FROM clients WHERE id = ?").bind(k.client_id).first();
  if (!c || c.stage !== "kyc") return { ok: true, stage: c && c.stage };
  if (status === "Approved") {
    await env.DB.prepare("UPDATE clients SET stage = 'review' WHERE id = ? AND stage = 'kyc'").bind(c.id).run();
    await audit(env, request, actor, "kyc_auto_passed", `client#${c.id} didit ${sessionId} ${summary}`);
    if (env.NOTIFY_EMAIL) await sendEmail(env, env.NOTIFY_EMAIL, `ID verified: ${c.name} – set the fee`, `${c.name} <${c.email}> passed the automatic ID check for "${c.wanted_service}".${c.signup_note ? "\n\nTheir note: " + c.signup_note : ""}\n\nSet the fee and send the agreement and invoice from To do: ${env.SITE_URL || "https://nextgenca.co.uk"}/portal-admin`);
    return { ok: true, verified: true };
  }
  if (status === "Declined" || status === "In Review") {
    await env.DB.prepare("UPDATE clients SET stage = 'review' WHERE id = ? AND stage = 'kyc'").bind(c.id).run();
    await audit(env, request, actor, "kyc_needs_review", `client#${c.id} didit ${status} ${summary}`);
    if (env.NOTIFY_EMAIL) await sendEmail(env, env.NOTIFY_EMAIL, `ID check ${status.toLowerCase()}: ${c.name}`, `The automatic ID check for ${c.name} <${c.email}> came back "${status}".\n${summary}\n\nPlease review it in To do: ${env.SITE_URL || "https://nextgenca.co.uk"}/portal-admin\n(Full details are in your Didit console.)`);
    return { ok: true, review: true };
  }
  return { ok: true };
}

// Verifies Didit's X-Signature (HMAC-SHA256 hex of the raw body) and X-Timestamp (5 minutes).
export async function diditVerify(env, raw, sig, ts, prevSig) {
  if (!env.DIDIT_WEBHOOK_SECRET || !sig || !ts) return false;
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(env.DIDIT_WEBHOOK_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = [...new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw)))].map(b => b.toString(16).padStart(2, "0")).join("");
  const eq = s => typeof s === "string" && s.length === mac.length && [...s].reduce((r, ch, i) => r | (ch.charCodeAt(0) ^ mac.charCodeAt(i)), 0) === 0;
  return eq(sig) || eq(prevSig);
}
