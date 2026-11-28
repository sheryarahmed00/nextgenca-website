// NextGen staff API: /api/admin/*  (only emails listed in ADMIN_EMAILS can use it)
import {
  json, bad, ensureSchema, sameOrigin, cleanEmail, cleanText, cleanDate, getSession, audit,
  checkUpload, sniffOk, downloadResponse, nowIso, sendEmail, storeUpload,
  getSettings, renderLetter, sha256, nextInvoiceNumber, parsePence, gbp,
  SERVICES, SERVICE_STATUSES, ORDER_STATUSES, DEFAULT_CHECKLIST, DEFAULT_LETTER, files, randomToken, hmac,
} from "../../_shared/portal.js";
import { sendAgreementAndInvoice, ensureKycTable, ensureQuoteTables, quoteEvent, nextQuoteNumber, expireQuotes, acceptedQuoteFor, closeQuote } from "../../_shared/autoflow.js";


export async function onRequest(context) {
  const { request, env, params } = context;
  try {
    await ensureSchema(env);
    if (!sameOrigin(request)) return bad("Request blocked.", 403);
    const s = await getSession(env, request);
    if (!s) return bad("Please log in.", 401);
    if (s.role !== "admin") return bad("Not allowed.", 403);
    const route = (params.route || []).join("/");
    const m = request.method;
    let x;

    if (route === "meta" && m === "GET") return json({ services: SERVICES, serviceStatuses: SERVICE_STATUSES, orderStatuses: ORDER_STATUSES, checklists: DEFAULT_CHECKLIST, email: s.email });
    if (route === "signups" && m === "GET") {
      const r = await env.DB.prepare(`SELECT c.*, (SELECT COUNT(*) FROM invoices i WHERE i.client_id = c.id AND i.status = 'unpaid') AS unpaid,
        (SELECT COUNT(*) FROM invoices i WHERE i.client_id = c.id AND i.status = 'unpaid' AND i.client_says_paid_at IS NOT NULL) AS says_paid
        FROM clients c WHERE c.stage IN ('kyc','review') OR EXISTS (SELECT 1 FROM invoices i WHERE i.client_id = c.id AND i.status = 'unpaid')
        ORDER BY c.id DESC LIMIT 200`).all();
      return json({ items: r.results });
    }
    if (route === "quotes" && m === "GET") return await listQuotes(env, request);
    if (route === "quotes" && m === "POST") return await createQuote(env, request, s);
    if ((x = route.match(/^quotes\/(\d+)$/)) && m === "GET") return await getQuote(env, Number(x[1]));
    if ((x = route.match(/^quotes\/(\d+)\/withdraw$/)) && m === "POST") return await withdrawQuote(env, request, s, Number(x[1]));
    if ((x = route.match(/^quotes\/(\d+)\/resend$/)) && m === "POST") return await resendQuote(env, request, s, Number(x[1]));
    if (route === "settings" && m === "GET") return json(await getSettings(env));
    if (route === "settings" && m === "PUT") return await saveSettings(env, request, s);
    if ((x = route.match(/^clients\/(\d+)\/approve$/)) && m === "POST") return await approve(env, request, s, Number(x[1]));
    if ((x = route.match(/^clients\/(\d+)\/reject$/)) && m === "POST") return await reject(env, request, s, Number(x[1]));
    if ((x = route.match(/^invoices\/(\d+)$/)) && m === "PUT") return await updateInvoice(env, request, s, Number(x[1]));
    if (route === "clients" && m === "GET") return await listClients(env, request);
    if (route === "clients" && m === "POST") return await createClient(env, request, s);
    if ((x = route.match(/^clients\/(\d+)$/))) {
      if (m === "GET") return await getClient(env, Number(x[1]));
      if (m === "PUT") return await updateClient(env, request, s, Number(x[1]));
    }
    if ((x = route.match(/^clients\/(\d+)\/services$/)) && m === "POST") return await saveService(env, request, s, Number(x[1]), null);
    if ((x = route.match(/^services\/(\d+)$/))) {
      if (m === "PUT") return await saveService(env, request, s, null, Number(x[1]));
      if (m === "DELETE") return await deleteService(env, request, s, Number(x[1]));
    }
    if ((x = route.match(/^clients\/(\d+)\/documents$/)) && m === "POST") return await uploadDoc(env, request, s, Number(x[1]));
    if ((x = route.match(/^documents\/(\d+)$/)) && m === "DELETE") return await deleteDoc(env, request, s, Number(x[1]));
    if ((x = route.match(/^documents\/(\d+)\/download$/)) && m === "GET") return await downloadDoc(env, request, s, Number(x[1]));
    if (route === "orders" && m === "GET") return await listOrders(env, request);
    if ((x = route.match(/^orders\/(\d+)$/)) && m === "PUT") return await updateOrder(env, request, s, Number(x[1]));
    if (route === "audit" && m === "GET") {
      const r = await env.DB.prepare("SELECT * FROM audit ORDER BY id DESC LIMIT 200").all();
      return json({ items: r.results });
    }
    return bad("Not found.", 404);
  } catch (e) {
    console.log("admin error", e && e.stack || e);
    return bad("Something went wrong: " + (e && e.message || "error"), 500);
  }
}

