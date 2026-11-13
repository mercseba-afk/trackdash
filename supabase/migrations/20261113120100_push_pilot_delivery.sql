create table public.push_pilot_subscriptions (
  endpoint text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  keys jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.push_pilot_subscriptions enable row level security;
revoke all on public.push_pilot_subscriptions from anon, authenticated;
grant select,insert,update,delete on public.push_pilot_subscriptions to service_role;

create table public.push_pilot_deliveries (
  notification_id uuid not null references public.notifications(id) on delete cascade,
  endpoint text not null references public.push_pilot_subscriptions(endpoint) on delete cascade,
  primary key (notification_id, endpoint)
);
alter table public.push_pilot_deliveries enable row level security;
revoke all on public.push_pilot_deliveries from anon, authenticated;
grant select,insert,delete on public.push_pilot_deliveries to service_role;

create function public.trackdash_claim_pilot_pushes(p_user uuid)
returns table(notification_id uuid, endpoint text, keys jsonb, type text, href text)
language sql
security invoker
set search_path = ''
as $$
  with candidates as (
    select n.id, s.endpoint, s.keys, n.type, n.href
    from public.push_pilot_subscriptions s
    join public.notifications n on n.user_id=s.user_id
    where s.user_id=p_user and n.available_at <= now() and n.read_at is null
      and n.created_at >= greatest(s.created_at,now()-interval '15 minutes')
      and n.type in ('marketplace_offer_received','marketplace_counteroffer_received',
        'catalog_family_available','catalog_release_available')
      and not exists (select 1 from public.push_pilot_deliveries d
        where d.notification_id=n.id and d.endpoint=s.endpoint)
    order by n.available_at,n.id,s.endpoint
    limit 10
  ), claimed as (
    insert into public.push_pilot_deliveries select c.id,c.endpoint from candidates c
    on conflict do nothing returning push_pilot_deliveries.notification_id,push_pilot_deliveries.endpoint
  )
  select c.id,c.endpoint,c.keys,c.type,c.href
  from candidates c join claimed d on d.notification_id=c.id and d.endpoint=c.endpoint;
$$;
revoke all on function public.trackdash_claim_pilot_pushes(uuid) from public,anon,authenticated;
grant execute on function public.trackdash_claim_pilot_pushes(uuid) to service_role;
