// Enquiries & Calls: one row per prospective client (matched by email).
// Filled automatically by the Google Apps Script sync that runs in Sheryar's and
// Fiza's Google accounts (POST /api/enquiries-sync). Status and notes are typed
// by the team in the admin page and are never overwritten by the sync.

export const ENQ_STATUSES = ["New", "Call booked", "Quote sent", "Engagement sent", "Paid", "Work done", "Lost"];
export const MAILBOXES = { Sheryar: "sheryar", Fiza: "fiza" };

let ready = false;
export async function ensureEnquirySchema(env) {
  if (ready) return;
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS enquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      name TEXT, phone TEXT, service TEXT, query TEXT,
      form_at TEXT, call_at TEXT, call_booked_at TEXT, call_with TEXT,
      sheryar_last_at TEXT, sheryar_last_from TEXT, sheryar_said TEXT, sheryar_count INTEGER, sheryar_link TEXT,
      fiza_last_at TEXT, fiza_last_from TEXT, fiza_said TEXT, fiza_count INTEGER, fiza_link TEXT,
      status TEXT NOT NULL DEFAULT 'New', notes TEXT,
      created_at TEXT NOT NULL, synced_at TEXT, updated_at TEXT)`),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS i_enq_status ON enquiries(status)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS sync_senders (email TEXT PRIMARY KEY, aud TEXT NOT NULL, created_at TEXT NOT NULL)`),
  ]);
  ready = true;
}

const EMAIL_RE = /^[^\s@<>"']{1,64}@[A-Za-z0-9.-]{1,190}\.[A-Za-z]{2,}$/;
export function enqEmail(v) {
  const e = String(v || "").trim().toLowerCase();
  return EMAIL_RE.test(e) ? e : "";
}
export function enqText(v, max) {
  return String(v ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, max) || null;
}
export function enqDate(v) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d) ? null : d.toISOString();
}
export function enqLink(v) {
  const s = String(v || "").trim();
  return /^https:\/\/mail\.google\.com\/[^\s"'<>]{1,500}$/.test(s) ? s : null;
}
