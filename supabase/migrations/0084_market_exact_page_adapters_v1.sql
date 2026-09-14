-- Market Automation v1.1: exact-page public web adapters
--
-- This migration deliberately separates "a source we want to monitor" from
-- "an exact product page we are allowed to ingest automatically". Only
-- endpoint-backed, exact-Release verified pages can be claimed by an automatic
-- adapter. Planned sources remain visible without pretending that integration
-- already exists.

alter table public.price_sources
  drop constraint if exists price_sources_ingestion_mode_check;

alter table public.price_sources
  add constraint price_sources_ingestion_mode_check
  check (ingestion_mode in ('api', 'licensed_feed', 'public_web', 'manual', 'internal', 'disabled'));

insert into public.price_sources (slug, name, source_type, origin, ingestion_mode, is_active)
values
  ('hobby_search_1999_public', 'Hobby Search / 1999 public retail', 'retail', 'external_market', 'public_web', true),
  ('hlj_public', 'HobbyLink Japan public retail', 'retail', 'external_market', 'public_web', true),
  ('amiami_public', 'AmiAmi public retail', 'retail', 'external_market', 'public_web', true),
  ('surugaya_public', 'Suruga-ya public retail', 'retail', 'external_market', 'public_web', true),
  ('mandarake_public', 'Mandarake public retail', 'retail', 'external_market', 'public_web', true),
  ('plaza_japan_public', 'Plaza Japan public retail', 'retail', 'external_market', 'public_web', true),
  ('rakuten_public', 'Rakuten public marketplace', 'marketplace', 'external_market', 'public_web', true),
  ('amazon_jp_public', 'Amazon Japan public marketplace', 'marketplace', 'external_market', 'public_web', true),
  ('amazon_it_public', 'Amazon Italy public marketplace', 'marketplace', 'external_market', 'public_web', true)
on conflict (slug) do update set
  name = excluded.name,
  source_type = excluded.source_type,
  origin = excluded.origin,
  ingestion_mode = excluded.ingestion_mode,
  is_active = excluded.is_active;

-- Existing public retailer sources now have an explicit public-web ingestion
-- mode. This does not make them executable by itself; adapter_status below is
-- the execution gate.
update public.price_sources
set ingestion_mode = 'public_web'
where slug in (
  'rcjaz_public', 'joshin_public', 'plamoya_public', 'pieroni_public',
  'modellismo_gandolfi_public', 'briosi_public', 'akiba_hobby_public',
  'tamiya_shop_public'
);

with policy_seed(
  slug, source_family, scan_scope, independent_key, role,
  include_by_default, current_offer_capable, completed_sale_capable,
  unavailable_provides_context, default_interval_hours, priority, adapter_status
) as (
  values
    -- First two adapters are enabled only because exact product endpoints are
    -- already curated in release_sources and the parser fails closed.
    ('rcjaz_public', 'retail:rcjaz', 'retail', 'retail:rcjaz', 'structural_reference', true, true, false, true, 168, 100, 'ready'),
    ('hobby_search_1999_public', 'retail:hobby_search_1999', 'retail', 'retail:hobby_search_1999', 'retail_reference', true, true, false, true, 168, 90, 'ready'),

    -- Broad source registry. These are deliberately planned until exact page
    -- discovery/parsing is proven; registering a source is not evidence.
    ('hlj_public', 'retail:hlj', 'retail', 'retail:hlj', 'retail_reference', false, true, false, true, 168, 80, 'planned'),
    ('amiami_public', 'retail:amiami', 'retail', 'retail:amiami', 'retail_reference', false, true, false, true, 168, 80, 'planned'),
    ('surugaya_public', 'retail:surugaya', 'retail', 'retail:surugaya', 'supporting_retail', false, true, false, true, 168, 70, 'planned'),
    ('mandarake_public', 'retail:mandarake', 'retail', 'retail:mandarake', 'supporting_retail', false, true, false, true, 168, 70, 'planned'),
    ('plaza_japan_public', 'retail:plaza_japan', 'retail', 'retail:plaza_japan', 'supporting_retail', false, true, false, true, 168, 70, 'planned'),
    ('rakuten_public', 'rakuten', 'active_marketplace', 'marketplace:rakuten', 'secondary_marketplace', false, true, false, false, 72, 65, 'planned'),
    ('amazon_jp_public', 'amazon', 'active_marketplace', 'marketplace:amazon', 'secondary_marketplace', false, true, false, false, 72, 60, 'planned'),
    ('amazon_it_public', 'amazon', 'active_marketplace', 'marketplace:amazon', 'secondary_marketplace', false, true, false, false, 72, 60, 'planned')
)
insert into public.market_source_policies (
  source_id, source_family, scan_scope, independent_key, role,
  include_by_default, current_offer_capable, completed_sale_capable,
  unavailable_provides_context, default_interval_hours, priority, adapter_status,
  updated_at
)
select
  ps.id, s.source_family, s.scan_scope, s.independent_key, s.role,
  s.include_by_default, s.current_offer_capable, s.completed_sale_capable,
  s.unavailable_provides_context, s.default_interval_hours, s.priority,
  s.adapter_status, now()
