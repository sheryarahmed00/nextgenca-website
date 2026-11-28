// Stripe webhook: /api/stripe-webhook
// Events to send from Stripe: checkout.session.completed,
// checkout.session.async_payment_succeeded, checkout.session.async_payment_failed
import { ensureSchema, sendEmail, audit, gbp } from "../_shared/portal.js";
import { verifyStripe, markInvoicePaid } from "../_shared/stripe.js";

const ok = () => new Response("ok", { status: 200 });

export async function onRequestPost({ request, env }) {
  const payload = await request.text();
  if (!(await verifyStripe(env, payload, request.headers.get("stripe-signature")))) {
    return new Response("bad signature", { status: 400 });
  }
  let event;
  try { event = JSON.parse(payload); } catch { return new Response("bad json", { status: 400 }); }
  const session = event.data && event.data.object;
  if (!session || session.object !== "checkout.session") return ok();
  const invoiceId = Number(session.metadata && session.metadata.invoice_id);
  if (!invoiceId) return ok();

  await ensureSchema(env);
  const inv = await env.DB.prepare("SELECT i.*, c.email, c.name FROM invoices i JOIN clients c ON c.id = i.client_id WHERE i.id = ?").bind(invoiceId).first();
  if (!inv) return ok();
  const actor = "stripe";
  const method = (session.payment_method_types || []).includes("bacs_debit") ? "Direct Debit (Stripe)" : "Card (Stripe)";

  // Never trust an amount we did not ask for
  if (session.currency !== "gbp" || Number(session.amount_total) !== Number(inv.amount_pence)) {
    await audit(env, request, actor, "stripe_amount_mismatch", `${inv.number} expected ${inv.amount_pence} got ${session.amount_total} ${session.currency}`);
    if (env.NOTIFY_EMAIL) await sendEmail(env, env.NOTIFY_EMAIL, `Check Stripe payment for ${inv.number}`, `Stripe reported ${session.amount_total} ${session.currency} for ${inv.number} (${gbp(inv.amount_pence)} expected). It was NOT marked paid. Please check Stripe.`);
    return ok();
  }

  if ((event.type === "checkout.session.completed" && session.payment_status === "paid") || event.type === "checkout.session.async_payment_succeeded") {
    const r = await markInvoicePaid(env, request, invoiceId, method, actor, session.payment_intent || session.id);
    if (r.ok && !r.already && env.NOTIFY_EMAIL) {
      await sendEmail(env, env.NOTIFY_EMAIL, `Paid by Stripe: ${inv.number} (${gbp(inv.amount_pence)})`, `${inv.name} <${inv.email}> paid ${inv.number} by ${method}. The client has been asked to upload their documents.`);
    }
  } else if (event.type === "checkout.session.completed") {
    // Bacs Direct Debit: mandate set up, money arrives in a few working days
    await env.DB.prepare("UPDATE invoices SET client_says_paid_at = COALESCE(client_says_paid_at, ?) WHERE id = ?").bind(new Date().toISOString(), invoiceId).run();
    await audit(env, request, actor, "stripe_dd_pending", `${inv.number} ${session.id}`);
  } else if (event.type === "checkout.session.async_payment_failed") {
    await env.DB.prepare("UPDATE invoices SET client_says_paid_at = NULL WHERE id = ? AND status = 'unpaid'").bind(invoiceId).run();
    await audit(env, request, actor, "stripe_payment_failed", `${inv.number} ${session.id}`);
    if (env.NOTIFY_EMAIL) await sendEmail(env, env.NOTIFY_EMAIL, `Direct Debit failed: ${inv.number}`, `The Direct Debit for ${inv.number} (${inv.name}) failed. The invoice is still unpaid.`);
    await sendEmail(env, inv.email, `Payment not completed: ${inv.number}`, `Dear ${inv.name},\n\nYour Direct Debit payment for invoice ${inv.number} did not go through. Please log in and pay another way: ${env.SITE_URL || "https://nextgenca.co.uk"}/portal\n\nKind regards,\nNextGen Chartered Accountant`);
  }
  return ok();
}
