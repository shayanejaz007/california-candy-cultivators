-- ---------------------------------------------------------------------------
-- Fixes: "permission denied for table strains"
--
-- That error is a missing GRANT, not row-level security. RLS failures look
-- different — they either return zero rows or say "violates row-level security
-- policy". "permission denied for table" means the role connecting through the
-- API has no table privileges at all.
--
-- schema.sql enabled RLS but relied on Supabase's default privileges to grant
-- table access to the API roles. On newer projects those defaults are not
-- always applied to tables created by a migration, so the grants are made
-- explicit here.
--
-- Safe to run more than once. Run it in the Supabase SQL Editor.
-- ---------------------------------------------------------------------------

-- 1. Schema access ----------------------------------------------------------

grant usage on schema public to anon, authenticated, service_role;

-- 2. Full access for the server role ----------------------------------------
-- service_role is what the site's secret key uses. It bypasses RLS by design;
-- every write in this app goes through it, server-side only.

grant all privileges on all tables    in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant all privileges on all functions in schema public to service_role;

-- 3. Same for anything created later ----------------------------------------

alter default privileges in schema public
  grant all on tables to service_role;
alter default privileges in schema public
  grant all on sequences to service_role;
alter default privileges in schema public
  grant all on functions to service_role;

-- 4. Browser roles ----------------------------------------------------------
-- anon/authenticated get table privileges, but RLS is still enabled and no
-- read policies exist on these tables, so the browser still cannot read them.
-- The grant only means the roles are recognised rather than rejected outright,
-- which keeps error messages accurate. Storage read stays public via the
-- policy in schema.sql.

grant select on public.strains      to anon, authenticated;
grant select on public.strain_media to anon, authenticated;

-- 5. Confirm RLS is on ------------------------------------------------------

alter table public.strains      enable row level security;
alter table public.strain_media enable row level security;
alter table public.inquiries    enable row level security;
alter table public.audit_logs   enable row level security;

-- 6. Diagnostic helper ------------------------------------------------------
-- Lets the preflight script report which database role your API key actually
-- maps to. If this returns something other than 'service_role', the key in
-- SUPABASE_SECRET_KEY is not a secret key.

create or replace function public.whoami()
returns json
language sql
stable
security invoker
as $$
  select json_build_object(
    'current_user', current_user,
    'session_user', session_user,
    'can_select_strains', has_table_privilege(current_user, 'public.strains', 'SELECT'),
    'can_insert_strains', has_table_privilege(current_user, 'public.strains', 'INSERT')
  );
$$;

grant execute on function public.whoami() to anon, authenticated, service_role;
