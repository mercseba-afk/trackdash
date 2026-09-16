-- Exact, fail-closed claim path for a controlled eBay Active ASK scan.
-- The generic claim function remains unchanged and cannot be used to select a
-- specific Release. This function requires both queue and Release UUIDs.

create or replace function public.trackdash_claim_ebay_active_job(
  p_job_id uuid,
  p_release_id uuid,
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
  with locked as (
    update public.market_scan_queue q
    set locked_until = v_now + make_interval(mins => greatest(1, least(coalesce(p_lock_minutes, 10), 60))),
        last_attempt_at = v_now,
        updated_at = v_now
    from public.price_sources ps, public.market_source_policies p
    where q.id = p_job_id
      and q.release_id = p_release_id
      and q.enabled
      and (q.locked_until is null or q.locked_until <= v_now)
      and q.source_id = ps.id
      and ps.slug = 'ebay_active_public'
      and p.source_id = q.source_id
      and p.adapter_status = 'ready'
      and q.scan_scope = 'active_marketplace'
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
  join public.price_sources ps on ps.id = l.source_id;
end;
$$;

revoke all on function public.trackdash_claim_ebay_active_job(uuid, uuid, integer)
  from public, anon, authenticated, trackdash_app, service_role;
grant execute on function public.trackdash_claim_ebay_active_job(uuid, uuid, integer) to service_role;

-- Existing workers finish a claimed job through this constrained function.
revoke all on function public.trackdash_finish_market_scan_job(uuid, boolean, boolean, text)
  from public, anon, authenticated, service_role;
grant execute on function public.trackdash_finish_market_scan_job(uuid, boolean, boolean, text) to service_role;
