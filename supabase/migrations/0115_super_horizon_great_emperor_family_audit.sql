-- Super Emperor / Horizon / Great Emperor family audit.
--
-- This migration is stacked after 0113-0114, which are already applied to the
-- Production database but temporarily live on PR #158 because of Vercel build quota.
--
-- Catalog rules:
-- - product/release identity is independent from market availability;
-- - complete Memorial Box kit occurrences are distinct production waves when
--   collectors can own the individual kit and catalog history maps it to the
--   original Item Number;
-- - exact day is NOT invented when secondary sources disagree;
-- - alternate bodies bundled in a primary Special Kit do not create standalone
--   Releases for the secondary body family;
-- - every buildable Release enters Market Method v4, but no Market Value is
--   manually written.

-- ---------------------------------------------------------------------------
-- Existing canonical rows: safe identifiers and corrections
-- ---------------------------------------------------------------------------

update public.product_releases
set
  barcode_jan = '4950344180288',
  notes = 'Original Dash-01 Super Emperor on Type 3 chassis. Official Tamiya history states the first release month was June 1990; exact day remains unset. Hobby Search corroborates JAN 4950344180288.',
  updated_at = now()
where id = 'c8bdd30e-625d-511e-b92c-d132044b16b4';

update public.product_releases
set
  barcode_jan = '4950344180301',
  notes = 'Original Dash-0 Horizon on Zero chassis. Official Tamiya history states the first release month was September 1990; exact day remains unset. Hobby Search corroborates JAN 4950344180301.',
  updated_at = now()
where id = 'a0b042ac-7e6c-57f4-98a2-bd92e8e39f39';

update public.product_releases
set
  barcode_jan = '4950344180738',
  notes = 'Official Dash-0 Horizon Premium on Super-II chassis, released 2012-06-30. Hobby Search corroborates JAN 4950344180738.',
  updated_at = now()
where id = 'f2dda5bd-a337-5f5a-b4ed-7d6288e16f22';

update public.product_releases
set
  barcode_jan = '4950344180363',
  notes = 'Original Dash-001 Great Emperor on Zero chassis. Official Tamiya product history and monthly archive place the first release in September 1991; exact day remains unset. Hobby Search corroborates JAN 4950344180363.',
  updated_at = now()
where id = '8c2ca80b-8a9d-5b7a-9325-aec13a0db9ba';

-- Existing catalog had this occurrence incorrectly in 2015.
update public.product_releases
set
  release_year = 2012,
  release_date = date '2012-07-07',
  barcode_jan = '4950344063895',
  notes = 'Great Emperor Premium on Super-II chassis. Official Tamiya page gives the exact 2012-07-07 release date; the previous TrackDash 2015 year was incorrect. Hobby Search corroborates JAN 4950344063895.',
  updated_at = now()
where id = '532f8e3a-f55f-5936-abcd-58e0f8538785';

-- ---------------------------------------------------------------------------
-- Super Emperor family
-- ---------------------------------------------------------------------------

-- 2005 Memorial Box Vol.3 occurrence. Secondary catalog sources disagree on the
-- exact late-August day, so TrackDash records the year only.
insert into public.product_releases (
  id, product_id, item_number, release_type, edition_name, release_year,
  release_date, chassis, barcode_jan, color, country_market, notes,
  discontinued, is_original, rarity, data_source, edition_type,
  verification_status, production_status, status_checked_at
) values (
  'd266df88-130e-4ecc-b200-ba305e76246e',
  '033769c0-a8d7-554a-8e3d-b4049d505241',
  '18028',
  'Reissue',
  'Dash-01 Super Emperor — 2005 Memorial Box Vol.3 Reissue',
  2005,
  null,
  'Type 3',
  null,
  null,
  'Japan',
  'Complete Super Emperor kit supplied inside Tamiya Racer Mini 4WD Memorial Box Vol.3 (parent ITEM 94555). MediaWorld and HLJ disagree on the exact late-August 2005 release day, so TrackDash records only the year. Independent Mini 4WD catalog history maps the included Super Emperor to ITEM 18028. Current official 18028 art is used only as a visual reference to the same Type-3 specification.',
  true,false,null,'audited_mixed','reissue','partial','discontinued',now()
)
on conflict (id) do update set
  item_number=excluded.item_number, release_type=excluded.release_type,
  edition_name=excluded.edition_name, release_year=excluded.release_year,
  release_date=excluded.release_date, chassis=excluded.chassis,
  barcode_jan=excluded.barcode_jan, country_market=excluded.country_market,
  notes=excluded.notes, discontinued=excluded.discontinued,
  data_source=excluded.data_source, edition_type=excluded.edition_type,
  verification_status=excluded.verification_status,
  production_status=excluded.production_status, status_checked_at=excluded.status_checked_at,
  updated_at=now();

