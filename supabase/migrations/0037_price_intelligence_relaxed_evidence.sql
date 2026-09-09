-- 0037_price_intelligence_relaxed_evidence.sql
-- Price Intelligence R2: broad real-market evidence without relaxing Release identity.
--
-- Hard blockers remain: ambiguous Release, non-completed sale, missing price/date,
-- known lot/multi-item, known built/incomplete/custom, duplicate/reversed/revalidation,
-- or missing FX provenance for non-EUR normalization.
-- Secondary missing facts become quality flags instead of automatic exclusion.

-- ============================================================================
-- 1. Granular sale evidence quality + relaxed comparable market price
-- ============================================================================

alter table public.price_points
  add column if not exists evidence_grade text not null default 'indicative',
  add column if not exists quality_flags text[] not null default '{}'::text[],
  add column if not exists market_price_eur numeric(12, 2),
  add column if not exists market_price_basis text;

alter table public.price_points
  drop constraint if exists price_points_evidence_grade_check,
  drop constraint if exists price_points_quality_flags_check,
  drop constraint if exists price_points_market_price_basis_check,
  drop constraint if exists price_points_market_price_check;

alter table public.price_points
  add constraint price_points_evidence_grade_check
    check (evidence_grade in ('verified', 'indicative')),
  add constraint price_points_quality_flags_check
    check (quality_flags <@ array[
      'seller_unknown',
      'shipping_unknown',
      'completeness_unconfirmed',
      'condition_inferred',
      'inner_bags_unknown',
      'box_condition_unknown'
    ]::text[]),
  add constraint price_points_market_price_basis_check
    check (market_price_basis is null or market_price_basis in ('shipping_adjusted', 'raw_sale')),
  add constraint price_points_market_price_check
    check ((market_price_eur is null and market_price_basis is null)
      or (market_price_eur is not null and market_price_eur > 0 and market_price_basis is not null));

-- Preserve strict v1 normalized_price_eur semantics. R2 adds market_price_eur as
-- the broader comparable amount used by Collector Value/trend when secondary
-- shipping/completeness/seller metadata is incomplete.
update public.price_points
set
  market_price_eur = case
    when normalized_price_eur is not null then normalized_price_eur
    when currency = 'EUR' and shipping_basis in ('excluded', 'buyer_paid') then price
    else null
  end,
  market_price_basis = case
    when normalized_price_eur is not null then 'shipping_adjusted'
    when currency = 'EUR' and shipping_basis in ('excluded', 'buyer_paid') then 'shipping_adjusted'
    else null
  end,
  quality_flags = array_remove(array[
    case when shipping_basis in ('included_unknown', 'unknown') then 'shipping_unknown' end,
    case when is_complete is distinct from true then 'completeness_unconfirmed' end,
    case when condition = 'unknown' then 'condition_inferred' end,
    case when inner_bags_sealed = 'unknown' then 'inner_bags_unknown' end,
    case when box_condition = 'unknown' then 'box_condition_unknown' end
  ]::text[], null),
  evidence_grade = case
    when condition = 'new_complete_unbuilt'
      and is_complete is true
      and is_lot is false
      and quantity = 1
      and shipping_basis in ('excluded', 'included_exact', 'buyer_paid')
      and inner_bags_sealed <> 'unknown'
      and box_condition <> 'unknown'
    then 'verified'
    else 'indicative'
  end;

-- Seller identity lives on market_candidates. Add the seller_unknown flag for
-- existing pilot points where the linked candidate has no seller fingerprint.
update public.price_points pp
set quality_flags = case
  when not ('seller_unknown' = any(pp.quality_flags)) then array_append(pp.quality_flags, 'seller_unknown')
  else pp.quality_flags
end,
    evidence_grade = 'indicative'
from public.market_candidates mc
where mc.id = pp.candidate_id
  and mc.seller_fingerprint is null;

-- R2 valuation eligibility: exact/strong Release identity + real completed sale
-- remain mandatory. Missing seller/shipping/completeness may lower evidence grade
-- but no longer automatically discards an otherwise comparable sale.
alter table public.price_points
  drop constraint if exists price_points_valuation_eligibility_check;

alter table public.price_points
  add constraint price_points_valuation_eligibility_check
    check (
      valuation_eligible = false
      or (
        status = 'active'
        and needs_revalidation = false
        and observation_type in ('sold_confirmed', 'auction_awarded', 'marketplace_sold')
        and condition not in ('built_complete', 'incomplete_parts_custom')
        and match_confidence in ('exact', 'strong')
        and cardinality(match_evidence) > 0
        and is_complete is distinct from false
        and is_lot is distinct from true
        and (quantity is null or quantity = 1)
        and evidence_group_key is not null
        and market_price_eur is not null and market_price_eur > 0
        and sold_on is not null
        and evidence_grade in ('verified', 'indicative')
      )
    );

create index if not exists idx_price_points_market_quality
  on public.price_points (release_id, condition, valuation_eligible, evidence_grade, sold_on desc);

-- ============================================================================
-- 2. Current estimate quality composition
-- ============================================================================

alter table public.market_estimates
  add column if not exists verified_observation_count integer not null default 0,
  add column if not exists indicative_observation_count integer not null default 0,
  add column if not exists source_count integer not null default 1,
  add column if not exists quality_mix text not null default 'indicative_only';

alter table public.market_estimates
  drop constraint if exists market_estimates_quality_counts_check,
  drop constraint if exists market_estimates_quality_mix_check;

