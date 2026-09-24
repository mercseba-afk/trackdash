-- Avante Jr. market-context follow-up — 2026-09-24
-- Adds exact contextual evidence discovered during the current-method re-audit
-- without promoting non-comparable records into the new_complete_unbuilt valuation lane.

begin;

-- 18507: exact current eBay NOS listing. Identity is exact and the item is
-- presented as new old stock, but the crawl does not provide a trustworthy
-- Italy-delivered cost. Keep it as current global ASK context only: no offer
-- state is created, so it cannot become "Disponibile da".
insert into public.market_candidates(
  id,source_id,source_record_key,external_listing_id,original_source,original_record_id,
  listing_url,title_raw,item_number_observed,possible_release_ids,resolved_release_id,
  price,currency,shipping_cost,shipping_basis,observation_type,condition_raw,condition,
  inner_bags_sealed,box_condition,is_complete,is_lot,quantity,match_confidence,
  match_evidence,seller_fingerprint,evidence_group_key,sold_at,sold_on,listing_date,
  observed_at,decision,reason_codes,review_notes,state_hash,needs_revalidation,raw_payload,
  first_observed_at,last_observed_at,updated_at
) values (
  gen_random_uuid(),
  '709dcecf-d368-4742-b114-f00f5d7ed646'::uuid,
  'v1|336558994539|0',
  '336558994539',
  'EBAY_IT',
  '336558994539',
  'https://www.ebay.it/itm/336558994539',
  'RARE Tamiya Avante Jr Special Version 18507 Clear Chassis Yellow Tires 1990 NOS',
  '18507',
  array['d6ed44c7-86fe-4143-ae9f-8c1e6ac61ec5'::uuid],
  null,
  210.00,
  'USD',
  null,
  'unknown',
  'active_listing',
  'Brand New / NOS',
  'new_complete_unbuilt',
  'unknown',
  'unknown',
  true,
  false,
  1,
  'exact',
  array['item_number_exact','edition_name_exact','release_year_stated','manual_override'],
  'ebay:hadfields-antiques',
  null,
  null,
  null,
  null,
  now(),
  'needs_review',
  array['EXTRA_EU_LANDED_COST_UNKNOWN'],
  'Exact active ITEM 18507 NOS listing found during Avante Jr. Master re-audit. Public crawl exposes US$210 item price but not a trustworthy Italy-delivered landed cost. Preserve as global ASK context only; do not publish as Europe-first current acquisition price.',
  null,
  false,
  jsonb_build_object(
    'adapter','manual-reaudit-v1',
    'marketplace','EBAY_IT',
    'crawl_date','2026-09-24',
    'current_item_price_usd',210.00,
    'approx_display_eur',182.47,
    'italy_landed_cost','unknown',
    'publication_lane','context_only'
  ),
  now(),now(),now()
)
on conflict (source_id,source_record_key) do update set
  listing_url=excluded.listing_url,
  title_raw=excluded.title_raw,
  item_number_observed=excluded.item_number_observed,
  possible_release_ids=excluded.possible_release_ids,
  resolved_release_id=excluded.resolved_release_id,
  price=excluded.price,
  currency=excluded.currency,
  shipping_cost=excluded.shipping_cost,
  shipping_basis=excluded.shipping_basis,
  observation_type=excluded.observation_type,
  condition_raw=excluded.condition_raw,
  condition=excluded.condition,
  is_complete=excluded.is_complete,
  is_lot=excluded.is_lot,
  quantity=excluded.quantity,
  match_confidence=excluded.match_confidence,
  match_evidence=excluded.match_evidence,
  decision=excluded.decision,
  reason_codes=excluded.reason_codes,
  review_notes=excluded.review_notes,
  needs_revalidation=excluded.needs_revalidation,
  raw_payload=excluded.raw_payload,
  last_observed_at=excluded.last_observed_at,
  updated_at=excluded.updated_at;

