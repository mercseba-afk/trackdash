-- 0036_price_intelligence_v1.sql
-- TrackDash Price Intelligence v1 storage + integrity guardrails.
--
-- Scope:
-- - storage and invariants only; NO marketplace adapter, crawler, cron, valuation worker, or email provider.
-- - Collector Value benchmark: New / Unused + Complete + Unbuilt.
-- - UNKNOWN > INVENTED: ambiguous identity/condition/sale/shipping is stored, but never silently promoted into valuation.
-- - operational/raw tables are service-role only; public clients see only sanitized derived surfaces.
-- - price_points are normalized completed-sale observations only and are never hard-deleted.

-- ============================================================================
-- 0. SAFETY GUARD — the v0 placeholder market tables must still be empty.
-- ============================================================================

do $$
begin
  if exists (select 1 from public.price_sources limit 1) then
    raise exception '0036 aborted: public.price_sources is not empty; migrate source rows explicitly.';
  end if;

  if exists (select 1 from public.price_points limit 1) then
    raise exception '0036 aborted: public.price_points is not empty; migrate market evidence explicitly.';
  end if;

  if exists (select 1 from public.market_estimates limit 1) then
    raise exception '0036 aborted: public.market_estimates is not empty; migrate estimates explicitly.';
  end if;
end
$$;

-- ============================================================================
-- 1. PRICE SOURCES — source registry, fail-closed until access is verified.
-- ============================================================================

alter table public.price_sources
  add column if not exists origin text not null default 'external_market',
  add column if not exists ingestion_mode text not null default 'disabled';

-- v1 has no source-weighting formula. The empty v0 registry lets us remove
-- the prototype score rather than carrying a misleading, unused weight.
alter table public.price_sources
  drop column if exists base_trust_score;

alter table public.price_sources
  alter column is_active set default false;

alter table public.price_sources
  drop constraint if exists price_sources_origin_check,
  drop constraint if exists price_sources_ingestion_mode_check;

alter table public.price_sources
  add constraint price_sources_origin_check
    check (origin in ('external_market', 'trackdash_marketplace', 'trackdash_transaction', 'reference')),
  add constraint price_sources_ingestion_mode_check
    check (ingestion_mode in ('api', 'licensed_feed', 'manual', 'internal', 'disabled'));

-- source_type is a v0 compatibility column. Its future controlled vocabulary is
-- intentionally NOT invented in 0036: observation_type carries the v1 evidence
-- classification, and adapters remain disabled until access/licensing is verified.

-- ============================================================================
-- 2. SCAN RUNS — operational audit, service-role only.
-- ============================================================================

create table public.market_scan_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running',
  targets_attempted integer not null default 0,
  targets_succeeded integer not null default 0,
  candidates_found integer not null default 0,
  accepted_count integer not null default 0,
  review_count integer not null default 0,
  rejected_count integer not null default 0,
  duplicate_count integer not null default 0,
  valuations_changed integer not null default 0,
  trends_changed integer not null default 0,
  error_summary text,
  created_at timestamptz not null default now(),
  constraint market_scan_runs_status_check
    check (status in ('running', 'completed', 'partial', 'failed')),
  constraint market_scan_runs_time_check
    check (finished_at is null or finished_at >= started_at),
  constraint market_scan_runs_counts_check
    check (
      targets_attempted >= 0 and
      targets_succeeded >= 0 and
      candidates_found >= 0 and
      accepted_count >= 0 and
      review_count >= 0 and
      rejected_count >= 0 and
      duplicate_count >= 0 and
      valuations_changed >= 0 and
      trends_changed >= 0
    )
);

create index idx_market_scan_runs_started_at
  on public.market_scan_runs (started_at desc);

-- ============================================================================
-- 3. SCAN TARGETS — exactly one schedule row per Release × Source.
-- ============================================================================

create table public.market_scan_targets (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null constraint market_scan_targets_release_id_product_releases_id_fk
    references public.product_releases(id) on delete cascade,
  source_id uuid not null constraint market_scan_targets_source_id_price_sources_id_fk
    references public.price_sources(id) on delete cascade,
  enabled boolean not null default false,
  scan_interval_hours integer not null default 168,
  priority integer not null default 0,
  last_attempt_at timestamptz,
  last_success_at timestamptz,
  next_scan_at timestamptz not null default now(),
  consecutive_failures integer not null default 0,
  last_error text,
  locked_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint market_scan_targets_release_source_unique unique (release_id, source_id),
  constraint market_scan_targets_interval_check check (scan_interval_hours >= 24),
  constraint market_scan_targets_failures_check check (consecutive_failures >= 0)
);

