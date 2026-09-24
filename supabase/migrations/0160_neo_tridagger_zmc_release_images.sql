-- Neo-Tridagger ZMC Release image fill — 2026-09-24
-- Applies the global TrackDash image-confidence policy:
-- high-confidence correct image > placeholder > probably wrong image.
--
-- Confidence:
-- 94647  EXACT VERIFIED        RCJaz exact-product page / exact ITEM image
-- 92277  HIGH-CONFIDENCE       Mercari Shops exact ITEM 92277 Navy listing
-- 92278  HIGH-CONFIDENCE       Mercari exact ITEM 92278 Clear Red listing
-- 92279  EXACT VERIFIED        Suruga exact ITEM 92279 White product identity / asset
-- 92280  HIGH-CONFIDENCE       Mercari exact ITEM 92280 Smoke listing

begin;

-- Fail closed if another image was assigned after the audit. This migration
-- must never silently replace a newly-added canonical Release image.
do $$
declare
  v_existing integer;
begin
  select count(*)
  into v_existing
  from public.release_images
  where release_id in (
    '745ce3cb-0738-5fb8-bb1e-3d96ab1ca24a'::uuid,
    '2c3bb44f-819f-5375-80dc-ae3bc8c9c8f9'::uuid,
    '0d31f75e-f922-567f-9a48-a824450b1ba2'::uuid,
    '581ca254-25b2-57d3-983a-caf0fa722806'::uuid,
    '19b89e91-ffe5-59d6-b213-dae1cdccfa9d'::uuid
  );

  if v_existing <> 0 then
    raise exception 'Neo-Tridagger image fill expected 0 existing target images, found %; re-audit before replacing', v_existing;
  end if;
end $$;

insert into public.release_images(id,release_id,url,position)
values
(
  gen_random_uuid(),
  '745ce3cb-0738-5fb8-bb1e-3d96ab1ca24a'::uuid,
  'https://www.rcjaz.ca/images/tamiya/mini_4wd_series/mini_4wd_car_kit/super_i_chassis/b_94647.jpg',
  0
),
(
  gen_random_uuid(),
  '2c3bb44f-819f-5375-80dc-ae3bc8c9c8f9'::uuid,
  'https://assets.mercari-shops-static.com/-/large/plain/mGxDWoVdkitKnGjniPvqbk.webp@jpg',
  0
),
(
  gen_random_uuid(),
  '0d31f75e-f922-567f-9a48-a824450b1ba2'::uuid,
  'https://static.mercdn.net/item/detail/orig/photos/m15829754498_1.jpg?1701782544',
  0
),
(
  gen_random_uuid(),
  '581ca254-25b2-57d3-983a-caf0fa722806'::uuid,
  'https://cdn.suruga-ya.jp/database/pics_webp/game/603052146.jpg.webp',
  0
),
(
  gen_random_uuid(),
  '19b89e91-ffe5-59d6-b213-dae1cdccfa9d'::uuid,
  'https://static.mercdn.net/item/detail/orig/photos/m62676061261_1.jpg?1716629301',
  0
);

-- Persist page-level provenance for the three marketplace/retailer assets that
-- were not already represented in release_sources.
insert into public.release_sources(
  id,release_id,source_type,source_url,verified_fields,checked_at,notes
)
select gen_random_uuid(),
       '745ce3cb-0738-5fb8-bb1e-3d96ab1ca24a'::uuid,
       'trusted_secondary',
       'https://www.rcjaz.ca/tamiya-94647-neotridagger-zmc-mini-4wd-special-kit-p-80003593.html',
       array['itemNumber','editionName','image'],
       date '2026-09-24',
       'Image audit 2026-09-24 — EXACT VERIFIED. Exact RCJaz ITEM 94647 product page exposes the selected Release image; asset returned HTTP 200 image/jpeg during independent probe.'
where not exists (
  select 1 from public.release_sources
  where release_id='745ce3cb-0738-5fb8-bb1e-3d96ab1ca24a'::uuid
    and source_url='https://www.rcjaz.ca/tamiya-94647-neotridagger-zmc-mini-4wd-special-kit-p-80003593.html'
);

insert into public.release_sources(
  id,release_id,source_type,source_url,verified_fields,checked_at,notes
)
select gen_random_uuid(),
       '2c3bb44f-819f-5375-80dc-ae3bc8c9c8f9'::uuid,
       'other',
       'https://jp.mercari.com/shops/product/6EeryZA9B3GCBVxGfoex6F',
       array['itemNumber','editionName','color','image'],
       date '2026-09-24',
       'Image audit 2026-09-24 — HIGH-CONFIDENCE MATCHED. Exact Mercari Shops listing identifies ITEM 92277 Neo-Tridagger ZMC Next Navy; selected image is the listing asset and was independently probed.'
