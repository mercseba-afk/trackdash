-- Dash-5 Dancing Doll family audit: add the well-supported Premium release.
--
-- Catalog and market remain separate. The Red-Plated 94822 variant is real, but
-- remains unpublished here because TrackDash does not yet have a durable
-- release-specific catalog image URL we are comfortable shipping.

insert into public.product_releases (
  id, product_id, item_number, release_type, edition_name, release_year,
  release_date, chassis, barcode_jan, color, country_market, notes,
  discontinued, is_original, rarity, data_source, edition_type,
  verification_status, production_status, status_checked_at
) values (
  '67832686-c6d6-524d-b38b-dba889fc320c',
  'a0bed8eb-2899-50f8-8746-a8d08f7a52b7',
  '95266',
  'Premium',
  'Dash-5 Dancing Doll Premium (Super-II Chassis)',
  2016,
  date '2016-07-09',
  'Super II',
  '4950344952663',
  'Red',
  null,
  'Official Tamiya Premium release on Super-II chassis, released 2016-07-09. Tamiya provides the exact item/date/specification and official product image; HobbyLink Japan independently corroborates JAN 4950344952663.',
  true,
  false,
  null,
  'tamiya_official',
  'premium',
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
  color=excluded.color,
  notes=excluded.notes,
  discontinued=excluded.discontinued,
  data_source=excluded.data_source,
  edition_type=excluded.edition_type,
  verification_status=excluded.verification_status,
  production_status=excluded.production_status,
  status_checked_at=excluded.status_checked_at,
  updated_at=now();

insert into public.release_images (id, release_id, url, position) values (
  '469dce0e-07cf-51a0-abba-55f8851a111d',
  '67832686-c6d6-524d-b38b-dba889fc320c',
  'https://www.tamiya.com/japan_contents/img/usr/item/9/95266/95266_1.jpg',
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
  'b21eaa0f-21be-576a-8447-58a2667d5b2b',
  '67832686-c6d6-524d-b38b-dba889fc320c',
  'official_manufacturer',
  'https://www.tamiya.com/japan/products/95266/index.html',
  array['itemNumber','releaseDate','releaseYear','editionName','chassis','color'],
  date '2026-09-19',
  'Official Tamiya page documents ITEM 95266, release date 2016-07-09 and Super-II specification.'
),
(
  '7c49da58-f5ed-5432-b120-4bb6d6774721',
  '67832686-c6d6-524d-b38b-dba889fc320c',
  'trusted_secondary',
  'https://www.hlj.com/dash-5-dancing-doll-premium-super-ii-chassis-tam95266',
  array['barcodeJAN','editionName'],
  date '2026-09-19',
  'HobbyLink Japan corroborates JAN 4950344952663 for TAM95266.'
)
on conflict (id) do update set
  release_id=excluded.release_id,
  source_type=excluded.source_type,
  source_url=excluded.source_url,
  verified_fields=excluded.verified_fields,
  checked_at=excluded.checked_at,
  notes=excluded.notes;

insert into public.market_release_signals (
  release_id, condition, market_regime, market_value_eur, low_eur, high_eur,
  confidence_score, confidence_label, retail_anchor_eur, active_anchor_eur,
  sold_anchor_eur, retail_source_count, active_offer_count, current_offer_count,
  sold_units, sold_source_count, sold_evidence_count, shipping_known_ratio,
  algorithm_version, market_method_version, computed_at
) values (
  '67832686-c6d6-524d-b38b-dba889fc320c',
  'new_complete_unbuilt',
  'insufficient',
  null,null,null,0,'low',null,null,null,0,0,0,0,0,0,0,'r3','v4',now()
)
on conflict (release_id, condition) do nothing;

-- One recent exact closed sale. Useful evidence, not enough to publish MV.
insert into public.market_aggregate_observations (
  source_id, release_id, item_number, possible_release_ids, attribution_status,
  grain, period_start, period_end, condition, query_key, query_description,
  sales_count, seller_count, average_item_price, low_item_price, high_item_price,
  auction_sales_count, buy_it_now_sales_count, accepted_offer_sales_count,
  currency, market_average_eur, fx_rate_to_eur, fx_rate_date,
  evidence_grade, provenance_url, raw_payload, captured_at
) values (
  'd75d5b49-d9e5-58d0-bd2a-3d82f44fda53',
  '67832686-c6d6-524d-b38b-dba889fc320c',
  '95266',
  array['67832686-c6d6-524d-b38b-dba889fc320c'::uuid],
  'release_exact',
  'monthly',
  date '2026-01-01',
  date '2026-01-31',
  'new_complete_unbuilt',
  'yahoo-jp:95266:2026-01-14:closed-search',
  'Yahoo! Japan closed result: ITEM 95266 Dash-5 Dancing Doll Premium, unused, sold 2026-01-14.',
  1,1,1900,1900,1900,
  1,0,0,
  'JPY',10.28,0.00541067,date '2026-01-14',
  'indicative',
  'https://auctions.yahoo.co.jp/closedsearch/closedsearch/%E3%83%80%E3%83%83%E3%82%B7%E3%83%A55%E5%8F%B7/0',
  jsonb_build_object(
    'marketplace','Yahoo! Auctions Japan',
    'provenance_kind','closed_search_result',
    'observed_title','タミヤ 95266 レーサーミニ四駆 特別仕様モデルダッシュ5号 D.D. ダンシングドール プレミアム 未組立 (スーパーⅡシャーシ)',
    'condition_observed','unused / unassembled',
    'ended_on','2026-01-14',
    'final_price_jpy',1900,
    'bid_count',5,
    'shipping_excluded',true,
    'fx_basis','ECB EUR/JPY reference rate on sale date',
    'fx_jpy_per_eur',184.82
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
