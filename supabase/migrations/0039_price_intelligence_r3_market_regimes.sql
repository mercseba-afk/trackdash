-- 0039_price_intelligence_r3_market_regimes.sql
-- TrackDash Price Intelligence R3.
--
-- Adds the four-market model:
--   1) current retail offers with verified availability,
--   2) current fixed-price marketplace offers,
--   3) completed-sale evidence and approved aggregate research,
--   4) historical / out-of-stock offer states retained for trend only.
--
-- R3 does NOT use price to infer Release identity and does NOT activate any
-- crawler/provider automatically. Scanner queue rows default disabled.

create table public.market_aggregate_observations (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.price_sources(id) on delete restrict,
  release_id uuid references public.product_releases(id) on delete restrict,
  item_number text not null,
  possible_release_ids uuid[] not null default '{}'::uuid[],
  attribution_status text not null,
  grain text not null,
  period_start date not null,
  period_end date not null,
  condition text not null default 'unknown',
  query_key text not null,
  query_description text,
  sales_count integer not null,
  seller_count integer,
  average_item_price numeric(12,2) not null,
  low_item_price numeric(12,2),
  high_item_price numeric(12,2),
  average_shipping numeric(12,2),
  free_shipping_pct numeric(5,2),
  auction_sales_count integer,
  buy_it_now_sales_count integer,
  accepted_offer_sales_count integer,
  currency text not null,
  market_average_eur numeric(12,2),
  fx_rate_to_eur numeric(18,8),
  fx_rate_date date,
  evidence_grade text not null default 'indicative',
  provenance_url text,
  raw_payload jsonb,
  captured_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint market_aggregate_observations_unique
    unique (source_id, query_key, period_start, period_end, item_number),
  constraint market_aggregate_attribution_check
    check (attribution_status in ('release_exact', 'release_matched', 'item_pool', 'ambiguous_release')),
  constraint market_aggregate_identity_check
    check (
      (release_id is not null and attribution_status in ('release_exact', 'release_matched'))
      or
      (release_id is null and attribution_status in ('item_pool', 'ambiguous_release'))
    ),
  constraint market_aggregate_grain_check
    check (grain in ('monthly', 'rolling_window', 'full_history')),
  constraint market_aggregate_period_check
    check (period_end >= period_start),
  constraint market_aggregate_condition_check
    check (condition in ('new_complete_unbuilt', 'built_complete', 'incomplete_parts_custom', 'unknown')),
  constraint market_aggregate_counts_check
    check (
      sales_count >= 1
      and (seller_count is null or seller_count >= 1)
      and (auction_sales_count is null or auction_sales_count >= 0)
      and (buy_it_now_sales_count is null or buy_it_now_sales_count >= 0)
      and (accepted_offer_sales_count is null or accepted_offer_sales_count >= 0)
    ),
  constraint market_aggregate_price_check
    check (
      average_item_price > 0
      and (low_item_price is null or low_item_price >= 0)
      and (high_item_price is null or high_item_price >= 0)
      and (
        (low_item_price is null and high_item_price is null)
        or
        (
          low_item_price is not null
          and high_item_price is not null
          and low_item_price <= average_item_price
          and average_item_price <= high_item_price
        )
      )
      and (average_shipping is null or average_shipping >= 0)
      and (free_shipping_pct is null or (free_shipping_pct >= 0 and free_shipping_pct <= 100))
    ),
  constraint market_aggregate_grade_check
    check (evidence_grade in ('verified', 'indicative')),
  constraint market_aggregate_fx_check
    check (
      market_average_eur is null
      or (
        market_average_eur > 0
        and (
          (
            currency = 'EUR'
            and market_average_eur = average_item_price
            and fx_rate_to_eur is null
            and fx_rate_date is null
          )
          or
          (
            currency <> 'EUR'
            and fx_rate_to_eur is not null
            and fx_rate_to_eur > 0
            and fx_rate_date is not null
            and market_average_eur = round(average_item_price * fx_rate_to_eur, 2)
          )
        )
      )
    )
);

create index idx_market_aggregate_release_period
  on public.market_aggregate_observations (release_id, condition, period_end desc);
create index idx_market_aggregate_item_period
  on public.market_aggregate_observations (item_number, period_end desc);