create index idx_market_scan_targets_due
  on public.market_scan_targets (enabled, next_scan_at, priority desc);

-- ============================================================================
-- 4. MARKET CANDIDATES — CURRENT source state, UPSERT by source record identity.
--    Full listing price/status history is intentionally deferred to v2.
-- ============================================================================

create table public.market_candidates (
  id uuid primary key default gen_random_uuid(),
  scan_run_id uuid constraint market_candidates_scan_run_id_market_scan_runs_id_fk
    references public.market_scan_runs(id) on delete set null,
  source_id uuid not null constraint market_candidates_source_id_price_sources_id_fk
    references public.price_sources(id) on delete restrict,

  source_record_key text not null,
  external_listing_id text,
  original_source text,
  original_record_id text,
  listing_url text,

  title_raw text,
  item_number_observed text,
  possible_release_ids uuid[] not null default '{}'::uuid[],
  resolved_release_id uuid constraint market_candidates_resolved_release_id_product_releases_id_fk
    references public.product_releases(id) on delete restrict,

  price numeric(12, 2),
  currency text,
  shipping_cost numeric(12, 2),
  shipping_basis text not null default 'unknown',

  observation_type text not null default 'unknown',
  condition_raw text,
  condition text not null default 'unknown',
  inner_bags_sealed text not null default 'unknown',
  box_condition text not null default 'unknown',
  is_complete boolean,
  is_lot boolean,
  quantity integer,

  match_confidence text,
  match_evidence text[] not null default '{}'::text[],

  seller_fingerprint text,
  evidence_group_key text,

  -- Source time is never fabricated. sold_on is the source sale calendar date;
  -- sold_at is populated only when the source also gives an actual timestamp.
  sold_at timestamptz,
  sold_on date,
  listing_date date,
  observed_at timestamptz not null default now(),

  decision text not null default 'needs_review',
  reason_codes text[] not null default '{}'::text[],
  review_notes text,

  state_hash text,
  needs_revalidation boolean not null default false,

  raw_payload jsonb,
  first_observed_at timestamptz not null default now(),
  last_observed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint market_candidates_source_record_unique unique (source_id, source_record_key),
  constraint market_candidates_identity_unique unique (id, source_id, resolved_release_id),
  constraint market_candidates_price_check check (price is null or price >= 0),
  constraint market_candidates_shipping_cost_check check (shipping_cost is null or shipping_cost >= 0),
  constraint market_candidates_quantity_check check (quantity is null or quantity >= 1),
  constraint market_candidates_observation_time_check check (last_observed_at >= first_observed_at),
  constraint market_candidates_shipping_basis_check
    check (shipping_basis in ('excluded', 'included_exact', 'included_unknown', 'buyer_paid', 'unknown')),
  constraint market_candidates_observation_type_check
    check (observation_type in (
      'sold_confirmed',
      'auction_awarded',
      'marketplace_sold',
      'active_listing',
      'retail_in_stock',
      'dealer_buyback',
      'retail_out_of_stock',
      'ended_unsold',
      'msrp_reference',
      'unknown'
    )),
  constraint market_candidates_condition_check
    check (condition in ('new_complete_unbuilt', 'built_complete', 'incomplete_parts_custom', 'unknown')),
  constraint market_candidates_inner_bags_check
    check (inner_bags_sealed in ('yes', 'no', 'unknown')),
  constraint market_candidates_box_condition_check
    check (box_condition in ('normal', 'significantly_damaged', 'unknown')),
  constraint market_candidates_match_confidence_check
    check (match_confidence is null or match_confidence in ('exact', 'strong', 'ambiguous', 'rejected')),
  constraint market_candidates_decision_check
    check (decision in ('accepted', 'needs_review', 'rejected', 'duplicate')),
  constraint market_candidates_match_evidence_check
    check (
      match_evidence <@ array[
        'item_number_exact',
        'edition_name_exact',
        'release_year_stated',
        'reissue_stated',
        'chassis_stated',
        'color_variant_match',
        'packaging_generation_match',
        'image_reviewed',
        'official_reference_match',
        'manual_override'
      ]::text[]
    ),
  -- PostgreSQL CHECK accepts NULL results, so accepted-state requirements are
  -- written with explicit IS NOT NULL tests rather than relying on IN alone.
  constraint market_candidates_accepted_audit_check
    check (
      decision <> 'accepted'
      or (
        resolved_release_id is not null
        and match_confidence is not null
        and match_confidence in ('exact', 'strong')
        and cardinality(match_evidence) > 0
      )
    )
);

