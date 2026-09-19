-- Queue canonical Market Method v4 recomputation whenever completed-sale
-- evidence changes. This closes the gap where manually imported SOLD rows could
-- remain invisible until an unrelated ASK/retail scan happened to touch the
-- Release.
--
-- The queue is intentionally condition-scoped and idempotent. Multiple evidence
-- writes collapse into one dirty row. A claim carries dirty_at; finishing a stale
-- claim cannot delete a newer enqueue that arrived while recomputation was
-- running.

create table if not exists public.market_recompute_queue (
  release_id uuid not null references public.product_releases(id) on delete cascade,
  condition text not null,
  dirty_at timestamptz not null default now(),
  available_at timestamptz not null default now(),
  locked_until timestamptz,
  attempts integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (release_id, condition),
  constraint market_recompute_queue_condition_check
    check (condition in ('new_complete_unbuilt','built_complete','incomplete_parts_custom','unknown')),
  constraint market_recompute_queue_attempts_check check (attempts >= 0)
);

create index if not exists idx_market_recompute_queue_due
  on public.market_recompute_queue(available_at, dirty_at);

alter table public.market_recompute_queue enable row level security;

create or replace function public.trackdash_enqueue_market_recompute(
  p_release_id uuid,
  p_condition text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_release_id is null then return; end if;
  if p_condition not in ('new_complete_unbuilt','built_complete','incomplete_parts_custom','unknown') then
    raise exception 'MARKET_RECOMPUTE_CONDITION_INVALID';
  end if;

  insert into public.market_recompute_queue (
    release_id, condition, dirty_at, available_at, locked_until,
    attempts, last_error, updated_at
  )
  values (
    p_release_id, p_condition, now(), now(), null,
    0, null, now()
  )
  on conflict (release_id, condition) do update set
    dirty_at = excluded.dirty_at,
    available_at = excluded.available_at,
    locked_until = null,
    attempts = 0,
    last_error = null,
    updated_at = now();
end;
$$;

create or replace function public.trackdash_queue_recompute_from_aggregate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op in ('UPDATE','DELETE')
     and old.release_id is not null
     and old.attribution_status in ('release_exact','release_matched')
     and old.market_average_eur is not null
  then
    perform public.trackdash_enqueue_market_recompute(old.release_id, old.condition);
  end if;

  if tg_op in ('INSERT','UPDATE')
     and new.release_id is not null
     and new.attribution_status in ('release_exact','release_matched')
     and new.market_average_eur is not null
  then
    perform public.trackdash_enqueue_market_recompute(new.release_id, new.condition);
  end if;

  return null;
end;
$$;

drop trigger if exists market_aggregate_observations_queue_recompute
  on public.market_aggregate_observations;

create trigger market_aggregate_observations_queue_recompute
after insert or update or delete on public.market_aggregate_observations
for each row execute function public.trackdash_queue_recompute_from_aggregate();

create or replace function public.trackdash_queue_recompute_from_price_point()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  old_relevant boolean := false;
  new_relevant boolean := false;
begin
  if tg_op in ('UPDATE','DELETE') then
    old_relevant :=
      old.status = 'active'
      and old.valuation_eligible
      and old.observation_type in ('sold_confirmed','auction_awarded','marketplace_sold')
      and coalesce(old.market_price_eur, old.normalized_price_eur) is not null;
    if old_relevant then
      perform public.trackdash_enqueue_market_recompute(old.release_id, old.condition);
    end if;
  end if;

  if tg_op in ('INSERT','UPDATE') then
    new_relevant :=
      new.status = 'active'
      and new.valuation_eligible
      and new.observation_type in ('sold_confirmed','auction_awarded','marketplace_sold')
      and coalesce(new.market_price_eur, new.normalized_price_eur) is not null;
    if new_relevant then
      perform public.trackdash_enqueue_market_recompute(new.release_id, new.condition);
    end if;
  end if;

  return null;
end;
$$;

drop trigger if exists price_points_queue_market_recompute
  on public.price_points;

create trigger price_points_queue_market_recompute
after insert or update or delete on public.price_points
for each row execute function public.trackdash_queue_recompute_from_price_point();

create or replace function public.trackdash_marketplace_sale_condition(p_condition text)
returns text
language sql
immutable
as $$
  select case
    when p_condition in ('Sealed','New / Opened') then 'new_complete_unbuilt'
    when p_condition in ('Built','Used') then 'built_complete'
    when p_condition = 'Incomplete' then 'incomplete_parts_custom'
    else 'unknown'
  end;
$$;

create or replace function public.trackdash_queue_recompute_from_marketplace_sale()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op in ('UPDATE','DELETE')
     and old.status = 'confirmed'
     and old.item_price_eur is not null
     and old.item_price_eur > 0
  then
    perform public.trackdash_enqueue_market_recompute(
      old.release_id,
      public.trackdash_marketplace_sale_condition(old.condition)
    );
  end if;

  if tg_op in ('INSERT','UPDATE')
     and new.status = 'confirmed'
     and new.item_price_eur is not null
     and new.item_price_eur > 0
  then
    perform public.trackdash_enqueue_market_recompute(
      new.release_id,
      public.trackdash_marketplace_sale_condition(new.condition)
    );
  end if;

  return null;
end;
$$;

drop trigger if exists marketplace_sales_queue_market_recompute
  on public.marketplace_sales;

create trigger marketplace_sales_queue_market_recompute
after insert or update or delete on public.marketplace_sales
for each row execute function public.trackdash_queue_recompute_from_marketplace_sale();

create or replace function public.trackdash_claim_market_recompute_jobs(
  p_limit integer default 8,
  p_lock_minutes integer default 10
)
returns table (
  release_id uuid,
  condition text,
  claimed_dirty_at timestamptz
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
    select q.release_id, q.condition
    from public.market_recompute_queue q
    where q.available_at <= v_now
      and (q.locked_until is null or q.locked_until <= v_now)
    order by q.dirty_at asc, q.release_id
    limit greatest(1, least(coalesce(p_limit, 8), 25))
    for update skip locked
  ), locked as (
    update public.market_recompute_queue q
    set
      locked_until = v_now + make_interval(mins => greatest(1, least(coalesce(p_lock_minutes, 10), 60))),
      attempts = q.attempts + 1,
      updated_at = v_now
    from picked
    where q.release_id = picked.release_id
      and q.condition = picked.condition
    returning q.release_id, q.condition, q.dirty_at
  )
  select l.release_id, l.condition, l.dirty_at
  from locked l
  order by l.dirty_at asc, l.release_id;
end;
$$;

create or replace function public.trackdash_finish_market_recompute_job(
  p_release_id uuid,
  p_condition text,
  p_claimed_dirty_at timestamptz,
  p_success boolean,
  p_error text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(p_success, false) then
    delete from public.market_recompute_queue
    where release_id = p_release_id
      and condition = p_condition
      and dirty_at <= p_claimed_dirty_at;

    update public.market_recompute_queue
    set
      locked_until = null,
      available_at = now(),
      last_error = null,
      updated_at = now()
    where release_id = p_release_id
      and condition = p_condition;
  else
    update public.market_recompute_queue
    set
      locked_until = null,
      available_at = now() + interval '30 minutes',
      last_error = nullif(left(coalesce(p_error, 'recompute failed'), 1000), ''),
      updated_at = now()
    where release_id = p_release_id
      and condition = p_condition;
  end if;
end;
$$;

revoke all on function public.trackdash_enqueue_market_recompute(uuid,text) from public;
revoke all on function public.trackdash_queue_recompute_from_aggregate() from public;
revoke all on function public.trackdash_queue_recompute_from_price_point() from public;
revoke all on function public.trackdash_marketplace_sale_condition(text) from public;
revoke all on function public.trackdash_queue_recompute_from_marketplace_sale() from public;
revoke all on function public.trackdash_claim_market_recompute_jobs(integer,integer) from public;
revoke all on function public.trackdash_finish_market_recompute_job(uuid,text,timestamptz,boolean,text) from public;

grant execute on function public.trackdash_enqueue_market_recompute(uuid,text) to trackdash_app;
grant execute on function public.trackdash_claim_market_recompute_jobs(integer,integer) to trackdash_app;
grant execute on function public.trackdash_finish_market_recompute_job(uuid,text,timestamptz,boolean,text) to trackdash_app;

-- Bootstrap only signals whose completed-sale evidence changed after their last
-- canonical computation. This catches the Avante Jr. Yahoo imports already
-- written before this queue existed, without needlessly recomputing the catalog.
insert into public.market_recompute_queue (
  release_id, condition, dirty_at, available_at, updated_at
)
select
  mao.release_id,
  mao.condition,
  max(mao.updated_at),
  now(),
  now()
from public.market_aggregate_observations mao
left join public.market_release_signals ms
  on ms.release_id = mao.release_id
 and ms.condition = mao.condition
where mao.release_id is not null
  and mao.attribution_status in ('release_exact','release_matched')
  and mao.market_average_eur is not null
  and mao.updated_at > coalesce(ms.computed_at, '1970-01-01'::timestamptz)
group by mao.release_id, mao.condition
on conflict (release_id, condition) do update set
  dirty_at = greatest(public.market_recompute_queue.dirty_at, excluded.dirty_at),
  available_at = now(),
  locked_until = null,
  attempts = 0,
  last_error = null,
  updated_at = now();
