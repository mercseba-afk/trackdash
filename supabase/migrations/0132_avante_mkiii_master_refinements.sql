-- Avante Mk.III Master Audit refinements, 2026-09-21.
-- Completes the 0131 legacy-family rebuild with the Competition Pack,
-- Korea Cup 2026 release, verified identifiers/status, exact-image audit,
-- and explicit intentional placeholders where no exact image was found.

begin;

-- Refine existing Releases with newly verified exact facts.
update public.product_releases
set release_date=date '2009-09-19',
    notes=concat_ws(' ',notes,'Exact release date verified during the 2026-09-21 Master audit.'),
    updated_at=now()
where id='ee0c66c6-0d58-5ee5-ae20-942966da8129'::uuid;

update public.product_releases
set barcode_jan='4950344922185',
    updated_at=now()
where id='0a386324-1815-5d3e-addb-7e583d3489d6'::uuid;

update public.product_releases
set release_type='Special Edition',
    edition_name='Avante Mk.III Competition Pack',
    release_date=date '2010-11-13',
    barcode_jan='4950344947720',
    notes='Limited Competition Pack / Race Ready Set with Torque-Tuned Motor PRO and race-oriented Grade-Up Parts. ITEM 94772; release 2010-11-13.',
    verification_status='verified',
    updated_at=now()
where id='fe19ba66-afdf-579b-97b1-0056f354271a'::uuid;

update public.product_releases
set barcode_jan='4950344922840',
    updated_at=now()
where id='805c2619-0c0c-5aa1-adc5-df25cafe5c8f'::uuid;

update public.product_releases
set barcode_jan='4950344954698',
    discontinued=true,
    production_status='discontinued',
    status_checked_at=now(),
    updated_at=now()
where id='e31c9f48-a776-564a-a496-63771e4a4f9d'::uuid;

update public.product_releases
set barcode_jan='4950344924226',
    updated_at=now()
where id='7fbd00c9-2226-5d71-bca6-8fe9d6e4949b'::uuid;

update public.product_releases
set barcode_jan='4950344186624',
    production_status='active',
    status_checked_at=now(),
    updated_at=now()
where id='c91957f4-907f-5f1a-9a49-faeddc3abd8d'::uuid;

-- Korea Mini 4WD Cup 2026: new distinct Item Number, therefore a distinct
-- collector Release rather than a production wave of another Nero kit.
insert into public.product_releases (
  id,product_id,item_number,release_type,edition_name,release_year,release_date,
  chassis,barcode_jan,color,country_market,notes,discontinued,is_original,rarity,
  data_source,edition_type,verification_status,production_status,status_checked_at,
  description,description_it
) values (
  '1c89e3ac-33c5-5079-98e7-7d7165c982d9',
  'de719716-e50a-5811-b99d-18bbb153b166',
  '92470','Special Edition',
  'Avante Mk.III Nero Tamiya Korea Mini 4WD Cup 2026',
  2026,date '2026-07-04','MS',null,'Clear Pink / White','Korea',
  'Tamiya Korea exclusive for the 2026 Korea Mini 4WD Cup. Official Tamiya Korea announcement sets nationwide release on 2026-07-04. Exact product image was not exposed as a stable directly attributable asset during the 2026-09-21 image audit, so TrackDash intentionally uses the placeholder.',
  false,false,'Uncommon','master_legacy_audit_20260921',
  'special','verified','active',now(),
  '2026 Tamiya Korea Mini 4WD Cup exclusive Avante Mk.III Nero on MS chassis.',
  'Avante Mk.III Nero esclusiva Tamiya Korea Mini 4WD Cup 2026 su telaio MS.'
)
on conflict (id) do update set
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
  rarity=excluded.rarity,
  data_source=excluded.data_source,
  edition_type=excluded.edition_type,
  verification_status=excluded.verification_status,
  production_status=excluded.production_status,
  status_checked_at=excluded.status_checked_at,
  description=excluded.description,
  description_it=excluded.description_it,
  updated_at=now();

