-- NextGen Client Portal: PostgreSQL foundation, staging only.
-- Apply ONLY after choosing a managed backend and reviewing roles/RLS.
-- This migration intentionally grants NO direct public/client table access.

create extension if not exists pgcrypto;

create schema if not exists portal_private;
revoke all on schema portal_private from public;

create table if not exists portal_private.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  active boolean not null default true
);

create table if not exists portal_private.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null,
  status text not null default 'submitted'
    check (status in ('submitted','awaiting_verification','verified','approved','fulfilled','cancelled')),
  verified_at timestamptz,
  approved_at timestamptz,
  approved_by uuid,
  created_at timestamptz not null default now(),
  check (status <> 'approved' or (verified_at is not null and approved_at is not null and approved_by is not null))
);

create table if not exists portal_private.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references portal_private.orders(id),
  service_id uuid not null references portal_private.services(id),
  unique(order_id, service_id)
);

create table if not exists portal_private.service_codes (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references portal_private.order_items(id),
  customer_id uuid not null,
  digest char(64) not null unique check (digest ~ '^[a-f0-9]{64}$'),
  issuance_type text not null check (issuance_type in ('automatic','manual')),
  issued_by uuid,
  status text not null default 'issued' check (status in ('issued','redeemed','revoked')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  redeemed_by uuid,
  redeemed_at timestamptz,
  check ((status = 'redeemed') = (redeemed_by is not null and redeemed_at is not null)),
  check (issuance_type <> 'manual' or issued_by is not null),
  unique(order_item_id, issuance_type)
);

create table if not exists portal_private.entitlements (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null unique references portal_private.order_items(id),
  customer_id uuid not null,
  service_id uuid not null references portal_private.services(id),
  activated_at timestamptz not null default now(),
  revoked_at timestamptz
);

create table if not exists portal_private.audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text not null,
  subject_id uuid,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

alter table portal_private.services enable row level security;
alter table portal_private.orders enable row level security;
alter table portal_private.order_items enable row level security;
alter table portal_private.service_codes enable row level security;
alter table portal_private.entitlements enable row level security;
alter table portal_private.audit_events enable row level security;

-- No RLS policies or grants: ordinary clients have no direct access.
-- Trusted backend must enforce customer binding and atomically redeem codes.
-- Restrict database owner/migration role and never expose privileged credentials.
