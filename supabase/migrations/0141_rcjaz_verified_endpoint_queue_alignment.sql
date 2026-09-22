-- Ensure every manually verified RCJAZ exact endpoint has an active target/queue.
-- Shared Item Numbers are not auto-inferred, but explicit exact_release_verified
-- endpoints are authoritative enough to be scheduled.

begin;

with endpoint_jobs as (
  select distinct
    e.release_id,
    e.source_id,
    p.scan_scope,
    p.default_interval_hours,
    p.priority
  from public.market_scan_endpoints e
  join public.price_sources ps on ps.id=e.source_id
  join public.market_source_policies p on p.source_id=e.source_id
  where ps.slug='rcjaz_public'
    and e.enabled
    and e.exact_release_verified
)
insert into public.market_scan_targets (
  release_id,source_id,enabled,scan_interval_hours,priority,
  next_scan_at,consecutive_failures,updated_at
)
select
  release_id,source_id,true,default_interval_hours,priority,
  now(),0,now()
from endpoint_jobs
on conflict (release_id,source_id)
do update set
  enabled=true,
  scan_interval_hours=excluded.scan_interval_hours,
  priority=excluded.priority,
  updated_at=now();

with endpoint_jobs as (
  select distinct
    e.release_id,
    e.source_id,
    p.scan_scope,
    p.default_interval_hours,
    p.priority
  from public.market_scan_endpoints e
  join public.price_sources ps on ps.id=e.source_id
  join public.market_source_policies p on p.source_id=e.source_id
  where ps.slug='rcjaz_public'
    and e.enabled
    and e.exact_release_verified
)
insert into public.market_scan_queue (
  release_id,source_id,scan_scope,enabled,activity_tier,
  scan_interval_hours,priority,next_scan_at,consecutive_failures,updated_at
)
select
  release_id,source_id,scan_scope,true,'normal',
  default_interval_hours,priority,now(),0,now()
from endpoint_jobs
on conflict (release_id,source_id,scan_scope)
do update set
  enabled=true,
  scan_interval_hours=excluded.scan_interval_hours,
  priority=excluded.priority,
  updated_at=now();

commit;
