-- ASK trend snapshot basis versioning — 2026-10-01
--
-- Prevents trend contamination when historical ASK snapshots were computed
-- with a different price basis (for example item-only vs delivered).
--
-- Current comparable basis:
--   v4-eu-delivered-2026-10
--
-- Existing snapshots are conservatively treated as current-basis unless a
-- known incompatible row has been verified. Dyna-Hawk GX 95467 on 2026-09-19
-- is explicitly known to be item-only (EUR 46.36) while later snapshots are
-- delivered (EUR 58.56), so that baseline is quarantined from trend math.

begin;

alter table public.market_release_ask_snapshots
  add column if not exists basis_version text;

update public.market_release_ask_snapshots
set basis_version='v4-eu-delivered-2026-10'
where basis_version is null;

update public.market_release_ask_snapshots
set basis_version='legacy-item-only-pre-delivered'
where release_id='ace0d1b1-aaf3-589a-977c-a3df07c83c73'::uuid
  and condition='new_complete_unbuilt'
  and snapshot_date=date '2026-09-19'
  and typical_eur=46.36
  and offer_count=1;

alter table public.market_release_ask_snapshots
  alter column basis_version set default 'v4-eu-delivered-2026-10';

alter table public.market_release_ask_snapshots
  alter column basis_version set not null;

create index if not exists idx_market_release_ask_snapshots_basis
  on public.market_release_ask_snapshots(release_id, condition, basis_version, snapshot_date desc);

comment on column public.market_release_ask_snapshots.basis_version is
  'Versioned ASK price/comparability basis. Trend calculations must compare only snapshots with the current basis version.';

commit;
