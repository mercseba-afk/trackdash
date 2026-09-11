-- Avante Mk.II family + market audit (2026-09-11).
-- Source for market evidence: eBay Seller Hub Product Research, ALL marketplaces,
-- condition NEW, SOLD, three-year window. Shipping is retained only as source
-- context and is excluded from Market Value.
--
-- Family scope intentionally contains assembly kits only:
-- 18614 original, 94626 Black Special, 94716 V Special,
-- 95061 Pink Special (Clear Body), 95525 Asia Challenge 2020 Taiwan Final.
-- 94592 Finished Model remains outside the new_complete_unbuilt kit pipeline.
--
-- Trend interpretation keeps real completed sales intact. In particular the
-- EUR 72.26 fixed-price 95061 sale is NOT discarded as an outlier. Because it
-- sits in the previous annual window, it actually strengthens the raw decline.
-- The public 95061 trend uses fixed-price vs fixed-price annual windows so that
-- three recent auctions do not silently change the market-format composition.

-- ---------------------------------------------------------------------------
-- Catalog: exact assembly-kit Releases
-- ---------------------------------------------------------------------------

update public.product_releases
set rarity='Common',
    verification_status='verified',
    updated_at=now()
where id='5a123617-c84c-5012-ab20-1a9d493259e0';

insert into public.product_releases (
  id, product_id, item_number, release_type, edition_name, edition_type,
  release_year, release_date, chassis, barcode_jan, color, country_market,
  notes, discontinued, is_original, rarity, verification_status,
  production_status, status_checked_at
) values
  (
    'e7f6a362-9bac-53aa-8673-2fa308c50a17',
    '6dcb6511-5277-561f-a880-95ef828ce44f',
    '94626','Special Edition','Avante Mk.II Black Special','special',
    2007,date '2007-12-15','MS',null,
    'Black reinforced body / gray MS chassis / fluorescent orange wheels',
    'Japan / International',
    'Discontinued Black Special. No exact completed-sale result was observed in the audited 2023-09-11 to 2026-09-10 Product Research window; that zero-result window is not treated as proof of no market outside query coverage.',
    true,false,'Rare','verified','discontinued',now()
  ),
  (
    '6c1d4fcf-7265-5a61-9be9-795e27eec353',
    '6dcb6511-5277-561f-a880-95ef828ce44f',
    '94716','Limited Edition','Avante Mk.II V Special','limited',
    2009,date '2009-10-01','MS','4950344947164',
    'Violet metal-plated body / black MS chassis',
    'Japan',
    'Limited V Special. Zero exact completed-sale rows were observed in the audited three-year Product Research window; rarity reflects limited status, age and observed market scarcity, not an invented price.',
    false,false,'Rare','verified','unknown',null
  ),
  (
    'c819da54-1ebc-5a8b-a24f-77166cf70e8d',
    '6dcb6511-5277-561f-a880-95ef828ce44f',
    '95061','Clear Body','Avante Mk.II Pink Special (Clear Body)','special',
    2015,date '2015-05-02','MS','4950344950614',
    'Clear polycarbonate body / pink parts and wheels / white hard low-profile tires',
    'Japan / International',
    'Limited clear-body Pink Special. Thirteen exact sold units across nine sellers were observed in the audited three-year Product Research window.',
    false,false,'Uncommon','verified','unknown',null
  ),
  (
    '5489c586-0f2a-5393-9447-dcf36bed8f1a',
    '6dcb6511-5277-561f-a880-95ef828ce44f',
    '95525','Limited Edition','Avante Mk.II Asia Challenge 2020 Special (Taiwan Final)','limited',
    2020,null,'MS','4950344955251',
    'Asia Challenge 2020 Taiwan Final livery',
    'Taiwan / Asia Challenge',
    'Regional/event special associated with the Asia Challenge 2020 Finals in Taiwan. Exact release day remains intentionally unknown. Eighteen exact sold units were observed in the audited three-year Product Research window.',
    false,false,'Uncommon','verified','unknown',null
  )
