// Client portal API: /api/portal/*
// Login is by a one-time 6-digit code emailed to an address NextGen has registered. No passwords are stored.
import {
  json, bad, ensureSchema, sameOrigin, cleanEmail, cleanText, clientIp, isAdminEmail, rateLimit, audit,
  randomCode, hmac, safeEqual, createSession, getSession, destroySession, sessionCookie, sendEmail,
  checkUpload, sniffOk, downloadResponse, nowIso, getSettings, storeUpload, gbp,
  SERVICES, OTP_TTL_MS, OTP_MAX_ATTEMPTS, SESSION_MAX_MS, files,
} from "../../_shared/portal.js";
import { stripePost } from "../../_shared/stripe.js";
import { diditPing, diditState, diditOn, diditStart, diditDecision, diditApply, ensureKycTable, ensureQuoteTables, quoteEvent, expireQuotes, invoiceFromQuote } from "../../_shared/autoflow.js";

const GENERIC_SENT = { ok: true, message: "If this email is registered with NextGen and has no password set yet, a 6-digit code is on its way (it expires in 10 minutes). If you have already set a password, log in with your password and authenticator code instead." };

export async function onRequest(context) {
  const { request, env, params } = context;
  try {
    await ensureSchema(env);
    if (!sameOrigin(request)) return bad("Request blocked.", 403);
    const route = (params.route || []).join("/");
    const m = request.method;

    if (route === "login/request" && m === "POST") return await loginRequest(env, request);
    if (route === "login/verify" && m === "POST") return await loginVerify(env, request);
    if (route === "logout" && m === "POST") {
      await destroySession(env, request);
      return json({ ok: true }, 200, { "set-cookie": sessionCookie("", 0) });
    }
    if (route === "services-list" && m === "GET") return json({ services: SERVICES });
    if (route === "config" && m === "GET" && new URL(request.url).searchParams.get("check") === "1")
      return json({ idCheck: (await rateLimit(env, "didit-ping", 10, 60 * 60 * 1000)) ? await diditPing(env) : "try_later" });
    if (route === "config" && m === "GET") return json({ turnstileSiteKey: env.TURNSTILE_SITE_KEY || "", idCheck: diditState(env) });
    if (route === "signup" && m === "POST") return await signup(env, request);
    let qm;
    if ((qm = route.match(/^quote\/([a-f0-9]{64})$/)) && m === "GET") return await viewQuote(env, request, qm[1]);
    if ((qm = route.match(/^quote\/([a-f0-9]{64})\/accept$/)) && m === "POST") return await acceptQuote(env, request, qm[1]);

    const s = await getSession(env, request);
    if (!s) return bad("Please log in.", 401);
    if (route === "me" && m === "GET") return json({ email: s.email, role: s.role });
    if (s.role !== "client") return bad("This page is for clients. Use the admin page.", 403);

    if (route === "dashboard" && m === "GET") return await dashboard(env, s);
    if (route === "kyc" && m === "POST") return await kyc(env, request, s);
    if (route === "kyc/start" && m === "POST") return await kycStart(env, request, s);
    if (route === "kyc/sync" && m === "POST") return await kycSync(env, request, s);
    if (route === "agreement/sign" && m === "POST") return await signAgreement(env, request, s);
    const pn = route.match(/^invoices\/(\d+)\/paid-notice$/);
    if (pn && m === "POST") return await paidNotice(env, request, s, Number(pn[1]));
    const pp = route.match(/^invoices\/(\d+)\/proof$/);
    if (pp && m === "POST") return await paymentProof(env, request, s, Number(pp[1]));
    const co = route.match(/^invoices\/(\d+)\/checkout$/);
    if (co && m === "POST") return await checkout(env, request, s, Number(co[1]));
    const st = await env.DB.prepare("SELECT stage FROM clients WHERE id = ?").bind(s.client_id).first();
    if (!st || st.stage !== "active") return bad("Please finish the steps above first.", 403);
    if (route === "orders" && m === "POST") return await placeOrder(env, request, s);
    if (route === "upload" && m === "POST") return await upload(env, request, s);
    const dl = route.match(/^documents\/(\d+)\/download$/);
    if (dl && m === "GET") return await download(env, request, s, Number(dl[1]));
    return bad("Not found.", 404);
  } catch (e) {
    console.log("portal error", e && e.stack || e);
    return bad("Something went wrong. Please try again.", 500);
  }
}

