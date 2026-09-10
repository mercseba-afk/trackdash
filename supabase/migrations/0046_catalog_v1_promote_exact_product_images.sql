-- Promote existing Product-level official Tamiya images to the exact Release
-- rows when the image URL itself carries the same unique Tamiya item number.
-- These were false fallbacks: the correct image already existed in the catalog,
-- but only at Product scope.

with targets(item_number, release_year, image_url) as (values
  ('18033', 1991, 'https://www.tamiya.com/japan_contents/img/usr/item/1/18033/18033_1.jpg'),
  ('19423', 1997, 'https://www.tamiya.com/japan_contents/img/usr/item/1/19423/19423_1.jpg'),
  ('18012', 1988, 'https://www.tamiya.com/japan_contents/img/usr/item/1/18012/18012_1.jpg'),
  ('18015', 1989, 'https://www.tamiya.com/japan_contents/img/usr/item/1/18015/18015_1.jpg'),
  ('18019', 1989, 'https://www.tamiya.com/japan_contents/img/usr/item/1/18019/18019_1.jpg'),
  ('19201', 1998, 'https://www.tamiya.com/japan_contents/img/usr/item/1/19201/19201_1.jpg'),
  ('18011', 1988, 'https://www.tamiya.com/japan_contents/img/usr/item/1/18011/18011_1.jpg'),
  ('18036', 1990, 'https://www.tamiya.com/japan_contents/img/usr/item/1/18036/18036_1.jpg'),
  ('18035', 1991, 'https://www.tamiya.com/japan_contents/img/usr/item/1/18035/18035_1.jpg'),
  ('19407', 1995, 'https://www.tamiya.com/japan_contents/img/usr/item/1/19407/19407_1.jpg')
), resolved as (
  select pr.id as release_id, t.image_url
  from targets t
  join public.product_releases pr
    on pr.item_number=t.item_number and pr.release_year=t.release_year
)
insert into public.release_images (release_id, url, position)
select r.release_id, r.image_url, 0
from resolved r
where not exists (
  select 1 from public.release_images ri
  where ri.release_id=r.release_id and ri.url=r.image_url
);
