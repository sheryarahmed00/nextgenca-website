// Client password + authenticator-app login.
//   POST /api/portal-auth/login          { email, password, code }   -> client session
//   GET  /api/portal-auth/status                                       (client session) -> { enabled }
//   POST /api/portal-auth/setup/start                                  (client session) -> { secret, uri }
//   POST /api/portal-auth/setup/finish   { password, code }           (client session)
//   POST /api/portal-auth/reset          { email }                    (admin session) -> client must set up again
//   POST /api/portal-auth/forgot/request { email }                    -> emails a one-time reset code
//   POST /api/portal-auth/forgot/verify  { email, code }              -> clears password + authenticator, logs in to set them again
// First login is always by email code (proves the email). The client then sets a password and
// links an authenticator app; after that, email codes are no longer sent for that client.
import {
  json, bad, ensureSchema, sameOrigin, getSession, createSession, sessionCookie, audit,
  rateLimit, clientIp, cleanEmail, randomToken, safeEqual, nowIso, SESSION_MAX_MS,
  randomCode, hmac, sendEmail, OTP_TTL_MS, OTP_MAX_ATTEMPTS,
} from "../../_shared/portal.js";
import { base32Encode, checkTotp, sealSecret, openSecret, hashPassword, passwordProblem } from "../../_shared/totp.js";