-- Original 2008 Special Kit.
insert into public.product_releases (
  id, product_id, item_number, release_type, edition_name, release_year,
  release_date, chassis, barcode_jan, color, country_market, notes,
  discontinued, is_original, rarity, data_source, edition_type,
  verification_status, production_status, status_checked_at
) values (
  '960400ba-283b-4dad-9ddf-a19ee063b0e5',
  '033769c0-a8d7-554a-8e3d-b4049d505241',
  '94667',
  'Special Edition',
  'Dash-01 Super Emperor Special Kit (2008 Original)',
  2008,
  date '2008-08-30',
  'Type 3',
  '4950344946679',
  null,
  'Japan',
  'Original Special Kit pairing the Super Emperor body with the alternate Dancing Doll body on one reinforced Type 3 chassis. Tamiya identifies August 2008 as the initial wave; Suruga-ya documents ITEM 94667, JAN 4950344946679 and 2008-08-30.',
  true,false,null,'audited_mixed','special','verified','discontinued',now()
)
on conflict (id) do update set
  item_number=excluded.item_number, release_type=excluded.release_type,
  edition_name=excluded.edition_name, release_year=excluded.release_year,
  release_date=excluded.release_date, chassis=excluded.chassis,
  barcode_jan=excluded.barcode_jan, country_market=excluded.country_market,
  notes=excluded.notes, discontinued=excluded.discontinued,
  data_source=excluded.data_source, edition_type=excluded.edition_type,
  verification_status=excluded.verification_status,
  production_status=excluded.production_status, status_checked_at=excluded.status_checked_at,
  updated_at=now();

insert into public.product_releases (
  id, product_id, item_number, release_type, edition_name, release_year,
  release_date, chassis, barcode_jan, color, country_market, notes,
  discontinued, is_original, rarity, data_source, edition_type,
  verification_status, production_status, status_checked_at
) values (
  'd0f9a718-1499-4b1e-a28f-194402cfa7fe',
  '033769c0-a8d7-554a-8e3d-b4049d505241',
  '18632',
  'Chassis Variant',
  'Dash-01 Super Emperor (MS Chassis)',
  2009,
  date '2009-05-30',
  'MS',
  '4950344064335',
  null,
  null,
  'Official Tamiya MS-chassis redesign released 2009-05-30. Hobby Search corroborates JAN 4950344064335.',
  false,false,null,'tamiya_official','other','verified','unknown',now()
)
on conflict (id) do update set
  item_number=excluded.item_number, release_type=excluded.release_type,
  edition_name=excluded.edition_name, release_year=excluded.release_year,
  release_date=excluded.release_date, chassis=excluded.chassis,
  barcode_jan=excluded.barcode_jan, notes=excluded.notes,
  data_source=excluded.data_source, edition_type=excluded.edition_type,
  verification_status=excluded.verification_status,
  production_status=excluded.production_status, status_checked_at=excluded.status_checked_at,
  updated_at=now();

insert into public.product_releases (
  id, product_id, item_number, release_type, edition_name, release_year,
  release_date, chassis, barcode_jan, color, country_market, notes,
  discontinued, is_original, rarity, data_source, edition_type,
  verification_status, production_status, status_checked_at
) values (
  'af5b1aaa-cbff-4e15-9630-c2c51ced9a5c',
  '033769c0-a8d7-554a-8e3d-b4049d505241',
  '18070',
  'Premium',
  'Dash-01 Super Emperor Premium (Super-II Chassis)',
  2012,
  date '2012-04-14',
  'Super II',
  '4950344180707',
  null,
  null,
  'Official Super Emperor Premium on Super-II chassis, released 2012-04-14. Hobby Search corroborates JAN 4950344180707.',
  false,false,null,'tamiya_official','premium','verified','unknown',now()
)
on conflict (id) do update set
  item_number=excluded.item_number, release_type=excluded.release_type,
  edition_name=excluded.edition_name, release_year=excluded.release_year,
  release_date=excluded.release_date, chassis=excluded.chassis,
  barcode_jan=excluded.barcode_jan, notes=excluded.notes,
  data_source=excluded.data_source, edition_type=excluded.edition_type,
  verification_status=excluded.verification_status,
  production_status=excluded.production_status, status_checked_at=excluded.status_checked_at,
  updated_at=now();

