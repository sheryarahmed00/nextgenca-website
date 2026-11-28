// Stripe helpers for the client portal.
// Secrets (Cloudflare Pages > Settings > Variables and secrets):
//   STRIPE_SECRET_KEY      restricted key (rk_live_...) with "Checkout Sessions: Write" permission
//   STRIPE_WEBHOOK_SECRET  signing secret (whsec_...) of the webhook pointing to /api/stripe-webhook
// Optional:
//   STRIPE_BACS = "1"      show "Pay by Direct Debit" (Bacs) once Stripe has approved Bacs Direct Debit
import { gbp, nowIso, sendEmail, audit } from "./portal.js";

const enc = new TextEncoder();

function formEncode(obj, prefix = "", out = []) {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (Array.isArray(v)) v.forEach((x, i) => typeof x === "object" ? formEncode(x, `${key}[${i}]`, out) : out.push(`${encodeURIComponent(`${key}[${i}]`)}=${encodeURIComponent(x)}`));
    else if (typeof v === "object") formEncode(v, key, out);
    else out.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`);
  }
  return out;
}

export async function stripePost(env, path, params, idempotencyKey) {
  if (!env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY missing");
  const headers = { authorization: `Bearer ${String(env.STRIPE_SECRET_KEY).trim()}`, "content-type": "application/x-www-form-urlencoded" };
  if (idempotencyKey) headers["idempotency-key"] = idempotencyKey;
  const r = await fetch("https://api.stripe.com/v1/" + path, { method: "POST", headers, body: formEncode(params).join("&") });
  const j = await r.json();
  if (!r.ok) { console.log("stripe error", r.status, JSON.stringify(j.error || j)); throw new Error("Payment provider error: " + ((j.error && j.error.message) || r.status)); }
  return j;
}

// Verifies the Stripe-Signature header (HMAC-SHA256 of "timestamp.payload"), 5 minute tolerance.
export async function verifyStripe(env, payload, header) {
  if (!env.STRIPE_WEBHOOK_SECRET || !header) return false;
  const parts = Object.fromEntries(header.split(",").map(p => p.split("=")).filter(p => p.length === 2 && p[0] === "t").map(p => [p[0], p[1]]));
  const sigs = header.split(",").map(p => p.split("=")).filter(p => p[0] === "v1").map(p => p[1]);
  const t = Number(parts.t);
  if (!t || !sigs.length || Math.abs(Date.now() / 1000 - t) > 300) return false;
  const key = await crypto.subtle.importKey("raw", enc.encode(String(env.STRIPE_WEBHOOK_SECRET).trim()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = [...new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(`${t}.${payload}`)))].map(b => b.toString(16).padStart(2, "0")).join("");
  return sigs.some(s => s.length === mac.length && [...s].reduce((r, c, i) => r | (c.charCodeAt(0) ^ mac.charCodeAt(i)), 0) === 0);
}

// Marks an invoice paid once (safe to call twice), emails the client the next step.
export async function markInvoicePaid(env, request, invoiceId, method, actor, ref) {
  const inv = await env.DB.prepare("SELECT i.*, c.email, c.name FROM invoices i JOIN clients c ON c.id = i.client_id WHERE i.id = ?").bind(invoiceId).first();
  if (!inv) return { ok: false, reason: "not found" };
  if (inv.status === "paid") return { ok: true, already: true };
  if (inv.status === "cancelled") return { ok: false, reason: "cancelled" };
  await env.DB.prepare("UPDATE invoices SET status = 'paid', paid_at = ?, paid_method = ? WHERE id = ? AND status = 'unpaid'").bind(nowIso(), method, invoiceId).run();
  await audit(env, request, actor, "invoice_paid", `${inv.number} ${gbp(inv.amount_pence)} ${method}${ref ? " " + ref : ""}`);
  const n = await env.DB.prepare("SELECT COUNT(*) AS n FROM checklist WHERE engagement_id = ?").bind(inv.engagement_id).first();
  const site = env.SITE_URL || "https://nextgenca.co.uk";
  await sendEmail(env, inv.email, `Payment received: ${inv.number}`,
    `Dear ${inv.name},\n\nThank you, we have received your payment of ${gbp(inv.amount_pence)} for invoice ${inv.number}.${n && n.n ? "\n\nNext step: please upload the documents on your checklist so we can start: " : "\n\nWe will now start the work and keep you updated in your portal: "}${site}/portal\n\nKind regards,\nNextGen Chartered Accountant`);
  return { ok: true, inv };
}
