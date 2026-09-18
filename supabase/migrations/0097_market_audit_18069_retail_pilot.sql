-- Market Audit v1: 18069 retailer pilot.
-- Promote only sources whose exact 18069 pages were proven parseable by the
-- fail-closed generic product-page adapter. Bot-blocked/unsupported sources
-- stay manual/planned.

with target as (
  select id
  from public.product_releases
  where item_number = '18069'
    and edition_name = 'Dash-1 Emperor Premium'
    and release_year = 2012
  limit 1
), endpoint_seed(slug, endpoint_url) as (
  values
    ('briosi_public', 'https://www.briosigiocattoli.it/product/6058/Mini-4wd-Dash1-Emperor-superII-18069'),
    ('tamiya_shop_public', 'https://tamiyashop.jp/shop/g/g18069/')
)
insert into public.market_scan_endpoints (
  release_id, source_id, endpoint_url, parser_kind,
  exact_release_verified, enabled, updated_at
)
select
  target.id,
  ps.id,
  e.endpoint_url,
  'generic_product_page',
  true,
  true,
  now()
from target
cross join endpoint_seed e
join public.price_sources ps on ps.slug=e.slug
on conflict (release_id, source_id, endpoint_url) do update set
  exact_release_verified=true,
  enabled=true,
  updated_at=now();

-- These four exact-page sources passed the live parser probe for 18069.
-- Tamiya USA redirects the bot to a challenge page, Tamiya Shop Japan exposes
-- Shift_JIS HTML without a reliable machine-readable price, and RCJAZ returns
-- HTTP 403; those sources deliberately remain non-executable.
update public.market_source_policies p
set adapter_status='ready', updated_at=now()
from public.price_sources ps
where p.source_id=ps.id
  and ps.slug in (
    'briosi_public',
    'imodellini_public',
    'plaza_japan_public',
    'pieroni_public'
  );

with target as (
  select id
  from public.product_releases
  where item_number='18069'
    and edition_name='Dash-1 Emperor Premium'
    and release_year=2012
  limit 1
), source_rows as (
  select
    target.id as release_id,
    ps.id as source_id,
    p.scan_scope,
    p.default_interval_hours,
    p.priority
  from target
  join public.price_sources ps on ps.slug in (
    'briosi_public',
    'imodellini_public',
    'plaza_japan_public',
    'pieroni_public'
  )
  join public.market_source_policies p on p.source_id=ps.id
  join public.market_scan_endpoints e
    on e.release_id=target.id
   and e.source_id=ps.id
   and e.enabled
   and e.exact_release_verified
)
insert into public.market_scan_targets (
  release_id, source_id, enabled, scan_interval_hours, priority,
  next_scan_at, consecutive_failures, updated_at
)
select
  release_id, source_id, true, default_interval_hours, priority,
  now(), 0, now()
from source_rows
on conflict (release_id, source_id) do update set
  enabled=true,
  scan_interval_hours=excluded.scan_interval_hours,
  priority=excluded.priority,
  next_scan_at=least(public.market_scan_targets.next_scan_at, now()),
  updated_at=now();

with target as (
  select id
  from public.product_releases
  where item_number='18069'
    and edition_name='Dash-1 Emperor Premium'
    and release_year=2012
  limit 1
), source_rows as (
  select
    target.id as release_id,
    ps.id as source_id,
    p.scan_scope,
    p.default_interval_hours,
    p.priority
  from target
  join public.price_sources ps on ps.slug in (
    'briosi_public',
    'imodellini_public',
    'plaza_japan_public',
    'pieroni_public'
  )
  join public.market_source_policies p on p.source_id=ps.id
  join public.market_scan_endpoints e
    on e.release_id=target.id
   and e.source_id=ps.id
   and e.enabled
   and e.exact_release_verified
)
insert into public.market_scan_queue (
  release_id, source_id, scan_scope, enabled, activity_tier,
  scan_interval_hours, priority, next_scan_at, consecutive_failures, updated_at
)
select
  release_id, source_id, scan_scope, true, 'normal',
  default_interval_hours, priority, now(), 0, now()
from source_rows
on conflict (release_id, source_id, scan_scope) do update set
  enabled=true,
  scan_interval_hours=excluded.scan_interval_hours,
  priority=excluded.priority,
  next_scan_at=least(public.market_scan_queue.next_scan_at, now()),
  consecutive_failures=0,
  updated_at=now();
