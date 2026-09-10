-- Dyna-Hawk GX market scan enrichment (2026-09-10).
-- Source: eBay Seller Hub Product Research, ALL marketplaces, NEW, SOLD.
--
-- Trend policy for sparse/discontinued collector markets:
-- - the displayed percent must come from real chronological sold-price evidence;
-- - +/- 1% is rendered as stable in the collector UI;
-- - a recent consecutive-window move may publish earlier than in a liquid market
--   when the Release is discontinued/scarce, provided the recent window contains
--   multiple attributable sales (never a single isolated sale by itself);
-- - asks and discontinued status may strengthen market context but never invent
--   the trend percent or inflate Market Value.

-- 19201: two exact attributable sold units. Publish a preliminary sold-based
-- value but no trend: the two sales are too far apart to describe current direction.
with src as (
  select id from public.price_sources where slug='ebay_product_research'
)
insert into public.market_aggregate_observations (
  source_id, release_id, item_number, possible_release_ids, attribution_status,
  grain, period_start, period_end, condition, query_key, query_description,
  sales_count, seller_count, average_item_price, low_item_price, high_item_price,
  currency, market_average_eur, evidence_grade, raw_payload, captured_at
)
select
  src.id,
  '2af882f6-8c66-5508-9acd-2240aac287ad',
  '19201',
  array['2af882f6-8c66-5508-9acd-2240aac287ad'::uuid],
  'release_exact',
  'full_history',
  date '2024-05-08',
  date '2025-02-02',
  'new_complete_unbuilt',
  'ebay-pr:19201:dyna-hawk-scan:2026-09-10',
  'Exact Dyna-Hawk GX 19201 sold evidence from the 2026-09-10 family scan.',
  2, 2, 27.85, 21.36, 34.34,
  'EUR', 27.85, 'indicative',
  jsonb_build_object(
    'scan_date','2026-09-10',
    'source','eBay Seller Hub Product Research',
    'sales',jsonb_build_array(
      jsonb_build_object('date','2024-05-08','price_eur',21.36),
      jsonb_build_object('date','2025-02-02','price_eur',34.34)
    ),
    'observed_change_percent',60.77,
    'trend_status','insufficient_data',
    'excluded',jsonb_build_array(
      jsonb_build_object('price_eur',51.51,'reason','bundle with Shadow Breaker D-3'),
      jsonb_build_object('price_eur',14.60,'reason','incomplete kit; missing gears')
    )
  ),
  now()
from src
on conflict (source_id,query_key,period_start,period_end,item_number) do update set
  release_id=excluded.release_id,
  possible_release_ids=excluded.possible_release_ids,
  attribution_status=excluded.attribution_status,
  sales_count=excluded.sales_count,
  seller_count=excluded.seller_count,
  average_item_price=excluded.average_item_price,
  low_item_price=excluded.low_item_price,
  high_item_price=excluded.high_item_price,
  market_average_eur=excluded.market_average_eur,
  evidence_grade=excluded.evidence_grade,
  raw_payload=excluded.raw_payload,
  captured_at=excluded.captured_at,
  updated_at=now();

insert into public.market_release_signals (
  release_id,condition,market_regime,market_value_eur,low_eur,high_eur,
  confidence_score,confidence_label,retail_anchor_eur,active_anchor_eur,sold_anchor_eur,
  retail_source_count,active_offer_count,current_offer_count,sold_units,
  sold_source_count,sold_evidence_count,shipping_known_ratio,
  trend_percent,trend_window_months,algorithm_version,computed_at
) values (
  '2af882f6-8c66-5508-9acd-2240aac287ad','new_complete_unbuilt',
  'secondary_market_driven',27.85,21.36,34.34,
  34,'low',null,null,27.85,
  0,0,0,2,1,1,0,
  null,null,'r3',now()
)
on conflict (release_id,condition) do update set
  market_regime=excluded.market_regime,
  market_value_eur=excluded.market_value_eur,
  low_eur=excluded.low_eur,
  high_eur=excluded.high_eur,
  confidence_score=excluded.confidence_score,
  confidence_label=excluded.confidence_label,
  sold_anchor_eur=excluded.sold_anchor_eur,
  sold_units=excluded.sold_units,
  sold_source_count=excluded.sold_source_count,
  sold_evidence_count=excluded.sold_evidence_count,
  trend_percent=null,
  trend_window_months=null,
  algorithm_version='r3',
  computed_at=now();

