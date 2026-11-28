// Didit webhook: /api/didit-webhook  (status.updated events for ID checks)
import { ensureSchema } from "../_shared/portal.js";
import { diditVerify, diditApply, diditDecision } from "../_shared/autoflow.js";

export async function onRequestPost({ request, env }) {
  const raw = await request.text();
  const ok = await diditVerify(env, raw, request.headers.get("x-signature"), request.headers.get("x-timestamp"), request.headers.get("x-signature-previous"));
  if (!ok) return new Response("bad signature", { status: 401 });
  let ev; try { ev = JSON.parse(raw); } catch { return new Response("bad json", { status: 400 }); }
  if (!ev.session_id || !ev.status) return new Response("ok");
  await ensureSchema(env);
  let decision = ev.decision || null;
  if (["Approved", "Declined", "In Review"].includes(ev.status) && !decision && env.DIDIT_API_KEY) decision = await diditDecision(env, ev.session_id);
  await diditApply(env, request, ev.session_id, ev.status, decision, "didit");
  return new Response("ok");
}
