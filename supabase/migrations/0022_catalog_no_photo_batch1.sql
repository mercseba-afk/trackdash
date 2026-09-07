-- Catalog no-photo batch 1 (2026-09-07)
-- Corrects eight evidence-backed Product/Release identities that previously had
-- no Product-level image, adds three officially documented releases, and adds
-- Product/exact Release images without changing any existing Product/Release UUID.
--
-- Deliberately NOT included here: Aero Avante Japan Cup 2013, Emperor (Premium
-- Black Special), Sword Flash. Their Product identity itself is still under audit.

-- ---------------------------------------------------------------------------
-- 1) Product compatibility/cache fields follow the corrected canonical release.
-- ---------------------------------------------------------------------------
update products set canonical_item_number='18033', name='Astute Jr.', chassis='Zero', original_release_year=1991, updated_at=now()
where id='be48e786-11c6-567f-b063-8026957bb403';
update products set canonical_item_number='18715', name='Copperfang', chassis='FM-A', original_release_year=2019, updated_at=now()
where id='e2f47ba4-03f1-5adb-8252-471c76729292';
update products set canonical_item_number='18030', name='Dash-0 Horizon', chassis='Zero', original_release_year=1990, updated_at=now()
where id='813a9ba0-170e-5636-9a9a-a7e7fca32366';
update products set canonical_item_number='18022', name='Dash-4 Cannonball', chassis='Type 3', original_release_year=1990, updated_at=now()
where id='d2c3e3d8-050d-5b9b-932f-023f2ee7dce2';
update products set canonical_item_number='18011', name='Fire Dragon Jr.', chassis='Type 1', original_release_year=1988, updated_at=now()
where id='65c7f3e3-ebfc-55a6-8855-c0c495164b72';
update products set canonical_item_number='18035', name='Manta Ray Jr.', chassis='Zero', original_release_year=1991, updated_at=now()
where id='0b2e1cf8-6c19-5342-89ef-6a53b3f51af3';
update products set canonical_item_number='18056', name='Mad Bull Jr.', chassis='Super TZ-X', original_release_year=2003, updated_at=now()
where id='643f208f-c8f6-5574-b9cf-565e28602d17';
update products set canonical_item_number='18009', name='Thunder Shot Jr.', chassis='Type 1', original_release_year=1988, updated_at=now()
where id='059b5b3f-9ee9-5932-b39f-879642b9414c';

-- ---------------------------------------------------------------------------
-- 2) Correct existing Release rows. Existing UUIDs remain immutable.
-- ---------------------------------------------------------------------------
update product_releases set item_number='18033', edition_name='Astute Jr.', release_year=1991, release_date=null, chassis='Zero', verification_status='verified', notes='Official Tamiya identity is Astute Jr., item 18033, on the Zero chassis. Exact historical day intentionally left unset.', updated_at=now()
where id='3d1c1580-c921-530f-9aaf-7ca5ff77e86c';
update product_releases set item_number='18077', release_type='Reissue', edition_type='reissue', edition_name='Astute RS (Super-II Chassis)', release_year=2013, release_date='2013-02-09', chassis='Super II', verification_status='verified', notes='Existing legacy reissue slot corrected to documented Astute RS.', updated_at=now()
where id='96deae1d-dfec-5aaf-a247-835386533002';

update product_releases set item_number='18715', edition_name='Copperfang (FM-A Chassis)', release_year=2019, release_date='2019-02-09', chassis='FM-A', verification_status='verified', updated_at=now()
where id='9058782c-0e3c-5a3d-9f9c-391365d3e81e';

update product_releases set item_number='18030', edition_name='Dash-0 Horizon', release_year=1990, release_date=null, chassis='Zero', verification_status='verified', notes='Official Tamiya identity corrected to Dash-0 Horizon, item 18030, Zero chassis. Exact historical day intentionally left unset.', updated_at=now()
where id='a0b042ac-7e6c-57f4-98a2-bd92e8e39f39';