on conflict (id) do update set
  product_id=excluded.product_id,
  item_number=excluded.item_number,
  release_type=excluded.release_type,
  edition_name=excluded.edition_name,
  edition_type=excluded.edition_type,
  release_year=excluded.release_year,
  release_date=excluded.release_date,
  chassis=excluded.chassis,
  barcode_jan=excluded.barcode_jan,
  color=excluded.color,
  country_market=excluded.country_market,
  notes=excluded.notes,
  discontinued=excluded.discontinued,
  is_original=excluded.is_original,
  rarity=excluded.rarity,
  verification_status=excluded.verification_status,
  production_status=excluded.production_status,
  status_checked_at=excluded.status_checked_at,
  updated_at=now();

insert into public.release_sources (
  id, release_id, source_type, source_url, verified_fields, checked_at, notes
) values
  (
    '3f684782-f1e4-5ec5-8b0c-e04b817e8c6f','5a123617-c84c-5012-ab20-1a9d493259e0',
    'official_manufacturer','https://www.tamiya.com/japan/products/18614/index.html',
    array['itemNumber','editionName','chassis','releaseYear','releaseDate'],date '2026-09-11',
    'Tamiya Japan identifies ITEM 18614 Avante Mk.II, MS chassis, released 2006-06-24; the current product record was updated in August 2026.'
  ),
  (
    '4bbf1cea-06ee-5f25-9938-8803eab9ddaf','e7f6a362-9bac-53aa-8673-2fa308c50a17',
    'official_manufacturer','https://www.tamiyausa.com/shop/132-pro/jr-pro-avante-mkii-black-sp/',
    array['itemNumber','editionName','chassis','productionStatus','color'],date '2026-09-11',
    'Tamiya USA identifies ITEM 94626 Avante Mk.II Black Special, MS chassis and explicitly marks it Discontinued.'
  ),
  (
    'b7f28a55-5319-5b36-97d7-5fb8a1fc4aff','e7f6a362-9bac-53aa-8673-2fa308c50a17',
    'trusted_secondary','https://www.jokerteam.it/wp-content/uploads/2018/01/Mini-4wd-Avante-History.pdf',
    array['releaseYear','releaseDate'],date '2026-09-11',
    'Avante history reference records the Black Special release date as 2007-12-15.'
  ),
  (
    'd96c1c38-0bce-56fe-9340-6f8f5f2a3a0b','6c1d4fcf-7265-5a61-9be9-795e27eec353',
    'trusted_secondary','https://www.1999.co.jp/10098463',
    array['itemNumber','barcodeJAN','editionName','chassis','color'],date '2026-09-11',
    'Hobby Search identifies ITEM 94716 / JAN 4950344947164 as Avante Mk.II V Special on MS chassis with violet plated body.'
  ),
  (
    '00ad9e48-7a75-545b-9782-69ced9f0384a','6c1d4fcf-7265-5a61-9be9-795e27eec353',
    'trusted_secondary','https://www.jokerteam.it/wp-content/uploads/2018/01/Mini-4wd-Avante-History.pdf',
    array['releaseYear','releaseDate'],date '2026-09-11',
    'Avante history reference records the V Special release date as 2009-10-01.'
  ),
  (
    '89c305cb-389c-5fd2-bb7a-02dacc783c72','c819da54-1ebc-5a8b-a24f-77166cf70e8d',
    'official_manufacturer','https://www.tamiya.com/japan/products/95061/index.html',
    array['itemNumber','editionName','chassis','releaseYear','releaseDate','color'],date '2026-09-11',
    'Tamiya Japan identifies ITEM 95061 Avante Mk.II Pink Special (Clear Body), MS chassis, released 2015-05-02 as a limited kit.'
  ),
  (
    '7ca5e0b1-97d9-5c69-a363-0d4614ba5bf8','5489c586-0f2a-5393-9447-dcf36bed8f1a',
    'trusted_secondary','https://www.rcjaz.co.uk/tamiya-95525-avante-mk-ii-asia-challenge-2020-special-ms-chassis-finals-in-taiwan-p-18352.html',
    array['itemNumber','barcodeJAN','editionName','chassis','releaseYear','countryMarket'],date '2026-09-11',
    'RCJAZ identifies Tamiya 95525 / GTIN 4950344955251 as Avante Mk.II Asia Challenge 2020 Special, MS chassis, Finals in Taiwan. Exact calendar release day remains unverified.'
  )
