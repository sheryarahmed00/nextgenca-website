// Shared helpers for the NextGen client portal (Cloudflare Pages Functions).
// Bindings needed (Cloudflare Pages > Settings > Bindings):
//   DB   = D1 database      DOCS = R2 bucket
// Secrets / variables:
//   OTP_PEPPER      long random string (secret)
//   RESEND_API_KEY  API key for sending login codes (secret)
//   ADMIN_EMAILS    comma separated, e.g. "sheryar@nextgenca.co.uk"
//   MAIL_FROM       e.g. "NextGen Client Portal <portal@nextgenca.co.uk>"
//   NOTIFY_EMAIL    where new orders and uploads are announced
//   DEV_MODE        "1" only on a local machine: prints login codes to the log instead of emailing

export const SESSION_COOKIE = "__Host-ng_portal";
export const SESSION_IDLE_MS = 5 * 60 * 1000;             // 5 minutes without activity
export const SESSION_MAX_MS = 12 * 60 * 60 * 1000;        // 12 hours absolute
export const OTP_TTL_MS = 10 * 60 * 1000;                 // codes live 10 minutes
export const OTP_MAX_ATTEMPTS = 5;
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;         // 20 MB

export const SERVICES = [
  "Limited company accounts and corporation tax", "Corporation tax return (CT600)", "Dormant company accounts",
  "Sole trader and partnership accounts", "Self Assessment tax return", "Landlord tax return",
  "Capital gains tax and 60-day property return", "UK tax for non-residents", "Bookkeeping",
  "Catch-up bookkeeping", "VAT registration", "VAT returns", "Making Tax Digital", "Payroll",
  "Director-only payroll", "Payslips, P45, P60 and P11D", "Auto-enrolment pensions", "CIS returns",
  "Company formation", "Companies House filing and confirmation statement", "Director and shareholder changes",
  "Closing a company", "HMRC registrations", "HMRC letters, enquiries and penalties",
  "Accountant's letter / income certificate", "Management accounts", "Cash flow forecast and budget",
  "Business plan", "Business tax planning", "Salary and dividends planning", "Sole trader to limited company switch",
  "Accounting software setup", "Part-time Finance Director", "Pricing and margin review",
  "Outsourcing for accountancy firms", "Other",
];
export const SERVICE_STATUSES = ["Not started", "Waiting for client", "In progress", "Submitted", "Completed"];
export const ORDER_STATUSES = ["New", "Accepted", "In progress", "Completed", "Cancelled"];

const ALLOWED_EXT = {
  pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
  csv: "text/csv", txt: "text/plain",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel", doc: "application/msword",
  heic: "image/heic", heif: "image/heif", webp: "image/webp",
};
export const STAGES = ["kyc", "review", "agreement", "payment", "active", "rejected"];
export const DEFAULT_LETTER = `ENGAGEMENT LETTER

Date: {date}
Client: {name}{company_line}

Thank you for choosing NextGen Chartered Accountant (a trading name of S. Ahmed ACA), an ICAEW member firm. This letter sets out the work we will do for you and the terms we work on.

1. The service
{service}{period_line}
{scope}

2. Our fee
{fee} (fixed fee). NextGen is not VAT registered, so no VAT is added. The fee is payable before work starts. Work outside the scope above will be agreed with you in writing first.

3. Your responsibilities
You will give us complete and accurate records and information on time, and tell us about any changes that affect the work. You remain responsible for the accuracy of any return we file for you, and you will approve each return before we submit it.

4. Our responsibilities
We will carry out the work with reasonable skill and care, in line with the ICAEW Code of Ethics and UK law. We will tell you about filing deadlines we are aware of.

5. Anti-money laundering
UK law requires us to verify your identity before we act for you. We may need to report suspicions of money laundering to the National Crime Agency, and we are not allowed to tell you if we do.

6. Your data
We keep your information confidential and process it under UK GDPR, as set out in our privacy notice at https://nextgenca.co.uk/privacy. We keep records for at least 5 years after our work ends.

7. Complaints
If you are unhappy with our service, please tell us first (https://nextgenca.co.uk/complaints). You may also complain to the ICAEW.

8. Ending the engagement
Either of us can end this engagement in writing. Fees for work already done remain payable.

By signing below you confirm that you have read and agree to these terms.`;
export const DEFAULT_CHECKLIST = {
  "Self Assessment tax return": ["P60 or payslips", "Bank interest statements", "Details of any other income", "Pension contributions"],
  "Landlord tax return": ["Rent received statements", "Mortgage interest statement", "Letting agent statements", "Repair and running cost receipts"],
  "Limited company accounts and corporation tax": ["Business bank statements for the year", "Sales and purchase invoices", "Previous year accounts (if any)", "Loans and director loan details"],
  "VAT returns": ["Sales invoices for the quarter", "Purchase receipts for the quarter", "Bank statements for the quarter"],
  "Payroll": ["Employee list with start dates", "P45s for new starters", "Hours or salary for each employee"],
  "Bookkeeping": ["Bank statements", "Sales invoices", "Purchase receipts"],
};