create index idx_market_candidates_release
  on public.market_candidates (resolved_release_id, decision);
create index idx_market_candidates_review
  on public.market_candidates (decision, needs_revalidation, last_observed_at desc);
create index idx_market_candidates_original_record
  on public.market_candidates (original_source, original_record_id);

-- ============================================================================
-- 5. PRICE POINTS — normalized completed-sale observations only.
--    Active asks / retail / dealer evidence stays in market_candidates.
--    The v0 table is empty by guard above, so rebuild it cleanly instead of
--    carrying contradictory prototype columns (price_type/is_sold/raw_payload/etc.).
--    Repo/dependency review confirmed no incoming FK depends on the v0 table;
--    rebuilding it here therefore cannot orphan another repository table.
-- ============================================================================

drop table public.price_points;

create table public.price_points (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null constraint price_points_candidate_id_market_candidates_id_fk
    references public.market_candidates(id) on delete restrict,
  release_id uuid not null constraint price_points_release_id_product_releases_id_fk
    references public.product_releases(id) on delete restrict,
  source_id uuid not null constraint price_points_source_id_price_sources_id_fk
    references public.price_sources(id) on delete restrict,

  observation_type text not null,
  condition text not null,

  price numeric(12, 2) not null,
  currency text not null,
  shipping_cost numeric(12, 2),
  shipping_basis text not null,

  -- Native-currency item-only value. If shipping cannot be separated exactly,
  -- this stays NULL and the point is automatically ineligible for Collector Value.
  valuation_price numeric(12, 2),
  normalized_price_eur numeric(12, 2),
  fx_rate_to_eur numeric(18, 8),
  fx_rate_date date,

  inner_bags_sealed text not null default 'unknown',
  box_condition text not null default 'unknown',
  is_complete boolean,
  is_lot boolean,
  quantity integer,

  match_confidence text not null,
  match_evidence text[] not null,
  evidence_group_key text,

  valuation_eligible boolean not null default false,
  status text not null default 'active',
  needs_revalidation boolean not null default false,

  sold_at timestamptz,
  sold_on date not null,
  observed_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint price_points_candidate_unique unique (candidate_id),
  constraint price_points_candidate_identity_fk
    foreign key (candidate_id, source_id, release_id)
    references public.market_candidates(id, source_id, resolved_release_id)
    on update cascade on delete restrict,
  constraint price_points_price_check check (price >= 0),
  constraint price_points_shipping_cost_check check (shipping_cost is null or shipping_cost >= 0),
  constraint price_points_quantity_check check (quantity is null or quantity >= 1),
  constraint price_points_observation_type_check
    check (observation_type in ('sold_confirmed', 'auction_awarded', 'marketplace_sold')),
  constraint price_points_condition_check
    check (condition in ('new_complete_unbuilt', 'built_complete', 'incomplete_parts_custom', 'unknown')),
  constraint price_points_shipping_basis_check
    check (shipping_basis in ('excluded', 'included_exact', 'included_unknown', 'buyer_paid', 'unknown')),
  constraint price_points_inner_bags_check
    check (inner_bags_sealed in ('yes', 'no', 'unknown')),
  constraint price_points_box_condition_check
    check (box_condition in ('normal', 'significantly_damaged', 'unknown')),
  constraint price_points_match_confidence_check
    check (match_confidence in ('exact', 'strong')),
  constraint price_points_match_evidence_check
    check (
      cardinality(match_evidence) > 0
      and match_evidence <@ array[
        'item_number_exact',
        'edition_name_exact',
        'release_year_stated',
        'reissue_stated',
        'chassis_stated',
        'color_variant_match',
        'packaging_generation_match',
        'image_reviewed',
        'official_reference_match',
        'manual_override'
      ]::text[]
    ),
  constraint price_points_status_check
    check (status in ('active', 'excluded', 'reversed')),
  -- Shipping rule is structural, not advisory.
  constraint price_points_shipping_value_check
    check (
      (shipping_basis in ('included_unknown', 'unknown')
        and valuation_price is null
        and normalized_price_eur is null
        and fx_rate_to_eur is null
        and fx_rate_date is null)
      or
      (shipping_basis in ('excluded', 'buyer_paid')
        and valuation_price = price)
      or
      (shipping_basis = 'included_exact'
        and shipping_cost is not null
        and price >= shipping_cost
        and valuation_price = price - shipping_cost)
    ),
  -- FX normalization is reproducible. EUR points use no synthetic FX record;
  -- non-EUR points require the exact stored rate/date and must round to cents.
  constraint price_points_fx_check
    check (
      valuation_price is null
      or (
        currency = 'EUR'
        and normalized_price_eur = valuation_price
        and fx_rate_to_eur is null
        and fx_rate_date is null
      )
      or (
        currency <> 'EUR'
        and fx_rate_to_eur is not null
        and fx_rate_to_eur > 0
        and fx_rate_date is not null
        and normalized_price_eur = round(valuation_price * fx_rate_to_eur, 2)
      )
    ),
  -- Principal Collector Value eligibility: fail closed unless EVERY required
  -- condition is explicit. Secondary attributes (inner bags / box condition)
  -- remain descriptive and do not silently alter the benchmark.
  constraint price_points_valuation_eligibility_check
    check (
      valuation_eligible = false
      or (
        status = 'active'
        and needs_revalidation = false
        and observation_type in ('sold_confirmed', 'auction_awarded', 'marketplace_sold')
        and condition = 'new_complete_unbuilt'
        and match_confidence in ('exact', 'strong')
        and cardinality(match_evidence) > 0
        and is_complete is true
        and is_lot is false
        and quantity = 1
        and evidence_group_key is not null
        and shipping_basis in ('excluded', 'included_exact', 'buyer_paid')
        and valuation_price is not null
        and valuation_price > 0
        and normalized_price_eur is not null
        and normalized_price_eur > 0
        and sold_on is not null
      )
    )
);

