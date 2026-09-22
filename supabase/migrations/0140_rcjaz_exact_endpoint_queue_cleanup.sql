-- RCJAZ queue cleanup after source-level exact enrollment.
-- Old catalog-wide enrollment created RCJAZ queue/target rows even when no
-- exact product endpoint existed. The claim function already fails closed, but
-- these rows are operational noise. Keep only endpoint-backed RCJAZ jobs active.

begin;

update public.market_scan_queue q
set enabled = false,
    locked_until = null,
    updated_at = now()
from public.price_sources ps
where q.source_id = ps.id
  and ps.slug = 'rcjaz_public'
  and not exists (
    select 1
    from public.market_scan_endpoints e
    where e.release_id = q.release_id
      and e.source_id = q.source_id
      and e.enabled
      and e.exact_release_verified
  );

update public.market_scan_targets t
set enabled = false,
    locked_until = null,
    updated_at = now()
from public.price_sources ps
where t.source_id = ps.id
  and ps.slug = 'rcjaz_public'
  and not exists (
    select 1
    from public.market_scan_endpoints e
    where e.release_id = t.release_id
      and e.source_id = t.source_id
      and e.enabled
      and e.exact_release_verified
  );

commit;
