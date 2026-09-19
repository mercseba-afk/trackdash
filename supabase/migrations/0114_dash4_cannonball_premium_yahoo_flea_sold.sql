-- Dash-4 Cannonball Premium (ITEM 95225): verified Yahoo! Flea completed-sale window.
--
-- We intentionally store ONE rolling-window aggregate instead of six monthly rows.
-- Market Method v4 selects monthly aggregates ahead of rolling windows; six separate
-- monthly rows would preserve price history but understate seller diversity because
-- seller_count is source-level aggregate metadata. One rolling window lets us record
-- the real distinct seller count (4) without double-counting the same transactions.
--
-- The six underlying sold pages remain preserved in raw_payload for audit.
-- A seventh 2026-08-22 result at JPY 3,480 is deliberately excluded because Yahoo
-- classifies its condition as "some scratches/dirt" and the listing only establishes
-- box wear, not a clean new_complete_unbuilt condition.

insert into public.price_sources (
  id, slug, name, source_type, origin, ingestion_mode, market_region, merchant_key, is_active
) values (
  'b7b6c58e-c350-568e-af3b-0e583c7bc4ed',
  'yahoo_flea_jp_closed',
  'Yahoo! Flea Japan closed sales',
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

insert into public.market_aggregate_observations (
  id,
  source_id, release_id, item_number, possible_release_ids, attribution_status,
  grain, period_start, period_end, condition, query_key, query_description,
  sales_count, seller_count, average_item_price, low_item_price, high_item_price,
  average_shipping, free_shipping_pct,
  auction_sales_count, buy_it_now_sales_count, accepted_offer_sales_count,
  currency, market_average_eur, fx_rate_to_eur, fx_rate_date,
  evidence_grade, provenance_url, raw_payload, captured_at
) values (
  '4c4e8059-25e0-550d-ac7f-535cf688457d',
  'b7b6c58e-c350-568e-af3b-0e583c7bc4ed',
  '7e6cd351-658c-5558-bff9-3a1ea608e6d4',
  '95225',
  array['7e6cd351-658c-5558-bff9-3a1ea608e6d4'::uuid],
  'release_exact',
  'rolling_window',
  date '2025-07-16',
  date '2026-07-16',
  'new_complete_unbuilt',
  'yahoo-flea-jp:95225:2025-07-16:2026-07-16:verified-six',
  'Six exact Yahoo! Flea completed sales for Tamiya ITEM 95225 Cannonball Premium. Every retained page identifies the exact kit and an unused/unassembled state; four distinct sellers are visible across the sample.',
  6,
  4,
  2328.67,
  2000,
  3000,
  0,
  100,
  0,
  6,
  0,
  'JPY',
  12.52,
  0.00537663,
  date '2026-07-16',
  'verified',
  'https://paypayfleamarket.yahoo.co.jp/item/z640926814',
  jsonb_build_object(
    'marketplace','Yahoo! Flea Japan',
    'provenance_kind','verified_sold_pages_rolling_window',
    'normalization_note','Aggregate native JPY average is converted at the ECB-style reference rate on the period end date. Per-sale native prices/dates remain below for audit.',
    'fx_jpy_per_eur',185.99,
    'distinct_sellers',4,
    'retained_sales',jsonb_build_array(
      jsonb_build_object(
        'item_id','z459831312','sold_on','2025-07-16','price_jpy',2222,
        'seller','jjv********','condition','unused / unassembled',
        'url','https://paypayfleamarket.yahoo.co.jp/item/z459831312'
      ),
      jsonb_build_object(
        'item_id','z511586930','sold_on','2025-12-09','price_jpy',2100,
        'seller','ma8********','condition','unused / unopened',
        'url','https://paypayfleamarket.yahoo.co.jp/item/z511586930'
      ),
      jsonb_build_object(
        'item_id','z437594890','sold_on','2026-01-27','price_jpy',3000,
        'seller','Chief','condition','unused',
        'url','https://paypayfleamarket.yahoo.co.jp/item/z437594890'
      ),
      jsonb_build_object(
        'item_id','z563597416','sold_on','2026-03-08','price_jpy',2000,
        'seller','MuuM','condition','opened only for photography; unused/unassembled; box corner wear',
        'url','https://paypayfleamarket.yahoo.co.jp/item/z563597416'
      ),
      jsonb_build_object(
        'item_id','z634247496','sold_on','2026-06-28','price_jpy',2250,
        'seller','ma8********','condition','unused / unopened',
        'url','https://paypayfleamarket.yahoo.co.jp/item/z634247496'
      ),
      jsonb_build_object(
        'item_id','z640926814','sold_on','2026-07-16','price_jpy',2400,
        'seller','ma8********','condition','unused / unopened; slight box sun fading',
        'url','https://paypayfleamarket.yahoo.co.jp/item/z640926814'
      )
    ),
    'excluded_sales',jsonb_build_array(
      jsonb_build_object(
        'item_id','z650911144','sold_on','2026-08-22','price_jpy',3480,
        'reason','Yahoo condition is some scratches/dirt; excluded from new_complete_unbuilt valuation lane',
        'url','https://paypayfleamarket.yahoo.co.jp/item/z650911144'
      )
    )
  ),
  now()
)
on conflict (source_id,query_key,period_start,period_end,item_number) do update set
  release_id=excluded.release_id,
  possible_release_ids=excluded.possible_release_ids,
  attribution_status=excluded.attribution_status,
  grain=excluded.grain,
  condition=excluded.condition,
  query_description=excluded.query_description,
  sales_count=excluded.sales_count,
  seller_count=excluded.seller_count,
  average_item_price=excluded.average_item_price,
  low_item_price=excluded.low_item_price,
  high_item_price=excluded.high_item_price,
  average_shipping=excluded.average_shipping,
  free_shipping_pct=excluded.free_shipping_pct,
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
