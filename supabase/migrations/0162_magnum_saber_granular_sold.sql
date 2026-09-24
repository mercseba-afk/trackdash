-- Magnum Saber granular SOLD evidence — 2026-09-24
-- Keeps original 1994, 2015 reissue, Premium, Special Kit, First Impact and
-- Tokyo Anime Center evidence strictly separated.
--
-- ECB/Banca d'Italia EUR/JPY reference rates used:
-- 2025-12-31  EUR 1 = JPY 184.09
-- 2026-01-19  EUR 1 = JPY 183.69
-- 2026-03-05  EUR 1 = JPY 183.03
-- 2026-03-27  EUR 1 = JPY 184.16 (previous business day for 2026-03-28)
-- 2026-04-23  EUR 1 = JPY 186.50
-- 2026-05-12  EUR 1 = JPY 184.98
-- 2026-06-19  EUR 1 = JPY 184.88 (previous business day for 2026-06-21)
--
-- Mercari sold-out records without an absolute sale date are retained as
-- accepted SOLD context only and do not receive valuation price_points.

begin;

-- Exact/strong granular Yahoo Japan SOLD candidates with reliable sale date.
insert into public.market_candidates(
  id,source_id,source_record_key,original_source,original_record_id,listing_url,title_raw,item_number_observed,
  possible_release_ids,resolved_release_id,price,currency,shipping_cost,shipping_basis,observation_type,
  condition_raw,condition,inner_bags_sealed,box_condition,is_complete,is_lot,quantity,match_confidence,
  match_evidence,evidence_group_key,sold_on,observed_at,decision,reason_codes,review_notes,needs_revalidation,
  raw_payload,first_observed_at,last_observed_at
) values
(
  gen_random_uuid(),'d75d5b49-d9e5-58d0-bd2a-3d82f44fda53'::uuid,
  'yahoo-auctions:magnum-saber-19401-original:2025-12-31:9000','YAHOO_AUCTIONS_JP',null,
  'https://auctions.yahoo.co.jp/closedsearch/closedsearch/%E3%83%95%E3%83%AB%E3%82%AB%E3%82%A6%E3%83%AB%E3%83%9F%E3%83%8B%E5%9B%9B%E9%A7%86%2B%E3%83%9E%E3%82%B0%E3%83%8A%E3%83%A0%E3%82%BB%E3%82%A4%E3%83%90%E3%83%BC/0',
  '1円スタート タミヤ ミニ四駆 マグナム セイバー 19401 新品未使用 当時もの 長期保管品 箱絵 モーター別売 フルカウル スーパー1',
  '19401',array['4a1b7d1f-a2f7-5113-9962-21fa14a47968'::uuid],
  '4a1b7d1f-a2f7-5113-9962-21fa14a47968'::uuid,
  9000,'JPY',null,'unknown','auction_awarded','新品未使用 / 当時もの','new_complete_unbuilt',
  'unknown','unknown',true,false,1,'strong',
  array['item_number_exact','chassis_stated','packaging_generation_match','manual_override'],
  'yahoo-auctions:magnum-saber-original:2025-12-31:9000',
  date '2025-12-31',now(),'accepted',array[]::text[],
  'Explicit original-era / 当時もの ITEM 19401 sale. This is assigned to the 1994 Release and not the 2015 reissue. Shipping unknown; raw SOLD remains valuation evidence.',
  false,jsonb_build_object('adapter','manual-sold-audit-v1','market_region','japan','sale_date','2025-12-31','original_generation_stated',true),now(),now()
),
(
  gen_random_uuid(),'d75d5b49-d9e5-58d0-bd2a-3d82f44fda53'::uuid,
  'yahoo-auctions:magnum-saber-19401-original:2026-01-19:10000','YAHOO_AUCTIONS_JP',null,
  'https://auctions.yahoo.co.jp/closedsearch/closedsearch/%E3%83%95%E3%83%AB%E3%82%AB%E3%82%A6%E3%83%AB%E3%83%9F%E3%83%8B%E5%9B%9B%E9%A7%86%2B%E3%83%9E%E3%82%B0%E3%83%8A%E3%83%A0%E3%82%BB%E3%82%A4%E3%83%90%E3%83%BC/0',
  'タミヤ フルカウルミニ四駆 マグナムセイバー 当時物 未組立',
  '19401',array['4a1b7d1f-a2f7-5113-9962-21fa14a47968'::uuid],
  '4a1b7d1f-a2f7-5113-9962-21fa14a47968'::uuid,
  10000,'JPY',null,'unknown','auction_awarded','当時物 / 未組立','new_complete_unbuilt',
  'unknown','unknown',true,false,1,'strong',
  array['edition_name_exact','packaging_generation_match','manual_override'],
  'yahoo-auctions:magnum-saber-original:2026-01-19:10000',
  date '2026-01-19',now(),'accepted',array[]::text[],
  'Explicit original-era / 当時物 unassembled Magnum Saber. Assigned to the 1994 Release; not mixed with the 2015 reissue.',
  false,jsonb_build_object('adapter','manual-sold-audit-v1','market_region','japan','sale_date','2026-01-19','original_generation_stated',true),now(),now()
),
(
  gen_random_uuid(),'d75d5b49-d9e5-58d0-bd2a-3d82f44fda53'::uuid,
  'yahoo-auctions:magnum-saber-premium-19431:2026-03-05:990','YAHOO_AUCTIONS_JP',null,
  'https://auctions.yahoo.co.jp/closedsearch/closedsearch/%E3%83%95%E3%83%AB%E3%82%AB%E3%82%A6%E3%83%AB%E3%83%9F%E3%83%8B%E5%9B%9B%E9%A7%86%2B%E3%83%9E%E3%82%B0%E3%83%8A%E3%83%A0%E3%82%BB%E3%82%A4%E3%83%90%E3%83%BC/0',
  '未組立 タミヤ 1/32 マグナムセイバー プレミアム スーパーIIシャーシ フルカウルミニ四駆シリーズ No.31',
  '19431',array['0fdbfd56-f257-5b84-b541-e08a7450cc34'::uuid],
  '0fdbfd56-f257-5b84-b541-e08a7450cc34'::uuid,
  990,'JPY',null,'unknown','auction_awarded','未組立','new_complete_unbuilt',
  'unknown','unknown',true,false,1,'exact',
  array['item_number_exact','edition_name_exact','chassis_stated'],
  'yahoo-auctions:magnum-saber-premium:2026-03-05:990',
  date '2026-03-05',now(),'accepted',array[]::text[],
  'Exact ITEM 19431 Premium / Super II unassembled closed auction.',
  false,jsonb_build_object('adapter','manual-sold-audit-v1','market_region','japan','sale_date','2026-03-05'),now(),now()
),
(
  gen_random_uuid(),'d75d5b49-d9e5-58d0-bd2a-3d82f44fda53'::uuid,
  'yahoo-auctions:magnum-saber-premium-19431:2026-04-23:559','YAHOO_AUCTIONS_JP',null,
  'https://auctions.yahoo.co.jp/closedsearch/closedsearch/%E3%83%95%E3%83%AB%E3%82%AB%E3%82%A6%E3%83%AB%E3%83%9F%E3%83%8B%E5%9B%9B%E9%A7%86%2B%E3%83%9E%E3%82%B0%E3%83%8A%E3%83%A0%E3%82%BB%E3%82%A4%E3%83%90%E3%83%BC/0',
  '未使用 タミヤ 1/32 マグナムセイバー プレミアム スーパー2シャーシ フルカウル ミニ四駆 プラモデル',
  '19431',array['0fdbfd56-f257-5b84-b541-e08a7450cc34'::uuid],
  '0fdbfd56-f257-5b84-b541-e08a7450cc34'::uuid,
  559,'JPY',null,'unknown','auction_awarded','未使用','new_complete_unbuilt',
  'unknown','unknown',true,false,1,'exact',
  array['item_number_exact','edition_name_exact','chassis_stated'],
  'yahoo-auctions:magnum-saber-premium:2026-04-23:559',
  date '2026-04-23',now(),'accepted',array[]::text[],
  'Exact Magnum Saber Premium / Super II unused closed auction.',
  false,jsonb_build_object('adapter','manual-sold-audit-v1','market_region','japan','sale_date','2026-04-23'),now(),now()
),
(
  gen_random_uuid(),'d75d5b49-d9e5-58d0-bd2a-3d82f44fda53'::uuid,
  'yahoo-auctions:magnum-saber-premium-19431:2026-05-12:880','YAHOO_AUCTIONS_JP',null,
  'https://auctions.yahoo.co.jp/closedsearch/closedsearch/%E3%83%9F%E3%83%8B4%E9%A7%86%20%E3%83%9E%E3%82%B0%E3%83%8A%E3%83%A0%E3%82%BB%E3%82%A4%E3%83%90%E3%83%BC/0',
  'タミヤ ミニ四駆 19431 マグナムセイバー プレミアム スーパーIIシャーシ',
  '19431',array['0fdbfd56-f257-5b84-b541-e08a7450cc34'::uuid],
  '0fdbfd56-f257-5b84-b541-e08a7450cc34'::uuid,
  880,'JPY',null,'unknown','auction_awarded','未使用','new_complete_unbuilt',
  'unknown','unknown',true,false,1,'exact',
  array['item_number_exact','edition_name_exact','chassis_stated'],
  'yahoo-auctions:magnum-saber-premium:2026-05-12:880',
  date '2026-05-12',now(),'accepted',array[]::text[],
  'Exact ITEM 19431 Premium / Super II unused closed auction.',
  false,jsonb_build_object('adapter','manual-sold-audit-v1','market_region','japan','sale_date','2026-05-12'),now(),now()
),
(
  gen_random_uuid(),'d75d5b49-d9e5-58d0-bd2a-3d82f44fda53'::uuid,
  'yahoo-auctions:magnum-saber-special-94618:2026-03-28:7150','YAHOO_AUCTIONS_JP',null,
  'https://auctions.yahoo.co.jp/closedsearch/closedsearch/mini%20go%2010/0',
  '未組立 タミヤ ミニ四駆 マグナム セイバー スペシャルキット 爆走兄弟 レッツ＆ゴー!! ITEM 94618 TAMIYA MINI 4WD',
  '94618',array['c55391c4-d9f8-56fe-a6dc-7bd170172268'::uuid],
  'c55391c4-d9f8-56fe-a6dc-7bd170172268'::uuid,
  7150,'JPY',null,'unknown','auction_awarded','未組立','new_complete_unbuilt',
  'unknown','unknown',true,false,1,'exact',
  array['item_number_exact','edition_name_exact','manual_override'],
  'yahoo-auctions:magnum-saber-special:2026-03-28:7150',
  date '2026-03-28',now(),'accepted',array[]::text[],
  'Exact ITEM 94618 Special Kit unassembled closed auction. Weekend sale uses previous ECB business-day FX 2026-03-27.',
  false,jsonb_build_object('adapter','manual-sold-audit-v1','market_region','japan','sale_date','2026-03-28','auction_bids',11),now(),now()
),
(
  gen_random_uuid(),'d75d5b49-d9e5-58d0-bd2a-3d82f44fda53'::uuid,
  'yahoo-auctions:magnum-saber-special-94618:2026-06-21:9100','YAHOO_AUCTIONS_JP',null,
  'https://auctions.yahoo.co.jp/closedsearch/closedsearch/%E3%83%9F%E3%83%8B%E5%9B%9B%E9%A7%86%20%E7%B5%B6%E7%89%88/0',
  'タミヤ フルカウルミニ四駆 限定 絶版 当時物 未使用 ITEM 94618 マグナムセイバー スペシャルキット TAMIYA',
  '94618',array['c55391c4-d9f8-56fe-a6dc-7bd170172268'::uuid],
  'c55391c4-d9f8-56fe-a6dc-7bd170172268'::uuid,
  9100,'JPY',null,'unknown','auction_awarded','未使用','new_complete_unbuilt',
  'unknown','unknown',true,false,1,'exact',
  array['item_number_exact','edition_name_exact','packaging_generation_match'],
  'yahoo-auctions:magnum-saber-special:2026-06-21:9100',
  date '2026-06-21',now(),'accepted',array[]::text[],
  'Exact ITEM 94618 Special Kit unused original-era listing. Weekend sale uses previous ECB business-day FX 2026-06-19.',
  false,jsonb_build_object('adapter','manual-sold-audit-v1','market_region','japan','sale_date','2026-06-21','auction_bids',20),now(),now()
)
on conflict(source_id,source_record_key) do update set
  title_raw=excluded.title_raw,item_number_observed=excluded.item_number_observed,
  possible_release_ids=excluded.possible_release_ids,resolved_release_id=excluded.resolved_release_id,
  price=excluded.price,currency=excluded.currency,shipping_cost=excluded.shipping_cost,
  shipping_basis=excluded.shipping_basis,observation_type=excluded.observation_type,
  condition_raw=excluded.condition_raw,condition=excluded.condition,
  inner_bags_sealed=excluded.inner_bags_sealed,box_condition=excluded.box_condition,
  is_complete=excluded.is_complete,is_lot=excluded.is_lot,quantity=excluded.quantity,
  match_confidence=excluded.match_confidence,match_evidence=excluded.match_evidence,
  evidence_group_key=excluded.evidence_group_key,sold_on=excluded.sold_on,
  observed_at=excluded.observed_at,decision=excluded.decision,reason_codes=excluded.reason_codes,
  review_notes=excluded.review_notes,needs_revalidation=false,raw_payload=excluded.raw_payload,
  last_observed_at=excluded.last_observed_at,updated_at=now();