async function body(request) {
  try { return await request.json(); } catch { return {}; }
}

async function loginRequest(env, request, knownEmail) {
  const email = knownEmail || cleanEmail((await body(request)).email);
  if (!email) return bad("Please enter a valid email address.");
  const ip = clientIp(request);
  if (!(await rateLimit(env, "ip-req:" + ip, 10, 60 * 60 * 1000))) return bad("Too many attempts. Please try again in an hour.", 429);
  if (!(await rateLimit(env, "em-req:" + email, 3, 15 * 60 * 1000))) return bad("Too many codes requested. Please wait 15 minutes.", 429);

  let allowed = isAdminEmail(env, email);
  // Staff who have set a username and password log in at /staff-login, so no email code is sent
  if (allowed) {
    let hasPassword = null;
    try { hasPassword = await env.DB.prepare("SELECT username FROM staff_logins WHERE email = ?").bind(email).first(); } catch (e) {}
    if (hasPassword) return bad("Staff log in with username and password at nextgenca.co.uk/staff-login (no email code needed).", 400);
  }
  if (!allowed) {
    const c = await env.DB.prepare("SELECT id FROM clients WHERE email = ? AND active = 1").bind(email).first();
    allowed = !!c;
  }
  if (allowed && !isAdminEmail(env, email)) {
    // clients who set a password + authenticator log in with those; no email code is sent
    let secured = null;
    try { secured = await env.DB.prepare("SELECT a.enabled FROM client_auth a JOIN clients c ON c.id = a.client_id WHERE c.email = ? AND a.enabled = 1").bind(email).first(); } catch (e) {}
    if (secured) { await audit(env, request, email, "login_code_skipped_has_password"); return json(GENERIC_SENT); }
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
  const [client, services, documents, orders, engagements, invoices, checklist] = await env.DB.batch([
    env.DB.prepare("SELECT name, company, email, phone, stage, wanted_service, reject_reason FROM clients WHERE id = ?").bind(id),
    env.DB.prepare("SELECT id, service, period, notes, status, start_date, completed_date, fee FROM services WHERE client_id = ? ORDER BY COALESCE(completed_date, start_date, created_at) DESC, id DESC").bind(id),
    env.DB.prepare("SELECT id, service_id, title, category, filename, size, uploaded_by, created_at FROM documents WHERE client_id = ? ORDER BY id DESC").bind(id),
    env.DB.prepare("SELECT id, service, details, status, firm_note, created_at, updated_at FROM orders WHERE client_id = ? ORDER BY id DESC").bind(id),
    env.DB.prepare("SELECT id, service, period, fee_pence, letter_text, status, signed_name, signed_at, created_at FROM engagements WHERE client_id = ? ORDER BY id DESC").bind(id),
    env.DB.prepare("SELECT id, number, engagement_id, description, amount_pence, status, client_says_paid_at, paid_at, created_at FROM invoices WHERE client_id = ? ORDER BY id DESC").bind(id),
    env.DB.prepare("SELECT id, engagement_id, label, document_id, done_at FROM checklist WHERE client_id = ? ORDER BY id").bind(id),
  ]);
  const inv = invoices.results;
  // A client who uploaded proof of payment can carry on to the documents step while we check the bank.
  const proofTitles = new Set(documents.results.filter(d => d.category === "payment_proof").map(d => d.title));
  for (const i of inv) i.proof = proofTitles.has("Proof of payment " + i.number);
  const paidEng = new Set(inv.filter(i => i.status === "paid" || (i.status === "unpaid" && i.proof)).map(i => i.engagement_id));
  let bank = null;
  if (inv.some(i => i.status === "unpaid")) {
    const st = await getSettings(env);
    bank = { bank_name: st.bank_name, account_name: st.account_name, sort_code: st.sort_code, account_number: st.account_number, pay_link: st.pay_link, dd_link: st.dd_link, stripe_card: !!env.STRIPE_SECRET_KEY, stripe_dd: !!env.STRIPE_SECRET_KEY && env.STRIPE_BACS === "1" };
  }
  return json({
    client: client.results[0], services: services.results, documents: documents.results.filter(d => !d.category.startsWith("kyc")),
    kycCount: documents.results.filter(d => d.category.startsWith("kyc")).length,
    orders: orders.results, engagements: engagements.results, invoices: inv,
    checklist: checklist.results.filter(c => !c.engagement_id || paidEng.has(c.engagement_id)),
    bank, serviceList: SERVICES, kycAuto: diditOn(env),
  });
}

async function signup(env, request) {
  const b = await body(request);
  const email = cleanEmail(b.email);
  const name = cleanText(b.name, 120);
  const phone = cleanText(b.phone, 40);
  const service = cleanText(b.service, 120);
  if (!name || name.length < 2) return bad("Please enter your full name.");
  if (!email) return bad("Please enter a valid email address.");
  if (!/^[+\d][\d\s()-]{7,}$/.test(phone)) return bad("Please enter your mobile number.");
  if (!SERVICES.includes(service)) return bad("Please choose the service you need.");
  if (!b.consent) return bad("Please tick the box to agree to our privacy notice.");
  const ip = clientIp(request);
  if (!(await rateLimit(env, "ip-signup:" + ip, 5, 60 * 60 * 1000))) return bad("Too many sign-ups from this connection. Please try later.", 429);
  if (env.TURNSTILE_SECRET) {
    const fd = new FormData(); fd.append("secret", env.TURNSTILE_SECRET); fd.append("response", String(b.turnstile || "")); fd.append("remoteip", ip);
    const v = await (await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: fd })).json();
    if (!v.success) return bad("Please complete the security check.");
  }
  const existing = await env.DB.prepare("SELECT id FROM clients WHERE email = ?").bind(email).first();
  if (!existing && !isAdminEmail(env, email)) {
    await env.DB.prepare("INSERT INTO clients (email, name, company, phone, active, stage, wanted_service, signup_note, created_at) VALUES (?, ?, ?, ?, 1, 'kyc', ?, ?, ?)")
      .bind(email, name, cleanText(b.company, 150) || null, phone, service, cleanText(b.note, 1000) || null, nowIso()).run();
    await audit(env, request, email, "signup", service);
    if (env.NOTIFY_EMAIL) await sendEmail(env, env.NOTIFY_EMAIL, `New portal sign-up: ${name}`, `${name} <${email}>, ${phone}\nService: ${service}\n\nThey will now upload ID. Review at ${env.SITE_URL || "https://nextgenca.co.uk"}/portal-admin`);
  }
  // Same next step for new and existing emails: a login code (only sent to active accounts)
  return loginRequest(env, request, email);
}

