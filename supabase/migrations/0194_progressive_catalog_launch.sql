-- Progressive Mini 4WD catalog launch — 2026-09-29
--
-- Keeps completed/audited families fully available while preserving the rest
-- of the visible catalog as transparent "coming soon" entries.
-- A future transition from coming_soon -> available creates one real
-- notification per user. Initial status assignment occurs before the trigger
-- is created, so no historical launch burst is generated.

begin;

update public.products
set metadata = coalesce(metadata,'{}'::jsonb) || jsonb_build_object(
      'launch_status','coming_soon',
      'launch_status_updated_at','2026-09-29',
      'launch_strategy','progressive_public_catalog_v1'
    ),
    updated_at=now()
where category_id='cd755fcb-2bc5-5975-8ec0-f45e7df891cc'
  and coalesce(metadata->>'catalog_visibility','public') <> 'archived';

update public.products
set metadata = coalesce(metadata,'{}'::jsonb) || jsonb_build_object(
      'launch_status','available',
      'launch_status_updated_at','2026-09-29',
      'launch_strategy','progressive_public_catalog_v1'
    ),
    updated_at=now()
where category_id='cd755fcb-2bc5-5975-8ec0-f45e7df891cc'
  and slug = any(array[
    'boomerang-jr-18004',
    'hornet-jr-18002',
    'hotshot-jr-18001',
    'super-dragon-jr-18007',
    'thunder-dragon-jr-18008',
    'thunder-shot-jr-18009',
    'fire-dragon-jr-18011',
    'dash-1-emperor-18025',
    'dash-2-burning-sun-18702',
    'dash-3-shooting-star-18703',
    'rising-bird-18017',
    'proto-emperor-zx-18714',
    'magnum-saber-19401',
    'neo-tridagger-zmc-19434',
    'dyna-hawk-gx-19601',
    'avante-mk-ii-18710',
    'manta-ray-mkii-18615',
    'avante-mk-iii-avante-mk3',
    'dash-x1-proto-emperor-dash-x1-proto-emperor',
    'aero-manta-ray-18703'
  ]);

create schema if not exists private;

create or replace function private.trackdash_notify_catalog_family_available()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  old_status text := coalesce(old.metadata->>'launch_status','available');
  new_status text := coalesce(new.metadata->>'launch_status','available');
begin
  if new.category_id='cd755fcb-2bc5-5975-8ec0-f45e7df891cc'
     and old_status='coming_soon'
     and new_status='available' then
    insert into public.notifications(
      user_id,type,title,body,href,entity_type,entity_id,dedupe_key,metadata
    )
    select
      p.id,
      'catalog_family_available',
      null,
      null,
      '/catalog/' || new.id::text,
      'product',
      new.id,
      'catalog-family-available:' || new.id::text,
      jsonb_build_object('product_name',new.name)
    from public.profiles p
    on conflict (user_id,dedupe_key) where dedupe_key is not null do nothing;
  end if;
  return new;
end;
$$;

revoke all on function private.trackdash_notify_catalog_family_available() from public;

drop trigger if exists trg_trackdash_catalog_family_available on public.products;
create trigger trg_trackdash_catalog_family_available
after update of metadata on public.products
for each row
execute function private.trackdash_notify_catalog_family_available();

commit;
