-- Dash-1 Emperor 18012 identity split: 1988 original vs 2005 Memorial Box reissue.
--
-- Suruga-ya catalogs the Emperor component from Tamiya's 2005 Racer Mini 4WD
-- Memorial Box Vol.1 as a standalone collectible component under ITEM 18012.
-- The parent set ITEM 94547 was released 2005-04-30. This is enough to model a
-- distinct 2005 production occurrence in TrackDash instead of treating every
-- 18012 as the 1988 original.
--
-- Consequence: 18012 becomes a reused Item Number. Migration 0103 automatically
-- parks unattended eBay Active jobs for BOTH occurrences, preserving exact
-- edition attribution.
--
-- The current official Tamiya 18012 image is reused as a visual reference for
-- the same Type-1 physical specification; it is explicitly NOT claimed as an
-- archival 2005 Memorial Box package photo.

insert into public.product_releases (
  id, product_id, item_number, release_type, edition_name, release_year,
  release_date, chassis, barcode_jan, color, country_market, notes,
  discontinued, is_original, rarity, data_source, edition_type,
  verification_status, production_status, status_checked_at
) values (
  '806fc76b-9910-5e3b-afa1-7e9b375e7598',
  '2972e27d-7c75-5534-9ed4-1603ef4a6655',
  '18012',
  'Reissue',
  'Dash-1 Emperor (Type 1 Chassis) — 2005 Memorial Box Vol.1 Reissue',
  2005,
  date '2005-04-30',
  'Type 1',
  '4950344180127',
  null,
  'Japan',
  'Reissue occurrence supplied inside Tamiya Racer Mini 4WD Memorial Box Vol.1 (parent set ITEM 94547). Suruga-ya catalogs the Emperor component separately as ITEM 18012 and identifies the parent box release date as 2005-04-30. TrackDash uses current official 18012 art only as a visual reference to the same Type-1 specification, not as archival Memorial Box packaging.',
  true,
  false,
  null,
  'trusted_secondary',
  'reissue',
  'verified',
  'discontinued',
  now()
)
on conflict (id) do update set
  product_id=excluded.product_id,
  item_number=excluded.item_number,
  release_type=excluded.release_type,
  edition_name=excluded.edition_name,
  release_year=excluded.release_year,
  release_date=excluded.release_date,
  chassis=excluded.chassis,
  barcode_jan=excluded.barcode_jan,
  country_market=excluded.country_market,
  notes=excluded.notes,
  discontinued=excluded.discontinued,
  is_original=excluded.is_original,
  data_source=excluded.data_source,
  edition_type=excluded.edition_type,
  verification_status=excluded.verification_status,
  production_status=excluded.production_status,
  status_checked_at=excluded.status_checked_at,
  updated_at=now();

insert into public.release_images (id, release_id, url, position) values (
  '6a1cbc43-4095-5b44-bcc4-e738011b2dab',
  '806fc76b-9910-5e3b-afa1-7e9b375e7598',
  'https://www.tamiya.com/japan_contents/img/usr/item/1/18012/18012_1.jpg',
  0
)
on conflict (id) do update set
  release_id=excluded.release_id,
  url=excluded.url,
  position=excluded.position;

