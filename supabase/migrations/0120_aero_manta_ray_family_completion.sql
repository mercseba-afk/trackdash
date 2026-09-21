-- Aero Manta Ray family audit and Market Method v4 enrollment.
-- Identity is release-specific; uncertain production status remains unknown rather
-- than inferring "discontinued" from age or marketplace scarcity.
-- 94989/94991 keep release_date NULL because indexed historical sources disagree
-- on the exact December 2013 day.

insert into public.products (
  id, category_id, brand_id, slug, canonical_item_number, name, japanese_name,
  series, chassis, original_release_year, rarity, description, description_it,
  metadata, canonical_release_id
)
select
  'ecf91fb1-bf53-5201-a128-95edd99f3f71',
  c.id,
  b.id,
  'aero-manta-ray-18703',
  '18703',
  'Aero Manta Ray',
  'エアロ マンタレイ',
  'Aero',
  'AR',
  2013,
  'Uncommon',
  'Third model in Tamiya''s Mini 4WD REV line, introduced in 2013 on the AR chassis. TrackDash keeps the original, color specials, Japan Cup edition and later reissue as distinct Releases.',
  'Terzo modello della linea Mini 4WD REV Tamiya, introdotto nel 2013 su telaio AR. TrackDash separa l''originale dalle color special, dalla Japan Cup e dalla ristampa successiva.',
  jsonb_build_object('official_series','Mini 4WD REV','catalog_audit','2026-09-21'),
  null
from public.categories c
cross join public.brands b
where c.slug='mini4wd' and b.slug='tamiya'
on conflict (id) do update set
  category_id=excluded.category_id,
  brand_id=excluded.brand_id,
  slug=excluded.slug,
  canonical_item_number=excluded.canonical_item_number,
  name=excluded.name,
  japanese_name=excluded.japanese_name,
  series=excluded.series,
  chassis=excluded.chassis,
  original_release_year=excluded.original_release_year,
  rarity=excluded.rarity,
  description=excluded.description,
  description_it=excluded.description_it,
  metadata=excluded.metadata,
  updated_at=now();