from policy_seed s
join public.price_sources ps on ps.slug = s.slug
on conflict (source_id) do update set
  source_family = excluded.source_family,
  scan_scope = excluded.scan_scope,
  independent_key = excluded.independent_key,
  role = excluded.role,
  include_by_default = excluded.include_by_default,
  current_offer_capable = excluded.current_offer_capable,
  completed_sale_capable = excluded.completed_sale_capable,
  unavailable_provides_context = excluded.unavailable_provides_context,
  default_interval_hours = excluded.default_interval_hours,
  priority = excluded.priority,
  adapter_status = excluded.adapter_status,
  updated_at = now();

create table if not exists public.market_scan_endpoints (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null references public.product_releases(id) on delete cascade,
  source_id uuid not null references public.price_sources(id) on delete cascade,
  endpoint_url text not null,
  parser_kind text not null default 'generic_product_page',
  exact_release_verified boolean not null default false,
  enabled boolean not null default true,
  last_checked_at timestamptz,
  last_success_at timestamptz,
  last_http_status integer,
  last_error text,
  last_extraction jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint market_scan_endpoints_release_source_url_unique unique (release_id, source_id, endpoint_url),
  constraint market_scan_endpoints_parser_check check (parser_kind in ('generic_product_page')),
  constraint market_scan_endpoints_http_status_check check (last_http_status is null or last_http_status between 100 and 599)
);

create index if not exists idx_market_scan_endpoints_source_release
  on public.market_scan_endpoints(source_id, release_id, enabled);

alter table public.market_scan_endpoints enable row level security;

-- Every endpoint below comes from an already-curated exact Release source row.
-- We use host mapping only to decide which price-source adapter owns the page;
-- no generated UUIDs are hard-coded.
with mapped as (
  select
    rs.release_id,
    rs.source_url,
    case
      when lower(rs.source_url) ~ '^https?://(www\.)?rcjaz\.(com|co\.uk|com\.au)/' then 'rcjaz_public'
      when lower(rs.source_url) ~ '^https?://(www\.)?1999\.co\.jp/' then 'hobby_search_1999_public'
      when lower(rs.source_url) ~ '^https?://(www\.)?hlj\.com/' then 'hlj_public'
      when lower(rs.source_url) ~ '^https?://(www\.)?amiami\.jp/' then 'amiami_public'
      when lower(rs.source_url) ~ '^https?://(www\.)?suruga-ya\.jp/' then 'surugaya_public'
      when lower(rs.source_url) ~ '^https?://product\.rakuten\.co\.jp/' then 'rakuten_public'
      else null
    end as source_slug
  from public.release_sources rs
)
insert into public.market_scan_endpoints (
  release_id, source_id, endpoint_url, parser_kind, exact_release_verified, enabled, updated_at
)
select
  m.release_id, ps.id, m.source_url, 'generic_product_page', true, true, now()
from mapped m
join public.price_sources ps on ps.slug = m.source_slug
where m.source_slug is not null
on conflict (release_id, source_id, endpoint_url) do update set
  exact_release_verified = true,
  enabled = true,
  updated_at = now();

-- Only Releases already admitted to the v1 pilot get new endpoint-backed jobs.
-- This keeps the experiment bounded while allowing 1999/RCJAZ to run for all
-- pilot Releases where we already have an exact URL.
with pilot_release_ids as (
  select distinct release_id from public.market_scan_queue
), endpoint_jobs as (
  select
    e.release_id,
    e.source_id,
    p.scan_scope,
    p.default_interval_hours,
    p.priority
  from public.market_scan_endpoints e
  join pilot_release_ids pilot on pilot.release_id = e.release_id
  join public.market_source_policies p on p.source_id = e.source_id
  where e.enabled and e.exact_release_verified
)
insert into public.market_scan_targets (
  release_id, source_id, enabled, scan_interval_hours, priority,
  next_scan_at, consecutive_failures, updated_at
)
select
  release_id, source_id, true, default_interval_hours, priority,
  now(), 0, now()