-- Provenance refinements.
insert into public.release_sources
  (id,release_id,source_type,source_url,verified_fields,checked_at,notes)
select gen_random_uuid(),'fe19ba66-afdf-579b-97b1-0056f354271a','official_catalog_pdf',
       'https://d7z22c0gz59ng.cloudfront.net/cms/japan/mini4wd/jr_news/jr_news11/pdf/000127.pdf',
       array['itemNumber','editionName'],date '2026-09-21',
       'Tamiya Jr News identifies ITEM 94772 as the Avante Mk.III Competition Pack.'
where not exists (
  select 1 from public.release_sources
  where release_id='fe19ba66-afdf-579b-97b1-0056f354271a'
    and source_url='https://d7z22c0gz59ng.cloudfront.net/cms/japan/mini4wd/jr_news/jr_news11/pdf/000127.pdf'
);

insert into public.release_sources
  (id,release_id,source_type,source_url,verified_fields,checked_at,notes)
select gen_random_uuid(),'fe19ba66-afdf-579b-97b1-0056f354271a','trusted_secondary',
       'https://www.tea-league.com/mt/tea/archives/2010/11/mkiii_11.html',
       array['itemNumber','releaseDate','releaseYear','editionName','chassis'],date '2026-09-21',
       'Contemporary report documents ITEM 94772 and 2010-11-13 release.'
where not exists (
  select 1 from public.release_sources
  where release_id='fe19ba66-afdf-579b-97b1-0056f354271a'
    and source_url='https://www.tea-league.com/mt/tea/archives/2010/11/mkiii_11.html'
);

insert into public.release_sources
  (id,release_id,source_type,source_url,verified_fields,checked_at,notes)
select gen_random_uuid(),'fe19ba66-afdf-579b-97b1-0056f354271a','trusted_secondary',
       'https://www.1999.co.jp/10127350',
       array['itemNumber','barcodeJAN'],date '2026-09-21',
       'HobbySearch corroborates JAN 4950344947720.'
where not exists (
  select 1 from public.release_sources
  where release_id='fe19ba66-afdf-579b-97b1-0056f354271a'
    and source_url='https://www.1999.co.jp/10127350'
);

insert into public.release_sources
  (id,release_id,source_type,source_url,verified_fields,checked_at,notes)
select gen_random_uuid(),'e31c9f48-a776-564a-a496-63771e4a4f9d','official_manufacturer',
       'https://www.tamiyausa.com/shop/132-pro/jr-avante-mkiii-white-special-2/',
       array['itemNumber','productionStatus'],date '2026-09-21',
       'Official Tamiya USA page marks the 95469 White Special discontinued.'
where not exists (
  select 1 from public.release_sources
  where release_id='e31c9f48-a776-564a-a496-63771e4a4f9d'
    and source_url='https://www.tamiyausa.com/shop/132-pro/jr-avante-mkiii-white-special-2/'
);

insert into public.release_sources
  (id,release_id,source_type,source_url,verified_fields,checked_at,notes)
select gen_random_uuid(),'c91957f4-907f-5f1a-9a49-faeddc3abd8d','official_manufacturer',
       'https://www.tamiya.com/japan/products/18662/index.html',
       array['itemNumber','barcodeJAN','chassis','releaseDate','releaseYear','editionName','productionStatus'],
       date '2026-09-21','Current official Tamiya Japan product page for ITEM 18662.'
where not exists (
  select 1 from public.release_sources
  where release_id='c91957f4-907f-5f1a-9a49-faeddc3abd8d'
    and source_url='https://www.tamiya.com/japan/products/18662/index.html'
);

insert into public.release_sources
  (id,release_id,source_type,source_url,verified_fields,checked_at,notes)