-- Normalize only the date-certain granular sales. Shipping is unknown, so
-- valuation_price/normalized_price_eur intentionally remain null while
-- market_price_eur stores the raw transaction value converted to EUR.
with sold_fx(source_record_key,fx_rate_to_eur,fx_rate_date) as (
  values
    ('yahoo-auctions:magnum-saber-19401-original:2025-12-31:9000'::text,0.005432125590743658::numeric,date '2025-12-31'),
    ('yahoo-auctions:magnum-saber-19401-original:2026-01-19:10000'::text,0.005443954488540476::numeric,date '2026-01-19'),
    ('yahoo-auctions:magnum-saber-premium-19431:2026-03-05:990'::text,0.005463585204611266::numeric,date '2026-03-05'),
    ('yahoo-auctions:magnum-saber-premium-19431:2026-04-23:559'::text,0.005361930294906166::numeric,date '2026-04-23'),
    ('yahoo-auctions:magnum-saber-premium-19431:2026-05-12:880'::text,0.005405989836739108::numeric,date '2026-05-12'),
    ('yahoo-auctions:magnum-saber-special-94618:2026-03-28:7150'::text,0.005430060816681147::numeric,date '2026-03-27'),
    ('yahoo-auctions:magnum-saber-special-94618:2026-06-21:9100'::text,0.005408913890090870::numeric,date '2026-06-19')
)
insert into public.price_points(
  id,candidate_id,release_id,source_id,observation_type,condition,
  price,currency,shipping_cost,shipping_basis,valuation_price,normalized_price_eur,
  fx_rate_to_eur,fx_rate_date,inner_bags_sealed,box_condition,is_complete,is_lot,
  quantity,match_confidence,match_evidence,evidence_group_key,valuation_eligible,
  status,needs_revalidation,sold_at,sold_on,observed_at,evidence_grade,quality_flags,
  market_price_eur,market_price_basis
)
select
  gen_random_uuid(),c.id,c.resolved_release_id,c.source_id,c.observation_type,c.condition,
  c.price,c.currency,null,'unknown',null,null,
  f.fx_rate_to_eur,f.fx_rate_date,c.inner_bags_sealed,c.box_condition,true,false,
  1,c.match_confidence,c.match_evidence,c.evidence_group_key,true,
  'active',false,null,c.sold_on,c.observed_at,'indicative',
  array['shipping_unknown','box_condition_unknown','seller_unknown'],
  round(c.price*f.fx_rate_to_eur,2),'raw_sale'