insert into public.release_sources (
  id, release_id, source_type, source_url, verified_fields, checked_at, notes
) values
(
  '0aa374ec-6ef2-5337-a6cb-925604a0cbb5',
  '806fc76b-9910-5e3b-afa1-7e9b375e7598',
  'trusted_secondary',
  'https://www.suruga-ya.jp/kaitori/kaitori_detail/603007833',
  array['itemNumber','editionName','chassis','barcodeJAN'],
  date '2026-09-19',
  'Suruga-ya explicitly catalogs the single Dash-1 Emperor component taken from Racer Mini 4WD Memorial Box Vol.1 as ITEM 18012 and lists JAN 4950344180127.'
),
(
  '8c695276-8411-524d-b62e-b9a24c0b7848',
  '806fc76b-9910-5e3b-afa1-7e9b375e7598',
  'trusted_secondary',
  'https://www.suruga-ya.jp/product/detail/603007008',
  array['releaseDate','releaseYear','editionName'],
  date '2026-09-19',
  'Suruga-ya identifies parent set ITEM 94547 Racer Mini 4WD Memorial Box Vol.1, release date 2005-04-30, and lists Dash-1 Emperor among its five included kits.'
)
on conflict (id) do update set
  release_id=excluded.release_id,
  source_type=excluded.source_type,
  source_url=excluded.source_url,
  verified_fields=excluded.verified_fields,
  checked_at=excluded.checked_at,
  notes=excluded.notes;

-- Add both 18012 occurrences to Market Method v4 only AFTER the 2005 Release
-- exists, so auto-enrollment sees the reused Item Number and keeps eBay closed.
insert into public.market_release_signals (
  release_id, condition, market_regime, market_value_eur, low_eur, high_eur,
  confidence_score, confidence_label, retail_anchor_eur, active_anchor_eur,
  sold_anchor_eur, retail_source_count, active_offer_count, current_offer_count,
  sold_units, sold_source_count, sold_evidence_count, shipping_known_ratio,
  algorithm_version, market_method_version, computed_at
)
select
  pr.id, 'new_complete_unbuilt', 'insufficient',
  null,null,null,0,'low',null,null,null,0,0,0,0,0,0,0,'r3','v4',now()
from public.product_releases pr
where pr.id in (
  'e1069825-3715-5fa6-80e9-93dcee32d4be',
  '806fc76b-9910-5e3b-afa1-7e9b375e7598'
)
on conflict (release_id, condition) do nothing;

