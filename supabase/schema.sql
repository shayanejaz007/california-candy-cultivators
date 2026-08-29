-- California Candy Cultivators — production Supabase schema
create extension if not exists "pgcrypto";

do $$ begin
  create type strain_status as enum ('AVAILABLE', 'LOW STOCK', 'COMING SOON', 'SOLD OUT');
exception when duplicate_object then null; end $$;

do $$ begin
  create type inquiry_status as enum ('NEW', 'REPLIED', 'CLOSED');
exception when duplicate_object then null; end $$;

create table if not exists public.strains (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  parent_a text not null default '',
  parent_b text not null default '',
  flavor text[] not null default '{}',
  status strain_status not null default 'COMING SOON',
  qty integer not null default 0 check (qty >= 0),
  visible boolean not null default true,
  featured boolean not null default false,
  sort integer not null default 0,
  batch_name text not null default '',
  batch_no text not null default '',
  harvest text not null default '',
  release_label text not null default '',
  teaser text not null default '',
  aroma text not null default '',
  appearance text not null default '',
  cultivation text not null default '',
  description text not null default '',
  pricing jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists strains_menu_idx on public.strains (visible, status, sort);
create index if not exists strains_sort_idx on public.strains (sort);

create table if not exists public.strain_media (
  id uuid primary key default gen_random_uuid(),
  strain_id uuid not null references public.strains(id) on delete cascade,
  storage_path text not null,
  public_url text not null,
  media_type text not null check (media_type in ('image','video')),
  mime_type text not null default '',
  alt_text text not null default '',
  caption text not null default '',
  sort integer not null default 0,
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists strain_media_strain_idx on public.strain_media (strain_id, sort, created_at);

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  phone text not null check (length(regexp_replace(phone, '[^0-9]', '', 'g')) >= 7),
  strain text not null default 'General inquiry',
  message text not null default '',
  status inquiry_status not null default 'NEW',
  source_page text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists inquiries_recent_idx on public.inquiries (created_at desc);
create index if not exists inquiries_status_idx on public.inquiries (status);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  entity_type text not null,
  entity_id text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists strains_touch_updated_at on public.strains;
create trigger strains_touch_updated_at before update on public.strains
for each row execute function public.touch_updated_at();

drop trigger if exists inquiries_touch_updated_at on public.inquiries;
create trigger inquiries_touch_updated_at before update on public.inquiries
for each row execute function public.touch_updated_at();

create or replace function public.strains_normalise()
returns trigger language plpgsql as $$
begin
  if new.status in ('SOLD OUT', 'COMING SOON') then new.qty := 0; end if;
  if new.status = 'COMING SOON' then new.featured := false; end if;
  return new;
end $$;

drop trigger if exists strains_normalise_trg on public.strains;
create trigger strains_normalise_trg before insert or update on public.strains
for each row execute function public.strains_normalise();

create or replace function public.strains_single_feature()
returns trigger language plpgsql as $$
begin
  if new.featured then
    update public.strains set featured = false where featured and id <> new.id;
  end if;
  return null;
end $$;

drop trigger if exists strains_single_feature_trg on public.strains;
create trigger strains_single_feature_trg after insert or update of featured on public.strains
for each row when (new.featured) execute function public.strains_single_feature();

create or replace function public.reorder_strains(slugs text[])
returns void language sql security definer set search_path = public as $$
  update public.strains s
  set sort = u.ordinality - 1
  from unnest(slugs) with ordinality as u(slug, ordinality)
  where s.slug = u.slug;
$$;

revoke all on function public.reorder_strains(text[]) from public;
grant execute on function public.reorder_strains(text[]) to service_role;

alter table public.strains enable row level security;
alter table public.strain_media enable row level security;
alter table public.inquiries enable row level security;
alter table public.audit_logs enable row level security;

-- The application performs all database operations server-side with the service-role key.
-- Public media is intentionally readable; tables remain private from browser clients.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'strain-media', 'strain-media', true, 52428800,
  array['image/jpeg','image/png','image/webp','image/avif','video/mp4','video/webm']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "strain media public read" on storage.objects;
create policy "strain media public read" on storage.objects for select
to public using (bucket_id = 'strain-media');
