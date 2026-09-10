-- Exact current retail offer for the 2026 reissue of Dash-1 Emperor 18025.
-- Joshin explicitly identifies the August 2026 special-sale release, so it is
-- safe to distinguish from the 1990 occurrence sharing the same item number.

insert into public.price_sources (slug,name,source_type,is_active,origin,ingestion_mode)
values ('joshin_public','Joshin web public retail','retail',true,'external_market','manual')
on conflict (slug) do update set is_active=true, ingestion_mode='manual';

with src as (
  select id from public.price_sources where slug='joshin_public'
), rel as (
  select id from public.product_releases where item_number='18025' and release_year=2026
)
insert into public.market_candidates (
  source_id,source_record_key,external_listing_id,original_source,original_record_id,
  listing_url,title_raw,item_number_observed,possible_release_ids,resolved_release_id,
  price,currency,shipping_cost,shipping_basis,observation_type,condition_raw,
  condition,inner_bags_sealed,box_condition,is_complete,is_lot,quantity,
  match_confidence,match_evidence,seller_fingerprint,evidence_group_key,
  observed_at,decision,reason_codes,review_notes,raw_payload,first_observed_at,last_observed_at
)
select src.id,'joshin:18025:2026',null,'joshin_public','18025-2026',
       'https://joshinweb.jp/train/22703/4950344089789.html',
       'ダッシュ1号・皇帝（エンペラー）タイプ3シャーシ仕様 18025',
       '18025',array[rel.id]::uuid[],rel.id,
       1072,'JPY',null,'unknown','retail_in_stock','新品',
       'new_complete_unbuilt','unknown','unknown',true,false,1,
       'exact',array['item_number_exact','edition_name_exact','release_year_stated','official_reference_match'],
       'joshin_web','18025|joshin|2026',now(),'accepted','{}'::text[],
       'Joshin explicitly states August 2026 release and in-stock status; matched to Tamiya official 2026 reissue.',
       jsonb_build_object('source','public_web_scan','scan_date','2026-09-10','fx_rate_to_eur',0.005597,'release_month','2026-08'),
       now(),now()
from src cross join rel
on conflict (source_id,source_record_key) do update set
  listing_url=excluded.listing_url,title_raw=excluded.title_raw,price=excluded.price,
  currency=excluded.currency,shipping_cost=excluded.shipping_cost,shipping_basis=excluded.shipping_basis,
  observation_type=excluded.observation_type,condition_raw=excluded.condition_raw,condition=excluded.condition,
  possible_release_ids=excluded.possible_release_ids,resolved_release_id=excluded.resolved_release_id,
  match_confidence=excluded.match_confidence,match_evidence=excluded.match_evidence,
  decision=excluded.decision,review_notes=excluded.review_notes,raw_payload=excluded.raw_payload,
  last_observed_at=now(),updated_at=now();

with src as (
  select id from public.price_sources where slug='joshin_public'
), rel as (
  select id from public.product_releases where item_number='18025' and release_year=2026
), row_to_upsert as (
  select mc.id candidate_id,rel.id release_id,src.id source_id,mc.price,
         round(mc.price*0.005597,2) item_price_eur
  from public.market_candidates mc cross join src cross join rel
  where mc.source_id=src.id and mc.source_record_key='joshin:18025:2026'
    and mc.resolved_release_id=rel.id and mc.decision='accepted'
)
insert into public.market_offer_states (
  candidate_id,release_id,source_id,condition,channel,availability,seller_fingerprint,
  item_price,shipping_price,currency,item_price_eur,shipping_eur,effective_cost_eur,
  cost_basis,fx_rate_to_eur,fx_rate_date,first_seen_at,last_checked_at,changed_at
)
select candidate_id,release_id,source_id,'new_complete_unbuilt','retail','in_stock','joshin_web',
       price,null,'JPY',item_price_eur,null,null,'item_only',0.005597,date '2026-09-10',now(),now(),now()
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
where mc.source_record_key='joshin:18025:2026'
  and not exists(select 1 from public.market_offer_history h where h.offer_state_id=mos.id);

update public.market_release_signals
set market_regime='retail_driven',market_value_eur=7.00,low_eur=7.00,high_eur=7.00,
    confidence_score=29,confidence_label='low',retail_anchor_eur=7.00,
    active_anchor_eur=null,sold_anchor_eur=null,
    starting_offer_candidate_id=(
      select mc.id from public.market_candidates mc join public.price_sources ps on ps.id=mc.source_id
      where ps.slug='joshin_public' and mc.source_record_key='joshin:18025:2026' limit 1
    ),
    starting_item_price_eur=6.00,starting_shipping_eur=null,starting_effective_cost_eur=null,
    starting_cost_basis='item_only',retail_source_count=2,active_offer_count=0,current_offer_count=2,
    sold_units=0,sold_source_count=0,sold_evidence_count=0,shipping_known_ratio=0.50,
    trend_percent=null,trend_window_months=null,algorithm_version='r3',computed_at=now()
where release_id=(select id from public.product_releases where item_number='18025' and release_year=2026)
  and condition='new_complete_unbuilt';