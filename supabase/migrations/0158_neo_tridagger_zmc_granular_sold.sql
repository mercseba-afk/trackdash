-- Neo-Tridagger ZMC granular SOLD evidence — 2026-09-24
-- Adds recent exact Yahoo Japan closed-sale observations found during the
-- family initial audit. ASK and SOLD remain separate. No listing sold-count
-- is converted into fake transactions.
--
-- ECB reference rates used:
-- 2026-05-20 EUR 1 = JPY 184.48
-- 2026-06-05 EUR 1 = JPY 186.08
-- 2026-06-15 EUR 1 = JPY 185.93
-- 2026-06-16 EUR 1 = JPY 185.94
-- Weekend 2026-06-07 uses the previous ECB business-day rate 2026-06-05.

begin;

-- Exact Yahoo closed-sale candidates for canonical condition new_complete_unbuilt.
insert into public.market_candidates(
  id,source_id,source_record_key,original_source,original_record_id,listing_url,title_raw,item_number_observed,
  possible_release_ids,resolved_release_id,price,currency,shipping_cost,shipping_basis,observation_type,
  condition_raw,condition,inner_bags_sealed,box_condition,is_complete,is_lot,quantity,match_confidence,
  match_evidence,evidence_group_key,sold_on,observed_at,decision,reason_codes,review_notes,needs_revalidation,
  raw_payload,first_observed_at,last_observed_at
) values
(
  gen_random_uuid(),'d75d5b49-d9e5-58d0-bd2a-3d82f44fda53'::uuid,
  'yahoo-auctions:neo-tridagger-19409:2026-06-15:8220','YAHOO_AUCTIONS_JP',null,
  'https://auctions.yahoo.co.jp/closedsearch/closedsearch/%E3%83%88%E3%83%A9%E3%82%A4%E3%83%80%E3%82%AC%E3%83%BCzmc/2084250263',
  'MADE IN JAPAN 絶版 TAMIYA ITEM:19409 NEO-TRIDAGGER-ZMC 倉庫保管 未販売 新品','19409',
  array['fcaf3f82-93b5-5a52-8087-c96e771a030c'::uuid],
  'fcaf3f82-93b5-5a52-8087-c96e771a030c'::uuid,
  8220,'JPY',null,'unknown','auction_awarded','未使用 / 新品','new_complete_unbuilt',
  'unknown','unknown',true,false,1,'exact',
  array['item_number_exact','edition_name_exact','manual_override'],
  'yahoo-auctions:neo-tridagger-19409:2026-06-15:8220',
  date '2026-06-15',now(),'accepted',array[]::text[],
  'Exact ITEM 19409 closed Yahoo auction. New/unused old-stock wording. Shipping is unknown; transaction price remains usable SOLD evidence while delivered ASK logic stays separate.',
  false,jsonb_build_object('adapter','manual-sold-audit-v1','market_region','japan','auction_bids',1,'sale_date','2026-06-15'),now(),now()
),
(
  gen_random_uuid(),'d75d5b49-d9e5-58d0-bd2a-3d82f44fda53'::uuid,
  'yahoo-auctions:neo-tridagger-19409:2026-05-20:3300','YAHOO_AUCTIONS_JP',null,
  'https://auctions.yahoo.co.jp/closedsearch/closedsearch/%E3%83%8D%E3%82%AA%E3%83%88%E3%83%A9%E3%82%A4%E3%83%80%E3%82%AC%E3%83%BCzmc/0',
  'タミヤ ミニ四駆 ネオトライダガーZMC 1/32 フルカウルミニ四駆シリーズ No.9 未組立 19409','19409',
  array['fcaf3f82-93b5-5a52-8087-c96e771a030c'::uuid],
  'fcaf3f82-93b5-5a52-8087-c96e771a030c'::uuid,
  3300,'JPY',null,'unknown','auction_awarded','未使用 / 未組立','new_complete_unbuilt',
  'unknown','unknown',true,false,1,'exact',
  array['item_number_exact','edition_name_exact','manual_override'],
  'yahoo-auctions:neo-tridagger-19409:2026-05-20:3300',
  date '2026-05-20',now(),'accepted',array[]::text[],
  'Exact ITEM 19409 closed Yahoo auction. Unused/unassembled canonical kit evidence; shipping unknown and irrelevant to raw SOLD price.',
  false,jsonb_build_object('adapter','manual-sold-audit-v1','market_region','japan','auction_bids',4,'sale_date','2026-05-20'),now(),now()
),
(
  gen_random_uuid(),'d75d5b49-d9e5-58d0-bd2a-3d82f44fda53'::uuid,
  'yahoo-auctions:neo-tridagger-95508:2026-06-16:3200','YAHOO_AUCTIONS_JP',null,
  'https://auctions.yahoo.co.jp/closedsearch/closedsearch/%E3%83%88%E3%83%A9%E3%82%A4%E3%83%80%E3%82%AC%E3%83%BCzmc/25464',
  'ミニ四駆 ネオトライダガーZMC カーボンスペシャル 未組み立て','95508',
  array['73dcd8e6-82ab-54c4-961b-f4132bf6d638'::uuid],
  '73dcd8e6-82ab-54c4-961b-f4132bf6d638'::uuid,
  3200,'JPY',null,'unknown','auction_awarded','未使用 / 未組立','new_complete_unbuilt',
  'unknown','unknown',true,false,1,'exact',
  array['edition_name_exact','chassis_stated','manual_override'],
  'yahoo-auctions:neo-tridagger-95508:2026-06-16:3200',
  date '2026-06-16',now(),'accepted',array[]::text[],
  'Exact Carbon Special closed Yahoo auction. Unused/unassembled; seller identity is not exposed by the indexed closed-search evidence, so multi-seller confidence remains conservative.',
  false,jsonb_build_object('adapter','manual-sold-audit-v1','market_region','japan','auction_bids',1,'sale_date','2026-06-16'),now(),now()
),
(
  gen_random_uuid(),'d75d5b49-d9e5-58d0-bd2a-3d82f44fda53'::uuid,
  'yahoo-auctions:neo-tridagger-95508:2026-06-16:2900','YAHOO_AUCTIONS_JP',null,
  'https://auctions.yahoo.co.jp/closedsearch/closedsearch/%E3%83%88%E3%83%A9%E3%82%A4%E3%83%80%E3%82%AC%E3%83%BCzmc/2084250966',
  'タミヤ 1/32 ミニ四駆 ネオトライダガーZMC カーボンスペシャル（スーパーIIシャーシ）','95508',
  array['73dcd8e6-82ab-54c4-961b-f4132bf6d638'::uuid],
  '73dcd8e6-82ab-54c4-961b-f4132bf6d638'::uuid,
  2900,'JPY',null,'unknown','auction_awarded','未使用','new_complete_unbuilt',
  'unknown','unknown',true,false,1,'exact',
  array['edition_name_exact','chassis_stated','manual_override'],
  'yahoo-auctions:neo-tridagger-95508:2026-06-16:2900',
  date '2026-06-16',now(),'accepted',array[]::text[],
  'Exact Carbon Special closed Yahoo auction. Unused; retained as a distinct sale from the other same-day closed listing.',
  false,jsonb_build_object('adapter','manual-sold-audit-v1','market_region','japan','auction_bids',9,'sale_date','2026-06-16'),now(),now()
),
(
  gen_random_uuid(),'d75d5b49-d9e5-58d0-bd2a-3d82f44fda53'::uuid,
  'yahoo-auctions:neo-tridagger-95508:2026-06-07:4100','YAHOO_AUCTIONS_JP',null,
  'https://auctions.yahoo.co.jp/closedsearch/closedsearch/%E3%83%8D%E3%82%AA%E3%83%88%E3%83%A9%E3%82%A4%E3%83%80%E3%82%AC%E3%83%BCzmc/0',
  'タミヤ ミニ四駆 ネオトライダガーZMC カーボンスペシャル フルカウルミニ四駆 スーパーIIシャーシ 未組立','95508',
  array['73dcd8e6-82ab-54c4-961b-f4132bf6d638'::uuid],
  '73dcd8e6-82ab-54c4-961b-f4132bf6d638'::uuid,
  4100,'JPY',null,'unknown','auction_awarded','未使用 / 未組立','new_complete_unbuilt',
  'unknown','unknown',true,false,1,'exact',
  array['edition_name_exact','chassis_stated','manual_override'],
  'yahoo-auctions:neo-tridagger-95508:2026-06-07:4100',
  date '2026-06-07',now(),'accepted',array[]::text[],
  'Exact Carbon Special closed Yahoo auction. Unused/unassembled; weekend FX normalization uses previous ECB business day 2026-06-05.',
  false,jsonb_build_object('adapter','manual-sold-audit-v1','market_region','japan','auction_bids',8,'sale_date','2026-06-07'),now(),now()
),
(
  gen_random_uuid(),'d75d5b49-d9e5-58d0-bd2a-3d82f44fda53'::uuid,
  'yahoo-auctions:neo-tridagger-92280:2026-02-08:9000','YAHOO_AUCTIONS_JP',null,
  'https://auctions.yahoo.co.jp/closedsearch/closedsearch/%E3%83%8D%E3%82%AA%E3%83%88%E3%83%A9%E3%82%A4%E3%83%80%E3%82%AC%E3%83%BCzmc%E3%83%8D%E3%82%AF%E3%82%B9%E3%83%88/0',
  '未開封 TAMIYA 1/32 ネオトライダガー ZMC ネクスト スモーク フルカウルミニ四駆 スーパー1シャーシ','92280',
  array['19b89e91-ffe5-59d6-b213-dae1cdccfa9d'::uuid],
  '19b89e91-ffe5-59d6-b213-dae1cdccfa9d'::uuid,
  9000,'JPY',null,'unknown','auction_awarded','未開封 / 未使用','new_complete_unbuilt',
  'yes','unknown',true,false,1,'exact',
  array['edition_name_exact','color_variant_match','chassis_stated','manual_override'],
  'yahoo-auctions:neo-tridagger-92280:2026-02-08:9000',
  date '2026-02-08',now(),'accepted',array[]::text[],
  'Exact Smoke Next variant closed Yahoo auction. Unopened/unused, 21 bids. Persisted as confirmed SOLD evidence; no EUR valuation price is created here until an exact ECB rate for the applicable previous business day is persisted.',
  false,jsonb_build_object('adapter','manual-sold-audit-v1','market_region','japan','auction_bids',21,'sale_date','2026-02-08','fx_pending',true),now(),now()
)
on conflict (source_id,source_record_key) do update set
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

