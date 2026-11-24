-- Staging-only private document metadata and accounting foundation.
-- No browser grants or direct object access policies are added.
create table if not exists portal_private.client_documents (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references portal_private.customer_accounts(id),
  object_path text not null unique,
  original_filename text not null check (char_length(original_filename) between 1 and 255),
  mime_type text not null check (mime_type in ('application/pdf','image/png','image/jpeg')),
  size_bytes bigint not null check (size_bytes between 1 and 10485760),
  state text not null default 'pending' check (state in ('pending','ready','deleted')),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  deleted_at timestamptz,
  check (state <> 'ready' or completed_at is not null),
  check (state <> 'deleted' or deleted_at is not null)
);
create index if not exists client_documents_customer_state
  on portal_private.client_documents(customer_id,state);
alter table portal_private.client_documents enable row level security;
revoke all on portal_private.client_documents from public,anon,authenticated;
-- A separate server-only transaction must atomically reserve quota before upload.
-- Do not derive usage from only 'ready' objects; pending reservations count too.
