# Client portal service-code foundation

Framework-independent Node.js cryptographic primitives only. This is **not** a deployed or usable portal.

Run local unit tests with `node --test portal-core/service-codes.test.mjs` (Node.js 18+).

**Not implemented yet:** authenticated order approval, automatic issuance, admin authorization, email, database transactions, single-use redemption, customer-bound entitlements, API rate limiting, frontend, audit logging, MFA, document storage. Never call this module directly from browser code or ship a secret to the browser.

Next step: inspect website framework/hosting and existing order system, then implement backend services and transactional database constraints. Do not deploy until integration and security tests pass.
