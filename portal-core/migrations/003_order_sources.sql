-- Offline/direct-order provenance. Run only on reviewed staging database.
alter table portal_private.orders
  add column if not exists source text not null default 'website'
  check (source in ('website','phone','email','whatsapp','in_person','other'));
alter table portal_private.orders
  add column if not exists external_reference text;
-- Source must be set by trusted backend; no direct client table grants.
