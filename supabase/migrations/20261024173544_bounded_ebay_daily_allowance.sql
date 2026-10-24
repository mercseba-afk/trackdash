begin;
set local lock_timeout = '5s';
-- Briefly block new claims while seeding the cutover allowance. Refuse cutover
-- if a claimed eBay job is still running; do not guess its consumed allowance.
lock table public.market_scan_queue in access exclusive mode;
do $$ begin
  if exists (select 1 from public.market_scan_queue q join public.price_sources ps on ps.id=q.source_id
             where ps.slug='ebay_active_public' and q.locked_until > clock_timestamp()) then
    raise exception 'EBAY_SCAN_ACTIVE_RETRY_CUTOVER_LATER';
  end if;
end $$;

-- One reservation per claimed job, never refunded after a failure/timeout.
-- Rome calendar day: handles DST without assuming every day lasts 24 hours.
create table if not exists public.market_ebay_scan_daily_budget (
  budget_day date primary key,
  attempts_reserved integer not null default 0 check (attempts_reserved between 0 and 24),
  updated_at timestamptz not null default now()
);
alter table public.market_ebay_scan_daily_budget enable row level security;
revoke all on public.market_ebay_scan_daily_budget from public, anon, authenticated, trackdash_app;
grant select on public.market_ebay_scan_daily_budget to service_role;
-- Conservative cutover seed: count ALL lanes, including failed/running jobs.
-- This can temporarily overcount eBay work; it cannot grant excess allowance.
insert into public.market_ebay_scan_daily_budget (budget_day, attempts_reserved)
select (now() at time zone 'Europe/Rome')::date,
       least(24, coalesce(sum(targets_attempted), 0))::integer
from public.market_scan_runs
where started_at >= (date_trunc('day', now() at time zone 'Europe/Rome') at time zone 'Europe/Rome')
on conflict (budget_day) do nothing;

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
set search_path = pg_catalog, public
as $$
declare
  v_now timestamptz;
  v_day date;
  v_used integer;
  v_limit integer;
begin
  -- Serialize budget reservations before choosing work, including midnight.
  perform pg_catalog.pg_advisory_xact_lock(734932, 24);
  v_now := clock_timestamp();
  v_day := (v_now at time zone 'Europe/Rome')::date;
  insert into public.market_ebay_scan_daily_budget (budget_day, attempts_reserved)
  values (v_day, 0) on conflict (budget_day) do nothing;
  select b.attempts_reserved into v_used
  from public.market_ebay_scan_daily_budget b where b.budget_day = v_day;
  v_limit := least(greatest(1, least(coalesce(p_limit, 2), 4)), 24 - v_used);
  if v_limit <= 0 then return; end if;
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
      -- An abandoned timed-out claim must not be picked again today.
      and (q.last_attempt_at is null or q.last_attempt_at < (v_day::timestamp at time zone 'Europe/Rome'))
      and (q.locked_until is null or q.locked_until <= v_now)
    order by q.next_scan_at asc, q.priority desc, q.id
    limit v_limit
    for update of q skip locked
  ), locked as (
    update public.market_scan_queue q
    set locked_until = v_now + make_interval(mins => greatest(1, least(coalesce(p_lock_minutes, 10), 60))),
        last_attempt_at = v_now,
        updated_at = v_now
    from picked
    where q.id = picked.id
    returning q.*
  ), charged as (
    update public.market_ebay_scan_daily_budget b
    set attempts_reserved = b.attempts_reserved + (select count(*)::integer from locked),
        updated_at = v_now
    where b.budget_day = v_day
    returning b.budget_day
  )
  select
    l.id,
    l.release_id,
    l.source_id,
    ps.slug,
    l.scan_scope,
    l.activity_tier,
    l.priority
  from locked l cross join charged
  join public.price_sources ps on ps.id = l.source_id
  order by l.next_scan_at asc, l.priority desc, l.id;
end;
$$;


-- Preserve the existing internal callers, never grant browser roles access.
revoke all on function public.trackdash_claim_ebay_active_jobs(integer, integer) from public, anon, authenticated;
grant execute on function public.trackdash_claim_ebay_active_jobs(integer, integer) to service_role, trackdash_app;

commit;