insert into public.product_releases (
  id, product_id, item_number, release_type, edition_name, release_year,
  release_date, chassis, barcode_jan, color, country_market, notes,
  discontinued, is_original, rarity, data_source, edition_type,
  verification_status, production_status, status_checked_at
) values (
  '136791a2-b6a3-45c1-bcd1-41a32639700c',
  '033769c0-a8d7-554a-8e3d-b4049d505241',
  '95623',
  'Reissue',
  'Dash-01 Super Emperor Special Kit (2021 Reissue)',
  2021,
  date '2021-08-21',
  'Type 3',
  '4950344956234',
  null,
  null,
  '2021 reissue of the Super Emperor Special Kit, again including the alternate Dancing Doll body. Official Tamiya release date 2021-08-21; Hobby Search corroborates JAN 4950344956234. The alternate body is not a standalone Dancing Doll Release.',
  false,false,null,'tamiya_official','reissue','verified','unknown',now()
)
on conflict (id) do update set
  item_number=excluded.item_number, release_type=excluded.release_type,
  edition_name=excluded.edition_name, release_year=excluded.release_year,
  release_date=excluded.release_date, chassis=excluded.chassis,
  barcode_jan=excluded.barcode_jan, notes=excluded.notes,
  data_source=excluded.data_source, edition_type=excluded.edition_type,
  verification_status=excluded.verification_status,
  production_status=excluded.production_status, status_checked_at=excluded.status_checked_at,
  updated_at=now();

-- ---------------------------------------------------------------------------
-- Horizon family
-- ---------------------------------------------------------------------------

insert into public.product_releases (
  id, product_id, item_number, release_type, edition_name, release_year,
  release_date, chassis, barcode_jan, color, country_market, notes,
  discontinued, is_original, rarity, data_source, edition_type,
  verification_status, production_status, status_checked_at
) values (
  'bdba91b5-fc9d-46ec-8f24-e4d6fb77aeb7',
  '813a9ba0-170e-5636-9a9a-a7e7fca32366',
  '18030',
  'Reissue',
  'Dash-0 Horizon — 2005 Memorial Box Vol.3 Reissue',
  2005,
  null,
  'Zero',
  null,
  null,
  'Japan',
  'Complete Horizon kit supplied inside Tamiya Racer Mini 4WD Memorial Box Vol.3 (parent ITEM 94555). Secondary sources disagree on the exact late-August 2005 release day, so TrackDash records only the year. Independent Mini 4WD catalog history maps the included Horizon to ITEM 18030. Current official 18030 art is used only as a visual reference.',
  true,false,null,'audited_mixed','reissue','partial','discontinued',now()
)
on conflict (id) do update set
  item_number=excluded.item_number, release_type=excluded.release_type,
  edition_name=excluded.edition_name, release_year=excluded.release_year,
  release_date=excluded.release_date, chassis=excluded.chassis,
  notes=excluded.notes, data_source=excluded.data_source,
  edition_type=excluded.edition_type, verification_status=excluded.verification_status,
  production_status=excluded.production_status, status_checked_at=excluded.status_checked_at,
  updated_at=now();

insert into public.product_releases (
  id, product_id, item_number, release_type, edition_name, release_year,
  release_date, chassis, barcode_jan, color, country_market, notes,
  discontinued, is_original, rarity, data_source, edition_type,
  verification_status, production_status, status_checked_at
) values (
  '23c999fb-fa50-4072-9a8a-16fee6aea790',
  '813a9ba0-170e-5636-9a9a-a7e7fca32366',
  '94668',
  'Special Edition',
  'Dash-0 Horizon Special Kit (2008 Original)',
  2008,
  date '2008-09-27',
  'Zero',
  '4950344946686',
  null,
  'Japan',
  'Original Horizon Special Kit pairing the Horizon body with the alternate Cannonball body on one reinforced Zero chassis. Official Tamiya identifies September 2008 as the initial wave; Suruga-ya documents ITEM 94668, JAN 4950344946686 and 2008-09-27.',
  true,false,null,'audited_mixed','special','verified','discontinued',now()
)
on conflict (id) do update set
  item_number=excluded.item_number, release_type=excluded.release_type,
  edition_name=excluded.edition_name, release_year=excluded.release_year,
  release_date=excluded.release_date, chassis=excluded.chassis,
  barcode_jan=excluded.barcode_jan, notes=excluded.notes,
  data_source=excluded.data_source, edition_type=excluded.edition_type,
  verification_status=excluded.verification_status,
  production_status=excluded.production_status, status_checked_at=excluded.status_checked_at,
  updated_at=now();

