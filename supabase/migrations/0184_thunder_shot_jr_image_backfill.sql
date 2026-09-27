-- Thunder Shot Jr. exact/high-confidence image backfill — 2026-09-27
--
-- Adds four verified heroes recovered after the family-completion pass:
-- - 18009 Original 1988: exact-era Mercari listing explicitly identified as 1988 production.
-- - 92078 TKC 1992: exact Mercari listing independently matching the DATEV/TKC 1992 identity.
-- - 92314 Legend Style Gold: exact RCJAZ product page og:image.
-- - 92315 Legend Style Silver: exact RCJAZ product page og:image.
--
-- Intentional placeholders remain for:
-- - 18009 Shonen Jump 20th Anniversary Prize Version
-- - 92254 Excalibur Red
-- - 92255 Excalibur Clear Blue
--
-- Do not replace those placeholders with sibling/family imagery.

begin;

delete from public.release_images
where release_id in (
  'dcaa9d00-fe3f-5bc4-9bfa-5bc1078e2087'::uuid,
  '2b0a5772-f849-4b0e-87b9-0b271f75b2d7'::uuid,
  '7c183356-2414-43e3-a214-7416a26955c8'::uuid,
  'f6bc9832-bcb3-444a-9ec6-4d20b818d3d5'::uuid
);

insert into public.release_images(id,release_id,url,position)
values
  (
    gen_random_uuid(),
    'dcaa9d00-fe3f-5bc4-9bfa-5bc1078e2087'::uuid,
    'https://static.mercdn.net/item/detail/orig/photos/m50992847935_1.jpg?1714657879',
    0
  ),
  (
    gen_random_uuid(),
    '2b0a5772-f849-4b0e-87b9-0b271f75b2d7'::uuid,
    'https://static.mercdn.net/item/detail/orig/photos/m46162360868_1.jpg?1709382370',
    0
  ),
  (
    gen_random_uuid(),
    '7c183356-2414-43e3-a214-7416a26955c8'::uuid,
    'https://www.rcjaz.ca/images/tamiya/mini_4wd_series/mini_4wd_car_kit/vs_chassis/b_92314.jpg',
    0
  ),
  (
    gen_random_uuid(),
    'f6bc9832-bcb3-444a-9ec6-4d20b818d3d5'::uuid,
    'https://www.rcjaz.ca/images/tamiya/mini_4wd_series/mini_4wd_car_kit/vs_chassis/b_92315.jpg',
    0
  );

insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
select gen_random_uuid(),v.release_id,'trusted_secondary',v.source_url,v.verified_fields,date '2026-09-27',v.notes
from (
  values
  (
    'dcaa9d00-fe3f-5bc4-9bfa-5bc1078e2087'::uuid,
    'https://jp.mercari.com/item/m50992847935',
    array['editionName','releaseYear','image']::text[],
    'Exact marketplace example explicitly identified as Thunder Shot Jr. 1988 production. Main Mercari image used as a high-confidence exact-era hero; the 2006 Tamiya image remains excluded from the 1988 Release.'
  ),
  (
    '2b0a5772-f849-4b0e-87b9-0b271f75b2d7'::uuid,
    'https://jp.mercari.com/item/m46162360868',
    array['editionName','releaseYear','image','marketContext']::text[],
    'Exact TKC 1992 marketplace example. Listing description independently matches the DATEV/TKC Nuremberg 1992 distribution history; main Mercari image used as the Release hero.'
  ),
  (
    '7c183356-2414-43e3-a214-7416a26955c8'::uuid,
    'https://www.rcjaz.ca/tamiya-92314-thunder-shot-jr-gold-plated-special-edition-model-kit-132-p-90069800.html',
    array['itemNumber','editionName','image']::text[],
    'Exact RCJAZ product page for ITEM 92314; og:image points to the exact Gold Legend Style asset used as hero.'
  ),
  (
    'f6bc9832-bcb3-444a-9ec6-4d20b818d3d5'::uuid,
    'https://www.rcjaz.ca/tamiya-92315-thunder-shot-jr-silver-plated-special-edition-model-kit-p-90069801.html',
    array['itemNumber','editionName','image']::text[],
    'Exact RCJAZ product page for ITEM 92315; og:image points to the exact Silver Legend Style asset used as hero.'
  )
) as v(release_id,source_url,verified_fields,notes)
where not exists (
  select 1
  from public.release_sources s
  where s.release_id=v.release_id
    and s.source_url=v.source_url
);

commit;
