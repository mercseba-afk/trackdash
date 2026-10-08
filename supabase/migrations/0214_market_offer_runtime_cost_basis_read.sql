-- Public market views read the observed offer cost basis through the restricted app role.
-- Row visibility remains constrained by the existing market_offer_states RLS policy.
-- This is a read-only permission correction; it does not modify market evidence or Price Engine logic.

grant select (cost_basis)
on public.market_offer_states
to trackdash_app;