create index idx_price_points_release_condition
  on public.price_points (release_id, condition);
create index idx_price_points_sold
  on public.price_points (release_id, sold_on, sold_at);
create index idx_price_points_valuation
  on public.price_points (
    release_id,
    condition,
    valuation_eligible,
    status,
    needs_revalidation,
    sold_on,
    sold_at
  );
create index idx_price_points_evidence_group
  on public.price_points (release_id, condition, evidence_group_key);

-- Release identity correction propagation is structural. If a candidate moves to
-- a different Release, the linked normalized point is immediately made ineligible
-- and both rows are marked for revalidation before the composite FK cascade moves
-- price_points.release_id. This prevents a corrected identity from being trusted
-- under the new Release without an explicit re-review.
create or replace function public.market_candidate_release_revalidation()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.resolved_release_id is distinct from old.resolved_release_id then
    new.needs_revalidation := true;

    update public.price_points
    set needs_revalidation = true,
        valuation_eligible = false,
        updated_at = now()
    where candidate_id = old.id;
  end if;

  return new;
end;
$$;

revoke all on function public.market_candidate_release_revalidation() from public, anon, authenticated, trackdash_app;
grant execute on function public.market_candidate_release_revalidation() to service_role;

create trigger market_candidates_release_revalidation
before update of resolved_release_id on public.market_candidates
for each row
when (old.resolved_release_id is distinct from new.resolved_release_id)
execute function public.market_candidate_release_revalidation();

-- Enforce the methodology invariant: accepted evidence is reversed/excluded,
-- never physically deleted. A future migration can explicitly replace this
-- guard if retention/legal requirements ever demand a different model.
create or replace function public.prevent_price_point_hard_delete()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  raise exception 'price_points are append-preserved; use status=excluded/reversed instead of DELETE';
end;
$$;

create trigger prevent_price_point_hard_delete
before delete on public.price_points
for each row execute function public.prevent_price_point_hard_delete();

revoke execute on function public.prevent_price_point_hard_delete() from public, anon, authenticated, trackdash_app;

-- ============================================================================
-- 6. MARKET ESTIMATES — current sanitized derived cache, fully recomputable.
--    No row means zero independent eligible evidence groups.
-- ============================================================================

drop table public.market_estimates;

