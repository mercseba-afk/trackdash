-- ASK snapshots before the current EU-first basis — 2026-10-01
--
-- Migration 0200 introduced basis_version after the fact and conservatively
-- backfilled older rows. The Dyna-Hawk audit proved that some pre-2026-09-30
-- snapshots were not actually comparable with the current engine:
-- - item-only could precede delivered-cost handling;
-- - EBAY_GB / EBAY_CH could still participate in the Europe pool.
--
-- Preserve those rows for audit, but exclude them from current ASK trend math.

begin;

update public.market_release_ask_snapshots
set basis_version='legacy-pre-eu-first-2026-09'
where basis_version='v4-eu-delivered-2026-10'
  and computed_at < timestamptz '2026-09-30 20:00:00+00';

comment on column public.market_release_ask_snapshots.basis_version is
  'Versioned ASK comparability basis. legacy-pre-eu-first-2026-09 rows predate the Sep30 EU-first GB/CH correction and are excluded from current ASK trend math.';

commit;
