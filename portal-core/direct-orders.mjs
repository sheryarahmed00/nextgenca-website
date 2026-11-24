/**
 * Direct/offline orders: administrator registers an engagement received by
 * phone, email, WhatsApp or in person. No online checkout is required.
 *
 * Server-only orchestration. Auth context must be supplied by trusted middleware.
 * The authenticated admin must verify the intended customer's email and
 * onboarding before marking the order approved.
 */
const SOURCES = new Set(['phone','email','whatsapp','in_person','other']);
export function validateDirectOrderInput({ customerId, serviceId, source, reference }) {
  if (typeof customerId !== 'string' || !customerId.trim()) throw new Error('customer_required');
  if (typeof serviceId !== 'string' || !serviceId.trim()) throw new Error('service_required');
  if (!SOURCES.has(source)) throw new Error('invalid_source');
  if (typeof reference !== 'string' || reference.length > 120) throw new Error('invalid_reference');
  return { customerId: customerId.trim(), serviceId: serviceId.trim(), source, reference: reference.trim() };
}
export async function registerDirectOrder({ db, admin, input }) {
  if (!admin?.id || !admin.isAdmin || !admin.mfaVerified) throw new Error('admin_auth_required');
  const data = validateDirectOrderInput(input);
  return db.transaction(async tx => {
    const service = await tx.maybeOne('SELECT id FROM portal_private.services WHERE id=$1 AND active=true', [data.serviceId]);
    if (!service) throw new Error('service_unavailable');
    const order = await tx.one(`INSERT INTO portal_private.orders(customer_id,status)
      VALUES($1,'awaiting_verification') RETURNING id`, [data.customerId]);
    const item = await tx.one(`INSERT INTO portal_private.order_items(order_id,service_id)
      VALUES($1,$2) RETURNING id`, [order.id, data.serviceId]);
    await tx.one(`INSERT INTO portal_private.audit_events(actor_id,action,subject_id,metadata)
      VALUES($1,'direct_order_registered',$2,$3::jsonb) RETURNING id`,
      [admin.id, order.id, JSON.stringify({source:data.source,reference:data.reference})]);
    return { orderId: order.id, orderItemId: item.id, status:'awaiting_verification' };
  });
}
export async function approveDirectOrder({ db, admin, orderId, verificationConfirmed }) {
  if (!admin?.id || !admin.isAdmin || !admin.mfaVerified) throw new Error('admin_auth_required');
  if (verificationConfirmed !== true) throw new Error('verification_required');
  return db.transaction(async tx => {
    const order = await tx.one('SELECT * FROM portal_private.orders WHERE id=$1 FOR UPDATE', [orderId]);
    if (order.status !== 'awaiting_verification') throw new Error('invalid_order_status');
    const updated = await tx.one(`UPDATE portal_private.orders
      SET status='approved', verified_at=now(), approved_at=now(), approved_by=$2
      WHERE id=$1 AND status='awaiting_verification' RETURNING id`, [orderId, admin.id]);
    if (!updated?.id) throw new Error('approval_conflict');
    await tx.one(`INSERT INTO portal_private.audit_events(actor_id,action,subject_id)
      VALUES($1,'direct_order_approved',$2) RETURNING id`, [admin.id, orderId]);
    return { orderId, status:'approved' };
  });
}
// After approval call issueServiceCode({mode:'manual',...}) from trusted server.
// Delivery via email/WhatsApp must use verified destination and must never log code.