-- 95000: preserve the exact sale as research evidence, but keep the public
-- headline unconsolidated because it is still only one attributable transaction.
with src as (
  select id from public.price_sources where slug='ebay_product_research'
)
insert into public.market_aggregate_observations (
  source_id, release_id, item_number, possible_release_ids, attribution_status,
  grain, period_start, period_end, condition, query_key, query_description,
  sales_count, seller_count, average_item_price, low_item_price, high_item_price,
  currency, market_average_eur, evidence_grade, raw_payload, captured_at
)
select
  src.id,
  '67423b20-d880-5e54-a83f-dc06dcba6f75',
  '95000',
  array['67423b20-d880-5e54-a83f-dc06dcba6f75'::uuid],
  'release_exact',
  'full_history',
  date '2026-08-04',
  date '2026-08-04',
  'new_complete_unbuilt',
  'ebay-pr:95000:dyna-hawk-scan:2026-09-10',
  'Exact Dyna-Hawk GX Black Special 95000 sale from the 2026-09-10 family scan.',
  1, 1, 29.66, 29.66, 29.66,
  'EUR', 29.66, 'indicative',
  jsonb_build_object(
    'scan_date','2026-09-10',
    'source','eBay Seller Hub Product Research',
    'sale',jsonb_build_object('date','2026-08-04','price_eur',29.66),
    'trend_status','insufficient_data',
    'publication_note','single attributable sale retained as evidence; public Market Value remains unconsolidated'
  ),
  now()
from src
on conflict (source_id,query_key,period_start,period_end,item_number) do update set
  release_id=excluded.release_id,
  possible_release_ids=excluded.possible_release_ids,
  attribution_status=excluded.attribution_status,
  sales_count=excluded.sales_count,
  seller_count=excluded.seller_count,
  average_item_price=excluded.average_item_price,
  low_item_price=excluded.low_item_price,
  high_item_price=excluded.high_item_price,
  market_average_eur=excluded.market_average_eur,
  evidence_grade=excluded.evidence_grade,
  raw_payload=excluded.raw_payload,
  captured_at=excluded.captured_at,
  updated_at=now();

-- 95467: retain the canonical 37-sale Market Value EUR 13.25, but publish the
-- recent directional signal from two consecutive, non-overlapping 3-month windows.
-- Recent 3m: 5 sales / EUR 74.61 = EUR 14.922 average.
-- Previous 3m is derived from the 6m aggregate: (174.21 - 74.61) / (13 - 5)
-- = EUR 12.45 across 8 sales. Relative movement = +19.8554%, stored as +19.86%.
update public.market_aggregate_observations
set raw_payload = coalesce(raw_payload,'{}'::jsonb) || jsonb_build_object(
      'scan_date','2026-09-10',
      'trend_evidence',jsonb_build_object(
        'method','consecutive_non_overlapping_3m_windows',
        'previous_window',jsonb_build_object(
          'from','2026-03-14','to','2026-06-11','sales_count',8,'average_eur',12.45
        ),
        'recent_window',jsonb_build_object(
          'from','2026-06-12','to','2026-09-10','sales_count',5,'average_eur',14.92
        ),
        'trend_percent',19.86,
        'trend_window_months',3,
        'classification','rising',
        'market_context',jsonb_build_object(
          'production_status','discontinued',
          'note','Sparse collector market: multiple recent attributable sales support an early directional signal; a single isolated sale alone would not.'
        )
      ),
      'recent_6m_range_eur',jsonb_build_object('min',12.45,'max',24.81),
      'annual_context',jsonb_build_object(
        'previous_year_average_eur',13.29,
        'latest_year_average_eur',13.30,
        'annual_change_percent',0.08,
        'long_run_change_percent',6.83
      )
    ),
    captured_at=now(),
    updated_at=now()
where release_id='ace0d1b1-aaf3-589a-977c-a3df07c83c73'
  and item_number='95467'
  and query_key='ebay-pr:95467:3y-new:2026-09-09';

update public.market_release_signals
set market_value_eur=13.25,
    low_eur=13.25,
    high_eur=13.25,
    sold_anchor_eur=13.25,
    sold_units=37,
    trend_percent=19.86,
    trend_window_months=3,
    algorithm_version='r3',
    computed_at=now()
where release_id='ace0d1b1-aaf3-589a-977c-a3df07c83c73'
  and condition='new_complete_unbuilt';

-- 94717 intentionally remains value-only: two attributable sales exist, but
-- there is no consecutive-window evidence supporting a current direction.
