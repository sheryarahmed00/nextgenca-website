// Client portal API: /api/portal/*
// Login is by a one-time 6-digit code emailed to an address NextGen has registered. No passwords are stored.
import {
  json, bad, ensureSchema, sameOrigin, cleanEmail, cleanText, clientIp, isAdminEmail, rateLimit, audit,
  randomCode, hmac, safeEqual, createSession, getSession, destroySession, sessionCookie, sendEmail,
  checkUpload, sniffOk, downloadResponse, nowIso, randomToken,
  SERVICES, OTP_TTL_MS, OTP_MAX_ATTEMPTS, SESSION_MAX_MS,
} from "../../_shared/portal.js";

const GENERIC_SENT = { ok: true, message: "If this email is registered with NextGen, a 6-digit code is on its way. It expires in 10 minutes." };

export async function onRequest(context) {
  const { request, env, params } = context;
  try {
    await ensureSchema(env);
    if (!sameOrigin(request)) return bad("Request blocked.", 403);
    const route = (params.route || []).join("/");
    const m = request.method;

    if (route === "login/request" && m === "POST") return loginRequest(env, request);
    if (route === "login/verify" && m === "POST") return loginVerify(env, request);
    if (route === "logout" && m === "POST") {
      await destroySession(env, request);
      return json({ ok: true }, 200, { "set-cookie": sessionCookie("", 0) });
    }
    if (route === "services-list" && m === "GET") return json({ services: SERVICES });

    const s = await getSession(env, request);
    if (!s) return bad("Please log in.", 401);
    if (route === "me" && m === "GET") return json({ email: s.email, role: s.role });
    if (s.role !== "client") return bad("This page is for clients. Use the admin page.", 403);

    if (route === "dashboard" && m === "GET") return dashboard(env, s);
    if (route === "orders" && m === "POST") return placeOrder(env, request, s);
    if (route === "upload" && m === "POST") return upload(env, request, s);
    const dl = route.match(/^documents\/(\d+)\/download$/);
    if (dl && m === "GET") return download(env, request, s, Number(dl[1]));
    return bad("Not found.", 404);
  } catch (e) {
    console.log("portal error", e && e.stack || e);
    return bad("Something went wrong. Please try again.", 500);
  }
}

async function body(request) {
  try { return await request.json(); } catch { return {}; }
}

async function loginRequest(env, request) {
  const { email: raw } = await body(request);
  const email = cleanEmail(raw);
  if (!email) return bad("Please enter a valid email address.");
  const ip = clientIp(request);
  if (!(await rateLimit(env, "ip-req:" + ip, 10, 60 * 60 * 1000))) return bad("Too many attempts. Please try again in an hour.", 429);
  if (!(await rateLimit(env, "em-req:" + email, 3, 15 * 60 * 1000))) return bad("Too many codes requested. Please wait 15 minutes.", 429);

  let allowed = isAdminEmail(env, email);
  if (!allowed) {
    const c = await env.DB.prepare("SELECT id FROM clients WHERE email = ? AND active = 1").bind(email).first();
    allowed = !!c;
  }
  if (!allowed) {
    await audit(env, request, email, "login_code_unknown_email");
    return json(GENERIC_SENT); // same answer so nobody can test which emails are clients
  }
  const code = randomCode();
  const now = Date.now();
  await env.DB.batch([
    env.DB.prepare("UPDATE otps SET used = 1 WHERE email = ? AND used = 0").bind(email),
    env.DB.prepare("INSERT INTO otps (email, code_hash, expires_at, created_at) VALUES (?, ?, ?, ?)")
      .bind(email, await hmac(env, `o:${email}:${code}`), now + OTP_TTL_MS, now),
  ]);
  await sendEmail(env, email, `Your NextGen login code: ${code}`,
    `Your NextGen Chartered Accountant client portal login code is:\n\n${code}\n\nIt expires in 10 minutes and works once.\n\nIf you did not ask for this code, you can ignore this email. Nobody can log in without it.\n\nNextGen Chartered Accountant\nhttps://nextgenca.co.uk`);
  await audit(env, request, email, "login_code_sent");
  return json(GENERIC_SENT);
}

async function loginVerify(env, request) {
  const { email: raw, code: rawCode } = await body(request);
  const email = cleanEmail(raw);
  const code = String(rawCode || "").replace(/\D/g, "");
  if (!email || code.length !== 6) return bad("Enter the 6-digit code from your email.");
  const ip = clientIp(request);
  if (!(await rateLimit(env, "ip-ver:" + ip, 20, 15 * 60 * 1000))) return bad("Too many attempts. Please wait 15 minutes.", 429);

  const otp = await env.DB.prepare("SELECT * FROM otps WHERE email = ? AND used = 0 ORDER BY id DESC LIMIT 1").bind(email).first();
  const fail = async (msg) => { await audit(env, request, email, "login_failed", msg); return bad(msg, 401); };
  if (!otp || otp.expires_at < Date.now()) return fail("This code has expired. Please request a new one.");
  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    await env.DB.prepare("UPDATE otps SET used = 1 WHERE id = ?").bind(otp.id).run();
    return fail("Too many wrong codes. Please request a new one.");
  }
  await env.DB.prepare("UPDATE otps SET attempts = attempts + 1 WHERE id = ?").bind(otp.id).run();
  if (!safeEqual(await hmac(env, `o:${email}:${code}`), otp.code_hash)) return fail("That code is not right. Please check and try again.");
  await env.DB.prepare("UPDATE otps SET used = 1 WHERE id = ?").bind(otp.id).run();

  let role = "client", clientId = null;
  if (isAdminEmail(env, email)) role = "admin";
  else {
    const c = await env.DB.prepare("SELECT id FROM clients WHERE email = ? AND active = 1").bind(email).first();
    if (!c) return fail("This account is not active.");
    clientId = c.id;
  }
  const token = await createSession(env, request, email, role, clientId);
  await audit(env, request, email, "login_ok", role);
  return json({ ok: true, role }, 200, { "set-cookie": sessionCookie(token, Math.floor(SESSION_MAX_MS / 1000)) });
}

