-- Market Method v4: automatically enroll every Release that enters Price Intelligence.
--
-- The first market_release_signal is the durable boundary for "this Release is now
-- monitored". From that point TrackDash creates the configured source targets and
-- queue jobs automatically. eBay Active stays fail-closed whenever an Item Number
-- identifies more than one Release.
--
-- A second safeguard watches product_releases identity changes. If a new Release
-- later reuses an Item Number that was previously unique, existing unattended eBay
-- jobs for that Item Number are parked immediately.

create or replace function public.trackdash_refresh_ebay_item_uniqueness(
  p_item_number text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_release_count integer;
  v_now timestamptz := now();
  v_parked_at constant timestamptz := '2099-01-01 00:00:00+00'::timestamptz;
begin
  if p_item_number is null or btrim(p_item_number) = '' then
    return;
  end if;

  select count(*)
    into v_release_count
  from public.product_releases
  where item_number = p_item_number;

  -- market_scan_queue drives the workers.
  update public.market_scan_queue q
  set
    enabled = case
      when v_release_count <> 1 then false
      when q.next_scan_at >= '2098-01-01 00:00:00+00'::timestamptz then true
      else q.enabled
    end,
    next_scan_at = case
      when v_release_count <> 1 then v_parked_at
      when q.next_scan_at >= '2098-01-01 00:00:00+00'::timestamptz then v_now
      else q.next_scan_at
    end,
    locked_until = null,
    consecutive_failures = case
      when v_release_count = 1
        and q.next_scan_at >= '2098-01-01 00:00:00+00'::timestamptz
        then 0
      else q.consecutive_failures
    end,
    last_error = case
      when v_release_count = 1
        and q.next_scan_at >= '2098-01-01 00:00:00+00'::timestamptz
        then null
      else q.last_error
    end,
    updated_at = v_now
  from public.price_sources ps
  join public.product_releases pr on pr.item_number = p_item_number
  where q.source_id = ps.id
    and q.release_id = pr.id
    and ps.slug = 'ebay_active_public'
    and q.scan_scope = 'active_marketplace';

  -- Keep the legacy target table consistent with the queue.
  update public.market_scan_targets t
  set
    enabled = case
      when v_release_count <> 1 then false
      when t.next_scan_at >= '2098-01-01 00:00:00+00'::timestamptz then true
      else t.enabled
    end,
    next_scan_at = case
      when v_release_count <> 1 then v_parked_at
      when t.next_scan_at >= '2098-01-01 00:00:00+00'::timestamptz then v_now
      else t.next_scan_at
    end,
    locked_until = null,
    consecutive_failures = case
      when v_release_count = 1
        and t.next_scan_at >= '2098-01-01 00:00:00+00'::timestamptz
        then 0
      else t.consecutive_failures
    end,
    last_error = case
      when v_release_count = 1
        and t.next_scan_at >= '2098-01-01 00:00:00+00'::timestamptz
        then null
      else t.last_error
    end,
    updated_at = v_now
  from public.price_sources ps
  join public.product_releases pr on pr.item_number = p_item_number
  where t.source_id = ps.id
    and t.release_id = pr.id
    and ps.slug = 'ebay_active_public';
end;
$$;

create or replace function public.trackdash_enroll_release_market_scans(
  p_release_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item_number text;
  v_item_release_count integer := 0;
  v_ebay_source_id uuid;
  v_now timestamptz := now();
  v_parked_at constant timestamptz := '2099-01-01 00:00:00+00'::timestamptz;
begin
  select item_number
    into v_item_number
  from public.product_releases
  where id = p_release_id;

  if not found then
    raise exception 'PRICE_INTELLIGENCE_RELEASE_NOT_FOUND';
  end if;

  select id
    into v_ebay_source_id
  from public.price_sources
  where slug = 'ebay_active_public';

  if v_item_number is not null and btrim(v_item_number) <> '' then
    select count(*)
      into v_item_release_count
    from public.product_releases
    where item_number = v_item_number;
  end if;

  -- Preserve the source plan used by the pilot, but apply it automatically to
  -- every Release that enters Price Intelligence. Manual/planned sources remain
  -- visible for semi-manual coverage; automatic workers still claim only READY
  -- adapters.
  insert into public.market_scan_targets (
    release_id, source_id, enabled, scan_interval_hours, priority,
    next_scan_at, consecutive_failures, updated_at
  )
  select
    p_release_id,
    p.source_id,
    case
      when ps.slug = 'ebay_active_public' then v_item_release_count = 1
      else true
    end,
    p.default_interval_hours,
    p.priority,
    case
      when ps.slug = 'ebay_active_public' and v_item_release_count <> 1
        then v_parked_at
      else v_now
    end,
    0,
    v_now
  from public.market_source_policies p
  join public.price_sources ps on ps.id = p.source_id
  where p.include_by_default
    and p.role <> 'internal_sales'
    and ps.is_active
  on conflict (release_id, source_id) do update set
    scan_interval_hours = excluded.scan_interval_hours,
    priority = excluded.priority,
    enabled = case
      when excluded.source_id = v_ebay_source_id
        and v_item_release_count <> 1
        then false
      else public.market_scan_targets.enabled
    end,
    next_scan_at = case
      when excluded.source_id = v_ebay_source_id
        and v_item_release_count <> 1
        then v_parked_at
      else public.market_scan_targets.next_scan_at
    end,
    updated_at = v_now;

  insert into public.market_scan_queue (
    release_id, source_id, scan_scope, enabled, activity_tier,
    scan_interval_hours, priority, next_scan_at, consecutive_failures, updated_at
  )
  select
    p_release_id,
    p.source_id,
    p.scan_scope,
    case
      when ps.slug = 'ebay_active_public' then v_item_release_count = 1
      else true
    end,
    'normal',
    p.default_interval_hours,
    p.priority,
    case
      when ps.slug = 'ebay_active_public' and v_item_release_count <> 1
        then v_parked_at
      else v_now
    end,
    0,
    v_now
  from public.market_source_policies p
  join public.price_sources ps on ps.id = p.source_id
  where p.include_by_default
    and p.role <> 'internal_sales'
    and ps.is_active
  on conflict (release_id, source_id, scan_scope) do update set
    scan_interval_hours = excluded.scan_interval_hours,
    priority = excluded.priority,
    enabled = case
      when excluded.source_id = v_ebay_source_id
        and v_item_release_count <> 1
        then false
      else public.market_scan_queue.enabled
    end,
    next_scan_at = case
      when excluded.source_id = v_ebay_source_id
        and v_item_release_count <> 1
        then v_parked_at
      else public.market_scan_queue.next_scan_at
    end,
    updated_at = v_now;

  perform public.trackdash_refresh_ebay_item_uniqueness(v_item_number);
end;
$$;

create or replace function public.trackdash_auto_enroll_market_signal()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.trackdash_enroll_release_market_scans(new.release_id);
  return new;
end;
$$;

drop trigger if exists market_release_signals_auto_enroll_scans
  on public.market_release_signals;

create trigger market_release_signals_auto_enroll_scans
after insert on public.market_release_signals
for each row
execute function public.trackdash_auto_enroll_market_signal();

create or replace function public.trackdash_refresh_item_identity_after_release_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.trackdash_refresh_ebay_item_uniqueness(new.item_number);
  elsif tg_op = 'DELETE' then
    perform public.trackdash_refresh_ebay_item_uniqueness(old.item_number);
  elsif old.item_number is distinct from new.item_number then
    perform public.trackdash_refresh_ebay_item_uniqueness(old.item_number);
    perform public.trackdash_refresh_ebay_item_uniqueness(new.item_number);
  end if;

  return null;
end;
$$;

drop trigger if exists product_releases_refresh_market_scan_identity
  on public.product_releases;

create trigger product_releases_refresh_market_scan_identity
after insert or delete or update of item_number on public.product_releases
for each row
execute function public.trackdash_refresh_item_identity_after_release_change();

revoke all on function public.trackdash_refresh_ebay_item_uniqueness(text) from public;
revoke all on function public.trackdash_enroll_release_market_scans(uuid) from public;
revoke all on function public.trackdash_auto_enroll_market_signal() from public;
revoke all on function public.trackdash_refresh_item_identity_after_release_change() from public;

grant execute on function public.trackdash_enroll_release_market_scans(uuid) to trackdash_app;

-- Idempotent bootstrap: ensure every Release that already has a market signal is
-- enrolled under the same rule. This does not re-enable a deliberately disabled
-- non-eBay job, and ambiguous eBay jobs remain parked.
select public.trackdash_enroll_release_market_scans(release_id)
from (
  select distinct release_id
  from public.market_release_signals
) existing;

-- Re-evaluate every currently reused Item Number after the bootstrap so old jobs
-- cannot remain armed if a later catalog Release made that Item Number ambiguous.
select public.trackdash_refresh_ebay_item_uniqueness(item_number)
from (
  select distinct item_number
  from public.product_releases
  where item_number is not null and btrim(item_number) <> ''
) items;
