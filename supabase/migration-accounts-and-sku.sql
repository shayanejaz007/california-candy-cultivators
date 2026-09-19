-- ---------------------------------------------------------------------------
-- Customer accounts with manual approval, plus a SKU on every strain.
--
-- Run this in the Supabase SQL Editor. Safe to run more than once.
-- ---------------------------------------------------------------------------

-- 1. SKU ---------------------------------------------------------------------

alter table public.strains
  add column if not exists sku text not null default '';

-- Partial unique index: duplicate SKUs are a real inventory hazard, but blank
-- ones are normal for strains you have not numbered yet, so only non-empty
-- values are constrained.
create unique index if not exists strains_sku_key
  on public.strains (sku)
  where sku <> '';

comment on column public.strains.sku is
  'Internal stock-keeping code. Unique when set; blank is allowed.';

-- 2. Customer accounts -------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'account_status') then
    create type account_status as enum ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');
  end if;
end $$;

create table if not exists public.customers (
  id            uuid primary key default gen_random_uuid(),
  email         text not null,
  name          text not null check (length(trim(name)) > 0),
  phone         text not null check (length(regexp_replace(phone, '[^0-9]', '', 'g')) >= 7),
  company       text not null default '',
  -- scrypt$<salt-hex>$<hash-hex>. Never a plaintext password.
  password_hash text not null,
  status        account_status not null default 'PENDING',
  admin_notes   text not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  approved_at   timestamptz
);

-- Emails are stored lower-cased by the application; this enforces it at the
-- database level so two accounts cannot differ only by capitalisation.
create unique index if not exists customers_email_key
  on public.customers (lower(email));

create index if not exists customers_status_idx
  on public.customers (status, created_at desc);

-- 3. Security ----------------------------------------------------------------

alter table public.customers enable row level security;

-- No policies are created, deliberately. Every read and write goes through the
-- server using the service role, which bypasses RLS. With RLS on and no policy,
-- the browser-side publishable key cannot reach this table at all — which matters
-- more here than on any other table, because it holds password hashes.
revoke all on public.customers from anon, authenticated;
grant all privileges on public.customers to service_role;

-- 4. updated_at trigger ------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists customers_touch_updated_at on public.customers;
create trigger customers_touch_updated_at
  before update on public.customers
  for each row execute function public.touch_updated_at();
