// POST /api/enquiries-sync
// Called every 15 minutes by the Google Apps Script running in Sheryar's and Fiza's
// Google accounts. Auth: "Authorization: Bearer <Google ID token>" from
// ScriptApp.getIdentityToken(). The token proves which Google account sent it; only
// sheryar@ and fiza@/info@nextgenca.co.uk are accepted, and each account is pinned to
// the Apps Script project that first synced from it. (A SYNC_KEY secret also works.)
// Body: { mailbox: "Sheryar" | "Fiza", rows: [ { email, name, phone, service, query,
//         form_at, call_at, call_booked_at, last_at, last_from, said, count, link } ] }
import { json, bad, ensureSchema, safeEqual, nowIso, isAdminEmail } from "../_shared/portal.js";
import { verifyGoogleIdToken } from "../_shared/google-id.js";

const SENDERS = { "sheryar@nextgenca.co.uk": "Sheryar", "fiza@nextgenca.co.uk": "Fiza", "info@nextgenca.co.uk": "Fiza" };
import { ensureEnquirySchema, enqEmail, enqText, enqDate, enqLink, MAILBOXES } from "../_shared/enquiries.js";

export async function onRequestPost({ request, env }) {
  try {
    const got = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    let b;
    try { b = await request.json(); } catch { return bad("Bad JSON."); }

    await ensureSchema(env);
    await ensureEnquirySchema(env);

    let mailbox = null;
    const key = String(env.SYNC_KEY || "");
    if (key.length >= 32 && safeEqual(got, key)) {
      mailbox = b && b.mailbox;
    } else if (got.split(".").length === 3) {
      const claims = await verifyGoogleIdToken(got);
      const email = claims && String(claims.email).toLowerCase();
      if (!claims || !SENDERS[email] || !isAdminEmail(env, email)) return bad("Not allowed.", 403);
      // pin each account to the first Apps Script project (token audience) that synced from it
      const pin = await env.DB.prepare("SELECT aud FROM sync_senders WHERE email = ?").bind(email).first();
      if (pin && pin.aud !== String(claims.aud)) return bad("Not allowed.", 403);
      if (!pin) await env.DB.prepare("INSERT INTO sync_senders (email, aud, created_at) VALUES (?, ?, ?)").bind(email, String(claims.aud), nowIso()).run();
      mailbox = SENDERS[email];
    } else {
      return bad("Not allowed.", 403);
    }
    const box = MAILBOXES[mailbox];
    if (!box) return bad("Unknown mailbox.");
    b.mailbox = mailbox;
    const rows = Array.isArray(b.rows) ? b.rows.slice(0, 500) : [];

    const now = nowIso();
    let saved = 0;
    for (let i = 0; i < rows.length; i += 50) {
      const chunk = rows.slice(i, i + 50).map(r => clean(r)).filter(Boolean);
      if (!chunk.length) continue;
      const emails = chunk.map(r => r.email);
      const existing = await env.DB.prepare(`SELECT * FROM enquiries WHERE email IN (${emails.map(() => "?").join(",")})`)
        .bind(...emails).all();
      const byEmail = Object.fromEntries(existing.results.map(e => [e.email, e]));

      const stmts = chunk.map(r => {
        const e = byEmail[r.email] || {};
        const m = {
          name: e.name || r.name || null, phone: e.phone || r.phone || null,
          service: e.service || r.service || null, query: e.query || r.query || null,
          form_at: minDate(e.form_at, r.form_at),
          call_at: e.call_at ?? null, call_booked_at: e.call_booked_at ?? null, call_with: e.call_with ?? null,
        };
        if (r.call_at && (!e.call_at || r.call_at > e.call_at)) {
          m.call_at = r.call_at; m.call_booked_at = r.call_booked_at; m.call_with = b.mailbox;
        }
        let status = e.status || "New";
        if (status === "New" && m.call_at) status = "Call booked";

        const mailCols = [`${box}_last_at`, `${box}_last_from`, `${box}_said`, `${box}_count`, `${box}_link`];
        const mailVals = r.last_at
          ? [r.last_at, r.last_from, r.said, r.count ?? e[`${box}_count`] ?? null, r.link || e[`${box}_link`] || null]
          : mailCols.map(c => e[c] ?? null);

        return env.DB.prepare(`INSERT INTO enquiries (email, name, phone, service, query, form_at, call_at, call_booked_at, call_with,
            ${mailCols.join(", ")}, status, created_at, synced_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(email) DO UPDATE SET name = excluded.name, phone = excluded.phone, service = excluded.service, query = excluded.query,
            form_at = excluded.form_at, call_at = excluded.call_at, call_booked_at = excluded.call_booked_at, call_with = excluded.call_with,
            ${mailCols.map(c => `${c} = excluded.${c}`).join(", ")}, status = excluded.status, synced_at = excluded.synced_at`)
          .bind(r.email, m.name, m.phone, m.service, m.query, m.form_at, m.call_at, m.call_booked_at, m.call_with,
            ...mailVals, status, e.created_at || now, now, e.updated_at || now);
      });
      await env.DB.batch(stmts);
      saved += stmts.length;
    }
    return json({ ok: true, saved });
  } catch (e) {
    console.log("enquiries-sync error", e && e.message);
    return bad("Server error.", 500);
  }
}

function clean(r) {
  const email = enqEmail(r && r.email);
  if (!email || email.endsWith("@nextgenca.co.uk")) return null;
  const count = Number.isFinite(+r.count) ? Math.max(0, Math.min(100000, Math.floor(+r.count))) : null;
  const lastFrom = r.last_from === "Client" ? "Client" : (r.last_from ? "NextGen" : null);
  return {
    email,
    name: enqText(r.name, 120), phone: enqText(r.phone, 40), service: enqText(r.service, 150), query: enqText(r.query, 1500),
    form_at: enqDate(r.form_at), call_at: enqDate(r.call_at), call_booked_at: enqDate(r.call_booked_at),
    last_at: enqDate(r.last_at), last_from: lastFrom, said: enqText(r.said, 400), count, link: enqLink(r.link),
  };
}

function minDate(a, b) {
  if (!a) return b || null;
  if (!b) return a;
  return a < b ? a : b;
}
