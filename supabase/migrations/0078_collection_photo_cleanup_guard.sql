-- Allow the original owner to clean Storage objects after manually deleting a
-- collection item, while preserving photo objects referenced by a completed
-- TrackDash transfer. This closes the DB-delete -> Storage-orphan gap without
-- making historical seller provenance deletable through the normal UI.

create or replace function public.trackdash_can_delete_collection_photo_object(p_path text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    auth.uid() is not null
    and split_part(p_path, '/', 1) = auth.uid()::text
    and (
      exists (
        select 1
        from public.collection_item_photos p
        join public.collection_items ci on ci.id = p.collection_item_id
        where p.url = p_path
          and ci.user_id = auth.uid()
      )
      or (
        not exists (
          select 1
          from public.collection_item_photos p
          where p.url = p_path
        )
        and not exists (
          select 1
          from public.collection_item_transfers t
          where coalesce(t.seller_photo_urls, '[]'::jsonb) ? p_path
        )
      )
    );
$$;

revoke all on function public.trackdash_can_delete_collection_photo_object(text) from public;
grant execute on function public.trackdash_can_delete_collection_photo_object(text) to authenticated;

drop policy if exists collection_item_photos_storage_delete on storage.objects;
create policy collection_item_photos_storage_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'collection-item-photos'
  and public.trackdash_can_delete_collection_photo_object(name)
);