update product_releases set item_number='18022', edition_name='Dash-4 Cannonball', release_year=1990, release_date=null, chassis='Type 3', verification_status='verified', notes='Official Tamiya identity corrected; exact historical day intentionally left unset.', updated_at=now()
where id='c63b8f4a-43f3-597b-82e5-f0e45bb45b7a';

update product_releases set item_number='18011', edition_name='Fire Dragon Jr.', release_year=1988, release_date=null, chassis='Type 1', verification_status='verified', notes='Original identity corrected to Fire Dragon Jr., item 18011, Type 1. Current official product asset is Product fallback only, not archival exact-image proof of the 1988 occurrence.', updated_at=now()
where id='0e24ff2a-70e6-5909-b28d-67400a365c92';
update product_releases set item_number='18072', release_type='Premium', edition_type='premium', edition_name='Fire Dragon Premium (VS Chassis)', release_year=2012, release_date='2012-07-07', chassis='VS', verification_status='verified', updated_at=now()
where id='daf1d532-80b5-524f-896e-fb577dae2445';

update product_releases set item_number='18035', edition_name='Manta Ray Jr.', release_year=1991, release_date=null, chassis='Zero', verification_status='verified', notes='Original identity corrected to item 18035 / Zero chassis. Product image is fallback; no unsupported exact historical asset claim.', updated_at=now()
where id='b86d459a-bd44-5c68-b104-9ca4cedaf413';
update product_releases set item_number='18053', release_type='Chassis Variant', edition_type='reissue', edition_name='Manta Ray Jr. (VS Chassis)', release_year=2003, release_date='2003-02-20', chassis='VS', verification_status='verified', updated_at=now()
where id='5277616b-91d3-5f0c-b893-d77778beaf95';

update product_releases set item_number='18056', edition_name='Mad Bull Jr.', release_year=2003, release_date=null, chassis='Super TZ-X', verification_status='verified', notes='Official page states the model was first released in 2003 and uses Super TZ-X. Current 2013 asset remains Product fallback for the historical original.', updated_at=now()
where id='454a8d07-e963-5699-9a8c-2151917f75a5';
update product_releases set item_number='18056', release_type='Reissue', edition_type='reissue', edition_name='Mad Bull Jr. (2013 Reissue)', release_year=2013, release_date='2013-11-02', chassis='Super TZ-X', verification_status='verified', updated_at=now()
where id='eb3b81bb-3a11-56af-a0cf-b625a1501434';

update product_releases set item_number='18009', edition_name='Thunder Shot Jr.', release_year=1988, release_date=null, chassis='Type 1', verification_status='verified', updated_at=now()
where id='dcaa9d00-fe3f-5bc4-9bfa-5bc1078e2087';
update product_releases set item_number='18013', release_type='Color Special', edition_type='color_special', edition_name='Thunder Shot Jr. Black Special', release_year=1988, release_date=null, chassis='Type 1', color='Black', verification_status='verified', notes='Legacy 2015 Premium slot corrected to documented 1988 Black Special; exact day intentionally left unset.', updated_at=now()
where id='f4e3f6b8-8ce6-5b87-9d94-5f64a24c031a';