insert into public.product_releases (
  id, product_id, item_number, release_type, edition_name, release_year,
  release_date, chassis, barcode_jan, color, country_market, notes,
  discontinued, is_original, rarity, data_source, edition_type,
  verification_status, production_status, status_checked_at
) values (
  'e0d95b5e-cb15-4d76-a331-50fe800eabe4',
  '813a9ba0-170e-5636-9a9a-a7e7fca32366',
  '95624',
  'Reissue',
  'Dash-0 Horizon Special Kit (2021 Reissue)',
  2021,
  date '2021-10-02',
  'Zero',
  '4950344956241',
  null,
  null,
  '2021 reissue of the Horizon Special Kit, again including the alternate Cannonball body. Official Tamiya release date 2021-10-02; Hobby Search corroborates JAN 4950344956241. The alternate body is not a standalone Cannonball Release.',
  false,false,null,'tamiya_official','reissue','verified','unknown',now()
)
on conflict (id) do update set
  item_number=excluded.item_number, release_type=excluded.release_type,
  edition_name=excluded.edition_name, release_year=excluded.release_year,
  release_date=excluded.release_date, chassis=excluded.chassis,
  barcode_jan=excluded.barcode_jan, notes=excluded.notes,
  data_source=excluded.data_source, edition_type=excluded.edition_type,
  verification_status=excluded.verification_status,
  production_status=excluded.production_status, status_checked_at=excluded.status_checked_at,
  updated_at=now();

-- ---------------------------------------------------------------------------
-- Great Emperor family
-- ---------------------------------------------------------------------------

insert into public.product_releases (
  id, product_id, item_number, release_type, edition_name, release_year,
  release_date, chassis, barcode_jan, color, country_market, notes,
  discontinued, is_original, rarity, data_source, edition_type,
  verification_status, production_status, status_checked_at
) values (
  '6b3d6115-5fc1-482d-875b-bca5081b637f',
  '203f8219-9d37-5a1a-aad6-9437c80a1ea8',
  '18036',
  'Reissue',
  'Dash-001 Great Emperor — 2005 Memorial Box Vol.3 Reissue',
  2005,
  null,
  'Zero',
  null,
  null,
  'Japan',
  'Complete Great Emperor kit supplied inside Tamiya Racer Mini 4WD Memorial Box Vol.3 (parent ITEM 94555). Secondary sources disagree on the exact late-August 2005 release day, so TrackDash records only the year. Independent Mini 4WD catalog history maps the included Great Emperor to ITEM 18036. Current official 18036 art is used only as a visual reference.',
  true,false,null,'audited_mixed','reissue','partial','discontinued',now()
)
on conflict (id) do update set
  item_number=excluded.item_number, release_type=excluded.release_type,
  edition_name=excluded.edition_name, release_year=excluded.release_year,
  release_date=excluded.release_date, chassis=excluded.chassis,
  notes=excluded.notes, data_source=excluded.data_source,
  edition_type=excluded.edition_type, verification_status=excluded.verification_status,
  production_status=excluded.production_status, status_checked_at=excluded.status_checked_at,
  updated_at=now();

insert into public.product_releases (
  id, product_id, item_number, release_type, edition_name, release_year,
  release_date, chassis, barcode_jan, color, country_market, notes,
  discontinued, is_original, rarity, data_source, edition_type,
  verification_status, production_status, status_checked_at
) values (
  'e37034ed-b092-440d-b082-13ef68c93eb0',
  '203f8219-9d37-5a1a-aad6-9437c80a1ea8',
  '94669',
  'Special Edition',
  'Dash-001 Great Emperor Special Kit (2008 Original)',
  2008,
  null,
  'Zero',
  '4950344946693',
  null,
  'Japan',
  'Original Great Emperor Special Kit pairing the Great Emperor body with the alternate Shooting Star body on one reinforced Zero chassis. Official Tamiya identifies September 2008 as the initial release month, while Suruga-ya lists 2008-08-30; TrackDash therefore keeps the exact day unset instead of choosing between conflicting records. JAN 4950344946693 is corroborated.',
  true,false,null,'audited_mixed','special','partial','discontinued',now()
)
on conflict (id) do update set
  item_number=excluded.item_number, release_type=excluded.release_type,
  edition_name=excluded.edition_name, release_year=excluded.release_year,
  release_date=excluded.release_date, chassis=excluded.chassis,
  barcode_jan=excluded.barcode_jan, notes=excluded.notes,
  data_source=excluded.data_source, edition_type=excluded.edition_type,
  verification_status=excluded.verification_status,
  production_status=excluded.production_status, status_checked_at=excluded.status_checked_at,
  updated_at=now();