insert into public.product_releases (
  id, product_id, item_number, release_type, edition_name, release_year,
  release_date, chassis, barcode_jan, color, country_market, notes,
  discontinued, is_original, rarity, data_source, edition_type,
  verification_status, production_status, status_checked_at,
  description, description_it
) values
(
  'bd0b1e12-3212-592f-ac56-5337760dcca5',
  'ecf91fb1-bf53-5201-a128-95edd99f3f71',
  '18703','Original','Aero Manta Ray (AR Chassis)',2013,date '2013-03-02',
  'AR','4950344064502','Blue / Gold Wheels',null,
  'Official Tamiya Japan identifies ITEM 18703 and the 2013-03-02 release date. The official Tamiya Shop currently lists the kit and confirms domestic JAN 4950344064502. International GTIN 4950344187034 is not stored as a second barcode because the TrackDash scanner derives ITEM 18703 from that standard Tamiya GTIN.',
  false,true,null,'audited_mixed','original','verified','active',now(),
  'Original 2013 Aero Manta Ray on AR chassis, the third Mini 4WD REV model.',
  'Aero Manta Ray originale del 2013 su telaio AR, terzo modello Mini 4WD REV.'
),
(
  '9dd1daac-5b43-5159-bf4b-59d40b03c1e8',
  'ecf91fb1-bf53-5201-a128-95edd99f3f71',
  '94972','Color Special','Aero Manta Ray White Special (AR Chassis)',2013,date '2013-09-28',
  'AR','4950344949724','Pearl White / Magenta',null,
  'First White Special. Japanese specialist archives record ITEM 94972, the 2013-09-28 release date and the pearl-white/magenta specification. JAN 4950344949724 is independently corroborated by Japanese retail metadata.',
  false,false,null,'audited_mixed','color_special','verified','unknown',null,
  'Original 2013 White Special on AR chassis.',
  'White Special originale del 2013 su telaio AR.'
),
(
  'cbfd7063-98e4-5f38-99a9-010c5d95e9c7',
  'ecf91fb1-bf53-5201-a128-95edd99f3f71',
  '94989','Color Special','Aero Manta Ray Black Metallic (AR Chassis)',2013,null,
  'AR','4950344963195','Black Metallic / Metallic Red',null,
  'Black Metallic special from 2013. Specialist retail metadata corroborates ITEM 94989 and JAN 4950344963195. Historical references place the release in December 2013, but TrackDash intentionally leaves the exact day unset because indexed sources do not agree at day level.',
  false,false,null,'audited_mixed','color_special','verified','unknown',null,
  '2013 Black Metallic special on AR chassis; exact release day intentionally unset.',
  'Black Metallic 2013 su telaio AR; giorno esatto di uscita lasciato intenzionalmente non valorizzato.'
),
(
  '5d2acd43-7593-59f4-a633-b0922ac9d0a6',
  'ecf91fb1-bf53-5201-a128-95edd99f3f71',
  '94991','Color Special','Aero Manta Ray Gold Metallic (AR Chassis)',2013,null,
  'AR','4950344963218','Gold Metallic',null,
  'Gold Metallic special from 2013. Japanese specialist metadata confirms ITEM 94991 and JAN 4950344963218. Historical references disagree at day level, so TrackDash keeps release_date unset.',
  false,false,null,'audited_mixed','color_special','verified','unknown',null,
  '2013 Gold Metallic special on AR chassis; exact release day intentionally unset.',
  'Gold Metallic 2013 su telaio AR; giorno esatto di uscita lasciato intenzionalmente non valorizzato.'
),
(
  '42f6de69-94c8-5282-b4b3-f8ad036ecea1',
  'ecf91fb1-bf53-5201-a128-95edd99f3f71',
  '95031','Japan Cup Edition','Aero Manta Ray Japan Cup 2014 Limited (AR Chassis)',2014,date '2014-07-19',
  'AR','4950344950317','Red / Dark Blue',null,
  'Japan Cup 2014 commemorative limited edition. Tamiya USA confirms ITEM 95031 and marks the release discontinued; Japanese specialist metadata corroborates release date 2014-07-19 and JAN 4950344950317.',
  true,false,null,'audited_mixed','japan_cup','verified','discontinued',now(),
  '2014 Japan Cup commemorative limited edition with red body and dark-blue AR chassis.',
  'Edizione limitata commemorativa Japan Cup 2014, con carrozzeria rossa e telaio AR blu scuro.'
),
(
  '90b8a376-2535-55b0-b5c8-4313eb8bb942',
  'ecf91fb1-bf53-5201-a128-95edd99f3f71',
  '95295','Reissue','Aero Manta Ray White Special (2017 Reissue)',2017,date '2017-01-21',
  'AR','4950344952953','Pearl White / Magenta',null,
  '2017 White Special release. Official Tamiya Japan confirms ITEM 95295, 2017-01-21 and the AR/pearl-white specification; Japanese retail metadata corroborates JAN 4950344952953. Production status stays unknown because a live product page alone does not prove current production.',
  false,false,null,'audited_mixed','reissue','verified','unknown',null,
  '2017 White Special release, kept distinct from ITEM 94972.',
  'White Special 2017, distinta dall''ITEM 94972.'
),
(
  '69ecb6cc-8907-5351-bf26-9400e0b43cc4',
  'ecf91fb1-bf53-5201-a128-95edd99f3f71',
  '95419','Color Special','Aero Manta Ray Black Special (AR Chassis)',2018,date '2018-10-27',
  'AR','4950344954193','Smoke / Fluorescent Orange',null,
  '2018 Black Special. Official Tamiya Japan confirms ITEM 95419 and 2018-10-27; Tamiya USA marks the release discontinued. Specialist retail metadata corroborates JAN 4950344954193.',
  true,false,null,'audited_mixed','color_special','verified','discontinued',now(),
  '2018 Black Special with smoke body and fluorescent-orange wheels on AR chassis.',
  'Black Special 2018 con carrozzeria smoke e ruote arancio fluorescente su telaio AR.'
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

update public.products
set
  canonical_release_id='bd0b1e12-3212-592f-ac56-5337760dcca5',
  canonical_item_number='18703',
  chassis='AR',
  original_release_year=2013,
  updated_at=now()
where id='ecf91fb1-bf53-5201-a128-95edd99f3f71';

insert into public.release_sources (
  id, release_id, source_type, source_url, verified_fields, checked_at, notes
) values
(
  'a03e6ec0-6c30-532b-a725-11a74c455af7','bd0b1e12-3212-592f-ac56-5337760dcca5',
  'official_manufacturer','https://www.tamiya.com/japan/products/18703/index.html',
  array['itemNumber','editionName','releaseDate','releaseYear','chassis'],date '2026-09-21',
  'Official Tamiya Japan product page for ITEM 18703.'
),
(
  'cf673d67-ba19-5137-808f-dd8e73b287ea','bd0b1e12-3212-592f-ac56-5337760dcca5',
  'official_manufacturer','https://store.shopping.yahoo.co.jp/tamiya/18703.html',
  array['barcodeJAN','itemNumber','productionStatus'],date '2026-09-21',
  'Official Tamiya Shop listing confirms JAN 4950344064502 and current official availability.'
),
(
  'a3e0ffde-7f42-5b1c-b291-9c7ba98852e0','9dd1daac-5b43-5159-bf4b-59d40b03c1e8',
  'trusted_secondary','https://www.suruga-ya.jp/product/detail/603036298',
  array['itemNumber','editionName','releaseDate','releaseYear','color'],date '2026-09-21',
  'Japanese specialist archive records ITEM 94972 and 2013-09-28 release.'
),
(
  '2899403a-6826-5537-ab85-286ae76cf1be','9dd1daac-5b43-5159-bf4b-59d40b03c1e8',
  'trusted_secondary','https://www.discovery-japan.me/category/select/pid/84930',
  array['barcodeJAN','itemNumber','color'],date '2026-09-21',
  'Japanese retail metadata corroborates JAN 4950344949724.'
),
(
  '93b65b8a-04a2-5dd3-90a7-fa2e200c5059','cbfd7063-98e4-5f38-99a9-010c5d95e9c7',
  'trusted_secondary','https://www.rcjaz.com/tamiya-94989-jr-aero-manta-ray-black-metallic-sp-ar-chassis-limited-p-90064801.html',
  array['barcodeJAN','itemNumber','editionName','chassis'],date '2026-09-21',
  'Specialist retailer corroborates ITEM 94989 and JAN 4950344963195.'
),
(
  'f49af71c-3e8e-5de3-ab38-95685015800a','cbfd7063-98e4-5f38-99a9-010c5d95e9c7',
  'trusted_secondary','https://mini-4wd.fandom.com/wiki/Aero_Manta_Ray',
  array['releaseYear','editionName','color'],date '2026-09-21',
  'Historical family reference corroborates the 2013 Black Metallic release; exact day is intentionally not asserted.'
),
(
  '96275880-c6e5-5fba-be0e-0f288c1d29a4','5d2acd43-7593-59f4-a633-b0922ac9d0a6',
  'trusted_secondary','https://www.suruga-ya.jp/kaitori/kaitori_detail/603046289',
  array['barcodeJAN','itemNumber','editionName'],date '2026-09-21',
  'Suruga-ya metadata records ITEM 94991 and JAN 4950344963218.'
),
(
  'c3c7fe06-f3e1-5538-a38d-b128f3dd3886','5d2acd43-7593-59f4-a633-b0922ac9d0a6',
  'trusted_secondary','https://mini-4wd.fandom.com/wiki/Aero_Manta_Ray',
  array['releaseYear','editionName','color'],date '2026-09-21',
  'Historical family reference corroborates the 2013 Gold Metallic release; exact day is intentionally not asserted.'
),
(
  '29fef25d-187f-55f1-84f4-15812259838d','42f6de69-94c8-5282-b4b3-f8ad036ecea1',
  'official_manufacturer','https://www.tamiyausa.com/shop/132-rev/jr-aero-manta-ray-japan-cup/',
  array['itemNumber','editionName','chassis','color','productionStatus'],date '2026-09-21',
  'Official Tamiya USA page confirms ITEM 95031 and marks it discontinued.'
),
(
  'ab32ca9d-8144-5f6f-a372-760d6ee90696','42f6de69-94c8-5282-b4b3-f8ad036ecea1',
  'trusted_secondary','https://www.kaitori-world.jp/products/detail/323832',
  array['barcodeJAN','itemNumber','releaseDate','releaseYear'],date '2026-09-21',
  'Japanese specialist metadata corroborates 2014-07-19 and JAN 4950344950317.'
),
(
  'ae89d5e9-dfa2-5029-a3f8-acef5266d004','90b8a376-2535-55b0-b5c8-4313eb8bb942',
  'official_manufacturer','https://www.tamiya.com/japan/products/95295/index.html',
  array['itemNumber','editionName','releaseDate','releaseYear','chassis','color'],date '2026-09-21',
  'Official Tamiya Japan product page.'
),
(
  '5a28fd60-8459-5392-ba06-cd8eb4685c7c','90b8a376-2535-55b0-b5c8-4313eb8bb942',
  'trusted_secondary','https://store.shopping.yahoo.co.jp/mannenya/4950344952953.html',
  array['barcodeJAN','itemNumber'],date '2026-09-21',
  'Japanese retail metadata corroborates JAN 4950344952953.'
),
(
  'dd57a4e3-87ae-5540-bb20-f4ba36f5470f','69ecb6cc-8907-5351-bf26-9400e0b43cc4',
  'official_manufacturer','https://www.tamiya.com/japan/products/95419/index.html',
  array['itemNumber','editionName','releaseDate','releaseYear','chassis','color'],date '2026-09-21',
  'Official Tamiya Japan product page.'
),
(
  'f4bc383e-ce13-5302-a16b-6313eeed23ff','69ecb6cc-8907-5351-bf26-9400e0b43cc4',
  'official_manufacturer','https://www.tamiyausa.com/shop/132-rev/jr-aero-manta-ray-black-sp-2/',
  array['itemNumber','editionName','productionStatus'],date '2026-09-21',
  'Official Tamiya USA page marks ITEM 95419 discontinued.'
),
(
  '5fde2afd-edd5-50fe-81ec-edee1d98b1ee','69ecb6cc-8907-5351-bf26-9400e0b43cc4',
  'trusted_secondary','https://www.plazajapan.com/4950344954193/',
  array['barcodeJAN','itemNumber'],date '2026-09-21',
  'Specialist retail metadata corroborates JAN 4950344954193.'
)
on conflict (id) do update set
  release_id=excluded.release_id,
  source_type=excluded.source_type,
  source_url=excluded.source_url,
  verified_fields=excluded.verified_fields,
  checked_at=excluded.checked_at,
  notes=excluded.notes;

insert into public.product_images (id, product_id, url, position) values
(
  '8aedb9af-b88f-5baf-b1f2-858f2a7dd577',
  'ecf91fb1-bf53-5201-a128-95edd99f3f71',
  'https://www.tamiya.com/japan_contents/img/usr/item/1/18703/18703_1.jpg',
  0
)
on conflict (id) do update set
  product_id=excluded.product_id,
  url=excluded.url,
  position=excluded.position;

insert into public.release_images (id, release_id, url, position) values
(
  'f3842bcf-7d24-5ae3-90bf-f6ffde99baec',
  'bd0b1e12-3212-592f-ac56-5337760dcca5',
  'https://www.tamiya.com/japan_contents/img/usr/item/1/18703/18703_1.jpg',
  0
),
(
  'dc6ce315-0de3-580f-b7cb-b7bfabb76900',
  '42f6de69-94c8-5282-b4b3-f8ad036ecea1',
  'https://www.tamiyausa.com/media/CACHE/images/products/jr-aero-manta-ray-japan-cup-2014-limited-edition-1-ef78/877d875180598b82f3a0bfb8f2541cbf.jpg',
  0
),
(
  '6283af52-ae48-5272-99eb-768be5b1c127',
  '90b8a376-2535-55b0-b5c8-4313eb8bb942',
  'https://www.tamiya.com/japan_contents/img/usr/item/1/95295/95295_1.jpg',
  0
),
(
  '95523028-1065-5a08-814e-99982e29b27e',
  '69ecb6cc-8907-5351-bf26-9400e0b43cc4',
  'https://www.tamiya.com/japan_contents/img/usr/item/1/95419/95419_1.jpg',
  0
)
on conflict (id) do update set
  release_id=excluded.release_id,
  url=excluded.url,
  position=excluded.position;

select public.trackdash_enroll_release_market_scans(r.id)
from public.product_releases r
where r.product_id='ecf91fb1-bf53-5201-a128-95edd99f3f71'
  and r.item_number is not null
  and btrim(r.item_number) <> '';
