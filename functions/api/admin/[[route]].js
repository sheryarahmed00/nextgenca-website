// NextGen staff API: /api/admin/*  (only emails listed in ADMIN_EMAILS can use it)
import {
  json, bad, ensureSchema, sameOrigin, cleanEmail, cleanText, cleanDate, getSession, audit,
  checkUpload, sniffOk, downloadResponse, nowIso, randomToken, sendEmail,
  SERVICES, SERVICE_STATUSES, ORDER_STATUSES,
} from "../../_shared/portal.js";

const PORTAL_URL = "https://nextgenca.co.uk/portal";

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

    if (route === "meta" && m === "GET") return json({ services: SERVICES, serviceStatuses: SERVICE_STATUSES, orderStatuses: ORDER_STATUSES, email: s.email });
    if (route === "clients" && m === "GET") return listClients(env, request);
    if (route === "clients" && m === "POST") return createClient(env, request, s);
    if ((x = route.match(/^clients\/(\d+)$/))) {
      if (m === "GET") return getClient(env, Number(x[1]));
      if (m === "PUT") return updateClient(env, request, s, Number(x[1]));
    }
    if ((x = route.match(/^clients\/(\d+)\/services$/)) && m === "POST") return saveService(env, request, s, Number(x[1]), null);
    if ((x = route.match(/^services\/(\d+)$/))) {
      if (m === "PUT") return saveService(env, request, s, null, Number(x[1]));
      if (m === "DELETE") return deleteService(env, request, s, Number(x[1]));
    }
    if ((x = route.match(/^clients\/(\d+)\/documents$/)) && m === "POST") return uploadDoc(env, request, s, Number(x[1]));
    if ((x = route.match(/^documents\/(\d+)$/)) && m === "DELETE") return deleteDoc(env, request, s, Number(x[1]));
    if ((x = route.match(/^documents\/(\d+)\/download$/)) && m === "GET") return downloadDoc(env, request, s, Number(x[1]));
    if (route === "orders" && m === "GET") return listOrders(env, request);
    if ((x = route.match(/^orders\/(\d+)$/)) && m === "PUT") return updateOrder(env, request, s, Number(x[1]));
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
      `Dear ${name},\n\nYour NextGen Chartered Accountant client portal is ready. You can see the work we have done for you, download your documents, upload records and order new services.\n\nLog in here: ${PORTAL_URL}\nEnter this email address (${email}) and we will email you a one-time login code. There is no password to remember.\n\nKind regards,\nNextGen Chartered Accountant`);
  }
  return json({ ok: true, id: r.meta.last_row_id });
}

async function getClient(env, id) {
  const [c, sv, d, o] = await env.DB.batch([
    env.DB.prepare("SELECT * FROM clients WHERE id = ?").bind(id),
    env.DB.prepare("SELECT * FROM services WHERE client_id = ? ORDER BY COALESCE(completed_date, start_date, created_at) DESC, id DESC").bind(id),
    env.DB.prepare("SELECT id, service_id, title, filename, size, uploaded_by, created_at FROM documents WHERE client_id = ? ORDER BY id DESC").bind(id),
    env.DB.prepare("SELECT * FROM orders WHERE client_id = ? ORDER BY id DESC").bind(id),
  ]);
  if (!c.results[0]) return bad("Client not found.", 404);
  return json({ client: c.results[0], services: sv.results, documents: d.results, orders: o.results });
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
  if (!env.DOCS) throw new Error("R2 binding DOCS missing");
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
  const key = `clients/${clientId}/${randomToken(16)}.${chk.ext}`;
  await env.DOCS.put(key, file.stream(), { httpMetadata: { contentType: chk.type } });
  const r = await env.DB.prepare("INSERT INTO documents (client_id, service_id, title, filename, r2_key, size, content_type, uploaded_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'firm', ?)")
    .bind(clientId, serviceId, title, chk.name, key, file.size, chk.type, nowIso()).run();
  await audit(env, request, s.email, "firm_upload", `#${r.meta.last_row_id} client#${clientId} ${chk.name}`);
  if (form.get("notify") === "1" && c.active) {
    await sendEmail(env, c.email, "A new document is ready in your NextGen portal",
      `Dear ${c.name},\n\nA new document "${title}" has been added to your NextGen client portal.\n\nLog in to download it: ${PORTAL_URL}\n\nFor your security we never attach your documents to emails.\n\nKind regards,\nNextGen Chartered Accountant`);
  }
  return json({ ok: true, id: r.meta.last_row_id });
}

async function deleteDoc(env, request, s, id) {
  const d = await env.DB.prepare("SELECT * FROM documents WHERE id = ?").bind(id).first();
  if (!d) return bad("Not found.", 404);
  await env.DOCS.delete(d.r2_key);
  await env.DB.prepare("DELETE FROM documents WHERE id = ?").bind(id).run();
  await audit(env, request, s.email, "document_deleted", `#${id} client#${d.client_id} ${d.filename}`);
  return json({ ok: true });
}

async function downloadDoc(env, request, s, id) {
  const d = await env.DB.prepare("SELECT * FROM documents WHERE id = ?").bind(id).first();
  if (!d) return bad("Not found.", 404);
  const obj = await env.DOCS.get(d.r2_key);
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
      `Dear ${o.client_name},\n\nYour order #${id} (${o.service}) is now: ${status}.${note ? "\n\nNote from NextGen: " + note : ""}\n\nSee the details in your portal: ${PORTAL_URL}\n\nKind regards,\nNextGen Chartered Accountant`);
  }
  return json({ ok: true });
}
