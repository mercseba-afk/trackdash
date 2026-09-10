-- Catalog v1 exact-image audit, batch 1.
--
-- These rows intentionally broaden the image evidence policy beyond official
-- Tamiya-only imagery. Each image is tied to an exact, already-verified Release
-- and is supported by official Tamiya and/or trusted specialist evidence.

with image_values(item_number, release_year, image_url) as (
  values
    ('95501', 2024, 'https://www.chrishouse.ca/cdn/shop/files/tam95501_2.jpg?v=1736610073&width=1946'),
    ('18640', 2015, 'https://bananagames.ca/cdn/shop/files/18640_1.jpg?v=1751561261'),
    ('18646', 2017, 'https://www.chrishouse.ca/cdn/shop/files/tam18646.jpg?v=1767906575&width=1445'),
    ('18704', 2013, 'https://www.totarahobbies.co.nz/cdn/shop/products/1fa4c44703094fdc9681cae38533aeaa_1_1024x1024.jpg?v=1605560922'),
    ('18101', 2022, 'https://chicohobby.com/cdn/shop/files/18101b_800x.jpg?v=1691230373'),
    ('18638', 2014, 'https://s3-ap-northeast-1.amazonaws.com/hobbystock/img/item/00000069565/pc_detail_0.jpg'),
    ('95093', 2016, 'https://item-shopping.c.yimg.jp/i/n/barchetta_mini4k-95093_1')
), targets as (
  select r.id as release_id, v.image_url
  from image_values v
  join public.product_releases r
    on r.item_number = v.item_number
   and r.release_year = v.release_year
)
insert into public.release_images (release_id, url, position)
select t.release_id, t.image_url, 0
from targets t
where not exists (
  select 1 from public.release_images ri where ri.release_id = t.release_id
);

with source_values(item_number, release_year, source_type, source_url, verified_fields, notes) as (
  values
    ('95501', 2024, 'official_manufacturer', 'https://www.tamiya.com/japan/products/95501/index.html', array['itemNumber','editionName','releaseYear','chassis']::text[], 'Tamiya official product page confirms item 95501 Avante Jr. Black Special, Type 2 chassis and 2024 release.'),
    ('95501', 2024, 'trusted_secondary', 'https://www.rcjaz.co.uk/95501-tamiya-avante-jr-black-special-type-chassis-re-release-of-18506-p-14996.html', array['itemNumber','editionName','chassis','image']::text[], 'RCJAZ independently identifies item 95501 and its exact Black Special visual specification.'),
    ('18640', 2015, 'official_manufacturer', 'https://www.tamiya.com/japan/products/18640/index.html', array['itemNumber','editionName','releaseYear','chassis','color']::text[], 'Tamiya official product page confirms item 18640 Raikiri, MA chassis, 2015 release and black/pink specification.'),
    ('18640', 2015, 'trusted_secondary', 'https://www.rcjaz.co.uk/18640-tamiya-raikiri-ma-chassis-p-90068011.html', array['itemNumber','editionName','chassis','image']::text[], 'RCJAZ confirms item 18640 and the exact Raikiri MA release identity.'),
    ('18646', 2017, 'official_manufacturer', 'https://www.tamiya.com/japan/products/18646/index.html', array['itemNumber','editionName','releaseYear','chassis','color']::text[], 'Tamiya official product page confirms item 18646 DCR-01, MA chassis and 2017 release.'),
    ('18646', 2017, 'trusted_secondary', 'https://www.rcjaz.co.uk/18646-tamiya-dcr-01-ma-chassis-jr-p-90076649.html', array['itemNumber','editionName','chassis','image']::text[], 'RCJAZ confirms the exact item 18646 DCR-01 release identity and visual specification.'),
    ('18704', 2013, 'official_manufacturer', 'https://www.tamiya.com/japan/products/18704/index.html', array['itemNumber','editionName','releaseYear','chassis']::text[], 'Tamiya official product page confirms item 18704 Shadow Shark, AR chassis and 2013 release.'),
    ('18704', 2013, 'trusted_secondary', 'https://www.rcjaz.co.uk/18704-tamiya-jr-mini-4wd-rev-shadow-shark-drive-ar-chassis-p-90063629.html', array['itemNumber','editionName','chassis','image']::text[], 'RCJAZ confirms item 18704 and the exact Shadow Shark AR release.'),
    ('18101', 2022, 'official_manufacturer', 'https://www.tamiya.com/japan/products/18101/index.html', array['itemNumber','editionName','releaseYear','chassis','color']::text[], 'Tamiya official product page confirms item 18101 Super Avante Jr., VZ chassis and 2022 release.'),
    ('18101', 2022, 'trusted_secondary', 'https://www.rcjaz.co.uk/tamiya-18101-super-avante-jr-vz-p-27977.html', array['itemNumber','editionName','chassis','image']::text[], 'RCJAZ confirms item 18101 and the exact Super Avante Jr. VZ release.'),
    ('18638', 2014, 'trusted_secondary', 'https://www.rcjaz.co.uk/18638-tamiya-jr-tri-gale-ma-chassis-p-90065011.html', array['itemNumber','editionName','chassis','image']::text[], 'RCJAZ confirms item 18638 Tri Gale and its MA chassis exact release identity.'),
    ('95093', 2016, 'trusted_secondary', 'https://www.rcjaz.co.uk/95093-tamiya-raikiri-japan-cup-2016-ma-chassis-p-90073295.html', array['itemNumber','editionName','releaseYear','chassis','image']::text[], 'RCJAZ confirms item 95093 Raikiri Japan Cup 2016, MA chassis and exact event livery.')
), targets as (
  select r.id as release_id, s.source_type, s.source_url, s.verified_fields, s.notes
  from source_values s
  join public.product_releases r
    on r.item_number = s.item_number
   and r.release_year = s.release_year
)
insert into public.release_sources (release_id, source_type, source_url, verified_fields, checked_at, notes)
select t.release_id, t.source_type, t.source_url, t.verified_fields, date '2026-09-09', t.notes
from targets t
where not exists (
  select 1 from public.release_sources rs
  where rs.release_id = t.release_id and rs.source_url = t.source_url
);