async function kyc(env, request, s) {
  files(env);
  const c = await env.DB.prepare("SELECT * FROM clients WHERE id = ?").bind(s.client_id).first();
  if (c.stage !== "kyc") return bad("Your ID has already been received.");
  if (!(await rateLimit(env, "kyc:" + s.client_id, 10, 24 * 60 * 60 * 1000))) return bad("Too many uploads today.", 429);
  const form = await request.formData();
  const kycFiles = [["id_file", "kyc_id", "Photo ID"], ["address_file", "kyc_address", "Proof of address"]];
  const checked = [];
  for (const [field, cat, title] of kycFiles) {
    const f = form.get(field);
    const chk = checkUpload(f);
    if (chk.error) return bad(title + ": " + chk.error);
    if (!(await sniffOk(f, chk.ext))) return bad(title + ": this file does not look like a real photo or PDF.");
    checked.push({ f, chk, cat, title });
  }
  for (const x of checked) await storeUpload(env, request, { clientId: s.client_id, file: x.f, chk: x.chk, title: x.title, category: x.cat, by: "client" });
  await env.DB.prepare("UPDATE clients SET stage = 'review' WHERE id = ?").bind(s.client_id).run();
  await audit(env, request, s.email, "kyc_submitted");
  if (env.NOTIFY_EMAIL) await sendEmail(env, env.NOTIFY_EMAIL, `ID ready to check: ${c.name}`, `${c.name} <${c.email}> uploaded photo ID and proof of address for "${c.wanted_service}".\n\nCheck and approve: ${env.SITE_URL || "https://nextgenca.co.uk"}/portal-admin`);
  return json({ ok: true });
}

