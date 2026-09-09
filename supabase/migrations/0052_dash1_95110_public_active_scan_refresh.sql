-- Public active-market refresh for Dash-1 Emperor Memorial 95110.
-- Adds two additional exact eBay offers and recomputes R3. Shipping is stored
-- separately and excluded from the public Market Value anchor.

with src as (
  select id from public.price_sources where slug='ebay_active_public'
), rel as (
  select id from public.product_releases where item_number='95110' and release_year=2018
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
select src.id, v.source_record_key, v.external_listing_id, 'ebay_public', v.external_listing_id,
       v.listing_url, v.title_raw, '95110', array[rel.id]::uuid[], rel.id,
       v.price, 'USD', v.shipping_cost, 'buyer_paid', 'active_listing', 'New',
       'new_complete_unbuilt', 'unknown', 'unknown', true, false, v.quantity,
       'exact', array['item_number_exact','edition_name_exact','release_year_stated','image_reviewed'],
       v.seller_fingerprint, '95110|ebay|'||v.seller_fingerprint,
       now(), 'accepted', '{}'::text[],
       'Exact public eBay active listing for Tamiya 95110 Dash-1 Emperor Memorial 30 Years of the Japan Cup.',
       jsonb_build_object('source','public_web_scan','scan_date','2026-09-09','fx_rate_to_eur',0.85981),
       now(), now()
from src cross join rel cross join (values
  ('ebay:223042648410','223042648410','https://www.ebay.com/itm/223042648410','Tamiya 95110 Mini 4WD Dash-1 Emperor 30th anniversary of the Japan Cup Japan',42.02::numeric,28.20::numeric,1,'motivation_middle'),
  ('ebay:327323708760','327323708760','https://www.ebay.com/itm/327323708760','Tamiya 95110-000 95110 Mini 4WD Limited Edition Dash No. 1 Emperor Memorial MS',54.15::numeric,7.00::numeric,null::integer,'omotenashi_quality')
) as v(source_record_key,external_listing_id,listing_url,title_raw,price,shipping_cost,quantity,seller_fingerprint)
on conflict (source_id, source_record_key) do update set
  listing_url=excluded.listing_url,
  title_raw=excluded.title_raw,
  price=excluded.price,
  currency=excluded.currency,
  shipping_cost=excluded.shipping_cost,
  shipping_basis=excluded.shipping_basis,
  observation_type=excluded.observation_type,
  condition_raw=excluded.condition_raw,
  condition=excluded.condition,
  is_complete=excluded.is_complete,
  is_lot=excluded.is_lot,
  quantity=excluded.quantity,
  possible_release_ids=excluded.possible_release_ids,
  resolved_release_id=excluded.resolved_release_id,
  match_confidence=excluded.match_confidence,
  match_evidence=excluded.match_evidence,
  seller_fingerprint=excluded.seller_fingerprint,
  decision=excluded.decision,
  review_notes=excluded.review_notes,
  raw_payload=excluded.raw_payload,
  last_observed_at=now(), updated_at=now();

with src as (
  select id from public.price_sources where slug='ebay_active_public'
), rel as (
  select id from public.product_releases where item_number='95110' and release_year=2018
), rows as (
  select mc.id as candidate_id, rel.id as release_id, src.id as source_id,
         mc.seller_fingerprint, mc.price, mc.shipping_cost,
         round(mc.price * 0.85981,2) as item_price_eur,
         round(mc.shipping_cost * 0.85981,2) as shipping_eur,
         round((mc.price+mc.shipping_cost) * 0.85981,2) as effective_cost_eur
  from public.market_candidates mc cross join src cross join rel
  where mc.source_id=src.id
    and mc.external_listing_id in ('223042648410','327323708760')
    and mc.resolved_release_id=rel.id and mc.decision='accepted'
)
insert into public.market_offer_states (
  candidate_id,release_id,source_id,condition,channel,availability,seller_fingerprint,
  item_price,shipping_price,currency,item_price_eur,shipping_eur,effective_cost_eur,
  cost_basis,fx_rate_to_eur,fx_rate_date,first_seen_at,last_checked_at,changed_at
)
select candidate_id,release_id,source_id,'new_complete_unbuilt','marketplace','in_stock',seller_fingerprint,
       price,shipping_cost,'USD',item_price_eur,shipping_eur,effective_cost_eur,
       'delivered',0.85981,date '2026-09-09',now(),now(),now()
from rows
on conflict (candidate_id) do update set
  availability='in_stock', item_price=excluded.item_price,
  shipping_price=excluded.shipping_price, currency=excluded.currency,
  item_price_eur=excluded.item_price_eur, shipping_eur=excluded.shipping_eur,
  effective_cost_eur=excluded.effective_cost_eur, cost_basis=excluded.cost_basis,
  fx_rate_to_eur=excluded.fx_rate_to_eur, fx_rate_date=excluded.fx_rate_date,
  seller_fingerprint=excluded.seller_fingerprint, last_checked_at=now(),
  changed_at=case when market_offer_states.item_price<>excluded.item_price or market_offer_states.shipping_price is distinct from excluded.shipping_price then now() else market_offer_states.changed_at end,
  updated_at=now();

insert into public.market_offer_history (
  offer_state_id,candidate_id,release_id,source_id,condition,channel,availability,
  item_price_eur,shipping_eur,effective_cost_eur,cost_basis,change_kind,observed_at
)
select mos.id,mos.candidate_id,mos.release_id,mos.source_id,mos.condition,mos.channel,mos.availability,
       mos.item_price_eur,mos.shipping_eur,mos.effective_cost_eur,mos.cost_basis,'initial',now()
from public.market_offer_states mos
join public.market_candidates mc on mc.id=mos.candidate_id
where mc.external_listing_id in ('223042648410','327323708760')
  and not exists (select 1 from public.market_offer_history h where h.offer_state_id=mos.id);

update public.market_release_signals
set market_regime='secondary_market_driven', market_value_eur=40.20,
    low_eur=40.20, high_eur=40.20, confidence_score=21, confidence_label='low',
    retail_anchor_eur=null, active_anchor_eur=40.20, sold_anchor_eur=null,
    starting_offer_candidate_id=(select id from public.market_candidates where source_id=(select id from public.price_sources where slug='ebay_active_public') and external_listing_id='223042648410'),
    starting_item_price_eur=36.13, starting_shipping_eur=24.25,
    starting_effective_cost_eur=60.38, starting_cost_basis='delivered',
    retail_source_count=0, active_offer_count=3, current_offer_count=3,
    sold_units=0, sold_source_count=0, sold_evidence_count=0,
    shipping_known_ratio=1.00, trend_percent=null, trend_window_months=null,
    algorithm_version='r3', computed_at=now()
where release_id=(select id from public.product_releases where item_number='95110' and release_year=2018)
  and condition='new_complete_unbuilt';
