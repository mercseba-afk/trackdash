-- Market Method v3 rollout fixes.
-- The service-role reader needs access to confirmed TrackDash marketplace sales.
grant select on table public.marketplace_sales to service_role;

-- The reviewed 95467 Product Research history proves that the recent 5-sale
-- subwindow belongs to the same single seller. Preserve that known concentration
-- so v3 does not mistake unknown seller diversity for a broad market.
update public.market_aggregate_observations
set seller_count=1,
    updated_at=now()
where release_id='ace0d1b1-aaf3-589a-977c-a3df07c83c73'::uuid
  and source_id=(select id from public.price_sources where slug='ebay_product_research')
  and grain='rolling_window'
  and period_start=date '2026-06-12'
  and period_end=date '2026-08-20'
  and sales_count=5;