from sold_fx f
join public.market_candidates c
  on c.source_id='d75d5b49-d9e5-58d0-bd2a-3d82f44fda53'::uuid
 and c.source_record_key=f.source_record_key
where c.decision='accepted'
on conflict(candidate_id) do update set
  release_id=excluded.release_id,source_id=excluded.source_id,
  observation_type=excluded.observation_type,condition=excluded.condition,
  price=excluded.price,currency=excluded.currency,shipping_cost=excluded.shipping_cost,
  shipping_basis=excluded.shipping_basis,valuation_price=excluded.valuation_price,
  normalized_price_eur=excluded.normalized_price_eur,fx_rate_to_eur=excluded.fx_rate_to_eur,
  fx_rate_date=excluded.fx_rate_date,inner_bags_sealed=excluded.inner_bags_sealed,
  box_condition=excluded.box_condition,is_complete=excluded.is_complete,is_lot=excluded.is_lot,
  quantity=excluded.quantity,match_confidence=excluded.match_confidence,
  match_evidence=excluded.match_evidence,evidence_group_key=excluded.evidence_group_key,
  valuation_eligible=excluded.valuation_eligible,status=excluded.status,
  needs_revalidation=excluded.needs_revalidation,sold_on=excluded.sold_on,
  observed_at=excluded.observed_at,evidence_grade=excluded.evidence_grade,
  quality_flags=excluded.quality_flags,market_price_eur=excluded.market_price_eur,
  market_price_basis=excluded.market_price_basis,updated_at=now();

