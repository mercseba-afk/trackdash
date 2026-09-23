-- Multi-vertical Release identity foundation for Hot Wheels.
--
-- This migration adds empty supporting tables only. Existing Mini 4WD rows,
-- item_number/JAN fields, scanner behaviour and market data are untouched.

create table public.release_identifiers (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null references public.product_releases(id) on delete cascade,
  scheme text not null,
  value text not null,
  market text,
  is_primary boolean not null default false,
  verification_status text not null default 'unverified',
  source_url text,
  checked_at date,
  created_at timestamptz not null default now(),
  constraint release_identifiers_verification_status_check
    check (verification_status in ('verified', 'partial', 'unverified')),
  constraint release_identifiers_release_scheme_value_market_unique
    unique nulls not distinct (release_id, scheme, value, market)
);

create index idx_release_identifiers_release
  on public.release_identifiers(release_id);

create index idx_release_identifiers_lookup
  on public.release_identifiers(scheme, value);

alter table public.release_identifiers enable row level security;

create policy release_identifiers_public_read
  on public.release_identifiers
  for select
  to anon, authenticated
  using (true);

grant select on public.release_identifiers to anon, authenticated;

create table public.hotwheels_release_details (
  release_id uuid primary key references public.product_releases(id) on delete cascade,
  line_slug text not null,
  line_name text not null,
  subseries text,
  mix_code text,
  collector_number text,
  series_position text,
  chase_type text,
  packaging_variant text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_hotwheels_release_details_line
  on public.hotwheels_release_details(line_slug);

create index idx_hotwheels_release_details_subseries
  on public.hotwheels_release_details(subseries);

alter table public.hotwheels_release_details enable row level security;

create policy hotwheels_release_details_public_read
  on public.hotwheels_release_details
  for select
  to anon, authenticated
  using (true);

grant select on public.hotwheels_release_details to anon, authenticated;
