-- Keep public market views on the restricted application role while allowing
-- the canonical observed-offer query to read its exact candidate identity and
-- Europe-first effective delivered cost. Row access remains constrained by the
-- existing market_offer_states_trackdash_runtime_read RLS policy.
grant select (candidate_id, effective_cost_eur)
on public.market_offer_states
to trackdash_app;