alter table public.market_estimates
  add constraint market_estimates_quality_counts_check
    check (
      verified_observation_count >= 0
      and indicative_observation_count >= 0
      and verified_observation_count + indicative_observation_count = sample_size
      and source_count >= 1
    ),
  add constraint market_estimates_quality_mix_check
    check (
      quality_mix in ('verified_only', 'mixed', 'indicative_only')
      and (quality_mix <> 'verified_only' or (verified_observation_count > 0 and indicative_observation_count = 0))
      and (quality_mix <> 'mixed' or (verified_observation_count > 0 and indicative_observation_count > 0))
      and (quality_mix <> 'indicative_only' or (verified_observation_count = 0 and indicative_observation_count > 0))
    );

-- ============================================================================
-- 3. Public monthly history quality composition
-- ============================================================================

alter table public.market_value_history
  add column if not exists sample_size integer not null default 1,
  add column if not exists verified_observation_count integer not null default 0,
  add column if not exists indicative_observation_count integer not null default 1,
  add column if not exists source_count integer not null default 1,
  add column if not exists quality_mix text not null default 'indicative_only';

alter table public.market_value_history
  drop constraint if exists market_value_history_quality_counts_check,
  drop constraint if exists market_value_history_quality_mix_check;

alter table public.market_value_history
  add constraint market_value_history_quality_counts_check
    check (
      sample_size >= independent_evidence_count
      and verified_observation_count >= 0
      and indicative_observation_count >= 0
      and verified_observation_count + indicative_observation_count = sample_size
      and source_count >= 1
    ),
  add constraint market_value_history_quality_mix_check
    check (
      quality_mix in ('verified_only', 'mixed', 'indicative_only')
      and (quality_mix <> 'verified_only' or (verified_observation_count > 0 and indicative_observation_count = 0))
      and (quality_mix <> 'mixed' or (verified_observation_count > 0 and indicative_observation_count > 0))
      and (quality_mix <> 'indicative_only' or (verified_observation_count = 0 and indicative_observation_count > 0))
    );

-- ============================================================================
-- 4. Monthly source statistics — service-only aggregate historical research
-- ============================================================================

create table if not exists public.market_monthly_source_stats (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null constraint market_monthly_source_stats_release_fk
    references public.product_releases(id) on delete restrict,
  source_id uuid not null constraint market_monthly_source_stats_source_fk
    references public.price_sources(id) on delete restrict,
  month date not null,
  condition text not null default 'unknown',
  query_key text not null,
  query_description text,
  sales_count integer not null,
  seller_count integer,
  average_price numeric(12, 2) not null,
  low_price numeric(12, 2),
  high_price numeric(12, 2),
  average_shipping numeric(12, 2),
  currency text not null,
  market_average_eur numeric(12, 2),
  fx_rate_to_eur numeric(18, 8),
  fx_rate_date date,
  evidence_grade text not null default 'indicative',
  provenance_url text,
  captured_at timestamptz not null default now(),
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint market_monthly_source_stats_unique
    unique (release_id, source_id, month, condition, query_key),
  constraint market_monthly_source_stats_month_check
    check (month = date_trunc('month', month)::date),
  constraint market_monthly_source_stats_condition_check
    check (condition in ('new_complete_unbuilt', 'built_complete', 'incomplete_parts_custom', 'unknown')),
  constraint market_monthly_source_stats_counts_check
    check (sales_count >= 1 and (seller_count is null or (seller_count >= 1 and seller_count <= sales_count))),
  constraint market_monthly_source_stats_price_check
    check (
      average_price > 0
      and (low_price is null or low_price >= 0)
      and (high_price is null or high_price >= 0)
      and ((low_price is null and high_price is null) or (low_price is not null and high_price is not null and low_price <= average_price and average_price <= high_price))
      and (average_shipping is null or average_shipping >= 0)
    ),
  constraint market_monthly_source_stats_grade_check
    check (evidence_grade in ('verified', 'indicative')),
  constraint market_monthly_source_stats_fx_check
    check (
      market_average_eur is null
      or (
        market_average_eur > 0
        and (
          (currency = 'EUR' and market_average_eur = average_price and fx_rate_to_eur is null and fx_rate_date is null)
          or
          (currency <> 'EUR' and fx_rate_to_eur is not null and fx_rate_to_eur > 0 and fx_rate_date is not null and market_average_eur = round(average_price * fx_rate_to_eur, 2))
        )
      )
    )
);

create index if not exists idx_market_monthly_source_stats_release_month
  on public.market_monthly_source_stats (release_id, condition, month desc);
create index if not exists idx_market_monthly_source_stats_source_month
  on public.market_monthly_source_stats (source_id, month desc);

alter table public.market_monthly_source_stats enable row level security;

-- Service-only raw/aggregate source evidence. No anon/authenticated/trackdash_app policy.
revoke all on table public.market_monthly_source_stats from anon, authenticated, trackdash_app, service_role;
grant select, insert, update on table public.market_monthly_source_stats to service_role;

-- No hard delete of source-derived historical stats through the normal service job.
-- Corrections are UPDATEs with retained provenance.

-- ============================================================================
-- 5. Existing market-table grants remain unchanged
-- ============================================================================

-- 0037 does not activate any crawler/API and does not mutate current estimates.
-- Existing pilot evidence is preserved; application code must explicitly regroup
-- and reclassify it before valuation_eligible can become true.