// ---------- responses ----------
const BASE_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
  "x-robots-tag": "noindex, nofollow",
};
export function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), { status, headers: { ...BASE_HEADERS, ...extra } });
}
export const bad = (msg, status = 400) => json({ error: msg }, status);

// ---------- crypto ----------
const enc = new TextEncoder();
function hex(buf) { return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join(""); }
export function randomToken(bytes = 32) {
  const a = new Uint8Array(bytes); crypto.getRandomValues(a); return hex(a);
}
export function randomCode() {
  // 6 digits, uniform (reject values that would bias the modulo)
  const a = new Uint32Array(1);
  do { crypto.getRandomValues(a); } while (a[0] >= 4294000000);
  return String(a[0] % 1000000).padStart(6, "0");
}
export async function hmac(env, value) {
  if (!env.OTP_PEPPER || env.OTP_PEPPER.length < 24) throw new Error("OTP_PEPPER secret missing or too short");
  const key = await crypto.subtle.importKey("raw", enc.encode(env.OTP_PEPPER), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", key, enc.encode(value)));
}
export function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0;
}

// ---------- input ----------
export function cleanEmail(v) {
  const e = String(v || "").trim().toLowerCase();
  return e.length <= 254 && /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[a-z]{2,}$/.test(e) ? e : null;
}
export function cleanText(v, max = 2000) {
  return String(v ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, max);
}
export function cleanDate(v) {
  const s = String(v || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}
export function clientIp(request) { return request.headers.get("cf-connecting-ip") || "0.0.0.0"; }
export function isAdminEmail(env, email) {
  return String(env.ADMIN_EMAILS || "").toLowerCase().split(",").map(s => s.trim()).filter(Boolean).includes(email);
}

// Blocks cross-site requests: every state-changing call must come from our own pages.
export function sameOrigin(request) {
  if (request.method === "GET" || request.method === "HEAD") return true;
  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  if (!origin || origin !== url.origin) return false;
  return request.headers.get("x-portal") === "1";
}

// ---------- schema ----------
let schemaReady = false;
export async function ensureSchema(env) {
  if (schemaReady) return;
  if (!env.DB) throw new Error("D1 binding DB missing");
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS clients (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL, company TEXT, phone TEXT, active INTEGER NOT NULL DEFAULT 1, stage TEXT NOT NULL DEFAULT 'active', wanted_service TEXT, signup_note TEXT, reject_reason TEXT, created_at TEXT NOT NULL)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS engagements (id INTEGER PRIMARY KEY AUTOINCREMENT, client_id INTEGER NOT NULL, service TEXT NOT NULL, period TEXT, scope TEXT, fee_pence INTEGER NOT NULL, letter_text TEXT NOT NULL, letter_hash TEXT NOT NULL, status TEXT NOT NULL, signed_name TEXT, signed_at TEXT, signed_ip TEXT, signed_ua TEXT, created_at TEXT NOT NULL)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS invoices (id INTEGER PRIMARY KEY AUTOINCREMENT, number TEXT NOT NULL UNIQUE, client_id INTEGER NOT NULL, engagement_id INTEGER, description TEXT NOT NULL, amount_pence INTEGER NOT NULL, status TEXT NOT NULL, client_says_paid_at TEXT, paid_at TEXT, paid_method TEXT, created_at TEXT NOT NULL)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS checklist (id INTEGER PRIMARY KEY AUTOINCREMENT, client_id INTEGER NOT NULL, engagement_id INTEGER, label TEXT NOT NULL, document_id INTEGER, done_at TEXT, created_at TEXT NOT NULL)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS settings (k TEXT PRIMARY KEY, v TEXT NOT NULL)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS services (id INTEGER PRIMARY KEY AUTOINCREMENT, client_id INTEGER NOT NULL, service TEXT NOT NULL, period TEXT, notes TEXT, status TEXT NOT NULL, start_date TEXT, completed_date TEXT, fee TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS documents (id INTEGER PRIMARY KEY AUTOINCREMENT, client_id INTEGER NOT NULL, service_id INTEGER, title TEXT NOT NULL, category TEXT NOT NULL DEFAULT 'general', filename TEXT NOT NULL, r2_key TEXT NOT NULL UNIQUE, size INTEGER NOT NULL, content_type TEXT NOT NULL, uploaded_by TEXT NOT NULL, created_at TEXT NOT NULL)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT, client_id INTEGER NOT NULL, service TEXT NOT NULL, details TEXT, status TEXT NOT NULL, firm_note TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS otps (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL, code_hash TEXT NOT NULL, expires_at INTEGER NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, used INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, email TEXT NOT NULL, role TEXT NOT NULL, client_id INTEGER, created_at INTEGER NOT NULL, last_seen INTEGER NOT NULL, ip TEXT, ua TEXT)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS rate (k TEXT PRIMARY KEY, n INTEGER NOT NULL, window_start INTEGER NOT NULL)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS audit (id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT NOT NULL, actor TEXT NOT NULL, action TEXT NOT NULL, detail TEXT, ip TEXT)`),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS i_services_client ON services(client_id)`),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS i_documents_client ON documents(client_id)`),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS i_orders_client ON orders(client_id)`),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS i_otps_email ON otps(email)`),
  ]);
  schemaReady = true;
}

// ---------- rate limiting (fixed window, stored in D1) ----------
export async function rateLimit(env, key, limit, windowMs) {
  const now = Date.now();
  const row = await env.DB.prepare("SELECT n, window_start FROM rate WHERE k = ?").bind(key).first();
  if (!row || now - row.window_start > windowMs) {
    await env.DB.prepare("INSERT INTO rate (k, n, window_start) VALUES (?, 1, ?) ON CONFLICT(k) DO UPDATE SET n = 1, window_start = excluded.window_start").bind(key, now).run();
    return true;
  }
  if (row.n >= limit) return false;
  await env.DB.prepare("UPDATE rate SET n = n + 1 WHERE k = ?").bind(key).run();
  return true;
}

// ---------- audit ----------
export async function audit(env, request, actor, action, detail = "") {
  try {
    await env.DB.prepare("INSERT INTO audit (at, actor, action, detail, ip) VALUES (?, ?, ?, ?, ?)")
      .bind(new Date().toISOString(), actor, action, cleanText(detail, 500), clientIp(request)).run();
  } catch (e) { /* never block the request on logging */ }
}

// ---------- sessions ----------
function readCookie(request, name) {
  const c = request.headers.get("cookie") || "";
  for (const part of c.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return null;
}
export function sessionCookie(token, maxAgeSec) {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAgeSec}`;
}
export async function createSession(env, request, email, role, clientId) {
  const token = randomToken(32);
  const now = Date.now();
  await env.DB.prepare("INSERT INTO sessions (token_hash, email, role, client_id, created_at, last_seen, ip, ua) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .bind(await hmac(env, "s:" + token), email, role, clientId ?? null, now, now, clientIp(request), cleanText(request.headers.get("user-agent"), 200)).run();
  return token;
}
export async function getSession(env, request) {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const h = await hmac(env, "s:" + token);
  const s = await env.DB.prepare("SELECT * FROM sessions WHERE token_hash = ?").bind(h).first();
  if (!s) return null;
  const now = Date.now();
  if (now - s.last_seen > SESSION_IDLE_MS || now - s.created_at > SESSION_MAX_MS) {
    await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(h).run();
    return null;
  }
  // Re-check the account is still allowed (admin removed / client deactivated -> session dies)
  if (s.role === "admin" && !isAdminEmail(env, s.email)) return null;
  if (s.role === "client") {
    const c = await env.DB.prepare("SELECT active FROM clients WHERE id = ?").bind(s.client_id).first();
    if (!c || !c.active) return null;
  }
  if (now - s.last_seen > 30 * 1000) {
    await env.DB.prepare("UPDATE sessions SET last_seen = ? WHERE token_hash = ?").bind(now, h).run();
  }
  return { ...s, token_hash: h };
}
export async function destroySession(env, request) {
  const token = readCookie(request, SESSION_COOKIE);
  if (token && /^[a-f0-9]{64}$/.test(token)) {
    await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await hmac(env, "s:" + token)).run();
  }
}

