-- Dynamic first canonical signal enrollment for every published Mini 4WD Release.
-- Covers existing published Releases that never received an initial recompute,
-- plus future publication transitions. No SOLD, ASK, MV or Release IDs change.
-- A recompute is NOT a marketplace scan: the exact-identity source policy remains intact.
--
-- The canonical RPC resets existing queue jobs on conflict; therefore this helper
-- checks BOTH an existing signal and an existing queue row before calling it.
-- A missing/ambiguous JAN does not block a safe initial market projection.

begin;

create or replace function private.trackdash_ensure_initial_public_release_market(
  p_release_id uuid
) returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
begin
  if p_release_id is null then return false; end if;

  -- The public catalog gate, without per-family/item allowlists.
  if not exists (
    select 1
    from public.product_releases r
    join public.products p on p.id = r.product_id
    join public.categories c on c.id = p.category_id
    where r.id = p_release_id
      and c.slug = 'mini4wd'
      and p.metadata->>'launch_status' = 'available'
      and r.catalog_visibility = 'public'
      and r.verification_status = 'verified'
  ) then return false; end if;

  -- First initialization only. Never reset an in-flight job, and never
  -- replace a real existing canonical signal with an empty initialization.
  if exists (
    select 1 from public.market_release_signals s
    where s.release_id = p_release_id
      and s.condition = 'new_complete_unbuilt'
  ) or exists (
    select 1 from public.market_recompute_queue q
    where q.release_id = p_release_id
      and q.condition = 'new_complete_unbuilt'
  ) then return false; end if;

  perform public.trackdash_enqueue_market_recompute(
    p_release_id, 'new_complete_unbuilt'
  );
  return true;
end;
$fn$;

-- Never expose the SECURITY DEFINER helper for direct client execution.
revoke all on function private.trackdash_ensure_initial_public_release_market(uuid)
  from public, anon, authenticated;

create or replace function private.trackdash_first_market_on_release()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
begin
  perform private.trackdash_ensure_initial_public_release_market(new.id);
  return new;
end;
$fn$;

create or replace function private.trackdash_first_market_on_family_launch()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_release record;
begin
  -- Family launches often contain many already-inserted Releases.
  -- Do not enqueue research_only entries and never send notifications here.
  if new.metadata->>'launch_status' = 'available'
     and old.metadata->>'launch_status' is distinct from 'available' then
    for v_release in
      select r.id
      from public.product_releases r
      where r.product_id = new.id
        and r.catalog_visibility = 'public'
        and r.verification_status = 'verified'
    loop
      perform private.trackdash_ensure_initial_public_release_market(v_release.id);
    end loop;
  end if;
  return new;
end;
$fn$;

drop trigger if exists trg_trackdash_first_market_on_release on public.product_releases;
create trigger trg_trackdash_first_market_on_release
after insert or update of catalog_visibility, verification_status, product_id
on public.product_releases
for each row execute function private.trackdash_first_market_on_release();

drop trigger if exists trg_trackdash_first_market_on_family_launch on public.products;
create trigger trg_trackdash_first_market_on_family_launch
after update of metadata on public.products
for each row execute function private.trackdash_first_market_on_family_launch();

-- Idempotent historical recovery. Do NOT scan ambiguous items or invent prices.
-- The canonical recompute worker will materialize empty/null values when it
-- finds no qualifying evidence; that is a valid, complete first signal.
do $backfill$
declare
  v_row record;
  v_enqueued integer := 0;
begin
  for v_row in
    select r.id
    from public.product_releases r
    join public.products p on p.id = r.product_id
    join public.categories c on c.id = p.category_id
    where c.slug = 'mini4wd'
      and p.metadata->>'launch_status' = 'available'
      and r.catalog_visibility = 'public'
      and r.verification_status = 'verified'
      and not exists (
        select 1 from public.market_release_signals s
        where s.release_id = r.id and s.condition = 'new_complete_unbuilt'
      )
      and not exists (
        select 1 from public.market_recompute_queue q
        where q.release_id = r.id and q.condition = 'new_complete_unbuilt'
      )
    order by r.created_at, r.id
  loop
    if private.trackdash_ensure_initial_public_release_market(v_row.id) then
      v_enqueued := v_enqueued + 1;
    end if;
  end loop;
  raise notice 'TrackDash first market: % existing published Mini 4WD Releases safely queued', v_enqueued;
end;
$backfill$;

commit;
