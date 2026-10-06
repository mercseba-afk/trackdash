-- Price Guard: time-driven offer expiry + non-runnable queue hygiene.
--
-- Source policies with no runnable adapter must not auto-enroll scan jobs. Their
-- persisted evidence may remain valid historical/context data, but the automatic
-- worker cannot refresh those sources until adapter_status becomes 'ready'.

begin;

update public.market_source_policies
set include_by_default=false,
    updated_at=now()
where adapter_status <> 'ready'
  and include_by_default=true;

update public.market_scan_queue q
set enabled=false,
    next_scan_at='2099-01-01 00:00:00+00'::timestamptz,
    locked_until=null,
    updated_at=now()
from public.market_source_policies p
where q.source_id=p.source_id
  and p.adapter_status <> 'ready'
  and q.enabled=true;

update public.market_scan_targets t
set enabled=false,
    next_scan_at='2099-01-01 00:00:00+00'::timestamptz,
    locked_until=null,
    updated_at=now()
from public.market_source_policies p
where t.source_id=p.source_id
  and p.adapter_status <> 'ready'
  and t.enabled=true;

commit;