-- Granular valuation inputs with exact/previous-business-day ECB conversion.
with sold_fx(source_record_key,fx_rate_to_eur,fx_rate_date) as (
  values
    ('yahoo-auctions:neo-tridagger-19409:2026-06-15:8220'::text,0.005378368203087183::numeric,date '2026-06-15'),
    ('yahoo-auctions:neo-tridagger-19409:2026-05-20:3300'::text,0.005420641803989592::numeric,date '2026-05-20'),
    ('yahoo-auctions:neo-tridagger-95508:2026-06-16:3200'::text,0.005378078950198989::numeric,date '2026-06-16'),
    ('yahoo-auctions:neo-tridagger-95508:2026-06-16:2900'::text,0.005378078950198989::numeric,date '2026-06-16'),
    ('yahoo-auctions:neo-tridagger-95508:2026-06-07:4100'::text,0.005374032674118658::numeric,date '2026-06-05')
)
insert into public.price_points (
  id,candidate_id,release_id,source_id,observation_type,condition,
  price,currency,shipping_cost,shipping_basis,valuation_price,normalized_price_eur,
  fx_rate_to_eur,fx_rate_date,inner_bags_sealed,box_condition,is_complete,is_lot,
  quantity,match_confidence,match_evidence,evidence_group_key,valuation_eligible,
  status,needs_revalidation,sold_at,sold_on,observed_at,evidence_grade,quality_flags,
  market_price_eur,market_price_basis
)
select
  gen_random_uuid(),c.id,c.resolved_release_id,c.source_id,'auction_awarded','new_complete_unbuilt',
  c.price,c.currency,null,'unknown',null,null,
  f.fx_rate_to_eur,f.fx_rate_date,c.inner_bags_sealed,c.box_condition,true,false,
  1,c.match_confidence,c.match_evidence,c.evidence_group_key,true,
  'active',false,null,c.sold_on,c.observed_at,'indicative',
  array['shipping_unknown','box_condition_unknown','seller_unknown'],
  round(c.price * f.fx_rate_to_eur,2),'raw_sale'