// ---------- email ----------
export async function sendEmail(env, to, subject, text) {
  if (env.DEV_MODE === "1") { console.log(`[DEV EMAIL] to=${to} subject=${subject}\n${text}`); return true; }
  if (!env.RESEND_API_KEY) throw new Error("RESEND_API_KEY missing");
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${String(env.RESEND_API_KEY).trim()}`, "content-type": "application/json" },
    body: JSON.stringify({ from: env.MAIL_FROM || "NextGen Client Portal <portal@nextgenca.co.uk>", to: [to], subject, text }),
  });
  if (!r.ok) console.log("email failed", r.status, await r.text());
  return r.ok;
}

// ---------- files ----------
export function checkUpload(file) {
  if (!file || typeof file === "string") return { error: "No file chosen." };
  if (file.size <= 0) return { error: "The file is empty." };
  if (file.size > MAX_UPLOAD_BYTES) return { error: "Files must be 20 MB or smaller." };
  const name = cleanText(file.name, 150).replace(/[\\/:*?"<>|]+/g, "_") || "document";
  const ext = (name.split(".").pop() || "").toLowerCase();
  if (!ALLOWED_EXT[ext]) return { error: "Allowed files: photos (JPG, PNG, HEIC), PDF, Excel, Word, CSV, TXT." };
  return { name, ext, type: ALLOWED_EXT[ext] };
}
// Confirms the file really is what its extension claims (stops renamed executables / HTML)
export async function sniffOk(file, ext) {
  const b = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const starts = (...sig) => sig.every((v, i) => b[i] === v);
  switch (ext) {
    case "pdf": return starts(0x25, 0x50, 0x44, 0x46);
    case "png": return starts(0x89, 0x50, 0x4e, 0x47);
    case "jpg": case "jpeg": return starts(0xff, 0xd8, 0xff);
    case "xlsx": case "docx": return starts(0x50, 0x4b, 0x03, 0x04);
    case "xls": case "doc": return starts(0xd0, 0xcf, 0x11, 0xe0);
    case "webp": return starts(0x52, 0x49, 0x46, 0x46);
    case "heic": case "heif": { // ISO media: bytes 4-7 = "ftyp"
      const h = new Uint8Array(await file.slice(0, 12).arrayBuffer());
      return h[4] === 0x66 && h[5] === 0x74 && h[6] === 0x79 && h[7] === 0x70;
    }
    case "csv": case "txt": {
      const head = new TextDecoder().decode(await file.slice(0, 512).arrayBuffer()).toLowerCase();
      return !head.includes("\u0000") && !/<\s*(script|html|svg|iframe)/.test(head);
    }
  }
  return false;
}
// File storage: R2 bucket (DOCS) if bound, otherwise Workers KV (DOCS_KV, no card needed, 25 MB per file)
export function files(env) {
  if (env.DOCS) return {
    put: (k, f, ct) => env.DOCS.put(k, f.stream(), { httpMetadata: { contentType: ct } }),
    get: async k => { const o = await env.DOCS.get(k); return o ? o.body : null; },
    del: k => env.DOCS.delete(k),
  };
  if (env.DOCS_KV) return {
    put: async (k, f) => env.DOCS_KV.put(k, await f.arrayBuffer()),
    get: k => env.DOCS_KV.get(k, { type: "stream" }),
    del: k => env.DOCS_KV.delete(k),
  };
  throw new Error("No file storage binding (DOCS or DOCS_KV)");
}
export function downloadResponse(body, filename, contentType) {
  const safe = filename.replace(/[^\w.\- ()]+/g, "_");
  return new Response(body, {
    headers: {
      "content-type": contentType || "application/octet-stream",
      "content-disposition": `attachment; filename="${safe}"`,
      "cache-control": "no-store, private",
      "x-content-type-options": "nosniff",
      "content-security-policy": "default-src 'none'; sandbox",
      "referrer-policy": "no-referrer",
    },
  });
}
export const nowIso = () => new Date().toISOString();

// ---------- money / settings / letters ----------
export const gbp = p => "£" + (p / 100).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export function parsePence(v) {
  const n = Number(String(v ?? "").replace(/[£,\s]/g, ""));
  return Number.isFinite(n) && n > 0 && n < 1000000 ? Math.round(n * 100) : null;
}
export async function getSettings(env) {
  const r = await env.DB.prepare("SELECT k, v FROM settings").all();
  const o = { bank_name: "", account_name: "", sort_code: "", account_number: "", pay_link: "", dd_link: "", letter_template: DEFAULT_LETTER };
  for (const row of r.results) o[row.k] = row.v;
  return o;
}
export function renderLetter(tpl, f) {
  const map = {
    date: f.date, name: f.name, company_line: f.company ? "\nCompany: " + f.company : "",
    service: f.service, period_line: f.period ? " (" + f.period + ")" : "",
    scope: f.scope || "", fee: f.fee,
  };
  return tpl.replace(/\{(\w+)\}/g, (m, k) => (k in map ? map[k] : m));
}
export async function sha256(text) {
  return hex(await crypto.subtle.digest("SHA-256", enc.encode(text)));
}
export async function nextInvoiceNumber(env) {
  const year = new Date().getUTCFullYear();
  const r = await env.DB.prepare("SELECT COUNT(*) AS n FROM invoices WHERE number LIKE ?").bind(`NGCA-INV-${year}-%`).first();
  return `NGCA-INV-${year}-${String((r.n || 0) + 1).padStart(4, "0")}`;
}
export async function storeUpload(env, request, { clientId, file, chk, title, category, serviceId, by }) {
  const key = `clients/${clientId}/${randomToken(16)}.${chk.ext}`;
  await files(env).put(key, file, chk.type);
  const r = await env.DB.prepare("INSERT INTO documents (client_id, service_id, title, category, filename, r2_key, size, content_type, uploaded_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .bind(clientId, serviceId || null, title, category || "general", chk.name, key, file.size, chk.type, by, nowIso()).run();
  return r.meta.last_row_id;
}
