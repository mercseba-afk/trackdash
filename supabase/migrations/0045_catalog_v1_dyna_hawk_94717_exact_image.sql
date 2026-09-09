-- Catalog v1 exact-image audit: Dyna-Hawk GX 94717.
--
-- RCJAZ identifies 94717 as the Dyna-Hawk GX Super XX Special with pearl
-- white body, red Super XX chassis and yellow tires. Item 95467 is a later
-- visually identical reissue, so its official Tamiya image is intentionally
-- reused here as the exact visual representation for the 94717 occurrence.

with target as (
  select id
  from public.product_releases
  where item_number = '94717'
    and release_year = 2010
    and edition_name ilike '%Dyna-Hawk GX Super XX Special%'
)
insert into public.release_images (release_id, url, position)
select target.id,
       'https://www.tamiya.com/japan_contents/img/usr/item/9/95467/95467_1.jpg',
       0
from target
where not exists (
  select 1
  from public.release_images ri
  where ri.release_id = target.id
    and ri.url = 'https://www.tamiya.com/japan_contents/img/usr/item/9/95467/95467_1.jpg'
);

update public.product_releases
set verification_status = 'verified',
    updated_at = now()
where item_number = '94717'
  and release_year = 2010
  and edition_name ilike '%Dyna-Hawk GX Super XX Special%';

with target as (
  select id
  from public.product_releases
  where item_number = '94717'
    and release_year = 2010
    and edition_name ilike '%Dyna-Hawk GX Super XX Special%'
)
insert into public.release_sources
  (release_id, source_type, source_url, verified_fields, checked_at, notes)
select target.id,
       'trusted_secondary',
       'https://www.rcjaz.co.uk/94717-tamiya-jr-dyna-hawk-gx-super-xx-sp-chassis-p-90016890.html',
       array['itemNumber','editionName','chassis','color','image'],
       date '2026-09-09',
       'RCJAZ identifies 94717 as Dyna-Hawk GX Super XX Special with pearl white body, red Super XX chassis and yellow tires. The 2019 item 95467 is a visually identical reissue, so its official Tamiya image is intentionally reused as exact visual representation for 94717.'
from target
where not exists (
  select 1 from public.release_sources rs
  where rs.release_id = target.id
    and rs.source_url = 'https://www.rcjaz.co.uk/94717-tamiya-jr-dyna-hawk-gx-super-xx-sp-chassis-p-90016890.html'
);
