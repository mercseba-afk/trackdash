-- Bounded eBay ASK samples for the private LEGO catalog.
create table public.lego_asking_queue (
  set_number text primary key check (set_number ~ '^[0-9]{5}$'),
  attempted_at timestamptz,
  attempt_status text not null default 'pending'
    check (attempt_status in ('pending', 'running', 'success', 'failed')),
  observed_at date,
  asking_low_cents integer,
  asking_high_cents integer,
  asking_count integer not null default 0 check (asking_count between 0 and 24),
  check (
    (asking_count = 0 and asking_low_cents is null and asking_high_cents is null)
    or (asking_count > 0 and asking_low_cents is not null and asking_high_cents is not null
      and asking_low_cents > 0 and asking_high_cents >= asking_low_cents and observed_at is not null)
  )
);

insert into public.lego_asking_queue (set_number) values
  ('75890'), ('76895'), ('76899'), ('76900'), ('76901'), ('76902'), ('76906'),
  ('76908'), ('76912'), ('76917'), ('76918'), ('76920'), ('76922'), ('76924'),
  ('76934'), ('77239'), ('77241'), ('77242'), ('77247');

create table public.lego_asking_schedule (
  id boolean primary key default true check (id),
  enabled boolean not null default false,
  last_slot bigint not null default -1
);
insert into public.lego_asking_schedule (id) values (true);

alter table public.lego_asking_queue enable row level security;
alter table public.lego_asking_schedule enable row level security;
revoke all on public.lego_asking_queue, public.lego_asking_schedule from public, anon, authenticated;
grant select, update on public.lego_asking_queue, public.lego_asking_schedule to service_role;

create function public.trackdash_claim_lego_asking_scan()
returns table (set_number text, attempted_at timestamptz)
language plpgsql security invoker set search_path = ''
as $$
declare
  scan_slot bigint := floor(extract(epoch from statement_timestamp()) / 21600)::bigint;
begin
  update public.lego_asking_schedule
  set last_slot = scan_slot
  where id and enabled and last_slot < scan_slot;
  if not found then return; end if;

  return query
    update public.lego_asking_queue as job
    set attempted_at = statement_timestamp(), attempt_status = 'running'
    where job.set_number = (
      select candidate.set_number
      from public.lego_asking_queue as candidate
      order by candidate.attempted_at nulls first, candidate.set_number
      limit 1
    )
    returning job.set_number, job.attempted_at;
end;
$$;

revoke all on function public.trackdash_claim_lego_asking_scan() from public, anon, authenticated;
grant execute on function public.trackdash_claim_lego_asking_scan() to service_role;
