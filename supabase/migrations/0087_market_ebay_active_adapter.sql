-- Market Automation v1.2: eBay Browse active-listing adapter.
--
-- The code adapter is implemented and fail-closed. Runtime execution still
-- requires EBAY_CLIENT_ID + EBAY_CLIENT_SECRET; without them the worker skips
-- eBay entirely. Active asks remain asks and never become completed-sale proof.

update public.price_sources
set ingestion_mode = 'api', is_active = true
where slug = 'ebay_active_public';

update public.market_source_policies p
set adapter_status = 'ready',
    source_family = 'ebay',
    independent_key = 'marketplace:ebay',
    scan_scope = 'active_marketplace',
    role = 'primary_marketplace',
    current_offer_capable = true,
    completed_sale_capable = false,
    updated_at = now()
from public.price_sources ps
where p.source_id = ps.id
  and ps.slug = 'ebay_active_public';

-- Keep all existing pilot eBay active jobs enabled/due. They cannot run until
-- the runtime credential gate in the worker is satisfied.
update public.market_scan_queue q
set enabled = true,
    next_scan_at = least(q.next_scan_at, now()),
    updated_at = now()
from public.price_sources ps
where q.source_id = ps.id
  and ps.slug = 'ebay_active_public'
  and q.scan_scope = 'active_marketplace';

create or replace function public.trackdash_claim_ebay_active_jobs(
  p_limit integer default 2,
  p_lock_minutes integer default 10
)
returns table (
  job_id uuid,
  release_id uuid,
  source_id uuid,
  source_slug text,
  scan_scope text,
  activity_tier text,
  priority integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
begin
  return query
  with picked as (
    select q.id
    from public.market_scan_queue q
    join public.price_sources ps on ps.id = q.source_id
    join public.market_source_policies p on p.source_id = q.source_id
    where q.enabled
      and ps.slug = 'ebay_active_public'
      and p.adapter_status = 'ready'
      and q.scan_scope = 'active_marketplace'
      and q.next_scan_at <= v_now
      and (q.locked_until is null or q.locked_until <= v_now)
    order by q.next_scan_at asc, q.priority desc, q.id
    limit greatest(1, least(coalesce(p_limit, 2), 4))
    for update of q skip locked
  ), locked as (
    update public.market_scan_queue q
    set locked_until = v_now + make_interval(mins => greatest(1, least(coalesce(p_lock_minutes, 10), 60))),
        last_attempt_at = v_now,
        updated_at = v_now
    from picked
    where q.id = picked.id
    returning q.*
  )
  select
    l.id,
    l.release_id,
    l.source_id,
    ps.slug,
    l.scan_scope,
    l.activity_tier,
    l.priority
  from locked l
  join public.price_sources ps on ps.id = l.source_id
  order by l.priority desc, l.next_scan_at asc;
end;
$$;

revoke all on function public.trackdash_claim_ebay_active_jobs(integer, integer) from public;
grant execute on function public.trackdash_claim_ebay_active_jobs(integer, integer) to trackdash_app;