on conflict (id) do update set
  release_id=excluded.release_id,
  source_type=excluded.source_type,
  source_url=excluded.source_url,
  verified_fields=excluded.verified_fields,
  checked_at=excluded.checked_at,
  notes=excluded.notes;

-- ---------------------------------------------------------------------------
-- Market evidence: exact completed-sale Product Research aggregates
-- ---------------------------------------------------------------------------

with src as (
  select id from public.price_sources where slug='ebay_product_research'
)
insert into public.market_aggregate_observations (
  source_id, release_id, item_number, possible_release_ids, attribution_status,
  grain, period_start, period_end, condition, query_key, query_description,
  sales_count, seller_count, average_item_price, low_item_price, high_item_price,
  currency, market_average_eur, evidence_grade, provenance_url, raw_payload, captured_at
)
select
  src.id,'5a123617-c84c-5012-ab20-1a9d493259e0','18614',
  array['5a123617-c84c-5012-ab20-1a9d493259e0'::uuid],'release_exact',
  'full_history',date '2023-09-11',date '2026-07-01','new_complete_unbuilt',
  'ebay-pr:18614:avante-mkii-scan:2026-09-11',
  'Exact Avante Mk.II 18614 completed-sale aggregate from the 2026-09-11 family scan.',
  35,11,15.34,10.22,26.51,'EUR',15.34,'indicative',
  'https://www.ebay.it/sh/research?marketplace=ALL&keywords=Tamiya+18614&dayRange=1095&categoryId=0&conditionId=1000&tabName=SOLD&tz=Europe%2FRome',
  jsonb_build_object(
    'scan_dates',jsonb_build_array('2026-09-10','2026-09-11'),
    'query_period',jsonb_build_object('start','2023-09-11','end','2026-09-10'),
    'shipping_excluded',true,
    'last_sale','2026-07-01',
    'annual_windows',jsonb_build_array(
      jsonb_build_object('start','2023-09-11','end','2024-09-10','sales_count',19,'average_eur',15.5210526316),
      jsonb_build_object('start','2024-09-10','end','2025-09-10','sales_count',6,'average_eur',15.815),
      jsonb_build_object('start','2025-09-10','end','2026-09-10','sales_count',10,'average_eur',14.712)
    ),
    'observed_change_percent',-6.9743914006,
    'trend_status','not_published',
    'trend_reason','Recent annual mix differs by seller/shipping composition and the main repeated listing itself did not confirm the decline; liquid regular kit requires stronger directional evidence.',
    'excluded_titles',jsonb_build_array(
      'Cerezo Osaka different release','Burning Sun 18628','ambiguous 35 special title'
    )
  ),now()
from src
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
  currency=excluded.currency,
  market_average_eur=excluded.market_average_eur,
  evidence_grade=excluded.evidence_grade,
  provenance_url=excluded.provenance_url,
  raw_payload=excluded.raw_payload,
  captured_at=excluded.captured_at,
  updated_at=now();

