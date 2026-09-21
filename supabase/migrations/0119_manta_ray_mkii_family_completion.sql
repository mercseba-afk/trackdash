-- Complete the Manta Ray Mk.II family audit.
--
-- Adds the five numbered Releases missing from the 0116 baseline plus three
-- documented Tamiya event variants whose autonomous Item Number/JAN is not
-- confirmed. Those unnumbered variants stay out of unattended market scans.
--
-- Gold Metallic (2013) is intentionally NOT catalogued here: a contemporary
-- event report shows it was announced but replaced before sale at that event,
-- and TrackDash has not yet found sufficient evidence of an actual sale.
--
-- The seven numbered Releases are enrolled in the normal market plan:
-- eBay Active 72h, retail 168h and SOLD research 336h according to source policy.

insert into public.product_releases (
  id, product_id, item_number, release_type, edition_name, release_year,
  release_date, chassis, barcode_jan, color, country_market, notes,
  discontinued, is_original, rarity, data_source, edition_type,
  verification_status, production_status, status_checked_at,
  description, description_it
) values
(
  '3eb8e671-b09a-5b2d-bb87-729676bd1237',
  '277030d7-5caa-517a-b3d1-bd52d9c48815',
  '94593','Finished Model','Manta Ray Mk.II (Finished Model)',2007,date '2007-03-24',
  'MS',null,'Silver / Red','Japan',
  'Factory-finished Manta Ray Mk.II. Historical Tamiya release lists confirm ITEM 94593; specialist archives record the 2007-03-24 release date. The finished model differs from the assembly kit in its pre-built configuration and N-01 nose unit.',
  true,false,null,'audited_mixed','special','verified','discontinued',now(),
  'Factory-finished 2007 Manta Ray Mk.II, catalogued separately from the 18615 assembly kit.',
  'Manta Ray Mk.II preassemblata del 2007, catalogata separatamente dal kit 18615.'
),
(
  'eeb02308-6a9a-5d0c-88ee-5a0fc127a0e8',
  '277030d7-5caa-517a-b3d1-bd52d9c48815',
  '94665','Limited','Manta Ray Mk.II Black Special',2008,date '2008-09-20',
  'MS','4950344946655','Smoke / Blue','Japan',
  'Original Black Special release. Japanese specialist sources corroborate ITEM 94665, JAN 4950344946655, MS chassis and 2008-09-20 release date. Kept distinct from 95466.',
  true,false,null,'audited_mixed','color_special','verified','discontinued',now(),
  'Original 2008 Black Special on MS chassis.',
  'Black Special originale del 2008 su telaio MS.'
),
(
  'f1372ca5-e4ad-5994-b31b-2ccb9fc99b6f',
  '277030d7-5caa-517a-b3d1-bd52d9c48815',
  '94709','Limited','Manta Ray Mk.II White Special',2009,date '2009-11-28',
  'MS','4950344947096','Translucent White / Light Blue','Japan',
  'Original White Special release. Contemporary Japanese Mini 4WD reporting cites the former official Tamiya catalog page, ITEM 94709 and 2009-11-28 release date; specialist retail metadata corroborates JAN 4950344947096.',
  true,false,null,'audited_mixed','color_special','verified','discontinued',now(),
  'Original 2009 White Special on MS chassis.',
  'White Special originale del 2009 su telaio MS.'
),
(
  'a98fe80b-1f8c-53e1-b26d-404daf93b77d',
  '277030d7-5caa-517a-b3d1-bd52d9c48815',
  '95462','Reissue','Manta Ray Mk.II White Special (2019 Reissue)',2019,date '2019-02-23',
  'MS','4950344954629','Translucent White / Light Blue',null,
  '2019 reissue of the earlier White Special. Tamiya Japan confirms ITEM 95462, release date 2019-02-23, MS chassis and specification. Tamiya USA explicitly describes it as a re-issue and marks it discontinued. JAN 4950344954629 is independently corroborated by Japanese retail metadata.',
  true,false,null,'audited_mixed','reissue','verified','discontinued',now(),
  '2019 reissue of the White Special, distinct from ITEM 94709.',
  'Ristampa 2019 della White Special, distinta dall’ITEM 94709.'
),
(
  '4fdb8e31-07be-5907-9530-9a9bbe7edcf2',
  '277030d7-5caa-517a-b3d1-bd52d9c48815',
  '95690','Limited','Manta Ray Mk.II City Circuit Special (MA Chassis)',2025,date '2025-06-14',
  'MA','4950344956906','Purple / Black',null,
  'City Circuit Tokyo Bay collaboration release. Tamiya states first sales at CITY CIRCUIT TOKYO BAY from 2025-06-14, followed by Japan Cup 2025 Shizuoka event sales from 2025-07-05. Tamiya Japan and Tamiya USA confirm ITEM 95690 and MA chassis; the official Tamiya USA February 2026 MAP list confirms JAN 4950344956906.',
  false,false,null,'audited_mixed','limited','verified','active',now(),
  '2025 City Circuit Tokyo Bay special with purple Manta Ray Mk.II body on MA chassis.',
  'Edizione City Circuit Tokyo Bay 2025 con carrozzeria Manta Ray Mk.II viola su telaio MA.'
),
(
  'd0c9c45e-3d75-52d1-92cb-84cf9f5f2a07',
  '277030d7-5caa-517a-b3d1-bd52d9c48815',
  null,'Event Limited','Manta Ray Mk.II Pink Metallic Special',2007,null,
  'MS',null,'Pink Plated / Silver Plated Wheels','Japan',
  'Tamiya-event limited metallic variant sold during Mini 4WD Adventure 2007. Contemporary reporting confirms a pink-plated body with silver-plated wheels. No autonomous Tamiya Item Number or JAN has been verified, so TrackDash intentionally leaves both identifiers empty.',
  true,false,null,'audited_secondary','limited','partial','discontinued',now(),
  '2007 Tamiya-event Pink Metallic variant. No autonomous Item Number confirmed.',
  'Variante Pink Metallic venduta agli eventi Tamiya nel 2007. Nessun Item Number autonomo confermato.'
),
(
  '9a231f02-7a7e-5489-b44d-b4eb10b60a78',
  '277030d7-5caa-517a-b3d1-bd52d9c48815',
  null,'Event Limited','Manta Ray Mk.II Silver Metallic Semi-Finished Model',2010,null,
  'MS',null,'Silver Plated / Red Plated Wheels','Japan',
  'Tamiya Summer GP 2010 event-limited semi-finished Manta Ray Mk.II Silver Metallic specification, sold with a Torque-Tuned Motor PRO. Contemporary reporting explicitly cites the Tamiya event listing. No autonomous Tamiya Item Number or JAN has been verified.',
  true,false,null,'audited_secondary','limited','partial','discontinued',now(),
  '2010 event-limited Silver Metallic semi-finished model with Torque-Tuned Motor PRO.',
  'Semicompletata Silver Metallic venduta come edizione limitata agli eventi Tamiya Summer GP 2010, con Torque-Tuned Motor PRO.'
),
(
  'd6617c26-9ec3-5adf-892f-ebeb1c782b70',
  '277030d7-5caa-517a-b3d1-bd52d9c48815',
  null,'Event Limited','Manta Ray Mk.II Black Metallic Special',2012,date '2012-07-15',
  'MS',null,'Black Plated / Blue Plated Wheels','Japan',
  'Event-limited Black Metallic specification sold at Japan Cup 2012 Tokyo 1. Contemporary event reporting records the 2012-07-15 sale, 1,260 JPY price, black-plated body and blue-plated wheels. No autonomous Tamiya Item Number or JAN has been verified.',
  true,false,null,'audited_secondary','limited','partial','discontinued',now(),
  '2012 Japan Cup event-limited Black Metallic variant.',
  'Variante Black Metallic venduta come edizione limitata alla Japan Cup 2012.'
)
on conflict (id) do update set
  product_id=excluded.product_id,
  item_number=excluded.item_number,
  release_type=excluded.release_type,
  edition_name=excluded.edition_name,
  release_year=excluded.release_year,
  release_date=excluded.release_date,
  chassis=excluded.chassis,
  barcode_jan=excluded.barcode_jan,
  color=excluded.color,
  country_market=excluded.country_market,
  notes=excluded.notes,
  discontinued=excluded.discontinued,
  is_original=excluded.is_original,
  rarity=excluded.rarity,
  data_source=excluded.data_source,
  edition_type=excluded.edition_type,
  verification_status=excluded.verification_status,
  production_status=excluded.production_status,
  status_checked_at=excluded.status_checked_at,
  description=excluded.description,
  description_it=excluded.description_it,
  updated_at=now();

