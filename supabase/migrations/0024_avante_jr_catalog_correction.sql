-- Avante Jr catalog correction (2026-09-07)
-- Normalizes the legacy Product label, replaces the invented Premium occurrence
-- with the real 2012 Black Special, and adds three documented later releases.
-- Existing Product/Release UUIDs remain immutable.

-- Product identity / compatibility fields.
update products
set name = 'Avante Jr.',
    slug = 'avante-jr-18709',
    canonical_item_number = '18014',
    series = 'Racing Mini 4WD',
    chassis = 'Type 2',
    original_release_year = 1988,
    rarity = 'Uncommon',
    description = 'The landmark Mini 4WD adaptation of Tamiya''s RC Avante, first released in December 1988 on the Type 2 chassis.',
    updated_at = now()
where id = '82b478fd-21dd-5c93-82fb-bf50461a107d';

-- Original 1988 occurrence. Current 18014 asset belongs to the 2024 page and
-- therefore remains Product-level fallback rather than exact historical proof.
update product_releases
set item_number = '18014',
    release_type = 'Original',
    edition_type = 'original',
    edition_name = 'Avante Jr.',
    release_year = 1988,
    release_date = null,
    chassis = 'Type 2',
    color = 'Blue',
    discontinued = true,
    is_original = true,
    rarity = 'Very Rare',
    data_source = 'tamiya_official',
    verification_status = 'verified',
    production_status = 'discontinued',
    notes = 'Original Avante Jr. occurrence. Tamiya confirms item 18014, Type 2 chassis and first release in December 1988; no exact day or archival exact image is inferred.',
    updated_at = now()
where id = 'cafbb6ca-1aba-5732-946d-0045d054aa5c';

-- Reuse the legacy invented Premium UUID for a real documented occurrence.
update product_releases
set item_number = '18506',
    release_type = 'Color Special',
    edition_type = 'color_special',
    edition_name = 'Avante Jr. Black Special (2012 Reissue)',
    release_year = 2012,
    release_date = '2012-06-16',
    chassis = 'Type 2',
    color = 'Smoke / Black',
    discontinued = true,
    is_original = false,
    rarity = 'Rare',
    data_source = 'tamiya_official',
    verification_status = 'verified',
    production_status = 'discontinued',
    notes = 'The legacy invented Avante (Premium) slot is reused without changing its UUID for the real, officially documented 2012 Avante Jr. Black Special reissue. Tamiya notes the Black Special was first released in September 1989.',
    updated_at = now()
where id = '7f3f7461-0dee-5d6a-b99d-36e2d910f0ef';

-- Later documented occurrences. New UUIDs derive from frozen product seedKey
-- 18709 + releaseSeedKey 3/4/5, never from Tamiya item numbers.
insert into product_releases
  (id, product_id, item_number, release_type, edition_name, release_year, release_date, chassis, color,
   discontinued, is_original, rarity, data_source, edition_type, verification_status, production_status, notes)
values
  ('df8815eb-fd68-54ba-a908-e4fecbe9b5cf','82b478fd-21dd-5c93-82fb-bf50461a107d','95474','Anniversary','Avante Jr. 30th Anniversary Special',2018,'2018-12-22','Type 2','Blue / Blue Plated',true,false,'Rare','tamiya_official','anniversary','verified','discontinued','Official 30th Anniversary revival with both original blue and blue-plated bodies and commemorative stickers.'),
  ('c680423c-a5eb-564c-afa6-953a105e9310','82b478fd-21dd-5c93-82fb-bf50461a107d','18014','Reissue','Avante Jr. (2024 Reissue)',2024,'2024-09-07','Type 2','Blue',false,false,'Common','tamiya_official','reissue','verified','active','Current Tamiya reissue of item 18014. Tamiya explicitly states the first release month was December 1988.'),
  ('91bcff13-76b4-5a09-a83b-1cfb85400b40','82b478fd-21dd-5c93-82fb-bf50461a107d','95501','Color Special','Avante Jr. Black Special (2024 Reissue)',2024,'2024-09-07','Type 2','Smoke / Black',false,false,'Uncommon','tamiya_official','color_special','verified','active','Official 2024 Black Special reissue. The obvious legacy item-scoped static image paths currently return 404 through TrackDash, so this occurrence deliberately uses Product fallback until an official exact asset is demonstrated.')