async function signAgreement(env, request, s) {
  const b = await body(request);
  const e = await env.DB.prepare("SELECT * FROM engagements WHERE id = ? AND client_id = ?").bind(Number(b.engagement_id), s.client_id).first();
  if (!e) return bad("Agreement not found.", 404);
  if (e.status !== "sent") return bad("This agreement is already signed.");
  const name = cleanText(b.name, 120);
  if (name.length < 3) return bad("Type your full name to sign.");
  if (!b.agree) return bad("Please tick to confirm you agree.");
  await env.DB.prepare("UPDATE engagements SET status = 'signed', signed_name = ?, signed_at = ?, signed_ip = ?, signed_ua = ? WHERE id = ?")
    .bind(name, nowIso(), clientIp(request), cleanText(request.headers.get("user-agent"), 200), e.id).run();
  await audit(env, request, s.email, "agreement_signed", `#${e.id} ${e.service} by "${name}" hash=${e.letter_hash.slice(0, 16)}`);
  if (env.NOTIFY_EMAIL) await sendEmail(env, env.NOTIFY_EMAIL, `Agreement signed: ${e.service}`, `${s.email} signed engagement #${e.id} (${e.service}) as "${name}".`);
  return json({ ok: true });
}

async function paidNotice(env, request, s, id) {
  const inv = await env.DB.prepare("SELECT * FROM invoices WHERE id = ? AND client_id = ?").bind(id, s.client_id).first();
  if (!inv || inv.status !== "unpaid") return bad("Invoice not found.", 404);
  const e = inv.engagement_id ? await env.DB.prepare("SELECT status FROM engagements WHERE id = ?").bind(inv.engagement_id).first() : null;
  if (e && e.status !== "signed") return bad("Please sign the agreement first.");
  await env.DB.prepare("UPDATE invoices SET client_says_paid_at = ? WHERE id = ?").bind(nowIso(), id).run();
  await audit(env, request, s.email, "client_says_paid", inv.number);
  if (env.NOTIFY_EMAIL) await sendEmail(env, env.NOTIFY_EMAIL, `Client says paid: ${inv.number} (${gbp(inv.amount_pence)})`, `${s.email} says they have paid invoice ${inv.number} for ${gbp(inv.amount_pence)}. Check the bank and mark it paid: ${env.SITE_URL || "https://nextgenca.co.uk"}/portal-admin`);
  return json({ ok: true });
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
      `Client: ${c.name}${c.company ? " (" + c.company + ")" : ""} <${s.email}>\nService: ${service}\n\n${details}\n\nOpen the admin page: ${env.SITE_URL || "https://nextgenca.co.uk"}/portal-admin`);
  }
  return json({ ok: true, id: r.meta.last_row_id });
}

