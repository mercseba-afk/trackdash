-- Proto Emperor ZX current-market closeout, 2026-09-13.
-- Exact Release discipline:
--   18038 / 2007 Reissue: one fresh official Tamiya retail source.
--   95335 / 2017 Premium: one fresh Akiba Hobby retail source.
--   18038 / 1992 Original: no current exact in-stock source accepted.
--
-- Market Method v2 requires two independent fresh retailers (or qualifying sold
-- evidence) before publishing a current Market Value. These observations are
-- therefore exposed as current buyable evidence / "Da" only; Market Value stays
-- deliberately NULL for both Releases.

insert into public.price_sources (slug,name,source_type,is_active,origin,ingestion_mode)
values ('akiba_hobby_public','Akiba Hobby public retail','retail',true,'external_market','manual')
on conflict (slug) do update set is_active=true, ingestion_mode='manual';

-- 18038 / 2007 Reissue — official Tamiya page, Tamiya Tokyo currently handling it.
with src as (
  select id from public.price_sources where slug='tamiya_shop_public'
), rel as (
  select id from public.product_releases where item_number='18038' and release_year=2007
)
insert into public.market_candidates (
  source_id,source_record_key,external_listing_id,original_source,original_record_id,
  listing_url,title_raw,item_number_observed,possible_release_ids,resolved_release_id,
  price,currency,shipping_cost,shipping_basis,observation_type,condition_raw,
  condition,inner_bags_sealed,box_condition,is_complete,is_lot,quantity,
  match_confidence,match_evidence,seller_fingerprint,evidence_group_key,
  observed_at,decision,reason_codes,review_notes,needs_revalidation,raw_payload,
  first_observed_at,last_observed_at
)
select src.id,'tamiya:18038:2007-current',null,'tamiya_shop_public','18038-2007-current',
       'https://www.tamiya.com/japan/products/18038/index.html',
       'プロトエンペラーZX (ゼロシャーシ) Item No:18038',
       '18038',array[rel.id]::uuid[],rel.id,
       990,'JPY',null,'unknown','retail_in_stock','新品',
       'new_complete_unbuilt','unknown','unknown',true,false,1,
       'exact',array['item_number_exact','release_year_stated','official_reference_match','current_store_availability'],
       'tamiya_tokyo','18038|tamiya|2007',now(),'accepted','{}'::text[],
       'Official Tamiya 18038 page identifies the 2007-09-01 release and currently states Tamiya Tokyo handling. One current retailer is insufficient to publish Market Value.',
       false,
       jsonb_build_object('source','public_web_scan','scan_date','2026-09-13','release_date','2007-09-01','listed_price_jpy',990,'fx_rate_to_eur',0.00566199,'availability_evidence','Tamiya Tokyo handling shown on official page'),
       now(),now()
from src cross join rel
on conflict (source_id,source_record_key) do update set
  listing_url=excluded.listing_url,title_raw=excluded.title_raw,price=excluded.price,
  currency=excluded.currency,shipping_cost=excluded.shipping_cost,shipping_basis=excluded.shipping_basis,
  observation_type=excluded.observation_type,condition_raw=excluded.condition_raw,condition=excluded.condition,
  possible_release_ids=excluded.possible_release_ids,resolved_release_id=excluded.resolved_release_id,
  match_confidence=excluded.match_confidence,match_evidence=excluded.match_evidence,
  decision=excluded.decision,review_notes=excluded.review_notes,needs_revalidation=false,
  raw_payload=excluded.raw_payload,last_observed_at=now(),updated_at=now();

with src as (
  select id from public.price_sources where slug='tamiya_shop_public'
), rel as (
  select id from public.product_releases where item_number='18038' and release_year=2007
), row_to_upsert as (
  select mc.id candidate_id,rel.id release_id,src.id source_id,mc.price,
         round(mc.price*0.00566199,2) item_price_eur
  from public.market_candidates mc cross join src cross join rel
  where mc.source_id=src.id and mc.source_record_key='tamiya:18038:2007-current'
    and mc.resolved_release_id=rel.id and mc.decision='accepted'
)
insert into public.market_offer_states (
  candidate_id,release_id,source_id,condition,channel,availability,seller_fingerprint,
  item_price,shipping_price,currency,item_price_eur,shipping_eur,effective_cost_eur,
  cost_basis,fx_rate_to_eur,fx_rate_date,first_seen_at,last_checked_at,changed_at
)
select candidate_id,release_id,source_id,'new_complete_unbuilt','retail','in_stock','tamiya_tokyo',
       price,null,'JPY',item_price_eur,null,null,'item_only',0.00566199,date '2026-09-13',now(),now(),now()
from row_to_upsert
on conflict (candidate_id) do update set
  availability='in_stock',item_price=excluded.item_price,currency=excluded.currency,
  item_price_eur=excluded.item_price_eur,shipping_price=null,shipping_eur=null,effective_cost_eur=null,
  cost_basis='item_only',fx_rate_to_eur=excluded.fx_rate_to_eur,fx_rate_date=excluded.fx_rate_date,
  last_checked_at=now(),updated_at=now();

