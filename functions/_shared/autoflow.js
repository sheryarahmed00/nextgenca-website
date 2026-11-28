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
// Values pasted into Cloudflare can carry a stray space or line break; trim them.
const strip = v => String(v || "").replace(/[\s\u0000-\u001f\u007f\u200b-\u200d\ufeff]/g, "");
const dkey = env => strip(env.DIDIT_API_KEY);
const dflow = env => strip(env.DIDIT_WORKFLOW_ID);
// Says, without revealing anything secret, whether the saved Didit settings look usable.
export function diditState(env) {
  const k = dkey(env), w = dflow(env);
  if (!k || !w) return "off";
  if (/[^\x21-\x7e]/.test(k)) return `key_has_invalid_characters(len=${k.length},bad=${(k.match(/[^\x21-\x7e]/g) || []).length})`;
  if (!/^[0-9a-f-]{36}$/i.test(w)) return `workflow_id_not_a_uuid(len=${w.length})`;
  return "ok";
}
export const diditOn = env => !!(dkey(env) && dflow(env));

// Live check that Didit accepts the saved key (asks for a session that does not exist: 404 = key accepted).
export async function diditPing(env) {
  const state = diditState(env);
  if (state !== "ok") return state;
  const r = await fetch("https://verification.didit.me/v3/session/00000000-0000-4000-8000-000000000000/decision/", { headers: { "x-api-key": dkey(env) } });
  return r.status === 401 || r.status === 403 ? "key_rejected_" + r.status : "key_accepted_" + r.status;
}

export async function diditStart(env, c, origin) {
  const state = diditState(env);
  if (state !== "ok") throw new Error("Didit settings: " + state);
  await ensureKycTable(env);
  const r = await fetch("https://verification.didit.me/v3/session/", {
    method: "POST",
    headers: { "x-api-key": dkey(env), "content-type": "application/json" },
    body: JSON.stringify({
      workflow_id: dflow(env),
      vendor_data: `client-${c.id}`,
      callback: `${origin}/portal?kyc=done`,
      callback_method: "both",
      metadata: { client_id: String(c.id) },
      language: "en",
      contact_details: { email: c.email, send_notification_emails: false },
    }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.url || !j.session_id) { console.log("didit create failed", r.status, JSON.stringify(j)); throw new Error(`Didit ${r.status}: ${JSON.stringify(j).slice(0, 300)}`); }
  const now = nowIso();
  await env.DB.prepare("INSERT INTO kyc_checks (client_id, provider, session_id, status, created_at, updated_at) VALUES (?, 'didit', ?, ?, ?, ?) ON CONFLICT(session_id) DO UPDATE SET updated_at = excluded.updated_at")
    .bind(c.id, j.session_id, j.status || "Not Started", now, now).run();
  return j.url;
}

export async function diditDecision(env, sessionId) {
  const r = await fetch(`https://verification.didit.me/v3/session/${encodeURIComponent(sessionId)}/decision/`, { headers: { "x-api-key": dkey(env) } });
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
    // A fee agreed in an accepted quote means no one needs to set it: send the agreement + invoice now.
    const q = await acceptedQuoteFor(env, c.id, c.email);
    if (q) {
      await quoteEvent(env, q.id, "id_checked", `didit ${status}`);
      const fresh = await env.DB.prepare("SELECT * FROM clients WHERE id = ?").bind(c.id).first();
      const r = await invoiceFromQuote(env, request, fresh, q, actor, true);
      return { ok: true, verified: true, invoice: r.invoice };
    }
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
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(String(env.DIDIT_WEBHOOK_SECRET).trim()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = [...new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw)))].map(b => b.toString(16).padStart(2, "0")).join("");
  const eq = s => typeof s === "string" && s.length === mac.length && [...s].reduce((r, ch, i) => r | (ch.charCodeAt(0) ^ mac.charCodeAt(i)), 0) === 0;
  return eq(sig) || eq(prevSig);
}

