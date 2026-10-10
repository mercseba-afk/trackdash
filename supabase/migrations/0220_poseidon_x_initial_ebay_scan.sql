-- One-time Poseidon-X 2006 initial eBay Active canary — 2026-10-10
-- Does NOT change scheduling architecture, Price Engine or future family eligibility.
-- The generic enrolled job initially defaults to NORMAL/42d, but our release
-- publication method demands an initial automated verification rather than waiting.
-- 1993 shared-ITEM/no-JAN remains parked; the worker must match structured JAN.
update public.market_scan_queue q
set next_scan_at=now(), updated_at=now()
from public.price_sources ps, public.market_source_policies pol
where q.source_id=ps.id and pol.source_id=ps.id
  and q.release_id='c37d4161-aa31-535b-b1de-9040730a4cdd'
  and q.enabled
  and q.scan_scope='active_marketplace'
  and ps.slug='ebay_active_public'
  and pol.adapter_status='ready'
  and exists (
    select 1 from public.product_releases r
    where r.id=q.release_id and r.barcode_jan='4950344945849'
  );
