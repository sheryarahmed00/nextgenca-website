# NextGen Client Portal — secure implementation blueprint

Status: development-only. Do not deploy to production before security review.

## Confirmed requirements
- Anyone may register a free account with verified email; registration grants no paid-service entitlement.
- User selects a service and redeems a one-time code associated with an approved order/customer/service.
- Codes can be issued automatically after **server-side verified order approval**, or manually by an authorised NextGen admin.
- No verified payment provider has been identified. Never treat a client-side checkout redirect, form submission, or claimed payment as order verification.
- Each account can hold multiple independently activated services.

## Order integration boundary
Order status: draft -> submitted -> awaiting_verification -> verified -> approved -> fulfilled/cancelled.
Only a trusted server-side transition to approved, tied to a specific customer and service, can request automatic issuance.
Issue idempotently using (order_id, service_id, issuance_type) uniqueness.
For manual issuance require admin MFA, explicit reason, customer/service selection, and audit record.
Do not email raw codes until a verified transactional email service is configured.

## Security invariants
- Cryptographically random 256-bit codes; display once and store only a keyed HMAC-SHA256 digest using server-side secret (not in client code).
- Code redemption must be authenticated, email-verified, rate-limited, atomic, and bound to intended customer/service.
- Prevent replay and simultaneous double redemption using database transaction and unique constraints.
- Public users cannot read codes, customer records, orders, or service entitlements.
- Every document access must verify authenticated user + active entitlement + document ownership on the server.
- Admin role must be assigned out-of-band; never from self-registration or user-editable metadata.
- MFA for admins, audit logs for issuance/redemption/revocation, encrypted private document storage, malware scanning and signed short-lived download links.
- Cancellation, refunds, expired engagements and suspected compromise need entitlement revocation workflow.
- UK GDPR: data minimisation, retention/deletion rules, incident response, privacy notice and processor agreements.

## Proposed minimal data model
users (id, email_verified_at, status)
services (id, slug, title, active)
orders (id, customer_user_id, status, verified_at, approved_at, approved_by)
order_items (id, order_id, service_id)
service_codes (id, order_item_id, customer_user_id, digest, status, expires_at, issued_by, issuance_type, redeemed_by, redeemed_at)
entitlements (id, customer_user_id, service_id, order_item_id, active, activated_at, revoked_at)
audit_events (id, actor_user_id, action, subject_id, timestamp, metadata)

## Phase gates
1. Inspect full website source tree, framework, hosting, authentication, checkout and existing customer data.
2. Choose managed authentication/database/storage stack compatible with existing site. Document trust boundaries.
3. Implement migrations, row-level/server-side authorization policies, order approval event and issuance service.
4. Implement registration, login, MFA, code redemption and admin controls.
5. Implement private documents, messages and service-specific dashboard.
6. Test duplicate webhook/event delivery, race conditions, brute force, cross-account document access, unauthorized admin access, revocation, logging and recovery.
7. Review staging environment and security findings before any production deployment.

## Current blockers
The existing repository's root README is present, but package.json at repository root was not found. Application framework and payment/order system remain unverified. Do not invent integrations or expose a functional portal until inspected.