create table public.market_estimates (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null constraint market_estimates_release_id_product_releases_id_fk
    references public.product_releases(id) on delete cascade,
  condition text not null,
  display_mode text not null,

  -- value is deliberately NULL for the 2–4 evidence tier, where the UI must
  -- show only an Estimated Range rather than manufacture a headline number.
  value numeric(12, 2),
  currency text not null default 'EUR',
  low numeric(12, 2),
  high numeric(12, 2),
  median numeric(12, 2),
  range_method text,

  sample_size integer not null,
  independent_evidence_count integer not null,
  window_days integer not null default 365,

  lowest_current_ask numeric(12, 2),
  last_verified_sale numeric(12, 2),
  last_verified_sale_at timestamptz,
  last_verified_sale_on date,

  trend_percent numeric(7, 2),
  trend_window_days integer,

  last_scanned_at timestamptz,
  last_valuation_change_at timestamptz,
  algorithm_version text not null default 'v1',
  computed_at timestamptz not null default now(),

  constraint market_estimates_release_condition_unique unique (release_id, condition),
  constraint market_estimates_condition_check
    check (condition in ('new_complete_unbuilt', 'built_complete', 'incomplete_parts_custom', 'unknown')),
  constraint market_estimates_currency_check check (currency = 'EUR'),
  constraint market_estimates_display_mode_check
    check (display_mode in ('last_sale', 'range', 'value')),
  constraint market_estimates_range_method_check
    check (range_method is null or range_method in ('cleaned_min_max', 'q1_q3')),
  constraint market_estimates_counts_check
    check (
      sample_size >= independent_evidence_count
      and independent_evidence_count >= 1
      and window_days in (365, 730)
    ),
  constraint market_estimates_range_check
    check (
      (low is null and high is null)
      or (low is not null and high is not null and low <= high)
    ),
  constraint market_estimates_last_sale_check
    check (
      (last_verified_sale is null and last_verified_sale_at is null and last_verified_sale_on is null)
      or (last_verified_sale is not null and last_verified_sale_on is not null)
    ),
  constraint market_estimates_value_check
    check (
      (value is null or value >= 0)
      and (low is null or low >= 0)
      and (high is null or high >= 0)
      and (median is null or median >= 0)
      and (lowest_current_ask is null or lowest_current_ask >= 0)
      and (last_verified_sale is null or last_verified_sale > 0)
    ),
  constraint market_estimates_trend_check
    check (
      (trend_percent is null and trend_window_days is null)
      or (trend_percent is not null and trend_window_days in (90, 365))
    ),
  -- Tier semantics are enforced so UI precision cannot accidentally outrun evidence.
  constraint market_estimates_tier_check
    check (
      (independent_evidence_count = 1
        and display_mode = 'last_sale'
        and range_method is null
        and last_verified_sale is not null
        and value = last_verified_sale
        and low is null and high is null and median is null)
      or
      (independent_evidence_count between 2 and 4
        and display_mode = 'range'
        and range_method = 'cleaned_min_max'
        and value is null
        and median is null
        and low is not null and high is not null)
      or
      (independent_evidence_count between 5 and 9
        and display_mode = 'value'
        and range_method = 'cleaned_min_max'
        and value is not null
        and median is not null
        and low is not null and high is not null
        and low <= value and value <= high
        and value = median)
      or
      (independent_evidence_count >= 10
        and display_mode = 'value'
        and range_method = 'q1_q3'
        and value is not null
        and median is not null
        and low is not null and high is not null
        and low <= value and value <= high
        and value = median)
    )
);

create index idx_market_estimates_release
  on public.market_estimates (release_id);

-- ============================================================================
-- 7. MARKET VALUE HISTORY — sanitized derived snapshots for charting/audit.
-- ============================================================================

