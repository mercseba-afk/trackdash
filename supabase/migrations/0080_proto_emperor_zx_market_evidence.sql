-- Proto Emperor ZX eBay Product Research evidence (2026-09-13).
--
-- IMPORTANT PUBLICATION SEMANTICS
-- The 95335 three-year mean is preserved as audited historical evidence but
-- market_average_eur is intentionally NULL. MarketR3Repository only promotes
-- aggregate rows with a non-null market_average_eur into current sold evidence,
-- so EUR 18.12 cannot accidentally become the current public Market Value.
--
-- 18038 has one New family-level sale that cannot distinguish the 1992 Original
-- from the 2007 Reissue. It is stored as ambiguous_release with both possible
-- Release IDs and therefore never contributes to either exact Release signal.
--
-- No zero-sale synthetic observations are inserted for 18038: the source schema
-- requires sales_count >= 1 and UNKNOWN/zero-result searches are not prices.

with src as (
  select id from public.price_sources where slug = 'ebay_product_research'
)
insert into public.market_aggregate_observations (
  source_id, release_id, item_number, possible_release_ids, attribution_status,
  grain, period_start, period_end, condition, query_key, query_description,
  sales_count, seller_count, average_item_price, low_item_price, high_item_price,
  average_shipping, currency, market_average_eur, evidence_grade,
  provenance_url, raw_payload, captured_at
)
select
  src.id,
  'f0614cb8-d0cb-521d-aa2c-4fc304f39430'::uuid,
  '95335',
  array['f0614cb8-d0cb-521d-aa2c-4fc304f39430'::uuid],
  'release_exact',
  'full_history',
  date '2023-09-14',
  date '2026-04-17',
  'new_complete_unbuilt',
  'ebay-pr:95335:proto-emperor-zx:2026-09-13',
  'Exact 95335 Proto Emperor ZX Premium 2017 Product Research history. 28 New units / 20 disjoint records. Historical evidence only; current Market Value deliberately not consolidated.',
  28,
  6,
  18.12,
  8.60,
  60.86,
  null,
  'EUR',
  null,
  'indicative',
  'https://www.ebay.it/sh/research?marketplace=ALL&keywords=Tamiya+95335&dayRange=1095&endDate=1789296208514&startDate=1694688208514&categoryId=0&offset=0&limit=50&tabName=SOLD&tz=Europe%2FRome',
  $json${"source":"eBay Product Research","scan_date":"2026-09-13","query_period":{"start":"2023-09-14","end":"2026-09-13"},"marketplace_scope":"all","condition":"New","shipping_excluded":true,"sales_count":28,"record_count":20,"single_unit_records":16,"monthly_three_unit_groups":4,"seller_count_reported":6,"average_item_price_eur":18.12,"low_item_price_eur":8.6,"high_item_price_eur":60.86,"median_eur":null,"last_sale":{"date":"2026-04-17","item_price_eur":60.86,"shipping_eur":10.14,"seller":"nippontrain"},"publication_eligible_for_current_market_value":false,"publication_reason":"Three-year eBay mean is historical evidence, not a current value. Recent sales are sparse, non-consecutive and concentrated in one seller; no sufficiently populated recent trend window.","trend_status":"not_published","historical_consecutive_window":{"months":["2024-03","2024-04","2024-05"],"sales_counts":[5,3,3],"reported_monthly_average_eur":[10.25,9.35,10.25],"interpretation":"historical_only_non_monotonic"},"recent_2026_context":[{"month":"2026-01","sales_count":1,"price_eur":40.16},{"month":"2026-02","sales_count":0,"price_eur":null},{"month":"2026-03","sales_count":1,"price_eur":51.05},{"month":"2026-04","sales_count":1,"price_eur":60.86}],"records":[{"record_id":"95335-2023-09-19","sold_date":"2023-09-25","last_sold_date":"2023-09-25","price_eur":9.9,"shipping_eur":7.75,"quantity":1,"record_type":"single_unit_sale","seller":null,"title":"Tamiya 95335 1/32 Mini 4WD Car Kit Super II Chassis JR Proto Emperor ZX Premium","listing_url":null,"transaction_dates_complete":true,"attribution_confidence":"high"},{"record_id":"95335-2023-10-17","sold_date":"","last_sold_date":"2023-10-15","price_eur":11.06,"shipping_eur":5.09,"quantity":3,"record_type":"monthly_listing_aggregate","seller":null,"title":"Tamiya 95335 1/32 Mini 4WD Kit Super II Chassis JR Proto Emperor ZX Premium","listing_url":null,"transaction_dates_complete":false,"attribution_confidence":"high"},{"record_id":"95335-2023-10-18","sold_date":"2023-10-26","last_sold_date":"2023-10-26","price_eur":9.9,"shipping_eur":9.04,"quantity":1,"record_type":"single_unit_sale","seller":null,"title":"Tamiya 95335 1/32 Mini 4WD Car Kit Super II Chassis JR Proto Emperor ZX Premium","listing_url":null,"transaction_dates_complete":true,"attribution_confidence":"high"},{"record_id":"95335-2024-01-16","sold_date":"2024-01-10","last_sold_date":"2024-01-10","price_eur":9.56,"shipping_eur":7.75,"quantity":1,"record_type":"single_unit_sale","seller":null,"title":"1/32 MINI 4WD LIMITED Proto Emperor ZX Premium Super II S2 Chassis 95335","listing_url":null,"transaction_dates_complete":true,"attribution_confidence":"high"},{"record_id":"95335-2024-01-15","sold_date":"","last_sold_date":"2024-01-19","price_eur":13.13,"shipping_eur":10.55,"quantity":3,"record_type":"monthly_listing_aggregate","seller":null,"title":"Tamiya 95335 1/32 Mini 4WD Car Kit Super II Chassis JR Proto Emperor ZX Premium","listing_url":null,"transaction_dates_complete":false,"attribution_confidence":"high"},{"record_id":"95335-2024-02-14","sold_date":"2024-02-07","last_sold_date":"2024-02-07","price_eur":9.9,"shipping_eur":9.04,"quantity":1,"record_type":"single_unit_sale","seller":null,"title":"Tamiya 95335 1/32 Mini 4WD Car Kit Super II Chassis JR Proto Emperor ZX Premium","listing_url":null,"transaction_dates_complete":true,"attribution_confidence":"high"},{"record_id":"95335-2024-03-12","sold_date":"2024-03-07","last_sold_date":"2024-03-07","price_eur":12.08,"shipping_eur":7.75,"quantity":1,"record_type":"single_unit_sale","seller":null,"title":"Tamiya 95335 1/32 Mini 4WD Car Kit Super II Chassis JR Proto Emperor ZX Premium","listing_url":null,"transaction_dates_complete":true,"attribution_confidence":"high"},{"record_id":"95335-2024-03-13","sold_date":"2024-03-13","last_sold_date":"2024-03-13","price_eur":11.66,"shipping_eur":7.75,"quantity":1,"record_type":"single_unit_sale","seller":null,"title":"1/32 MINI 4WD LIMITED Proto Emperor ZX Premium Super II S2 Chassis 95335","listing_url":null,"transaction_dates_complete":true,"attribution_confidence":"high"},{"record_id":"95335-2024-03-11","sold_date":"","last_sold_date":"2024-03-30","price_eur":9.18,"shipping_eur":9.46,"quantity":3,"record_type":"monthly_listing_aggregate","seller":null,"title":"Tamiya 1/32 Mini 4WD JR Proto-Emperor ZX Premium Super II Chassis Set #95335","listing_url":null,"transaction_dates_complete":false,"attribution_confidence":"high"},{"record_id":"95335-2024-04-9","sold_date":"2024-04-01","last_sold_date":"2024-04-01","price_eur":8.6,"shipping_eur":9.46,"quantity":1,"record_type":"single_unit_sale","seller":null,"title":"Tamiya 1/32 Mini 4WD JR Proto-Emperor ZX Premium Super II Chassis Set #95335","listing_url":null,"transaction_dates_complete":true,"attribution_confidence":"high"},{"record_id":"95335-2024-04-10","sold_date":"2024-04-11","last_sold_date":"2024-04-11","price_eur":9.56,"shipping_eur":7.75,"quantity":1,"record_type":"single_unit_sale","seller":null,"title":"1/32 MINI 4WD LIMITED Proto Emperor ZX Premium Super II S2 Chassis 95335","listing_url":null,"transaction_dates_complete":true,"attribution_confidence":"high"},{"record_id":"95335-2024-04-8","sold_date":"2024-04-22","last_sold_date":"2024-04-22","price_eur":9.9,"shipping_eur":7.75,"quantity":1,"record_type":"single_unit_sale","seller":null,"title":"Tamiya 95335 1/32 Mini 4WD Car Kit Super II Chassis JR Proto Emperor ZX Premium","listing_url":null,"transaction_dates_complete":true,"attribution_confidence":"high"},{"record_id":"95335-2024-05-7","sold_date":"","last_sold_date":"2024-05-23","price_eur":10.25,"shipping_eur":11.62,"quantity":3,"record_type":"monthly_listing_aggregate","seller":null,"title":"1/32 MINI 4WD LIMITED Proto Emperor ZX Premium Super II S2 Chassis 95335","listing_url":null,"transaction_dates_complete":false,"attribution_confidence":"high"},{"record_id":"95335-2024-06-6","sold_date":"2024-06-01","last_sold_date":"2024-06-01","price_eur":8.6,"shipping_eur":9.46,"quantity":1,"record_type":"single_unit_sale","seller":null,"title":"Tamiya 1/32 Mini 4WD JR Proto-Emperor ZX Premium Super II Chassis Set #95335","listing_url":null,"transaction_dates_complete":true,"attribution_confidence":"high"},{"record_id":"95335-2024-10-5","sold_date":"2024-10-20","last_sold_date":"2024-10-20","price_eur":43.38,"shipping_eur":10.76,"quantity":1,"record_type":"single_unit_sale","seller":"nippontrain","title":"Tamiya 95335 Mini 4WD PROTO EMPEROR ZX PREMIUM (SUPER-II CHASSIS) 1/32","listing_url":"https://www.ebay.it/itm/375229664267?nordt=true&orig_cvip=true&rt=nc","transaction_dates_complete":true,"attribution_confidence":"high"},{"record_id":"95335-2025-02-4","sold_date":"2025-02-23","last_sold_date":"2025-02-23","price_eur":43.05,"shipping_eur":0,"quantity":1,"record_type":"single_unit_sale","seller":null,"title":"Tamiya 1/32 Mini 4WD JR Proto-Emperor ZX Premium Super II Chassis Set #95335","listing_url":null,"transaction_dates_complete":true,"attribution_confidence":"high"},{"record_id":"95335-2025-10-3","sold_date":"2025-10-19","last_sold_date":"2025-10-19","price_eur":38.13,"shipping_eur":2.51,"quantity":1,"record_type":"single_unit_sale","seller":"nippontrain","title":"Tamiya 95335 Mini 4WD PROTO EMPEROR ZX PREMIUM (SUPER-II CHASSIS) 1/32","listing_url":"https://www.ebay.it/itm/375229664267?nordt=true&orig_cvip=true&rt=nc","transaction_dates_complete":true,"attribution_confidence":"high"},{"record_id":"95335-2026-01-1","sold_date":"2026-01-09","last_sold_date":"2026-01-09","price_eur":40.16,"shipping_eur":9.03,"quantity":1,"record_type":"single_unit_sale","seller":"nippontrain","title":"Tamiya 95335 Mini 4WD PROTO EMPEROR ZX PREMIUM (SUPER-II CHASSIS) 1/32","listing_url":"https://www.ebay.it/itm/375229664267?nordt=true&orig_cvip=true&rt=nc","transaction_dates_complete":true,"attribution_confidence":"high"},{"record_id":"95335-2026-03-2","sold_date":"2026-03-24","last_sold_date":"2026-03-24","price_eur":51.05,"shipping_eur":9.96,"quantity":1,"record_type":"single_unit_sale","seller":"nippontrain","title":"Tamiya 95335 Mini 4WD PROTO EMPEROR ZX PREMIUM (SUPER-II CHASSIS) 1/32","listing_url":"https://www.ebay.it/itm/375229664267?nordt=true&orig_cvip=true&rt=nc","transaction_dates_complete":true,"attribution_confidence":"high"},{"record_id":"95335-2026-04-20","sold_date":"2026-04-17","last_sold_date":"2026-04-17","price_eur":60.86,"shipping_eur":10.14,"quantity":1,"record_type":"single_unit_sale","seller":"nippontrain","title":"Tamiya 95335 Mini 4WD PROTO EMPEROR ZX PREMIUM (SUPER-II CHASSIS) 1/32","listing_url":"https://www.ebay.it/itm/375229664267?nordt=true&orig_cvip=true&rt=nc","transaction_dates_complete":true,"attribution_confidence":"high"}],"notes":["Do not expand monthly listing aggregates into synthetic individual transactions.","Original currency and FX rate were not exposed by Product Research.","Marketplace origin is unknown; ebay.it was only the research portal.","The 2017 release year identifies the requested Release, not each box production date."]}$json$::jsonb,
  timestamptz '2026-09-13 13:00:00+02'