-- Mercari SOLD context with exact Release identity but no absolute sale date.
-- Persist as accepted market evidence only; do not create price_points.
insert into public.market_candidates(
  id,source_id,source_record_key,original_source,original_record_id,listing_url,title_raw,item_number_observed,
  possible_release_ids,resolved_release_id,price,currency,shipping_cost,shipping_basis,observation_type,
  condition_raw,condition,inner_bags_sealed,box_condition,is_complete,is_lot,quantity,match_confidence,
  match_evidence,evidence_group_key,sold_on,observed_at,decision,reason_codes,review_notes,needs_revalidation,
  raw_payload,first_observed_at,last_observed_at
) values
(
  gen_random_uuid(),'38859ae9-7071-4b18-95b2-035fed8e4eed'::uuid,
  'mercari:m50918840443','MERCARI_JP','m50918840443',
  'https://jp.mercari.com/item/m50918840443',
  'VF5227 未開封 タミヤ ミニ四駆 1/32 マグナムセイバー ファーストインパクト レッド',
  '92319',array['5e92792c-9b20-59f3-916f-ce485c555778'::uuid],
  '5e92792c-9b20-59f3-916f-ce485c555778'::uuid,
  4000,'JPY',null,'included_unknown','marketplace_sold','未開封','new_complete_unbuilt',
  'yes','unknown',true,false,1,'strong',
  array['edition_name_exact','color_variant_match','chassis_stated','image_reviewed'],
  'mercari:first-impact-red:m50918840443',null,now(),'accepted',array['SOLD_DATE_UNRESOLVED'],
  'Exact Red First Impact sold-out Mercari listing. Absolute sale date is not exposed by the indexed page, so TrackDash retains this as SOLD context and does not make it valuation-eligible.',
  false,jsonb_build_object('adapter','manual-sold-audit-v1','market_region','japan','sale_state','sold_out','sale_date','unresolved'),now(),now()
),
(
  gen_random_uuid(),'38859ae9-7071-4b18-95b2-035fed8e4eed'::uuid,
  'mercari:m61499557633','MERCARI_JP','m61499557633',
  'https://jp.mercari.com/item/m61499557633',
  'ミニ四駆 マグナムセイバー ファーストインパクト ホワイト',
  '92320',array['a7ee5c90-da2a-5eb1-92a7-3895082186ff'::uuid],
  'a7ee5c90-da2a-5eb1-92a7-3895082186ff'::uuid,
  8250,'JPY',455,'included_exact','marketplace_sold','新品 未使用','new_complete_unbuilt',
  'unknown','unknown',true,false,1,'strong',
  array['edition_name_exact','color_variant_match','image_reviewed'],
  'mercari:first-impact-white:m61499557633',null,now(),'accepted',array['SOLD_DATE_UNRESOLVED'],
  'Exact White First Impact sold-out Mercari listing, new/unused. Mercari reports JPY 455 included shipping. Absolute sale date remains unresolved, so no valuation price_point is created.',
  false,jsonb_build_object('adapter','manual-sold-audit-v1','market_region','japan','sale_state','sold_out','sale_date','unresolved'),now(),now()
),
(
  gen_random_uuid(),'38859ae9-7071-4b18-95b2-035fed8e4eed'::uuid,
  'mercari:m27898907557','MERCARI_JP','m27898907557',
  'https://jp.mercari.com/item/m27898907557',
  'ミニ四駆 マグナムセイバーファーストインパクト ブルー 2点',
  '92318',array['6794b234-e47e-5464-bf91-a90ab40b16df'::uuid],
  '6794b234-e47e-5464-bf91-a90ab40b16df'::uuid,
  21999,'JPY',750,'included_exact','marketplace_sold','新品 未使用 2点セット','new_complete_unbuilt',
  'unknown','unknown',true,true,2,'strong',
  array['edition_name_exact','color_variant_match','image_reviewed'],
  'mercari:first-impact-blue:m27898907557',null,now(),'accepted',array['LOT_CONTEXT_ONLY','SOLD_DATE_UNRESOLVED'],
  'Exact Blue First Impact sold-out Mercari listing containing two new units for JPY 21,999 total. It is preserved as lot context only; TrackDash does not divide the bundle into invented granular transactions.',
  false,jsonb_build_object('adapter','manual-sold-audit-v1','market_region','japan','sale_state','sold_out','sale_date','unresolved','quantity',2),now(),now()
),
(
  gen_random_uuid(),'38859ae9-7071-4b18-95b2-035fed8e4eed'::uuid,
  'mercari:m78366053057','MERCARI_JP','m78366053057',
  'https://jp.mercari.com/item/m78366053057',
  '新品未開品 TAMIYA マグナムセイバー 東京アニメセンターモデル',
  null,array['057f6e89-225a-583a-8ec6-390a7e5a0887'::uuid],
  '057f6e89-225a-583a-8ec6-390a7e5a0887'::uuid,
  12900,'JPY',850,'included_exact','marketplace_sold','新品 未開封','new_complete_unbuilt',
  'yes','unknown',true,false,1,'exact',
  array['edition_name_exact','chassis_stated','image_reviewed'],
  'mercari:tokyo-anime-center:m78366053057',null,now(),'accepted',array['SOLD_DATE_UNRESOLVED'],
  'Exact Tokyo Anime Center Model sold-out Mercari listing at JPY 12,900, including JPY 850 domestic shipping. Indexed page exposes only relative age, not an absolute sale date; retained as SOLD context only.',
  false,jsonb_build_object('adapter','manual-sold-audit-v1','market_region','japan','sale_state','sold_out','sale_date','unresolved'),now(),now()
)
on conflict(source_id,source_record_key) do update set
  title_raw=excluded.title_raw,item_number_observed=excluded.item_number_observed,
  possible_release_ids=excluded.possible_release_ids,resolved_release_id=excluded.resolved_release_id,
  price=excluded.price,currency=excluded.currency,shipping_cost=excluded.shipping_cost,
  shipping_basis=excluded.shipping_basis,observation_type=excluded.observation_type,
  condition_raw=excluded.condition_raw,condition=excluded.condition,
  inner_bags_sealed=excluded.inner_bags_sealed,box_condition=excluded.box_condition,
  is_complete=excluded.is_complete,is_lot=excluded.is_lot,quantity=excluded.quantity,
  match_confidence=excluded.match_confidence,match_evidence=excluded.match_evidence,
  evidence_group_key=excluded.evidence_group_key,sold_on=excluded.sold_on,
  observed_at=excluded.observed_at,decision=excluded.decision,reason_codes=excluded.reason_codes,
  review_notes=excluded.review_notes,needs_revalidation=false,raw_payload=excluded.raw_payload,
  last_observed_at=excluded.last_observed_at,updated_at=now();

