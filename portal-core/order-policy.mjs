/**
 * Pure validation for service-code issuance. NOT an authorization boundary:
 * caller must authenticate the actor, check admin role, load authoritative DB
 * records, and commit issuance atomically.
 */
export function validateIssuance({ order, item, customerId, mode, actorIsAdmin }) {
  if (!order || !item || typeof customerId !== 'string' || !customerId) return { ok: false, reason: 'invalid_request' };
  if (order.customer_id !== customerId || item.order_id !== order.id) return { ok: false, reason: 'ownership_mismatch' };
  if (!item.service_id) return { ok: false, reason: 'service_missing' };
  if (order.status !== 'approved' || !order.verified_at || !order.approved_at || !order.approved_by) {
    return { ok: false, reason: 'order_not_approved' };
  }
  if (mode !== 'automatic' && mode !== 'manual') return { ok: false, reason: 'invalid_mode' };
  if (mode === 'manual' && actorIsAdmin !== true) return { ok: false, reason: 'admin_required' };
  return { ok: true };
}

/**
 * Validate a requested redemption against authoritative DB rows.
 * Must be run INSIDE a serializable transaction with a row lock, followed by
 * conditional UPDATE status='issued' -> 'redeemed' and entitlement INSERT.
 */
export function validateRedemption({ codeRow, item, order, authenticatedUserId, now }) {
  if (!authenticatedUserId || !codeRow || !item || !order) return { ok: false, reason: 'invalid_request' };
  if (codeRow.status !== 'issued' || codeRow.redeemed_at || codeRow.redeemed_by) return { ok: false, reason: 'not_available' };
  if (codeRow.customer_id !== authenticatedUserId || order.customer_id !== authenticatedUserId) return { ok: false, reason: 'ownership_mismatch' };
  if (codeRow.order_item_id !== item.id || item.order_id !== order.id) return { ok: false, reason: 'order_item_mismatch' };
  if (order.status !== 'approved' && order.status !== 'fulfilled') return { ok: false, reason: 'order_not_active' };
  const current = now instanceof Date ? now.getTime() : NaN;
  const expiry = Date.parse(codeRow.expires_at);
  if (!Number.isFinite(current) || !Number.isFinite(expiry) || current >= expiry) return { ok: false, reason: 'expired' };
  return { ok: true };
}
