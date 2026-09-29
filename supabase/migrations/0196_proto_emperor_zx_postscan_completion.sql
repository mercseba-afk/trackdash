-- Proto Emperor ZX post-scan completion — 2026-09-29
--
-- Manual exact endpoint verification for RCJAZ ITEM 95335.
-- RCJAZ global adapter policy remains "planned"; this records the exact
-- unavailable retail reference without turning it into a current purchasable
-- offer or enabling RCJAZ globally.

begin;

with rel as (
  select id
  from public.product_releases
  where product_id=(select id from public.products where slug='proto-emperor-zx-18714')
    and item_number='95335'
    and release_year=2017
),
src as (
  select id from public.price_sources where slug='rcjaz_public'
)
insert into public.market_candidates(
  source_id, source_record_key, original_source, listing_url, title_raw,
  item_number_observed, possible_release_ids, resolved_release_id,
  price, currency, shipping_cost, shipping_basis, observation_type,
  condition_raw, condition, inner_bags_sealed, box_condition,
  is_complete, is_lot, quantity, match_confidence, match_evidence,
  evidence_group_key, observed_at, decision, reason_codes,
  review_notes, raw_payload, needs_revalidation,
  first_observed_at, last_observed_at
)
select
  src.id,
  'manual:rcjaz:95335:2026-09-29:not-available',
  'rcjaz_public',
  'https://www.rcjaz.com/tamiya-95335-protoemperor-zx-premium-super-ii-chassis-p-90079925.html',
  'Tamiya 95335 - 1/32 Proto-Emperor ZX Premium Super II Chassis Model Kit',
  '95335',
  array[rel.id]::uuid[],
  rel.id,
  12.30,
  'USD',
  null,
  'unknown',
  'retail_out_of_stock',
  'new retail exact-page / not available',
  'new_complete_unbuilt',
  'unknown',
  'unknown',
  true,
  false,
  1,
  'exact',
  array['item_number_exact','verified_endpoint_match','manual_override']::text[],
  'rcjaz:95335',
  now(),
  'accepted',
  array[]::text[],
  'Exact RCJAZ product page manually rechecked on 2026-09-29: ITEM 95335, GTIN 4950344953356, USD 12.30, Not Available. Historical/current unavailable retail reference only; sell-through date unknown and no European landed cost inferred.',
  jsonb_build_object(
    'manual_endpoint_check',true,
    'checked_at','2026-09-29',
    'gtin','4950344953356',
    'availability','out_of_stock',
    'display_price_usd',12.30
  ),
  false,
  now(),
  now()
from rel cross join src
on conflict (source_id,source_record_key) do update set
  listing_url=excluded.listing_url,
  title_raw=excluded.title_raw,
  resolved_release_id=excluded.resolved_release_id,
  possible_release_ids=excluded.possible_release_ids,
  price=excluded.price,
  currency=excluded.currency,
  observation_type=excluded.observation_type,
  condition_raw=excluded.condition_raw,
  condition=excluded.condition,
  is_complete=excluded.is_complete,
  match_confidence=excluded.match_confidence,
  match_evidence=excluded.match_evidence,
  decision=excluded.decision,
  reason_codes=excluded.reason_codes,
  review_notes=excluded.review_notes,
  raw_payload=excluded.raw_payload,
  needs_revalidation=false,
  observed_at=now(),
  last_observed_at=now(),
  updated_at=now();

update public.market_scan_endpoints e
set last_checked_at=now(),
    last_success_at=now(),
    last_http_status=200,
    last_error=null,
    last_extraction=jsonb_build_object(
      'manual',true,
      'checkedAt','2026-09-29',
      'title','Tamiya 95335 - 1/32 Proto-Emperor ZX Premium Super II Chassis Model Kit',
      'itemNumberSeen',true,
      'gtin','4950344953356',
      'price',12.30,
      'currency','USD',
      'availability','out_of_stock',
      'rawAvailability','Not Available',
      'confidence','exact'
    ),
    updated_at=now()
where e.release_id=(
  select id from public.product_releases
  where product_id=(select id from public.products where slug='proto-emperor-zx-18714')
    and item_number='95335'
    and release_year=2017
)
and e.source_id=(select id from public.price_sources where slug='rcjaz_public')
and e.endpoint_url='https://www.rcjaz.com/tamiya-95335-protoemperor-zx-premium-super-ii-chassis-p-90079925.html';

-- The endpoint was manually checked today. Keep its normal retail cadence for
-- the day the RCJAZ adapter is globally promoted from planned to ready.
update public.market_scan_queue q
set priority=100,
    next_scan_at=now() + interval '336 hours',
    locked_until=null,
    consecutive_failures=0,
    last_error=null,
    updated_at=now()
where q.release_id=(
  select id from public.product_releases
  where product_id=(select id from public.products where slug='proto-emperor-zx-18714')
    and item_number='95335'
    and release_year=2017
)
and q.source_id=(select id from public.price_sources where slug='rcjaz_public')
and q.scan_scope='retail';

commit;
