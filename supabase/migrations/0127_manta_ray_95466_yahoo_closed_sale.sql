-- Manta Ray Mk.II 95466 completed-sale evidence from Yahoo! Auctions Japan.
-- Closed-search provenance is exact by Item Number and unused condition, but
-- remains indicative rather than a verified transaction-detail record.

insert into public.market_aggregate_observations (
  source_id, release_id, item_number, possible_release_ids, attribution_status,
  grain, period_start, period_end, condition, query_key, query_description,
  sales_count, seller_count, average_item_price, low_item_price, high_item_price,
  auction_sales_count, buy_it_now_sales_count, accepted_offer_sales_count,
  currency, market_average_eur, fx_rate_to_eur, fx_rate_date,
  evidence_grade, provenance_url, raw_payload, captured_at
) values (
  'd75d5b49-d9e5-58d0-bd2a-3d82f44fda53',
  'b2805fb7-cdd3-5dbf-a724-f73d54702844',
  '95466',
  array['b2805fb7-cdd3-5dbf-a724-f73d54702844'::uuid],
  'release_exact',
  'monthly',
  date '2026-06-01',
  date '2026-06-30',
  'new_complete_unbuilt',
  'yahoo-jp:95466:2026-06-04:closed-search',
  'Yahoo! Auctions Japan closed result: unused Manta Ray Mk.II Black Special ITEM 95466, ended 2026-06-04.',
  1,1,3000,3000,3000,
  1,0,0,
  'JPY',16.13,0.00537606,date '2026-06-04',
  'indicative',
  'https://auctions.yahoo.co.jp/closedsearch/closedsearch?b=701&brand_id=104060&dest_pref_code=12&fixed=0&max=3255&min=2171&mode=3&n=100&price_type=currentprice&select=6',
  jsonb_build_object(
    'marketplace','Yahoo! Auctions Japan',
    'provenance_kind','closed_search_result',
    'observed_title','ミニ四駆 No:95466 マンタレイMk.II ブラックスペシャル',
    'condition_observed','unused',
    'ended_on','2026-06-04',
    'ended_time_local','23:05',
    'final_price_jpy',3000,
    'bid_count',1,
    'shipping_excluded',true,
    'fx_basis','ECB reference rate on sale date',
    'fx_jpy_per_eur',186.01,
    'capture_note','Exact Item Number and unused state are visible in the closed result; search-result-only provenance stays indicative.'
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
  currency=excluded.currency,
  market_average_eur=excluded.market_average_eur,
  fx_rate_to_eur=excluded.fx_rate_to_eur,
  fx_rate_date=excluded.fx_rate_date,
  evidence_grade=excluded.evidence_grade,
  provenance_url=excluded.provenance_url,
  raw_payload=excluded.raw_payload,
  captured_at=excluded.captured_at,
  updated_at=now();

select public.trackdash_enqueue_market_recompute(
  'b2805fb7-cdd3-5dbf-a724-f73d54702844'::uuid,
  'new_complete_unbuilt'
);
