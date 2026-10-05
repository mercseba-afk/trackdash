-- Market Watch: automatic eBay enrollment for shared Item Numbers with a globally unique JAN.
--
-- Identity remains fail-closed:
--   * unique ITEM -> eligible;
--   * shared ITEM + globally unique non-empty JAN -> eligible;
--   * shared ITEM + missing/non-unique JAN -> parked.
--
-- The worker still requires eBay structured item details to confirm the target JAN
-- before a shared-ITEM listing can be accepted. This migration only controls whether
-- the Release is safe to enroll in the unattended discovery queue.

update public.market_source_policies p
set default_interval_hours = 1008
from public.price_sources ps
where p.source_id = ps.id
  and ps.slug = 'ebay_active_public'
  and p.default_interval_hours <> 1008;

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
  v_normal_interval_hours constant integer := 1008;
  v_release record;
begin
  if p_item_number is null or btrim(p_item_number) = '' then
    return;
  end if;

  select count(*)
    into v_release_count
  from public.product_releases
  where item_number = p_item_number;

  for v_release in
    select
      pr.id as release_id,
      (
        v_release_count = 1
        or (
          v_release_count > 1
          and pr.barcode_jan is not null
          and btrim(pr.barcode_jan) <> ''
          and (
            select count(*)
            from public.product_releases jan_pr
            where jan_pr.barcode_jan = pr.barcode_jan
          ) = 1
        )
      ) as identity_eligible
    from public.product_releases pr
    where pr.item_number = p_item_number
  loop
    update public.market_scan_queue q
    set
      enabled = case
        when not v_release.identity_eligible then false
        when q.next_scan_at >= '2098-01-01 00:00:00+00'::timestamptz then true
        else q.enabled
      end,
      activity_tier = case
        when v_release.identity_eligible
          and q.next_scan_at >= '2098-01-01 00:00:00+00'::timestamptz
          then 'normal'
        else q.activity_tier
      end,
      scan_interval_hours = case
        when v_release.identity_eligible
          and q.next_scan_at >= '2098-01-01 00:00:00+00'::timestamptz
          then v_normal_interval_hours
        else q.scan_interval_hours
      end,
      next_scan_at = case
        when not v_release.identity_eligible then v_parked_at
        when q.next_scan_at >= '2098-01-01 00:00:00+00'::timestamptz
          then v_now + make_interval(hours => v_normal_interval_hours)
        else q.next_scan_at
      end,
      locked_until = null,
      consecutive_failures = case
        when v_release.identity_eligible
          and q.next_scan_at >= '2098-01-01 00:00:00+00'::timestamptz
          then 0
        else q.consecutive_failures
      end,
      last_error = case
        when v_release.identity_eligible
          and q.next_scan_at >= '2098-01-01 00:00:00+00'::timestamptz
          then null
        else q.last_error
      end,
      updated_at = v_now
    from public.price_sources ps
    where q.source_id = ps.id
      and q.release_id = v_release.release_id
      and ps.slug = 'ebay_active_public'
      and q.scan_scope = 'active_marketplace';

    update public.market_scan_targets t
    set
      enabled = case
        when not v_release.identity_eligible then false
        when t.next_scan_at >= '2098-01-01 00:00:00+00'::timestamptz then true
        else t.enabled
      end,
      scan_interval_hours = case
        when v_release.identity_eligible
          and t.next_scan_at >= '2098-01-01 00:00:00+00'::timestamptz
          then v_normal_interval_hours
        else t.scan_interval_hours
      end,
      next_scan_at = case
        when not v_release.identity_eligible then v_parked_at
        when t.next_scan_at >= '2098-01-01 00:00:00+00'::timestamptz
          then v_now + make_interval(hours => v_normal_interval_hours)
        else t.next_scan_at
      end,
      locked_until = null,
      consecutive_failures = case
        when v_release.identity_eligible
          and t.next_scan_at >= '2098-01-01 00:00:00+00'::timestamptz
          then 0
        else t.consecutive_failures
      end,
      last_error = case
        when v_release.identity_eligible
          and t.next_scan_at >= '2098-01-01 00:00:00+00'::timestamptz
          then null
        else t.last_error
      end,
      updated_at = v_now
    from public.price_sources ps
    where t.source_id = ps.id
      and t.release_id = v_release.release_id
      and ps.slug = 'ebay_active_public';
  end loop;
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
  v_barcode_jan text;
  v_item_release_count integer := 0;
  v_jan_release_count integer := 0;
  v_ebay_identity_eligible boolean := false;
  v_ebay_source_id uuid;
  v_now timestamptz := now();
  v_parked_at constant timestamptz := '2099-01-01 00:00:00+00'::timestamptz;
  v_normal_interval_hours constant integer := 1008;