from sold_fx f
join public.market_candidates c
  on c.source_id='d75d5b49-d9e5-58d0-bd2a-3d82f44fda53'::uuid
 and c.source_record_key=f.source_record_key
where c.decision='accepted'
on conflict (candidate_id) do update set
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

-- The Smoke 92280 SOLD is exact but intentionally not valuation-normalized yet.
-- Keep it as evidence without fabricating an FX conversion.
update public.product_releases
set notes=case
  when coalesce(notes,'') like '%Yahoo SOLD audit 2026-09-24%' then notes
  else concat_ws(' ',nullif(notes,''),
    case item_number
      when '19409' then 'Yahoo SOLD audit 2026-09-24: two recent exact new/unassembled closed sales persisted (JPY 8,220 on 2026-06-15 and JPY 3,300 on 2026-05-20). Large dispersion is retained honestly and must be handled by v4 confidence/guard logic.'
      when '95508' then 'Yahoo SOLD audit 2026-09-24: three recent exact unused/unassembled closed-auction transactions persisted (JPY 3,200 and JPY 2,900 on 2026-06-16; JPY 4,100 on 2026-06-07).'
      when '92280' then 'Yahoo SOLD audit 2026-09-24: exact unopened Smoke Next closed auction observed at JPY 9,000 on 2026-02-08 (21 bids). Raw SOLD is persisted; EUR valuation conversion intentionally deferred pending exact historical FX normalization.'
      else null
    end)
end,
updated_at=now()
where product_id='9793fbe8-dcf7-51c9-9f45-185194a0bc92'::uuid
  and item_number in ('19409','95508','92280');

select public.trackdash_enqueue_market_recompute(
  'fcaf3f82-93b5-5a52-8087-c96e771a030c'::uuid,'new_complete_unbuilt'
);
select public.trackdash_enqueue_market_recompute(
  '73dcd8e6-82ab-54c4-961b-f4132bf6d638'::uuid,'new_complete_unbuilt'
);
select public.trackdash_enqueue_market_recompute(
  '19b89e91-ffe5-59d6-b213-dae1cdccfa9d'::uuid,'new_complete_unbuilt'
);

commit;