insert into public.product_releases (
  id, product_id, item_number, release_type, edition_name, release_year,
  release_date, chassis, barcode_jan, color, country_market, notes,
  discontinued, is_original, rarity, data_source, edition_type,
  verification_status, production_status, status_checked_at
) values (
  '14177526-4c3e-49c1-a7d8-49f1e8d06348',
  '203f8219-9d37-5a1a-aad6-9437c80a1ea8',
  '95625',
  'Reissue',
  'Dash-001 Great Emperor Special Kit (2021 Reissue)',
  2021,
  date '2021-10-02',
  'Zero',
  '4950344956258',
  null,
  null,
  '2021 reissue of the Great Emperor Special Kit, again including the alternate Shooting Star body. Official Tamiya release date 2021-10-02; Hobby Search corroborates JAN 4950344956258. The alternate body is not a standalone Shooting Star Release.',
  false,false,null,'tamiya_official','reissue','verified','unknown',now()
)
on conflict (id) do update set
  item_number=excluded.item_number, release_type=excluded.release_type,
  edition_name=excluded.edition_name, release_year=excluded.release_year,
  release_date=excluded.release_date, chassis=excluded.chassis,
  barcode_jan=excluded.barcode_jan, notes=excluded.notes,
  data_source=excluded.data_source, edition_type=excluded.edition_type,
  verification_status=excluded.verification_status,
  production_status=excluded.production_status, status_checked_at=excluded.status_checked_at,
  updated_at=now();

-- ---------------------------------------------------------------------------
-- Images
-- ---------------------------------------------------------------------------

insert into public.release_images (id,release_id,url,position) values
('92da29f4-5077-5f06-b2a5-9cc59e3c3ab5','c8bdd30e-625d-511e-b92c-d132044b16b4','https://www.tamiya.com/japan_contents/img/usr/item/1/18028/18028_1.jpg',0),
('9aaa4ca2-fa6b-5ffa-abec-92d7b57f73e7','d266df88-130e-4ecc-b200-ba305e76246e','https://www.tamiya.com/japan_contents/img/usr/item/1/18028/18028_1.jpg',0),
('4a24e462-e259-5b42-b033-32e9559a8079','960400ba-283b-4dad-9ddf-a19ee063b0e5','https://www.tamiya.com/japan_contents/img/usr/item/9/94667/94667_1.jpg',0),
('bb8b5b08-5df8-5cd8-8310-5d02fadea8f2','d0f9a718-1499-4b1e-a28f-194402cfa7fe','https://www.tamiya.com/japan_contents/img/usr/item/1/18632/18632_1.jpg',0),
('980c0ff1-6a68-5755-8a60-93c5e665a1f0','af5b1aaa-cbff-4e15-9630-c2c51ced9a5c','https://www.tamiya.com/japan_contents/img/usr/item/1/18070/18070_1.jpg',0),
('9b93be3c-6f7e-5352-83c9-4e5f06340b06','136791a2-b6a3-45c1-bcd1-41a32639700c','https://www.tamiya.com/japan_contents/img/usr/item/9/95623/95623_1.jpg',0),

('57793517-6327-5915-85c1-4578ce1d5785','bdba91b5-fc9d-46ec-8f24-e4d6fb77aeb7','https://www.tamiya.com/japan_contents/img/usr/item/1/18030/18030_1.jpg',0),
('a4afb5ae-d0fc-52b1-bf60-b5e4d0a2b23e','23c999fb-fa50-4072-9a8a-16fee6aea790','https://www.tamiya.com/japan_contents/img/usr/item/9/94668/94668_1.jpg',0),
('abe8ca66-aa6c-54cf-aa89-34288790d495','e0d95b5e-cb15-4d76-a331-50fe800eabe4','https://www.tamiya.com/japan_contents/img/usr/item/9/95624/95624_1.jpg',0),

('09484f5e-c290-5146-bfa3-06ea4ccec6b5','6b3d6115-5fc1-482d-875b-bca5081b637f','https://www.tamiya.com/japan_contents/img/usr/item/1/18036/18036_1.jpg',0),
('fd494e96-5dd3-5fde-9012-93c52ed3faca','e37034ed-b092-440d-b082-13ef68c93eb0','https://www.tamiya.com/japan_contents/img/usr/item/9/94669/94669_1.jpg',0),
('59692aee-e5de-53fa-9aaa-ada4d99ba483','14177526-4c3e-49c1-a7d8-49f1e8d06348','https://www.tamiya.com/japan_contents/img/usr/item/9/95625/95625_1.jpg',0)
on conflict (id) do update set
  release_id=excluded.release_id,url=excluded.url,position=excluded.position;