let ready = false;
export async function ensureClientAuth(env) {
  if (ready) return;
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS client_auth (
    client_id INTEGER PRIMARY KEY, pass_hash TEXT, salt TEXT, totp_sealed TEXT, pending_sealed TEXT,
    enabled INTEGER NOT NULL DEFAULT 0, last_step INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`).run();
  ready = true;
}

const FAIL = "Email, password or code is not right.";

export async function onRequest({ request, env, params }) {
  try {
    await ensureSchema(env);
    await ensureClientAuth(env);
    if (!sameOrigin(request)) return bad("Request blocked.", 403);
    const route = (params.sub || []).join("/");
    const m = request.method;
    let b = {};
    if (m === "POST") { try { b = await request.json(); } catch {} }

    if (route === "login" && m === "POST") {
      const email = cleanEmail(b.email);
      const ip = clientIp(request);
      if (!(await rateLimit(env, "pa-ip:" + ip, 15, 15 * 60 * 1000)) ||
          !(await rateLimit(env, "pa-em:" + (email || "?"), 6, 15 * 60 * 1000))) {
        return bad("Too many attempts. Please wait 15 minutes.", 429);
      }
      const row = email ? await env.DB.prepare(
        "SELECT a.*, c.id AS cid, c.active FROM clients c JOIN client_auth a ON a.client_id = c.id WHERE c.email = ?").bind(email).first() : null;
      // always do the slow hash so a wrong email takes as long as a wrong password
      const h = await hashPassword(String(b.password || "").slice(0, 200), row && row.salt ? row.salt : "00".repeat(16));
      if (!row || !row.enabled || !row.active || !safeEqual(h, row.pass_hash)) {
        await audit(env, request, email || "?", "password_login_failed");
        return bad(FAIL, 401);
      }
      const step = await checkTotp(await openSecret(env, row.totp_sealed), b.code, row.last_step);
      if (!step) { await audit(env, request, email, "password_login_bad_code"); return bad(FAIL, 401); }
      await env.DB.prepare("UPDATE client_auth SET last_step = ?, updated_at = ? WHERE client_id = ?").bind(step, nowIso(), row.cid).run();
      const token = await createSession(env, request, email, "client", row.cid);
      await audit(env, request, email, "login_ok", "client (password + authenticator)");
      return json({ ok: true, role: "client" }, 200, { "set-cookie": sessionCookie(token, Math.floor(SESSION_MAX_MS / 1000)) });
    }

    // ----- forgot password / lost phone: prove the email again, then set up a new password + authenticator -----
    if (route === "forgot/request" && m === "POST") {
      const email = cleanEmail(b.email);
      if (!email) return bad("Please enter a valid email address.");
      if (!(await rateLimit(env, "fp-ip:" + clientIp(request), 6, 60 * 60 * 1000)) || !(await rateLimit(env, "fp-em:" + email, 3, 60 * 60 * 1000))) {
        return bad("Too many attempts. Please try again in an hour.", 429);
      }
      const generic = { ok: true, message: "If this email has a NextGen portal login, a 6-digit reset code is on its way. It expires in 10 minutes." };
      const c = await env.DB.prepare("SELECT c.id, c.name FROM clients c JOIN client_auth a ON a.client_id = c.id WHERE c.email = ? AND c.active = 1 AND a.enabled = 1").bind(email).first();
      if (!c) { await audit(env, request, email, "reset_code_unknown"); return json(generic); }
      const code = randomCode();
      const key = "reset:" + email;
      const now = Date.now();
      await env.DB.batch([
        env.DB.prepare("UPDATE otps SET used = 1 WHERE email = ? AND used = 0").bind(key),
        env.DB.prepare("INSERT INTO otps (email, code_hash, expires_at, created_at) VALUES (?, ?, ?, ?)").bind(key, await hmac(env, `r:${email}:${code}`), now + OTP_TTL_MS, now),
      ]);
      await sendEmail(env, email, `Reset your NextGen portal login: ${code}`,
        `Dear ${c.name},\n\nSomeone asked to reset the login for your NextGen client portal. Your reset code is:\n\n${code}\n\nIt expires in 10 minutes. After entering it you will choose a new password and link your authenticator app again.\n\nIf you did not ask for this, ignore this email and your login stays as it is. If it keeps happening, please tell us.\n\nNextGen Chartered Accountant`);
      await audit(env, request, email, "reset_code_sent");
      return json(generic);
    }
    if (route === "forgot/verify" && m === "POST") {
      const email = cleanEmail(b.email);
      const code = String(b.code || "").replace(/\D/g, "");
      if (!email || code.length !== 6) return bad("Enter the 6-digit code from your email.");
      if (!(await rateLimit(env, "fpv-ip:" + clientIp(request), 15, 15 * 60 * 1000))) return bad("Too many attempts. Please wait 15 minutes.", 429);
      const key = "reset:" + email;
      const otp = await env.DB.prepare("SELECT * FROM otps WHERE email = ? AND used = 0 ORDER BY id DESC LIMIT 1").bind(key).first();
      if (!otp || otp.expires_at < Date.now()) return bad("This code has expired. Please ask for a new one.", 401);
      if (otp.attempts >= OTP_MAX_ATTEMPTS) { await env.DB.prepare("UPDATE otps SET used = 1 WHERE id = ?").bind(otp.id).run(); return bad("Too many wrong codes. Please ask for a new one.", 401); }
      await env.DB.prepare("UPDATE otps SET attempts = attempts + 1 WHERE id = ?").bind(otp.id).run();
      if (!safeEqual(await hmac(env, `r:${email}:${code}`), otp.code_hash)) { await audit(env, request, email, "reset_code_wrong"); return bad("That code is not right.", 401); }
      await env.DB.prepare("UPDATE otps SET used = 1 WHERE id = ?").bind(otp.id).run();
      const c = await env.DB.prepare("SELECT id, name FROM clients WHERE email = ? AND active = 1").bind(email).first();
      if (!c) return bad("This account is not active.", 403);
      await env.DB.batch([
        env.DB.prepare("DELETE FROM client_auth WHERE client_id = ?").bind(c.id),
        env.DB.prepare("DELETE FROM sessions WHERE client_id = ?").bind(c.id),
      ]);
      const token = await createSession(env, request, email, "client", c.id);
      await audit(env, request, email, "client_login_reset_by_client");
      await sendEmail(env, email, "Your NextGen portal login was reset", `Dear ${c.name},\n\nYour client portal password and authenticator app were just reset, and you have been asked to set new ones. If this was not you, contact us straight away.\n\nNextGen Chartered Accountant`);
      if (env.NOTIFY_EMAIL) await sendEmail(env, env.NOTIFY_EMAIL, `Client reset their portal login: ${email}`, `${c.name} <${email}> reset their password and authenticator using an email code (IP ${clientIp(request)}).`);
      return json({ ok: true }, 200, { "set-cookie": sessionCookie(token, Math.floor(SESSION_MAX_MS / 1000)) });
    }

    const s = await getSession(env, request);
    if (!s) return bad("Please log in.", 401);

    if (route === "reset" && m === "POST") {
      if (s.role !== "admin") return bad("Not allowed.", 403);
      const email = cleanEmail(b.email);
      const c = email && await env.DB.prepare("SELECT id FROM clients WHERE email = ?").bind(email).first();
      if (!c) return bad("No client with that email.", 404);
      await env.DB.batch([
        env.DB.prepare("DELETE FROM client_auth WHERE client_id = ?").bind(c.id),
        env.DB.prepare("DELETE FROM sessions WHERE client_id = ?").bind(c.id),
      ]);
      await audit(env, request, s.email, "client_login_reset", email);
      return json({ ok: true });
    }

    if (s.role !== "client") return bad("Not allowed.", 403);
    const row = await env.DB.prepare("SELECT * FROM client_auth WHERE client_id = ?").bind(s.client_id).first();

    if (route === "status" && m === "GET") return json({ enabled: !!(row && row.enabled) });

    if (route === "setup/start" && m === "POST") {
      if (row && row.enabled) return bad("Your login is already set up.");
      const secret = crypto.getRandomValues(new Uint8Array(20));
      const sealed = await sealSecret(env, secret);
      const now = nowIso();
      await env.DB.prepare(`INSERT INTO client_auth (client_id, pending_sealed, enabled, created_at, updated_at) VALUES (?, ?, 0, ?, ?)
        ON CONFLICT(client_id) DO UPDATE SET pending_sealed = excluded.pending_sealed, updated_at = excluded.updated_at`)
        .bind(s.client_id, sealed, now, now).run();
      const b32 = base32Encode(secret);
      const label = encodeURIComponent("NextGen Chartered Accountant:" + s.email);
      return json({ secret: b32.replace(/(.{4})/g, "$1 ").trim(),
        uri: `otpauth://totp/${label}?secret=${b32}&issuer=${encodeURIComponent("NextGen Chartered Accountant")}&algorithm=SHA1&digits=6&period=30` });
    }

    if (route === "setup/finish" && m === "POST") {
      if (!row || !row.pending_sealed) return bad("Please start again.");
      if (row.enabled) return bad("Your login is already set up.");
      if (!(await rateLimit(env, "pa-setup:" + s.client_id, 10, 15 * 60 * 1000))) return bad("Too many attempts. Please wait 15 minutes.", 429);
      const problem = passwordProblem(b.password, s.email);
      if (problem) return bad(problem);
      const secret = await openSecret(env, row.pending_sealed);
      const step = await checkTotp(secret, b.code, 0);
      if (!step) return bad("That code is not right. Check the code in your authenticator app and try again.");
      const salt = randomToken(16);
      await env.DB.prepare(`UPDATE client_auth SET pass_hash = ?, salt = ?, totp_sealed = pending_sealed, pending_sealed = NULL,
        enabled = 1, last_step = ?, updated_at = ? WHERE client_id = ?`)
        .bind(await hashPassword(b.password, salt), salt, step, nowIso(), s.client_id).run();
      await audit(env, request, s.email, "client_login_setup");
      return json({ ok: true });
    }

    return bad("Not found.", 404);
  } catch (e) {
    console.log("portal-auth error", e && e.message);
    return bad("Server error.", 500);
  }
}