create table public.market_offer_states (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null,
  release_id uuid not null references public.product_releases(id) on delete restrict,
  source_id uuid not null references public.price_sources(id) on delete restrict,
  condition text not null default 'new_complete_unbuilt',
  channel text not null,
  availability text not null,
  seller_fingerprint text,
  item_price numeric(12,2) not null,
  shipping_price numeric(12,2),
  currency text not null,
  item_price_eur numeric(12,2) not null,
  shipping_eur numeric(12,2),
  effective_cost_eur numeric(12,2),
  cost_basis text not null,
  fx_rate_to_eur numeric(18,8),
  fx_rate_date date,
  first_seen_at timestamptz not null,
  last_checked_at timestamptz not null,
  changed_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint market_offer_states_candidate_unique unique (candidate_id),
  constraint market_offer_states_candidate_identity_fk
    foreign key (candidate_id, source_id, release_id)
    references public.market_candidates(id, source_id, resolved_release_id)
    on update cascade on delete restrict,
  constraint market_offer_states_condition_check
    check (condition in ('new_complete_unbuilt', 'built_complete', 'incomplete_parts_custom', 'unknown')),
  constraint market_offer_states_channel_check
    check (channel in ('retail', 'marketplace')),
  constraint market_offer_states_availability_check
    check (availability in ('in_stock', 'low_stock', 'preorder', 'backorder', 'out_of_stock', 'discontinued', 'unknown')),
  constraint market_offer_states_price_check
    check (item_price > 0 and item_price_eur > 0),
  constraint market_offer_states_shipping_check
    check (shipping_price is null or shipping_price >= 0),
  constraint market_offer_states_cost_basis_check
    check (
      (
        cost_basis = 'delivered'
        and shipping_eur is not null
        and shipping_eur >= 0
        and effective_cost_eur = item_price_eur + shipping_eur
      )
      or
      (
        cost_basis = 'item_only'
        and effective_cost_eur is null
      )
    ),
  constraint market_offer_states_time_check
    check (last_checked_at >= first_seen_at and changed_at >= first_seen_at)
);

create index idx_market_offer_states_release_current
  on public.market_offer_states (release_id, condition, channel, availability);
create index idx_market_offer_states_source
  on public.market_offer_states (source_id, last_checked_at desc);

create table public.market_offer_history (
  id uuid primary key default gen_random_uuid(),
  offer_state_id uuid not null references public.market_offer_states(id) on delete restrict,
  candidate_id uuid not null references public.market_candidates(id) on delete restrict,
  release_id uuid not null references public.product_releases(id) on delete restrict,
  source_id uuid not null references public.price_sources(id) on delete restrict,
  condition text not null,
  channel text not null,
  availability text not null,
  item_price_eur numeric(12,2) not null,
  shipping_eur numeric(12,2),
  effective_cost_eur numeric(12,2),
  cost_basis text not null,
  change_kind text not null,
  observed_at timestamptz not null,
  created_at timestamptz not null default now(),

  constraint market_offer_history_state_observed_unique unique (offer_state_id, observed_at),
  constraint market_offer_history_channel_check check (channel in ('retail', 'marketplace')),
  constraint market_offer_history_availability_check
    check (availability in ('in_stock', 'low_stock', 'preorder', 'backorder', 'out_of_stock', 'discontinued', 'unknown')),
  constraint market_offer_history_cost_basis_check check (cost_basis in ('delivered', 'item_only')),
  constraint market_offer_history_change_kind_check
    check (change_kind in ('initial', 'price_change', 'availability_change', 'price_and_availability', 'shipping_change'))
);

create index idx_market_offer_history_release
  on public.market_offer_history (release_id, condition, observed_at desc);

create table public.market_release_signals (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null references public.product_releases(id) on delete cascade,
  condition text not null default 'new_complete_unbuilt',
  market_regime text not null,
  market_value_eur numeric(12,2),
  low_eur numeric(12,2),
  high_eur numeric(12,2),
  confidence_score integer not null,
  confidence_label text not null,
  retail_anchor_eur numeric(12,2),
  active_anchor_eur numeric(12,2),
  sold_anchor_eur numeric(12,2),
  starting_offer_candidate_id uuid references public.market_candidates(id) on delete set null,
  starting_item_price_eur numeric(12,2),
  starting_shipping_eur numeric(12,2),
  starting_effective_cost_eur numeric(12,2),
  starting_cost_basis text,
  retail_source_count integer not null default 0,
  active_offer_count integer not null default 0,
  current_offer_count integer not null default 0,
  sold_units integer not null default 0,
  sold_source_count integer not null default 0,
  sold_evidence_count integer not null default 0,
  shipping_known_ratio numeric(5,4) not null default 0,
  trend_percent numeric(8,2),
  trend_window_months integer,
  algorithm_version text not null default 'r3',
  computed_at timestamptz not null default now(),

  constraint market_release_signals_release_condition_unique unique (release_id, condition),
  constraint market_release_signals_condition_check
    check (condition in ('new_complete_unbuilt', 'built_complete', 'incomplete_parts_custom', 'unknown')),
  constraint market_release_signals_regime_check
    check (market_regime in ('retail_driven', 'mixed_scarce', 'secondary_market_driven', 'insufficient')),
  constraint market_release_signals_confidence_check
    check (confidence_score between 0 and 100 and confidence_label in ('low', 'medium', 'high')),
  constraint market_release_signals_values_check
    check (
      (market_value_eur is null or market_value_eur > 0)
      and (low_eur is null or low_eur > 0)
      and (high_eur is null or high_eur > 0)
      and (
        (low_eur is null and high_eur is null)
        or (low_eur is not null and high_eur is not null and low_eur <= high_eur)
      )
    ),
  constraint market_release_signals_counts_check
    check (
      retail_source_count >= 0
      and active_offer_count >= 0
      and current_offer_count >= 0
      and sold_units >= 0
      and sold_source_count >= 0
      and sold_evidence_count >= 0
    ),
  constraint market_release_signals_shipping_ratio_check
    check (shipping_known_ratio >= 0 and shipping_known_ratio <= 1),
  constraint market_release_signals_starting_basis_check
    check (starting_cost_basis is null or starting_cost_basis in ('delivered', 'item_only')),
  constraint market_release_signals_trend_check
    check (
      (trend_percent is null and trend_window_months is null)
      or (trend_percent is not null and trend_window_months in (1, 3, 6, 12))
    )
);