-- ---------------------------------------------------------------------------
-- Provenance
-- ---------------------------------------------------------------------------

insert into public.release_sources (id,release_id,source_type,source_url,verified_fields,checked_at,notes) values
('e936a344-20dd-5c63-8fed-fa9cbf8feb33','c8bdd30e-625d-511e-b92c-d132044b16b4','official_manufacturer','https://www.tamiya.com/japan/products/18028/index.html',array['itemNumber','releaseYear','chassis','editionName'],date '2026-09-19','Official Tamiya: ITEM 18028, Type 3, first release month June 1990.'),
('98f1b806-acef-5e7d-a1b6-671dbc6cccbd','c8bdd30e-625d-511e-b92c-d132044b16b4','trusted_secondary','https://www.1999.co.jp/10087293',array['barcodeJAN'],date '2026-09-19','Hobby Search corroborates JAN 4950344180288.'),

('b26bc3f2-275b-5202-b1ba-6a1ad2f32c85','d266df88-130e-4ecc-b200-ba305e76246e','trusted_secondary','https://mediaworld.co.jp/products/50050723001',array['releaseYear','editionName'],date '2026-09-19','MediaWorld documents ITEM 94555 Memorial Box Vol.3, its five included machines and a 2005 release. Exact day conflicts with HLJ, so not promoted.'),
('21442ffb-d0bf-526f-8e65-8dd8d4ebce72','d266df88-130e-4ecc-b200-ba305e76246e','trusted_secondary','https://streetmini4wd.altervista.org/php5/index.php?title=Storia_delle_Mini4wD',array['itemNumber','editionName'],date '2026-09-19','Independent catalog history maps the Memorial Box Vol.3 Super Emperor component to original ITEM 18028.'),

('ed71e7c6-2a57-582c-9d03-76cb010f85df','960400ba-283b-4dad-9ddf-a19ee063b0e5','trusted_secondary','https://www.suruga-ya.jp/kaitori/kaitori_detail/603019737',array['itemNumber','releaseDate','barcodeJAN','editionName','chassis'],date '2026-09-19','Suruga-ya documents ITEM 94667, 2008-08-30 and JAN 4950344946679.'),
('8b025453-4776-576c-86d7-a3b3630c9c88','d0f9a718-1499-4b1e-a28f-194402cfa7fe','official_manufacturer','https://www.tamiya.com/japan/products/18632/index.html',array['itemNumber','releaseDate','releaseYear','chassis','editionName'],date '2026-09-19','Official Tamiya documents ITEM 18632 and 2009-05-30.'),
('a5f131dd-40a6-5a23-a6c0-1aac7323cc00','d0f9a718-1499-4b1e-a28f-194402cfa7fe','trusted_secondary','https://www.1999.co.jp/10088064',array['barcodeJAN'],date '2026-09-19','Hobby Search corroborates JAN 4950344064335.'),
('cb7d6017-55e6-5752-be09-b0dc90438ad3','af5b1aaa-cbff-4e15-9630-c2c51ced9a5c','official_manufacturer','https://www.tamiya.com/japan/products/18070/index.html',array['itemNumber','releaseDate','releaseYear','chassis','editionName'],date '2026-09-19','Official Tamiya documents ITEM 18070 and 2012-04-14.'),
('b7a45a9a-f3d0-5777-be5a-468eeab35c96','af5b1aaa-cbff-4e15-9630-c2c51ced9a5c','trusted_secondary','https://www.1999.co.jp/10179164',array['barcodeJAN'],date '2026-09-19','Hobby Search corroborates JAN 4950344180707.'),
('b8cfa912-9acc-501d-85bb-55d066da153e','136791a2-b6a3-45c1-bcd1-41a32639700c','official_manufacturer','https://www.tamiya.com/japan/products/95623/index.html',array['itemNumber','releaseDate','releaseYear','chassis','editionName'],date '2026-09-19','Official Tamiya documents 2021-08-21 and identifies 94667 as the 2008 initial Special Kit.'),
('89da3811-2e5f-5521-bd69-39516336faf2','136791a2-b6a3-45c1-bcd1-41a32639700c','trusted_secondary','https://www.1999.co.jp/10778418',array['barcodeJAN'],date '2026-09-19','Hobby Search corroborates JAN 4950344956234.'),