insert into public.market_offer_history (
  offer_state_id,candidate_id,release_id,source_id,condition,channel,availability,
  item_price_eur,shipping_eur,effective_cost_eur,cost_basis,change_kind,observed_at
)
select mos.id,mos.candidate_id,mos.release_id,mos.source_id,mos.condition,mos.channel,mos.availability,
       mos.item_price_eur,mos.shipping_eur,mos.effective_cost_eur,mos.cost_basis,'initial',now()
from public.market_offer_states mos
join public.market_candidates mc on mc.id=mos.candidate_id
where mc.source_record_key='tamiya:18038:2007-current'
  and not exists(select 1 from public.market_offer_history h where h.offer_state_id=mos.id);

-- 95335 / 2017 Premium — Akiba Hobby exact item with active Add to cart.
with src as (
  select id from public.price_sources where slug='akiba_hobby_public'
), rel as (
  select id from public.product_releases where item_number='95335' and release_year=2017
)
insert into public.market_candidates (
  source_id,source_record_key,external_listing_id,original_source,original_record_id,
  listing_url,title_raw,item_number_observed,possible_release_ids,resolved_release_id,
  price,currency,shipping_cost,shipping_basis,observation_type,condition_raw,
  condition,inner_bags_sealed,box_condition,is_complete,is_lot,quantity,
  match_confidence,match_evidence,seller_fingerprint,evidence_group_key,
  observed_at,decision,reason_codes,review_notes,needs_revalidation,raw_payload,
  first_observed_at,last_observed_at
)
select src.id,'akiba:95335:2017-current',null,'akiba_hobby_public','95335-2017-current',
       'https://akibahobby.id/product/Tamiya-95335-Proto-Emperor-ZX-Premium.html',
       'Tamiya #95335 Proto Emperor ZX Premium',
       '95335',array[rel.id]::uuid[],rel.id,
       159000,'IDR',null,'unknown','retail_in_stock','New',
       'new_complete_unbuilt','unknown','unknown',true,false,1,
       'exact',array['item_number_exact','edition_name_exact','add_to_cart_available'],
       'akiba_hobby','95335|akiba|2017',now(),'accepted','{}'::text[],
       'Akiba Hobby product list showed exact 95335 at IDR 159000 with Add to cart on 2026-09-13. One current retailer is insufficient to publish Market Value.',
       false,
       jsonb_build_object('source','public_web_scan','scan_date','2026-09-13','listed_price_idr',159000,'fx_rate_to_eur',0.000048974,'availability_evidence','Add to cart'),
       now(),now()
from src cross join rel
on conflict (source_id,source_record_key) do update set
  listing_url=excluded.listing_url,title_raw=excluded.title_raw,price=excluded.price,
  currency=excluded.currency,shipping_cost=excluded.shipping_cost,shipping_basis=excluded.shipping_basis,
  observation_type=excluded.observation_type,condition_raw=excluded.condition_raw,condition=excluded.condition,
  possible_release_ids=excluded.possible_release_ids,resolved_release_id=excluded.resolved_release_id,
  match_confidence=excluded.match_confidence,match_evidence=excluded.match_evidence,
  decision=excluded.decision,review_notes=excluded.review_notes,needs_revalidation=false,
  raw_payload=excluded.raw_payload,last_observed_at=now(),updated_at=now();

with src as (
  select id from public.price_sources where slug='akiba_hobby_public'
), rel as (
  select id from public.product_releases where item_number='95335' and release_year=2017
), row_to_upsert as (
  select mc.id candidate_id,rel.id release_id,src.id source_id,mc.price,
         round(mc.price*0.000048974,2) item_price_eur
  from public.market_candidates mc cross join src cross join rel
  where mc.source_id=src.id and mc.source_record_key='akiba:95335:2017-current'
    and mc.resolved_release_id=rel.id and mc.decision='accepted'
)
insert into public.market_offer_states (
  candidate_id,release_id,source_id,condition,channel,availability,seller_fingerprint,
  item_price,shipping_price,currency,item_price_eur,shipping_eur,effective_cost_eur,
  cost_basis,fx_rate_to_eur,fx_rate_date,first_seen_at,last_checked_at,changed_at
)
select candidate_id,release_id,source_id,'new_complete_unbuilt','retail','in_stock','akiba_hobby',
       price,null,'IDR',item_price_eur,null,null,'item_only',0.000048974,date '2026-09-13',now(),now(),now()
from row_to_upsert
on conflict (candidate_id) do update set
  availability='in_stock',item_price=excluded.item_price,currency=excluded.currency,
  item_price_eur=excluded.item_price_eur,shipping_price=null,shipping_eur=null,effective_cost_eur=null,
  cost_basis='item_only',fx_rate_to_eur=excluded.fx_rate_to_eur,fx_rate_date=excluded.fx_rate_date,
  last_checked_at=now(),updated_at=now();