-- Audit trail and recompute only Releases with valuation-eligible granular SOLD.
update public.product_releases
set notes=case
  when id='4a1b7d1f-a2f7-5113-9962-21fa14a47968'::uuid then concat_ws(' ',nullif(notes,''),
    'SOLD audit 2026-09-24: two explicit original-era / 当時物 unassembled transactions retained separately from the 2015 reissue: JPY 9,000 (2025-12-31) and JPY 10,000 (2026-01-19).')
  when id='0fdbfd56-f257-5b84-b541-e08a7450cc34'::uuid then concat_ws(' ',nullif(notes,''),
    'SOLD audit 2026-09-24: three exact Premium/Super II closed transactions retained: JPY 990 (2026-03-05), JPY 559 (2026-04-23), JPY 880 (2026-05-12).')
  when id='c55391c4-d9f8-56fe-a6dc-7bd170172268'::uuid then concat_ws(' ',nullif(notes,''),
    'SOLD audit 2026-09-24: two exact ITEM 94618 Special Kit transactions retained: JPY 7,150 (2026-03-28) and JPY 9,100 (2026-06-21).')
  else notes
end,
updated_at=now()
where id in (
 '4a1b7d1f-a2f7-5113-9962-21fa14a47968'::uuid,
 '0fdbfd56-f257-5b84-b541-e08a7450cc34'::uuid,
 'c55391c4-d9f8-56fe-a6dc-7bd170172268'::uuid
);

select public.trackdash_enqueue_market_recompute('4a1b7d1f-a2f7-5113-9962-21fa14a47968'::uuid,'new_complete_unbuilt');
select public.trackdash_enqueue_market_recompute('0fdbfd56-f257-5b84-b541-e08a7450cc34'::uuid,'new_complete_unbuilt');
select public.trackdash_enqueue_market_recompute('c55391c4-d9f8-56fe-a6dc-7bd170172268'::uuid,'new_complete_unbuilt');

commit;
