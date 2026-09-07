-- Catalog hierarchy audit (2026-09-07)
-- Normalizes three legacy Product rows whose names/item metadata were not real
-- Product identities, preserves all previously allocated Product/Release UUIDs,
-- and expands Aero Thunder Shot / Dyipne with documented commercial releases.
--
-- UNKNOWN > INVENTED: Aero Thunder Shot 94990 and 95273 are inserted without
-- exact release images because their historical official Tamiya assets currently
-- return 404. They intentionally fall back to the Product image in the UI.

-- ---------------------------------------------------------------------------
-- 1) Correct Product identity/cache fields. UUIDs and canonical_release_id stay.
-- ---------------------------------------------------------------------------
update products set
  slug='dyipne-18717', canonical_item_number='95551', name='Dyipne',
  series='Racing Mini 4WD', chassis='FM-A', original_release_year=2019,
  rarity='Common',
  description='Jeepney-inspired Mini 4WD model on the front-motor FM-A chassis, with a bright red body and distinctive passenger-bus styling.',
  updated_at=now()
where id='6d6174e7-4040-5035-a3a4-cede97265d38';

update products set
  slug='aero-thunder-shot-18718', canonical_item_number='18702', name='Aero Thunder Shot',
  series='Aero', chassis='AR', original_release_year=2012,
  rarity='Common',
  description='Aerodynamic redesign of the classic Thunder Shot for the Mini 4WD REV generation, built around Tamiya''s AR chassis.',
  updated_at=now()
where id='07cc02e9-2626-5a60-92fb-2c2ed2402d7f';

update products set
  slug='mach-bullet-18091', canonical_item_number='18091', name='Mach-Bullet',
  series='Racing Mini 4WD', chassis='VS', original_release_year=2018,
  rarity='Common',
  description='Vintage racing-car-inspired Mini 4WD with a long bonnet, exposed-driver styling and Tamiya''s lightweight VS chassis.',
  updated_at=now()
where id='5b415a05-bc7c-589c-8b9c-3b3806479f6b';

-- ---------------------------------------------------------------------------
-- 2) Correct the three existing canonical Release rows in place.
-- ---------------------------------------------------------------------------
update product_releases set
  item_number='95551', release_type='Original', edition_type='original',
  edition_name='Dyipne (FM-A Chassis)', release_year=2019, release_date=null,
  chassis='FM-A', color='Red', discontinued=false, is_original=true,
  rarity='Common', data_source='tamiya_official', verification_status='verified',
  production_status='unknown', status_checked_at=null,
  notes='Original 2019 Dyipne occurrence. Tamiya''s current item 18717 page explicitly states it has the same contents as ITEM 95551 released in 2019; no exact 2019 day is inferred.',
  updated_at=now()
where id='8c923a15-a5e7-5e5c-ab8f-b2d1f722ac76';

update product_releases set
  item_number='18702', release_type='Original', edition_type='original',
  edition_name='Aero Thunder Shot (AR Chassis)', release_year=2012, release_date='2012-11-23',
  chassis='AR', color=null, discontinued=false, is_original=true,
  rarity='Common', data_source='tamiya_official', verification_status='verified',
  production_status='unknown', status_checked_at=null,
  notes='Canonical Aero Thunder Shot release, documented by Tamiya as Mini 4WD REV Series No.2.',
  updated_at=now()
where id='035abf4d-65da-5b0c-855d-9e611798c4e4';

update product_releases set
  item_number='18091', release_type='Original', edition_type='original',
  edition_name='Mach-Bullet (VS Chassis)', release_year=2018, release_date='2018-05-26',
  chassis='VS', color='Light Blue', discontinued=false, is_original=true,
  rarity='Common', data_source='tamiya_official', verification_status='verified',
  production_status='unknown', status_checked_at=null,
  notes='Official Tamiya Mach-Bullet release on the VS chassis.',
  updated_at=now()
where id='2a5e1b1b-07e8-57fa-a202-0b38982b168e';

-- ---------------------------------------------------------------------------
-- 3) Add documented sibling Releases under the corrected conceptual Products.
-- IDs derive from frozen TrackDash productSeedKey + releaseSeedKey, never item.
-- ---------------------------------------------------------------------------
insert into product_releases
  (id, product_id, item_number, release_type, edition_name, release_year, release_date,
   chassis, color, discontinued, is_original, rarity, data_source, edition_type,
   verification_status, production_status, notes)