select gen_random_uuid(),'1c89e3ac-33c5-5079-98e7-7d7165c982d9','official_manufacturer',
       'https://pf.kakao.com/_xbXxcxkj/113813574',
       array['itemNumber','releaseDate','releaseYear','editionName','chassis','productionStatus'],
       date '2026-09-21',
       'Official Tamiya Korea channel announces nationwide release on 2026-07-04 and identifies the Korea-exclusive ITEM 92470.'
where not exists (
  select 1 from public.release_sources
  where release_id='1c89e3ac-33c5-5079-98e7-7d7165c982d9'
    and source_url='https://pf.kakao.com/_xbXxcxkj/113813574'
);

insert into public.release_sources
  (id,release_id,source_type,source_url,verified_fields,checked_at,notes)
select gen_random_uuid(),'1c89e3ac-33c5-5079-98e7-7d7165c982d9','official_manufacturer',
       'https://tamiya.hk/product/tamiya-92470-1-32-mini-4wd-avante-mk-iii-fighting-nero-tamiya-korea-mini-4wd-cup-2026-ms-chassis/',
       array['itemNumber','editionName','chassis'],date '2026-09-21',
       'Tamiya Hong Kong exact product page corroborates ITEM 92470 and MS chassis.'
where not exists (
  select 1 from public.release_sources
  where release_id='1c89e3ac-33c5-5079-98e7-7d7165c982d9'
    and source_url='https://tamiya.hk/product/tamiya-92470-1-32-mini-4wd-avante-mk-iii-fighting-nero-tamiya-korea-mini-4wd-cup-2026-ms-chassis/'
);

-- Exact image audit. Replace each audited Release image set atomically.
delete from public.release_images
where release_id in (
 '497455cb-838d-5430-97dd-ae0be52e69e4',
 '86763fe4-bfc0-551e-8541-c3fc9c2442b7',
 '921c4346-c48a-5a36-9438-65c9e4781107',
 'f66b9e6e-f7e5-57f2-8395-10125a0ae96c',
 'e07a5f39-d476-54c5-a509-4fb3ffb1a0ec',
 '8e01ee97-26ad-5c82-a569-b74332d59617',
 '3495bf78-89ab-57c4-84fc-f6f300c85a4e',
 '9d9d9015-81e5-5388-9d36-3e8b3b223b54',
 'fe19ba66-afdf-579b-97b1-0056f354271a',
 '03b51f02-a25d-5b8c-9e5e-0da79a34acfc',
 '68be3b41-30a7-55be-8cd9-f741193ce595',
 '3ba49f54-21c9-532d-a34a-7b9e38668a6d',
 'cc1fb7fa-67db-5303-9514-80b9705fe732',
 'e31c9f48-a776-564a-a496-63771e4a4f9d',
 'c91957f4-907f-5f1a-9a49-faeddc3abd8d',
 '7fbd00c9-2226-5d71-bca6-8fe9d6e4949b',
 '65d43c3e-a25b-5d0b-9c16-7b19ae23cac0',
 '97902a92-3b57-5052-a417-ef6eb734652c'
);

