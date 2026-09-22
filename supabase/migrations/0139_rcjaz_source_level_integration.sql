-- RCJAZ source-level exact-page integration.
--
-- Goals:
-- 1. RCJAZ is treated as a reusable retail source across the catalog, not a
--    one-off endpoint for ITEM 95467.
-- 2. Exact RCJAZ product pages already verified in release_sources or accepted
--    exact market candidates are enrolled automatically.
-- 3. Future exact RCJAZ release_sources/candidates auto-enroll endpoint + queue.
-- 4. Reused Item Numbers fail closed: automatic enrollment requires the Item
--    Number to be unique in the current catalog. Shared-item cases stay manual.
-- 5. RCJAZ remains PLANNED until a live Vercel transport canary proves the
--    Cloudflare 403 guard is no longer required.

begin;

alter table public.market_scan_endpoints
  drop constraint if exists market_scan_endpoints_parser_check;

alter table public.market_scan_endpoints
  add constraint market_scan_endpoints_parser_check
  check (parser_kind in ('generic_product_page', 'rcjaz_product_page'));

-- Existing manually verified RCJAZ endpoints now use the source-specific parser.
update public.market_scan_endpoints e
set parser_kind = 'rcjaz_product_page',
    updated_at = now()
from public.price_sources ps
where e.source_id = ps.id
  and ps.slug = 'rcjaz_public';

create or replace function public.trackdash_enroll_rcjaz_endpoint(
  p_release_id uuid,
  p_url text
)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_item_number text;
  v_same_item_count integer;
  v_source_id uuid;
  v_scan_scope text;
  v_interval integer;
  v_priority integer;
begin
  if p_release_id is null or p_url is null or btrim(p_url) = '' then
    return false;
  end if;

  select r.item_number
  into v_item_number
  from public.product_releases r
  where r.id = p_release_id;

  if v_item_number is null or btrim(v_item_number) = '' then
    return false;
  end if;

  -- Only real RCJAZ product pages. Category/search/bundle pages are not exact
  -- Release endpoints just because an Item Number appears somewhere on-page.
  if lower(p_url) !~ '^https?://(www\.)?rcjaz\.(com|co\.uk|com\.au)/' then
    return false;
  end if;

  if lower(p_url) !~ '-p-[0-9]+\.html([?].*)?$' then
    return false;
  end if;

  if position(lower(v_item_number) in lower(p_url)) = 0 then
    return false;
  end if;

  -- Shared/reused Item Numbers must remain fail-closed. They can still receive
  -- explicit manually verified endpoints, but are never inferred automatically.
  select count(*)
  into v_same_item_count
  from public.product_releases r
  where r.item_number = v_item_number;

  if v_same_item_count <> 1 then
    return false;
  end if;

  select
    ps.id,
    p.scan_scope,
    p.default_interval_hours,
    p.priority
  into
    v_source_id,
    v_scan_scope,
    v_interval,
    v_priority
  from public.price_sources ps
  join public.market_source_policies p on p.source_id = ps.id
  where ps.slug = 'rcjaz_public'
  limit 1;

  if v_source_id is null then
    return false;
  end if;

  insert into public.market_scan_endpoints (
    release_id,
    source_id,
    endpoint_url,
    parser_kind,
    exact_release_verified,
    enabled,
    updated_at
  )
  values (
    p_release_id,
    v_source_id,
    p_url,
    'rcjaz_product_page',
    true,
    true,
    now()
  )
  on conflict (release_id, source_id, endpoint_url)
  do update set
    parser_kind = 'rcjaz_product_page',
    exact_release_verified = true,
    enabled = true,
    updated_at = now();

  insert into public.market_scan_targets (
    release_id,
    source_id,
    enabled,
    scan_interval_hours,
    priority,
    next_scan_at,
    consecutive_failures,
    updated_at
  )
  values (
    p_release_id,
    v_source_id,
    true,
    v_interval,
    v_priority,
    now(),
    0,
    now()
  )
  on conflict (release_id, source_id)
  do update set
    enabled = true,
    scan_interval_hours = excluded.scan_interval_hours,
    priority = excluded.priority,
    updated_at = now();

  insert into public.market_scan_queue (
    release_id,
    source_id,
    scan_scope,
    enabled,
    activity_tier,
    scan_interval_hours,
    priority,
    next_scan_at,
    consecutive_failures,
    updated_at
  )
  values (
    p_release_id,
    v_source_id,
    v_scan_scope,
    true,
    'normal',
    v_interval,
    v_priority,
    now(),
    0,
    now()
  )
  on conflict (release_id, source_id, scan_scope)
  do update set
    enabled = true,
    scan_interval_hours = excluded.scan_interval_hours,
    priority = excluded.priority,
    updated_at = now();

  return true;
