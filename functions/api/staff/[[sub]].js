// Staff username + password login for the portal admin dashboard.
//   POST /api/staff/login      { username, password }          -> admin session cookie
//   GET  /api/staff/me                                          -> { username } for the logged-in admin
//   POST /api/staff/password   { username, password }          -> set/change own username + password
//                              (needs an admin session, so the very first password is set
//                               after one email-code login; nobody can pre-claim an account)
// Passwords are stored as PBKDF2-SHA256 hashes (100,000 rounds, random salt). Accounts only
// work while the linked email is still in ADMIN_EMAILS.
import {
  json, bad, ensureSchema, sameOrigin, getSession, createSession, sessionCookie, audit,
  rateLimit, clientIp, isAdminEmail, safeEqual, randomToken, nowIso, SESSION_MAX_MS,
} from "../../_shared/portal.js";

const ROUNDS = 100000;
let ready = false;
async function ensureStaff(env) {
  if (ready) return;
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS staff_logins (
    username TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, pass_hash TEXT NOT NULL, salt TEXT NOT NULL,
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`).run();
  // must_change = 1 -> next login is forced to pick a new password. Existing rows get 1 once, when the column is added.
  try { await env.DB.prepare("ALTER TABLE staff_logins ADD COLUMN must_change INTEGER NOT NULL DEFAULT 1").run(); } catch (e) {}
  ready = true;
}

async function hashPassword(password, saltHex) {
  const salt = new Uint8Array(saltHex.match(/../g).map(h => parseInt(h, 16)));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: ROUNDS }, key, 256);
  return [...new Uint8Array(bits)].map(b => b.toString(16).padStart(2, "0")).join("");
}

const cleanUser = v => String(v || "").trim().toLowerCase();
const USER_RE = /^[a-z][a-z0-9._-]{2,23}$/;

export async function onRequest({ request, env, params }) {
  try {
    await ensureSchema(env);
    await ensureStaff(env);
    if (!sameOrigin(request)) return bad("Request blocked.", 403);
    const route = (params.sub || []).join("/");
    const m = request.method;
    let b = {};
    if (m === "POST") { try { b = await request.json(); } catch {} }

    if (route === "login" && m === "POST") {
      const username = cleanUser(b.username);
      const password = String(b.password || "");
      const ip = clientIp(request);
      if (!(await rateLimit(env, "staff-ip:" + ip, 10, 15 * 60 * 1000)) ||
          !(await rateLimit(env, "staff-user:" + username.slice(0, 30), 8, 15 * 60 * 1000))) {
        return bad("Too many attempts. Please wait 15 minutes.", 429);
      }
      const fail = async () => { await audit(env, request, username || "?", "staff_login_failed"); return bad("Wrong username or password.", 401); };
      if (!USER_RE.test(username) || password.length < 1 || password.length > 200) return fail();
      const row = await env.DB.prepare("SELECT * FROM staff_logins WHERE username = ?").bind(username).first();
      // always hash, so a wrong username takes as long as a wrong password
      const h = await hashPassword(password, row ? row.salt : "00".repeat(16));
      if (!row || !safeEqual(h, row.pass_hash) || !isAdminEmail(env, row.email)) return fail();
      const token = await createSession(env, request, row.email, "admin", null);
      await audit(env, request, row.email, "login_ok", "admin (username " + username + ")");
      return json({ ok: true, role: "admin" }, 200, { "set-cookie": sessionCookie(token, Math.floor(SESSION_MAX_MS / 1000)) });
    }

    const s = await getSession(env, request);
    if (!s) return bad("Please log in.", 401);
    if (s.role !== "admin") return bad("Not allowed.", 403);

    if (route === "me" && m === "GET") {
      const row = await env.DB.prepare("SELECT username, must_change FROM staff_logins WHERE email = ?").bind(s.email).first();
      return json({ email: s.email, username: row ? row.username : null, mustChange: !row || !!row.must_change });
    }

    if (route === "password" && m === "POST") {
      const username = cleanUser(b.username);
      const password = String(b.password || "");
      if (!USER_RE.test(username)) return bad("Username: 3 to 24 letters or numbers, starting with a letter.");
      if (password.length < 10 || password.length > 200) return bad("Password must be at least 10 characters.");
      if (password.toLowerCase().includes(username)) return bad("Password must not contain the username.");
      const taken = await env.DB.prepare("SELECT email FROM staff_logins WHERE username = ?").bind(username).first();
      if (taken && taken.email !== s.email) return bad("That username is taken.");
      const old = await env.DB.prepare("SELECT pass_hash, salt FROM staff_logins WHERE email = ?").bind(s.email).first();
      if (old && safeEqual(await hashPassword(password, old.salt), old.pass_hash)) return bad("Please choose a new password, not the old one.");
      const salt = randomToken(16);
      const hash = await hashPassword(password, salt);
      const now = nowIso();
      await env.DB.batch([
        env.DB.prepare("DELETE FROM staff_logins WHERE email = ?").bind(s.email),
        env.DB.prepare("INSERT INTO staff_logins (username, email, pass_hash, salt, created_at, updated_at, must_change) VALUES (?, ?, ?, ?, ?, ?, 0)")
          .bind(username, s.email, hash, salt, now, now),
        // sign out every other session of this person
        env.DB.prepare("DELETE FROM sessions WHERE email = ? AND token_hash != ?").bind(s.email, s.token_hash),
      ]);
      await audit(env, request, s.email, "staff_password_set", "username " + username);
      return json({ ok: true, username });
    }

    return bad("Not found.", 404);
  } catch (e) {
    console.log("staff error", e && e.message);
    return bad("Server error.", 500);
  }
}
