-- Legacy Family Audit: Avante Mk.III, rebuilt under the TrackDash Family Completion Master.
-- Keeps stable existing release IDs, adds missing commercial Releases, distinguishes
-- genuinely different Item Numbers, and unifies indistinguishable production waves.

begin;

-- 95464 existed twice in the legacy DB (2018 + 2023) despite sharing the same
-- Item identity and no physical discriminator. The random 2018 duplicate has no
-- external references and is retired in favour of stable releaseSeedKey 7.
delete from public.product_releases
where id='152a9e5b-7551-4111-b815-f9f9072e2d67'::uuid;

insert into public.product_releases (
  id,product_id,item_number,release_type,edition_name,release_year,release_date,
  chassis,barcode_jan,color,country_market,notes,discontinued,is_original,rarity,
  data_source,edition_type,verification_status,production_status,status_checked_at,
  description,description_it
) values
(
  '497455cb-838d-5430-97dd-ae0be52e69e4','de719716-e50a-5811-b99d-18bbb153b166','18626','Original','Avante Mk.III Azure',2008,date '2008-09-06',
  'MS',null,'Light Blue',null,'Original Azure regular release.',
  false,true,'Uncommon','master_legacy_audit_20260921',
  'original','verified','unknown',null,
  'Avante Mk.III Azure, a 2008 Avante Mk.III family Release.',
  'Avante Mk.III Azure, Release della famiglia Avante Mk.III del 2008.'
),
(
  '86763fe4-bfc0-551e-8541-c3fc9c2442b7','de719716-e50a-5811-b99d-18bbb153b166','18627','Original','Avante Mk.III Nero',2008,date '2008-09-27',
  'MS',null,'Black',null,'Original Nero launch colourway.',
  false,false,'Uncommon','master_legacy_audit_20260921',
  'other','verified','unknown',null,
  'Avante Mk.III Nero, a 2008 Avante Mk.III family Release.',
  'Avante Mk.III Nero, Release della famiglia Avante Mk.III del 2008.'
),
(
  '921c4346-c48a-5a36-9438-65c9e4781107','de719716-e50a-5811-b99d-18bbb153b166','94673','Special Edition','Avante Mk.III Azure Finished Model',2008,date '2008-12-20',
  'MS',null,'Light Blue','Japan','Factory-finished Azure edition.',
  false,false,'Rare','master_legacy_audit_20260921',
  'special','partial','unknown',null,
  'Avante Mk.III Azure Finished Model, a 2008 Avante Mk.III family Release.',
  'Avante Mk.III Azure Finished Model, Release della famiglia Avante Mk.III del 2008.'
),
(
  'f66b9e6e-f7e5-57f2-8395-10125a0ae96c','de719716-e50a-5811-b99d-18bbb153b166','94674','Special Edition','Avante Mk.III Nero Finished Model',2008,date '2008-12-20',
  'MS',null,'Black','Japan','Factory-finished Nero edition.',
  false,false,'Rare','master_legacy_audit_20260921',
  'special','partial','unknown',null,
  'Avante Mk.III Nero Finished Model, a 2008 Avante Mk.III family Release.',
  'Avante Mk.III Nero Finished Model, Release della famiglia Avante Mk.III del 2008.'
),
(
  'e07a5f39-d476-54c5-a509-4fb3ffb1a0ec','de719716-e50a-5811-b99d-18bbb153b166','94692','Color Special','Avante Mk.III Red Special',2009,date '2009-06-27',
  'MS','4950344946921','Red','Japan','Original Red Special. Distinct collector Release from ITEM 95425 because Tamiya assigned a new Item Number to the later re-release.',
  true,false,'Rare','master_legacy_audit_20260921',
  'color_special','verified','discontinued',now(),
  'Avante Mk.III Red Special, a 2009 Avante Mk.III family Release.',
  'Avante Mk.III Red Special, Release della famiglia Avante Mk.III del 2009.'
),
(
  'ee0c66c6-0d58-5ee5-ae20-942966da8129','de719716-e50a-5811-b99d-18bbb153b166','92207','Limited Edition','Avante Mk.III Azure Evangelion Unit-01 Special',2009,null,
  'MS',null,'Purple / EVA-01','Japan','Evangelion collaboration; release window September 2009, exact day intentionally unset.',
  false,false,'Very Rare','master_legacy_audit_20260921',
  'limited','partial','unknown',null,
  'Avante Mk.III Azure Evangelion Unit-01 Special, a 2009 Avante Mk.III family Release.',
  'Avante Mk.III Azure Evangelion Unit-01 Special, Release della famiglia Avante Mk.III del 2009.'
),
(
  '8e01ee97-26ad-5c82-a569-b74332d59617','de719716-e50a-5811-b99d-18bbb153b166','94715','Color Special','Avante Mk.III White Special',2010,date '2010-01-30',
  'MS',null,'White / Fluorescent Green','Japan','Original White Special. Distinct from ITEM 95469 re-release.',
  false,false,'Rare','master_legacy_audit_20260921',
  'color_special','partial','unknown',null,
  'Avante Mk.III White Special, a 2010 Avante Mk.III family Release.',
  'Avante Mk.III White Special, Release della famiglia Avante Mk.III del 2010.'
),
(
  '0a386324-1815-5d3e-addb-7e583d3489d6','de719716-e50a-5811-b99d-18bbb153b166','92218','Limited Edition','Avante Mk.III Azure Evangelion Unit-01 Awakening Special',2010,date '2010-01-30',
  'MS',null,null,'Japan','Evangelion Unit-01 Awakening collaboration edition.',
  false,false,'Very Rare','master_legacy_audit_20260921',
  'limited','partial','unknown',null,
  'Avante Mk.III Azure Evangelion Unit-01 Awakening Special, a 2010 Avante Mk.III family Release.',
  'Avante Mk.III Azure Evangelion Unit-01 Awakening Special, Release della famiglia Avante Mk.III del 2010.'
),
(
  '5fdf8efd-46c1-5cff-9a61-6b8ee2b2b2af','de719716-e50a-5811-b99d-18bbb153b166','92219','Limited Edition','Avante Mk.III Azure Tohoku Rakuten Golden Eagles Home Color',2010,date '2010-01-30',
  'MS',null,null,'Japan','Tohoku Rakuten Golden Eagles collaboration.',
  false,false,'Very Rare','master_legacy_audit_20260921',
  'limited','partial','unknown',null,
  'Avante Mk.III Azure Tohoku Rakuten Golden Eagles Home Color, a 2010 Avante Mk.III family Release.',
  'Avante Mk.III Azure Tohoku Rakuten Golden Eagles Home Color, Release della famiglia Avante Mk.III del 2010.'
),
(
  'f308c6fb-af67-5f03-b87b-7c3b947d9dfb','de719716-e50a-5811-b99d-18bbb153b166','92221','Limited Edition','Avante Mk.III Azure Tohoku Rakuten Golden Eagles Mr. Carrasco',2010,date '2010-01-30',
  'MS',null,null,'Japan','Tohoku Rakuten Golden Eagles Mr. Carrasco collaboration.',
  false,false,'Very Rare','master_legacy_audit_20260921',
  'limited','partial','unknown',null,
  'Avante Mk.III Azure Tohoku Rakuten Golden Eagles Mr. Carrasco, a 2010 Avante Mk.III family Release.',
  'Avante Mk.III Azure Tohoku Rakuten Golden Eagles Mr. Carrasco, Release della famiglia Avante Mk.III del 2010.'
),
(
  '3495bf78-89ab-57c4-84fc-f6f300c85a4e','de719716-e50a-5811-b99d-18bbb153b166','94777','Color Special','Avante Mk.III Azure Clear Blue Special',2010,date '2010-07-31',
  'MS',null,'Clear Blue','Japan','Clear Blue ABS special.',
  false,false,'Rare','master_legacy_audit_20260921',
  'color_special','verified','unknown',null,
  'Avante Mk.III Azure Clear Blue Special, a 2010 Avante Mk.III family Release.',
  'Avante Mk.III Azure Clear Blue Special, Release della famiglia Avante Mk.III del 2010.'
),
(
  '9d9d9015-81e5-5388-9d36-3e8b3b223b54','de719716-e50a-5811-b99d-18bbb153b166','94741','Clear Body','Avante Mk.III Azure Clear Special (Polycarbonate Body)',2010,date '2010-10-02',
  'MS',null,'Clear/Azure','Japan','Original ITEM 94741. TrackDash intentionally does not reuse the later 95464 image as if it were exact.',
  false,false,'Rare','master_legacy_audit_20260921',
  'color_special','verified','unknown',null,
  'Avante Mk.III Azure Clear Special (Polycarbonate Body), a 2010 Avante Mk.III family Release.',
  'Avante Mk.III Azure Clear Special (Polycarbonate Body), Release della famiglia Avante Mk.III del 2010.'
),
(
  'fe19ba66-afdf-579b-97b1-0056f354271a','de719716-e50a-5811-b99d-18bbb153b166','94772','Special Edition','Avante Mk.III Race Ready Set',2010,null,
  'MS',null,null,'Japan','Race Ready Set with factory-bundled tuning parts; exact release day remains unverified.',
  false,false,'Rare','master_legacy_audit_20260921',
  'special','partial','unknown',null,
  'Avante Mk.III Race Ready Set, a 2010 Avante Mk.III family Release.',
  'Avante Mk.III Race Ready Set, Release della famiglia Avante Mk.III del 2010.'
),
(
  '03b51f02-a25d-5b8c-9e5e-0da79a34acfc','de719716-e50a-5811-b99d-18bbb153b166','94951','Color Special','Avante Mk.III Nero Clear Violet Special',2013,date '2013-06-15',
  'MS',null,'Clear Violet','Japan','Limited Clear Violet special.',
  false,false,'Rare','master_legacy_audit_20260921',
  'color_special','verified','unknown',null,
  'Avante Mk.III Nero Clear Violet Special, a 2013 Avante Mk.III family Release.',
  'Avante Mk.III Nero Clear Violet Special, Release della famiglia Avante Mk.III del 2013.'
),
(
  '805c2619-0c0c-5aa1-adc5-df25cafe5c8f','de719716-e50a-5811-b99d-18bbb153b166','92284','Limited Edition','Avante Mk.III Nero STARGEK 10th Anniversary Special',2014,null,
  'MA',null,'Smoke / STARGEK','Singapore','STARGEK 10th Anniversary regional edition; exact release day remains unverified.',
  false,false,'Very Rare','master_legacy_audit_20260921',
  'limited','verified','unknown',null,
  'Avante Mk.III Nero STARGEK 10th Anniversary Special, a 2014 Avante Mk.III family Release.',
  'Avante Mk.III Nero STARGEK 10th Anniversary Special, Release della famiglia Avante Mk.III del 2014.'
),
(
  '68be3b41-30a7-55be-8cd9-f741193ce595','de719716-e50a-5811-b99d-18bbb153b166','95087','Japan Cup Edition','Avante Mk.III Japan Cup 2015 Limited Edition',2015,date '2015-07-11',
  'MA',null,'Magenta','Japan','Japan Cup 2015 limited edition.',
  false,false,'Rare','master_legacy_audit_20260921',
  'japan_cup','verified','unknown',null,
  'Avante Mk.III Japan Cup 2015 Limited Edition, a 2015 Avante Mk.III family Release.',
  'Avante Mk.III Japan Cup 2015 Limited Edition, Release della famiglia Avante Mk.III del 2015.'
),
(
  '3ba49f54-21c9-532d-a34a-7b9e38668a6d','de719716-e50a-5811-b99d-18bbb153b166','95425','Reissue','Avante Mk.III Red Special (2018 Re-release)',2018,date '2018-12-01',
  'MS',null,'Red',null,'New Item Number re-release of 94692; collector-distinct because the physical box/item identity is distinguishable.',
  false,false,'Uncommon','master_legacy_audit_20260921',
  'reissue','verified','unknown',null,
  'Avante Mk.III Red Special (2018 Re-release), a 2018 Avante Mk.III family Release.',
  'Avante Mk.III Red Special (2018 Re-release), Release della famiglia Avante Mk.III del 2018.'
),
(
  'cc1fb7fa-67db-5303-9514-80b9705fe732','de719716-e50a-5811-b99d-18bbb153b166','95464','Reissue','Avante Mk.III Azure Clear Special (2018 Re-release)',2018,date '2018-12-22',
  'MS','4950344954643','Clear/Azure',null,'Single collector Release for ITEM 95464. First released 2018-12-22; Tamiya later records a 2023-11-11 production/on-sale wave under the same Item identity. No reliable physical discriminator is documented, so TrackDash keeps one Release.',
  false,false,'Uncommon','master_legacy_audit_20260921',
  'reissue','verified','unknown',null,
  'Avante Mk.III Azure Clear Special (2018 Re-release), a 2018 Avante Mk.III family Release.',
  'Avante Mk.III Azure Clear Special (2018 Re-release), Release della famiglia Avante Mk.III del 2018.'
),
(
  'e31c9f48-a776-564a-a496-63771e4a4f9d','de719716-e50a-5811-b99d-18bbb153b166','95469','Reissue','Avante Mk.III White Special (2019 Re-release)',2019,date '2019-03-23',
  'MS',null,'White',null,'New Item Number re-release of 94715.',
  false,false,'Uncommon','master_legacy_audit_20260921',
  'reissue','verified','unknown',null,
  'Avante Mk.III White Special (2019 Re-release), a 2019 Avante Mk.III family Release.',
  'Avante Mk.III White Special (2019 Re-release), Release della famiglia Avante Mk.III del 2019.'
),
(
  '7fbd00c9-2226-5d71-bca6-8fe9d6e4949b','de719716-e50a-5811-b99d-18bbb153b166','92422','Limited Edition','Avante Mk.III Tamiya Korea 25th Anniversary Special',2020,date '2020-12-09',
  'MS',null,null,'Korea','Tamiya Korea 25th Anniversary regional limited edition.',
  false,false,'Rare','master_legacy_audit_20260921',
  'limited','partial','unknown',null,
  'Avante Mk.III Tamiya Korea 25th Anniversary Special, a 2020 Avante Mk.III family Release.',
  'Avante Mk.III Tamiya Korea 25th Anniversary Special, Release della famiglia Avante Mk.III del 2020.'
),
(
  '65d43c3e-a25b-5d0b-9c16-7b19ae23cac0','de719716-e50a-5811-b99d-18bbb153b166','92428','Limited Edition','Avante Mk.III Tamiya Korea 25th Anniversary Special Ver.2',2021,date '2021-07-14',
  'MS',null,null,'Korea','Tamiya Korea 25th Anniversary regional limited edition Ver.2.',
  false,false,'Rare','master_legacy_audit_20260921',
  'limited','partial','unknown',null,
  'Avante Mk.III Tamiya Korea 25th Anniversary Special Ver.2, a 2021 Avante Mk.III family Release.',
  'Avante Mk.III Tamiya Korea 25th Anniversary Special Ver.2, Release della famiglia Avante Mk.III del 2021.'
),
(
  '97902a92-3b57-5052-a417-ef6eb734652c','de719716-e50a-5811-b99d-18bbb153b166','92430','Limited Edition','Avante Mk.III Azure Tamiya Plamodel Factory Hong Kong Special',2021,null,
  'MS','4950344924301',null,'Hong Kong','Tamiya Plamodel Factory Hong Kong regional special, released August 2021; exact day remains unverified.',
  false,false,'Very Rare','master_legacy_audit_20260921',
  'limited','verified','unknown',null,
  'Avante Mk.III Azure Tamiya Plamodel Factory Hong Kong Special, a 2021 Avante Mk.III family Release.',
  'Avante Mk.III Azure Tamiya Plamodel Factory Hong Kong Special, Release della famiglia Avante Mk.III del 2021.'
),
(
  'c91957f4-907f-5f1a-9a49-faeddc3abd8d','de719716-e50a-5811-b99d-18bbb153b166','18662','Special Edition','Avante Mk.III Nero Advanced Pack (MS Chassis)',2025,date '2025-10-11',
  'MS',null,'Smoke / Red / White',null,'Current Advanced Pack pairing the Avante Mk.III Nero base with race-spec tune-up parts.',
  false,false,'Common','master_legacy_audit_20260921',
  'special','verified','active',now(),
  'Avante Mk.III Nero Advanced Pack (MS Chassis), a 2025 Avante Mk.III family Release.',
  'Avante Mk.III Nero Advanced Pack (MS Chassis), Release della famiglia Avante Mk.III del 2025.'
)
on conflict (id) do update set
  product_id=excluded.product_id,item_number=excluded.item_number,
  release_type=excluded.release_type,edition_name=excluded.edition_name,
  release_year=excluded.release_year,release_date=excluded.release_date,
  chassis=excluded.chassis,barcode_jan=excluded.barcode_jan,color=excluded.color,
  country_market=excluded.country_market,notes=excluded.notes,
  discontinued=excluded.discontinued,is_original=excluded.is_original,
  rarity=excluded.rarity,data_source=excluded.data_source,edition_type=excluded.edition_type,
  verification_status=excluded.verification_status,production_status=excluded.production_status,
  status_checked_at=excluded.status_checked_at,description=excluded.description,
  description_it=excluded.description_it,updated_at=now();