-- Dedicated durable source for Mandarake's closed auction detail pages.
insert into public.price_sources (
  id, slug, name, source_type, origin, ingestion_mode, market_region, merchant_key, is_active
) values (
  'c483891c-1272-5b98-9c04-6f5694f38f0a',
  'mandarake_auction_closed',
  'Mandarake closed auctions',
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

-- 1988 original: Yahoo! Japan closed sale explicitly says 小鹿 (Oshika),
-- Type-1, vintage/original-period, unused. 2026-04-05 is Sunday; ECB basis uses
-- the last published reference rate (2026-04-02: 183.94 JPY/EUR; Apr 3 was an
-- ECB holiday).
insert into public.market_aggregate_observations (
  source_id, release_id, item_number, possible_release_ids, attribution_status,
  grain, period_start, period_end, condition, query_key, query_description,
  sales_count, seller_count, average_item_price, low_item_price, high_item_price,
  auction_sales_count, buy_it_now_sales_count, accepted_offer_sales_count,
  currency, market_average_eur, fx_rate_to_eur, fx_rate_date,
  evidence_grade, provenance_url, raw_payload, captured_at
) values (
  'd75d5b49-d9e5-58d0-bd2a-3d82f44fda53',
  'e1069825-3715-5fa6-80e9-93dcee32d4be',
  '18012',
  array['e1069825-3715-5fa6-80e9-93dcee32d4be'::uuid],
  'release_matched',
  'monthly',
  date '2026-04-01', date '2026-04-30',
  'new_complete_unbuilt',
  'yahoo-jp:18012-oshika-original:2026-04-05:closed-search',
  'Yahoo! Japan closed sale explicitly identifies an unused Oshika-period Dash-1 Emperor Type-1 original.',
  1,1,33000,33000,33000,
  1,0,0,
  'JPY',179.41,0.00543656,date '2026-04-02',
  'indicative',
  'https://auctions.yahoo.co.jp/closedsearch/closedsearch/%E3%83%9F%E3%83%8B%E5%9B%9B%E9%A7%86%20%E3%82%BF%E3%82%A4%E3%83%971/0',
  jsonb_build_object(
    'marketplace','Yahoo! Auctions Japan',
    'provenance_kind','closed_search_result',
    'observed_title','タミヤ レーサーミニ四駆〖小鹿〗ダッシュ１号・皇帝（エンペラー） タイプ1シャーシ DASH-1 EMPEROR 当時物 コレクター向き',
    'release_discriminator','小鹿/Oshika + 当時物 + Type-1',
    'condition_observed','unused',
    'ended_on','2026-04-05',
    'final_price_jpy',33000,
    'bid_count',23,
    'shipping_excluded',true,
    'fx_basis','ECB reference rate, last publication before 2026-04-05',
    'fx_jpy_per_eur',183.94
  ),
  now()
)
on conflict (source_id,query_key,period_start,period_end,item_number) do update set
  release_id=excluded.release_id, possible_release_ids=excluded.possible_release_ids,
  attribution_status=excluded.attribution_status, condition=excluded.condition,
  sales_count=excluded.sales_count, seller_count=excluded.seller_count,
  average_item_price=excluded.average_item_price, low_item_price=excluded.low_item_price,
  high_item_price=excluded.high_item_price, currency=excluded.currency,
  market_average_eur=excluded.market_average_eur, fx_rate_to_eur=excluded.fx_rate_to_eur,
  fx_rate_date=excluded.fx_rate_date, evidence_grade=excluded.evidence_grade,
  provenance_url=excluded.provenance_url, raw_payload=excluded.raw_payload,
  captured_at=excluded.captured_at, updated_at=now();

-- Second recent original: ITEM No.12, 小鹿, middle band, unassembled.
-- 2026-05-17 is Sunday; ECB basis uses 2026-05-15.
insert into public.market_aggregate_observations (
  source_id, release_id, item_number, possible_release_ids, attribution_status,
  grain, period_start, period_end, condition, query_key, query_description,
  sales_count, seller_count, average_item_price, low_item_price, high_item_price,
  auction_sales_count, buy_it_now_sales_count, accepted_offer_sales_count,
  currency, market_average_eur, fx_rate_to_eur, fx_rate_date,
  evidence_grade, provenance_url, raw_payload, captured_at
) values (
  'd75d5b49-d9e5-58d0-bd2a-3d82f44fda53',
  'e1069825-3715-5fa6-80e9-93dcee32d4be',
  '18012',
  array['e1069825-3715-5fa6-80e9-93dcee32d4be'::uuid],
  'release_matched',
  'monthly',
  date '2026-05-01', date '2026-05-31',
  'new_complete_unbuilt',
  'yahoo-jp:18012-oshika-original:2026-05-17:closed-search',
  'Yahoo! Japan closed sale explicitly identifies an unassembled ITEM No.12 Oshika Dash-1 Emperor with the original middle band.',
  1,1,28500,28500,28500,
  1,0,0,
  'JPY',154.59,0.00542417,date '2026-05-15',
  'indicative',
  'https://auctions.yahoo.co.jp/closedsearch/closedsearch/%E3%83%80%E3%83%83%E3%82%B7%E3%83%A51%E5%8F%B7%20%E7%9A%87%E5%B8%9D%20%E3%82%A8%E3%83%B3%E3%83%9A%E3%83%A9%E3%83%BC/0',
  jsonb_build_object(
    'marketplace','Yahoo! Auctions Japan',
    'provenance_kind','closed_search_result',
    'observed_title','SY-779 未組立 タミヤ レーサーミニ四駆 1/32 ダッシュ 1号 皇帝 エンペラー No.12 小鹿 中帯あり',
    'release_discriminator','小鹿/Oshika + No.12 + original middle band',
    'condition_observed','unused / unassembled',
    'ended_on','2026-05-17',
    'final_price_jpy',28500,
    'bid_count',5,
    'shipping_excluded',true,
    'fx_basis','ECB EUR/JPY reference rate, last business day before sale',
    'fx_jpy_per_eur',184.36
  ),
  now()
)
on conflict (source_id,query_key,period_start,period_end,item_number) do update set
  release_id=excluded.release_id, possible_release_ids=excluded.possible_release_ids,
  attribution_status=excluded.attribution_status, condition=excluded.condition,
  sales_count=excluded.sales_count, seller_count=excluded.seller_count,
  average_item_price=excluded.average_item_price, low_item_price=excluded.low_item_price,
  high_item_price=excluded.high_item_price, currency=excluded.currency,
  market_average_eur=excluded.market_average_eur, fx_rate_to_eur=excluded.fx_rate_to_eur,
  fx_rate_date=excluded.fx_rate_date, evidence_grade=excluded.evidence_grade,
  provenance_url=excluded.provenance_url, raw_payload=excluded.raw_payload,
  captured_at=excluded.captured_at, updated_at=now();

-- Durable Mandarake auction-detail record for a 1988 Oshika first-lot example.
-- Box wear is explicitly documented; the kit itself is graded 10 and unassembled.
insert into public.market_aggregate_observations (
  source_id, release_id, item_number, possible_release_ids, attribution_status,
  grain, period_start, period_end, condition, query_key, query_description,
  sales_count, seller_count, average_item_price, low_item_price, high_item_price,
  auction_sales_count, buy_it_now_sales_count, accepted_offer_sales_count,
  currency, market_average_eur, fx_rate_to_eur, fx_rate_date,
  evidence_grade, provenance_url, raw_payload, captured_at
) values (
  'c483891c-1272-5b98-9c04-6f5694f38f0a',
  'e1069825-3715-5fa6-80e9-93dcee32d4be',
  '18012',
  array['e1069825-3715-5fa6-80e9-93dcee32d4be'::uuid],
  'release_exact',
  'monthly',
  date '2025-11-01', date '2025-11-30',
  'new_complete_unbuilt',
  'mandarake:auction:769490:18012-1988-oshika',
  'Mandarake auction 769490: 1988 Oshika ITEM 18012, first lot with middle band, kit body grade 10 and unassembled; closed 2025-11-04.',
  1,1,99000,99000,99000,
  1,0,0,
  'JPY',561.26,0.00566926,date '2025-11-04',
  'verified',
  'https://ekizo.mandarake.co.jp/auction/item/itemInfoJa.html?index=769490',
  jsonb_build_object(
    'marketplace','Mandarake Auction',
    'provenance_kind','auction_detail',
    'auction_index','769490',
    'observed_title','ダッシュ1号皇帝(小鹿18012)',
    'release_discriminator','manufacturer year 1988 + 小鹿18012 + first lot / middle band',
    'condition_observed','body grade 10, unassembled; box grade 6 with documented creasing',
    'issued_year',1988,
    'ended_at','2025-11-04T22:51:57+09:00',
    'final_price_jpy',99000,
    'bid_count',55,
    'shipping_excluded',true,
    'fx_basis','ECB EUR/JPY reference rate on sale date',
    'fx_jpy_per_eur',176.39
  ),
  now()
)
on conflict (source_id,query_key,period_start,period_end,item_number) do update set
  release_id=excluded.release_id, possible_release_ids=excluded.possible_release_ids,
  attribution_status=excluded.attribution_status, condition=excluded.condition,
  sales_count=excluded.sales_count, seller_count=excluded.seller_count,
  average_item_price=excluded.average_item_price, low_item_price=excluded.low_item_price,
  high_item_price=excluded.high_item_price, currency=excluded.currency,
  market_average_eur=excluded.market_average_eur, fx_rate_to_eur=excluded.fx_rate_to_eur,
  fx_rate_date=excluded.fx_rate_date, evidence_grade=excluded.evidence_grade,
  provenance_url=excluded.provenance_url, raw_payload=excluded.raw_payload,
  captured_at=excluded.captured_at, updated_at=now();