-- ---------------------------------------------------------------------------
-- 3) Add three missing, officially documented Releases. IDs derive from the
-- frozen TrackDash productSeedKey + next releaseSeedKey, never item number.
-- ---------------------------------------------------------------------------
insert into product_releases (id, product_id, item_number, release_type, edition_name, release_year, release_date, chassis, color, discontinued, is_original, rarity, data_source, edition_type, verification_status, production_status)
values
('2ef185b6-0b2a-5208-a8c6-582d6b4d9c58','e2f47ba4-03f1-5adb-8252-471c76729292','95589','Color Special','Copperfang Black Special (FM-A Chassis)',2020,'2020-11-14','FM-A','Black',false,false,'Uncommon','tamiya_official','color_special','verified','unknown'),
('f2dda5bd-a337-5f5a-b4ed-7d6288e16f22','813a9ba0-170e-5636-9a9a-a7e7fca32366','18073','Premium','Dash-0 Horizon Premium (Super-II Chassis)',2012,'2012-06-30','Super II',null,false,false,'Uncommon','tamiya_official','premium','verified','unknown'),
('7e6cd351-658c-5558-bff9-3a1ea608e6d4','d2c3e3d8-050d-5b9b-932f-023f2ee7dce2','95225','Premium','Dash-4 Cannonball Premium (Super-II Chassis)',2015,'2015-11-14','Super II',null,false,false,'Uncommon','tamiya_official','premium','verified','unknown')
on conflict (id) do update set
  product_id=excluded.product_id, item_number=excluded.item_number, release_type=excluded.release_type,
  edition_name=excluded.edition_name, release_year=excluded.release_year, release_date=excluded.release_date,
  chassis=excluded.chassis, color=excluded.color, rarity=excluded.rarity, data_source=excluded.data_source,
  edition_type=excluded.edition_type, verification_status=excluded.verification_status,
  production_status=excluded.production_status, updated_at=now();

-- ---------------------------------------------------------------------------
-- 4) Official release provenance. One stable row per audited official page.
-- ---------------------------------------------------------------------------
insert into release_sources (id, release_id, source_type, source_url, verified_fields, checked_at, notes) values
('3b8fc360-beb1-57b4-83f0-a86f4702f302','3d1c1580-c921-530f-9aaf-7ca5ff77e86c','official_manufacturer','https://www.tamiya.com/japan/products/18033/index.html',array['itemNumber','chassis','editionName'],'2026-09-07',null),
('b7c1dc0e-0694-52be-b18c-6c776509b620','96deae1d-dfec-5aaf-a247-835386533002','official_manufacturer','https://www.tamiya.com/japan/products/18077/index.html',array['itemNumber','chassis','releaseDate','releaseYear','editionName'],'2026-09-07',null),
('bef0a955-a5a2-5183-bb04-4effd4fec126','9058782c-0e3c-5a3d-9f9c-391365d3e81e','official_manufacturer','https://www.tamiya.com/japan/products/18715/index.html',array['itemNumber','chassis','releaseDate','releaseYear','editionName'],'2026-09-07',null),
('bb5a3bb9-2217-5838-86f1-268b951f9064','2ef185b6-0b2a-5208-a8c6-582d6b4d9c58','official_manufacturer','https://www.tamiya.com/japan/products/95589/index.html',array['itemNumber','chassis','releaseDate','releaseYear','editionName','color'],'2026-09-07',null),
('d0c4acdc-1917-5bbf-a994-abbc57aa9212','a0b042ac-7e6c-57f4-98a2-bd92e8e39f39','official_manufacturer','https://www.tamiya.com/japan/products/18030/index.html',array['itemNumber','chassis','editionName'],'2026-09-07',null),
('fc6a0e1c-d4a5-5e1c-b9b1-05134900c758','f2dda5bd-a337-5f5a-b4ed-7d6288e16f22','official_manufacturer','https://www.tamiya.com/japan/products/18073/index.html',array['itemNumber','chassis','releaseDate','releaseYear','editionName'],'2026-09-07',null),
('af336f72-22b4-5155-a248-77ab9c71ac95','c63b8f4a-43f3-597b-82e5-f0e45bb45b7a','official_manufacturer','https://www.tamiya.com/japan/products/18022/index.html',array['itemNumber','chassis','editionName'],'2026-09-07',null),
('351cf87f-1422-57c1-977d-14e4c23e67a0','7e6cd351-658c-5558-bff9-3a1ea608e6d4','official_manufacturer','https://www.tamiya.com/japan/products/95225/index.html',array['itemNumber','chassis','releaseDate','releaseYear','editionName'],'2026-09-07',null),
('4c89b033-c7ac-55e6-b9a3-288f52253352','0e24ff2a-70e6-5909-b28d-67400a365c92','official_manufacturer','https://www.tamiya.com/japan/products/18011/index.html',array['itemNumber','chassis','editionName'],'2026-09-07',null),
('1837a66c-58a3-5d6b-acd6-1c3431d43cec','daf1d532-80b5-524f-896e-fb577dae2445','official_manufacturer','https://www.tamiya.com/japan/products/18072/index.html',array['itemNumber','chassis','releaseDate','releaseYear','editionName'],'2026-09-07',null),
('2b8b947d-8abb-56d9-971a-c6d85d50909e','b86d459a-bd44-5c68-b104-9ca4cedaf413','official_manufacturer','https://www.tamiya.com/japan/products/18035/index.html',array['itemNumber','editionName'],'2026-09-07',null),
('55682d09-f41c-5579-84e6-ad645681388d','5277616b-91d3-5f0c-b893-d77778beaf95','official_manufacturer','https://www.tamiya.com/japan/products/18053/index.html',array['itemNumber','chassis','editionName'],'2026-09-07',null),
('6cdfe0e6-05a3-5721-bb26-e7b347924fb0','454a8d07-e963-5699-9a8c-2151917f75a5','official_manufacturer','https://www.tamiya.com/japan/products/18056/index.html',array['itemNumber','chassis','editionName'],'2026-09-07','Current page documents the 2013 re-release and explicitly states first release in 2003.'),
('5ba96eab-072a-504d-ae96-4a8d11c9c749','eb3b81bb-3a11-56af-a0cf-b625a1501434','official_manufacturer','https://www.tamiya.com/japan/products/18056/index.html',array['itemNumber','chassis','releaseDate','releaseYear','editionName'],'2026-09-07',null),
('c5976118-d051-5a9a-a86d-fbfd0cb7137a','dcaa9d00-fe3f-5bc4-9bfa-5bc1078e2087','official_manufacturer','https://www.tamiya.com/japan/products/18009/index.html',array['itemNumber','chassis','editionName'],'2026-09-07',null),
('8fab8cff-2fdc-596c-8ed9-769dce8fe124','f4e3f6b8-8ce6-5b87-9d94-5f64a24c031a','official_manufacturer','https://www.tamiya.com/japan/products/18013/index.html',array['itemNumber','editionName','color'],'2026-09-07',null)
on conflict (id) do update set release_id=excluded.release_id, source_type=excluded.source_type,
source_url=excluded.source_url, verified_fields=excluded.verified_fields, checked_at=excluded.checked_at, notes=excluded.notes;