-- Rebuild family provenance from the audited source set.
delete from public.release_sources
where release_id in (select id from public.product_releases where product_id='de719716-e50a-5811-b99d-18bbb153b166'::uuid);

insert into public.release_sources
  (id,release_id,source_type,source_url,verified_fields,checked_at,notes)
values
(
  gen_random_uuid(),'497455cb-838d-5430-97dd-ae0be52e69e4','official_manufacturer','https://www.tamiya.com/japan/products/18626/index.html',
  array['itemNumber','chassis','releaseDate','releaseYear','editionName'],date '2026-09-21','Official Tamiya product page.'
),
(
  gen_random_uuid(),'86763fe4-bfc0-551e-8541-c3fc9c2442b7','official_manufacturer','https://www.tamiya.com/japan/products/18627/index.html',
  array['itemNumber','chassis','releaseDate','releaseYear','editionName','color'],date '2026-09-21','Official Tamiya product page.'
),
(
  gen_random_uuid(),'921c4346-c48a-5a36-9438-65c9e4781107','trusted_secondary','https://tamiyablog.com/2008/09/new-releases-at-the-all-japan-plamodel-radicon-show-updated-sept-28/',
  array['itemNumber','editionName','releaseYear'],date '2026-09-21','Contemporary release announcement attributed to Tamiya.'
),
(
  gen_random_uuid(),'921c4346-c48a-5a36-9438-65c9e4781107','trusted_secondary','https://www.jokerteam.it/wp-content/uploads/2018/01/Mini-4wd-Avante-History.pdf',
  array['itemNumber','releaseDate','releaseYear'],date '2026-09-21','Historical Avante reference corroborates 2008-12-20.'
),
(
  gen_random_uuid(),'f66b9e6e-f7e5-57f2-8395-10125a0ae96c','trusted_secondary','https://tamiyablog.com/2008/09/new-releases-at-the-all-japan-plamodel-radicon-show-updated-sept-28/',
  array['itemNumber','editionName','releaseYear'],date '2026-09-21','Contemporary release announcement attributed to Tamiya.'
),
(
  gen_random_uuid(),'f66b9e6e-f7e5-57f2-8395-10125a0ae96c','trusted_secondary','https://www.jokerteam.it/wp-content/uploads/2018/01/Mini-4wd-Avante-History.pdf',
  array['itemNumber','releaseDate','releaseYear'],date '2026-09-21','Historical Avante reference corroborates 2008-12-20.'
),
(
  gen_random_uuid(),'e07a5f39-d476-54c5-a509-4fb3ffb1a0ec','trusted_secondary','https://www.tea-league.com/mt/tea/archives/2009/06/mkiii_5.html',
  array['itemNumber','releaseDate','releaseYear','chassis','editionName'],date '2026-09-21','Contemporary report links the original Tamiya 94692 catalog page and states 2009-06-27.'
),
(
  gen_random_uuid(),'e07a5f39-d476-54c5-a509-4fb3ffb1a0ec','trusted_secondary','https://hs-tamtam.co.jp/product/detail/31159/',
  array['itemNumber','barcodeJAN','editionName'],date '2026-09-21','Japanese retailer corroborates JAN 4950344946921.'
),
(
  gen_random_uuid(),'e07a5f39-d476-54c5-a509-4fb3ffb1a0ec','trusted_secondary','https://www.hlj.com/avante-mk-iii-red-special-tam94692',
  array['itemNumber','productionStatus'],date '2026-09-21','HLJ identifies ITEM 94692 and marks it discontinued.'
),
(
  gen_random_uuid(),'ee0c66c6-0d58-5ee5-ae20-942966da8129','trusted_secondary','https://www.tea-league.com/mt/tea/archives/2009/05/special_5.html',
  array['editionName','releaseYear','chassis','color'],date '2026-09-21','Contemporary collaboration report documents the Evangelion Unit-01 Special and 2009 release window.'
),
(
  gen_random_uuid(),'ee0c66c6-0d58-5ee5-ae20-942966da8129','trusted_secondary','https://mini-4wd.fandom.com/wiki/Avante_Mk.III',
  array['itemNumber','releaseYear'],date '2026-09-21','Structured family matrix identifies ITEM 92207.'
),
(
  gen_random_uuid(),'8e01ee97-26ad-5c82-a569-b74332d59617','trusted_secondary','https://tamiyablog.com/2009/11/future-release-list-for-tamiya-fair-2009-tamiya-sand-scorcher-re-release/',
  array['itemNumber','editionName'],date '2026-09-21','Contemporary future-release list from Tamiya Fair.'
),
(
  gen_random_uuid(),'8e01ee97-26ad-5c82-a569-b74332d59617','trusted_secondary','https://www.jokerteam.it/wp-content/uploads/2018/01/Mini-4wd-Avante-History.pdf',
  array['releaseDate','releaseYear'],date '2026-09-21','Historical family reference corroborates 2010-01-30.'
),
(
  gen_random_uuid(),'0a386324-1815-5d3e-addb-7e583d3489d6','trusted_secondary','https://www.tea-league.com/mt/tea/archives/2009/11/index.php?page=all',
  array['editionName','releaseYear'],date '2026-09-21','Contemporary 2010 release coverage.'
),
(
  gen_random_uuid(),'0a386324-1815-5d3e-addb-7e583d3489d6','trusted_secondary','https://mini-4wd.fandom.com/wiki/Avante_Mk.III',
  array['itemNumber','releaseDate','releaseYear'],date '2026-09-21','Structured family matrix identifies ITEM 92218 and date.'
),
(
  gen_random_uuid(),'5fdf8efd-46c1-5cff-9a61-6b8ee2b2b2af','trusted_secondary','https://mini-4wd.fandom.com/wiki/Avante_Mk.III',
  array['itemNumber','releaseDate','releaseYear','editionName'],date '2026-09-21','Structured family matrix documents this collaboration release.'
),
(
  gen_random_uuid(),'f308c6fb-af67-5f03-b87b-7c3b947d9dfb','trusted_secondary','https://mini-4wd.fandom.com/wiki/Avante_Mk.III',
  array['itemNumber','releaseDate','releaseYear','editionName'],date '2026-09-21','Structured family matrix documents this collaboration release.'
),
(
  gen_random_uuid(),'3495bf78-89ab-57c4-84fc-f6f300c85a4e','trusted_secondary','https://www.tea-league.com/mt/tea/archives/2010/07/index.php?page=all',
  array['itemNumber','editionName','releaseYear','color'],date '2026-09-21','Contemporary release coverage.'
),
(
  gen_random_uuid(),'3495bf78-89ab-57c4-84fc-f6f300c85a4e','trusted_secondary','https://www.rcjaz.com/tamiya-94777-avante-iii-azure-clear-blue-sp-p-90022364.html',
  array['itemNumber','editionName','chassis','color'],date '2026-09-21','Specialist retailer corroborates exact kit identity.'
),
(
  gen_random_uuid(),'9d9d9015-81e5-5388-9d36-3e8b3b223b54','trusted_secondary','https://www.rcjaz.com/tamiya-94741-132-avante-mkiii-azure-clear-special-polycarbonate-body-p-90022521.html',
  array['itemNumber','editionName','chassis'],date '2026-09-21','Specialist retailer identifies original ITEM 94741.'
),
(
  gen_random_uuid(),'9d9d9015-81e5-5388-9d36-3e8b3b223b54','trusted_secondary','https://mini-4wd.fandom.com/wiki/Avante_Mk.III',
  array['itemNumber','releaseDate','releaseYear'],date '2026-09-21','Structured family matrix corroborates 2010-10-02.'
),
(
  gen_random_uuid(),'fe19ba66-afdf-579b-97b1-0056f354271a','official_catalog_pdf','https://www.fantasyland.it/wordpress/wp-content/themes/fantasyland/documenti/tamiya/volantini/TA_2010-10.pdf',
  array['itemNumber','editionName','chassis'],date '2026-09-21','Tamiya Italy flyer lists ITEM 94772 Avante Mk.III Race Ready Set.'
),
(
  gen_random_uuid(),'fe19ba66-afdf-579b-97b1-0056f354271a','trusted_secondary','https://mini-4wd.fandom.com/wiki/Avante_Mk.III',
  array['itemNumber','releaseYear'],date '2026-09-21','Family matrix corroborates the 2010 release year.'
),
(
  gen_random_uuid(),'03b51f02-a25d-5b8c-9e5e-0da79a34acfc','trusted_secondary','https://myrcstation.com/products/tamiya-94951-1-32-jr-avante-mkiii-nero-clear-violet-special-ms-chassis-94951',
  array['itemNumber','editionName','chassis','color'],date '2026-09-21','Specialist retailer exact product record.'
),
(
  gen_random_uuid(),'03b51f02-a25d-5b8c-9e5e-0da79a34acfc','trusted_secondary','https://www.jokerteam.it/wp-content/uploads/2018/01/Mini-4wd-Avante-History.pdf',
  array['releaseDate','releaseYear'],date '2026-09-21','Historical family reference corroborates 2013-06-15.'
),
(
  gen_random_uuid(),'805c2619-0c0c-5aa1-adc5-df25cafe5c8f','trusted_secondary','https://www.rcjaz.com/tamiya-92284-132-avante-mkiii-nero-ma-chassis-model-kit-p-90067482.html',
  array['itemNumber','editionName','chassis'],date '2026-09-21','Specialist retailer identifies STARGEK 10th Anniversary edition on MA chassis.'
),
(
  gen_random_uuid(),'68be3b41-30a7-55be-8cd9-f741193ce595','official_manufacturer','https://www.tamiya.com/japan/products/95087/index.html',
  array['itemNumber','chassis','releaseDate','releaseYear','editionName'],date '2026-09-21','Official Tamiya product page.'
),
(
  gen_random_uuid(),'3ba49f54-21c9-532d-a34a-7b9e38668a6d','official_manufacturer','https://www.tamiya.com/japan/products/95425/index.html',
  array['itemNumber','chassis','releaseDate','releaseYear','editionName'],date '2026-09-21','Official Tamiya product page.'
),
(
  gen_random_uuid(),'3ba49f54-21c9-532d-a34a-7b9e38668a6d','official_catalog_pdf','https://www.fantasyland.it/wordpress/wp-content/themes/fantasyland/documenti/tamiya/volantini/TA_2018-09.pdf',
  array['editionName','releaseYear'],date '2026-09-21','Tamiya Italy flyer explicitly describes this as the return of the 2009 Red Special.'
),
(
  gen_random_uuid(),'cc1fb7fa-67db-5303-9514-80b9705fe732','official_manufacturer','https://www.tamiya.com/japan/products/95464/index.html',
  array['itemNumber','chassis','releaseYear','editionName'],date '2026-09-21','Official page states initial 2010 model history and a later 2023-11-11 on-sale wave; TrackDash keeps ITEM 95464 as one collector Release beginning in 2018.'
),
(
  gen_random_uuid(),'cc1fb7fa-67db-5303-9514-80b9705fe732','trusted_secondary','https://product.rakuten.co.jp/product/-/726ba4f4958649aded5caff160afb326/?l2-id=pdt_ranking',
  array['itemNumber','releaseDate','barcodeJAN'],date '2026-09-21','Retail product record corroborates 2018-12-22 and JAN 4950344954643.'
),
(
  gen_random_uuid(),'e31c9f48-a776-564a-a496-63771e4a4f9d','official_manufacturer','https://www.tamiya.com/japan/products/95469/index.html',
  array['itemNumber','chassis','releaseDate','releaseYear','editionName'],date '2026-09-21','Official Tamiya product page.'
),
(
  gen_random_uuid(),'7fbd00c9-2226-5d71-bca6-8fe9d6e4949b','trusted_secondary','https://compensation.tistory.com/entry/%ED%83%80%EB%AF%B8%EC%95%BC-92422-%EC%95%84%EB%B0%98%EB%96%BC-MK%E2%85%A2-%ED%95%9C%EA%B5%AD%ED%83%80%EB%AF%B8%EC%95%BC-25%EC%A3%BC%EB%85%84-%EA%B8%B0%EB%85%90-%EC%8A%A4%ED%8F%90%EC%85%9C-%EA%B5%AC%EC%84%B1-%EB%A6%AC%EB%B7%B0',
  array['itemNumber','editionName','chassis'],date '2026-09-21','Korean specialist review documents ITEM 92422 and 25th Anniversary specification.'
),
(
  gen_random_uuid(),'7fbd00c9-2226-5d71-bca6-8fe9d6e4949b','trusted_secondary','https://mini-4wd.fandom.com/wiki/Avante_Mk.III',
  array['releaseDate','releaseYear'],date '2026-09-21','Structured family matrix supplies release date.'
),
(
  gen_random_uuid(),'65d43c3e-a25b-5d0b-9c16-7b19ae23cac0','trusted_secondary','https://www.modellismogandolfi.com/prodotto/avante-mk-iii-25th-anniversary-special-version-2-telaio-ms-edizione-limitata/',
  array['itemNumber','editionName','chassis'],date '2026-09-21','Specialist retailer exact product record.'
),
(
  gen_random_uuid(),'65d43c3e-a25b-5d0b-9c16-7b19ae23cac0','trusted_secondary','https://mini-4wd.fandom.com/wiki/Avante_Mk.III',
  array['releaseDate','releaseYear'],date '2026-09-21','Structured family matrix supplies release date.'
),
(
  gen_random_uuid(),'97902a92-3b57-5052-a417-ef6eb734652c','trusted_secondary','https://tamiyablog.com/2021/08/tamiya-92429-thunder-shot-mk-ii-waigo-hobby-45th-anniversary-special-92430-avante-mk-iii-azure-tamiya-plamodel-factory-hong-kong-special/',
  array['itemNumber','editionName','releaseYear'],date '2026-09-21','Contemporary report reproduces Tamiya HK announcement.'
),
(
  gen_random_uuid(),'97902a92-3b57-5052-a417-ef6eb734652c','trusted_secondary','https://www.rcjaz.com/tamiya-92430-132-avante-mkiii-azure-ms-chassis-model-kit-p-26964.html',
  array['itemNumber','barcodeJAN','chassis'],date '2026-09-21','Specialist retailer corroborates GTIN/JAN 4950344924301.'
),
(
  gen_random_uuid(),'c91957f4-907f-5f1a-9a49-faeddc3abd8d','official_manufacturer','https://www.tamiya.com/japan/products/18662/index.html',
  array['itemNumber','editionName','releaseDate','releaseYear','chassis','productionStatus'],date '2026-09-21','Current official Tamiya Japan product page.'
),
(
  gen_random_uuid(),'c91957f4-907f-5f1a-9a49-faeddc3abd8d','official_manufacturer','https://www.tamiyausa.com/shop/132-pro/jr-avante-mkiii-nero-3/',
  array['itemNumber','editionName','productionStatus'],date '2026-09-21','Official Tamiya USA page currently offers the kit for sale.'
);