on conflict (id) do update set
  product_id = excluded.product_id,
  item_number = excluded.item_number,
  release_type = excluded.release_type,
  edition_name = excluded.edition_name,
  release_year = excluded.release_year,
  release_date = excluded.release_date,
  chassis = excluded.chassis,
  color = excluded.color,
  discontinued = excluded.discontinued,
  is_original = excluded.is_original,
  rarity = excluded.rarity,
  data_source = excluded.data_source,
  edition_type = excluded.edition_type,
  verification_status = excluded.verification_status,
  production_status = excluded.production_status,
  notes = excluded.notes,
  updated_at = now();

-- Provenance. Preserve the existing source UUID for the original release.
update release_sources
set source_type = 'official_manufacturer',
    source_url = 'https://www.tamiya.com/japan/products/18014/index.html',
    verified_fields = array['itemNumber','chassis','releaseYear','editionName','color'],
    checked_at = '2026-09-07',
    notes = 'Current page is the 2024 reissue but explicitly documents the original first-release month (December 1988).'
where id = '671f1490-fe87-5e8d-8ed9-1b5bcbce24ab';

insert into release_sources (id, release_id, source_type, source_url, verified_fields, checked_at, notes)
values
  ('6abc8050-1dcd-5369-969b-a814bbd916e5','7f3f7461-0dee-5d6a-b99d-36e2d910f0ef','official_manufacturer','https://www.tamiya.com/japan/products/18506/index.html',array['itemNumber','chassis','releaseYear','releaseDate','editionName','color'],'2026-09-07',null),
  ('aa99f698-43b2-573a-b22e-05be5fdf7078','df8815eb-fd68-54ba-a908-e4fecbe9b5cf','official_manufacturer','https://www.tamiya.com/japan/products/95474/index.html',array['itemNumber','chassis','releaseYear','releaseDate','editionName','color'],'2026-09-07',null),
  ('36eb755d-d890-5b3f-96c9-9c4c37e1f1c8','c680423c-a5eb-564c-afa6-953a105e9310','official_manufacturer','https://www.tamiya.com/japan/products/18014/index.html',array['itemNumber','chassis','releaseYear','releaseDate','editionName','color'],'2026-09-07',null),
  ('fac26b0c-79cb-5a7b-9a16-28ad106c36ab','91bcff13-76b4-5a09-a83b-1cfb85400b40','official_manufacturer','https://www.tamiya.com/japan/products/95501/index.html',array['itemNumber','chassis','releaseYear','releaseDate','editionName','color'],'2026-09-07',null)
on conflict (id) do update set
  release_id = excluded.release_id,
  source_type = excluded.source_type,
  source_url = excluded.source_url,
  verified_fields = excluded.verified_fields,
  checked_at = excluded.checked_at,
  notes = excluded.notes;

-- Exact images only for occurrences whose official asset was demonstrated.
insert into release_images (id, release_id, url, position) values
  ('bf13a0ee-8302-5ce5-9fa5-ce9b85561cff','7f3f7461-0dee-5d6a-b99d-36e2d910f0ef','https://www.tamiya.com/japan_contents/img/usr/item/1/18506/18506_1.jpg',0),
  ('20cc968c-1830-5a67-b320-0632d8aeb9ed','df8815eb-fd68-54ba-a908-e4fecbe9b5cf','https://www.tamiya.com/japan_contents/img/usr/item/9/95474/95474_1.jpg',0),
  ('9768ec45-fee4-5550-8b09-ff7fd0ef17ef','c680423c-a5eb-564c-afa6-953a105e9310','https://www.tamiya.com/japan_contents/img/usr/item/1/18014/18014_1.jpg',0)
on conflict (id) do update set
  release_id = excluded.release_id,
  url = excluded.url,
  position = excluded.position;