end;
$$;

revoke all on function public.trackdash_enroll_rcjaz_endpoint(uuid, text) from public;
revoke all on function public.trackdash_enroll_rcjaz_endpoint(uuid, text) from anon;
revoke all on function public.trackdash_enroll_rcjaz_endpoint(uuid, text) from authenticated;
grant execute on function public.trackdash_enroll_rcjaz_endpoint(uuid, text) to service_role;
grant execute on function public.trackdash_enroll_rcjaz_endpoint(uuid, text) to trackdash_app;

create or replace function public.trackdash_auto_enroll_rcjaz_release_source()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  perform public.trackdash_enroll_rcjaz_endpoint(new.release_id, new.source_url);
  return new;
end;
$$;

revoke all on function public.trackdash_auto_enroll_rcjaz_release_source() from public;
revoke all on function public.trackdash_auto_enroll_rcjaz_release_source() from anon;
revoke all on function public.trackdash_auto_enroll_rcjaz_release_source() from authenticated;
grant execute on function public.trackdash_auto_enroll_rcjaz_release_source() to service_role;
grant execute on function public.trackdash_auto_enroll_rcjaz_release_source() to trackdash_app;

drop trigger if exists trg_release_sources_auto_enroll_rcjaz on public.release_sources;
create trigger trg_release_sources_auto_enroll_rcjaz
after insert or update of release_id, source_url
on public.release_sources
for each row
execute function public.trackdash_auto_enroll_rcjaz_release_source();

create or replace function public.trackdash_auto_enroll_rcjaz_candidate()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.decision = 'accepted'
     and new.match_confidence in ('exact', 'strong')
     and new.resolved_release_id is not null
     and new.listing_url is not null
  then
    perform public.trackdash_enroll_rcjaz_endpoint(new.resolved_release_id, new.listing_url);
  end if;
  return new;
end;
$$;

revoke all on function public.trackdash_auto_enroll_rcjaz_candidate() from public;
revoke all on function public.trackdash_auto_enroll_rcjaz_candidate() from anon;
revoke all on function public.trackdash_auto_enroll_rcjaz_candidate() from authenticated;
grant execute on function public.trackdash_auto_enroll_rcjaz_candidate() to service_role;
grant execute on function public.trackdash_auto_enroll_rcjaz_candidate() to trackdash_app;

drop trigger if exists trg_market_candidates_auto_enroll_rcjaz on public.market_candidates;
create trigger trg_market_candidates_auto_enroll_rcjaz
after insert or update of decision, match_confidence, resolved_release_id, listing_url
on public.market_candidates
for each row
execute function public.trackdash_auto_enroll_rcjaz_candidate();

-- Backfill all currently known, safe, exact RCJAZ product pages.
do $$
declare
  v_row record;
begin
  for v_row in
    with candidate_urls as (
      select
        rs.release_id,
        rs.source_url as endpoint_url
      from public.release_sources rs
      where rs.source_url is not null

      union

      select
        c.resolved_release_id as release_id,
        c.listing_url as endpoint_url
      from public.market_candidates c
      join public.price_sources ps on ps.id = c.source_id
      where ps.slug = 'rcjaz_public'
        and c.decision = 'accepted'
        and c.match_confidence in ('exact', 'strong')
        and c.resolved_release_id is not null
        and c.listing_url is not null
    )
    select distinct release_id, endpoint_url
    from candidate_urls
  loop
    perform public.trackdash_enroll_rcjaz_endpoint(v_row.release_id, v_row.endpoint_url);
  end loop;
end;
$$;

-- Existing explicit RCJAZ endpoints for shared Item Numbers were already
-- verified manually. Preserve them and only switch them to the dedicated parser.
update public.market_scan_endpoints e
set parser_kind = 'rcjaz_product_page',
    updated_at = now()
from public.price_sources ps
where e.source_id = ps.id
  and ps.slug = 'rcjaz_public'
  and e.exact_release_verified;

-- Safety invariant: transport is still guarded by the 2026-09-14 Cloudflare
-- observation. Enrollment is complete, execution is not enabled until a live
-- Vercel canary succeeds with the new parser/transport behavior.
update public.market_source_policies p
set adapter_status = 'planned',
    updated_at = now()
from public.price_sources ps
where p.source_id = ps.id
  and ps.slug = 'rcjaz_public';

commit;
