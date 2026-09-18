-- Market Audit v1: source geography + merchant identity.
-- These fields let the valuation/audit layer avoid treating multiple storefronts
-- from the same merchant, or many sources from one geography, as broad market agreement.

alter table public.price_sources
  add column if not exists market_region text not null default 'global',
  add column if not exists merchant_key text;

alter table public.price_sources
  drop constraint if exists price_sources_market_region_check;

alter table public.price_sources
  add constraint price_sources_market_region_check
  check (market_region in ('europe', 'japan', 'north_america', 'asia_pacific', 'global', 'internal'));

-- Explicit source geography. Marketplace rows with many independent merchants
-- keep merchant_key null; direct retailers get a stable merchant identity.
update public.price_sources set market_region='global', merchant_key=null
where slug in ('ebay_product_research','ebay_active_public','manual_verified_sales');

update public.price_sources set market_region='internal', merchant_key=null
where slug='trackdash_confirmed_sales';

update public.price_sources set market_region='asia_pacific', merchant_key='rcjaz'
where slug='rcjaz_public';

update public.price_sources set market_region='japan', merchant_key='tamiya_japan'
where slug='tamiya_shop_public';

update public.price_sources set market_region='japan', merchant_key='joshin'
where slug='joshin_public';

update public.price_sources set market_region='japan', merchant_key='hobby_search_1999'
where slug='hobby_search_1999_public';

update public.price_sources set market_region='japan', merchant_key='amiami'
where slug='amiami_public';

update public.price_sources set market_region='japan', merchant_key='hlj'
where slug='hlj_public';

update public.price_sources set market_region='japan', merchant_key='plamoya'
where slug='plamoya_public';

update public.price_sources set market_region='japan', merchant_key='mandarake'
where slug='mandarake_public';

update public.price_sources set market_region='japan', merchant_key='plaza_japan'
where slug='plaza_japan_public';

update public.price_sources set market_region='japan', merchant_key='surugaya'
where slug='surugaya_public';

update public.price_sources set market_region='japan', merchant_key=null
where slug in ('rakuten_public','amazon_jp_public','mercari_jp_public');

update public.price_sources set market_region='europe', merchant_key=null
where slug='amazon_it_public';

update public.price_sources set market_region='europe', merchant_key='pieroni'
where slug='pieroni_public';

update public.price_sources set market_region='europe', merchant_key='briosi'
where slug='briosi_public';

update public.price_sources set market_region='europe', merchant_key='modellismo_gandolfi'
where slug='modellismo_gandolfi_public';

update public.price_sources set market_region='japan', merchant_key='akiba_hobby'
where slug='akiba_hobby_public';

-- Add two useful direct-retail sources discovered during the 18069 audit.
insert into public.price_sources (
  slug, name, source_type, origin, ingestion_mode, market_region, merchant_key, is_active
)
values
  (
    'tamiya_usa_public',
    'Tamiya USA public retail',
    'retail',
    'external_market',
    'public_web',
    'north_america',
    'tamiya_usa',
    true
  ),
  (
    'imodellini_public',
    'iModellini public retail',
    'retail',
    'external_market',
    'public_web',
    'europe',
    'imodellini',
    true
  )
on conflict (slug) do update set
  name=excluded.name,
  source_type=excluded.source_type,
  origin=excluded.origin,
  ingestion_mode=excluded.ingestion_mode,
  market_region=excluded.market_region,
  merchant_key=excluded.merchant_key,
  is_active=excluded.is_active;

with policy_seed(slug, source_family, scan_scope, independent_key, role, include_by_default,
  current_offer_capable, completed_sale_capable, unavailable_provides_context,
  default_interval_hours, priority, adapter_status) as (
  values
    ('tamiya_usa_public','retail:tamiya_usa','retail','retail:tamiya_usa','retail_reference',true,true,false,true,168,90,'planned'),
    ('imodellini_public','retail:imodellini','retail','retail:imodellini','supporting_retail',true,true,false,true,168,75,'planned')
)
insert into public.market_source_policies (
  source_id, source_family, scan_scope, independent_key, role, include_by_default,
  current_offer_capable, completed_sale_capable, unavailable_provides_context,
  default_interval_hours, priority, adapter_status, updated_at
)
select
  ps.id, s.source_family, s.scan_scope, s.independent_key, s.role, s.include_by_default,
  s.current_offer_capable, s.completed_sale_capable, s.unavailable_provides_context,
  s.default_interval_hours, s.priority, s.adapter_status, now()
from policy_seed s
join public.price_sources ps on ps.slug=s.slug
on conflict (source_id) do update set
  source_family=excluded.source_family,
  scan_scope=excluded.scan_scope,
  independent_key=excluded.independent_key,
  role=excluded.role,
  include_by_default=excluded.include_by_default,
  current_offer_capable=excluded.current_offer_capable,
  completed_sale_capable=excluded.completed_sale_capable,
  unavailable_provides_context=excluded.unavailable_provides_context,
  default_interval_hours=excluded.default_interval_hours,
  priority=excluded.priority,
  adapter_status=excluded.adapter_status,
  updated_at=now();

-- Exact 18069 pages are curated now, but remain non-executable until each
-- adapter is explicitly promoted from planned/manual to ready.
with target as (
  select id from public.product_releases where id='f576fa21-8e57-5fa0-953e-f468653e3767'
), endpoint_seed(slug, endpoint_url) as (
  values
    ('tamiya_usa_public','https://www.tamiyausa.com/shop/132-super/jr-dash-1-emperor-premium/'),
    ('imodellini_public','https://www.imodellini.it/mini4wd/mini-4wd-jr-dash-1-emperor-premium-con-telaio-super-ii-tamiya-18069?limit=100'),
    ('plaza_japan_public','https://www.plazajapan.com/4950344063871/'),
    ('pieroni_public','https://www.pieronimodellismo.it/tamiya-mini-4wd-dash-1-emperor-premium-super-ii-chassis-18069-8248.html')
)
insert into public.market_scan_endpoints (
  release_id, source_id, endpoint_url, parser_kind, exact_release_verified, enabled, updated_at
)
select
  target.id, ps.id, e.endpoint_url, 'generic_product_page', true, true, now()
from target
cross join endpoint_seed e
join public.price_sources ps on ps.slug=e.slug
on conflict (release_id, source_id, endpoint_url) do update set
  exact_release_verified=true,
  enabled=true,
  updated_at=now();
