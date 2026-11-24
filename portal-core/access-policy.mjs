/**
 * Authentication and authorization contract for future NextGen portal API.
 * This module does NOT authenticate requests. The caller must first validate
 * a session with a trusted identity provider and load the user from the DB.
 */
export function requireVerifiedUser(context) {
  const user = context?.user;
  if (!user || typeof user.id !== 'string' || !user.id || user.emailVerified !== true || user.serverValidated !== true || user.disabled === true) {
    throw new Error('authentication_required');
  }
  return user;
}
export function requireMfaAdmin(context) {
  const user = requireVerifiedUser(context);
  // Never trust roles sent by client or editable profile metadata.
  // role and MFA must come from server-validated session + admin-role lookup.
  if (context.serverValidated !== true || user.role !== 'admin' || user.mfaVerified !== true) {
    throw new Error('admin_authorization_required');
  }
  return user;
}
export async function requireActiveService({ context, db, serviceId }) {
  const user = requireVerifiedUser(context);
  if (typeof serviceId !== 'string' || !serviceId) throw new Error('service_required');
  const entitlement = await db.maybeOne(
    `SELECT e.id FROM portal_private.entitlements e
      JOIN portal_private.order_items oi ON oi.id=e.order_item_id
      JOIN portal_private.orders o ON o.id=oi.order_id
      WHERE e.customer_id=$1 AND e.service_id=$2
        AND e.revoked_at IS NULL AND o.customer_id=$1
        AND o.status IN ('approved','fulfilled') LIMIT 1`,
    [user.id, serviceId]
  );
  if (!entitlement) throw new Error('service_access_denied');
  return { userId: user.id, serviceId };
}