insert into public.market_offer_history (
  offer_state_id,candidate_id,release_id,source_id,condition,channel,availability,
  item_price_eur,shipping_eur,effective_cost_eur,cost_basis,change_kind,observed_at
)
select mos.id,mos.candidate_id,mos.release_id,mos.source_id,mos.condition,mos.channel,mos.availability,
       mos.item_price_eur,mos.shipping_eur,mos.effective_cost_eur,mos.cost_basis,'initial',now()
from public.market_offer_states mos
join public.market_candidates mc on mc.id=mos.candidate_id
where mc.source_record_key='akiba:95335:2017-current'
  and not exists(select 1 from public.market_offer_history h where h.offer_state_id=mos.id);

-- Publish current evidence without inventing a current Market Value.
-- A single retail source is visible as the buyable floor but fails the v2 headline gate.
insert into public.market_release_signals (
  release_id,condition,market_regime,market_value_eur,low_eur,high_eur,
  confidence_score,confidence_label,retail_anchor_eur,active_anchor_eur,sold_anchor_eur,
  starting_offer_candidate_id,starting_item_price_eur,starting_shipping_eur,
  starting_effective_cost_eur,starting_cost_basis,retail_source_count,active_offer_count,
  current_offer_count,sold_units,sold_source_count,sold_evidence_count,shipping_known_ratio,
  trend_percent,trend_window_months,algorithm_version,computed_at,market_method_version
)
select rel.id,'new_complete_unbuilt','retail_driven',null,null,null,
       25,'low',5.61,null,null,
       mc.id,5.61,null,null,'item_only',1,0,1,0,0,0,0,
       null,null,'r3',now(),'v2'
from public.product_releases rel
join public.market_candidates mc on mc.resolved_release_id=rel.id
join public.price_sources ps on ps.id=mc.source_id
where rel.item_number='18038' and rel.release_year=2007
  and ps.slug='tamiya_shop_public' and mc.source_record_key='tamiya:18038:2007-current'
on conflict (release_id,condition) do update set
  market_regime='retail_driven',market_value_eur=null,low_eur=null,high_eur=null,
  confidence_score=25,confidence_label='low',retail_anchor_eur=5.61,
  active_anchor_eur=null,sold_anchor_eur=null,
  starting_offer_candidate_id=excluded.starting_offer_candidate_id,
  starting_item_price_eur=5.61,starting_shipping_eur=null,starting_effective_cost_eur=null,
  starting_cost_basis='item_only',retail_source_count=1,active_offer_count=0,current_offer_count=1,
  sold_units=0,sold_source_count=0,sold_evidence_count=0,shipping_known_ratio=0,
  trend_percent=null,trend_window_months=null,algorithm_version='r3',computed_at=now(),market_method_version='v2';

insert into public.market_release_signals (
  release_id,condition,market_regime,market_value_eur,low_eur,high_eur,
  confidence_score,confidence_label,retail_anchor_eur,active_anchor_eur,sold_anchor_eur,
  starting_offer_candidate_id,starting_item_price_eur,starting_shipping_eur,
  starting_effective_cost_eur,starting_cost_basis,retail_source_count,active_offer_count,
  current_offer_count,sold_units,sold_source_count,sold_evidence_count,shipping_known_ratio,
  trend_percent,trend_window_months,algorithm_version,computed_at,market_method_version
)
select rel.id,'new_complete_unbuilt','retail_driven',null,null,null,
       25,'low',7.79,null,null,
       mc.id,7.79,null,null,'item_only',1,0,1,0,0,0,0,
       null,null,'r3',now(),'v2'
from public.product_releases rel
join public.market_candidates mc on mc.resolved_release_id=rel.id
join public.price_sources ps on ps.id=mc.source_id
where rel.item_number='95335' and rel.release_year=2017
  and ps.slug='akiba_hobby_public' and mc.source_record_key='akiba:95335:2017-current'
on conflict (release_id,condition) do update set
  market_regime='retail_driven',market_value_eur=null,low_eur=null,high_eur=null,
  confidence_score=25,confidence_label='low',retail_anchor_eur=7.79,
  active_anchor_eur=null,sold_anchor_eur=null,
  starting_offer_candidate_id=excluded.starting_offer_candidate_id,
  starting_item_price_eur=7.79,starting_shipping_eur=null,starting_effective_cost_eur=null,
  starting_cost_basis='item_only',retail_source_count=1,active_offer_count=0,current_offer_count=1,
  sold_units=0,sold_source_count=0,sold_evidence_count=0,shipping_known_ratio=0,
  trend_percent=null,trend_window_months=null,algorithm_version='r3',computed_at=now(),market_method_version='v2';
