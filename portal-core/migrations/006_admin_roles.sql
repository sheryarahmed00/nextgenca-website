-- Assign admin roles only through audited out-of-band provisioning.
create table if not exists portal_private.admin_roles (
 account_id uuid primary key references portal_private.customer_accounts(id),
 granted_at timestamptz not null default now(),
 granted_by uuid,
 revoked_at timestamptz
);
alter table portal_private.admin_roles enable row level security;
-- No browser grants or RLS policies.
