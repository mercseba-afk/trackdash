-- Market Method v2: current-value windows and method versioning.
--
-- v2 separates "historical average" from "estimated current value".
-- A qualifying recent sold window supersedes the broader history from the SAME
-- source for the current headline, while the broad observation remains stored.
-- Asking prices and out-of-stock retail pages do not manufacture Market Value.
--
-- The rows below are not new sales. They are current windows already present in
-- the reviewed eBay Product Research scans and are materialized here so the
-- generic R3 engine can use them without parsing report-specific raw_payload.

alter table public.market_release_signals
  add column if not exists market_method_version text not null default 'v2';

alter table public.market_release_monthly_signals
  add column if not exists market_method_version text not null default 'v2';

with src as (
  select id from public.price_sources where slug='ebay_product_research'
), windows(release_id,item_number,period_start,period_end,sales_count,avg_eur,query_key,description) as (
  values
    ('ace0d1b1-aaf3-589a-977c-a3df07c83c73'::uuid,'95467',date '2026-06-12',date '2026-08-20',5,14.922::numeric,'ebay-pr:95467:current-window:v2:2026-09-11','Recent 3-month exact sold window from the reviewed Dyna-Hawk 95467 Product Research scan.'),
    ('c819da54-1ebc-5a8b-a24f-77166cf70e8d'::uuid,'95061',date '2025-09-10',date '2026-08-31',7,31.8242857143::numeric,'ebay-pr:95061:current-window:v2:2026-09-11','Recent all-format exact sold window from the reviewed Avante Mk.II Pink Special 95061 Product Research scan.'),
    ('5489c586-0f2a-5393-9447-dcf36bed8f1a'::uuid,'95525',date '2025-09-10',date '2026-04-06',3,48.7866666667::numeric,'ebay-pr:95525:current-window:v2:2026-09-11','Recent exact sold window from the reviewed Avante Mk.II Taiwan Final 95525 Product Research scan.'),
    ('5a123617-c84c-5012-ab20-1a9d493259e0'::uuid,'18614',date '2025-09-10',date '2026-07-01',10,14.712::numeric,'ebay-pr:18614:current-window:v2:2026-09-11','Recent exact sold window from the reviewed Avante Mk.II 18614 Product Research scan.')
)
insert into public.market_aggregate_observations (
  source_id,release_id,item_number,possible_release_ids,attribution_status,
  grain,period_start,period_end,condition,query_key,query_description,
  sales_count,seller_count,average_item_price,currency,market_average_eur,
  evidence_grade,raw_payload,captured_at
)
select
  src.id,
  windows.release_id,
  windows.item_number,
  array[windows.release_id],
  'release_exact',
  'rolling_window',
  windows.period_start,
  windows.period_end,
  'new_complete_unbuilt',
  windows.query_key,
  windows.description,
  windows.sales_count,
  null,
  windows.avg_eur,
  'EUR',
  windows.avg_eur,
  'indicative',
  jsonb_build_object(
    'method','market_method_v2_current_window',
    'source_scan','reviewed_eBay_Product_Research',
    'shipping_excluded',true,
    'note','Materialized from already-reviewed chronological scan evidence; no sales invented or duplicated.'
  ),
  now()
from src cross join windows
on conflict (source_id,query_key,period_start,period_end,item_number) do update set
  release_id=excluded.release_id,
  possible_release_ids=excluded.possible_release_ids,
  attribution_status=excluded.attribution_status,
  grain=excluded.grain,
  sales_count=excluded.sales_count,
  average_item_price=excluded.average_item_price,
  currency=excluded.currency,
  market_average_eur=excluded.market_average_eur,
  evidence_grade=excluded.evidence_grade,
  raw_payload=excluded.raw_payload,
  captured_at=excluded.captured_at,
  updated_at=now();

-- Shadow-reviewed v2 headlines for the known benchmark set.
-- Trend remains the independently reviewed chronological trend; current value
-- now uses the qualifying recent sold window where one exists.
update public.market_release_signals
set market_value_eur=14.92,
    low_eur=14.92,
    high_eur=14.92,
    sold_anchor_eur=14.92,
    sold_units=5,
    sold_source_count=1,
    sold_evidence_count=1,
    confidence_score=56,
    confidence_label='medium',
    market_method_version='v2',
    computed_at=now()
where release_id='ace0d1b1-aaf3-589a-977c-a3df07c83c73'
  and condition='new_complete_unbuilt';

update public.market_release_signals
set market_value_eur=31.82,
    low_eur=31.82,
    high_eur=31.82,
    sold_anchor_eur=31.82,
    sold_units=7,
    sold_source_count=1,
    sold_evidence_count=1,
    confidence_score=58,
    confidence_label='medium',
    market_method_version='v2',
    computed_at=now()
where release_id='c819da54-1ebc-5a8b-a24f-77166cf70e8d'
  and condition='new_complete_unbuilt';

update public.market_release_signals
set market_value_eur=48.79,
    low_eur=48.79,
    high_eur=48.79,
    sold_anchor_eur=48.79,
    sold_units=3,
    sold_source_count=1,
    sold_evidence_count=1,
    confidence_score=48,
    confidence_label='low',
    market_method_version='v2',
    computed_at=now()
where release_id='5489c586-0f2a-5393-9447-dcf36bed8f1a'
  and condition='new_complete_unbuilt';

update public.market_release_signals
set market_value_eur=14.71,
    low_eur=14.71,
    high_eur=14.71,
    sold_anchor_eur=14.71,
    sold_units=10,
    sold_source_count=1,
    sold_evidence_count=1,
    confidence_score=60,
    confidence_label='medium',
    market_method_version='v2',
    computed_at=now()
where release_id='5a123617-c84c-5012-ab20-1a9d493259e0'
  and condition='new_complete_unbuilt';

-- Sparse single-sale release stays fail-closed under v2.
update public.market_release_signals
set market_value_eur=null,
    low_eur=null,
    high_eur=null,
    market_method_version='v2',
    computed_at=now()
where release_id='67423b20-d880-5e54-a83f-dc06dcba6f75'
  and condition='new_complete_unbuilt';

-- All other existing signals now explicitly identify the frozen publication method.
update public.market_release_signals
set market_method_version='v2'
where market_method_version is distinct from 'v2';

update public.market_release_monthly_signals
set market_method_version='v2'
where market_method_version is distinct from 'v2';