begin
  select item_number, barcode_jan
    into v_item_number, v_barcode_jan
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

  if v_barcode_jan is not null and btrim(v_barcode_jan) <> '' then
    select count(*)
      into v_jan_release_count
    from public.product_releases
    where barcode_jan = v_barcode_jan;
  end if;

  v_ebay_identity_eligible :=
    v_item_release_count = 1
    or (
      v_item_release_count > 1
      and v_jan_release_count = 1
    );

  insert into public.market_scan_targets (
    release_id, source_id, enabled, scan_interval_hours, priority,
    next_scan_at, consecutive_failures, updated_at
  )
  select
    p_release_id,
    p.source_id,
    case
      when ps.slug = 'ebay_active_public' then v_ebay_identity_eligible
      else true
    end,
    case
      when ps.slug = 'ebay_active_public' then v_normal_interval_hours
      else p.default_interval_hours
    end,
    p.priority,
    case
      when ps.slug = 'ebay_active_public' and not v_ebay_identity_eligible
        then v_parked_at
      when ps.slug = 'ebay_active_public'
        then v_now + make_interval(hours => v_normal_interval_hours)
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
    scan_interval_hours = case
      when excluded.source_id = v_ebay_source_id
        and public.market_scan_targets.next_scan_at >= '2098-01-01 00:00:00+00'::timestamptz
        and v_ebay_identity_eligible
        then v_normal_interval_hours
      when excluded.source_id <> v_ebay_source_id
        then excluded.scan_interval_hours
      else public.market_scan_targets.scan_interval_hours
    end,
    priority = excluded.priority,
    enabled = case
      when excluded.source_id = v_ebay_source_id
        and not v_ebay_identity_eligible
        then false
      when excluded.source_id = v_ebay_source_id
        and public.market_scan_targets.next_scan_at >= '2098-01-01 00:00:00+00'::timestamptz
        then true
      else public.market_scan_targets.enabled
    end,
    next_scan_at = case
      when excluded.source_id = v_ebay_source_id
        and not v_ebay_identity_eligible
        then v_parked_at
      when excluded.source_id = v_ebay_source_id
        and public.market_scan_targets.next_scan_at >= '2098-01-01 00:00:00+00'::timestamptz
        then v_now + make_interval(hours => v_normal_interval_hours)
      else public.market_scan_targets.next_scan_at
    end,
    consecutive_failures = case
      when excluded.source_id = v_ebay_source_id
        and v_ebay_identity_eligible
        and public.market_scan_targets.next_scan_at >= '2098-01-01 00:00:00+00'::timestamptz
        then 0
      else public.market_scan_targets.consecutive_failures
    end,
    last_error = case
      when excluded.source_id = v_ebay_source_id
        and v_ebay_identity_eligible
        and public.market_scan_targets.next_scan_at >= '2098-01-01 00:00:00+00'::timestamptz
        then null
      else public.market_scan_targets.last_error
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
      when ps.slug = 'ebay_active_public' then v_ebay_identity_eligible
      else true
    end,
    'normal',
    case
      when ps.slug = 'ebay_active_public' then v_normal_interval_hours
      else p.default_interval_hours
    end,
    p.priority,
    case
      when ps.slug = 'ebay_active_public' and not v_ebay_identity_eligible
        then v_parked_at
      when ps.slug = 'ebay_active_public'
        then v_now + make_interval(hours => v_normal_interval_hours)
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
    activity_tier = case
      when excluded.source_id = v_ebay_source_id
        and public.market_scan_queue.next_scan_at >= '2098-01-01 00:00:00+00'::timestamptz
        and v_ebay_identity_eligible
        then 'normal'
      else public.market_scan_queue.activity_tier
    end,
    scan_interval_hours = case
      when excluded.source_id = v_ebay_source_id
        and public.market_scan_queue.next_scan_at >= '2098-01-01 00:00:00+00'::timestamptz
        and v_ebay_identity_eligible
        then v_normal_interval_hours
      when excluded.source_id <> v_ebay_source_id
        then excluded.scan_interval_hours
      else public.market_scan_queue.scan_interval_hours
    end,
    priority = excluded.priority,
    enabled = case
      when excluded.source_id = v_ebay_source_id
        and not v_ebay_identity_eligible
        then false
      when excluded.source_id = v_ebay_source_id
        and public.market_scan_queue.next_scan_at >= '2098-01-01 00:00:00+00'::timestamptz
        then true
      else public.market_scan_queue.enabled
    end,
    next_scan_at = case
      when excluded.source_id = v_ebay_source_id
        and not v_ebay_identity_eligible
        then v_parked_at
      when excluded.source_id = v_ebay_source_id
        and public.market_scan_queue.next_scan_at >= '2098-01-01 00:00:00+00'::timestamptz
        then v_now + make_interval(hours => v_normal_interval_hours)
      else public.market_scan_queue.next_scan_at
    end,
    consecutive_failures = case
      when excluded.source_id = v_ebay_source_id
        and v_ebay_identity_eligible
        and public.market_scan_queue.next_scan_at >= '2098-01-01 00:00:00+00'::timestamptz
        then 0
      else public.market_scan_queue.consecutive_failures
    end,
    last_error = case
      when excluded.source_id = v_ebay_source_id
        and v_ebay_identity_eligible
        and public.market_scan_queue.next_scan_at >= '2098-01-01 00:00:00+00'::timestamptz
        then null
      else public.market_scan_queue.last_error
    end,
    updated_at = v_now;

  perform public.trackdash_refresh_ebay_item_uniqueness(v_item_number);
