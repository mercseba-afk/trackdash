-- Current Mercari JP scan for Dash-1 Emperor Black Special 94704.
-- Accept one exact, plausibly-priced new listing and quarantine an extreme ask.
-- Shipping is included by seller on both listings; only accepted evidence reaches R3.

insert into public.price_sources (slug,name,source_type,is_active,origin,ingestion_mode)
values ('mercari_jp_public','Mercari Japan public listings','marketplace',true,'external_market','manual')
on conflict (slug) do update set is_active=true, ingestion_mode='manual';

with src as (
  select id from public.price_sources where slug='mercari_jp_public'
), rel as (
  select id from public.product_releases where item_number='94704' and release_year=2009
)
insert into public.market_candidates (
  source_id, source_record_key, external_listing_id, original_source, original_record_id,
  listing_url, title_raw, item_number_observed, possible_release_ids, resolved_release_id,
  price, currency, shipping_cost, shipping_basis, observation_type, condition_raw,
  condition, inner_bags_sealed, box_condition, is_complete, is_lot, quantity,
  match_confidence, match_evidence, seller_fingerprint, evidence_group_key,
  observed_at, decision, reason_codes, review_notes, raw_payload,
  first_observed_at, last_observed_at
)
select src.id, v.source_record_key, v.external_listing_id, 'mercari_jp_public', v.external_listing_id,
       v.listing_url, v.title_raw, '94704', array[rel.id]::uuid[], rel.id,
       v.price, 'JPY', 0, 'included_exact', 'active_listing', v.condition_raw,
       'new_complete_unbuilt', 'unknown', v.box_condition, true, false, 1,
       'exact', array['item_number_exact','edition_name_exact','image_reviewed'],
       v.seller_fingerprint, '94704|mercari|'||v.seller_fingerprint,
       now(), v.decision, '{}'::text[], v.review_notes,
       jsonb_build_object('source','public_web_scan','scan_date','2026-09-10','fx_rate_to_eur',0.005597,'shipping','seller_paid'),
       now(), now()
from src cross join rel cross join (values
  ('mercari:m82142150932','m82142150932','https://jp.mercari.com/item/m82142150932',
   'ミニ四駆94704 ダッシュ1号皇帝（エンペラー）ブラックスペシャル',2199::numeric,
   '新品、未使用','normal','kou_59','accepted',
   'Exact 94704 listing. Seller states purchased new and unused; minor box wear is disclosed in the listing notes. Seller-paid shipping.'),
  ('mercari:knBjHrpkJeiatsUtpaQJpe','knBjHrpkJeiatsUtpaQJpe','https://jp.mercari.com/shops/product/knBjHrpkJeiatsUtpaQJpe',
   'タミヤ ミニ四駆限定シリーズ ダッシュ1号・皇帝 エンペラー MSシャーシ ブラックスペシャル 94704',31020::numeric,
   '新品・未開封','unknown','best_product_691','needs_review',
   'Exact 94704 identity but extreme asking price relative to the contemporaneous exact 94704 listing; quarantined from R3 pending sold-market corroboration.')
) as v(source_record_key,external_listing_id,listing_url,title_raw,price,condition_raw,box_condition,seller_fingerprint,decision,review_notes)
on conflict (source_id, source_record_key) do update set
  listing_url=excluded.listing_url, title_raw=excluded.title_raw, price=excluded.price,
  currency=excluded.currency, shipping_cost=excluded.shipping_cost,
  shipping_basis=excluded.shipping_basis, observation_type=excluded.observation_type,
  condition_raw=excluded.condition_raw, condition=excluded.condition,
  box_condition=excluded.box_condition, is_complete=excluded.is_complete,
  possible_release_ids=excluded.possible_release_ids, resolved_release_id=excluded.resolved_release_id,
  match_confidence=excluded.match_confidence, match_evidence=excluded.match_evidence,
  seller_fingerprint=excluded.seller_fingerprint, decision=excluded.decision,
  review_notes=excluded.review_notes, raw_payload=excluded.raw_payload,
  last_observed_at=now(), updated_at=now();