-- ---------------------------------------------------------------------------
-- 5) Product-level main images — exactly one seeded position-0 image each.
-- ---------------------------------------------------------------------------
insert into product_images (id, product_id, url, position) values
('f6f970a4-c695-56cc-97d7-b3f210b04d87','be48e786-11c6-567f-b063-8026957bb403','https://www.tamiya.com/japan_contents/img/usr/item/1/18033/18033_1.jpg',0),
('cfed4f08-4af5-5804-b872-d763a70ea5d2','e2f47ba4-03f1-5adb-8252-471c76729292','https://www.tamiya.com/japan_contents/img/usr/item/1/18715/18715_1.jpg',0),
('204bad37-462e-5e08-8cab-f82575ae862d','813a9ba0-170e-5636-9a9a-a7e7fca32366','https://www.tamiya.com/japan_contents/img/usr/item/1/18030/18030_1.jpg',0),
('f154972c-c57b-5861-aa44-df9e9306c84d','d2c3e3d8-050d-5b9b-932f-023f2ee7dce2','https://www.tamiya.com/japan_contents/img/usr/item/1/18022/18022_1.jpg',0),
('a6677044-4e21-5ac2-8205-4034d076ecbe','65c7f3e3-ebfc-55a6-8855-c0c495164b72','https://www.tamiya.com/japan_contents/img/usr/item/1/18011/18011_1.jpg',0),
('3047606c-0dbf-5484-92cd-fcee7a599801','0b2e1cf8-6c19-5342-89ef-6a53b3f51af3','https://www.tamiya.com/japan_contents/img/usr/item/1/18035/18035_1.jpg',0),
('c1a47472-638a-5a40-873b-a15f7df36c53','643f208f-c8f6-5574-b9cf-565e28602d17','https://www.tamiya.com/japan_contents/img/usr/item/1/18056/18056_1.jpg',0),
('dae546d2-3e9a-55e4-ab8f-f6f01f7d917e','059b5b3f-9ee9-5932-b39f-879642b9414c','https://www.tamiya.com/japan_contents/img/usr/item/1/18009/18009_1.jpg',0)
on conflict (id) do update set product_id=excluded.product_id, url=excluded.url, position=excluded.position;