async function upload(env, request, s) {
  files(env);
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
  const docId = await storeUpload(env, request, { clientId: s.client_id, file, chk, title, serviceId, by: "client" });
  const itemId = Number(form.get("checklist_id")) || null;
  if (itemId) await env.DB.prepare("UPDATE checklist SET document_id = ?, done_at = ? WHERE id = ? AND client_id = ?").bind(docId, nowIso(), itemId, s.client_id).run();
  await audit(env, request, s.email, "client_upload", `#${docId} ${chk.name}`);
  if (env.NOTIFY_EMAIL) await sendEmail(env, env.NOTIFY_EMAIL, `Client uploaded a document: ${title}`,
    `${s.email} uploaded "${chk.name}" to the client portal.\n\n${env.SITE_URL || "https://nextgenca.co.uk"}/portal-admin`);
  return json({ ok: true });
}

async function download(env, request, s, id) {
  // The client_id check is what stops one client opening another client's file.
  const d = await env.DB.prepare("SELECT * FROM documents WHERE id = ? AND client_id = ?").bind(id, s.client_id).first();
  if (!d) return bad("Not found.", 404);
  const obj = await files(env).get(d.r2_key);
  if (!obj) return bad("File missing. Please contact us.", 404);
  await audit(env, request, s.email, "client_download", `#${id} ${d.filename}`);
  return downloadResponse(obj, d.filename, d.content_type);
}

// Starts a Stripe Checkout payment for one invoice. Amount comes from our database, never from the browser.
async function checkout(env, request, s, id) {
  if (!env.STRIPE_SECRET_KEY) return bad("Card payments are not switched on yet. Please pay by bank transfer.");
  if (!(await rateLimit(env, "checkout:" + s.client_id, 20, 60 * 60 * 1000))) return bad("Too many attempts. Please try again later.", 429);
  const inv = await env.DB.prepare("SELECT * FROM invoices WHERE id = ? AND client_id = ?").bind(id, s.client_id).first();
  if (!inv || inv.status !== "unpaid") return bad("This invoice is not open for payment.", 404);
  const e = inv.engagement_id ? await env.DB.prepare("SELECT status FROM engagements WHERE id = ?").bind(inv.engagement_id).first() : null;
  if (e && e.status !== "signed") return bad("Please sign the agreement first.");
  const kind = (await body(request)).kind === "dd" ? "dd" : "card";
  if (kind === "dd" && env.STRIPE_BACS !== "1") return bad("Direct Debit is not available yet.");
  const origin = new URL(request.url).origin;
  const params = {
    mode: "payment",
    customer_email: s.email,
    client_reference_id: String(inv.id),
    payment_method_types: kind === "dd" ? ["bacs_debit"] : ["card"],
    line_items: [{ quantity: 1, price_data: { currency: "gbp", unit_amount: inv.amount_pence, product_data: { name: `${inv.number}: ${inv.description}`.slice(0, 250) } } }],
    metadata: { invoice_id: String(inv.id), invoice_number: inv.number },
    payment_intent_data: { description: `NextGen invoice ${inv.number}`, metadata: { invoice_id: String(inv.id), invoice_number: inv.number } },
    success_url: `${origin}/portal?paid=${inv.id}`,
    cancel_url: `${origin}/portal`,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
  };
  if (kind === "card") params.payment_method_options = { card: { request_three_d_secure: "automatic" } };
  const session = await stripePost(env, "checkout/sessions", params);
  await audit(env, request, s.email, "stripe_checkout_started", `${inv.number} ${kind} ${session.id}`);
  return json({ url: session.url });
}