async function body(request) { try { return await request.json(); } catch { return {}; } }

async function listClients(env, request) {
  const q = cleanText(new URL(request.url).searchParams.get("q"), 100).toLowerCase();
  const like = "%" + q.replace(/[%_]/g, "") + "%";
  const r = await env.DB.prepare(`SELECT c.*,
      (SELECT COUNT(*) FROM services WHERE client_id = c.id) AS n_services,
      (SELECT COUNT(*) FROM documents WHERE client_id = c.id) AS n_docs,
      (SELECT COUNT(*) FROM orders WHERE client_id = c.id AND status IN ('New','Accepted','In progress')) AS n_open
    FROM clients c WHERE (? = '%%' OR lower(c.name) LIKE ? OR lower(c.email) LIKE ? OR lower(COALESCE(c.company,'')) LIKE ?)
    ORDER BY c.name COLLATE NOCASE LIMIT 500`).bind(like, like, like, like).all();
  return json({ items: r.results });
}

async function createClient(env, request, s) {
  const b = await body(request);
  const email = cleanEmail(b.email);
  const name = cleanText(b.name, 120);
  if (!email) return bad("Enter a valid email.");
  if (!name) return bad("Enter the client's name.");
  const exists = await env.DB.prepare("SELECT id FROM clients WHERE email = ?").bind(email).first();
  if (exists) return bad("A client with this email already exists.");
  const r = await env.DB.prepare("INSERT INTO clients (email, name, company, phone, active, created_at) VALUES (?, ?, ?, ?, 1, ?)")
    .bind(email, name, cleanText(b.company, 150) || null, cleanText(b.phone, 40) || null, nowIso()).run();
  await audit(env, request, s.email, "client_created", `#${r.meta.last_row_id} ${email}`);
  if (b.invite) {
    await sendEmail(env, email, "Your NextGen client portal is ready",
      `Dear ${name},\n\nYour NextGen Chartered Accountant client portal is ready. You can see the work we have done for you, download your documents, upload records and order new services.\n\nLog in here: ${env.SITE_URL || "https://nextgenca.co.uk"}/portal\nThe first time, enter this email address (${email}) and we will email you a one-time login code. You will then choose a password and link a free authenticator app (Google or Microsoft Authenticator) on your phone. After that you log in with your email, password and the 6-digit code from the app.\n\nKind regards,\nNextGen Chartered Accountant`);
  }
  return json({ ok: true, id: r.meta.last_row_id });
}

async function getClient(env, id) {
  const [c, sv, d, o, en, inv, cl] = await env.DB.batch([
    env.DB.prepare("SELECT * FROM clients WHERE id = ?").bind(id),
    env.DB.prepare("SELECT * FROM services WHERE client_id = ? ORDER BY COALESCE(completed_date, start_date, created_at) DESC, id DESC").bind(id),
    env.DB.prepare("SELECT id, service_id, title, category, filename, size, uploaded_by, created_at FROM documents WHERE client_id = ? ORDER BY id DESC").bind(id),
    env.DB.prepare("SELECT * FROM orders WHERE client_id = ? ORDER BY id DESC").bind(id),
    env.DB.prepare("SELECT * FROM engagements WHERE client_id = ? ORDER BY id DESC").bind(id),
    env.DB.prepare("SELECT * FROM invoices WHERE client_id = ? ORDER BY id DESC").bind(id),
    env.DB.prepare("SELECT * FROM checklist WHERE client_id = ? ORDER BY id").bind(id),
  ]);
  if (!c.results[0]) return bad("Client not found.", 404);
  await ensureKycTable(env);
  const kyc = await env.DB.prepare("SELECT provider, status, summary, updated_at FROM kyc_checks WHERE client_id = ? ORDER BY id DESC LIMIT 3").bind(id).all();
  const quote = await acceptedQuoteFor(env, id, c.results[0].email);
  return json({ quote, kyc: kyc.results, client: c.results[0], services: sv.results, documents: d.results, orders: o.results, engagements: en.results, invoices: inv.results, checklist: cl.results });
}