insert into public.release_sources (
  id, release_id, source_type, source_url, verified_fields, checked_at, notes
) values
('1fc24585-360e-54d7-b561-d1c26519e233','3eb8e671-b09a-5b2d-bb87-729676bd1237','trusted_secondary','https://tamiyablog.com/2007/02/tamiya-58-spielwarenmesse-international-toy-fair-nurnberg-2007-new-releases/',array['itemNumber','editionName'],date '2026-09-21','Contemporary Tamiya release list reproduction attributes ITEM 94593 Manta Ray Mk.II Finished Model to Tamiya, Inc.'),
('96743fc9-02d5-546c-add3-dce8ddc67c3b','3eb8e671-b09a-5b2d-bb87-729676bd1237','trusted_secondary','https://w.atwiki.jp/mini4vipwiki/pages/249.html',array['itemNumber','releaseDate','releaseYear','chassis'],date '2026-09-21','Japanese Mini 4WD archive records ITEM 94593 and 2007-03-24 release date.'),
('2f74fd1f-7e62-5f07-ac12-3297ce2c9d25','eeb02308-6a9a-5d0c-88ee-5a0fc127a0e8','trusted_secondary','https://hs-tamtam.co.jp/product/detail/27186/',array['itemNumber','barcodeJAN','editionName','chassis','color'],date '2026-09-21','Japanese specialist retailer corroborates ITEM 94665, JAN 4950344946655 and Black Special specification.'),
('00abbf37-076f-5b01-bda4-5b46d2042609','eeb02308-6a9a-5d0c-88ee-5a0fc127a0e8','trusted_secondary','https://w.atwiki.jp/mini4vipwiki/pages/525.html',array['releaseDate','releaseYear','itemNumber'],date '2026-09-21','Japanese Mini 4WD archive records 2008-09-20 release and distinguishes later 95466 reissue.'),
('d077d2fc-d7a6-51d4-95bf-74fc3ad7efef','f1372ca5-e4ad-5994-b31b-2ccb9fc99b6f','trusted_secondary','https://www.tea-league.com/mt/tea/archives/2009/10/49_5.html',array['itemNumber','releaseDate','releaseYear','chassis','color'],date '2026-09-21','Contemporary hobby-show report records ITEM 94709 and 2009-11-28 release date.'),
('47b74417-59e0-5bcf-b2e0-eafb760212a1','f1372ca5-e4ad-5994-b31b-2ccb9fc99b6f','trusted_secondary','https://www.suruga-ya.jp/product/detail/603011874',array['itemNumber','editionName'],date '2026-09-21','Japanese specialist resale metadata independently corroborates ITEM 94709 and White Special identity.'),
('d39ee855-c3c3-5659-a6ae-397ad2828889','a98fe80b-1f8c-53e1-b26d-404daf93b77d','official_manufacturer','https://www.tamiya.com/japan/products/95462/index.html',array['itemNumber','editionName','releaseDate','releaseYear','chassis','color'],date '2026-09-21','Official Tamiya Japan product page.'),
('96272552-7932-5989-b2fd-f692ad7ee1a4','a98fe80b-1f8c-53e1-b26d-404daf93b77d','official_manufacturer','https://www.tamiyausa.com/shop/132-pro/jr-manta-ray-mkii-white-sp-2/',array['editionName','chassis','productionStatus'],date '2026-09-21','Official Tamiya USA page describes 95462 as a re-issue and marks it discontinued.'),
('c9e1114c-0dc9-5611-bc4d-4c5970771bea','a98fe80b-1f8c-53e1-b26d-404daf93b77d','trusted_secondary','https://store.shopping.yahoo.co.jp/hobbyone/4950344954629.html',array['barcodeJAN','itemNumber'],date '2026-09-21','Japanese retail metadata corroborates JAN 4950344954629.'),
('c10f09e6-220c-5fe8-99e9-8d587e25823a','4fdb8e31-07be-5907-9530-9a9bbe7edcf2','official_manufacturer','https://www.tamiya.com/japan/products/95690/index.html',array['itemNumber','editionName','releaseDate','releaseYear','chassis','color'],date '2026-09-21','Official Tamiya Japan page records City Circuit Tokyo Bay sales from 2025-06-14 and Japan Cup release from 2025-07-05.'),
('fea7723d-91a4-50ee-b71d-2b7fa47037ba','4fdb8e31-07be-5907-9530-9a9bbe7edcf2','official_manufacturer','https://www.tamiyausa.com/shop/132-pro/jr-manta-ray-mkii-2/',array['itemNumber','editionName','chassis','color'],date '2026-09-21','Official Tamiya USA page confirms ITEM 95690 and MA chassis specification.'),
('58cdd543-3922-5208-a85a-b14e62b5bd0d','4fdb8e31-07be-5907-9530-9a9bbe7edcf2','official_catalog_pdf','https://www.tamiyausa.com/media/files/map-feb-2026-1239-08db.pdf',array['barcodeJAN','itemNumber'],date '2026-09-21','Official Tamiya USA February 2026 MAP list confirms ITEM 95690 and JAN 4950344956906.'),
('11a7f92c-58df-5dcb-98be-e84ab6dd524a','d0c9c45e-3d75-52d1-92cb-84cf9f5f2a07','trusted_secondary','https://www.tea-league.com/mt/tea/archives/2007/01/2007_12.html',array['editionName','releaseYear','color'],date '2026-09-21','Contemporary event report documents the Manta Ray Mk.II Pink Metallic limited kit with pink-plated body and silver-plated wheels.'),
('2ce0b530-325e-56d4-a657-d4d4b757015c','d0c9c45e-3d75-52d1-92cb-84cf9f5f2a07','trusted_secondary','https://www.tea-league.com/mt/tea/archives/2007/01/2007_13.html',array['editionName','releaseYear'],date '2026-09-21','Historical timeline independently records the Pink Metallic Manta Ray Mk.II as a January 2007 event-limited sale.'),
('75265004-165b-5336-82af-90870684d697','9a231f02-7a7e-5489-b44d-b4eb10b60a78','trusted_secondary','https://www.tea-league.com/mt/tea/archives/2010/07/index.php?page=all',array['editionName','releaseYear','color'],date '2026-09-21','Contemporary report reproduces the Tamiya Summer GP 2010 event sale listing for the Silver Metallic semi-finished model with Torque-Tuned Motor PRO.'),
('cc436027-aeae-5aaf-a3de-063dd3f6cb50','9a231f02-7a7e-5489-b44d-b4eb10b60a78','trusted_secondary','https://www.tea-league.com/mt/tea/archives/2010/01/2010_25.html',array['editionName','releaseYear'],date '2026-09-21','Historical timeline independently records the July 2010 Silver Metallic semi-finished Manta Ray Mk.II event sale.'),
('4d7f1654-4279-5711-b696-781d134cd04c','d6617c26-9ec3-5adf-892f-ebeb1c782b70','trusted_secondary','https://www.tea-league.com/mt/tea/archives/2012/07/20121_9.html',array['editionName','releaseDate','releaseYear','color'],date '2026-09-21','Japan Cup 2012 Tokyo 1 event report documents the Black Metallic Manta Ray Mk.II on 2012-07-15 with black-plated body and blue-plated wheels.'),
('4bf68f75-49c6-5b5d-a825-e40d994c3384','d6617c26-9ec3-5adf-892f-ebeb1c782b70','trusted_secondary','https://www.tea-league.com/mt/tea/archives/2012/07/20122_7.html',array['editionName','releaseYear','color'],date '2026-09-21','Tamiya Modelers Gallery 2012 report independently identifies the July Japan Cup 2012 Black Metallic Manta Ray Mk.II limited sale.')
on conflict (id) do update set
  release_id=excluded.release_id,
  source_type=excluded.source_type,
  source_url=excluded.source_url,
  verified_fields=excluded.verified_fields,
  checked_at=excluded.checked_at,
  notes=excluded.notes;

insert into public.release_images (id, release_id, url, position) values (
  'a3a7133b-72bc-5423-9a28-cb4e4d74c76a',
  'a98fe80b-1f8c-53e1-b26d-404daf93b77d',
  'https://www.tamiyausa.com/media/CACHE/images/products/jr-manta-ray-mkii-white-sp-2-ms-chassis-9-66f6/73991c2af14a93d95bdbe7afc92e5d50.jpg',
  0
)
on conflict (id) do update set
  release_id=excluded.release_id,
  url=excluded.url,
  position=excluded.position;

select public.trackdash_enroll_release_market_scans(r.id)
from public.product_releases r
where r.product_id='277030d7-5caa-517a-b3d1-bd52d9c48815'
  and r.item_number is not null
  and btrim(r.item_number) <> '';