// ---------- Quotes ----------
// A quote is created by staff, emailed to the client, accepted online, and closed when its invoice is issued.
// Status: sent -> viewed -> accepted -> invoiced  (or expired / withdrawn / replaced / declined)
export async function ensureQuoteTables(env) {
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS quotes (id INTEGER PRIMARY KEY AUTOINCREMENT, number TEXT NOT NULL UNIQUE, token_hash TEXT NOT NULL UNIQUE, email TEXT NOT NULL, name TEXT NOT NULL, company TEXT, phone TEXT, service TEXT NOT NULL, period TEXT, scope TEXT, checklist TEXT, fee_pence INTEGER NOT NULL, status TEXT NOT NULL, valid_until TEXT NOT NULL, created_by TEXT NOT NULL, created_at TEXT NOT NULL, viewed_at TEXT, accepted_at TEXT, accepted_ip TEXT, client_id INTEGER, invoice_number TEXT, closed_at TEXT, reminded_at TEXT)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS quote_events (id INTEGER PRIMARY KEY AUTOINCREMENT, quote_id INTEGER NOT NULL, at TEXT NOT NULL, event TEXT NOT NULL, detail TEXT)`),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS i_quotes_email ON quotes(email)`),
  ]);
}
export async function quoteEvent(env, quoteId, event, detail = "") {
  await env.DB.prepare("INSERT INTO quote_events (quote_id, at, event, detail) VALUES (?, ?, ?, ?)").bind(quoteId, nowIso(), event, String(detail).slice(0, 500)).run();
}
export async function nextQuoteNumber(env) {
  const year = new Date().getUTCFullYear();
  const r = await env.DB.prepare("SELECT COUNT(*) AS n FROM quotes WHERE number LIKE ?").bind(`NGCA-Q-${year}-%`).first();
  return `NGCA-Q-${year}-${String((r.n || 0) + 1).padStart(4, "0")}`;
}
// Marks old open quotes as expired. Cheap; called when quotes are listed or opened.
export async function expireQuotes(env) {
  const now = nowIso();
  const old = await env.DB.prepare("SELECT id FROM quotes WHERE status IN ('sent','viewed') AND valid_until < ?").bind(now).all();
  for (const q of old.results) {
    await env.DB.prepare("UPDATE quotes SET status = 'expired', closed_at = ? WHERE id = ?").bind(now, q.id).run();
    await quoteEvent(env, q.id, "expired");
  }
}
// The accepted, not yet invoiced quote for a client, if any.
export async function acceptedQuoteFor(env, clientId, email) {
  await ensureQuoteTables(env);
  return env.DB.prepare("SELECT * FROM quotes WHERE status = 'accepted' AND (client_id = ? OR email = ?) ORDER BY id DESC LIMIT 1").bind(clientId, email).first();
}
export async function closeQuote(env, quoteId, invoiceNumber, actor) {
  await env.DB.prepare("UPDATE quotes SET status = 'invoiced', invoice_number = ?, closed_at = ? WHERE id = ? AND status = 'accepted'").bind(invoiceNumber, nowIso(), quoteId).run();
  await quoteEvent(env, quoteId, "invoiced", `${invoiceNumber} by ${actor}`);
}
// Turns an accepted quote into the engagement letter + invoice + checklist, then closes the quote.
export async function invoiceFromQuote(env, request, c, q, actor, idChecked) {
  let checklist = [];
  try { checklist = JSON.parse(q.checklist || "[]"); } catch (e) {}
  const r = await sendAgreementAndInvoice(env, request, c, {
    service: q.service, period: q.period, scope: q.scope, pence: q.fee_pence, checklist, actor, idChecked,
  });
  await closeQuote(env, q.id, r.invoice, actor);
  if (env.NOTIFY_EMAIL) await sendEmail(env, env.NOTIFY_EMAIL, `Quote ${q.number} accepted and invoiced`, `${c.name} <${c.email}> accepted quote ${q.number} (${q.service}, ${gbp(q.fee_pence)}).${idChecked ? " The ID check passed." : ""}\n\nThe engagement letter and invoice ${r.invoice} were sent automatically. Nothing to do until they sign and pay.`);
  return r;
}
