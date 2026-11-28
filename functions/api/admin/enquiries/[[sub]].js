// Staff API for Enquiries & Calls (admin login required, same as the rest of /api/admin)
//   GET  /api/admin/enquiries?q=&status=     list
//   PUT  /api/admin/enquiries/:id            { status, notes }
import { json, bad, ensureSchema, sameOrigin, getSession, audit, nowIso } from "../../../_shared/portal.js";
import { ensureEnquirySchema, enqText, ENQ_STATUSES } from "../../../_shared/enquiries.js";

export async function onRequest({ request, env, params }) {
  try {
    await ensureSchema(env);
    await ensureEnquirySchema(env);
    if (!sameOrigin(request)) return bad("Request blocked.", 403);
    const s = await getSession(env, request);
    if (!s) return bad("Please log in.", 401);
    if (s.role !== "admin") return bad("Not allowed.", 403);

    const sub = params.sub || [];
    const m = request.method;

    if (!sub.length && m === "GET") {
      const url = new URL(request.url);
      const q = "%" + String(url.searchParams.get("q") || "").trim().toLowerCase().slice(0, 80) + "%";
      const st = url.searchParams.get("status") || "";
      const where = ["(lower(email) LIKE ? OR lower(COALESCE(name,'')) LIKE ? OR lower(COALESCE(service,'')) LIKE ?)"];
      const args = [q, q, q];
      if (ENQ_STATUSES.includes(st)) { where.push("status = ?"); args.push(st); }
      const r = await env.DB.prepare(`SELECT * FROM enquiries WHERE ${where.join(" AND ")}
        ORDER BY MAX(COALESCE(form_at,''), COALESCE(call_booked_at,''), COALESCE(sheryar_last_at,''), COALESCE(fiza_last_at,'')) DESC LIMIT 300`)
        .bind(...args).all();
      const last = await env.DB.prepare("SELECT MAX(synced_at) AS t FROM enquiries").first();
      return json({ items: r.results, statuses: ENQ_STATUSES, lastSync: last && last.t });
    }

    if (sub.length === 2 && /^\d+$/.test(sub[0]) && sub[1] === "messages" && m === "GET") {
      const e = await env.DB.prepare("SELECT email FROM enquiries WHERE id = ?").bind(Number(sub[0])).first();
      if (!e) return bad("Not found.", 404);
      const r = await env.DB.prepare("SELECT msg_id, mailbox, at, side, sender, subject, body FROM enquiry_messages WHERE email = ? ORDER BY at ASC LIMIT 200").bind(e.email).all();
      return json({ items: r.results });
    }

    if (sub.length === 1 && /^\d+$/.test(sub[0]) && m === "PUT") {
      let b = {};
      try { b = await request.json(); } catch {}
      const id = Number(sub[0]);
      const e = await env.DB.prepare("SELECT id, email FROM enquiries WHERE id = ?").bind(id).first();
      if (!e) return bad("Not found.", 404);
      const status = ENQ_STATUSES.includes(b.status) ? b.status : null;
      if (!status) return bad("Please choose a status.");
      const notes = enqText(b.notes, 3000);
      await env.DB.prepare("UPDATE enquiries SET status = ?, notes = ?, updated_at = ? WHERE id = ?").bind(status, notes, nowIso(), id).run();
      await audit(env, request, s.email, "enquiry_updated", `${e.email}: ${status}`);
      return json({ ok: true });
    }

    return bad("Not found.", 404);
  } catch (e) {
    return bad("Server error.", 500);
  }
}
