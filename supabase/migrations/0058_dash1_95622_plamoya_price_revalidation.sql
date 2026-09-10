-- Revalidate Tamiya 95622 against the current Planet/Plamoya listing.
-- The item is explicitly in stock (qty 1) at JPY 1,980 on 2026-09-10.
-- Replace the stale JPY 2,980 current offer state, preserve history, and recompute R3.

with target as (
  select mc.id as candidate_id, mos.id as offer_state_id
  from public.market_candidates mc
  join public.market_offer_states mos on mos.candidate_id = mc.id
  join public.price_sources ps on ps.id = mc.source_id
  where ps.slug = 'plamoya_public'
    and mc.resolved_release_id = (
      select id from public.product_releases where item_number='95622' and release_year=2021
    )
)
update public.market_candidates mc
set price = 1980.00,
    currency = 'JPY',
    observation_type = 'retail_in_stock',
    condition = 'new_complete_unbuilt',
    decision = 'accepted',
    match_confidence = 'exact',
    review_notes = 'Revalidated 2026-09-10: Planet/Plamoya lists Tamiya 95622 at JPY 1,980 with stock count 1.',
    raw_payload = coalesce(mc.raw_payload, '{}'::jsonb) || jsonb_build_object(
      'revalidated_on','2026-09-10',
      'stock_count',1,
      'listed_price_jpy',1980,
      'fx_rate_to_eur',0.005597
    ),
    last_observed_at = now(),
    updated_at = now()
from target
where mc.id = target.candidate_id;

with target as (
  select mos.id as offer_state_id
  from public.market_offer_states mos
  join public.market_candidates mc on mc.id = mos.candidate_id
  join public.price_sources ps on ps.id = mos.source_id
  where ps.slug = 'plamoya_public'
    and mc.resolved_release_id = (
      select id from public.product_releases where item_number='95622' and release_year=2021
    )
)
update public.market_offer_states mos
set availability = 'low_stock',
    item_price = 1980.00,
    shipping_price = null,
    currency = 'JPY',
    item_price_eur = 11.08,
    shipping_eur = null,
    effective_cost_eur = null,
    cost_basis = 'item_only',
    fx_rate_to_eur = 0.005597,
    fx_rate_date = date '2026-09-10',
    last_checked_at = now(),
    changed_at = case when mos.item_price <> 1980.00 then now() else mos.changed_at end,
    updated_at = now()
from target
where mos.id = target.offer_state_id;

insert into public.market_offer_history (
  offer_state_id,candidate_id,release_id,source_id,condition,channel,availability,
  item_price_eur,shipping_eur,effective_cost_eur,cost_basis,change_kind,observed_at
)
select mos.id,mos.candidate_id,mos.release_id,mos.source_id,mos.condition,mos.channel,mos.availability,
       mos.item_price_eur,mos.shipping_eur,mos.effective_cost_eur,mos.cost_basis,'price_change',now()
from public.market_offer_states mos
join public.market_candidates mc on mc.id=mos.candidate_id
join public.price_sources ps on ps.id=mos.source_id
where ps.slug='plamoya_public'
  and mc.resolved_release_id=(select id from public.product_releases where item_number='95622' and release_year=2021)
  and not exists (
    select 1 from public.market_offer_history h
    where h.offer_state_id=mos.id and h.change_kind='price_change' and h.item_price_eur=11.08
  );

update public.market_release_signals
set market_regime='mixed_scarce',
    market_value_eur=29.26,
    low_eur=11.08,
    high_eur=47.29,
    confidence_score=23,
    confidence_label='low',
    retail_anchor_eur=11.08,
    active_anchor_eur=47.29,
    sold_anchor_eur=null,
    starting_offer_candidate_id=(
      select mc.id from public.market_candidates mc
      join public.price_sources ps on ps.id=mc.source_id
      where ps.slug='plamoya_public'
        and mc.resolved_release_id=(select id from public.product_releases where item_number='95622' and release_year=2021)
      limit 1
    ),
    starting_item_price_eur=11.08,
    starting_shipping_eur=null,
    starting_effective_cost_eur=null,
    starting_cost_basis='item_only',
    retail_source_count=1,
    active_offer_count=1,
    current_offer_count=2,
    sold_units=0,
    sold_source_count=0,
    sold_evidence_count=0,
    shipping_known_ratio=0.50,
    trend_percent=null,
    trend_window_months=null,
    algorithm_version='r3',
    computed_at=now()
where release_id=(select id from public.product_releases where item_number='95622' and release_year=2021)
  and condition='new_complete_unbuilt';