import { digestServiceCode, generateServiceCode } from './service-codes.mjs';
import { validateIssuance, validateRedemption } from './order-policy.mjs';

/**
 * PostgreSQL transaction adapter: db.transaction(async tx => ...).
 * tx.one(sql, params) returns one row or throws; tx.maybeOne returns row/null.
 * Only invoke from authenticated server routes with trusted auth context.
 * Database service role must not be exposed to browsers.
 */
export async function issueServiceCode({ db, actor, orderItemId, customerId, mode, secret, expiresAt }) {
  if (!actor?.id || !actor?.isAdmin || !actor?.mfaVerified || actor?.serverValidated !== true) throw new Error('admin_auth_required');
  if (!['automatic', 'manual'].includes(mode)) throw new Error('invalid_mode');
  if (!(expiresAt instanceof Date) || expiresAt <= new Date()) throw new Error('invalid_expiry');
  return db.transaction(async tx => {
    const item = await tx.one('SELECT * FROM portal_private.order_items WHERE id = $1 FOR UPDATE', [orderItemId]);
    const order = await tx.one('SELECT * FROM portal_private.orders WHERE id = $1 FOR UPDATE', [item.order_id]);
    const result = validateIssuance({ order, item, customerId, mode, actorIsAdmin: actor.isAdmin });
    if (!result.ok) throw new Error(result.reason);
    await tx.execute("UPDATE portal_private.service_codes SET status = 'revoked' WHERE order_item_id = $1 AND status = 'issued' AND expires_at <= now()", [orderItemId]);
    const existing = await tx.maybeOne("SELECT id FROM portal_private.service_codes WHERE order_item_id = $1 AND status = 'issued'", [orderItemId]);
    if (existing) throw new Error('already_issued');
    const code = generateServiceCode();
    const digest = digestServiceCode(code, secret);
    await tx.one(`INSERT INTO portal_private.service_codes
      (order_item_id, customer_id, digest, issuance_type, issued_by, expires_at)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [orderItemId, customerId, digest, mode, actor.id, expiresAt.toISOString()]);
    await tx.one(`INSERT INTO portal_private.audit_events(actor_id,action,subject_id,metadata)
      VALUES($1,'code_issued',$2,$3::jsonb) RETURNING id`,
      [actor.id, orderItemId, JSON.stringify({ mode })]);
    // Caller must deliver code securely; NEVER log it.
    return { code };
  });
}

/**
 * Redeem a one-time code using a serialised row lock and a single transaction.
 * Authenticated user must have verified email; rate limiting must happen at API edge.
 * Avoid exposing detailed rejection reasons in public API responses.
 */
export async function redeemServiceCode({ db, user, code, secret, now = new Date() }) {
  if (!user?.id || !user?.emailVerified || user?.serverValidated !== true) throw new Error('verified_login_required');
  const digest = digestServiceCode(code, secret);
  return db.transaction(async tx => {
    const row = await tx.maybeOne('SELECT * FROM portal_private.service_codes WHERE digest = $1 FOR UPDATE', [digest]);
    if (!row) throw new Error('invalid_or_unavailable_code');
    const item = await tx.one('SELECT * FROM portal_private.order_items WHERE id = $1', [row.order_item_id]);
    const order = await tx.one('SELECT * FROM portal_private.orders WHERE id = $1 FOR UPDATE', [item.order_id]);
    const check = validateRedemption({ codeRow: row, item, order, authenticatedUserId: user.id, now });
    if (!check.ok) throw new Error('invalid_or_unavailable_code');
    const updated = await tx.one(`UPDATE portal_private.service_codes SET status='redeemed',
      redeemed_by=$2, redeemed_at=$3 WHERE id=$1 AND status='issued' RETURNING id`,
      [row.id, user.id, now.toISOString()]);
    if (!updated?.id) throw new Error('invalid_or_unavailable_code');
    await tx.one(`INSERT INTO portal_private.entitlements(order_item_id,customer_id,service_id)
      VALUES($1,$2,$3) RETURNING id`, [item.id, user.id, item.service_id]);
    await tx.one(`INSERT INTO portal_private.audit_events(actor_id,action,subject_id)
      VALUES($1,'code_redeemed',$2) RETURNING id`, [user.id, row.id]);
    return { serviceId: item.service_id };
  });
}
