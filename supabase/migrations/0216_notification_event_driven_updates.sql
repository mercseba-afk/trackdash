-- Notification UX: stop coupling user-facing update notices to every deployment.
-- New catalog Release notifications are event-based and only fire for a verified
-- public Mini 4WD Release inserted into an already-available family.
-- Important app announcements are explicit broadcasts, never build-SHA driven.

create or replace function private.trackdash_notify_catalog_release_inserted()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_product_name text;
  v_category_id uuid;
  v_launch_status text;
begin
  select p.name, p.category_id, coalesce(p.metadata->>'launch_status','available')
    into v_product_name, v_category_id, v_launch_status
  from public.products p
  where p.id = new.product_id;

  if v_category_id = 'cd755fcb-2bc5-5975-8ec0-f45e7df891cc'::uuid
     and v_launch_status = 'available'
     and new.catalog_visibility = 'public'
     and new.verification_status = 'verified' then
    insert into public.notifications(
      user_id,type,title,body,href,entity_type,entity_id,dedupe_key,metadata
    )
    select
      p.id,
      'catalog_release_available',
      null,
      null,
      '/catalog/' || new.product_id::text || '/releases/' || new.id::text,
      'release',
      new.id,
      'catalog-release-available:' || new.id::text,
      jsonb_build_object(
        'product_name', v_product_name,
        'edition_name', new.edition_name,
        'item_number', new.item_number,
        'release_year', new.release_year
      )
    from public.profiles p
    on conflict (user_id,dedupe_key) where dedupe_key is not null do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_trackdash_catalog_release_inserted on public.product_releases;
create trigger trg_trackdash_catalog_release_inserted
after insert on public.product_releases
for each row execute function private.trackdash_notify_catalog_release_inserted();

create or replace function public.trackdash_broadcast_important_update(
  p_key text,
  p_title_it text,
  p_body_it text,
  p_title_en text,
  p_body_en text,
  p_href text default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
begin
  if nullif(trim(p_key),'') is null then
    raise exception 'IMPORTANT_UPDATE_KEY_REQUIRED';
  end if;

  with inserted as (
    insert into public.notifications(
      user_id,type,title,body,href,entity_type,entity_id,dedupe_key,metadata
    )
    select
      p.id,
      'app_important_update',
      null,
      null,
      nullif(p_href,''),
      'app_update',
      null,
      'important-update:' || trim(p_key),
      jsonb_build_object(
        'title_it', coalesce(p_title_it,''),
        'body_it', coalesce(p_body_it,''),
        'title_en', coalesce(p_title_en,''),
        'body_en', coalesce(p_body_en,'')
      )
    from public.profiles p
    on conflict (user_id,dedupe_key) where dedupe_key is not null do nothing
    returning 1
  )
  select count(*) into v_count from inserted;

  return v_count;
end;
$$;

revoke all on function public.trackdash_broadcast_important_update(text,text,text,text,text,text) from public;
revoke all on function public.trackdash_broadcast_important_update(text,text,text,text,text,text) from anon;
revoke all on function public.trackdash_broadcast_important_update(text,text,text,text,text,text) from authenticated;
grant execute on function public.trackdash_broadcast_important_update(text,text,text,text,text,text) to service_role;