where not exists (
  select 1 from public.release_sources
  where release_id='2c3bb44f-819f-5375-80dc-ae3bc8c9c8f9'::uuid
    and source_url='https://jp.mercari.com/shops/product/6EeryZA9B3GCBVxGfoex6F'
);

insert into public.release_sources(
  id,release_id,source_type,source_url,verified_fields,checked_at,notes
)
select gen_random_uuid(),
       '0d31f75e-f922-567f-9a48-a824450b1ba2'::uuid,
       'other',
       'https://jp.mercari.com/item/m15829754498',
       array['itemNumber','editionName','color','chassis','image'],
       date '2026-09-24',
       'Image audit 2026-09-24 — HIGH-CONFIDENCE MATCHED. Exact Mercari listing explicitly states ITEM 92278, Clear Red, Super 1 and Neo-Tridagger ZMC Next; selected original listing image returned HTTP 200 image/jpeg (1080x1080).'
where not exists (
  select 1 from public.release_sources
  where release_id='0d31f75e-f922-567f-9a48-a824450b1ba2'::uuid
    and source_url='https://jp.mercari.com/item/m15829754498'
);

insert into public.release_sources(
  id,release_id,source_type,source_url,verified_fields,checked_at,notes
)
select gen_random_uuid(),
       '19b89e91-ffe5-59d6-b213-dae1cdccfa9d'::uuid,
       'other',
       'https://jp.mercari.com/item/m62676061261',
       array['itemNumber','editionName','color','chassis','image'],
       date '2026-09-24',
       'Image audit 2026-09-24 — HIGH-CONFIDENCE MATCHED. Exact Mercari listing explicitly states ITEM 92280, Smoke, Super 1 and Neo-Tridagger ZMC Next; selected original listing image returned HTTP 200 image/jpeg (1080x1080).'
where not exists (
  select 1 from public.release_sources
  where release_id='19b89e91-ffe5-59d6-b213-dae1cdccfa9d'::uuid
    and source_url='https://jp.mercari.com/item/m62676061261'
);

-- The exact Suruga 92279 identity source already exists; mark image
-- attribution and confidence on that canonical provenance row.
update public.release_sources
set verified_fields = case
      when 'image'=any(verified_fields) then verified_fields
      else array_append(verified_fields,'image')
    end,
    notes = case
      when coalesce(notes,'') like '%Image audit 2026-09-24%' then notes
      else concat_ws(' ',nullif(notes,''),
        'Image audit 2026-09-24 — EXACT VERIFIED. The selected Suruga CDN asset is keyed by this exact product management number 603052146 / ITEM 92279 and returned HTTP 200 image/webp (512x512).')
    end,
    checked_at=date '2026-09-24'
where release_id='581ca254-25b2-57d3-983a-caf0fa722806'::uuid
  and source_url='https://www.suruga-ya.jp/product/detail/603052146';

-- Keep the image confidence decision visible in the Release audit trail.
update public.product_releases
set notes = case
  when coalesce(notes,'') like '%Image audit 2026-09-24:%' then notes
  else concat_ws(' ',nullif(notes,''),
    case item_number
      when '94647' then 'Image audit 2026-09-24: EXACT VERIFIED image selected from the exact RCJaz ITEM 94647 page.'
      when '92277' then 'Image audit 2026-09-24: HIGH-CONFIDENCE MATCHED image selected from an exact Mercari Shops ITEM 92277 Navy listing.'
      when '92278' then 'Image audit 2026-09-24: HIGH-CONFIDENCE MATCHED image selected from the exact Mercari ITEM 92278 Clear Red listing.'
      when '92279' then 'Image audit 2026-09-24: EXACT VERIFIED image selected from the exact Suruga ITEM 92279 White identity / product-management asset.'
      when '92280' then 'Image audit 2026-09-24: HIGH-CONFIDENCE MATCHED image selected from the exact Mercari ITEM 92280 Smoke listing.'
      else null
    end)
  end,
  updated_at=now()
where product_id='9793fbe8-dcf7-51c9-9f45-185194a0bc92'::uuid
  and item_number in ('94647','92277','92278','92279','92280');

commit;