with src as (
  select id from public.price_sources where slug='ebay_product_research'
)
insert into public.market_aggregate_observations (
  source_id, release_id, item_number, possible_release_ids, attribution_status,
  grain, period_start, period_end, condition, query_key, query_description,
  sales_count, seller_count, average_item_price, low_item_price, high_item_price,
  currency, market_average_eur, evidence_grade, provenance_url, raw_payload, captured_at
)
select
  src.id,'c819da54-1ebc-5a8b-a24f-77166cf70e8d','95061',
  array['c819da54-1ebc-5a8b-a24f-77166cf70e8d'::uuid],'release_exact',
  'full_history',date '2023-09-11',date '2026-08-31','new_complete_unbuilt',
  'ebay-pr:95061:avante-mkii-scan:2026-09-11',
  'Exact Avante Mk.II Pink Special 95061 completed-sale aggregate from the 2026-09-11 family scan.',
  13,9,34.76,13.94,72.26,'EUR',34.76,'indicative',
  'https://www.ebay.it/sh/research?marketplace=ALL&keywords=Tamiya+95061&dayRange=1095&categoryId=0&tabName=SOLD&tz=Europe%2FRome',
  jsonb_build_object(
    'scan_dates',jsonb_build_array('2026-09-10','2026-09-11'),
    'query_period',jsonb_build_object('start','2023-09-11','end','2026-09-10'),
    'shipping_excluded',true,
    'last_sale','2026-08-31',
    'accepted_fixed_price_sales',jsonb_build_array(33.40,33.40,20.52,39.49,42.92,30.05,35.06,72.26,29.84,56.55),
    'accepted_auction_sales',jsonb_build_array(18.83,25.63,13.94),
    'annual_all_format_windows',jsonb_build_array(
      jsonb_build_object('start','2023-09-11','end','2024-09-10','sales_count',4,'average_eur',29.3425),
      jsonb_build_object('start','2024-09-11','end','2025-09-10','sales_count',2,'average_eur',55.875),
      jsonb_build_object('start','2025-09-10','end','2026-09-10','sales_count',7,'average_eur',31.8242857143)
    ),
    'trend_evidence',jsonb_build_object(
      'method','consecutive_annual_fixed_price_windows',
      'previous_window',jsonb_build_object(
        'start','2024-09-11','end','2025-09-10','sales_count',2,'sales_eur',jsonb_build_array(39.49,72.26),'average_eur',55.875
      ),
      'recent_window',jsonb_build_object(
        'start','2025-09-10','end','2026-09-10','sales_count',4,'sales_eur',jsonb_build_array(35.06,56.55,42.92,29.84),'average_eur',41.0925
      ),
      'trend_percent',-26.46,
      'trend_window_months',12,
      'classification','falling',
      'note','The EUR 72.26 completed fixed-price sale is retained as valid evidence. Same-format comparison is used publicly so three recent auctions do not distort the format mix.'
    ),
    'sensitivity',jsonb_build_object(
      'all_format_yoy_percent',-43.0437839565,
      'recent_auction_mean_eur',19.4666666667,
      'previous_without_72_26_eur',39.49,
      'recent_fixed_price_mean_eur',41.0925,
      'change_without_72_26_percent',4.058001
    ),
    'excluded',jsonb_build_array(
      jsonb_build_object('reason','mixed lot 95060/95061/95062'),
      jsonb_build_object('reason','incomplete missing motor'),
      jsonb_build_object('reason','inconsistent title exact identity not verified')
    )
  ),now()
from src
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
  currency=excluded.currency,
  market_average_eur=excluded.market_average_eur,
  evidence_grade=excluded.evidence_grade,
  provenance_url=excluded.provenance_url,
  raw_payload=excluded.raw_payload,
  captured_at=excluded.captured_at,
  updated_at=now();

with src as (
  select id from public.price_sources where slug='ebay_product_research'
)
insert into public.market_aggregate_observations (
  source_id, release_id, item_number, possible_release_ids, attribution_status,
  grain, period_start, period_end, condition, query_key, query_description,
  sales_count, seller_count, average_item_price, low_item_price, high_item_price,
  currency, market_average_eur, evidence_grade, provenance_url, raw_payload, captured_at
)
select
  src.id,'5489c586-0f2a-5393-9447-dcf36bed8f1a','95525',
  array['5489c586-0f2a-5393-9447-dcf36bed8f1a'::uuid],'release_exact',
  'full_history',date '2023-09-11',date '2026-04-06','new_complete_unbuilt',
  'ebay-pr:95525:avante-mkii-scan:2026-09-11',
  'Exact Avante Mk.II Asia Challenge 2020 Special 95525 completed-sale aggregate from the 2026-09-11 family scan.',
  18,6,40.09,31.68,56.31,'EUR',40.09,'indicative',
  'https://www.ebay.it/sh/research?marketplace=ALL&keywords=Tamiya+95525&dayRange=1095&categoryId=0&conditionId=1000&tabName=SOLD&tz=Europe%2FRome',
  jsonb_build_object(
    'scan_dates',jsonb_build_array('2026-09-10','2026-09-11'),
    'query_period',jsonb_build_object('start','2023-09-11','end','2026-09-10'),
    'shipping_excluded',true,
    'last_sale','2026-04-06',
    'annual_windows',jsonb_build_array(
      jsonb_build_object('start','2023-09-11','end','2024-09-10','sales_count',9,'average_eur',37.9122222222),
      jsonb_build_object('start','2024-09-10','end','2025-09-10','sales_count',6,'average_eur',38.995),
      jsonb_build_object('start','2025-09-10','end','2026-09-10','sales_count',3,'average_eur',48.7866666667)
    ),
    'trend_evidence',jsonb_build_object(
      'method','consecutive_annual_all_exact_sales',
      'previous_window',jsonb_build_object('sales_count',6,'average_eur',38.995),
      'recent_window',jsonb_build_object('sales_count',3,'sales_eur',jsonb_build_array(42.84,56.31,47.21),'average_eur',48.7866666667),
      'trend_percent',25.11,
      'trend_window_months',12,
      'classification','rising',
      'note','Three recent attributable fixed-price sales support an early collector-market direction.'
    ),
    'sensitivity',jsonb_build_object(
      'recent_mean_without_highest_eur',45.025,
      'change_without_highest_percent',15.4635209642,
      'same_listing_change_percent',9.9025141098
    ),
    'excluded',jsonb_build_array(
      jsonb_build_object('reason','exact item not verified possible match'),
      jsonb_build_object('reason','truncated item number possible match')
    )
  ),now()
