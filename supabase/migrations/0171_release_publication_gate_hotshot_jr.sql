-- Release publication gate + Hotshot Jr. curation — 2026-09-25
--
-- Permanent rule:
--   verified identity + (exact/high-confidence release image OR credible exact-release market evidence)
--   => may be public.
--   verified identity + no image + no market evidence
--   => research_only: preserved in DB/master, excluded from public catalog.
--
-- Market Value is NOT required for publication; thin/insufficient market is allowed
-- when there is real attributable evidence. UNKNOWN > INVENTED remains mandatory.

begin;

alter table public.product_releases
  add column if not exists catalog_visibility text not null default 'public',
  add column if not exists catalog_visibility_reason text,
  add column if not exists catalog_visibility_updated_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid='public.product_releases'::regclass
      and conname='product_releases_catalog_visibility_check'
  ) then
    alter table public.product_releases
      add constraint product_releases_catalog_visibility_check
      check (catalog_visibility in ('public','research_only'));
  end if;
end
$$;

-- Hotshot Jr.: preserve weakly documented/no-surface-value releases internally,
-- but do not publish empty cards. These five currently have neither an exact
-- release image nor credible exact-release market evidence.
update public.product_releases
set catalog_visibility='research_only',
    catalog_visibility_reason='publication_gate:no_exact_image_and_no_credible_market_evidence',
    catalog_visibility_updated_at=now(),
    updated_at=now()
where id in (
  'cead91ea-8177-41c2-9816-b29b09281ca1'::uuid, -- 2901 first production
  '1ae929d8-64a3-40ca-b4cf-39d016d35015'::uuid, -- 2951 clear chassis
  '13848680-cbec-4fdb-8840-bd340b7d28d4'::uuid, -- Momoi Gold Plated event
  '82fc2fc7-f918-44ea-995b-89c6afebec63'::uuid, -- Momoi Orange Plated event
  'e7175dff-bacd-48ad-8762-80aef91d5a01'::uuid  -- Kashima Antlers
);

-- Explicitly keep the other audited Hotshot Jr. releases public. This also
-- makes the migration self-documenting if a prior environment carried a
-- temporary visibility override.
update public.product_releases
set catalog_visibility='public',
    catalog_visibility_reason=case
      when id='24ecf550-ce34-5bed-a192-31ec8e857ea6'::uuid then 'publication_gate:credible_exact_release_market_evidence'
      when id='ace88dc1-f049-49fa-803c-961948e2f733'::uuid then 'publication_gate:credible_exact_release_market_evidence'
      when exists (select 1 from public.release_images ri where ri.release_id=product_releases.id)
        then 'publication_gate:exact_or_high_confidence_release_image'
      else 'publication_gate:credible_exact_release_market_evidence'
    end,
    catalog_visibility_updated_at=now(),
    updated_at=now()
where product_id='a8dddf2c-ba7d-56e8-9816-adde32fd8907'::uuid
  and id not in (
    'cead91ea-8177-41c2-9816-b29b09281ca1'::uuid,
    '1ae929d8-64a3-40ca-b4cf-39d016d35015'::uuid,
    '13848680-cbec-4fdb-8840-bd340b7d28d4'::uuid,
    '82fc2fc7-f918-44ea-995b-89c6afebec63'::uuid,
    'e7175dff-bacd-48ad-8762-80aef91d5a01'::uuid
  );

