-- Allow secure replacement of revoked/expired codes while preserving a
-- single outstanding code per order item. Staging migration; review before apply.
-- The original UNIQUE(order_item_id, issuance_type) incorrectly prevents
-- reissuing a manual code after revocation or expiry.
ALTER TABLE portal_private.service_codes
  DROP CONSTRAINT IF EXISTS service_codes_order_item_id_issuance_type_key;

-- Protect against multiple simultaneously issued codes, irrespective of mode.
CREATE UNIQUE INDEX IF NOT EXISTS service_codes_one_issued_per_item
  ON portal_private.service_codes(order_item_id)
  WHERE status = 'issued';

-- Historical redeemed codes must remain immutable audit evidence.
-- Application must still check order approval, identity and expiry.