values
  ('beb90479-df22-5667-bfe5-6517d3cfa351','6d6174e7-4040-5035-a3a4-cede97265d38','18717','Reissue','Dyipne (2025 Japan Reissue)',2025,'2025-08-30','FM-A','Red',false,false,'Common','tamiya_official','reissue','verified','unknown','Official Japanese-market reissue of Dyipne; Tamiya states it has the same contents as the 2019 ITEM 95551 release.'),
  ('8c08137b-cfc6-5c1d-8d1b-a151d53afc01','07cc02e9-2626-5a60-92fb-2c2ed2402d7f','94967','Japan Cup Edition','Aero Thunder Shot Japan Cup 2013 Limited (AR Chassis)',2013,'2013-07-06','AR','Royal Blue',true,false,'Rare','audited_mixed','japan_cup','verified','discontinued','Japan Cup 2013 commemorative Aero Thunder Shot. Official Tamiya retrospective confirms the edition; item/date/chassis are independently corroborated by historical catalog references.'),
  ('d0e6d2fc-3566-5004-a479-52f89253863b','07cc02e9-2626-5a60-92fb-2c2ed2402d7f','94990','Color Special','Aero Thunder Shot Silver Metallic Special (AR Chassis)',null,null,'AR','Silver Metallic',true,false,'Rare','trusted_secondary','color_special','partial','discontinued','Known limited Silver Metallic release. The historical official Tamiya item-scoped image is no longer available, so this release deliberately uses the Product fallback image instead of a third-party photo. Exact release date/year remain unset pending stronger primary evidence.'),
  ('e96a1769-9b91-55b8-84c4-697799d0b441','07cc02e9-2626-5a60-92fb-2c2ed2402d7f','95273','Limited Edition','Aero Thunder Shot Asia Challenge 2016 (AR Chassis)',2016,null,'AR','Red',true,false,'Rare','trusted_secondary','limited','partial','discontinued','Asia Challenge 2016 commemorative release. Tamiya''s historical item-scoped image currently returns 404, so the release deliberately uses the Product fallback image.'),
  ('324310d8-9c3d-5fa9-9d75-1202b43cfce7','07cc02e9-2626-5a60-92fb-2c2ed2402d7f','95286','Color Special','Aero Thunder Shot Black Special (AR Chassis)',2017,'2017-02-11','AR','Smoke',false,false,'Uncommon','tamiya_official','color_special','verified','unknown','Official Black Special with smoke ABS body and black/red color scheme.')
on conflict (id) do update set
  product_id=excluded.product_id,
  item_number=excluded.item_number,
  release_type=excluded.release_type,
  edition_name=excluded.edition_name,
  release_year=excluded.release_year,
  release_date=excluded.release_date,
  chassis=excluded.chassis,
  color=excluded.color,
  discontinued=excluded.discontinued,
  is_original=excluded.is_original,
  rarity=excluded.rarity,
  data_source=excluded.data_source,
  edition_type=excluded.edition_type,
  verification_status=excluded.verification_status,
  production_status=excluded.production_status,
  notes=excluded.notes,
  updated_at=now();

-- ---------------------------------------------------------------------------
-- 4) Provenance. Official manufacturer whenever available; trusted secondary
-- only where historical primary detail is unavailable. Idempotent stable IDs.
-- ---------------------------------------------------------------------------
insert into release_sources
  (id, release_id, source_type, source_url, verified_fields, checked_at, notes)
values
  ('ac6b358e-3fb6-5e60-a56e-5a6b0c991940','8c923a15-a5e7-5e5c-ab8f-b2d1f722ac76','official_manufacturer','https://www.tamiya.com/japan/products/18717/index.html',array['itemNumber','chassis','releaseYear','editionName','color'],'2026-09-07','Current Tamiya 18717 page explicitly states it has the same contents as ITEM 95551 Dyipne, released in 2019.'),
  ('c65adb6c-cb0f-501a-8d4a-5843da307f57','8c923a15-a5e7-5e5c-ab8f-b2d1f722ac76','trusted_secondary','https://www.rcjaz.co.uk/tamiya-95551-dyipne-fma-chassis-p-16393.html',array['itemNumber','chassis','editionName'],'2026-09-07','RCJaz independently corroborates item 95551 as Dyipne on FM-A.'),
  ('d5ccdcde-5b92-55ef-b75a-04e77a87d2e2','beb90479-df22-5667-bfe5-6517d3cfa351','official_manufacturer','https://www.tamiya.com/japan/products/18717/index.html',array['itemNumber','chassis','releaseYear','releaseDate','editionName','color'],'2026-09-07',null),

  ('08a6eff7-0cb4-587f-b814-03fac432f5ff','035abf4d-65da-5b0c-855d-9e611798c4e4','official_manufacturer','https://www.tamiya.com/japan/products/18702/index.html',array['itemNumber','chassis','releaseYear','releaseDate','editionName'],'2026-09-07',null),
  ('e6b20a56-a354-58f2-b664-04056ad510d9','8c08137b-cfc6-5c1d-8d1b-a151d53afc01','official_manufacturer','https://www.tamiya.com/japan/mini4wd/feature/2019/0612.html',array['releaseYear','editionName'],'2026-09-07','Official Tamiya Japan Cup retrospective identifies Aero Thunder Shot Japan Cup 2013 as the commemorative machine for that season.'),
  ('099e12cb-06e7-5173-80e5-05fb33db73fb','8c08137b-cfc6-5c1d-8d1b-a151d53afc01','trusted_secondary','https://mini-4wd.fandom.com/wiki/Aero_Thunder_Shot',array['itemNumber','chassis','releaseYear','releaseDate','editionName','color'],'2026-09-07','Secondary catalog corroboration for item/date/chassis/color.'),
  ('5cd7c9a6-337a-519a-8a8b-872da70742b0','d0e6d2fc-3566-5004-a479-52f89253863b','trusted_secondary','https://mini-4wd.fandom.com/wiki/Aero_Thunder_Shot',array['itemNumber','chassis','editionName','color'],'2026-09-07','Historical official image asset currently unavailable; exact year/date intentionally not asserted.'),
  ('2e7117a6-3349-5445-af73-b1cacc987519','e96a1769-9b91-55b8-84c4-697799d0b441','trusted_secondary','https://www.rcjaz.com.au/tamiya-95273-aero-thunder-shot-ar-chassis-commemorative-kit-p-90073792.html',array['itemNumber','chassis','releaseYear','editionName','color'],'2026-09-07','RCJaz corroborates the Asia Challenge 2016 identity, item and AR chassis.'),
  ('5f5edfe3-5c89-5586-94e4-2c11e66f712f','324310d8-9c3d-5fa9-9d75-1202b43cfce7','official_manufacturer','https://www.tamiya.com/japan/products/95286/index.html',array['itemNumber','chassis','releaseYear','releaseDate','editionName','color'],'2026-09-07',null),

  ('f68e1dd6-614a-5b42-96f7-83021d26216e','2a5e1b1b-07e8-57fa-a202-0b38982b168e','official_manufacturer','https://www.tamiya.com/japan/products/18091/index.html',array['itemNumber','chassis','releaseYear','releaseDate','editionName','color'],'2026-09-07',null)
