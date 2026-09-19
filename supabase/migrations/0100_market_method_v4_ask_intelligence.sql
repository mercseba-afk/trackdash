-- Market Method v4: publish meaningful concentrated sold evidence and expose ASK intelligence.
--
-- The current computational engine remains R3 internally. v4 changes the public
-- market method: seller concentration lowers confidence instead of vetoing a
-- meaningful sold value, while active marketplace asks gain their own robust
-- typical/range/trend signals without being allowed to manufacture Market Value.

alter table public.market_release_signals
  add column if not exists active_low_eur numeric(12,2),
  add column if not exists active_high_eur numeric(12,2),
  add column if not exists ask_trend_percent numeric(8,2),
  add column if not exists ask_trend_window_days integer;

alter table public.market_release_signals
  alter column market_method_version set default 'v4';

alter table public.market_release_signals
  drop constraint if exists market_release_signals_ask_range_check;

alter table public.market_release_signals
  add constraint market_release_signals_ask_range_check
  check (
    (active_low_eur is null and active_high_eur is null)
    or (
      active_low_eur is not null
      and active_high_eur is not null
      and active_low_eur > 0
      and active_high_eur >= active_low_eur
    )
  );

alter table public.market_release_signals
  drop constraint if exists market_release_signals_ask_trend_check;

alter table public.market_release_signals
  add constraint market_release_signals_ask_trend_check
  check (
    (ask_trend_percent is null and ask_trend_window_days is null)
    or (
      ask_trend_percent is not null
      and ask_trend_window_days between 3 and 30
    )
  );

create table if not exists public.market_release_ask_snapshots (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null references public.product_releases(id) on delete cascade,
  condition text not null default 'new_complete_unbuilt',
  snapshot_date date not null,
  typical_eur numeric(12,2),
  low_eur numeric(12,2),
  high_eur numeric(12,2),
  offer_count integer not null default 0,
  computed_at timestamptz not null default now(),
  constraint market_release_ask_snapshots_unique
    unique (release_id, condition, snapshot_date),
  constraint market_release_ask_snapshots_condition_check
    check (condition in ('new_complete_unbuilt', 'built_complete', 'incomplete_parts_custom', 'unknown')),
  constraint market_release_ask_snapshots_values_check
    check (
      offer_count >= 0
      and (typical_eur is null or typical_eur > 0)
      and (low_eur is null or low_eur > 0)
      and (high_eur is null or high_eur > 0)
      and (
        (low_eur is null and high_eur is null)
        or (
          low_eur is not null
          and high_eur is not null
          and low_eur <= high_eur
        )
      )
    )
);

create index if not exists idx_market_release_ask_snapshots_release_date
  on public.market_release_ask_snapshots(release_id, condition, snapshot_date desc);

alter table public.market_release_ask_snapshots enable row level security;

grant select, insert, update on table public.market_release_ask_snapshots to service_role;