-- 93001: exact Yahoo Japan ended auction. The page is durable, title and ITEM
-- identify Champion's Gold exactly, condition is "unused", and the closing price
-- is JPY 165,000. Because the transaction is from 2024 and completeness/inner
-- bags are not independently confirmed, store it as historical identity/value
-- context with condition=unknown and no normalized EUR market value.
insert into public.market_aggregate_observations(
  source_id,release_id,item_number,possible_release_ids,attribution_status,
  grain,period_start,period_end,condition,query_key,query_description,
  sales_count,seller_count,average_item_price,low_item_price,high_item_price,
  auction_sales_count,buy_it_now_sales_count,accepted_offer_sales_count,
  currency,market_average_eur,fx_rate_to_eur,fx_rate_date,evidence_grade,
  provenance_url,raw_payload,captured_at
) values (
  'd75d5b49-d9e5-58d0-bd2a-3d82f44fda53'::uuid,
  '82690ccb-4b2c-4b4f-af8e-c8c37a859d77'::uuid,
  '93001',
  array['82690ccb-4b2c-4b4f-af8e-c8c37a859d77'::uuid],
  'release_exact',
  'monthly',
  date '2024-03-01',
  date '2024-03-31',
  'unknown',
  'yahoo-jp:93001:2024-03:k1122333821',
  'Yahoo! Auctions Japan k1122333821: exact ITEM 93001 Avante Jr. Champion''s Gold, marked unused, ended 2024-03-24 at JPY 165,000.',
  1,1,165000,165000,165000,
  1,0,0,
  'JPY',
  null,null,null,
  'verified',
  'https://auctions.yahoo.co.jp/jp/auction/k1122333821',
  jsonb_build_object(
    'marketplace','Yahoo! Auctions Japan',
    'provenance_kind','auction_detail',
    'auction_id','k1122333821',
    'observed_title','ミニ四駆 1/32 ITEM 93001 アバンテJr. チャンピオンズゴールド タミヤ レーサーミニ四駆 CHAMPIONS GOLD',
    'condition_observed','unused',
    'completeness_observed','not independently confirmed',
    'ended_on','2024-03-24',
    'ended_time_local','10:05',
    'final_price_jpy',165000,
    'bid_count',1,
    'shipping_excluded',true,
    'seller_type','store',
    'capture_note','Durable exact auction page. Historical/context-only because it is older than the active sold window and completeness/inner bags are not independently proven.'
  ),
  now()
)
on conflict (source_id,query_key,period_start,period_end,item_number) do update set
  release_id=excluded.release_id,
  possible_release_ids=excluded.possible_release_ids,
  attribution_status=excluded.attribution_status,
  condition=excluded.condition,
  sales_count=excluded.sales_count,
  seller_count=excluded.seller_count,
  average_item_price=excluded.average_item_price,
  low_item_price=excluded.low_item_price,
  high_item_price=excluded.high_item_price,
  auction_sales_count=excluded.auction_sales_count,
  buy_it_now_sales_count=excluded.buy_it_now_sales_count,
  accepted_offer_sales_count=excluded.accepted_offer_sales_count,
  currency=excluded.currency,
  market_average_eur=excluded.market_average_eur,
  fx_rate_to_eur=excluded.fx_rate_to_eur,
  fx_rate_date=excluded.fx_rate_date,
  evidence_grade=excluded.evidence_grade,
  provenance_url=excluded.provenance_url,
  raw_payload=excluded.raw_payload,
  captured_at=excluded.captured_at,
  updated_at=now();

-- Keep scan priority focused on the three newly enrolled unique ITEMs for the
-- next manual Admin run. This is operational only; normal cadence resumes after
-- the worker records a success.
update public.market_scan_targets t
set priority=130,
    next_scan_at='2000-01-01 00:00:00+00'::timestamptz,
    consecutive_failures=0,
    last_error=null,
    locked_until=null,
    updated_at=now()
from public.price_sources ps
where t.source_id=ps.id
  and ps.slug='ebay_active_public'
  and t.release_id in (
    'd6ed44c7-86fe-4143-ae9f-8c1e6ac61ec5'::uuid,
    '82690ccb-4b2c-4b4f-af8e-c8c37a859d77'::uuid,
    '5fb4db26-c28b-48e6-a505-4fb551fdb829'::uuid
  )
  and t.enabled;

update public.market_scan_queue q
set priority=130,
    next_scan_at='2000-01-01 00:00:00+00'::timestamptz,
    consecutive_failures=0,
    last_error=null,
    locked_until=null,
    updated_at=now()
from public.price_sources ps
where q.source_id=ps.id
  and ps.slug='ebay_active_public'
  and q.release_id in (
    'd6ed44c7-86fe-4143-ae9f-8c1e6ac61ec5'::uuid,
    '82690ccb-4b2c-4b4f-af8e-c8c37a859d77'::uuid,
    '5fb4db26-c28b-48e6-a505-4fb551fdb829'::uuid
  )
  and q.enabled;

commit;