create table public.market_value_history (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null constraint market_value_history_release_id_product_releases_id_fk
    references public.product_releases(id) on delete restrict,
  condition text not null,
  snapshot_period date not null,
  display_mode text not null,
  value numeric(12, 2),
  low numeric(12, 2),
  high numeric(12, 2),
  median numeric(12, 2),
  range_method text,
  currency text not null default 'EUR',
  independent_evidence_count integer not null,
  window_days integer not null,
  algorithm_version text not null default 'v1',
  recorded_at timestamptz not null default now(),
  constraint market_value_history_release_condition_period_unique
    unique (release_id, condition, snapshot_period),
  constraint market_value_history_condition_check
    check (condition in ('new_complete_unbuilt', 'built_complete', 'incomplete_parts_custom', 'unknown')),
  constraint market_value_history_currency_check check (currency = 'EUR'),
  constraint market_value_history_display_mode_check
    check (display_mode in ('last_sale', 'range', 'value')),
  constraint market_value_history_range_method_check
    check (range_method is null or range_method in ('cleaned_min_max', 'q1_q3')),
  constraint market_value_history_counts_check
    check (independent_evidence_count >= 1 and window_days in (365, 730)),
  constraint market_value_history_range_check
    check ((low is null and high is null) or (low is not null and high is not null and low <= high)),
  constraint market_value_history_value_check
    check (
      (value is null or value >= 0)
      and (low is null or low >= 0)
      and (high is null or high >= 0)
      and (median is null or median >= 0)
    ),
  constraint market_value_history_tier_check
    check (
      (independent_evidence_count = 1
        and display_mode = 'last_sale'
        and range_method is null
        and value is not null
        and low is null and high is null and median is null)
      or
      (independent_evidence_count between 2 and 4
        and display_mode = 'range'
        and range_method = 'cleaned_min_max'
        and value is null
        and median is null
        and low is not null and high is not null)
      or
      (independent_evidence_count between 5 and 9
        and display_mode = 'value'
        and range_method = 'cleaned_min_max'
        and value is not null
        and median is not null
        and low is not null and high is not null
        and low <= value and value <= high
        and value = median)
      or
      (independent_evidence_count >= 10
        and display_mode = 'value'
        and range_method = 'q1_q3'
        and value is not null
        and median is not null
        and low is not null and high is not null
        and low <= value and value <= high
        and value = median)
    )
);

create index idx_market_value_history_release_period
  on public.market_value_history (release_id, condition, snapshot_period desc);

-- ============================================================================
-- 8. REVIEW DIGESTS — thin idempotent send-log only, service-role only.
-- ============================================================================

create table public.market_review_digests (
  id uuid primary key default gen_random_uuid(),
  period_start timestamptz not null,
  period_end timestamptz not null,
  kind text not null default 'weekly_review',
  status text not null default 'pending',
  sent_at timestamptz,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint market_review_digests_period_kind_unique unique (period_start, period_end, kind),
  constraint market_review_digests_kind_check check (kind in ('weekly_review', 'scanner_failure')),
  constraint market_review_digests_status_check check (status in ('pending', 'sent', 'failed')),
  constraint market_review_digests_period_check check (period_end > period_start),
  constraint market_review_digests_sent_check
    check ((status = 'sent' and sent_at is not null) or status <> 'sent')
);

-- ============================================================================
-- 9. RLS / PRIVILEGES.
-- ============================================================================

alter table public.market_scan_runs enable row level security;
alter table public.market_scan_targets enable row level security;
alter table public.market_candidates enable row level security;
alter table public.price_points enable row level security;
alter table public.market_estimates enable row level security;
alter table public.market_value_history enable row level security;
alter table public.market_review_digests enable row level security;

-- Reset every market privilege explicitly. Supabase grants service_role CRUD on
-- many public tables by default, and migration 0005 previously granted CRUD on
-- v0 price_points to trackdash_app; GRANT alone would not remove those rights.
revoke all privileges on
  public.price_sources,
  public.market_scan_runs,
  public.market_scan_targets,
  public.market_candidates,
  public.price_points,
  public.market_estimates,
  public.market_value_history,
  public.market_review_digests
from anon, authenticated, trackdash_app, service_role;

-- Public/client-facing read surface.
grant select on public.price_sources to anon, authenticated, trackdash_app;
grant select on public.market_estimates to anon, authenticated, trackdash_app;
grant select on public.market_value_history to anon, authenticated, trackdash_app;
grant select on public.price_points to authenticated, trackdash_app;

create policy price_points_authenticated_read
  on public.price_points
  for select
  to authenticated
  using (true);

create policy market_estimates_public_read
  on public.market_estimates
  for select
  to anon, authenticated
  using (true);

create policy market_value_history_public_read
  on public.market_value_history
  for select
  to anon, authenticated
  using (true);

-- Secure ingestion/valuation jobs use service_role/secret-key server context.
-- DELETE remains available only for configuration/current derived cache where
-- deletion is semantically meaningful; evidence/audit/history rows are preserved.
grant select, insert, update, delete on public.price_sources to service_role;
grant select, insert, update on public.market_scan_runs to service_role;
grant select, insert, update, delete on public.market_scan_targets to service_role;
grant select, insert, update on public.market_candidates to service_role;
grant select, insert, update on public.price_points to service_role;
grant select, insert, update, delete on public.market_estimates to service_role;
grant select, insert, update on public.market_value_history to service_role;
grant select, insert, update on public.market_review_digests to service_role;

