-- Keep the canonical recompute worker executable under the backend service role.
-- This changes permissions only; no market values, evidence, weights or signals
-- are mutated by this migration.

begin;

grant execute on function public.trackdash_enqueue_market_recompute(uuid, text) to service_role;

commit;