with src as (
  select id from public.price_sources where slug='mercari_jp_public'
), rel as (
  select id from public.product_releases where item_number='94704' and release_year=2009
), row_to_upsert as (
  select mc.id as candidate_id, rel.id as release_id, src.id as source_id,
         mc.seller_fingerprint, mc.price,
         round(mc.price * 0.005597,2) as item_price_eur
  from public.market_candidates mc cross join src cross join rel
  where mc.source_id=src.id and mc.external_listing_id='m82142150932'
    and mc.resolved_release_id=rel.id and mc.decision='accepted'
)
insert into public.market_offer_states (
  candidate_id,release_id,source_id,condition,channel,availability,seller_fingerprint,
  item_price,shipping_price,currency,item_price_eur,shipping_eur,effective_cost_eur,
  cost_basis,fx_rate_to_eur,fx_rate_date,first_seen_at,last_checked_at,changed_at
)
select candidate_id,release_id,source_id,'new_complete_unbuilt','marketplace','in_stock',seller_fingerprint,
       price,0,'JPY',item_price_eur,0,item_price_eur,
       'delivered',0.005597,date '2026-09-10',now(),now(),now()
from row_to_upsert
on conflict (candidate_id) do update set
  availability='in_stock', item_price=excluded.item_price,
  shipping_price=excluded.shipping_price, currency=excluded.currency,
  item_price_eur=excluded.item_price_eur, shipping_eur=excluded.shipping_eur,
  effective_cost_eur=excluded.effective_cost_eur, cost_basis=excluded.cost_basis,
  fx_rate_to_eur=excluded.fx_rate_to_eur, fx_rate_date=excluded.fx_rate_date,
  seller_fingerprint=excluded.seller_fingerprint, last_checked_at=now(),
  changed_at=case when market_offer_states.item_price<>excluded.item_price then now() else market_offer_states.changed_at end,
  updated_at=now();

insert into public.market_offer_history (
  offer_state_id,candidate_id,release_id,source_id,condition,channel,availability,
  item_price_eur,shipping_eur,effective_cost_eur,cost_basis,change_kind,observed_at
)
select mos.id,mos.candidate_id,mos.release_id,mos.source_id,mos.condition,mos.channel,mos.availability,
       mos.item_price_eur,mos.shipping_eur,mos.effective_cost_eur,mos.cost_basis,'initial',now()
from public.market_offer_states mos
join public.market_candidates mc on mc.id=mos.candidate_id
where mc.external_listing_id='m82142150932'
  and not exists (select 1 from public.market_offer_history h where h.offer_state_id=mos.id);

insert into public.market_release_signals (
  release_id,condition,market_regime,market_value_eur,low_eur,high_eur,
  confidence_score,confidence_label,retail_anchor_eur,active_anchor_eur,sold_anchor_eur,
  starting_offer_candidate_id,starting_item_price_eur,starting_shipping_eur,
  starting_effective_cost_eur,starting_cost_basis,retail_source_count,active_offer_count,
  current_offer_count,sold_units,sold_source_count,sold_evidence_count,shipping_known_ratio,
  trend_percent,trend_window_months,algorithm_version,computed_at
)
select rel.id,'new_complete_unbuilt','secondary_market_driven',12.31,12.31,12.31,
       15,'low',null,12.31,null,
       mc.id,12.31,0,12.31,'delivered',0,1,1,0,0,0,1.00,
       null,null,'r3',now()
from public.product_releases rel
join public.market_candidates mc on mc.resolved_release_id=rel.id
join public.price_sources ps on ps.id=mc.source_id and ps.slug='mercari_jp_public'
where rel.item_number='94704' and rel.release_year=2009
  and mc.external_listing_id='m82142150932' and mc.decision='accepted'
on conflict (release_id,condition) do update set
  market_regime=excluded.market_regime, market_value_eur=excluded.market_value_eur,
  low_eur=excluded.low_eur, high_eur=excluded.high_eur,
  confidence_score=excluded.confidence_score, confidence_label=excluded.confidence_label,
  retail_anchor_eur=excluded.retail_anchor_eur, active_anchor_eur=excluded.active_anchor_eur,
  sold_anchor_eur=excluded.sold_anchor_eur,
  starting_offer_candidate_id=excluded.starting_offer_candidate_id,
  starting_item_price_eur=excluded.starting_item_price_eur,
  starting_shipping_eur=excluded.starting_shipping_eur,
  starting_effective_cost_eur=excluded.starting_effective_cost_eur,
  starting_cost_basis=excluded.starting_cost_basis,
  retail_source_count=excluded.retail_source_count, active_offer_count=excluded.active_offer_count,
  current_offer_count=excluded.current_offer_count, sold_units=excluded.sold_units,
  sold_source_count=excluded.sold_source_count, sold_evidence_count=excluded.sold_evidence_count,
  shipping_known_ratio=excluded.shipping_known_ratio,
  trend_percent=null, trend_window_months=null, algorithm_version='r3', computed_at=now();