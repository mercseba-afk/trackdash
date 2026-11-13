create or replace function private.trackdash_queue_catalog_family_notice(
  family_id uuid, family_name text, release_id uuid, launched boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  pending_type text := case when launched then 'catalog_family_available' else 'catalog_release_available' end;
  family_href text := '/catalog/' || family_id::text;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(family_id::text, 0));

  -- The existing pending row is the batch. A fixed window prevents a busy family
  -- from postponing its notification indefinitely.
  with updated as (
    update public.notifications n
    set type = case when launched then pending_type else n.type end,
        metadata = n.metadata || jsonb_build_object(
          'release_ids', coalesce(n.metadata->'release_ids', '[]'::jsonb) ||
            case when release_id is null then '[]'::jsonb else jsonb_build_array(release_id) end
        )
    where n.entity_type = 'product' and n.entity_id = family_id
      and n.type in ('catalog_family_available', 'catalog_release_available')
      and n.read_at is null and n.available_at > now()
      and n.metadata ? 'release_ids'
    returning n.user_id
  )
  insert into public.notifications(user_id,type,href,entity_type,entity_id,metadata,available_at)
  select p.id,pending_type,family_href,'product',family_id,
    jsonb_build_object('product_name',family_name,'edition_name',family_name,
      'release_ids',case when release_id is null then '[]'::jsonb else jsonb_build_array(release_id) end),
    now() + interval '5 minutes'
  from public.profiles p
  where not exists (select 1 from updated u where u.user_id = p.id);
end;
$$;

revoke all on function private.trackdash_queue_catalog_family_notice(uuid,text,uuid,boolean)
  from public, anon, authenticated;

create or replace function private.trackdash_notify_catalog_release_inserted()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  family public.products%rowtype;
begin
  if new.catalog_visibility <> 'public' or new.verification_status <> 'verified' then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if old.catalog_visibility = 'public' and old.verification_status = 'verified' then
      return new;
    end if;
  end if;

  select p.* into family from public.products p where p.id = new.product_id;
  if family.category_id = 'cd755fcb-2bc5-5975-8ec0-f45e7df891cc'
     and coalesce(family.metadata->>'launch_status','available') = 'available'
     and coalesce(family.metadata->>'catalog_visibility','public') = 'public' then
    perform private.trackdash_queue_catalog_family_notice(family.id,family.name,new.id,false);
  end if;
  return new;
end;
$$;

create trigger trg_trackdash_catalog_release_published
after update of catalog_visibility, verification_status on public.product_releases
for each row execute function private.trackdash_notify_catalog_release_inserted();

create or replace function private.trackdash_notify_catalog_family_available()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.category_id = 'cd755fcb-2bc5-5975-8ec0-f45e7df891cc'
     and coalesce(new.metadata->>'launch_status','available') = 'available'
     and coalesce(new.metadata->>'catalog_visibility','public') = 'public'
     and (
       coalesce(old.metadata->>'launch_status','available') = 'coming_soon'
       or coalesce(old.metadata->>'catalog_visibility','public') <> 'public'
     ) then
    perform private.trackdash_queue_catalog_family_notice(new.id,new.name,null,true);
  end if;
  return new;
end;
$$;
