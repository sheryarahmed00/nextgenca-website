-- Private account binding: provider subject IDs must never be supplied by browsers.
-- Run on staging only, after 001-004. Identity provider integration pending.
create table if not exists portal_private.customer_accounts (
 id uuid primary key default gen_random_uuid(),
 provider text not null,
 provider_subject text not null,
 email_normalized text not null,
 email_verified boolean not null default false,
 disabled boolean not null default false,
 created_at timestamptz not null default now(),
 unique(provider, provider_subject)
);
create unique index if not exists customer_accounts_verified_email
 on portal_private.customer_accounts(email_normalized) where email_verified = true;
alter table portal_private.customer_accounts enable row level security;
-- Intentionally no direct browser grants.
-- The trusted API maps verified identity-provider subjects to customer_accounts.id.
-- Only this internal UUID is used for orders, service codes and entitlements.
