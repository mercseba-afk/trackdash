-- Avante Jr. shared-Item-Number completed-sale evidence.
--
-- Shared identifiers are never assigned by Item Number alone.
-- 18506 evidence below is attributed to the 1989 original only because the
-- closed-sale titles explicitly identify the period as "1989", "当時物"
-- (period/vintage item), or "最初期ロット" (earliest production lot).
--
-- 95501 evidence below is tied to the 2024 reissue by its exact JAN
-- 4950344080885, but condition is intentionally left unknown because the
-- closed-search result does not independently prove TrackDash's
-- new_complete_unbuilt condition. It therefore cannot feed current MV.
--
-- 18014 deliberately receives no sale evidence here: the observed listings do
-- not safely distinguish the 1988, 2012 and 2024 production waves.

-- 18506 / 1989 original: explicit 1989 vintage wording + unused/unassembled.
insert into public.market_aggregate_observations (
  source_id, release_id, item_number, possible_release_ids, attribution_status,
  grain, period_start, period_end, condition, query_key, query_description,
  sales_count, seller_count, average_item_price, low_item_price, high_item_price,
  auction_sales_count, buy_it_now_sales_count, accepted_offer_sales_count,
  currency, market_average_eur, fx_rate_to_eur, fx_rate_date,
  evidence_grade, provenance_url, raw_payload, captured_at
) values (
  'd75d5b49-d9e5-58d0-bd2a-3d82f44fda53',
  '934803bc-4ff1-5a5a-9965-b9ed5d448215',
  '18506',
  array['934803bc-4ff1-5a5a-9965-b9ed5d448215'::uuid],
  'release_matched',
  'monthly',
  date '2026-04-01',
  date '2026-04-30',
  'new_complete_unbuilt',
  'yahoo-jp:18506-original-1989:2026-04:closed-search',
  'Yahoo! Japan closed result explicitly identifies an unused/unassembled 1989-period Avante Jr. Black Special.',
  1,1,980,980,980,
  1,0,0,
  'JPY',5.33,0.00544277,date '2026-04-01',
  'indicative',
  'https://auctions.yahoo.co.jp/closedsearch/closedsearch/%E3%83%9F%E3%83%8B%E5%9B%9B%E9%A7%86%20%E3%82%A2%E3%83%90%E3%83%B3%E3%83%86%20%E3%82%B8%E3%83%A5%E3%83%8B%E3%82%A2/0',
  jsonb_build_object(
    'marketplace','Yahoo! Auctions Japan',
    'provenance_kind','closed_search_result',
    'observed_title','美品 未組立 当時物 1989年 TAMIYA 1/32 レーサー ミニ四駆 アバンテ ジュニア ブラックスペシャル AVANTE JUNIOR タミヤ 特別仕様モデル',
    'release_discriminator','explicit 1989 + period/vintage wording',
    'condition_observed','unused / unassembled',
    'ended_on','2026-04-01',
    'final_price_jpy',980,
    'bid_count',1,
    'shipping_excluded',true,
    'fx_basis','ECB EUR/JPY reference rate on 2026-04-01',
    'fx_jpy_per_eur',183.73,
    'capture_note','Closed-search result is release-specific but remains indicative rather than verified transaction-detail evidence.'
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
  currency=excluded.currency,
  market_average_eur=excluded.market_average_eur,
  fx_rate_to_eur=excluded.fx_rate_to_eur,
  fx_rate_date=excluded.fx_rate_date,
  evidence_grade=excluded.evidence_grade,
  provenance_url=excluded.provenance_url,
  raw_payload=excluded.raw_payload,
  captured_at=excluded.captured_at,
  updated_at=now();

-- A second 1989-original result is identifiable by "earliest production lot".
insert into public.market_aggregate_observations (
  source_id, release_id, item_number, possible_release_ids, attribution_status,
  grain, period_start, period_end, condition, query_key, query_description,
  sales_count, seller_count, average_item_price, low_item_price, high_item_price,
  auction_sales_count, buy_it_now_sales_count, accepted_offer_sales_count,
  currency, market_average_eur, fx_rate_to_eur, fx_rate_date,
  evidence_grade, provenance_url, raw_payload, captured_at
) values (
  'd75d5b49-d9e5-58d0-bd2a-3d82f44fda53',
  '934803bc-4ff1-5a5a-9965-b9ed5d448215',
  '18506',
  array['934803bc-4ff1-5a5a-9965-b9ed5d448215'::uuid],
  'release_matched',
  'monthly',
  date '2026-05-01',
  date '2026-05-31',
  'new_complete_unbuilt',
  'yahoo-jp:18506-original-earliest-lot:2026-05:closed-search',
  'Yahoo! Japan closed result identifies an unused/unassembled Avante Jr. Black Special as the earliest production lot.',
  1,1,2340,2340,2340,
  1,0,0,
  'JPY',12.62,0.00539229,date '2026-05-29',
  'indicative',
  'https://auctions.yahoo.co.jp/closedsearch/closedsearch/%E3%82%A2%E3%83%90%E3%83%B3%E3%83%86%E3%83%96%E3%83%A9%E3%83%83%E3%82%AF%E3%82%B9%E3%83%9A%E3%82%B7%E3%83%A3%E3%83%AB/0',
  jsonb_build_object(
    'marketplace','Yahoo! Auctions Japan',
    'provenance_kind','closed_search_result',
    'observed_title','未使用未組み立て品 ◆ アバンテJr.ブラックスペシャル（最初期ロッド） ◆ 前ちゃん・滝博士・超希少品',
    'release_discriminator','earliest production lot wording',
    'condition_observed','unused / unassembled',
    'ended_on','2026-05-30',
    'final_price_jpy',2340,
    'bid_count',7,
    'shipping_excluded',true,
    'fx_basis','ECB EUR/JPY reference rate; last business day before 2026-05-30',
    'fx_jpy_per_eur',185.45,
    'capture_note','Strong edition wording distinguishes the original wave, but search-result-only provenance remains indicative.'
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
  currency=excluded.currency,
  market_average_eur=excluded.market_average_eur,
  fx_rate_to_eur=excluded.fx_rate_to_eur,
  fx_rate_date=excluded.fx_rate_date,
  evidence_grade=excluded.evidence_grade,
  provenance_url=excluded.provenance_url,
  raw_payload=excluded.raw_payload,
  captured_at=excluded.captured_at,
  updated_at=now();

-- 95501 / 2024 reissue: JAN is release-specific, but current condition is not
-- safely proven by the closed result. Preserve it as historical identity
-- evidence without a normalized EUR market value.
insert into public.market_aggregate_observations (
  source_id, release_id, item_number, possible_release_ids, attribution_status,
  grain, period_start, period_end, condition, query_key, query_description,
  sales_count, seller_count, average_item_price, low_item_price, high_item_price,
  auction_sales_count, buy_it_now_sales_count, accepted_offer_sales_count,
  currency, market_average_eur, fx_rate_to_eur, fx_rate_date,
  evidence_grade, provenance_url, raw_payload, captured_at
) values (
  'd75d5b49-d9e5-58d0-bd2a-3d82f44fda53',
  '91bcff13-76b4-5a09-a83b-1cfb85400b40',
  '95501',
  array['91bcff13-76b4-5a09-a83b-1cfb85400b40'::uuid],
  'release_exact',
  'monthly',
  date '2026-06-01',
  date '2026-06-30',
  'unknown',
  'yahoo-jp:95501-2024-jan:2026-06:closed-search',
  'Yahoo! Japan closed result exposes JAN 4950344080885, uniquely identifying the 2024 Black Special reissue; condition is intentionally not promoted.',
  1,1,1000,1000,1000,
  1,0,0,
  'JPY',null,null,null,
  'indicative',
  'https://auctions.yahoo.co.jp/closedsearch/closedsearch/%E3%83%9F%E3%83%8B%E5%9B%9B%E9%A7%86%E3%83%96%E3%83%A9%E3%83%83%E3%82%AF%E3%82%B9%E3%83%9A%E3%82%B7%E3%83%A3%E3%83%AB/0',
  jsonb_build_object(
    'marketplace','Yahoo! Auctions Japan',
    'provenance_kind','closed_search_result',
    'observed_title','同梱OK タミヤ 1/32 レーサーミニ四駆シリーズ アバンテJr. ブラックスペシャル 未組立 TM-M4-B-4950344080885',
    'release_discriminator','JAN 4950344080885 = TrackDash 2024 reissue',
    'condition_observed','unassembled; marketplace condition not independently confirmed',
    'ended_on','2026-06-10',
    'final_price_jpy',1000,
    'bid_count',1,
    'shipping_excluded',true,
    'capture_note','Kept with condition=unknown and market_average_eur=NULL so it cannot enter the new_complete_unbuilt valuation lane.'
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
  currency=excluded.currency,
  market_average_eur=excluded.market_average_eur,
  fx_rate_to_eur=excluded.fx_rate_to_eur,
  fx_rate_date=excluded.fx_rate_date,
  evidence_grade=excluded.evidence_grade,
  provenance_url=excluded.provenance_url,
  raw_payload=excluded.raw_payload,
  captured_at=excluded.captured_at,
  updated_at=now();