from src
on conflict (source_id, query_key, period_start, period_end, item_number) do update set
  release_id = excluded.release_id,
  possible_release_ids = excluded.possible_release_ids,
  attribution_status = excluded.attribution_status,
  grain = excluded.grain,
  condition = excluded.condition,
  query_description = excluded.query_description,
  sales_count = excluded.sales_count,
  seller_count = excluded.seller_count,
  average_item_price = excluded.average_item_price,
  low_item_price = excluded.low_item_price,
  high_item_price = excluded.high_item_price,
  average_shipping = excluded.average_shipping,
  currency = excluded.currency,
  market_average_eur = excluded.market_average_eur,
  evidence_grade = excluded.evidence_grade,
  provenance_url = excluded.provenance_url,
  raw_payload = excluded.raw_payload,
  captured_at = excluded.captured_at,
  updated_at = now();

with src as (
  select id from public.price_sources where slug = 'ebay_product_research'
)
insert into public.market_aggregate_observations (
  source_id, release_id, item_number, possible_release_ids, attribution_status,
  grain, period_start, period_end, condition, query_key, query_description,
  sales_count, seller_count, average_item_price, low_item_price, high_item_price,
  average_shipping, currency, market_average_eur, evidence_grade,
  provenance_url, raw_payload, captured_at
)
select
  src.id,
  null,
  '18038',
  array[
    '83e6ea7d-aa3d-5524-b640-73c407ee272a'::uuid,
    '4d5b0a9a-498f-51fc-accd-9316ca11c843'::uuid
  ],
  'ambiguous_release',
  'full_history',
  date '2024-10-19',
  date '2024-10-19',
  'new_complete_unbuilt',
  'ebay-pr:18038:proto-emperor-zx-ambiguous:2026-09-13',
  'Family-level Proto Emperor ZX New sale. Packaging is compatible with item 18038 but cannot distinguish 1992 Original from 2007 Reissue; excluded from exact Release statistics.',
  1,
  null,
  102.92,
  102.92,
  102.92,
  0,
  'EUR',
  null,
  'indicative',
  'https://www.ebay.it/sh/research?marketplace=ALL&keywords=Tamiya+Proto+Emperor+ZX&dayRange=1095&endDate=1789296938839&startDate=1694688938839&categoryId=0&conditionId=1000&offset=0&limit=50&tabName=SOLD&tz=Europe%2FRome',
  $json${"source":"eBay Product Research","scan_date":"2026-09-13","query_period":{"start":"2023-09-14","end":"2026-09-13"},"marketplace_scope":"all","condition":"New","shipping_excluded":true,"record":{"sold_date":"2024-10-19","price_eur":102.92,"shipping_eur":0,"quantity":1,"title":"mini 4wd tamiya Proto Emperor ZX","attribution_confidence":"low","attribution_reason":"Ricerca per nome in condizione Nuovo. Foto ingrandita: scatola PROTO-EMPEROR ZX Racing Mini 4WD Series No.38, kit viola con parti su sprue, senza dicitura Premium. Compatibile con 18038; nessun JAN/barcode o anno visibile permette di distinguere 1992 da 2007. Non attribuita a nessuna delle due Release.","item_number_basis":"Inferred from visible Series No.38 non-Premium packaging; number not in listing title"},"possible_release_years":[1992,2007],"release_resolution":"ambiguous","exclude_from_release_statistics":true,"exclude_from_market_value":true,"exclude_from_trend":true,"zero_result_checks":[{"query":"Tamiya 18038","condition":"New","result":"no sold items found"},{"query":"4950344997107","condition":"New","result":"no sold items found"}],"notes":"Observed explicit 18038 rows in Product Research were Used and therefore excluded from the new_complete_unbuilt dataset."}$json$::jsonb,
  timestamptz '2026-09-13 13:00:00+02'
from src
on conflict (source_id, query_key, period_start, period_end, item_number) do update set
  release_id = excluded.release_id,
  possible_release_ids = excluded.possible_release_ids,
  attribution_status = excluded.attribution_status,
  grain = excluded.grain,
  condition = excluded.condition,
  query_description = excluded.query_description,
  sales_count = excluded.sales_count,
  seller_count = excluded.seller_count,
  average_item_price = excluded.average_item_price,
  low_item_price = excluded.low_item_price,
  high_item_price = excluded.high_item_price,
  average_shipping = excluded.average_shipping,
  currency = excluded.currency,
  market_average_eur = excluded.market_average_eur,
  evidence_grade = excluded.evidence_grade,
  provenance_url = excluded.provenance_url,
  raw_payload = excluded.raw_payload,
  captured_at = excluded.captured_at,
  updated_at = now();

-- Deliberately no market_release_signals write here.
-- Until fresh corroborating evidence qualifies under Market Method v2, all three
-- Proto Emperor ZX Releases remain fail-closed with no public Market Value.
