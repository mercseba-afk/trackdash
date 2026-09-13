-- DASH-X1 Proto-Emperor family + eBay Product Research audit (2026-09-13).
-- Complete unbuilt kits only: 92063 body set remains outside this pipeline.
-- 94708 (2009 VS) and the 2023 Sanfrecce Hiroshima collaboration are modeled
-- as distinct Releases. Hiroshima reuses observed base kit / MPN 18074; no
-- autonomous Tamiya Item Number is claimed.
--
-- eBay Product Research: ALL marketplaces, New, Sold, 2023-09-14..2026-09-13.
-- Shipping is context only and is excluded from Market Value.
-- Market Method v2 uses the latest qualifying rolling sold window; annual
-- observations are NOT published as R3 trend because R3 trend requires current
-- consecutive complete calendar-month evidence.

begin;

-- ---------------------------------------------------------------------------
-- Catalog: exact Releases
-- ---------------------------------------------------------------------------

insert into public.product_releases (
  id, product_id, item_number, release_type, edition_name, edition_type,
  release_year, release_date, chassis, barcode_jan, color, country_market,
  notes, discontinued, is_original, rarity, verification_status,
  production_status, status_checked_at, description, description_it
) values
  (
    '593d8ef0-21ab-52c4-b8dc-15bf726c955a',
    '1acf7850-c8a9-5627-b104-54db6e235ba2',
    '94708','Limited Edition','DASH-X1 Proto-Emperor (VS Chassis)','limited',
    2009,date '2009-11-28','VS','4950344947089',
    'Purple body / black reinforced VS chassis / silver-plated large-diameter narrow wheels',
    'Japan',
    'First complete-kit commercial Release of DASH-X1 Proto-Emperor in TrackDash. The earlier 92063 product is a body set and remains outside the complete-kit catalog. No exact sold result was observed in the audited 2023-09-14 to 2026-09-13 eBay Product Research window.',
    true,true,null,'verified','discontinued',date '2026-09-13',
    'Limited 2009 complete-kit release of DASH-X1 Proto-Emperor on the VS chassis.',
    'Edizione limitata completa del 2009 della DASH-X1 Proto-Emperor su telaio VS.'
  ),
  (
    '2928fbca-b220-5d72-9b03-417ab13a70d8',
    '1acf7850-c8a9-5627-b104-54db6e235ba2',
    '18074','Special Edition','DASH-X1 Proto-Emperor Premium — Sanfrecce Hiroshima Special Edition','special',
    2023,date '2023-07-08','Super II',null,
    'Sanfrecce Hiroshima FC collaboration livery',
    'Japan / Sanfrecce Hiroshima',
    'Official Sanfrecce Hiroshima collaboration sold from 2023-07-08. eBay sold evidence reports base kit / MPN 18074 and barcode 4570105151298, but no autonomous Tamiya Item Number has been confirmed; TrackDash therefore keeps 18074 as the base-kit identity and models the collaboration as a distinct Release.',
    false,false,null,'verified','unknown',date '2026-09-13',
    '2023 Sanfrecce Hiroshima collaboration edition based on the DASH-X1 Proto-Emperor Premium / Super-II platform.',
    'Edizione collaborazione Sanfrecce Hiroshima 2023 basata sulla DASH-X1 Proto-Emperor Premium / piattaforma Super-II.'
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
  description=excluded.description,
  description_it=excluded.description_it,
  updated_at=now();

-- 18074 remains the regular 2013 Premium, but no longer represents the
-- historical original complete-kit occurrence of the family.
update public.product_releases
set is_original=false,
    edition_type='premium',
    updated_at=now()
where id='0226dfa5-5e29-5557-b134-ddbad7682e28';

update public.products
set canonical_item_number='94708',
    canonical_release_id='593d8ef0-21ab-52c4-b8dc-15bf726c955a',
    chassis='VS',
    original_release_year=2009,
    description='DASH-X1 Proto-Emperor first appeared as a complete Mini 4WD kit in 2009 on the VS chassis (94708), followed by the 2013 Super-II Premium (18074), the 2019 Black Special (95450), and a distinct 2023 Sanfrecce Hiroshima collaboration based on 18074.',
    description_it='DASH-X1 Proto-Emperor debuttò come kit Mini 4WD completo nel 2009 su telaio VS (94708), seguita dalla Premium Super-II del 2013 (18074), dalla Black Special del 2019 (95450) e da una distinta collaborazione Sanfrecce Hiroshima del 2023 basata sulla 18074.',
    updated_at=now()
where id='1acf7850-c8a9-5627-b104-54db6e235ba2';

insert into public.release_sources (
  id, release_id, source_type, source_url, verified_fields, checked_at, notes
) values
  (
    'd5cfdb11-da94-57b1-937e-e09cd2b616f7',
    '593d8ef0-21ab-52c4-b8dc-15bf726c955a',
    'trusted_secondary','https://www.1999.co.jp/10099017',
    array['itemNumber','barcodeJAN','editionName','chassis']::text[],date '2026-09-13',
    'Hobby Search identifies Tamiya item 94708 / JAN 4950344947089 as DASH-X1 Proto-Emperor on the VS chassis.'
  ),
  (
    '84b8163a-80f8-5371-b66f-1e5e5e7aa311',
    '593d8ef0-21ab-52c4-b8dc-15bf726c955a',
    'trusted_secondary','https://kakaku.com/item/K0000362804/',
    array['itemNumber','editionName','releaseDate','releaseYear']::text[],date '2026-09-13',
    'Kakaku product history records item 94708 with release date 2009-11-28.'
  ),
  (
    '05209eaf-edff-59f9-bb98-b55509c2869a',
    '2928fbca-b220-5d72-9b03-417ab13a70d8',
    'trusted_secondary','https://www.sanfrecce.co.jp/news/goods/8780',
    array['editionName','releaseDate','releaseYear','countryMarket']::text[],date '2026-09-13',
    'Official Sanfrecce Hiroshima product announcement dated 2023-07-05 lists PROTO-EMPEROR among three Mini 4WD products for sale at the 2023-07-08 match, priced at JPY 2,750. It does not establish an autonomous Tamiya Item Number.'
  )
on conflict (id) do update set
  release_id=excluded.release_id,
  source_type=excluded.source_type,
  source_url=excluded.source_url,
  verified_fields=excluded.verified_fields,
  checked_at=excluded.checked_at,
  notes=excluded.notes;

-- ---------------------------------------------------------------------------
-- Product Research full-history evidence.
-- ---------------------------------------------------------------------------

with src as (select id from public.price_sources where slug='ebay_product_research')
insert into public.market_aggregate_observations (
  source_id,release_id,item_number,possible_release_ids,attribution_status,
  grain,period_start,period_end,condition,query_key,query_description,
  sales_count,seller_count,average_item_price,low_item_price,high_item_price,
  average_shipping,currency,market_average_eur,evidence_grade,
  provenance_url,raw_payload,captured_at
)
select
  src.id,'0226dfa5-5e29-5557-b134-ddbad7682e28'::uuid,'18074',
  array['0226dfa5-5e29-5557-b134-ddbad7682e28'::uuid],'release_exact',
  'full_history',date '2023-09-14',date '2026-08-30','new_complete_unbuilt',
  'ebay-pr:18074:dash-x1-proto-emperor-standard:3y:2026-09-13',
  'Exact 18074 standard Premium sold history. Sanfrecce Hiroshima rows, Neo-Tridagger mismatches and mixed 80-piece lots excluded.',
  60,17,16.64,10.25,29.14,4.792,'EUR',16.64,'indicative',
  'https://www.ebay.it/sh/research?marketplace=ALL&keywords=Tamiya+Proto+Emperor+18074&dayRange=1095&endDate=1789331150756&startDate=1694723150756&categoryId=0&excludedListings=166247306962&offset=0&limit=50&tabName=SOLD&tz=Europe%2FRome',
  jsonb_build_object(
    'source','Authenticated eBay Seller Hub Product Research','scan_date','2026-09-13',
    'query_period',jsonb_build_object('start','2023-09-14','end','2026-09-13'),
    'shipping_excluded',true,'listing_rows',29,
    'last_sale',jsonb_build_object('date','2026-08-30','price_eur',24.84),'median_eur',null,
    'annual_windows',jsonb_build_array(
      jsonb_build_object('start','2023-09-14','end','2024-09-13','units',24,'average_eur',16.2091666667),
      jsonb_build_object('start','2024-09-14','end','2025-09-13','units',17,'average_eur',16.3058823529),
      jsonb_build_object('start','2025-09-14','end','2026-09-13','units',19,'average_eur',17.4889473684)),
    'observed_annual_change_pct',7.2554492291,
    'trend_assessment','medium_support_annual_only_not_r3_monthly_trend',
    'exclusions',jsonb_build_array('Sanfrecce Hiroshima edition','Neo-Tridagger title/MPN conflicts','mixed 80-piece lots'),
    'known_anomaly','Listing 285131307218 detail page and Product Research disagree on last-sale detail; no unreconciled sale added.'),
  timestamptz '2026-09-13 22:30:00+02'
from src
on conflict (source_id,query_key,period_start,period_end,item_number) do update set
  release_id=excluded.release_id,possible_release_ids=excluded.possible_release_ids,
  attribution_status=excluded.attribution_status,grain=excluded.grain,condition=excluded.condition,
  query_description=excluded.query_description,sales_count=excluded.sales_count,
  seller_count=excluded.seller_count,average_item_price=excluded.average_item_price,
  low_item_price=excluded.low_item_price,high_item_price=excluded.high_item_price,
  average_shipping=excluded.average_shipping,currency=excluded.currency,
  market_average_eur=excluded.market_average_eur,evidence_grade=excluded.evidence_grade,
  provenance_url=excluded.provenance_url,raw_payload=excluded.raw_payload,
  captured_at=excluded.captured_at,updated_at=now();

with src as (select id from public.price_sources where slug='ebay_product_research')
insert into public.market_aggregate_observations (
  source_id,release_id,item_number,possible_release_ids,attribution_status,
  grain,period_start,period_end,condition,query_key,query_description,
  sales_count,seller_count,average_item_price,low_item_price,high_item_price,
  average_shipping,currency,market_average_eur,evidence_grade,
  provenance_url,raw_payload,captured_at
)
select
  src.id,'6168c423-9f3e-5495-9a1d-06185ea7fa34'::uuid,'95450',
  array['6168c423-9f3e-5495-9a1d-06185ea7fa34'::uuid],'release_exact',
  'full_history',date '2023-09-14',date '2026-08-10','new_complete_unbuilt',
  'ebay-pr:95450:dash-x1-proto-emperor-black:3y:2026-09-13',
  'Exact 95450 Black Special sold history.',
  25,6,13.98,11.02,21.52,7.2016,'EUR',13.98,'indicative',
  'https://www.ebay.it/sh/research?marketplace=ALL&keywords=Tamiya+95450&dayRange=1095&endDate=1789331847865&startDate=1694723847865&categoryId=0&offset=0&limit=50&tabName=SOLD&tz=Europe%2FRome',
  jsonb_build_object(
    'source','Authenticated eBay Seller Hub Product Research','scan_date','2026-09-13',
    'query_period',jsonb_build_object('start','2023-09-14','end','2026-09-13'),
    'shipping_excluded',true,'listing_rows',9,
    'last_sale',jsonb_build_object('date','2026-08-10','price_eur',11.62),'median_eur',null,
    'annual_windows',jsonb_build_array(
      jsonb_build_object('start','2023-09-14','end','2024-09-13','units',11,'average_eur',14.4745454545),
      jsonb_build_object('start','2024-09-14','end','2025-09-13','units',7,'average_eur',14.4842857143),
      jsonb_build_object('start','2025-09-14','end','2026-09-13','units',7,'average_eur',12.72)),
    'observed_annual_change_pct',-12.1806884308,
    'recent_seller_concentration',jsonb_build_object(
      'recent_units',7,'recent_sellers',1,'listing_id','132887926253',
      'same_listing_previous_mean_eur',12.90,'same_listing_recent_mean_eur',12.72,
      'same_listing_change_pct',-1.3953488372),
    'trend_assessment','weak_composition_sensitive_not_r3_monthly_trend'),
  timestamptz '2026-09-13 22:30:00+02'
from src
on conflict (source_id,query_key,period_start,period_end,item_number) do update set
  release_id=excluded.release_id,possible_release_ids=excluded.possible_release_ids,
  attribution_status=excluded.attribution_status,grain=excluded.grain,condition=excluded.condition,
  query_description=excluded.query_description,sales_count=excluded.sales_count,
  seller_count=excluded.seller_count,average_item_price=excluded.average_item_price,
  low_item_price=excluded.low_item_price,high_item_price=excluded.high_item_price,
  average_shipping=excluded.average_shipping,currency=excluded.currency,
  market_average_eur=excluded.market_average_eur,evidence_grade=excluded.evidence_grade,
  provenance_url=excluded.provenance_url,raw_payload=excluded.raw_payload,
  captured_at=excluded.captured_at,updated_at=now();

with src as (select id from public.price_sources where slug='ebay_product_research')
insert into public.market_aggregate_observations (
  source_id,release_id,item_number,possible_release_ids,attribution_status,
  grain,period_start,period_end,condition,query_key,query_description,
  sales_count,seller_count,average_item_price,low_item_price,high_item_price,
  average_shipping,currency,market_average_eur,evidence_grade,
  provenance_url,raw_payload,captured_at
)
select
  src.id,'2928fbca-b220-5d72-9b03-417ab13a70d8'::uuid,'18074',
  array['2928fbca-b220-5d72-9b03-417ab13a70d8'::uuid],'release_exact',
  'full_history',date '2024-10-20',date '2026-05-10','new_complete_unbuilt',
  'ebay-pr:18074:sanfrecce-hiroshima:3y:2026-09-13',
  'Exact Sanfrecce Hiroshima 2023 edition sold history, kept separate from 18074 standard.',
  2,1,46.83,42.19,51.47,10.76,'EUR',46.83,'indicative',
  'https://www.ebay.it/sh/research?marketplace=ALL&keywords=Proto+Emperor+Hiroshima+Mini+4WD&dayRange=1095&endDate=1789331970473&startDate=1694723970473&categoryId=0&offset=0&limit=50&tabName=SOLD&tz=Europe%2FRome',
  jsonb_build_object(
    'source','Authenticated eBay Seller Hub Product Research','scan_date','2026-09-13',
    'query_period',jsonb_build_object('start','2023-09-14','end','2026-09-13'),
    'shipping_excluded',true,'base_kit_mpn','18074',
    'autonomous_tamiya_item_number_confirmed',false,'seller_reported_barcode','4570105151298',
    'sales',jsonb_build_array(
      jsonb_build_object('date','2024-10-20','price_eur',51.47,'shipping_eur',12.05,'seller','inamori-sangyo','listing_id','166247306962'),
      jsonb_build_object('date','2026-05-10','price_eur',42.19,'shipping_eur',9.47,'seller','inamori-sangyo','listing_id','166247306962')),
    'observed_change_pct',-18.0299203419,
    'assessment','indicative_only_same_seller_two_sales_about_19_months_apart'),
  timestamptz '2026-09-13 22:30:00+02'
from src
on conflict (source_id,query_key,period_start,period_end,item_number) do update set
  release_id=excluded.release_id,possible_release_ids=excluded.possible_release_ids,
  attribution_status=excluded.attribution_status,grain=excluded.grain,condition=excluded.condition,
  query_description=excluded.query_description,sales_count=excluded.sales_count,
  seller_count=excluded.seller_count,average_item_price=excluded.average_item_price,
  low_item_price=excluded.low_item_price,high_item_price=excluded.high_item_price,
  average_shipping=excluded.average_shipping,currency=excluded.currency,
  market_average_eur=excluded.market_average_eur,evidence_grade=excluded.evidence_grade,
  provenance_url=excluded.provenance_url,raw_payload=excluded.raw_payload,
  captured_at=excluded.captured_at,updated_at=now();

-- ---------------------------------------------------------------------------
-- Current value windows: views of the same audited units, not extra sales.
-- ---------------------------------------------------------------------------

with src as (select id from public.price_sources where slug='ebay_product_research'),
windows(release_id,item_number,period_start,period_end,sales_count,seller_count,avg_eur,avg_shipping,query_key,description,raw_payload) as (
  values
    (
      '0226dfa5-5e29-5557-b134-ddbad7682e28'::uuid,'18074',
      date '2025-09-14',date '2026-08-30',19,8,17.4889473684::numeric,4.7432::numeric,
      'ebay-pr:18074:dash-x1-proto-emperor-standard:current-window:v2:2026-09-13',
      'Latest audited annual exact sold window for 18074 standard; 19 units. Market Method v2 rolling-window candidate.',
      jsonb_build_object('source_scan','2026-09-13','requested_end','2026-09-13','shipping_excluded',true,'annual_change_pct',7.2554492291)
    ),
    (
      '6168c423-9f3e-5495-9a1d-06185ea7fa34'::uuid,'95450',
      date '2025-09-14',date '2026-08-10',7,1,12.72::numeric,6.56::numeric,
      'ebay-pr:95450:dash-x1-proto-emperor-black:current-window:v2:2026-09-13',
      'Latest audited annual exact sold window for 95450 Black; 7 units, all from one listing/seller. Market Value eligible but trend remains unpublished.',
      jsonb_build_object('source_scan','2026-09-13','requested_end','2026-09-13','shipping_excluded',true,'single_listing_concentration',true,'listing_id','132887926253','annual_change_pct',-12.1806884308,'same_listing_change_pct',-1.3953488372)
    ),
    (
      '2928fbca-b220-5d72-9b03-417ab13a70d8'::uuid,'18074',
      date '2025-09-14',date '2026-05-10',1,1,42.19::numeric,9.47::numeric,
      'ebay-pr:18074:sanfrecce-hiroshima:current-window:v2:2026-09-13',
      'Latest exact Hiroshima sold window contains one indicative sale only. It remains below the v2 public Market Value gate.',
      jsonb_build_object('source_scan','2026-09-13','shipping_excluded',true,'seller','inamori-sangyo','listing_id','166247306962','historical_total_units',2)
    )
)
insert into public.market_aggregate_observations (
  source_id,release_id,item_number,possible_release_ids,attribution_status,
  grain,period_start,period_end,condition,query_key,query_description,
  sales_count,seller_count,average_item_price,average_shipping,currency,
  market_average_eur,evidence_grade,raw_payload,captured_at
)
select
  src.id,windows.release_id,windows.item_number,array[windows.release_id],
  'release_exact','rolling_window',windows.period_start,windows.period_end,
  'new_complete_unbuilt',windows.query_key,windows.description,
  windows.sales_count,windows.seller_count,windows.avg_eur,windows.avg_shipping,
  'EUR',windows.avg_eur,'indicative',windows.raw_payload,
  timestamptz '2026-09-13 22:30:00+02'
from src cross join windows
on conflict (source_id,query_key,period_start,period_end,item_number) do update set
  release_id=excluded.release_id,possible_release_ids=excluded.possible_release_ids,
  attribution_status=excluded.attribution_status,grain=excluded.grain,condition=excluded.condition,
  query_description=excluded.query_description,sales_count=excluded.sales_count,
  seller_count=excluded.seller_count,average_item_price=excluded.average_item_price,
  average_shipping=excluded.average_shipping,currency=excluded.currency,
  market_average_eur=excluded.market_average_eur,evidence_grade=excluded.evidence_grade,
  raw_payload=excluded.raw_payload,captured_at=excluded.captured_at,updated_at=now();

-- ---------------------------------------------------------------------------
-- Shadow-computed public R3 / Market Method v2 outputs.
-- Standard: 19-unit rolling sold cluster -> EUR 17.49, confidence 65 Medium.
-- Black: 7-unit rolling sold cluster -> EUR 12.72, confidence 58 Medium.
-- Hiroshima: latest window = one indicative sale -> fail-closed, sold anchor kept.
-- 94708: no sold evidence -> fail-closed.
-- ---------------------------------------------------------------------------

insert into public.market_release_signals (
  release_id,condition,market_regime,market_value_eur,low_eur,high_eur,
  confidence_score,confidence_label,retail_anchor_eur,active_anchor_eur,sold_anchor_eur,
  starting_offer_candidate_id,starting_item_price_eur,starting_shipping_eur,
  starting_effective_cost_eur,starting_cost_basis,retail_source_count,
  active_offer_count,current_offer_count,sold_units,sold_source_count,
  sold_evidence_count,shipping_known_ratio,trend_percent,trend_window_months,
  algorithm_version,computed_at,market_method_version
) values
  (
    '593d8ef0-21ab-52c4-b8dc-15bf726c955a','new_complete_unbuilt',
    'insufficient',null,null,null,0,'low',null,null,null,
    null,null,null,null,null,0,0,0,0,0,0,0,null,null,'r3',now(),'v2'
  ),
  (
    '0226dfa5-5e29-5557-b134-ddbad7682e28','new_complete_unbuilt',
    'secondary_market_driven',17.49,17.49,17.49,65,'medium',null,null,17.49,
    null,null,null,null,null,0,0,0,19,1,1,0,null,null,'r3',now(),'v2'
  ),
  (
    '6168c423-9f3e-5495-9a1d-06185ea7fa34','new_complete_unbuilt',
    'secondary_market_driven',12.72,12.72,12.72,58,'medium',null,null,12.72,
    null,null,null,null,null,0,0,0,7,1,1,0,null,null,'r3',now(),'v2'
  ),
  (
    '2928fbca-b220-5d72-9b03-417ab13a70d8','new_complete_unbuilt',
    'insufficient',null,null,null,16,'low',null,null,42.19,
    null,null,null,null,null,0,0,0,1,1,1,0,null,null,'r3',now(),'v2'
  )
on conflict (release_id,condition) do update set
  market_regime=excluded.market_regime,
  market_value_eur=excluded.market_value_eur,
  low_eur=excluded.low_eur,
  high_eur=excluded.high_eur,
  confidence_score=excluded.confidence_score,
  confidence_label=excluded.confidence_label,
  retail_anchor_eur=excluded.retail_anchor_eur,
  active_anchor_eur=excluded.active_anchor_eur,
  sold_anchor_eur=excluded.sold_anchor_eur,
  starting_offer_candidate_id=excluded.starting_offer_candidate_id,
  starting_item_price_eur=excluded.starting_item_price_eur,
  starting_shipping_eur=excluded.starting_shipping_eur,
  starting_effective_cost_eur=excluded.starting_effective_cost_eur,
  starting_cost_basis=excluded.starting_cost_basis,
  retail_source_count=excluded.retail_source_count,
  active_offer_count=excluded.active_offer_count,
  current_offer_count=excluded.current_offer_count,
  sold_units=excluded.sold_units,
  sold_source_count=excluded.sold_source_count,
  sold_evidence_count=excluded.sold_evidence_count,
  shipping_known_ratio=excluded.shipping_known_ratio,
  trend_percent=excluded.trend_percent,
  trend_window_months=excluded.trend_window_months,
  algorithm_version=excluded.algorithm_version,
  computed_at=excluded.computed_at,
  market_method_version=excluded.market_method_version;

commit;
