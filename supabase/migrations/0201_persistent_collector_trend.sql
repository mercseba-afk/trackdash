-- Persistent collector trend state — 2026-10-01
--
-- Collector trend is an event-driven, persistent market state.
-- A routine recompute with no new material directional evidence must not erase
-- a previously confirmed rising/falling trend.
--
-- ASK trend remains a separate, non-authoritative seller-price signal.
--
-- This migration also restores three already-audited SOLD trends that were
-- previously overwritten by later recomputes with no monthly trend payload.

begin;

alter table public.market_release_signals
  add column if not exists trend_basis text;

alter table public.market_release_signals
  add column if not exists trend_updated_at timestamptz;

-- Backfill any currently present trend as SOLD-based unless a later migration
-- explicitly identifies another value basis.
update public.market_release_signals
set trend_basis=coalesce(trend_basis,'sold'),
    trend_updated_at=coalesce(trend_updated_at,computed_at)
where trend_percent is not null;

-- Restore the latest audited directional SOLD trend only where the current
-- signal lost it entirely. Raw audit evidence remains the provenance source.
with audited as (
  select distinct on (a.release_id,a.condition)
         a.release_id,
         a.condition,
         (a.raw_payload->'trend_evidence'->>'trend_percent')::numeric as trend_percent,
         (a.raw_payload->'trend_evidence'->>'trend_window_months')::int as trend_window_months,
         a.captured_at
  from public.market_aggregate_observations a
  where a.raw_payload ? 'trend_evidence'
    and nullif(a.raw_payload->'trend_evidence'->>'trend_percent','') is not null
    and nullif(a.raw_payload->'trend_evidence'->>'trend_window_months','') is not null
  order by a.release_id,a.condition,a.captured_at desc
)
update public.market_release_signals s
set trend_percent=a.trend_percent,
    trend_window_months=a.trend_window_months,
    trend_basis='sold',
    trend_updated_at=a.captured_at
from audited a
where s.release_id=a.release_id
  and s.condition=a.condition
  and s.trend_percent is null
  and abs(a.trend_percent) >= 5
  and a.trend_window_months in (1,3,6,12);

alter table public.market_release_signals
  drop constraint if exists market_release_signals_trend_check;

alter table public.market_release_signals
  add constraint market_release_signals_trend_check
  check (
    (
      trend_percent is null
      and trend_window_months is null
      and trend_basis is null
      and trend_updated_at is null
    )
    or (
      trend_percent is not null
      and trend_window_months in (1,3,6,12)
      and trend_basis in ('sold','market_value')
      and trend_updated_at is not null
    )
  );

comment on column public.market_release_signals.trend_basis is
  'Evidence basis of the persistent collector trend. ASK trend is stored separately and must not substitute for collector value/SOLD direction.';

comment on column public.market_release_signals.trend_updated_at is
  'Timestamp when the persistent collector trend direction/strength was last materially confirmed; routine unchanged scans must not advance it.';

commit;