from endpoint_jobs
on conflict (release_id, source_id) do update set
  enabled = true,
  scan_interval_hours = excluded.scan_interval_hours,
  priority = excluded.priority,
  next_scan_at = least(public.market_scan_targets.next_scan_at, now()),
  updated_at = now();

with pilot_release_ids as (
  select distinct release_id from public.market_scan_queue
), endpoint_jobs as (
  select
    e.release_id,
    e.source_id,
    p.scan_scope,
    p.default_interval_hours,
    p.priority
  from public.market_scan_endpoints e
  join pilot_release_ids pilot on pilot.release_id = e.release_id
  join public.market_source_policies p on p.source_id = e.source_id
  where e.enabled and e.exact_release_verified
)
insert into public.market_scan_queue (
  release_id, source_id, scan_scope, enabled, activity_tier,
  scan_interval_hours, priority, next_scan_at, consecutive_failures, updated_at
)
select
  release_id, source_id, scan_scope, true, 'normal',
  default_interval_hours, priority, now(), 0, now()
from endpoint_jobs
on conflict (release_id, source_id, scan_scope) do update set
  enabled = true,
  scan_interval_hours = excluded.scan_interval_hours,
  priority = excluded.priority,
  next_scan_at = least(public.market_scan_queue.next_scan_at, now()),
  updated_at = now();

-- Exact curated endpoint identity is a distinct audit signal from an official
-- manufacturer reference or a human one-off override.
alter table public.market_candidates
  drop constraint if exists market_candidates_match_evidence_check;

alter table public.market_candidates
  add constraint market_candidates_match_evidence_check
  check (match_evidence <@ array[
    'item_number_exact', 'edition_name_exact', 'release_year_stated', 'reissue_stated',
    'chassis_stated', 'color_variant_match', 'packaging_generation_match', 'image_reviewed',
    'official_reference_match', 'verified_endpoint_match', 'manual_override'
  ]::text[]);

-- v2 claim function only yields an executable job when a READY source also has
-- an enabled, exact-Release verified endpoint. This prevents cross-product queue
-- rows from being treated as real integrations.
create or replace function public.trackdash_claim_market_scan_jobs_v2(
  p_limit integer default 8,
  p_lock_minutes integer default 10
)
returns table (
  job_id uuid,
  release_id uuid,
  source_id uuid,
  source_slug text,
  scan_scope text,
  activity_tier text,
  priority integer,
  adapter_status text,
  endpoint_id uuid,
  endpoint_url text,
  parser_kind text,
  exact_release_verified boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
begin
  return query
  with eligible as (
    select distinct on (q.id)
      q.id,
      e.id as endpoint_id
    from public.market_scan_queue q
    join public.market_source_policies p on p.source_id = q.source_id
    join public.market_scan_endpoints e
      on e.release_id = q.release_id
     and e.source_id = q.source_id
     and e.enabled
     and e.exact_release_verified
    where q.enabled
      and p.adapter_status = 'ready'
      and q.next_scan_at <= v_now
      and (q.locked_until is null or q.locked_until <= v_now)
    order by q.id, e.updated_at desc, e.id
  ), picked as (
    select q.id, eligible.endpoint_id
    from eligible
    join public.market_scan_queue q on q.id = eligible.id
    order by q.next_scan_at asc, q.priority desc, q.id
    limit greatest(1, least(coalesce(p_limit, 8), 20))
    for update of q skip locked
  ), locked as (
    update public.market_scan_queue q
    set locked_until = v_now + make_interval(mins => greatest(1, least(coalesce(p_lock_minutes, 10), 60))),
        last_attempt_at = v_now,
        updated_at = v_now
    from picked
    where q.id = picked.id
    returning q.*, picked.endpoint_id
  )
  select
    l.id,
    l.release_id,
    l.source_id,
    ps.slug,
    l.scan_scope,
    l.activity_tier,
    l.priority,
    p.adapter_status,
    e.id,
    e.endpoint_url,
    e.parser_kind,
    e.exact_release_verified
  from locked l
  join public.price_sources ps on ps.id = l.source_id
  join public.market_source_policies p on p.source_id = l.source_id
  join public.market_scan_endpoints e on e.id = l.endpoint_id
  order by l.priority desc, l.next_scan_at asc;
end;
$$;

revoke all on function public.trackdash_claim_market_scan_jobs_v2(integer, integer) from public;
grant execute on function public.trackdash_claim_market_scan_jobs_v2(integer, integer) to trackdash_app;