// ---------- automatic ID check (Didit) ----------
async function kycStart(env, request, s) {
  if (!diditOn(env)) return bad("Automatic ID check is not available. Please upload photos instead.");
  if (!(await rateLimit(env, "kycstart:" + s.client_id, 6, 24 * 60 * 60 * 1000))) return bad("Too many attempts today. Please upload photos instead.", 429);
  const c = await env.DB.prepare("SELECT * FROM clients WHERE id = ?").bind(s.client_id).first();
  if (c.stage !== "kyc") return bad("Your ID has already been received.");
  let url;
  try { url = await diditStart(env, c, new URL(request.url).origin); }
  catch (e) {
    await audit(env, request, s.email, "kyc_auto_failed", String(e && e.message || e).slice(0, 400));
    return bad("The automatic ID check could not start just now. Please try again in a few minutes, or use 'Upload photos' below.", 400);
  }
  await audit(env, request, s.email, "kyc_auto_started", "didit");
  return json({ url });
}
// Called when the client returns from Didit: asks Didit for the result in case the webhook has not arrived yet.
async function kycSync(env, request, s) {
  if (!diditOn(env)) return json({ stage: null });
  await ensureKycTable(env);
  const k = await env.DB.prepare("SELECT * FROM kyc_checks WHERE client_id = ? ORDER BY id DESC LIMIT 1").bind(s.client_id).first();
  if (k) {
    const d = await diditDecision(env, k.session_id);
    if (d && d.status) await diditApply(env, request, k.session_id, d.status, d, "didit-sync");
  }
  const c = await env.DB.prepare("SELECT stage FROM clients WHERE id = ?").bind(s.client_id).first();
  return json({ stage: c.stage, check: k ? (await env.DB.prepare("SELECT status FROM kyc_checks WHERE id = ?").bind(k.id).first()).status : null });
}

// ---------- quotes (link from the quote email; no login needed to view) ----------
async function findQuote(env, token) {
  await ensureQuoteTables(env); await expireQuotes(env);
  return env.DB.prepare("SELECT * FROM quotes WHERE token_hash = ?").bind(await hmac(env, "q:" + token)).first();
}
function publicQuote(q) {
  return { number: q.number, name: q.name, email: q.email, service: q.service, period: q.period, scope: q.scope,
    fee: gbp(q.fee_pence), status: q.status, valid_until: q.valid_until };
}
async function viewQuote(env, request, token) {
  if (!(await rateLimit(env, "qview:" + clientIp(request), 60, 60 * 60 * 1000))) return bad("Too many requests.", 429);
  const q = await findQuote(env, token);
  if (!q) return bad("This quote link is not valid. Please ask us for a new one.", 404);
  if (q.status === "sent") {
    await env.DB.prepare("UPDATE quotes SET status = 'viewed', viewed_at = ? WHERE id = ? AND status = 'sent'").bind(nowIso(), q.id).run();
    await quoteEvent(env, q.id, "viewed", clientIp(request));
    q.status = "viewed";
  }
  return json({ quote: publicQuote(q) });
}
async function acceptQuote(env, request, token) {
  if (!(await rateLimit(env, "qaccept:" + clientIp(request), 10, 60 * 60 * 1000))) return bad("Too many attempts. Please try later.", 429);
  const b = await body(request);
  if (!b.consent) return bad("Please tick the box to agree to our privacy notice.");
  const q = await findQuote(env, token);
  if (!q) return bad("This quote link is not valid. Please ask us for a new one.", 404);
  if (!["sent", "viewed", "accepted"].includes(q.status)) {
    const why = { expired: "This quote has expired.", withdrawn: "This quote was withdrawn.", replaced: "A newer quote has been sent to you. Please use the latest email.", invoiced: "This quote has already been accepted. Please log in to your portal." };
    return bad((why[q.status] || "This quote is no longer open.") + " Contact us if you need help.", 410);
  }
  const ip = clientIp(request);
  let c = await env.DB.prepare("SELECT * FROM clients WHERE email = ?").bind(q.email).first();
  if (c && (!c.active || c.stage === "rejected")) return bad("Please contact us to continue.", 403);
  if (!c) {
    await env.DB.prepare("INSERT INTO clients (email, name, company, phone, active, stage, wanted_service, signup_note, created_at) VALUES (?, ?, ?, ?, 1, 'kyc', ?, ?, ?)")
      .bind(q.email, q.name, q.company, q.phone, q.service, `Accepted quote ${q.number}`, nowIso()).run();
    c = await env.DB.prepare("SELECT * FROM clients WHERE email = ?").bind(q.email).first();
    await audit(env, request, q.email, "signup_from_quote", q.number);
  }
  if (q.status !== "accepted") {
    await env.DB.prepare("UPDATE quotes SET status = 'accepted', accepted_at = ?, accepted_ip = ?, client_id = ? WHERE id = ?").bind(nowIso(), ip, c.id, q.id).run();
    await quoteEvent(env, q.id, "accepted", `${ip} ${cleanText(request.headers.get("user-agent"), 120)}`);
    await audit(env, request, q.email, "quote_accepted", q.number);
    // Existing, already verified client: no ID check needed, issue the agreement + invoice straight away
    if (c.stage === "active") {
      const fresh = await env.DB.prepare("SELECT * FROM quotes WHERE id = ?").bind(q.id).first();
      await invoiceFromQuote(env, request, c, fresh, "client-accepted-quote", false);
    } else if (env.NOTIFY_EMAIL) {
      await sendEmail(env, env.NOTIFY_EMAIL, `Quote accepted: ${q.number}`, `${q.name} <${q.email}> accepted quote ${q.number} (${q.service}, ${gbp(q.fee_pence)}). The agreement and invoice will be sent automatically once their ID check passes.`);
    }
  }
  // Next: log in. Clients with a password + authenticator use those; others get a one-time code by email.
  let secured = null;
  try { secured = await env.DB.prepare("SELECT enabled FROM client_auth WHERE client_id = ? AND enabled = 1").bind(c.id).first(); } catch (e) {}
  if (secured) return json({ ok: true, email: q.email, next: "password", message: "Thank you, your quote is accepted. Log in with your password and authenticator code to continue." });
  const res = await loginRequest(env, request, q.email);
  if (res.status !== 200) return res;
  return json({ ok: true, email: q.email, message: "Thank you. We have emailed a 6-digit code to " + q.email + " to open your portal. If you already set a password, log in with it instead." });
}

