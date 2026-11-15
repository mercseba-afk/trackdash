create function public.trackdash_claim_catalog_pushes()
returns table(notification_id uuid, endpoint text, keys jsonb, user_id uuid, href text)
language sql
security definer
set search_path = ''
as $$
  with candidates as (
    select n.id, s.endpoint, s.keys, s.user_id, n.href
    from public.push_pilot_subscriptions s
    join public.notifications n on n.user_id = s.user_id
    where n.type in ('catalog_family_available', 'catalog_release_available')
      and n.available_at <= now()
      and n.read_at is null
      and n.created_at >= s.created_at
      and n.available_at >= now() - interval '24 hours'
      and not exists (
        select 1 from public.push_pilot_deliveries d
        where d.notification_id = n.id and d.endpoint = s.endpoint
      )
    order by n.available_at, n.id, s.endpoint
    limit 50
  ), claimed as (
    insert into public.push_pilot_deliveries (notification_id, endpoint)
    select c.id, c.endpoint from candidates c
    on conflict do nothing
    returning push_pilot_deliveries.notification_id, push_pilot_deliveries.endpoint
  )
  select c.id, c.endpoint, c.keys, c.user_id, c.href
  from candidates c join claimed d on d.notification_id = c.id and d.endpoint = c.endpoint;
$$;

revoke all on function public.trackdash_claim_catalog_pushes() from public, anon, authenticated;
grant execute on function public.trackdash_claim_catalog_pushes() to service_role;
