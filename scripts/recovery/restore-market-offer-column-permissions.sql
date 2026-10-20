-- Recovery only: new Frankfurt project uhojhqxnzrolmnopwgpy.
-- Reinstates the existing 0130 / 0144 / 0214 column grants after ACL alignment.
-- No full-table grant, policy change, evidence write or source-project operation.
begin;
set local lock_timeout = '2s';
grant select (
  release_id, source_id, channel, item_price_eur, shipping_eur,
  last_checked_at, condition, availability, candidate_id,
  effective_cost_eur, cost_basis
) on public.market_offer_states to trackdash_app;
commit;
