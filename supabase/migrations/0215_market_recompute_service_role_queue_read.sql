-- Recompute expiry maintenance reads existing queue rows directly before
-- enqueueing/claiming through SECURITY DEFINER RPCs.
-- Least-privilege correction only: direct queue mutations remain RPC-owned.

grant select on public.market_recompute_queue to service_role;