from src
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
  currency=excluded.currency,
  market_average_eur=excluded.market_average_eur,
  evidence_grade=excluded.evidence_grade,
  provenance_url=excluded.provenance_url,
  raw_payload=excluded.raw_payload,
  captured_at=excluded.captured_at,
  updated_at=now();

-- ---------------------------------------------------------------------------
-- Public R3 signals. Asking prices are not used. 94626 and 94716 deliberately
-- remain fail-closed: zero exact sold evidence does not justify a Market Value.
-- ---------------------------------------------------------------------------

insert into public.market_release_signals (
  release_id,condition,market_regime,market_value_eur,low_eur,high_eur,
  confidence_score,confidence_label,retail_anchor_eur,active_anchor_eur,sold_anchor_eur,
  starting_offer_candidate_id,starting_item_price_eur,starting_shipping_eur,
  starting_effective_cost_eur,starting_cost_basis,retail_source_count,
  active_offer_count,current_offer_count,sold_units,sold_source_count,
  sold_evidence_count,shipping_known_ratio,trend_percent,trend_window_months,
  algorithm_version,computed_at
) values
  (
    '5a123617-c84c-5012-ab20-1a9d493259e0','new_complete_unbuilt',
    'secondary_market_driven',15.34,10.22,26.51,
    68,'medium',null,null,15.34,
    null,null,null,null,null,0,0,0,35,1,1,0,
    null,null,'r3',now()
  ),
  (
    'c819da54-1ebc-5a8b-a24f-77166cf70e8d','new_complete_unbuilt',
    'secondary_market_driven',34.76,13.94,72.26,
    60,'medium',null,null,34.76,
    null,null,null,null,null,0,0,0,13,1,1,0,
    -26.46,12,'r3',now()
  ),
  (
    '5489c586-0f2a-5393-9447-dcf36bed8f1a','new_complete_unbuilt',
    'secondary_market_driven',40.09,31.68,56.31,
    62,'medium',null,null,40.09,
    null,null,null,null,null,0,0,0,18,1,1,0,
    25.11,12,'r3',now()
  )
on conflict (release_id,condition) do update set
  market_regime=excluded.market_regime,
  market_value_eur=excluded.market_value_eur,
  low_eur=excluded.low_eur,
  high_eur=excluded.high_eur,
  confidence_score=excluded.confidence_score,
  confidence_label=excluded.confidence_label,
  retail_anchor_eur=null,
  active_anchor_eur=null,
  sold_anchor_eur=excluded.sold_anchor_eur,
  starting_offer_candidate_id=null,
  starting_item_price_eur=null,
  starting_shipping_eur=null,
  starting_effective_cost_eur=null,
  starting_cost_basis=null,
  retail_source_count=0,
  active_offer_count=0,
  current_offer_count=0,
  sold_units=excluded.sold_units,
  sold_source_count=1,
  sold_evidence_count=1,
  shipping_known_ratio=0,
  trend_percent=excluded.trend_percent,
  trend_window_months=excluded.trend_window_months,
  algorithm_version='r3',
  computed_at=now();
