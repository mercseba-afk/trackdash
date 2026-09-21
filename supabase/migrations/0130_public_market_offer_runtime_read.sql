-- Backend-only market offer projection used by public Release/Collection market views.
grant select (
  release_id,source_id,channel,item_price_eur,shipping_eur,last_checked_at,condition,availability
) on public.market_offer_states to trackdash_app;

drop policy if exists market_offer_states_trackdash_runtime_read on public.market_offer_states;
create policy market_offer_states_trackdash_runtime_read
on public.market_offer_states
for select to trackdash_app
using (
  condition='new_complete_unbuilt'
  and availability in ('in_stock','low_stock')
);\n