// Client says they already paid and attaches a screenshot or PDF of the payment.
async function paymentProof(env, request, s, id) {
  files(env);
  if (!(await rateLimit(env, "proof:" + s.client_id, 10, 24 * 60 * 60 * 1000))) return bad("Too many uploads today.", 429);
  const inv = await env.DB.prepare("SELECT * FROM invoices WHERE id = ? AND client_id = ?").bind(id, s.client_id).first();
  if (!inv || inv.status !== "unpaid") return bad("This invoice is not open.", 404);
  const e = inv.engagement_id ? await env.DB.prepare("SELECT status FROM engagements WHERE id = ?").bind(inv.engagement_id).first() : null;
  if (e && e.status !== "signed") return bad("Please sign the agreement first.");
  const form = await request.formData();
  const file = form.get("file");
  const chk = checkUpload(file);
  if (chk.error) return bad(chk.error);
  if (!(await sniffOk(file, chk.ext))) return bad("This file does not look like a real photo or PDF.");
  const docId = await storeUpload(env, request, { clientId: s.client_id, file, chk, title: "Proof of payment " + inv.number, category: "payment_proof", by: "client" });
  await env.DB.prepare("UPDATE invoices SET client_says_paid_at = COALESCE(client_says_paid_at, ?) WHERE id = ?").bind(nowIso(), id).run();
  await audit(env, request, s.email, "payment_proof_uploaded", `${inv.number} doc#${docId}`);
  if (env.NOTIFY_EMAIL) await sendEmail(env, env.NOTIFY_EMAIL, `Proof of payment: ${inv.number} (${gbp(inv.amount_pence)})`,
    `${s.email} uploaded proof of payment for ${inv.number} (${gbp(inv.amount_pence)}) and has moved on to uploading documents.\n\nCheck your bank and mark the invoice paid: ${env.SITE_URL || "https://nextgenca.co.uk"}/portal-admin`);
  return json({ ok: true });
}