create index idx_market_release_signals_release
  on public.market_release_signals (release_id);

create table public.market_release_monthly_signals (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null references public.product_releases(id) on delete cascade,
  condition text not null default 'new_complete_unbuilt',
  month date not null,
  market_regime text not null,
  market_value_eur numeric(12,2),
  retail_anchor_eur numeric(12,2),
  active_anchor_eur numeric(12,2),
  sold_anchor_eur numeric(12,2),
  sold_units integer not null default 0,
  retail_source_count integer not null default 0,
  active_offer_count integer not null default 0,
  confidence_score integer not null,
  algorithm_version text not null default 'r3',
  computed_at timestamptz not null default now(),

  constraint market_release_monthly_signals_unique unique (release_id, condition, month),
  constraint market_release_monthly_signals_month_check check (month = date_trunc('month', month)::date),
  constraint market_release_monthly_signals_regime_check
    check (market_regime in ('retail_driven', 'mixed_scarce', 'secondary_market_driven', 'insufficient')),
  constraint market_release_monthly_signals_confidence_check check (confidence_score between 0 and 100)
);

create index idx_market_release_monthly_signals_release_month
  on public.market_release_monthly_signals (release_id, condition, month desc);

create table public.market_scan_queue (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null references public.product_releases(id) on delete cascade,
  source_id uuid not null references public.price_sources(id) on delete cascade,
  scan_scope text not null,
  enabled boolean not null default false,
  activity_tier text not null default 'normal',
  scan_interval_hours integer not null,
  priority integer not null default 0,
  last_attempt_at timestamptz,
  last_success_at timestamptz,
  last_material_change_at timestamptz,
  stable_since timestamptz,
  next_scan_at timestamptz not null default now(),
  consecutive_failures integer not null default 0,
  last_error text,
  locked_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint market_scan_queue_release_source_scope_unique unique (release_id, source_id, scan_scope),
  constraint market_scan_queue_scope_check check (scan_scope in ('retail', 'active_marketplace', 'sold_research')),
  constraint market_scan_queue_tier_check check (activity_tier in ('hot', 'normal', 'cold')),
  constraint market_scan_queue_interval_check check (scan_interval_hours >= 24),
  constraint market_scan_queue_failures_check check (consecutive_failures >= 0)
);

create index idx_market_scan_queue_due
  on public.market_scan_queue (enabled, next_scan_at, priority desc);

alter table public.market_aggregate_observations enable row level security;
alter table public.market_offer_states enable row level security;
alter table public.market_offer_history enable row level security;
alter table public.market_release_signals enable row level security;
alter table public.market_release_monthly_signals enable row level security;
alter table public.market_scan_queue enable row level security;

revoke all privileges on
  public.market_aggregate_observations,
  public.market_offer_states,
  public.market_offer_history,
  public.market_release_signals,
  public.market_release_monthly_signals,
  public.market_scan_queue
from anon, authenticated, trackdash_app, service_role;

grant select on public.market_release_signals to anon, authenticated, trackdash_app;
grant select on public.market_release_monthly_signals to anon, authenticated, trackdash_app;

create policy market_release_signals_public_read
  on public.market_release_signals
  for select
  to anon, authenticated
  using (true);

create policy market_release_monthly_signals_public_read
  on public.market_release_monthly_signals
  for select
  to anon, authenticated
  using (true);

grant select, insert, update on public.market_aggregate_observations to service_role;
grant select, insert, update on public.market_offer_states to service_role;
grant select, insert on public.market_offer_history to service_role;
grant select, insert, update, delete on public.market_release_signals to service_role;
grant select, insert, update on public.market_release_monthly_signals to service_role;
grant select, insert, update, delete on public.market_scan_queue to service_role;

comment on table public.market_aggregate_observations is
  'Approved aggregate sold-market research. Ambiguous reused item numbers remain item pools and never become Release values automatically.';
comment on table public.market_offer_states is
  'Current retail / fixed-price marketplace offer state for an exact resolved Release.';
comment on table public.market_offer_history is
  'State-change history only. Out-of-stock prices remain historical and do not represent current purchasable value.';
comment on table public.market_release_signals is
  'R3 composite current market signal combining retail, active marketplace, and sold evidence without artificial sample thresholds.';
comment on table public.market_scan_queue is
  'Adaptive staggered scanner queue. Rows default disabled; providers are activated separately after access/compliance verification.';
