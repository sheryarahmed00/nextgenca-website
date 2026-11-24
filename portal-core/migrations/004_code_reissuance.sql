-- Correct first-generation uniqueness rule so a revoked/expired code can be reissued.
-- Staging migration; review active code records and execute in a transaction.
BEGIN;
ALTER TABLE portal_private.service_codes
  DROP CONSTRAINT IF EXISTS service_codes_order_item_id_issuance_type_key;
CREATE UNIQUE INDEX IF NOT EXISTS service_codes_one_issued_per_item
  ON portal_private.service_codes(order_item_id) WHERE status='issued';
-- The previously created redeemed-per-item index remains, preventing
-- more than one successful activation of an order item.
COMMIT;
