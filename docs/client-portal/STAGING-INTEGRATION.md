# Staging integration checklist (NOT a deployed portal)

## Required before a usable staging environment
1. Provision private managed PostgreSQL and a least-privilege application role; review all migrations 001-008 for compatibility and apply in order on an empty staging database.
2. Choose an identity provider with email verification and admin MFA. Implement a server-only verifyBearerToken that verifies signature, issuer, audience, expiry, MFA and session status. Do not trust the request's JSON for identity.
3. Deploy a Node server with TLS, restricted CORS/origin, request size limit, request logging without activation codes, abuse controls, and framework routes invoking createHttpBoundary.
4. Provide server-only database pool and secret (minimum 32 characters, stored in secret manager), wire createPortalDb, createRedemptionRateLimiter, and createPortalHandlers.
5. Provide customer signup and account provisioning on verified identity-provider events. The existing mapping is lookup-only.
6. Implement safe, authenticated admin code delivery to verified email/phone without logging raw codes; never treat FormSubmit enquiry as a verified order.
7. Implement storage isolation, documents, messages, invoices and deadlines; prototypes currently have disabled controls.
8. Execute Node unit tests, PostgreSQL integration tests, cross-account authorization tests, abuse tests, staging UAT and backup/restore exercises.
9. Obtain owner approval after staging UAT before any production release.

## Current status
The HTTP boundary is an injectable dispatch layer, not a listening HTTP server. No provider credentials, running database, deployed staging URL or production release are present. Its origin check and bearer verification must be implemented at the hosting edge; no authentication is performed by this module itself.
