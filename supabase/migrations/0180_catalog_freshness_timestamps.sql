-- Keep parent catalog timestamps fresh when child evidence/assets change.
-- The public sitemap uses these timestamps (plus market computed_at) for lastmod,
-- so crawlers are told when a Release/model page materially changed.

create or replace function public.trackdash_touch_catalog_parent_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_release_id uuid;
  v_product_id uuid;
begin
  if tg_table_name in ('release_images', 'release_sources') then
    v_release_id := coalesce(new.release_id, old.release_id);

    update public.product_releases
    set updated_at = now()
    where id = v_release_id;

    return coalesce(new, old);
  end if;

  if tg_table_name = 'product_images' then
    v_product_id := coalesce(new.product_id, old.product_id);

    update public.products
    set updated_at = now()
    where id = v_product_id;

    return coalesce(new, old);
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists release_images_touch_release_updated_at on public.release_images;
create trigger release_images_touch_release_updated_at
after insert or update or delete on public.release_images
for each row execute function public.trackdash_touch_catalog_parent_updated_at();

drop trigger if exists release_sources_touch_release_updated_at on public.release_sources;
create trigger release_sources_touch_release_updated_at
after insert or update or delete on public.release_sources
for each row execute function public.trackdash_touch_catalog_parent_updated_at();

drop trigger if exists product_images_touch_product_updated_at on public.product_images;
create trigger product_images_touch_product_updated_at
after insert or update or delete on public.product_images
for each row execute function public.trackdash_touch_catalog_parent_updated_at();
