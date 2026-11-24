-- Staging-only strengthening migration. Review on chosen PostgreSQL provider.
-- The existing schema has no public grants or RLS policies.
create unique index if not exists portal_codes_one_redeemed_per_item
  on portal_private.service_codes(order_item_id) where status = 'redeemed';

create index if not exists portal_codes_customer_status
  on portal_private.service_codes(customer_id, status, expires_at);

create index if not exists portal_orders_customer_status
  on portal_private.orders(customer_id, status);

create index if not exists portal_entitlements_customer_service
  on portal_private.entitlements(customer_id, service_id)
  where revoked_at is null;

-- Avoid stale entitlements after order cancellation by performing revocation
-- in the same trusted backend transaction that cancels the order.
-- Never grant UPDATE/INSERT/SELECT directly to untrusted authenticated users.
