-- Avante Jr. supplementary completed-sale evidence from Yahoo! Japan.
--
-- This source is intentionally manual. It complements eBay Product Research
-- without pretending that a closed-search snippet is equivalent to a full
-- transaction feed. Search-result-only evidence stays indicative; the Avante RS
-- auction has a durable exact auction page and is stored as verified.
--
-- No derived Market Value is written here. The canonical TypeScript v4
-- recomputation will consume eligible evidence on the next material market scan.

insert into public.price_sources (
  id, slug, name, source_type, origin, ingestion_mode, market_region, merchant_key, is_active
) values (
  'd75d5b49-d9e5-58d0-bd2a-3d82f44fda53',
  'yahoo_auctions_jp_closed',
  'Yahoo! Auctions Japan closed sales',
  'market_research',
  'external_market',
  'manual',
  'japan',
  null,
  true
)
on conflict (slug) do update set
  name=excluded.name,
  source_type=excluded.source_type,
  origin=excluded.origin,
  ingestion_mode=excluded.ingestion_mode,
  market_region=excluded.market_region,
  is_active=excluded.is_active;

-- 95474: exact Item Number present in the closed-search result.
insert into public.market_aggregate_observations (
  source_id, release_id, item_number, possible_release_ids, attribution_status,
  grain, period_start, period_end, condition, query_key, query_description,
  sales_count, seller_count, average_item_price, low_item_price, high_item_price,
  auction_sales_count, buy_it_now_sales_count, accepted_offer_sales_count,
  currency, market_average_eur, fx_rate_to_eur, fx_rate_date,
  evidence_grade, provenance_url, raw_payload, captured_at
) values (
  'd75d5b49-d9e5-58d0-bd2a-3d82f44fda53',
  'df8815eb-fd68-54ba-a908-e4fecbe9b5cf',
  '95474',
  array['df8815eb-fd68-54ba-a908-e4fecbe9b5cf'::uuid],
  'release_exact',
  'monthly',
  date '2026-04-01',
  date '2026-04-30',
  'new_complete_unbuilt',
  'yahoo-jp:95474:2026-04:closed-search',
  'Yahoo! Japan closed result: unused Avante Jr. 30th Anniversary Special Kit ITEM 95474, ended 2026-04-18.',
  1,1,2300,2300,2300,
  1,0,0,
  'JPY',12.25,0.00532708,date '2026-04-17',
  'indicative',
  'https://auctions.yahoo.co.jp/closedsearch/closedsearch/%E3%83%9F%E3%83%8B%E5%9B%9B%E9%A7%86%20%E3%82%A2%E3%83%90%E3%83%B3%E3%83%86%20%E3%82%B8%E3%83%A5%E3%83%8B%E3%82%A2/0',
  jsonb_build_object(
    'marketplace','Yahoo! Auctions Japan',
    'provenance_kind','closed_search_result',
    'observed_title','未使用品 1/32 アバンテJr. 30周年スペシャルキット タミヤ レーサーミニ四駆シリーズ 95474 アバンテ ジュニア入手困難 激レア',
    'condition_observed','unused',
    'ended_on','2026-04-18',
    'ended_time_local','21:33',
    'final_price_jpy',2300,
    'bid_count',1,
    'shipping_excluded',true,
    'fx_basis','ECB reference rate; latest business day before sale date',
    'fx_jpy_per_eur',187.72,
    'capture_note','Search-result provenance is exact by Item Number but remains indicative until a durable transaction-detail record is retained.'
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
  currency=excluded.currency,
  market_average_eur=excluded.market_average_eur,
  fx_rate_to_eur=excluded.fx_rate_to_eur,
  fx_rate_date=excluded.fx_rate_date,
  evidence_grade=excluded.evidence_grade,
  provenance_url=excluded.provenance_url,
  raw_payload=excluded.raw_payload,
  captured_at=excluded.captured_at,
  updated_at=now();

-- 95474: distinctive exact edition title, but no Item Number visible in this
-- search-result title. Keep release_matched + indicative rather than overstating
-- the strength of the identity evidence.
insert into public.market_aggregate_observations (
  source_id, release_id, item_number, possible_release_ids, attribution_status,
  grain, period_start, period_end, condition, query_key, query_description,
  sales_count, seller_count, average_item_price, low_item_price, high_item_price,
  auction_sales_count, buy_it_now_sales_count, accepted_offer_sales_count,
  currency, market_average_eur, fx_rate_to_eur, fx_rate_date,
  evidence_grade, provenance_url, raw_payload, captured_at
) values (
  'd75d5b49-d9e5-58d0-bd2a-3d82f44fda53',
  'df8815eb-fd68-54ba-a908-e4fecbe9b5cf',
  '95474',
  array['df8815eb-fd68-54ba-a908-e4fecbe9b5cf'::uuid],
  'release_matched',
  'monthly',
  date '2026-05-01',
  date '2026-05-31',
  'new_complete_unbuilt',
  'yahoo-jp:95474:2026-05:closed-search',
  'Yahoo! Japan closed result: unused/unassembled Avante Jr. 30th Anniversary Special Kit, ended 2026-05-12.',
  1,1,1100,1100,1100,
  1,0,0,
  'JPY',5.95,0.00540599,date '2026-05-12',
  'indicative',
  'https://auctions.yahoo.co.jp/closedsearch/closedsearch/30%E5%91%A8%E5%B9%B4%E8%A8%98%E5%BF%B5%E3%83%A2%E3%83%87%E3%83%AB/0/',
  jsonb_build_object(
    'marketplace','Yahoo! Auctions Japan',
    'provenance_kind','closed_search_result',
    'observed_title','タミヤ レーサーミニ四駆シリーズ特別使用モデル(ブルーメッキボディと記念ステッカーつき)アバンテＪr.30周年スペシャルキット 未組立て',
    'condition_observed','unused / unassembled',
    'ended_on','2026-05-12',
    'ended_time_local','22:47',
    'final_price_jpy',1100,
    'bid_count',12,
    'shipping_excluded',true,
    'fx_basis','ECB reference rate on sale date',
    'fx_jpy_per_eur',184.98,
    'capture_note','Edition title is distinctive but the search-result title does not expose the Item Number; stored as release_matched indicative evidence.'
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
  currency=excluded.currency,
  market_average_eur=excluded.market_average_eur,
  fx_rate_to_eur=excluded.fx_rate_to_eur,
  fx_rate_date=excluded.fx_rate_date,
  evidence_grade=excluded.evidence_grade,
  provenance_url=excluded.provenance_url,
  raw_payload=excluded.raw_payload,
  captured_at=excluded.captured_at,
  updated_at=now();

-- 95060: exact Item Number and unused condition are visible in the Yahoo Flea
-- closed result. Search-result-only provenance remains indicative.
insert into public.market_aggregate_observations (
  source_id, release_id, item_number, possible_release_ids, attribution_status,
  grain, period_start, period_end, condition, query_key, query_description,
  sales_count, seller_count, average_item_price, low_item_price, high_item_price,
  auction_sales_count, buy_it_now_sales_count, accepted_offer_sales_count,
  currency, market_average_eur, fx_rate_to_eur, fx_rate_date,
  evidence_grade, provenance_url, raw_payload, captured_at
) values (
  'd75d5b49-d9e5-58d0-bd2a-3d82f44fda53',
  '2615c6b3-b497-547e-9d80-bdf9c1eca91b',
  '95060',
  array['2615c6b3-b497-547e-9d80-bdf9c1eca91b'::uuid],
  'release_exact',
  'monthly',
  date '2026-05-01',
  date '2026-05-31',
  'new_complete_unbuilt',
  'yahoo-jp:95060:2026-05:closed-search',
  'Yahoo! Flea closed result: unused Avante Jr. Yellow Special (Clear Body) ITEM 95060, ended 2026-05-08.',
  1,1,1480,1480,1480,
  0,1,0,
  'JPY',8.03,0.00542388,date '2026-05-08',
  'indicative',
  'https://auctions.yahoo.co.jp/closedsearch/closedsearch/%E3%83%9F%E3%83%8B%E5%9B%9B%E9%A7%86%20%E3%83%9C%E3%83%87%E3%82%A3/0/',
  jsonb_build_object(
    'marketplace','Yahoo! Flea / Yahoo! Japan',
    'provenance_kind','closed_search_result',
    'observed_title','限定商品 アバンテJr.イエロースペシャル（クリヤーボディ）（1/32スケール レーサーミニ四駆 ミニ四駆限定 95060）',
    'condition_observed','unused',
    'ended_on','2026-05-08',
    'ended_time_local','23:03',
    'final_price_jpy',1480,
    'shipping_excluded',true,
    'fx_basis','ECB reference rate on sale date',
    'fx_jpy_per_eur',184.37,
    'capture_note','Exact Item Number and unused state are visible, but only closed-search provenance is currently durable in TrackDash; kept indicative.'
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
  currency=excluded.currency,
  market_average_eur=excluded.market_average_eur,
  fx_rate_to_eur=excluded.fx_rate_to_eur,
  fx_rate_date=excluded.fx_rate_date,
  evidence_grade=excluded.evidence_grade,
  provenance_url=excluded.provenance_url,
  raw_payload=excluded.raw_payload,
  captured_at=excluded.captured_at,
  updated_at=now();

-- 18058: durable exact auction-detail page. The title identifies Avante RS,
-- condition is unused/unassembled, and the description explicitly says inner
-- component bags are unopened. This can be verified evidence, but it is older
-- than the current 365-day sold window and therefore cannot drive today's MV.
insert into public.market_aggregate_observations (
  source_id, release_id, item_number, possible_release_ids, attribution_status,
  grain, period_start, period_end, condition, query_key, query_description,
  sales_count, seller_count, average_item_price, low_item_price, high_item_price,
  auction_sales_count, buy_it_now_sales_count, accepted_offer_sales_count,
  currency, market_average_eur, fx_rate_to_eur, fx_rate_date,
  evidence_grade, provenance_url, raw_payload, captured_at
) values (
  'd75d5b49-d9e5-58d0-bd2a-3d82f44fda53',
  '9258d58c-2654-510f-b5ac-9b141ed318dc',
  '18058',
  array['9258d58c-2654-510f-b5ac-9b141ed318dc'::uuid],
  'release_matched',
  'monthly',
  date '2024-05-01',
  date '2024-05-31',
  'new_complete_unbuilt',
  'yahoo-jp:18058:2024-05:p1135453273',
  'Yahoo! Auctions Japan p1135453273: Avante RS unused, unassembled, inner bags unopened; ended 2024-05-14.',
  1,1,5500,5500,5500,
  1,0,0,
  'JPY',32.57,0.00592101,date '2024-05-14',
  'verified',
  'https://auctions.yahoo.co.jp/jp/auction/p1135453273',
  jsonb_build_object(
    'marketplace','Yahoo! Auctions Japan',
    'provenance_kind','auction_detail',
    'auction_id','p1135453273',
    'observed_title','TAMIYA レーサーミニ四駆 アバンテRS 未使用 未組立',
    'condition_observed','unused / unassembled',
    'inner_bags_observed','unopened',
    'started_on','2024-05-07',
    'ended_on','2024-05-14',
    'ended_time_local','17:53',
    'final_price_jpy',5500,
    'bid_count',14,
    'shipping_excluded',true,
    'fx_basis','ECB reference rate on sale date',
    'fx_jpy_per_eur',168.89,
    'capture_note','Durable auction-detail provenance verifies condition and completeness. It is intentionally historical-only for current valuation because it exceeds the 365-day sold freshness window.'
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
  currency=excluded.currency,
  market_average_eur=excluded.market_average_eur,
  fx_rate_to_eur=excluded.fx_rate_to_eur,
  fx_rate_date=excluded.fx_rate_date,
  evidence_grade=excluded.evidence_grade,
  provenance_url=excluded.provenance_url,
  raw_payload=excluded.raw_payload,
  captured_at=excluded.captured_at,
  updated_at=now();
