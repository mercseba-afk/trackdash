-- Boomerang Jr. public image backfill — 2026-09-25
--
-- Exact-product Suruga assets for two public Releases that previously passed
-- the publication gate through market evidence only.
--
-- 95003 Suruga management ID: 603039270
-- 92394 Suruga management ID: 603092687
--
-- Both direct CDN assets were verified through the TrackDash image proxy
-- before this migration. 94183 remains intentionally untouched because its
-- exact Mandarake/Yahoo photos do not yet have a stable canonical asset URL.

begin;

insert into public.release_images(id,release_id,url,position)
select gen_random_uuid(),v.release_id,v.url,0
from (
  values
    (
      'ab1cdae0-3284-4d50-a124-1ee028022d09'::uuid,
      'https://cdn.suruga-ya.jp/database/pics_webp/game/603039270.jpg.webp'::text
    ),
    (
      'e8196eca-258f-4d8f-9c1d-c54445e43602'::uuid,
      'https://cdn.suruga-ya.jp/database/pics_webp/game/603092687.jpg.webp'::text
    )
) as v(release_id,url)
where not exists (
  select 1
  from public.release_images ri
  where ri.release_id=v.release_id
    and ri.url=v.url
);

insert into public.release_sources(
  id,release_id,source_type,source_url,verified_fields,checked_at,notes
)
values
(
  gen_random_uuid(),
  'ab1cdae0-3284-4d50-a124-1ee028022d09'::uuid,
  'trusted_secondary',
  'https://www.suruga-ya.jp/product/detail/603039270',
  array['itemNumber','editionName','releaseDate','image'],
  date '2026-09-25',
  'Exact Suruga product record for Tamiya ITEM 95003. Management ID 603039270 maps to the exact sample image stored on the Suruga CDN.'
),
(
  gen_random_uuid(),
  'e8196eca-258f-4d8f-9c1d-c54445e43602'::uuid,
  'trusted_secondary',
  'https://www.suruga-ya.jp/product/detail/603092687',
  array['itemNumber','editionName','image'],
  date '2026-09-25',
  'Exact Suruga product record for ITEM 92394 Boomerang RS Hiroshima Toyo Carp collaboration. Management ID 603092687 maps to the exact sample image stored on the Suruga CDN.'
)
on conflict do nothing;

update public.product_releases
set notes=case
      when id='ab1cdae0-3284-4d50-a124-1ee028022d09'::uuid
        then concat_ws(' ',nullif(notes,''),
          'Image backfill 2026-09-25: exact Suruga product image added from management record 603039270.')
      when id='e8196eca-258f-4d8f-9c1d-c54445e43602'::uuid
        then concat_ws(' ',nullif(notes,''),
          'Image backfill 2026-09-25: exact Suruga product image added from management record 603092687.')
      else notes
    end,
    updated_at=now()
where id in (
  'ab1cdae0-3284-4d50-a124-1ee028022d09'::uuid,
  'e8196eca-258f-4d8f-9c1d-c54445e43602'::uuid
);

commit;
