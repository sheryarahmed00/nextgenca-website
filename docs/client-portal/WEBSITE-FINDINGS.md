# Website architecture findings — 24 Nov 2026

Verified from default-branch `index.html`:
- Homepage is a large standalone HTML document with inline JavaScript and CSS.
- The enquiry form `id="enquiry"` posts to `https://formsubmit.co/info@nextgenca.co.uk` and JS sends to the AJAX endpoint.
- A separate estimate form exists (`id="est-form"`); it is not evidence of an order/payment backend.
- Homepage references `/updates.js` and `/chat.js?v=6`.
- No root `package.json` was found. No framework, authenticated API, order database, or payment provider has been verified.

## Consequence
A FormSubmit enquiry is NOT a verified order. Do not automatically generate a service code from a form submission, client-entered reference, or client-side event. Until a trusted order backend exists, NextGen admin must verify and approve the engagement before issuing a code. Once an authoritative backend is available, the same approval event can trigger automatic issuance idempotently.

## Integration proposal
Keep public marketing pages and existing enquiry form unchanged. Build an isolated portal frontend at `/portal/` and a separately hosted authenticated backend/API with private Postgres and object storage. Choose a deployment provider only after checking hosting/DNS and available services. Portal must use server-verified identity and server-enforced customer entitlements; static HTML cannot enforce access to confidential records.

## Release gates
No staging credentials, payment secrets, HMAC secrets, admin credentials, or customer data in GitHub. No production deployment without user testing and explicit approval.
