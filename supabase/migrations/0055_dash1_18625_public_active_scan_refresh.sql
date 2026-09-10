-- Public active-market refresh for Dash-1 Emperor 18625.
-- Adds two exact current eBay offers. Shipping remains separate from Market Value.

with src as (
  select id from public.price_sources where slug='ebay_active_public'
), rel as (
  select id from public.product_releases where item_number='18625' and release_year=2008
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
       v.listing_url, v.title_raw, '18625', array[rel.id]::uuid[], rel.id,
       v.price, 'USD', v.shipping_cost, v.shipping_basis, 'active_listing', 'New',
       'new_complete_unbuilt', 'unknown', 'unknown', true, false, null,
       'exact', array['item_number_exact','edition_name_exact','chassis_stated','image_reviewed'],
       v.seller_fingerprint, '18625|ebay|'||v.seller_fingerprint,
       now(), 'accepted', '{}'::text[],
       'Exact public eBay active listing for Tamiya 18625 Dash-1 Emperor MS Chassis, new unassembled kit.',
       jsonb_build_object('source','public_web_scan','scan_date','2026-09-10','fx_rate_to_eur',0.85981),
       now(), now()
from src cross join rel cross join (values
  ('ebay:176900758949','176900758949','https://www.ebay.com/itm/176900758949','Mini 4WD Dash 1 Emperor MS chassis 18625 TAMIYA From Japan',13.80::numeric,11.00::numeric,'buyer_paid','mokeijapan'),
  ('ebay:336211175629','336211175629','https://www.ebay.com/itm/336211175629','Tamiya 18625 1/32 Mini 4WD Pro Kit MS Chassis JR Dash-1 Emperor 1:32',31.99::numeric,null::numeric,'unknown','cmtdeals')
) as v(source_record_key,external_listing_id,listing_url,title_raw,price,shipping_cost,shipping_basis,seller_fingerprint)
on conflict (source_id, source_record_key) do update set
  listing_url=excluded.listing_url, title_raw=excluded.title_raw, price=excluded.price,
  currency=excluded.currency, shipping_cost=excluded.shipping_cost,
  shipping_basis=excluded.shipping_basis, observation_type=excluded.observation_type,
  condition_raw=excluded.condition_raw, condition=excluded.condition,
  is_complete=excluded.is_complete, is_lot=excluded.is_lot,
  possible_release_ids=excluded.possible_release_ids, resolved_release_id=excluded.resolved_release_id,
  match_confidence=excluded.match_confidence, match_evidence=excluded.match_evidence,
  seller_fingerprint=excluded.seller_fingerprint, decision=excluded.decision,
  review_notes=excluded.review_notes, raw_payload=excluded.raw_payload,
  last_observed_at=now(), updated_at=now();

with src as (
  select id from public.price_sources where slug='ebay_active_public'
), rel as (
  select id from public.product_releases where item_number='18625' and release_year=2008
), converted as (
  select mc.id as candidate_id, rel.id as release_id, src.id as source_id,
         mc.seller_fingerprint, mc.price, mc.shipping_cost,
         round(mc.price * 0.85981,2) as item_price_eur,
         case when mc.shipping_cost is null then null else round(mc.shipping_cost * 0.85981,2) end as shipping_eur
  from public.market_candidates mc cross join src cross join rel
  where mc.source_id=src.id
    and mc.external_listing_id in ('176900758949','336211175629')
    and mc.resolved_release_id=rel.id and mc.decision='accepted'
), rows as (
  select *, case when shipping_eur is null then null else item_price_eur + shipping_eur end as effective_cost_eur
  from converted
)
insert into public.market_offer_states (
  candidate_id,release_id,source_id,condition,channel,availability,seller_fingerprint,
  item_price,shipping_price,currency,item_price_eur,shipping_eur,effective_cost_eur,
  cost_basis,fx_rate_to_eur,fx_rate_date,first_seen_at,last_checked_at,changed_at
)
select candidate_id,release_id,source_id,'new_complete_unbuilt','marketplace','in_stock',seller_fingerprint,
       price,shipping_cost,'USD',item_price_eur,shipping_eur,effective_cost_eur,
       case when shipping_eur is null then 'item_only' else 'delivered' end,
       0.85981,date '2026-09-10',now(),now(),now()
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
where mc.external_listing_id in ('176900758949','336211175629')
  and not exists (select 1 from public.market_offer_history h where h.offer_state_id=mos.id);

update public.market_release_signals
set market_regime='retail_driven', market_value_eur=13.37,
    low_eur=12.25, high_eur=19.69, confidence_score=40, confidence_label='low',
    retail_anchor_eur=12.25, active_anchor_eur=19.69, sold_anchor_eur=null,
    starting_offer_candidate_id=(
      select mc.id from public.market_candidates mc
      join public.price_sources ps on ps.id=mc.source_id
      where ps.slug='tamiya_shop_public'
        and mc.resolved_release_id=(select id from public.product_releases where item_number='18625' and release_year=2008)
        and mc.decision='accepted'
      order by mc.last_observed_at desc limit 1
    ),
    starting_item_price_eur=8.00, starting_shipping_eur=2.85,
    starting_effective_cost_eur=10.85, starting_cost_basis='delivered',
    retail_source_count=2, active_offer_count=2, current_offer_count=4,
    sold_units=0, sold_source_count=0, sold_evidence_count=0,
    shipping_known_ratio=0.50, trend_percent=null, trend_window_months=null,
    algorithm_version='r3', computed_at=now()
where release_id=(select id from public.product_releases where item_number='18625' and release_year=2008)
  and condition='new_complete_unbuilt';