-- The legacy 94741 row silently used the later 95464 image. Remove it:
-- exact-image placeholder is intentionally preferred to a sibling/reissue photo.
delete from public.release_images
where release_id='9d9d9015-81e5-5388-9d36-3e8b3b223b54'::uuid;

-- The owner's physical Red Special was previously attached to 95425 (2018).
-- Move only that exact collection row/share to the verified original ITEM 94692;
-- price/date/condition/notes/photos remain untouched.
update public.collection_items
set release_id='e07a5f39-d476-54c5-a509-4fb3ffb1a0ec'::uuid,
    product_id='de719716-e50a-5811-b99d-18bbb153b166'::uuid,
    updated_at=now()
where id='c79d7da8-1325-4d75-84d3-26df581f65a6'::uuid;

update public.collection_shares
set release_id='e07a5f39-d476-54c5-a509-4fb3ffb1a0ec'::uuid,
    updated_at=now()
where collection_item_id='c79d7da8-1325-4d75-84d3-26df581f65a6'::uuid;

-- Keep canonical family identity on the regular Azure release.
update public.products
set canonical_release_id='497455cb-838d-5430-97dd-ae0be52e69e4'::uuid,
    canonical_item_number='18626',
    original_release_year=2008,
    rarity='Uncommon',
    description='The Avante Mk.III family: Azure and Nero regular releases plus finished models, color specials, collaborations, regional editions, Japan Cup releases, re-releases and the modern Nero Advanced Pack.',
    updated_at=now()
where id='de719716-e50a-5811-b99d-18bbb153b166'::uuid;

-- Every numbered Release receives the standard scan plan. Enrollment is not
-- treated as execution; initial audit evidence is handled separately.
select public.trackdash_enroll_release_market_scans(id)
from public.product_releases
where product_id='de719716-e50a-5811-b99d-18bbb153b166'::uuid and item_number is not null and btrim(item_number)<>'';

select public.trackdash_enqueue_market_recompute(id,'new_complete_unbuilt')
from public.product_releases
where product_id='de719716-e50a-5811-b99d-18bbb153b166'::uuid and item_number is not null and btrim(item_number)<>'';

commit;\n