-- Hot Wheels casting-level identity and provenance.
--
-- TrackDash hierarchy remains:
--   Product = exact casting
--   ProductRelease = meaningful commercial variation
--   hotwheels_release_subvariants = minor physical/package differences
--
-- This migration adds casting-level facts/provenance only. It does not
-- rewrite any existing Hot Wheels Release or Mini 4WD data.

create table public.hotwheels_casting_details (
  product_id uuid primary key references public.products(id) on delete cascade,
  model_reference text,
  designer text,
  casting_debut_year integer,
  debut_series text,
  scale text,
  verification_status text not null default 'unverified',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hotwheels_casting_details_verification_status_check
    check (verification_status in ('verified', 'partial', 'unverified'))
);

create index idx_hotwheels_casting_details_debut
  on public.hotwheels_casting_details(casting_debut_year);

create index idx_hotwheels_casting_details_designer
  on public.hotwheels_casting_details(designer);

alter table public.hotwheels_casting_details enable row level security;

create policy hotwheels_casting_details_public_read
  on public.hotwheels_casting_details
  for select
  to anon, authenticated
  using (true);

grant select on public.hotwheels_casting_details to anon, authenticated;

create table public.hotwheels_casting_sources (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.hotwheels_casting_details(product_id) on delete cascade,
  source_type text not null,
  source_url text,
  verified_fields text[] not null default '{}'::text[],
  checked_at date,
  notes text,
  created_at timestamptz not null default now(),
  constraint hotwheels_casting_sources_source_type_check
    check (source_type in ('official_manufacturer', 'official_catalog_pdf', 'official_archive', 'trusted_secondary', 'other'))
);

create index idx_hotwheels_casting_sources_product
  on public.hotwheels_casting_sources(product_id);

alter table public.hotwheels_casting_sources enable row level security;

create policy hotwheels_casting_sources_public_read
  on public.hotwheels_casting_sources
  for select
  to anon, authenticated
  using (true);

grant select on public.hotwheels_casting_sources to anon, authenticated;

-- ---------------------------------------------------------------------------
-- FIRST VERIFIED CASTING DETAIL — LB-ER34
-- ---------------------------------------------------------------------------

insert into public.hotwheels_casting_details (
  product_id,
  model_reference,
  designer,
  casting_debut_year,
  debut_series,
  scale,
  verification_status,
  metadata
) values (
  '5fbe93c1-ec35-5351-a34f-f754cd032920',
  'Nissan Skyline R34 with Liberty Walk LB-ER34 Super Silhouette body kit',
  'Mark Jones',
  2022,
  'Car Culture: Mountain Drifters',
  null,
  'verified',
  '{}'::jsonb
)
on conflict (product_id) do update set
  model_reference = excluded.model_reference,
  designer = excluded.designer,
  casting_debut_year = excluded.casting_debut_year,
  debut_series = excluded.debut_series,
  scale = excluded.scale,
  verification_status = excluded.verification_status,
  metadata = excluded.metadata,
  updated_at = now();

insert into public.hotwheels_casting_sources (
  id, product_id, source_type, source_url, verified_fields, checked_at, notes
) values
  (
    '1c8922eb-c91f-5d17-9620-0841c8ed934b',
    '5fbe93c1-ec35-5351-a34f-f754cd032920',
    'trusted_secondary',
    'https://orangetrackdiecast.com/hot-wheels-casting-database/',
    array['designer','castingDebutYear'],
    '2026-09-23',
    'Orange Track Diecast casting database lists LB-ER34 Super Silhouette Nissan Skyline as a 2022 casting designed by Mark Jones.'
  ),
  (
    'd4b3df4b-e69a-5f16-bcc2-918a8cbbd60b',
    '5fbe93c1-ec35-5351-a34f-f754cd032920',
    'trusted_secondary',
    'https://hwcollectorsnews.com/lb-er34-super-silhouette-nissan-skyline-82mm-2022/',
    array['castingDebutYear','debutSeries'],
    '2026-09-23',
    'Hot Wheels Newsletter documents the casting as a 2022 release family and identifies the debut Mountain Drifters releases.'
  ),
  (
    '9d673999-c253-5bd5-b827-de8fd5c236ba',
    '5fbe93c1-ec35-5351-a34f-f754cd032920',
    'trusted_secondary',
    'https://hotwheels.fandom.com/wiki/LB-ER34_Super_Silhouette_Nissan_Skyline',
    array['modelReference','designer','castingDebutYear','debutSeries'],
    '2026-09-23',
    'Collector reference corroborates the Liberty Walk R34 body-kit identity, 2022 debut, Mountain Drifters debut series and Mark Jones designer credit.'
  )
on conflict (id) do nothing;
