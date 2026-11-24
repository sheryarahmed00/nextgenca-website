# NextGen portal integration and release checklist

## Direct clients
Admin registers an offline order from phone, WhatsApp, email, or in-person request, selects the verified customer and service, checks the engagement and payment/approval status, and approves the order. The trusted backend then issues a single-use code. Code must be delivered only to the verified recipient. A client can register for free, verify email, sign in and redeem the code for their assigned service.

## Blocking integrations
1. Choose managed identity provider with verified-email flow, secure sessions and enforced admin MFA.
2. Provision private PostgreSQL staging DB, run and verify migrations 001-004 in order, and set up backups.
3. Implement server-only Postgres transaction adapter and API with identity-provider JWT/session verification. Never trust user IDs, admin roles, email-verification or MFA flags from HTTP request bodies.
4. Add API-edge rate limiting and generic failure responses for activation attempts, session CSRF protection where applicable, secure code delivery, audit logging, and email verification.
5. Wire admin/client screens to authenticated API; do not enable buttons before integration.
6. Implement encrypted private document storage, tenant-bound object access and audit trails.
7. Execute unit, integration, concurrency, abuse, RLS and end-to-end tests; fix failures.
8. Deploy to private staging only, let owner test and approve. Deploy production ONLY after explicit owner approval.

## Known code issues before API wiring
- Existing service-code and direct-order modules are scaffolds and must be reconciled against actual DB columns and UUID identifiers.
- Authentication policy functions require trusted server-side identity; no auth provider is connected.
- Automatic issuance must be tied to a trusted verified order event; a FormSubmit enquiry is not a paid order.
- Code delivery must never place a plaintext activation code in logs, analytics, URLs or persistent browser storage.
- Offline order registration must verify customer account existence and identity, not accept an arbitrary customer ID.
- Service-code expiry and uniqueness, cancelled-order revocation, and concurrent redemption require database-backed integration tests.

No production changes were made by this branch.
