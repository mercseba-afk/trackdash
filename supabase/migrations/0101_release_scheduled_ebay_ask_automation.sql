-- Release scheduled eBay active-ASK automation.
--
-- Only Releases whose Item Number identifies exactly one Release are enabled for
-- unattended eBay Browse persistence. Shared Item Numbers remain parked fail-closed
-- because the active-listing adapter cannot safely choose an edition automatically.

with item_counts as (
  select item_number, count(*) as release_count
  from public.product_releases
  where item_number is not null
  group by item_number
),
ebay_jobs as (
  select q.id, coalesce(ic.release_count, 0) as release_count
  from public.market_scan_queue q
  join public.price_sources ps on ps.id = q.source_id
  join public.product_releases pr on pr.id = q.release_id
  left join item_counts ic on ic.item_number = pr.item_number
  where ps.slug = 'ebay_active_public'
    and q.scan_scope = 'active_marketplace'
)
update public.market_scan_queue q
set enabled = (j.release_count = 1),
    next_scan_at = case
      when j.release_count = 1 then least(q.next_scan_at, now())
      else '2099-01-01 00:00:00+00'::timestamptz
    end,
    locked_until = null,
    consecutive_failures = case when j.release_count = 1 then 0 else q.consecutive_failures end,
    updated_at = now()
from ebay_jobs j
where q.id = j.id;