end;
$$;

create or replace function public.trackdash_refresh_item_identity_after_release_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item_number text;
begin
  if tg_op = 'INSERT' then
    perform public.trackdash_refresh_ebay_item_uniqueness(new.item_number);

    if new.barcode_jan is not null and btrim(new.barcode_jan) <> '' then
      for v_item_number in
        select distinct pr.item_number
        from public.product_releases pr
        where pr.barcode_jan = new.barcode_jan
          and pr.item_number is not null
          and btrim(pr.item_number) <> ''
      loop
        perform public.trackdash_refresh_ebay_item_uniqueness(v_item_number);
      end loop;
    end if;

  elsif tg_op = 'DELETE' then
    perform public.trackdash_refresh_ebay_item_uniqueness(old.item_number);

    if old.barcode_jan is not null and btrim(old.barcode_jan) <> '' then
      for v_item_number in
        select distinct pr.item_number
        from public.product_releases pr
        where pr.barcode_jan = old.barcode_jan
          and pr.item_number is not null
          and btrim(pr.item_number) <> ''
      loop
        perform public.trackdash_refresh_ebay_item_uniqueness(v_item_number);
      end loop;
    end if;

  elsif old.item_number is distinct from new.item_number
     or old.barcode_jan is distinct from new.barcode_jan then
    perform public.trackdash_refresh_ebay_item_uniqueness(old.item_number);
    perform public.trackdash_refresh_ebay_item_uniqueness(new.item_number);

    if old.barcode_jan is not null and btrim(old.barcode_jan) <> '' then
      for v_item_number in
        select distinct pr.item_number
        from public.product_releases pr
        where pr.barcode_jan = old.barcode_jan
          and pr.item_number is not null
          and btrim(pr.item_number) <> ''
      loop
        perform public.trackdash_refresh_ebay_item_uniqueness(v_item_number);
      end loop;
    end if;

    if new.barcode_jan is not null and btrim(new.barcode_jan) <> '' then
      for v_item_number in
        select distinct pr.item_number
        from public.product_releases pr
        where pr.barcode_jan = new.barcode_jan
          and pr.item_number is not null
          and btrim(pr.item_number) <> ''
      loop
        perform public.trackdash_refresh_ebay_item_uniqueness(v_item_number);
      end loop;
    end if;
  end if;

  return null;
end;
$$;

drop trigger if exists product_releases_refresh_market_scan_identity
  on public.product_releases;

create trigger product_releases_refresh_market_scan_identity
after insert or delete or update of item_number, barcode_jan on public.product_releases
for each row
execute function public.trackdash_refresh_item_identity_after_release_change();

revoke all on function public.trackdash_refresh_ebay_item_uniqueness(text) from public;
revoke all on function public.trackdash_enroll_release_market_scans(uuid) from public;
revoke all on function public.trackdash_refresh_item_identity_after_release_change() from public;

grant execute on function public.trackdash_enroll_release_market_scans(uuid) to trackdash_app;

-- Backfill only identity state. Existing active jobs keep their distributed next_scan_at
-- and adaptive tier; only identity-parked jobs that are newly safe are reactivated.
select public.trackdash_refresh_ebay_item_uniqueness(item_number)
from (
  select distinct item_number
  from public.product_releases
  where item_number is not null and btrim(item_number) <> ''
) items;