-- ---------------------------------------------------------------------------
-- 6) Exact Release images. Historical originals without attributable archival
-- assets are intentionally omitted and resolve via Product fallback.
-- ---------------------------------------------------------------------------
insert into release_images (id, release_id, url, position) values
('e96c8661-4e9c-5796-8e33-40037409d67a','96deae1d-dfec-5aaf-a247-835386533002','https://www.tamiya.com/japan_contents/img/usr/item/1/18077/18077_1.jpg',0),
('14b444c3-1310-5c3e-a9b6-4cc84f64b2d6','9058782c-0e3c-5a3d-9f9c-391365d3e81e','https://www.tamiya.com/japan_contents/img/usr/item/1/18715/18715_1.jpg',0),
('2888765a-2306-52aa-9ed6-79d8a07f6d75','2ef185b6-0b2a-5208-a8c6-582d6b4d9c58','https://www.tamiya.com/japan_contents/img/usr/item/9/95589/95589_1.jpg',0),
('3b0a28fb-6862-51ac-8f2b-f25b078ea6de','a0b042ac-7e6c-57f4-98a2-bd92e8e39f39','https://www.tamiya.com/japan_contents/img/usr/item/1/18030/18030_1.jpg',0),
('252f6ed4-a2a3-5a8f-a588-4ec03c61344d','f2dda5bd-a337-5f5a-b4ed-7d6288e16f22','https://www.tamiya.com/japan_contents/img/usr/item/1/18073/18073_1.jpg',0),
('604ef53c-fffd-5a5f-b634-845c279fbd34','c63b8f4a-43f3-597b-82e5-f0e45bb45b7a','https://www.tamiya.com/japan_contents/img/usr/item/1/18022/18022_1.jpg',0),
('1e470fd7-d649-55c8-9d4f-1423e1489640','7e6cd351-658c-5558-bff9-3a1ea608e6d4','https://www.tamiya.com/japan_contents/img/usr/item/9/95225/95225_1.jpg',0),
('5def14ae-9313-5df4-a60a-ded62616417e','daf1d532-80b5-524f-896e-fb577dae2445','https://www.tamiya.com/japan_contents/img/usr/item/1/18072/18072_1.jpg',0),
('f910c0f9-423c-5168-ae4e-71fa6b90be9b','5277616b-91d3-5f0c-b893-d77778beaf95','https://www.tamiya.com/japan_contents/img/usr/item/1/18053/18053_1.jpg',0),
('5606efa3-5366-595e-8012-0450125b1c60','eb3b81bb-3a11-56af-a0cf-b625a1501434','https://www.tamiya.com/japan_contents/img/usr/item/1/18056/18056_1.jpg',0),
('9695ac51-69f2-5366-8752-bf1655a63db4','dcaa9d00-fe3f-5bc4-9bfa-5bc1078e2087','https://www.tamiya.com/japan_contents/img/usr/item/1/18009/18009_1.jpg',0),
('7c34a42a-8171-5cd8-b065-74f328e9299d','f4e3f6b8-8ce6-5b87-9d94-5f64a24c031a','https://www.tamiya.com/japan_contents/img/usr/item/1/18013/18013_1.jpg',0)
on conflict (id) do update set release_id=excluded.release_id, url=excluded.url, position=excluded.position;
