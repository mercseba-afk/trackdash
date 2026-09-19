-- Dash-1 Emperor family audit (existing catalog waves) + first completed-sale evidence.
--
-- Conservative decisions:
-- - Do NOT enroll 18012 yet. A 2005 Memorial Box occurrence under ITEM 94547
--   contains Dash-1 Emperor Type-1 and requires a catalog-granularity decision
--   before unattended 18012 marketplace attribution can be considered safe.
-- - Do NOT publish Imperial Force 92267/92268/92269/92270 yet. Identity is
--   supported, but TrackDash still lacks a durable catalog image source that we
--   are comfortable publishing.
-- - Do NOT create new_complete_unbuilt market signals for factory-finished 94670.
-- - Never hand-write derived Market Value. SOLD rows enqueue the canonical v4
--   recompute queue installed in 0107.

-- 2017 95296: official Tamiya Jr.News gives the exact release day; specialist
-- records independently provide the JAN.
update public.product_releases
set
  release_date = date '2017-02-11',
  barcode_jan = '4950344952960',
  notes = 'Initial ITEM 95296 Dash-1 Emperor (MS Chassis) Black Special release. Tamiya Jr.News Vol.198 explicitly gives the 2017-02-11 release date; the current official 95296 page identifies February 2017 as the first release month. The current official product image depicts the same visual specification but is not claimed as archival 2017 packaging.',
  updated_at = now()
where id = '061cc21a-4382-5bce-b08c-216b456fcaeb';

update public.product_releases
set
  barcode_jan = '4950344952960',
  updated_at = now()
where id = '96babc1a-f153-59fa-b840-7ff68fb50f38';

-- Clarify reused official art / reissue imagery so catalog images are honest
-- about what they represent.
update public.product_releases
set
  notes = 'Documented Type 3 version first released in January 1990. It is a later occurrence in the Emperor family, not the original 1988 Dash-1 Emperor. TrackDash uses the current official ITEM 18025 product image because the 2026 product is the same Type-3 visual specification; it is not presented as archival 1990 packaging.',
  updated_at = now()
where id = '96adee91-eaec-5c73-9269-cf3875cfe02d';

update public.product_releases
set
  notes = 'Tamiya''s 95622 page identifies August 2008 as the initial release month under ITEM 94666. Tamiya USA explicitly marks 94666 as discontinued. TrackDash currently uses a later 95622 image of the same Special Kit visual configuration; it is not claimed as archival 2008 packaging.',
  updated_at = now()
where id = '37ba9a79-6609-5b36-966d-bad0b383eb3a';

-- Add the strongest source for the exact 2017 day and JAN.
insert into public.release_sources (
  id, release_id, source_type, source_url, verified_fields, checked_at, notes
) values
(
  'f53d1f7b-6550-5f94-9b38-e466649a0b67',
  '061cc21a-4382-5bce-b08c-216b456fcaeb',
  'official_catalog_pdf',
  'https://www.tamiya.com/cms/japan/mini4wd/jr_news/jr_news17/pdf/000198.pdf',
  array['itemNumber','releaseDate','releaseYear','editionName','chassis','color'],
  date '2026-09-19',
  'Official Tamiya Jr.News Vol.198 states ITEM 95296 and the February 11, 2017 release date.'
),
(
  'b334da33-07da-5665-96e7-3ff563b10502',
  '061cc21a-4382-5bce-b08c-216b456fcaeb',
  'trusted_secondary',
  'https://www.kaitori-world.jp/products/detail/276236',
  array['itemNumber','releaseDate','barcodeJAN','editionName'],
  date '2026-09-19',
  'Japanese specialist record corroborates 2017-02-11 and JAN 4950344952960.'
)
on conflict (id) do update set
  release_id = excluded.release_id,
  source_type = excluded.source_type,
  source_url = excluded.source_url,
  verified_fields = excluded.verified_fields,
  checked_at = excluded.checked_at,
  notes = excluded.notes;

-- Bring all audited kit Releases into the v4 monitoring system, excluding:
-- 18012 (identity audit still open), 94670 (factory-finished), and 18069
-- (already has a live v4 signal).
insert into public.market_release_signals (
  release_id,
  condition,
  market_regime,
  market_value_eur,
  low_eur,
  high_eur,
  confidence_score,
  confidence_label,
  retail_anchor_eur,
  active_anchor_eur,
  sold_anchor_eur,
  retail_source_count,
  active_offer_count,
  current_offer_count,
  sold_units,
  sold_source_count,
  sold_evidence_count,
  shipping_known_ratio,
  algorithm_version,
  market_method_version,
  computed_at
)
select
  pr.id,
  'new_complete_unbuilt',
  'insufficient',
  null,
  null,
  null,
  0,
  'low',
  null,
  null,
  null,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  'r3',
  'v4',
  now()