('2a3f6c8c-27ec-5218-b6a4-1093fcf6495c','a0b042ac-7e6c-57f4-98a2-bd92e8e39f39','official_manufacturer','https://www.tamiya.com/japan/products/18030/index.html',array['itemNumber','releaseYear','chassis','editionName'],date '2026-09-19','Official Tamiya: ITEM 18030, Zero chassis, first release month September 1990.'),
('7d4212f3-6518-542d-b266-772d1fba506a','a0b042ac-7e6c-57f4-98a2-bd92e8e39f39','trusted_secondary','https://www.1999.co.jp/10087297',array['barcodeJAN'],date '2026-09-19','Hobby Search corroborates JAN 4950344180301.'),
('1ef6657d-7356-5fe1-a384-246d280d0c1b','bdba91b5-fc9d-46ec-8f24-e4d6fb77aeb7','trusted_secondary','https://mediaworld.co.jp/products/50050723001',array['releaseYear','editionName'],date '2026-09-19','MediaWorld documents Horizon inside ITEM 94555 Memorial Box Vol.3. Exact date is not promoted because another catalog differs.'),
('d6cfb1e5-fb16-5e17-bc32-db5211c91c04','bdba91b5-fc9d-46ec-8f24-e4d6fb77aeb7','trusted_secondary','https://streetmini4wd.altervista.org/php5/index.php?title=Storia_delle_Mini4wD',array['itemNumber','editionName'],date '2026-09-19','Independent catalog history maps the Memorial Box Vol.3 Horizon component to ITEM 18030.'),
('61b47e79-5ecd-5d2a-805c-9a862191852d','f2dda5bd-a337-5f5a-b4ed-7d6288e16f22','trusted_secondary','https://www.1999.co.jp/10183434',array['barcodeJAN'],date '2026-09-19','Hobby Search corroborates JAN 4950344180738.'),
('b3e5a067-cae7-5b71-9124-84977139caa5','23c999fb-fa50-4072-9a8a-16fee6aea790','trusted_secondary','https://www.suruga-ya.jp/kaitori/kaitori_detail/603019738',array['itemNumber','releaseDate','barcodeJAN','editionName','chassis'],date '2026-09-19','Suruga-ya documents ITEM 94668, 2008-09-27 and JAN 4950344946686.'),
('0735f436-5f80-57dd-82f7-15184ba4136c','e0d95b5e-cb15-4d76-a331-50fe800eabe4','official_manufacturer','https://www.tamiya.com/japan/products/95624/index.html',array['itemNumber','releaseDate','releaseYear','chassis','editionName'],date '2026-09-19','Official Tamiya documents 2021-10-02 and identifies 94668 as the 2008 initial Special Kit.'),
('434ea8e6-8ed0-5c51-8277-48fc3e1fb613','e0d95b5e-cb15-4d76-a331-50fe800eabe4','trusted_secondary','https://www.1999.co.jp/10778419',array['barcodeJAN'],date '2026-09-19','Hobby Search corroborates JAN 4950344956241.'),

