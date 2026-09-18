-- Market Method v3: seller diversity + public evidence coverage.
-- v3 keeps R3 as the computational engine but changes the publication method:
-- completed sales are primary, retail is region-aware corroboration/fallback,
-- ASK prices stay context-only, and broad sold history is a conservative fallback.

alter table public.market_release_signals
  add column if not exists sold_seller_count integer;

alter table public.market_release_signals
  drop constraint if exists market_release_signals_seller_count_check;

alter table public.market_release_signals
  add constraint market_release_signals_seller_count_check
  check (sold_seller_count is null or sold_seller_count >= 1);

alter table public.market_release_signals
  alter column market_method_version set default 'v3';

alter table public.market_release_monthly_signals
  alter column market_method_version set default 'v3';

update public.market_release_monthly_signals
set market_method_version='v3'
where market_method_version is distinct from 'v3';
