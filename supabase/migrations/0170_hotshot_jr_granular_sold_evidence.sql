-- Hotshot Jr. granular SOLD evidence — 2026-09-25
-- Adds only date-certain, exact/strong Yahoo! Auctions Japan closed sales.
-- Shipping is not exposed by the indexed closed-search evidence, therefore
-- raw transaction EUR values are stored as SOLD evidence while delivered-cost
-- logic remains separate.
--
-- ECB/Banca d'Italia EUR/JPY reference rates used:
-- 2026-05-14  EUR 1 = JPY 184.83
-- 2026-05-26  EUR 1 = JPY 185.22
-- 2026-05-29  EUR 1 = JPY 185.45 (previous business day for 2026-05-31)
-- 2026-06-09  EUR 1 = JPY 185.35
-- 2026-06-12  EUR 1 = JPY 185.30 (previous business day for 2026-06-14)
-- 2026-06-19  EUR 1 = JPY 184.88 (previous business day for 2026-06-21)

begin;

insert into public.market_candidates(
  id,source_id,source_record_key,original_source,original_record_id,listing_url,title_raw,item_number_observed,
  possible_release_ids,resolved_release_id,price,currency,shipping_cost,shipping_basis,observation_type,
  condition_raw,condition,inner_bags_sealed,box_condition,is_complete,is_lot,quantity,match_confidence,
  match_evidence,evidence_group_key,sold_on,observed_at,decision,reason_codes,review_notes,needs_revalidation,
  raw_payload,first_observed_at,last_observed_at
) values
(
  gen_random_uuid(),'d75d5b49-d9e5-58d0-bd2a-3d82f44fda53'::uuid,
  'yahoo-auctions:hotshot-92435:2026-06-14:2300','YAHOO_AUCTIONS_JP',null,
  'https://auctions.yahoo.co.jp/closedsearch/closedsearch/%E3%83%9B%E3%83%83%E3%83%88%E3%82%B7%E3%83%A7%E3%83%83%E3%83%88jr/0',
  'タミヤ★ミニ四駆PRO★韓国限定★絶版★当時物★未使用★ITEM 92435★ホットショットJr. SMC MALL リミテッドエディション★TAMIYA',
  '92435',array['111fc325-7423-4e4a-aba3-5cb5c0ee3906'::uuid],
  '111fc325-7423-4e4a-aba3-5cb5c0ee3906'::uuid,
  2300,'JPY',null,'unknown','auction_awarded','未使用','new_complete_unbuilt',
  'unknown','unknown',true,false,1,'exact',
  array['item_number_exact','edition_name_exact'],
  'yahoo-auctions:hotshot-92435:2026-06-14:2300',
  date '2026-06-14',now(),'accepted',array[]::text[],
  'Exact ITEM 92435 SMC Mall Limited Edition closed sale; JPY 2,300, 4 bids. Shipping not exposed.',
  false,jsonb_build_object('adapter','manual-sold-audit-v1','market_region','japan','sale_date','2026-06-14','auction_bids',4),now(),now()
),
(
  gen_random_uuid(),'d75d5b49-d9e5-58d0-bd2a-3d82f44fda53'::uuid,
  'yahoo-auctions:hotshot-92435:2026-06-09:3552','YAHOO_AUCTIONS_JP',null,
  'https://auctions.yahoo.co.jp/closedsearch/closedsearch/%E3%83%9B%E3%83%83%E3%83%88%E3%82%B7%E3%83%A7%E3%83%83%E3%83%88jr/0',
  'ミニ四駆 ホットショットJr. SMCモール リミテッドエディション MSシャーシ',
  null,array['111fc325-7423-4e4a-aba3-5cb5c0ee3906'::uuid],
  '111fc325-7423-4e4a-aba3-5cb5c0ee3906'::uuid,
  3552,'JPY',null,'unknown','auction_awarded','未使用','new_complete_unbuilt',
  'unknown','unknown',true,false,1,'strong',
  array['edition_name_exact','chassis_stated','manual_override'],
  'yahoo-auctions:hotshot-92435:2026-06-09:3552',
  date '2026-06-09',now(),'accepted',array[]::text[],
  'Exact SMC Mall Limited Edition / MS closed sale; JPY 3,552, 17 bids. ITEM number not required because the edition identity is explicit.',
  false,jsonb_build_object('adapter','manual-sold-audit-v1','market_region','japan','sale_date','2026-06-09','auction_bids',17),now(),now()
),
(
  gen_random_uuid(),'d75d5b49-d9e5-58d0-bd2a-3d82f44fda53'::uuid,
  'yahoo-auctions:hotshot-94680:2026-06-21:4100','YAHOO_AUCTIONS_JP',null,
  'https://auctions.yahoo.co.jp/closedsearch/closedsearch/%E3%83%9F%E3%83%8B%E5%9B%9B%E9%A7%86%E6%A1%83%E4%BA%95%E3%81%AF%E3%82%8B%E3%81%93/0',
  'タミヤ ミニ四駆PRO 限定 ITEM 94680 ホットショットJr. 桃井はるこSPECIAL Ver.2',
  '94680',array['b7bcbc9a-eed5-4a45-aab9-020a4e6903bf'::uuid],
  'b7bcbc9a-eed5-4a45-aab9-020a4e6903bf'::uuid,
  4100,'JPY',null,'unknown','auction_awarded','未使用','new_complete_unbuilt',
  'unknown','unknown',true,false,1,'exact',
  array['item_number_exact','edition_name_exact'],
  'yahoo-auctions:hotshot-94680:2026-06-21:4100',
  date '2026-06-21',now(),'accepted',array[]::text[],
  'Exact ITEM 94680 Momoi Special Ver.2 closed sale; JPY 4,100, 4 bids. Standard orange collaboration, not a plated event edition.',
  false,jsonb_build_object('adapter','manual-sold-audit-v1','market_region','japan','sale_date','2026-06-21','auction_bids',4),now(),now()
),
(
  gen_random_uuid(),'d75d5b49-d9e5-58d0-bd2a-3d82f44fda53'::uuid,
  'yahoo-auctions:hotshot-94680:2026-05-26:3200','YAHOO_AUCTIONS_JP',null,
  'https://auctions.yahoo.co.jp/closedsearch/closedsearch/%E3%83%9F%E3%83%8B%E5%9B%9B%E9%A7%86%E6%A1%83%E4%BA%95%E3%81%AF%E3%82%8B%E3%81%93/0',
  'O4862 未組立 タミヤ ミニ四駆 ホットショットJr.(MSシャーシ) 桃井はるこSPECIAL Ver.2 94680',
  '94680',array['b7bcbc9a-eed5-4a45-aab9-020a4e6903bf'::uuid],
  'b7bcbc9a-eed5-4a45-aab9-020a4e6903bf'::uuid,
  3200,'JPY',null,'unknown','auction_awarded','未組立','new_complete_unbuilt',
  'unknown','unknown',true,false,1,'exact',
  array['item_number_exact','edition_name_exact','chassis_stated'],
  'yahoo-auctions:hotshot-94680:2026-05-26:3200',
  date '2026-05-26',now(),'accepted',array[]::text[],
  'Exact ITEM 94680 Momoi Special Ver.2 / MS closed sale; JPY 3,200, 1 bid.',
  false,jsonb_build_object('adapter','manual-sold-audit-v1','market_region','japan','sale_date','2026-05-26','auction_bids',1),now(),now()
),
(
  gen_random_uuid(),'d75d5b49-d9e5-58d0-bd2a-3d82f44fda53'::uuid,
  'yahoo-auctions:hotshot-94680:2026-05-14:3752','YAHOO_AUCTIONS_JP',null,
  'https://auctions.yahoo.co.jp/closedsearch/closedsearch/%E3%83%9F%E3%83%8B%E5%9B%9B%E9%A7%86%E6%A1%83%E4%BA%95%E3%81%AF%E3%82%8B%E3%81%93/0',
  'TAMIYA ミニ四駆PROシリーズ特別限定モデル ホットショットJr. 桃井はるこSPECIAL Ver.2 (MSシャーシ)',
  null,array['b7bcbc9a-eed5-4a45-aab9-020a4e6903bf'::uuid],
  'b7bcbc9a-eed5-4a45-aab9-020a4e6903bf'::uuid,
  3752,'JPY',null,'unknown','auction_awarded','未使用','new_complete_unbuilt',
  'unknown','unknown',true,false,1,'strong',
  array['edition_name_exact','chassis_stated','manual_override'],
  'yahoo-auctions:hotshot-94680:2026-05-14:3752',
  date '2026-05-14',now(),'accepted',array[]::text[],
  'Exact Momoi Special Ver.2 / MS closed sale; JPY 3,752, 1 bid. No plated-event wording.',
  false,jsonb_build_object('adapter','manual-sold-audit-v1','market_region','japan','sale_date','2026-05-14','auction_bids',1),now(),now()
),
(
  gen_random_uuid(),'d75d5b49-d9e5-58d0-bd2a-3d82f44fda53'::uuid,
  'yahoo-auctions:hotshot-94687:2026-06-21:5000','YAHOO_AUCTIONS_JP',null,
  'https://auctions.yahoo.co.jp/closedsearch/closedsearch/%E3%83%9F%E3%83%8B%E5%9B%9B%E9%A7%86%20%E7%B5%B6%E7%89%88/0',
  'タミヤ ミニ四駆PRO 限定 絶版 未使用 ITEM 94687 読売ジャイアンツ スペシャル',
  '94687',array['eb1b538b-5e1a-4966-888f-03545722b9bc'::uuid],
  'eb1b538b-5e1a-4966-888f-03545722b9bc'::uuid,
  5000,'JPY',null,'unknown','auction_awarded','未使用','new_complete_unbuilt',
  'unknown','unknown',true,false,1,'exact',
  array['item_number_exact','edition_name_exact'],
  'yahoo-auctions:hotshot-94687:2026-06-21:5000',
  date '2026-06-21',now(),'accepted',array[]::text[],
  'Exact ITEM 94687 Yomiuri Giants Special closed sale; JPY 5,000, 16 bids.',
  false,jsonb_build_object('adapter','manual-sold-audit-v1','market_region','japan','sale_date','2026-06-21','auction_bids',16),now(),now()
),
(
  gen_random_uuid(),'d75d5b49-d9e5-58d0-bd2a-3d82f44fda53'::uuid,
  'yahoo-auctions:hotshot-94688:2026-06-21:2200','YAHOO_AUCTIONS_JP',null,
  'https://auctions.yahoo.co.jp/closedsearch/closedsearch/%E3%83%9F%E3%83%8B%E5%9B%9B%E9%A7%86%20%E7%B5%B6%E7%89%88/0',
  'タミヤ ミニ四駆PRO 限定 絶版 未使用 ITEM 94688 阪神タイガース スペシャル',
  '94688',array['b626e9e5-152a-4e56-94b8-76ccbe5eca13'::uuid],
  'b626e9e5-152a-4e56-94b8-76ccbe5eca13'::uuid,
  2200,'JPY',null,'unknown','auction_awarded','未使用','new_complete_unbuilt',
  'unknown','unknown',true,false,1,'exact',
  array['item_number_exact','edition_name_exact'],
  'yahoo-auctions:hotshot-94688:2026-06-21:2200',
  date '2026-06-21',now(),'accepted',array[]::text[],
  'Exact ITEM 94688 Hanshin Tigers Special closed sale; JPY 2,200, 3 bids. This SOLD evidence is kept separate from high active ASK listings.',
  false,jsonb_build_object('adapter','manual-sold-audit-v1','market_region','japan','sale_date','2026-06-21','auction_bids',3),now(),now()
),
(
  gen_random_uuid(),'d75d5b49-d9e5-58d0-bd2a-3d82f44fda53'::uuid,
  'yahoo-auctions:hotshot-94596:2026-05-31:5950','YAHOO_AUCTIONS_JP',null,
  'https://auctions.yahoo.co.jp/closedsearch/closedsearch/tamiya%20mini%204wd/0',
  'タミヤ ホットショットJr. ミニ四駆25周年記念 未組立 未使用',
  null,array['957305a9-cb61-4fbc-98d5-23403dc566c1'::uuid],
  '957305a9-cb61-4fbc-98d5-23403dc566c1'::uuid,
  5950,'JPY',null,'unknown','auction_awarded','未組立 / 未使用','new_complete_unbuilt',
  'unknown','unknown',true,false,1,'strong',
  array['edition_name_exact','packaging_generation_match','manual_override'],
  'yahoo-auctions:hotshot-94596:2026-05-31:5950',
  date '2026-05-31',now(),'accepted',array[]::text[],
  'Exact Hotshot Jr. 25th Anniversary closed sale; JPY 5,950, 14 bids. Anniversary wording separates it from original/Memorial production.',
  false,jsonb_build_object('adapter','manual-sold-audit-v1','market_region','japan','sale_date','2026-05-31','auction_bids',14),now(),now()
),
(
  gen_random_uuid(),'d75d5b49-d9e5-58d0-bd2a-3d82f44fda53'::uuid,
  'yahoo-auctions:hotshot-94596:2026-05-31:10700','YAHOO_AUCTIONS_JP',null,
  'https://auctions.yahoo.co.jp/closedsearch/closedsearch/%E3%83%9F%E3%83%8B%E5%9B%9B%E9%A7%86%E3%83%9B%E3%83%83%E3%83%88%E3%82%B7%E3%83%A7%E3%83%83%E3%83%88/0',
  'ホットショットJr.（ミニ四駆25周年記念）',
  null,array['957305a9-cb61-4fbc-98d5-23403dc566c1'::uuid],
  '957305a9-cb61-4fbc-98d5-23403dc566c1'::uuid,
  10700,'JPY',null,'unknown','auction_awarded','未使用','new_complete_unbuilt',
  'unknown','unknown',true,false,1,'strong',
  array['edition_name_exact','packaging_generation_match','manual_override'],
  'yahoo-auctions:hotshot-94596:2026-05-31:10700',
  date '2026-05-31',now(),'accepted',array[]::text[],
  'Exact Hotshot Jr. 25th Anniversary closed sale; JPY 10,700, 27 bids. Retained as an independent same-day transaction.',
  false,jsonb_build_object('adapter','manual-sold-audit-v1','market_region','japan','sale_date','2026-05-31','auction_bids',27),now(),now()
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

with sold_fx(source_record_key,fx_rate_to_eur,fx_rate_date) as (
  values
    ('yahoo-auctions:hotshot-92435:2026-06-14:2300'::text,0.005396654074473826::numeric,date '2026-06-12'),
    ('yahoo-auctions:hotshot-92435:2026-06-09:3552'::text,0.005395198273536552::numeric,date '2026-06-09'),
    ('yahoo-auctions:hotshot-94680:2026-06-21:4100'::text,0.005408913890090870::numeric,date '2026-06-19'),
    ('yahoo-auctions:hotshot-94680:2026-05-26:3200'::text,0.005398984990821726::numeric,date '2026-05-26'),
    ('yahoo-auctions:hotshot-94680:2026-05-14:3752'::text,0.005410377103284098::numeric,date '2026-05-14'),
    ('yahoo-auctions:hotshot-94687:2026-06-21:5000'::text,0.005408913890090870::numeric,date '2026-06-19'),
    ('yahoo-auctions:hotshot-94688:2026-06-21:2200'::text,0.005408913890090870::numeric,date '2026-06-19'),
    ('yahoo-auctions:hotshot-94596:2026-05-31:5950'::text,0.005392289026691831::numeric,date '2026-05-29'),
    ('yahoo-auctions:hotshot-94596:2026-05-31:10700'::text,0.005392289026691831::numeric,date '2026-05-29')
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

update public.product_releases
set notes=case
  when id='111fc325-7423-4e4a-aba3-5cb5c0ee3906'::uuid then concat_ws(' ',nullif(notes,''),
    'SOLD audit 2026-09-25: two exact/strong Yahoo Auctions transactions retained: JPY 3,552 (2026-06-09) and JPY 2,300 (2026-06-14).')
  when id='b7bcbc9a-eed5-4a45-aab9-020a4e6903bf'::uuid then concat_ws(' ',nullif(notes,''),
    'SOLD audit 2026-09-25: three standard Momoi Special Ver.2 transactions retained separately from plated event editions: JPY 3,752 (2026-05-14), JPY 3,200 (2026-05-26), JPY 4,100 (2026-06-21).')
  when id='eb1b538b-5e1a-4966-888f-03545722b9bc'::uuid then concat_ws(' ',nullif(notes,''),
    'SOLD audit 2026-09-25: exact ITEM 94687 Yomiuri Giants transaction JPY 5,000 (2026-06-21).')
  when id='b626e9e5-152a-4e56-94b8-76ccbe5eca13'::uuid then concat_ws(' ',nullif(notes,''),
    'SOLD audit 2026-09-25: exact ITEM 94688 Hanshin Tigers transaction JPY 2,200 (2026-06-21); high active ASK listings remain separate market context.')
  when id='957305a9-cb61-4fbc-98d5-23403dc566c1'::uuid then concat_ws(' ',nullif(notes,''),
    'SOLD audit 2026-09-25: two exact 25th Anniversary transactions retained from 2026-05-31: JPY 5,950 and JPY 10,700.')
  else notes
end,
updated_at=now()
where id in (
  '111fc325-7423-4e4a-aba3-5cb5c0ee3906'::uuid,
  'b7bcbc9a-eed5-4a45-aab9-020a4e6903bf'::uuid,
  'eb1b538b-5e1a-4966-888f-03545722b9bc'::uuid,
  'b626e9e5-152a-4e56-94b8-76ccbe5eca13'::uuid,
  '957305a9-cb61-4fbc-98d5-23403dc566c1'::uuid
);

select public.trackdash_enqueue_market_recompute('111fc325-7423-4e4a-aba3-5cb5c0ee3906'::uuid,'new_complete_unbuilt');
select public.trackdash_enqueue_market_recompute('b7bcbc9a-eed5-4a45-aab9-020a4e6903bf'::uuid,'new_complete_unbuilt');
select public.trackdash_enqueue_market_recompute('eb1b538b-5e1a-4966-888f-03545722b9bc'::uuid,'new_complete_unbuilt');
select public.trackdash_enqueue_market_recompute('b626e9e5-152a-4e56-94b8-76ccbe5eca13'::uuid,'new_complete_unbuilt');
select public.trackdash_enqueue_market_recompute('957305a9-cb61-4fbc-98d5-23403dc566c1'::uuid,'new_complete_unbuilt');

commit;