async function updateClient(env, request, s, id) {
  const b = await body(request);
  const c = await env.DB.prepare("SELECT * FROM clients WHERE id = ?").bind(id).first();
  if (!c) return bad("Client not found.", 404);
  const email = b.email !== undefined ? cleanEmail(b.email) : c.email;
  if (!email) return bad("Enter a valid email.");
  if (email !== c.email) {
    const dupe = await env.DB.prepare("SELECT id FROM clients WHERE email = ? AND id != ?").bind(email, id).first();
    if (dupe) return bad("Another client already uses this email.");
  }
  const name = b.name !== undefined ? cleanText(b.name, 120) : c.name;
  if (!name) return bad("Enter the client's name.");
  const active = b.active !== undefined ? (b.active ? 1 : 0) : c.active;
  await env.DB.prepare("UPDATE clients SET email = ?, name = ?, company = ?, phone = ?, active = ? WHERE id = ?")
    .bind(email, name, b.company !== undefined ? cleanText(b.company, 150) || null : c.company,
      b.phone !== undefined ? cleanText(b.phone, 40) || null : c.phone, active, id).run();
  // Changing the email or switching the account off logs the client out everywhere.
  if (email !== c.email || !active) await env.DB.prepare("DELETE FROM sessions WHERE client_id = ?").bind(id).run();
  await audit(env, request, s.email, "client_updated", `#${id} ${email} active=${active}`);
  return json({ ok: true });
}

async function saveService(env, request, s, clientId, serviceId) {
  const b = await body(request);
  let existing = null;
  if (serviceId) {
    existing = await env.DB.prepare("SELECT * FROM services WHERE id = ?").bind(serviceId).first();
    if (!existing) return bad("Service not found.", 404);
    clientId = existing.client_id;
  } else {
    const c = await env.DB.prepare("SELECT id FROM clients WHERE id = ?").bind(clientId).first();
    if (!c) return bad("Client not found.", 404);
  }
  const service = cleanText(b.service, 120);
  const status = cleanText(b.status, 40);
  if (!service) return bad("Choose a service.");
  if (!SERVICE_STATUSES.includes(status)) return bad("Choose a status.");
  const vals = [service, cleanText(b.period, 80) || null, cleanText(b.notes, 2000) || null, status,
    cleanDate(b.start_date), cleanDate(b.completed_date), cleanText(b.fee, 40) || null, nowIso()];
  let id = serviceId;
  if (serviceId) {
    await env.DB.prepare("UPDATE services SET service=?, period=?, notes=?, status=?, start_date=?, completed_date=?, fee=?, updated_at=? WHERE id=?").bind(...vals, serviceId).run();
  } else {
    const r = await env.DB.prepare("INSERT INTO services (service, period, notes, status, start_date, completed_date, fee, updated_at, client_id, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)").bind(...vals, clientId, nowIso()).run();
    id = r.meta.last_row_id;
  }
  await audit(env, request, s.email, serviceId ? "service_updated" : "service_added", `#${id} client#${clientId} ${service} ${status}`);
  return json({ ok: true, id });
}

async function deleteService(env, request, s, id) {
  const sv = await env.DB.prepare("SELECT * FROM services WHERE id = ?").bind(id).first();
  if (!sv) return bad("Not found.", 404);
  await env.DB.batch([
    env.DB.prepare("UPDATE documents SET service_id = NULL WHERE service_id = ?").bind(id),
    env.DB.prepare("DELETE FROM services WHERE id = ?").bind(id),
  ]);
  await audit(env, request, s.email, "service_deleted", `#${id} client#${sv.client_id} ${sv.service}`);
  return json({ ok: true });
}

