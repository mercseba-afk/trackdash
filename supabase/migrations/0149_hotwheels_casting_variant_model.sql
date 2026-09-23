-- Hot Wheels catalog hardening based on established collector-catalog patterns.
--
-- TrackDash hierarchy:
--   Product = exact casting
--   ProductRelease = meaningful commercial variation
--   hotwheels_release_subvariants = minor physical/package differences
--
-- Existing Mini 4WD tables/data are untouched.

alter table public.hotwheels_release_details
  add column variation_code text,
  add column country_of_manufacture text,
  add column wheel_type text,
  add column exclusivity text,
  add column master_series text,
  add column theme text;

create table public.hotwheels_release_subvariants (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null references public.product_releases(id) on delete cascade,
  code text,
  name text not null,
  country_of_manufacture text,
  wheel_type text,
  packaging_variant text,
  base_variant text,
  interior_variant text,
  window_variant text,
  deco_variant text,
  market_distinct boolean not null default false,
  verification_status text not null default 'unverified',
  source_url text,
  checked_at timestamptz,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hotwheels_release_subvariants_verification_status_check
    check (verification_status in ('verified', 'partial', 'unverified')),
  constraint hotwheels_release_subvariants_release_name_unique
    unique (release_id, name)
);

create index idx_hotwheels_release_subvariants_release
  on public.hotwheels_release_subvariants(release_id);

alter table public.hotwheels_release_subvariants enable row level security;

create policy hotwheels_release_subvariants_public_read
  on public.hotwheels_release_subvariants
  for select
  to anon, authenticated
  using (true);

grant select on public.hotwheels_release_subvariants to anon, authenticated;