on conflict (id) do update set
  release_id=excluded.release_id,
  source_type=excluded.source_type,
  source_url=excluded.source_url,
  verified_fields=excluded.verified_fields,
  checked_at=excluded.checked_at,
  notes=excluded.notes;

-- ---------------------------------------------------------------------------
-- 5) Product-level images. These are the main Catalog identity images/fallbacks.
-- ---------------------------------------------------------------------------
insert into product_images (id, product_id, url, position) values
  ('8d20d24b-ff89-5e47-bebf-d9d7fb2590f5','6d6174e7-4040-5035-a3a4-cede97265d38','https://www.tamiya.com/japan_contents/img/usr/item/9/95551/95551_1.jpg',0),
  ('07a1e017-c85b-58ed-a730-e7b34f7e603c','07cc02e9-2626-5a60-92fb-2c2ed2402d7f','https://www.tamiya.com/japan_contents/img/usr/item/1/18702/18702_1.jpg',0),
  ('72418ec6-0217-5bf8-8dc2-19fc849fc439','5b415a05-bc7c-589c-8b9c-3b3806479f6b','https://www.tamiya.com/japan_contents/img/usr/item/1/18091/18091_1.jpg',0)
on conflict (id) do update set
  product_id=excluded.product_id, url=excluded.url, position=excluded.position;

-- ---------------------------------------------------------------------------
-- 6) Exact release images ONLY where an attributable surviving official asset
-- was verified. 94990 and 95273 deliberately have no release_images row.
-- ---------------------------------------------------------------------------
insert into release_images (id, release_id, url, position) values
  ('011f4524-2201-5b7b-bdac-7fddf28fa396','8c923a15-a5e7-5e5c-ab8f-b2d1f722ac76','https://www.tamiya.com/japan_contents/img/usr/item/9/95551/95551_1.jpg',0),
  ('a7edb26a-31d0-5ab6-9e8a-33f1f08e66d0','beb90479-df22-5667-bfe5-6517d3cfa351','https://www.tamiya.com/japan_contents/img/usr/item/1/18717/18717_1.jpg',0),
  ('570a6529-8786-5727-ab42-fffc3e989b9d','035abf4d-65da-5b0c-855d-9e611798c4e4','https://www.tamiya.com/japan_contents/img/usr/item/1/18702/18702_1.jpg',0),
  ('380e387c-9d61-58f4-92c1-00e848dae837','8c08137b-cfc6-5c1d-8d1b-a151d53afc01','https://www.tamiya.com/japan_contents/img/usr/item/9/94967/94967_1.jpg',0),
  ('910ab61c-2106-5c3a-aa7e-a26d9b37b832','324310d8-9c3d-5fa9-9d75-1202b43cfce7','https://www.tamiya.com/japan_contents/img/usr/item/9/95286/95286_1.jpg',0),
  ('607290f6-5460-5d5d-b1f3-66c2b070c315','2a5e1b1b-07e8-57fa-a202-0b38982b168e','https://www.tamiya.com/japan_contents/img/usr/item/1/18091/18091_1.jpg',0)
on conflict (id) do update set
  release_id=excluded.release_id, url=excluded.url, position=excluded.position;
