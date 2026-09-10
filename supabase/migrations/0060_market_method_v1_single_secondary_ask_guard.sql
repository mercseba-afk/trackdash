-- Market Method v1 publication guard.
-- A lone secondary-market asking price with no retail and no Release-specific
-- sold evidence remains stored as market evidence, but is not sufficient to
-- publish a Market Value.

update public.market_release_signals
set market_regime = 'insufficient',
    market_value_eur = null,
    low_eur = null,
    high_eur = null,
    computed_at = now()
where release_id = (
  select id from public.product_releases
  where item_number = '94704' and release_year = 2009
)
  and condition = 'new_complete_unbuilt'
  and retail_source_count = 0
  and sold_evidence_count = 0
  and active_offer_count < 2;
