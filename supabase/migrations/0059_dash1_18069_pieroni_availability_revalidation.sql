-- Pieroni 18069 currently exposes contradictory stock UI: add-to-cart and
-- "notify when available" on the same page. Treat it as availability unknown
-- until a future scan can prove stock. Keep the candidate/history for audit.

with target as (
  select mos.id
  from public.market_offer_states mos
  join public.market_candidates mc on mc.id=mos.candidate_id
  join public.price_sources ps on ps.id=mos.source_id
  where ps.slug='pieroni_public'
    and mc.resolved_release_id=(select id from public.product_releases where item_number='18069' and release_year=2012)
)
update public.market_offer_states mos
set availability='unknown',
    last_checked_at=now(),
    changed_at=case when mos.availability <> 'unknown' then now() else mos.changed_at end,
    updated_at=now()
from target
where mos.id=target.id;

update public.market_candidates mc
set review_notes='Exact 18069 identity, but stock status was contradictory on revalidation 2026-09-10 (add-to-cart shown together with notify-when-available). Excluded from current R3 until availability is explicit.',
    needs_revalidation=true,
    last_observed_at=now(),
    updated_at=now()
where mc.source_id=(select id from public.price_sources where slug='pieroni_public')
  and mc.resolved_release_id=(select id from public.product_releases where item_number='18069' and release_year=2012);

insert into public.market_offer_history (
  offer_state_id,candidate_id,release_id,source_id,condition,channel,availability,
  item_price_eur,shipping_eur,effective_cost_eur,cost_basis,change_kind,observed_at
)
select mos.id,mos.candidate_id,mos.release_id,mos.source_id,mos.condition,mos.channel,mos.availability,
       mos.item_price_eur,mos.shipping_eur,mos.effective_cost_eur,mos.cost_basis,'availability_change',now()
from public.market_offer_states mos
join public.market_candidates mc on mc.id=mos.candidate_id
join public.price_sources ps on ps.id=mos.source_id
where ps.slug='pieroni_public'
  and mc.resolved_release_id=(select id from public.product_releases where item_number='18069' and release_year=2012)
  and not exists (
    select 1 from public.market_offer_history h
    where h.offer_state_id=mos.id and h.availability='unknown' and h.change_kind='availability_change'
  );

update public.market_release_signals
set market_regime='retail_driven',
    market_value_eur=16.09,
    low_eur=14.57,
    high_eur=21.99,
    confidence_score=66,
    confidence_label='medium',
    retail_anchor_eur=14.57,
    active_anchor_eur=21.99,
    sold_anchor_eur=16.85,
    starting_offer_candidate_id=(
      select mc.id from public.market_candidates mc
      join public.price_sources ps on ps.id=mc.source_id
      where ps.slug='rcjaz_public'
        and mc.resolved_release_id=(select id from public.product_releases where item_number='18069' and release_year=2012)
      limit 1
    ),
    starting_item_price_eur=11.44,
    starting_shipping_eur=null,
    starting_effective_cost_eur=null,
    starting_cost_basis='item_only',
    retail_source_count=2,
    active_offer_count=1,
    current_offer_count=3,
    sold_units=54,
    sold_source_count=2,
    sold_evidence_count=2,
    shipping_known_ratio=0.3333,
    trend_percent=null,
    trend_window_months=null,
    algorithm_version='r3',
    computed_at=now()
where release_id=(select id from public.product_releases where item_number='18069' and release_year=2012)
  and condition='new_complete_unbuilt';