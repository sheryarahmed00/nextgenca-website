-- Private distributed account-level redemption throttling.
-- Must be combined with API-edge IP/device throttling to protect against
-- credential stuffing, account enumeration and unauthenticated abuse.
create table if not exists portal_private.redemption_attempts (
 account_id uuid not null references portal_private.customer_accounts(id),
 scope text not null check (scope = 'code-redemption'),
 window_started_at timestamptz not null default now(),
 attempts integer not null default 0 check (attempts >= 0),
 primary key (account_id, scope)
);
alter table portal_private.redemption_attempts enable row level security;
-- No browser grants. Retention cleanup policy required before launch.