-- Recent exact/strong SOLD evidence rescues two image-less releases from the
-- "empty card" bucket: 1998 Memorial and 2023 Urawa Reds.
insert into public.market_candidates(
  id,source_id,source_record_key,original_source,original_record_id,listing_url,title_raw,item_number_observed,
  possible_release_ids,resolved_release_id,price,currency,shipping_cost,shipping_basis,observation_type,
  condition_raw,condition,inner_bags_sealed,box_condition,is_complete,is_lot,quantity,match_confidence,
  match_evidence,evidence_group_key,sold_on,observed_at,decision,reason_codes,review_notes,needs_revalidation,
  raw_payload,first_observed_at,last_observed_at
) values
(
  gen_random_uuid(),'d75d5b49-d9e5-58d0-bd2a-3d82f44fda53'::uuid,
  'yahoo-auctions:hotshot-memorial-1998:2026-04-21:6000','YAHOO_AUCTIONS_JP',null,
  'https://auctions.yahoo.co.jp/closedsearch/closedsearch/%E3%83%9B%E3%83%83%E3%83%88%E3%82%B7%E3%83%A7%E3%83%83%E3%83%88jr/0',
  'タミヤ 1/32 ホットショットJr. 限定復刻版 未組立品 箱傷み汚れ有り',
  '18001',array['24ecf550-ce34-5bed-a192-31ec8e857ea6'::uuid],
  '24ecf550-ce34-5bed-a192-31ec8e857ea6'::uuid,
  6000,'JPY',null,'unknown','auction_awarded','未組立','new_complete_unbuilt',
  'unknown','unknown',true,false,1,'strong',
  array['edition_name_exact','reissue_stated','manual_override'],
  'yahoo-auctions:hotshot-memorial-1998:2026-04-21:6000',
  date '2026-04-21',now(),'accepted',array[]::text[],
  '1998 Limited Reissue wording explicitly separates this sale from 1986 production; JPY 6,000, 1 bid. Shipping not exposed.',
  false,jsonb_build_object('adapter','manual-sold-audit-v1','market_region','japan','sale_date','2026-04-21','auction_bids',1),now(),now()
),
(
  gen_random_uuid(),'d75d5b49-d9e5-58d0-bd2a-3d82f44fda53'::uuid,
  'yahoo-auctions:hotshot-memorial-1998:2026-03-25:6000','YAHOO_AUCTIONS_JP',null,
  'https://auctions.yahoo.co.jp/closedsearch/closedsearch/%E3%83%9B%E3%83%83%E3%83%88%E3%82%B7%E3%83%A7%E3%83%83%E3%83%88jr/0',
  'タミヤ 1/32 ホットショットJr. 限定復刻版 未組立品 箱傷み汚れ有り',
  '18001',array['24ecf550-ce34-5bed-a192-31ec8e857ea6'::uuid],
  '24ecf550-ce34-5bed-a192-31ec8e857ea6'::uuid,
  6000,'JPY',null,'unknown','auction_awarded','未組立','new_complete_unbuilt',
  'unknown','unknown',true,false,1,'strong',
  array['edition_name_exact','reissue_stated','manual_override'],
  'yahoo-auctions:hotshot-memorial-1998:2026-03-25:6000',
  date '2026-03-25',now(),'accepted',array[]::text[],
  'Second recent 1998 Limited Reissue closed sale; JPY 6,000, 4 bids. Shipping not exposed.',
  false,jsonb_build_object('adapter','manual-sold-audit-v1','market_region','japan','sale_date','2026-03-25','auction_bids',4),now(),now()
),
(
  gen_random_uuid(),'d75d5b49-d9e5-58d0-bd2a-3d82f44fda53'::uuid,
  'yahoo-auctions:hotshot-urawa-2023:2026-03-04:2980','YAHOO_AUCTIONS_JP',null,
  'https://auctions.yahoo.co.jp/closedsearch/closedsearch/%E3%83%9B%E3%83%83%E3%83%88%E3%82%B7%E3%83%A7%E3%83%83%E3%83%88jr/0',
  'ホットショットJr. 浦和レッズエディション ミニ四駆 電動RC 復刻版 ラジコン ホットショット',
  null,array['ace88dc1-f049-49fa-803c-961948e2f733'::uuid],
  'ace88dc1-f049-49fa-803c-961948e2f733'::uuid,
  2980,'JPY',null,'unknown','auction_awarded','未使用','new_complete_unbuilt',
  'unknown','unknown',true,false,1,'strong',
  array['edition_name_exact','packaging_generation_match','manual_override'],
  'yahoo-auctions:hotshot-urawa-2023:2026-03-04:2980',
  date '2026-03-04',now(),'accepted',array[]::text[],
  'Exact Urawa Reds Edition closed sale; JPY 2,980, 1 bid. Shipping not exposed.',
  false,jsonb_build_object('adapter','manual-sold-audit-v1','market_region','japan','sale_date','2026-03-04','auction_bids',1),now(),now()
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
    ('yahoo-auctions:hotshot-memorial-1998:2026-04-21:6000'::text,0.005343593031954687::numeric,date '2026-04-21'),
    ('yahoo-auctions:hotshot-memorial-1998:2026-03-25:6000'::text,0.005426819341184132::numeric,date '2026-03-25'),
    ('yahoo-auctions:hotshot-urawa-2023:2026-03-04:2980'::text,0.005463883728554256::numeric,date '2026-03-04')
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
  when id='24ecf550-ce34-5bed-a192-31ec8e857ea6'::uuid then concat_ws(' ',nullif(notes,''),
    'Publication-gate audit 2026-09-25: recent exact 1998 Limited Reissue SOLD evidence retained: JPY 6,000 on 2026-03-25 and JPY 6,000 on 2026-04-21; exact release image still wanted.')
  when id='ace88dc1-f049-49fa-803c-961948e2f733'::uuid then concat_ws(' ',nullif(notes,''),
    'Publication-gate audit 2026-09-25: exact Urawa Reds Edition SOLD JPY 2,980 on 2026-03-04; exact release image still wanted.')
  else notes
end,
updated_at=now()
where id in (
  '24ecf550-ce34-5bed-a192-31ec8e857ea6'::uuid,
  'ace88dc1-f049-49fa-803c-961948e2f733'::uuid
);

select public.trackdash_enqueue_market_recompute('24ecf550-ce34-5bed-a192-31ec8e857ea6'::uuid,'new_complete_unbuilt');
select public.trackdash_enqueue_market_recompute('ace88dc1-f049-49fa-803c-961948e2f733'::uuid,'new_complete_unbuilt');

-- Keep promising but not yet publishable Hotshot Jr. discoveries in persistent
-- family audit context instead of creating new public Release rows.
update public.products
set metadata =
  jsonb_set(
    jsonb_set(
      coalesce(metadata,'{}'::jsonb),
      '{unresolved_context}',
      coalesce(metadata->'unresolved_context','[]'::jsonb) || jsonb_build_array(
        '2008 Hotshot Jr. MS Red Metallic / Red Plated event variant: retain as research candidate; do not canonicalize/publish until autonomous product identity plus photo or credible market evidence is established.',
        '2008 ZOZOTOWN LIMITED Hotshot Jr.: retain as research candidate; do not canonicalize/publish until autonomous product identity plus photo or credible market evidence is established.',
        '2012 Hotshot Jr. Silver Metallic / Japan Cup variant: retain as research candidate; do not canonicalize/publish until autonomous product identity plus photo or credible market evidence is established.',
        '2013 Hotshot Jr. Special Clear Body variant: retain as research candidate; do not canonicalize/publish until autonomous product identity plus photo or credible market evidence is established.'
      ),
      true
    ),
    '{catalog_publication_gate}',
    jsonb_build_object(
      'version','2026-09-25',
      'rule','verified_identity AND (exact_or_high_confidence_release_image OR credible_exact_release_market_evidence)',
      'market_value_required',false,
      'no_image_no_market','research_only',
      'canonical_release_count',16,
      'public_release_count',11,
      'research_only_release_count',5
    ),
    true
  ),
  updated_at=now()
where id='a8dddf2c-ba7d-56e8-9816-adde32fd8907'::uuid;

commit;
