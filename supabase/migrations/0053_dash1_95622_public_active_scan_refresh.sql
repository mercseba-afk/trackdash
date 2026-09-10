-- Public active-market refresh for Dash-1 Emperor Special Kit 95622.
-- Adds one exact eBay offer and recomputes R3 while keeping shipping separate.

with src as (
  select id from public.price_sources where slug='ebay_active_public'
), rel as (
  select id from public.product_releases where item_number='95622' and release_year=2021
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
select src.id, 'ebay:167598594498', '167598594498', 'ebay_public', '167598594498',
       'https://www.ebay.com/itm/167598594498',
       'TAMIYA 95622 Mini 4WD DASH-1 EMPEROR (TYPE 3 Chassis) Special kit',
       '95622', array[rel.id]::uuid[], rel.id,
       55.00, 'USD', 38.00, 'buyer_paid', 'active_listing', 'New',
       'new_complete_unbuilt', 'unknown', 'unknown', true, false, null,
       'exact', array['item_number_exact','edition_name_exact','official_reference_match'],
       'inamori-sangyo', '95622|ebay|inamori-sangyo',
       now(), 'accepted', '{}'::text[],
       'Exact public eBay active listing for Tamiya 95622 Dash-1 Emperor Type 3 Chassis Special Kit; item code is unique to the 2021 reissue in the catalog.',
       jsonb_build_object('source','public_web_scan','scan_date','2026-09-10','fx_rate_to_eur',0.85981),
       now(), now()
from src cross join rel
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
  select id from public.product_releases where item_number='95622' and release_year=2021
), row_to_upsert as (
  select mc.id as candidate_id, rel.id as release_id, src.id as source_id,
         mc.seller_fingerprint, mc.price, mc.shipping_cost,
         round(mc.price * 0.85981,2) as item_price_eur,
         round(mc.shipping_cost * 0.85981,2) as shipping_eur,
         round((mc.price+mc.shipping_cost) * 0.85981,2) as effective_cost_eur
  from public.market_candidates mc cross join src cross join rel
  where mc.source_id=src.id
    and mc.external_listing_id='167598594498'
    and mc.resolved_release_id=rel.id and mc.decision='accepted'
)
insert into public.market_offer_states (
  candidate_id,release_id,source_id,condition,channel,availability,seller_fingerprint,
  item_price,shipping_price,currency,item_price_eur,shipping_eur,effective_cost_eur,
  cost_basis,fx_rate_to_eur,fx_rate_date,first_seen_at,last_checked_at,changed_at
)
select candidate_id,release_id,source_id,'new_complete_unbuilt','marketplace','in_stock',seller_fingerprint,
       price,shipping_cost,'USD',item_price_eur,shipping_eur,effective_cost_eur,
       'delivered',0.85981,date '2026-09-10',now(),now(),now()
from row_to_upsert
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
where mc.external_listing_id='167598594498'
  and not exists (select 1 from public.market_offer_history h where h.offer_state_id=mos.id);

update public.market_release_signals
set market_regime='mixed_scarce', market_value_eur=32.03,
    low_eur=16.68, high_eur=47.29, confidence_score=27, confidence_label='low',
    retail_anchor_eur=16.68, active_anchor_eur=47.29, sold_anchor_eur=null,
    starting_offer_candidate_id=(select id from public.market_candidates where source_id=(select id from public.price_sources where slug='plamoya_public') and resolved_release_id=(select id from public.product_releases where item_number='95622' and release_year=2021) and decision='accepted' order by last_observed_at desc limit 1),
    starting_item_price_eur=16.68, starting_shipping_eur=null,
    starting_effective_cost_eur=null, starting_cost_basis='item_only',
    retail_source_count=1, active_offer_count=1, current_offer_count=2,
    sold_units=0, sold_source_count=0, sold_evidence_count=0,
    shipping_known_ratio=0.50, trend_percent=null, trend_window_months=null,
    algorithm_version='r3', computed_at=now()
where release_id=(select id from public.product_releases where item_number='95622' and release_year=2021)
  and condition='new_complete_unbuilt';