async function uploadDoc(env, request, s, clientId) {
  files(env);
  const c = await env.DB.prepare("SELECT * FROM clients WHERE id = ?").bind(clientId).first();
  if (!c) return bad("Client not found.", 404);
  const form = await request.formData();
  const file = form.get("file");
  const chk = checkUpload(file);
  if (chk.error) return bad(chk.error);
  if (!(await sniffOk(file, chk.ext))) return bad("This file does not look like a real " + chk.ext.toUpperCase() + " file.");
  const title = cleanText(form.get("title"), 120) || chk.name;
  let serviceId = Number(form.get("service_id")) || null;
  if (serviceId) {
    const own = await env.DB.prepare("SELECT id FROM services WHERE id = ? AND client_id = ?").bind(serviceId, clientId).first();
    if (!own) serviceId = null;
  }
  const docId = await storeUpload(env, request, { clientId, file, chk, title, serviceId, by: "firm" });
  const r = { meta: { last_row_id: docId } };
  await audit(env, request, s.email, "firm_upload", `#${docId} client#${clientId} ${chk.name}`);
  if (form.get("notify") === "1" && c.active) {
    await sendEmail(env, c.email, "A new document is ready in your NextGen portal",
      `Dear ${c.name},\n\nA new document "${title}" has been added to your NextGen client portal.\n\nLog in to download it: ${env.SITE_URL || "https://nextgenca.co.uk"}/portal\n\nFor your security we never attach your documents to emails.\n\nKind regards,\nNextGen Chartered Accountant`);
  }
  return json({ ok: true, id: r.meta.last_row_id });
}

async function deleteDoc(env, request, s, id) {
  const d = await env.DB.prepare("SELECT * FROM documents WHERE id = ?").bind(id).first();
  if (!d) return bad("Not found.", 404);
  await files(env).del(d.r2_key);
  await env.DB.prepare("DELETE FROM documents WHERE id = ?").bind(id).run();
  await audit(env, request, s.email, "document_deleted", `#${id} client#${d.client_id} ${d.filename}`);
  return json({ ok: true });
}

async function downloadDoc(env, request, s, id) {
  const d = await env.DB.prepare("SELECT * FROM documents WHERE id = ?").bind(id).first();
  if (!d) return bad("Not found.", 404);
  const obj = await files(env).get(d.r2_key);
  if (!obj) return bad("File missing.", 404);
  await audit(env, request, s.email, "firm_download", `#${id} client#${d.client_id} ${d.filename}`);
  return downloadResponse(obj, d.filename, d.content_type);
}

async function listOrders(env, request) {
  const st = new URL(request.url).searchParams.get("status");
  const where = ORDER_STATUSES.includes(st) ? "WHERE o.status = ?" : "";
  const stmt = env.DB.prepare(`SELECT o.*, c.name AS client_name, c.email AS client_email, c.company AS client_company
    FROM orders o JOIN clients c ON c.id = o.client_id ${where} ORDER BY o.id DESC LIMIT 300`);
  const r = await (where ? stmt.bind(st) : stmt).all();
  return json({ items: r.results });
}

async function updateOrder(env, request, s, id) {
  const b = await body(request);
  const o = await env.DB.prepare("SELECT o.*, c.email AS client_email, c.name AS client_name, c.active FROM orders o JOIN clients c ON c.id = o.client_id WHERE o.id = ?").bind(id).first();
  if (!o) return bad("Order not found.", 404);
  const status = cleanText(b.status, 40);
  if (!ORDER_STATUSES.includes(status)) return bad("Choose a status.");
  const note = cleanText(b.firm_note, 1000) || null;
  await env.DB.prepare("UPDATE orders SET status = ?, firm_note = ?, updated_at = ? WHERE id = ?").bind(status, note, nowIso(), id).run();
  await audit(env, request, s.email, "order_updated", `#${id} ${o.status} -> ${status}`);
  if (b.notify && o.active && status !== o.status) {
    await sendEmail(env, o.client_email, `Your NextGen order #${id} is now: ${status}`,
      `Dear ${o.client_name},\n\nYour order #${id} (${o.service}) is now: ${status}.${note ? "\n\nNote from NextGen: " + note : ""}\n\nSee the details in your portal: ${env.SITE_URL || "https://nextgenca.co.uk"}/portal\n\nKind regards,\nNextGen Chartered Accountant`);
  }
  return json({ ok: true });
}