from public.product_releases pr
where pr.product_id = '2972e27d-7c75-5534-9ed4-1603ef4a6655'
  and pr.id not in (
    'e1069825-3715-5fa6-80e9-93dcee32d4be', -- 18012 audit open
    '0c785a52-a667-5da5-8a31-9bf0a7f4f7db', -- 94670 finished model
    'f576fa21-8e57-5fa0-953e-f468653e3767'  -- 18069 already live v4
  )
on conflict (release_id, condition) do nothing;

-- Yahoo! Japan / Yahoo! Flea completed-sale evidence.
-- Search-result provenance is kept indicative. Exact item/edition text is
-- required; ambiguous visually-identical Black Special or Special Kit waves are
-- intentionally NOT attributed.

-- 95110: exact ITEM number visible, sold 2026-05-31.
insert into public.market_aggregate_observations (
  source_id, release_id, item_number, possible_release_ids, attribution_status,
  grain, period_start, period_end, condition, query_key, query_description,
  sales_count, seller_count, average_item_price, low_item_price, high_item_price,
  auction_sales_count, buy_it_now_sales_count, accepted_offer_sales_count,
  currency, market_average_eur, fx_rate_to_eur, fx_rate_date,
  evidence_grade, provenance_url, raw_payload, captured_at
) values (
  'd75d5b49-d9e5-58d0-bd2a-3d82f44fda53',
  'b7eeb76a-e117-59ae-b31c-b099368421af',
  '95110',
  array['b7eeb76a-e117-59ae-b31c-b099368421af'::uuid],
  'release_exact',
  'monthly',
  date '2026-05-01',
  date '2026-05-31',
  'unknown',
  'yahoo-jp:95110:2026-05-31:closed-search',
  'Yahoo! Japan closed result: ITEM 95110 Dash-1 Emperor Memorial, sold 2026-05-31.',
  1,1,2200,2200,2200,
  1,0,0,
  'JPY',null,null,null,
  'indicative',
  'https://auctions.yahoo.co.jp/closedsearch/closedsearch/%E3%83%80%E3%83%83%E3%82%B7%E3%83%A51%E5%8F%B7%20%E7%9A%87%E5%B8%9D%20%E3%82%A8%E3%83%B3%E3%83%9A%E3%83%A9%E3%83%BC/0',
  jsonb_build_object(
    'marketplace','Yahoo! Auctions Japan',
    'provenance_kind','closed_search_result',
    'observed_title','ミニ四駆 タミヤ 1/32 ITEM 95110 ダッシュ1号 皇帝 エンペラー メモリアル MSシャーシ ジャパンカップ開催30年記念',
    'condition_observed','not independently confirmed; stored outside valuation lane',
    'ended_on','2026-05-31',
    'final_price_jpy',2200,
    'bid_count',1,
    'shipping_excluded',true,
    'fx_basis','ECB EUR/JPY reference rate; last business day before Sunday 2026-05-31',
    'fx_jpy_per_eur',185.45
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

-- 95110: exact Memorial edition, explicitly unassembled/unused, sold 2026-05-29.
insert into public.market_aggregate_observations (
  source_id, release_id, item_number, possible_release_ids, attribution_status,
  grain, period_start, period_end, condition, query_key, query_description,
  sales_count, seller_count, average_item_price, low_item_price, high_item_price,
  auction_sales_count, buy_it_now_sales_count, accepted_offer_sales_count,
  currency, market_average_eur, fx_rate_to_eur, fx_rate_date,
  evidence_grade, provenance_url, raw_payload, captured_at
) values (
  'd75d5b49-d9e5-58d0-bd2a-3d82f44fda53',
  'b7eeb76a-e117-59ae-b31c-b099368421af',
  '95110',
  array['b7eeb76a-e117-59ae-b31c-b099368421af'::uuid],
  'release_matched',
  'monthly',
  date '2026-05-01',
  date '2026-05-31',
  'new_complete_unbuilt',
  'yahoo-jp:95110:2026-05-29:closed-search',
  'Yahoo! Flea closed result: unassembled Dash-1 Emperor Memorial 30 Years Japan Cup, sold 2026-05-29.',
  1,1,2880,2880,2880,
  0,1,0,
  'JPY',15.53,0.00539229,date '2026-05-29',
  'indicative',
  'https://auctions.yahoo.co.jp/closedsearch/closedsearch/%E3%83%80%E3%83%83%E3%82%B7%E3%83%A51%E5%8F%B7%20%E7%9A%87%E5%B8%9D%20%E3%82%A8%E3%83%B3%E3%83%9A%E3%83%A9%E3%83%BC/0',
  jsonb_build_object(
    'marketplace','Yahoo! Flea / Yahoo! Japan',
    'provenance_kind','closed_search_result',
    'observed_title','未組立品 ミニ四駆 ダッシュ1号 皇帝 エンペラー メモリアル ジャパンカップ 開催30年記念 MSシャーシ',
    'condition_observed','unassembled / unused',
    'ended_on','2026-05-29',
    'final_price_jpy',2880,
    'shipping_excluded',true,
    'fx_basis','ECB EUR/JPY reference rate on sale date',
    'fx_jpy_per_eur',185.45
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

-- 95110: exact edition sold 2026-06-23.
insert into public.market_aggregate_observations (
  source_id, release_id, item_number, possible_release_ids, attribution_status,
  grain, period_start, period_end, condition, query_key, query_description,
  sales_count, seller_count, average_item_price, low_item_price, high_item_price,
  auction_sales_count, buy_it_now_sales_count, accepted_offer_sales_count,
  currency, market_average_eur, fx_rate_to_eur, fx_rate_date,
  evidence_grade, provenance_url, raw_payload, captured_at
) values (
  'd75d5b49-d9e5-58d0-bd2a-3d82f44fda53',
  'b7eeb76a-e117-59ae-b31c-b099368421af',
  '95110',
  array['b7eeb76a-e117-59ae-b31c-b099368421af'::uuid],
  'release_matched',
  'monthly',
  date '2026-06-01',
  date '2026-06-30',
  'unknown',
  'yahoo-jp:95110:2026-06-23:closed-search',
  'Yahoo! Flea closed result: Dash-1 Emperor Memorial MS Chassis 30 Years Japan Cup, sold 2026-06-23.',
  1,1,2900,2900,2900,
  0,1,0,
  'JPY',null,null,null,
  'indicative',
  'https://auctions.yahoo.co.jp/closedsearch/closedsearch/%E3%83%80%E3%83%83%E3%82%B7%E3%83%A51%E5%8F%B7/0',
  jsonb_build_object(
    'marketplace','Yahoo! Flea / Yahoo! Japan',
    'provenance_kind','closed_search_result',
    'observed_title','ダッシュ1号 皇帝（エンペラー メモリアルMSシャーシ-ジャパンカップ開催30年記念-（ミニ四駆PRO ミニ四駆限定 95110）',
    'condition_observed','not independently confirmed; stored outside valuation lane',
    'ended_on','2026-06-23',
    'final_price_jpy',2900,
    'shipping_excluded',true,
    'fx_basis','ECB EUR/JPY reference rate on sale date',
    'fx_jpy_per_eur',184.02
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

-- 18625: exact ITEM number and unused condition visible, sold 2026-05-27.
insert into public.market_aggregate_observations (
  source_id, release_id, item_number, possible_release_ids, attribution_status,
  grain, period_start, period_end, condition, query_key, query_description,
  sales_count, seller_count, average_item_price, low_item_price, high_item_price,
  auction_sales_count, buy_it_now_sales_count, accepted_offer_sales_count,
  currency, market_average_eur, fx_rate_to_eur, fx_rate_date,
  evidence_grade, provenance_url, raw_payload, captured_at
) values (
  'd75d5b49-d9e5-58d0-bd2a-3d82f44fda53',
  '0306bc1a-cdb6-5b9c-9461-91cd2a39e07c',
  '18625',
  array['0306bc1a-cdb6-5b9c-9461-91cd2a39e07c'::uuid],
  'release_exact',
  'monthly',
  date '2026-05-01',
  date '2026-05-31',
  'new_complete_unbuilt',
  'yahoo-jp:18625:2026-05-27:closed-search',
  'Yahoo! Japan closed result: ITEM 18625 Dash-1 Emperor MS Chassis, unused, sold 2026-05-27.',
  1,1,2550,2550,2550,
  1,0,0,
  'JPY',13.75,0.00539026,date '2026-05-27',
  'indicative',
  'https://auctions.yahoo.co.jp/closedsearch/closedsearch/%E3%83%80%E3%83%83%E3%82%B7%E3%83%A51%E5%8F%B7%20%E7%9A%87%E5%B8%9D%20%E3%82%A8%E3%83%B3%E3%83%9A%E3%83%A9%E3%83%BC/0',
  jsonb_build_object(
    'marketplace','Yahoo! Auctions Japan',
    'provenance_kind','closed_search_result',
    'observed_title','16716 玩具祭 TAMIYA タミヤ ミニ四駆PRO ダッシュ1号 皇帝(エンペラー) 18625 ミドシップモーター 3分割シャーシ MSシャーシ 保管品',
    'condition_observed','unused',
    'ended_on','2026-05-27',
    'final_price_jpy',2550,
    'bid_count',14,
    'shipping_excluded',true,
    'fx_basis','ECB EUR/JPY reference rate on sale date',
    'fx_jpy_per_eur',185.52
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