async function dashboard(env, s) {
  const id = s.client_id;
  const [client, services, documents, orders] = await env.DB.batch([
    env.DB.prepare("SELECT name, company, email, phone FROM clients WHERE id = ?").bind(id),
    env.DB.prepare("SELECT id, service, period, notes, status, start_date, completed_date, fee FROM services WHERE client_id = ? ORDER BY COALESCE(completed_date, start_date, created_at) DESC, id DESC").bind(id),
    env.DB.prepare("SELECT id, service_id, title, filename, size, uploaded_by, created_at FROM documents WHERE client_id = ? ORDER BY id DESC").bind(id),
    env.DB.prepare("SELECT id, service, details, status, firm_note, created_at, updated_at FROM orders WHERE client_id = ? ORDER BY id DESC").bind(id),
  ]);
  return json({ client: client.results[0], services: services.results, documents: documents.results, orders: orders.results, serviceList: SERVICES });
}

async function placeOrder(env, request, s) {
  if (!(await rateLimit(env, "order:" + s.client_id, 10, 24 * 60 * 60 * 1000))) return bad("You have placed a lot of orders today. Please message us instead.", 429);
  const b = await body(request);
  const service = cleanText(b.service, 120);
  const details = cleanText(b.details, 3000);
  if (!SERVICES.includes(service)) return bad("Please choose a service.");
  if (details.length < 5) return bad("Please tell us a little about what you need.");
  const now = nowIso();
  const r = await env.DB.prepare("INSERT INTO orders (client_id, service, details, status, created_at, updated_at) VALUES (?, ?, ?, 'New', ?, ?)")
    .bind(s.client_id, service, details, now, now).run();
  await audit(env, request, s.email, "order_placed", `#${r.meta.last_row_id} ${service}`);
  if (env.NOTIFY_EMAIL) {
    const c = await env.DB.prepare("SELECT name, company FROM clients WHERE id = ?").bind(s.client_id).first();
    await sendEmail(env, env.NOTIFY_EMAIL, `New portal order #${r.meta.last_row_id}: ${service}`,
      `Client: ${c.name}${c.company ? " (" + c.company + ")" : ""} <${s.email}>\nService: ${service}\n\n${details}\n\nOpen the admin page: https://nextgenca.co.uk/portal-admin`);
  }
  return json({ ok: true, id: r.meta.last_row_id });
}

async function upload(env, request, s) {
  if (!env.DOCS) throw new Error("R2 binding DOCS missing");
  if (!(await rateLimit(env, "up:" + s.client_id, 40, 24 * 60 * 60 * 1000))) return bad("Upload limit reached for today. Please email us the rest.", 429);
  const len = Number(request.headers.get("content-length") || 0);
  if (len > 21 * 1024 * 1024) return bad("Files must be 20 MB or smaller.", 413);
  const form = await request.formData();
  const file = form.get("file");
  const chk = checkUpload(file);
  if (chk.error) return bad(chk.error);
  if (!(await sniffOk(file, chk.ext))) return bad("This file does not look like a real " + chk.ext.toUpperCase() + " file.");
  const title = cleanText(form.get("title"), 120) || chk.name;
  let serviceId = Number(form.get("service_id")) || null;
  if (serviceId) {
    const own = await env.DB.prepare("SELECT id FROM services WHERE id = ? AND client_id = ?").bind(serviceId, s.client_id).first();
    if (!own) serviceId = null;
  }
  const key = `clients/${s.client_id}/${randomToken(16)}.${chk.ext}`;
  await env.DOCS.put(key, file.stream(), { httpMetadata: { contentType: chk.type } });
  const r = await env.DB.prepare("INSERT INTO documents (client_id, service_id, title, filename, r2_key, size, content_type, uploaded_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'client', ?)")
    .bind(s.client_id, serviceId, title, chk.name, key, file.size, chk.type, nowIso()).run();
  await audit(env, request, s.email, "client_upload", `#${r.meta.last_row_id} ${chk.name}`);
  if (env.NOTIFY_EMAIL) await sendEmail(env, env.NOTIFY_EMAIL, `Client uploaded a document: ${title}`,
    `${s.email} uploaded "${chk.name}" to the client portal.\n\nhttps://nextgenca.co.uk/portal-admin`);
  return json({ ok: true });
}

async function download(env, request, s, id) {
  // The client_id check is what stops one client opening another client's file.
  const d = await env.DB.prepare("SELECT * FROM documents WHERE id = ? AND client_id = ?").bind(id, s.client_id).first();
  if (!d) return bad("Not found.", 404);
  const obj = await env.DOCS.get(d.r2_key);
  if (!obj) return bad("File missing. Please contact us.", 404);
  await audit(env, request, s.email, "client_download", `#${id} ${d.filename}`);
  return downloadResponse(obj, d.filename, d.content_type);
}