async function saveSettings(env, request, s) {
  const b = await body(request);
  const keys = { bank_name: 80, account_name: 120, sort_code: 12, account_number: 12, pay_link: 300, dd_link: 300, letter_template: 20000 };
  const stmts = [];
  for (const [k, max] of Object.entries(keys)) {
    if (b[k] === undefined) continue;
    let v = String(b[k] ?? "").replace(/\r/g, "").slice(0, max);
    if (k !== "letter_template") v = cleanText(v, max);
    if ((k === "pay_link" || k === "dd_link") && v && !/^https:\/\/[^\s<>"']+$/.test(v)) return bad("The payment link must start with https://");
    if (k === "sort_code" && v && !/^\d{2}-?\d{2}-?\d{2}$/.test(v)) return bad("Sort code should look like 12-34-56.");
    if (k === "account_number" && v && !/^\d{8}$/.test(v)) return bad("Account number should be 8 digits.");
    if (k === "letter_template" && !v.trim()) v = DEFAULT_LETTER;
    stmts.push(env.DB.prepare("INSERT INTO settings (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v").bind(k, v));
  }
  if (stmts.length) await env.DB.batch(stmts);
  await audit(env, request, s.email, "settings_updated", Object.keys(b).join(","));
  return json({ ok: true });
}

// Approve ID (if pending) and send an agreement + invoice. Also used for new work for existing clients.
async function approve(env, request, s, id) {
  const c = await env.DB.prepare("SELECT * FROM clients WHERE id = ?").bind(id).first();
  if (!c) return bad("Client not found.", 404);
  if (c.stage === "kyc") return bad("The client has not uploaded ID yet.");
  const b = await body(request);
  const service = cleanText(b.service, 120);
  const pence = parsePence(b.fee);
  if (!service) return bad("Choose the service.");
  if (!pence) return bad("Enter the fee, e.g. 150.");
  const st = await getSettings(env);
  if (!st.account_number && !st.pay_link && !st.dd_link) return bad("Add your bank details or payment link in Settings first.");
  const period = cleanText(b.period, 80) || null;
  const scope = cleanText(b.scope, 3000);
  const items = (Array.isArray(b.checklist) ? b.checklist : []).map(x => cleanText(x, 150)).filter(Boolean).slice(0, 30);
  const r = await sendAgreementAndInvoice(env, request, c, { service, period, scope, pence, checklist: items, actor: s.email, idChecked: c.stage === "review" });
  const q = await acceptedQuoteFor(env, c.id, c.email);
  if (q) await closeQuote(env, q.id, r.invoice, s.email);
  return json({ ok: true, engagement_id: r.engagement_id, invoice: r.invoice });
}

async function reject(env, request, s, id) {
  const c = await env.DB.prepare("SELECT * FROM clients WHERE id = ?").bind(id).first();
  if (!c) return bad("Client not found.", 404);
  const reason = cleanText((await body(request)).reason, 500);
  await env.DB.batch([
    env.DB.prepare("UPDATE clients SET stage = 'rejected', active = 0, reject_reason = ? WHERE id = ?").bind(reason || null, id),
    env.DB.prepare("DELETE FROM sessions WHERE client_id = ?").bind(id),
  ]);
  await audit(env, request, s.email, "client_rejected", `client#${id} ${reason}`);
  await sendEmail(env, c.email, "Your NextGen sign-up",
    `Dear ${c.name},\n\nThank you for your interest in NextGen Chartered Accountant. Unfortunately we are not able to take this work on at the moment.${reason ? "\n\n" + reason : ""}\n\nKind regards,\nNextGen Chartered Accountant`);
  return json({ ok: true });
}

async function updateInvoice(env, request, s, id) {
  const inv = await env.DB.prepare("SELECT i.*, c.email, c.name FROM invoices i JOIN clients c ON c.id = i.client_id WHERE i.id = ?").bind(id).first();
  if (!inv) return bad("Invoice not found.", 404);
  const b = await body(request);
  const status = cleanText(b.status, 20);
  if (!["paid", "unpaid", "cancelled"].includes(status)) return bad("Bad status.");
  const method = status === "paid" ? (cleanText(b.method, 40) || "Bank transfer") : null;
  await env.DB.prepare("UPDATE invoices SET status = ?, paid_at = ?, paid_method = ? WHERE id = ?").bind(status, status === "paid" ? nowIso() : null, method, id).run();
  await audit(env, request, s.email, "invoice_" + status, `${inv.number} ${gbp(inv.amount_pence)} ${method || ""}`);
  if (status === "paid" && inv.status !== "paid") {
    const n = await env.DB.prepare("SELECT COUNT(*) AS n FROM checklist WHERE engagement_id = ?").bind(inv.engagement_id).first();
    await sendEmail(env, inv.email, `Payment received: ${inv.number}`,
      `Dear ${inv.name},\n\nThank you, we have received your payment of ${gbp(inv.amount_pence)} for invoice ${inv.number}.${n && n.n ? "\n\nNext step: please upload the documents on your checklist so we can start: " : "\n\nWe will now start the work and keep you updated in your portal: "}${env.SITE_URL || "https://nextgenca.co.uk"}/portal\n\nKind regards,\nNextGen Chartered Accountant`);
  }
  return json({ ok: true });
}

// ---------- quotes ----------
async function sendQuoteEmail(env, q, token) {
  const site = env.SITE_URL || "https://nextgenca.co.uk";
  const until = new Date(q.valid_until).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  await sendEmail(env, q.email, `Your quote from NextGen Chartered Accountant (${q.number})`,
    `Dear ${q.name},\n\nThank you for speaking with us. Here is your quote:\n\nService: ${q.service}${q.period ? " (" + q.period + ")" : ""}\nFee: ${gbp(q.fee_pence)} (NextGen is not VAT registered, so no VAT is added)\n${q.scope ? "\nWhat is included:\n" + q.scope + "\n" : ""}\nValid until: ${until}\n\nTo accept and get started, open this link:\n${site}/portal?quote=${token}\n\nIt takes a few minutes on your phone: accept the quote, check your ID, sign the engagement letter and pay. Then you can upload your documents securely.\n\nKind regards,\nNextGen Chartered Accountant`);
}

async function listQuotes(env, request) {
  await ensureQuoteTables(env); await expireQuotes(env);
  // one reminder to staff for quotes waiting 7+ days
  const week = new Date(Date.now() - 7 * 864e5).toISOString();
  const stale = await env.DB.prepare("SELECT * FROM quotes WHERE status IN ('sent','viewed') AND created_at < ? AND reminded_at IS NULL").bind(week).all();
  for (const q of stale.results) {
    await env.DB.prepare("UPDATE quotes SET reminded_at = ? WHERE id = ?").bind(nowIso(), q.id).run();
    await quoteEvent(env, q.id, "reminder_to_staff");
    if (env.NOTIFY_EMAIL) await sendEmail(env, env.NOTIFY_EMAIL, `Quote not accepted yet: ${q.number}`, `${q.name} <${q.email}> has not accepted quote ${q.number} (${q.service}, ${gbp(q.fee_pence)}) sent on ${q.created_at.slice(0, 10)}. You may want to follow up.`);
  }
  const st = new URL(request.url).searchParams.get("status") || "";
  const groups = { open: "('sent','viewed')", accepted: "('accepted')", closed: "('invoiced')", ended: "('expired','withdrawn','replaced','declined')" };
  const where = groups[st] ? `WHERE status IN ${groups[st]}` : "";
  const r = await env.DB.prepare(`SELECT id, number, email, name, company, service, fee_pence, status, valid_until, created_at, viewed_at, accepted_at, invoice_number, closed_at FROM quotes ${where} ORDER BY id DESC LIMIT 300`).all();
  return json({ items: r.results });
}

async function createQuote(env, request, s) {
  await ensureQuoteTables(env);
  const b = await body(request);
  const email = cleanEmail(b.email);
  const name = cleanText(b.name, 120);
  const service = cleanText(b.service, 120);
  const pence = parsePence(b.fee);
  if (!name) return bad("Enter the client's name.");
  if (!email) return bad("Enter a valid email.");
  if (!service) return bad("Choose the service.");
  if (!pence) return bad("Enter the fee, e.g. 150.");
  const days = Math.min(90, Math.max(1, Number(b.valid_days) || 30));
  const checklist = (Array.isArray(b.checklist) ? b.checklist : []).map(x => cleanText(x, 150)).filter(Boolean).slice(0, 30);
  // an open quote for the same email is replaced by the new one
  const old = await env.DB.prepare("SELECT id, number FROM quotes WHERE email = ? AND status IN ('sent','viewed','accepted')").bind(email).all();
  const token = randomToken(32);
  const number = await nextQuoteNumber(env);
  const now = nowIso();
  const c = await env.DB.prepare("SELECT id FROM clients WHERE email = ?").bind(email).first();
  const r = await env.DB.prepare(`INSERT INTO quotes (number, token_hash, email, name, company, phone, service, period, scope, checklist, fee_pence, status, valid_until, created_by, created_at, client_id) VALUES (?,?,?,?,?,?,?,?,?,?,?, 'sent', ?, ?, ?, ?)`)
    .bind(number, await hmac(env, "q:" + token), email, name, cleanText(b.company, 150) || null, cleanText(b.phone, 40) || null, service,
      cleanText(b.period, 80) || null, cleanText(b.scope, 3000) || null, JSON.stringify(checklist), pence,
      new Date(Date.now() + days * 864e5).toISOString(), s.email, now, c ? c.id : null).run();
  const id = r.meta.last_row_id;
  for (const o of old.results) {
    await env.DB.prepare("UPDATE quotes SET status = 'replaced', closed_at = ? WHERE id = ?").bind(now, o.id).run();
    await quoteEvent(env, o.id, "replaced", `by ${number}`);
  }
  await quoteEvent(env, id, "created", `${service} ${gbp(pence)} by ${s.email}`);
  const q = await env.DB.prepare("SELECT * FROM quotes WHERE id = ?").bind(id).first();
  await sendQuoteEmail(env, q, token);
  await quoteEvent(env, id, "emailed", email);
  await audit(env, request, s.email, "quote_created", `${number} ${email} ${service} ${gbp(pence)}`);
  return json({ ok: true, id, number });
}

async function getQuote(env, id) {
  await ensureQuoteTables(env); await expireQuotes(env);
  const q = await env.DB.prepare("SELECT * FROM quotes WHERE id = ?").bind(id).first();
  if (!q) return bad("Quote not found.", 404);
  delete q.token_hash;
  const ev = await env.DB.prepare("SELECT at, event, detail FROM quote_events WHERE quote_id = ? ORDER BY id").bind(id).all();
  let invoice = null;
  if (q.invoice_number) invoice = await env.DB.prepare("SELECT number, amount_pence, status, paid_at, paid_method FROM invoices WHERE number = ?").bind(q.invoice_number).first();
  return json({ quote: q, events: ev.results, invoice });
}

async function withdrawQuote(env, request, s, id) {
  const q = await env.DB.prepare("SELECT * FROM quotes WHERE id = ?").bind(id).first();
  if (!q) return bad("Quote not found.", 404);
  if (!["sent", "viewed", "accepted"].includes(q.status)) return bad("This quote is already closed.");
  await env.DB.prepare("UPDATE quotes SET status = 'withdrawn', closed_at = ? WHERE id = ?").bind(nowIso(), id).run();
  await quoteEvent(env, id, "withdrawn", s.email);
  await audit(env, request, s.email, "quote_withdrawn", q.number);
  return json({ ok: true });
}

// Sends the quote email again with a fresh link (the old link stops working).
async function resendQuote(env, request, s, id) {
  const q = await env.DB.prepare("SELECT * FROM quotes WHERE id = ?").bind(id).first();
  if (!q) return bad("Quote not found.", 404);
  if (!["sent", "viewed"].includes(q.status)) return bad("Only quotes that are not yet accepted can be re-sent.");
  const token = randomToken(32);
  await env.DB.prepare("UPDATE quotes SET token_hash = ? WHERE id = ?").bind(await hmac(env, "q:" + token), id).run();
  await sendQuoteEmail(env, q, token);
  await quoteEvent(env, id, "emailed_again", s.email);
  return json({ ok: true });
}
