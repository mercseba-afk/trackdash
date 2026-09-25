-- Avante Jr. family re-audit — 2026-09-25
-- Scope: recover one exact missing image, add one exact current Italian retail
-- endpoint for the 2024 18014 wave, and stage only the market jobs that need a
-- fresh pass. No historical SOLD evidence is deleted merely for looking cheap.

-- 18507 Special Version: exact vintage specialist image.
insert into public.release_images (release_id, url, position)
select
  'd6ed44c7-86fe-4143-ae9f-8c1e6ac61ec5'::uuid,
  'https://joyofthefind.co.uk/cdn/shop/files/rn-image_picker_lib_temp_1615b926-d90e-460f-a9ed-b31e02e45f38.jpg?v=1752421332&width=533',
  0
where not exists (
  select 1
  from public.release_images
  where release_id='d6ed44c7-86fe-4143-ae9f-8c1e6ac61ec5'::uuid
);

insert into public.release_sources (
  release_id, source_type, source_url, verified_fields, checked_at, notes
)
select
  'd6ed44c7-86fe-4143-ae9f-8c1e6ac61ec5'::uuid,
  'trusted_secondary',
  'https://joyofthefind.co.uk/products/tamiya-1988-18507-600-1-32-avante-junior-special-edition-mini-4wd-buggy-very-rare',
  array['itemNumber','editionName','image']::text[],
  date '2026-09-25',
  'Exact 18507-600 specialist listing used only for exact-release image verification. Its retailer title year is not used as release-date authority.'
where not exists (
  select 1 from public.release_sources
  where release_id='d6ed44c7-86fe-4143-ae9f-8c1e6ac61ec5'::uuid
    and source_url='https://joyofthefind.co.uk/products/tamiya-1988-18507-600-1-32-avante-junior-special-edition-mini-4wd-buggy-very-rare'
);

-- Reusable Italian public retailer source. Keep it opt-in by endpoint: we only
-- schedule Releases whose exact page has been manually verified.
insert into public.price_sources (
  slug, name, source_type, is_active, origin, ingestion_mode, market_region, merchant_key
)
values (
  'modellismo_gandolfi_public',
  'Modellismo Gandolfi public retail',
  'retail',
  true,
  'external_market',
  'public_web',
  'europe',
  'modellismo_gandolfi'
)
on conflict (slug) do update set
  name=excluded.name,
  source_type=excluded.source_type,
  is_active=excluded.is_active,
  origin=excluded.origin,
  ingestion_mode=excluded.ingestion_mode,
  market_region=excluded.market_region,
  merchant_key=excluded.merchant_key;

insert into public.market_source_policies (
  source_id, source_family, scan_scope, independent_key, role,
  include_by_default, current_offer_capable, completed_sale_capable,
  unavailable_provides_context, default_interval_hours, priority, adapter_status
)
select
  ps.id,
  'retail:modellismo_gandolfi',
  'retail',
  'retail:modellismo_gandolfi',
  'supporting_retail',
  false,
  true,
  false,
  true,
  336,
  80,
  'ready'
from public.price_sources ps
where ps.slug='modellismo_gandolfi_public'
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

insert into public.market_scan_endpoints (
  release_id, source_id, endpoint_url, parser_kind, exact_release_verified, enabled
)
select
  'c680423c-a5eb-564c-afa6-953a105e9310'::uuid,
  ps.id,
  'https://www.modellismogandolfi.com/prodotto/avante-jr-telaio-type-2/',
  'generic_product_page',
  true,
  true
from public.price_sources ps
where ps.slug='modellismo_gandolfi_public'
on conflict (release_id, source_id, endpoint_url) do update set
  parser_kind=excluded.parser_kind,
  exact_release_verified=true,
  enabled=true,
  updated_at=now();

insert into public.market_scan_queue (
  release_id, source_id, scan_scope, enabled, activity_tier,
  scan_interval_hours, priority, next_scan_at, consecutive_failures
)
select
  'c680423c-a5eb-564c-afa6-953a105e9310'::uuid,
  ps.id,
  'retail',
  true,
  'hot',
  336,
  130,
  timestamptz '2000-01-01 00:00:00+00',
  0
from public.price_sources ps
where ps.slug='modellismo_gandolfi_public'
on conflict (release_id, source_id, scan_scope) do update set
  enabled=true,
  activity_tier='hot',
  scan_interval_hours=336,
  priority=130,
  next_scan_at=timestamptz '2000-01-01 00:00:00+00',
  consecutive_failures=0,
  last_error=null,
  locked_until=null,
  updated_at=now();

-- Unique Item Numbers: refresh only the Avante Jr. Releases where eBay can
-- safely attribute the listing automatically. Shared 18014/18506/95501 remain
-- excluded from unattended eBay attribution.
update public.market_scan_queue q
set
  enabled=true,
  priority=130,
  next_scan_at=timestamptz '2000-01-01 00:00:00+00',
  consecutive_failures=0,
  last_error=null,
  locked_until=null,
  updated_at=now()
from public.price_sources ps
where q.source_id=ps.id
  and ps.slug='ebay_active_public'
  and q.release_id in (
    'd6ed44c7-86fe-4143-ae9f-8c1e6ac61ec5'::uuid, -- 18507
    '5fb4db26-c28b-48e6-a505-4fb551fdb829'::uuid, -- 92210
    '82690ccb-4b2c-4b4f-af8e-c8c37a859d77'::uuid  -- 93001
  );

-- Original 18014 already has an exact accepted Mandarake awarded-auction row.
-- Recompute it now so public SOLD state can catch up with persisted evidence.
select public.trackdash_enqueue_market_recompute(
  'cafbb6ca-1aba-5732-946d-0045d054aa5c'::uuid,
  'new_complete_unbuilt'
);