-- ============================================================================
-- 10. LOCKED SERVICE-LAYER INVARIANTS (documented here; implementation follows).
-- ============================================================================
--
-- A. Candidate lifecycle / idempotency
--    - UPSERT market_candidates on (source_id, source_record_key).
--    - first_observed_at never changes; last_observed_at/state_hash track current source state.
--    - when a listing becomes a verified completed sale, promote/update exactly one price_point
--      through UNIQUE(candidate_id). Retries must be idempotent.
--
-- B. Atomic scan locking
--    - acquire scan targets via conditional UPDATE / SKIP LOCKED; never read-then-write.
--
-- C. Evidence grouping v1 — deterministic fixed-anchor 7-day clusters
--    - candidates/points must first share Release + normalized condition + source + seller_fingerprint.
--    - seller_fingerprint NULL => evidence_group_key NULL => never valuation eligible.
--    - sold_on is always the source sale calendar date; sold_at is optional exact-time precision.
--    - never use observed_at as a fake sale time.
--    - sort by sold_on, then sold_at when present, then stable source_record_key.
--    - earliest unassigned sale date starts a cluster; later sales with sold_on < anchor + 7 days
--      join it; the first sale on/after anchor + 7 days starts the next cluster.
--    - key is a deterministic hash/string of release|condition|source|seller_fingerprint|anchor.
--    - revalidation/backfill recomputes group keys before recomputing estimates; calendar-week
--      buckets are explicitly forbidden because they create artificial boundaries.
--
-- D. Cross-source duplicate handling
--    - exact original_record_id when available may identify the same event.
--    - otherwise DUPLICATE_SUSPECTED => needs_review; never auto-merge uncertain cross-source rows.
--
-- E. Collector Value eligibility
--    - only completed sales become price_points.
--    - only valuation_eligible=true points feed Collector Value.
--    - active asks / retail / dealer / sold-out / unsold evidence remains in market_candidates and
--      may inform secondary context such as lowest_current_ask, never the Collector Value median/range.
--
-- F. Shipping
--    - excluded / buyer_paid: valuation_price = observed price.
--    - included_exact: valuation_price = observed price - exact known shipping_cost.
--    - included_unknown / unknown: valuation_price=NULL and valuation_eligible=false.
--    - no estimated/fabricated shipping deduction.
--
-- G. Valuation tiers — INDEPENDENT evidence groups
--    0       -> no market_estimates row
--    1       -> Last Verified Sale only
--    2-4     -> Estimated Range only
--    5-9     -> median + conservative validated range = min/max of eligible groups after
--               duplicates, reversed/excluded points, revalidation rows, and flagged outliers are removed
--    >=10    -> median + Typical Range Q1-Q3
--    Primary UI never displays the raw evidence/sample count.
--
-- H. Adaptive evidence window
--    - every recomputation starts from 365 days.
--    - expand to at most 730 days only when the 365-day set is insufficient for the best available tier.
--    - fresh evidence therefore contracts a previously-expanded estimate automatically.
--
-- I. Outliers
--    - only when >=3 prior independent groups exist.
--    - >3x or <1/3 prior median => POSSIBLE_OUTLIER + needs_review.
--    - zero prior evidence is exempt; never reject the first sale as an outlier.
--
-- J. Trend
--    - recent 90d vs previous 90d only with >=3 independent groups in BOTH periods.
--    - otherwise recent 365d vs previous 365d with the same floor.
--    - otherwise trend_percent/trend_window_days are NULL; no public trend.
--
-- K. Catalog corrections
--    - any Release identity correction automatically marks candidate + linked price_point
--      needs_revalidation=true and valuation_eligible=false; service logic then re-matches,
--      recomputes evidence groups, and recomputes the estimate before publication.
--    - evidence is preserved; never hard-delete to hide a catalog correction.
--
-- L. Japanese/ambiguous parsing
--    - adapter dictionaries may map explicit terms into structured condition/match evidence.
--    - ambiguous language routes to needs_review in v1; no heuristic NLP auto-resolution.
--
-- M. Review digest
--    - send only when relevant review/errors exist.
--    - market_review_digests stores period/kind/send status only; no rendered body or recipient.