insert into public.release_images (id,release_id,url,position) values
(gen_random_uuid(),'497455cb-838d-5430-97dd-ae0be52e69e4','https://www.tamiya.com/japan_contents/img/usr/item/1/18626/18626_1.jpg',0),
(gen_random_uuid(),'86763fe4-bfc0-551e-8541-c3fc9c2442b7','https://www.tamiya.com/japan_contents/img/usr/item/1/18627/18627_1.jpg',0),
(gen_random_uuid(),'921c4346-c48a-5a36-9438-65c9e4781107','https://www.tamiya.com/japan_contents/img/usr/item/9/94673/94673_1.jpg',0),
(gen_random_uuid(),'f66b9e6e-f7e5-57f2-8395-10125a0ae96c','https://www.tamiya.com/japan_contents/img/usr/item/9/94674/94674_1.jpg',0),
(gen_random_uuid(),'e07a5f39-d476-54c5-a509-4fb3ffb1a0ec','https://www.tamiya.com/japan_contents/img/usr/item/9/94692/94692_1.jpg',0),
(gen_random_uuid(),'8e01ee97-26ad-5c82-a569-b74332d59617','https://www.tamiya.com/japan_contents/img/usr/item/9/94715/94715_1.jpg',0),
(gen_random_uuid(),'3495bf78-89ab-57c4-84fc-f6f300c85a4e','https://www.tamiya.com/japan_contents/img/usr/item/9/94777/94777_1.jpg',0),
(gen_random_uuid(),'9d9d9015-81e5-5388-9d36-3e8b3b223b54','https://www.tamiya.com/japan_contents/img/usr/item/9/94741/94741_1.jpg',0),
(gen_random_uuid(),'fe19ba66-afdf-579b-97b1-0056f354271a','https://www.tamiya.com/japan_contents/img/usr/item/9/94772/94772_1.jpg',0),
(gen_random_uuid(),'03b51f02-a25d-5b8c-9e5e-0da79a34acfc','https://www.tamiya.com/japan_contents/img/usr/item/9/94951/94951_1.jpg',0),
(gen_random_uuid(),'68be3b41-30a7-55be-8cd9-f741193ce595','https://www.tamiya.com/japan_contents/img/usr/item/9/95087/95087_1.jpg',0),
(gen_random_uuid(),'3ba49f54-21c9-532d-a34a-7b9e38668a6d','https://www.tamiya.com/japan_contents/img/usr/item/9/95425/95425_1.jpg',0),
(gen_random_uuid(),'cc1fb7fa-67db-5303-9514-80b9705fe732','https://www.tamiya.com/japan_contents/img/usr/item/9/95464/95464_1.jpg',0),
(gen_random_uuid(),'e31c9f48-a776-564a-a496-63771e4a4f9d','https://www.tamiya.com/japan_contents/img/usr/item/9/95469/95469_1.jpg',0),
(gen_random_uuid(),'c91957f4-907f-5f1a-9a49-faeddc3abd8d','https://www.tamiya.com/japan_contents/img/usr/item/1/18662/18662_1.jpg',0),
(gen_random_uuid(),'7fbd00c9-2226-5d71-bca6-8fe9d6e4949b','https://hongta.co.kr/web/product/big/202012/3f6f72c83b663c53646d8faa2966c8ed.jpg',0),
(gen_random_uuid(),'65d43c3e-a25b-5d0b-9c16-7b19ae23cac0','https://hongta.co.kr/web/product/big/202107/86f8189d1fb3e647fa150f3fa7512456.jpg',0),
(gen_random_uuid(),'97902a92-3b57-5052-a417-ef6eb734652c','https://i0.wp.com/m4dtang.com/wp-content/uploads/2021/11/92430_7.jpg?fit=624%2C378&ssl=1',0);

-- Honest image gaps: no sibling image is substituted.
update public.product_releases
set notes=concat_ws(' ',notes,'Exact image intentionally unresolved after the 2026-09-21 Master audit; TrackDash shows the placeholder instead of another Avante Mk.III variant.'),
    updated_at=now()
where id in (
 'ee0c66c6-0d58-5ee5-ae20-942966da8129',
 '0a386324-1815-5d3e-addb-7e583d3489d6',
 '5fdf8efd-46c1-5cff-9a61-6b8ee2b2b2af',
 'f308c6fb-af67-5f03-b87b-7c3b947d9dfb',
 '805c2619-0c0c-5aa1-adc5-df25cafe5c8f',
 '1c89e3ac-33c5-5079-98e7-7d7165c982d9'
);

-- Enroll and enqueue the newly added 92470. Existing family jobs were already
-- enrolled by 0131 and remain untouched.
select public.trackdash_enroll_release_market_scans('1c89e3ac-33c5-5079-98e7-7d7165c982d9'::uuid);
select public.trackdash_enqueue_market_recompute('1c89e3ac-33c5-5079-98e7-7d7165c982d9'::uuid,'new_complete_unbuilt');

commit;