('bc6b7462-df9f-5164-b0f2-a2f8b2fed66b','8c2ca80b-8a9d-5b7a-9325-aec13a0db9ba','official_manufacturer','https://www.tamiya.com/japan/products/18036/index.html',array['itemNumber','releaseYear','chassis','editionName'],date '2026-09-19','Official Tamiya identifies ITEM 18036 Great Emperor on Zero chassis; historical archive places the wave in 1991.'),
('f9f0ea62-dd90-5929-9b6a-4ce20bfddb25','8c2ca80b-8a9d-5b7a-9325-aec13a0db9ba','trusted_secondary','https://www.1999.co.jp/10087310',array['barcodeJAN'],date '2026-09-19','Hobby Search corroborates JAN 4950344180363.'),
('30c5a8ad-8878-52fa-a300-20b4b5fca7b5','6b3d6115-5fc1-482d-875b-bca5081b637f','trusted_secondary','https://mediaworld.co.jp/products/50050723001',array['releaseYear','editionName'],date '2026-09-19','MediaWorld documents Great Emperor inside ITEM 94555 Memorial Box Vol.3. Exact date is not promoted because another catalog differs.'),
('0242f931-5743-5158-88ef-e82965afdb74','6b3d6115-5fc1-482d-875b-bca5081b637f','trusted_secondary','https://streetmini4wd.altervista.org/php5/index.php?title=Storia_delle_Mini4wD',array['itemNumber','editionName'],date '2026-09-19','Independent catalog history maps the Memorial Box Vol.3 Great Emperor component to ITEM 18036.'),
('731a1995-8b66-5b6c-bd03-2ec1d7c2a55a','532f8e3a-f55f-5936-abcd-58e0f8538785','official_manufacturer','https://www.tamiya.com/japan/products/18075/index.html',array['itemNumber','releaseDate','releaseYear','chassis','editionName'],date '2026-09-19','Official Tamiya documents Great Emperor Premium release 2012-07-07, correcting the prior TrackDash 2015 year.'),
('9a32aa7e-5df0-505f-866e-e12ad7fbeaa1','532f8e3a-f55f-5936-abcd-58e0f8538785','trusted_secondary','https://www.1999.co.jp/10183458',array['barcodeJAN'],date '2026-09-19','Hobby Search corroborates JAN 4950344063895.'),
('ddf1cd79-8481-5e8e-bf57-d877147fe3a1','e37034ed-b092-440d-b082-13ef68c93eb0','trusted_secondary','https://www.suruga-ya.jp/kaitori/kaitori_detail/603019739',array['itemNumber','barcodeJAN','editionName','chassis'],date '2026-09-19','Suruga-ya corroborates ITEM 94669 and JAN 4950344946693; its exact day conflicts with Tamiya initial release month and is therefore not promoted.'),
('93579a6e-d4c4-5751-9fe7-de50a74ce7ac','14177526-4c3e-49c1-a7d8-49f1e8d06348','official_manufacturer','https://www.tamiya.com/japan/products/95625/index.html',array['itemNumber','releaseDate','releaseYear','chassis','editionName'],date '2026-09-19','Official Tamiya documents 2021-10-02 and identifies 94669 as the 2008 initial Special Kit.'),
('54bd2039-40a5-5b08-9eeb-4e7c2bb11c59','14177526-4c3e-49c1-a7d8-49f1e8d06348','trusted_secondary','https://www.1999.co.jp/10778421',array['barcodeJAN'],date '2026-09-19','Hobby Search corroborates JAN 4950344956258.')
on conflict (id) do update set
  release_id=excluded.release_id,source_type=excluded.source_type,
  source_url=excluded.source_url,verified_fields=excluded.verified_fields,
  checked_at=excluded.checked_at,notes=excluded.notes;

-- ---------------------------------------------------------------------------
-- Market Method v4 auto-enrollment
-- ---------------------------------------------------------------------------

-- Insert all known buildable occurrences only after Memorial Box rows exist.
-- This guarantees 18028/18030/18036 are recognized as reused Item Numbers and
-- unattended eBay Active is parked for BOTH the original and the 2005 wave.
insert into public.market_release_signals (
  release_id,condition,market_regime,market_value_eur,low_eur,high_eur,
  confidence_score,confidence_label,retail_anchor_eur,active_anchor_eur,
  sold_anchor_eur,retail_source_count,active_offer_count,current_offer_count,
  sold_units,sold_source_count,sold_evidence_count,shipping_known_ratio,
  algorithm_version,market_method_version,computed_at
)
select
  pr.id,'new_complete_unbuilt','insufficient',
  null,null,null,0,'low',null,null,null,0,0,0,0,0,0,0,'r3','v4',now()
from public.product_releases pr
where pr.id in (
  'c8bdd30e-625d-511e-b92c-d132044b16b4',
  'd266df88-130e-4ecc-b200-ba305e76246e',
  '960400ba-283b-4dad-9ddf-a19ee063b0e5',
  'd0f9a718-1499-4b1e-a28f-194402cfa7fe',
  'af5b1aaa-cbff-4e15-9630-c2c51ced9a5c',
  '136791a2-b6a3-45c1-bcd1-41a32639700c',

  'a0b042ac-7e6c-57f4-98a2-bd92e8e39f39',
  'bdba91b5-fc9d-46ec-8f24-e4d6fb77aeb7',
  '23c999fb-fa50-4072-9a8a-16fee6aea790',
  'f2dda5bd-a337-5f5a-b4ed-7d6288e16f22',
  'e0d95b5e-cb15-4d76-a331-50fe800eabe4',

  '8c2ca80b-8a9d-5b7a-9325-aec13a0db9ba',
  '6b3d6115-5fc1-482d-875b-bca5081b637f',
  'e37034ed-b092-440d-b082-13ef68c93eb0',
  '532f8e3a-f55f-5936-abcd-58e0f8538785',
  '14177526-4c3e-49c1-a7d8-49f1e8d06348'
)
on conflict (release_id,condition) do nothing;
