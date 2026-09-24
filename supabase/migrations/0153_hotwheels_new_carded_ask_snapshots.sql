-- Hot Wheels ASK history uses the existing market_release_ask_snapshots table.
-- Keep Mini 4WD semantics intact and add a dedicated canonical Hot Wheels condition.

alter table public.market_release_ask_snapshots
  drop constraint if exists market_release_ask_snapshots_condition_check;

alter table public.market_release_ask_snapshots
  add constraint market_release_ask_snapshots_condition_check
  check (condition in (
    'new_complete_unbuilt',
    'built_complete',
    'incomplete_parts_custom',
    'unknown',
    'new_carded'
  ));
