-- Vintage 100 Pilot — P2 mid-era Racing Mini 4WD foundation.
--
-- Adds five missing Products and fifteen exact Releases:
--   18017 Rising Bird      — 1989 original + 2007 reissue
--   18018 Vanquish Jr.     — 1989 original + 18049 VS + 18062 RS 2011 + 18062 RS 2013
--   18020 Saint Dragon Jr. — 1989 original + 2012 reissue + 18029 Ricky + 18071 Premium
--   18021 Terra Scorcher   — 1989 original + 18050 VS + 18064 RS
--   18024 Winning Bird     — 1990 original + 2007 reissue
--
-- Also relies on Type 4 being a first-class app chassis for Saint Dragon Ricky.
-- No market prices, sold evidence, trends, liquidity or R3 signals are created.

insert into products (
  id, category_id, brand_id, slug, canonical_item_number, name, japanese_name,
  series, chassis, original_release_year, rarity, description, canonical_release_id
) values
  ('10769cf5-314c-54ad-b33a-94b7335c14fd','cd755fcb-2bc5-5975-8ec0-f45e7df891cc','382feca9-48e9-5144-a92d-41f77fb7e438','rising-bird-18017',NULL,'Rising Bird','ライジング・バード','Racing Mini 4WD',NULL,NULL,'Uncommon','Racing Mini 4WD introduced in 1989 on the Type 3 chassis, with a later 2007 reissue using the same item number.',NULL),
  ('50142ae6-ab73-5912-bae3-36f363dac0d2','cd755fcb-2bc5-5975-8ec0-f45e7df891cc','382feca9-48e9-5144-a92d-41f77fb7e438','vanquish-jr-18018',NULL,'Vanquish Jr.','バンキッシュJr.','Racing Mini 4WD',NULL,NULL,'Uncommon','Vanquish-derived Racing Mini 4WD family spanning the original Type 2 kit, a VS chassis revival and later RS occurrences.',NULL),
  ('ac8ce928-eb4f-52e7-adc0-adb38e38bd4a','cd755fcb-2bc5-5975-8ec0-f45e7df891cc','382feca9-48e9-5144-a92d-41f77fb7e438','saint-dragon-jr-18020',NULL,'Saint Dragon Jr.','セイントドラゴンJr.','Racing Mini 4WD',NULL,NULL,'Uncommon','Dragon-series Racing Mini 4WD with original Type 3, Ricky Type 4, modern Type 3 reissue and VS Premium occurrences kept distinct.',NULL),
  ('0131ea3c-8d80-5489-ad4d-bd3caf61b1e5','cd755fcb-2bc5-5975-8ec0-f45e7df891cc','382feca9-48e9-5144-a92d-41f77fb7e438','terra-scorcher-jr-18021',NULL,'Terra Scorcher Jr.','スコーチャーJr.','Racing Mini 4WD',NULL,NULL,'Uncommon','Scorcher family spanning the original Type 2 machine, a 2003 VS revival and the later Super II RS version.',NULL),
  ('b0589404-18c6-5291-941a-5d548b482703','cd755fcb-2bc5-5975-8ec0-f45e7df891cc','382feca9-48e9-5144-a92d-41f77fb7e438','winning-bird-18024',NULL,'Winning Bird','ウイニングバード','Racing Mini 4WD',NULL,NULL,'Uncommon','Type 3 Racing Mini 4WD from 1990, later reissued in 2007 under the same ITEM 18024 identity.',NULL)
on conflict (id) do nothing;

insert into product_releases (
  id, product_id, item_number, release_type, edition_name, release_year,
  release_date, chassis, notes, discontinued, is_original, rarity,
  data_source, edition_type, verification_status, production_status
) values
  ('9db74896-9b0d-5fb6-aaf8-6a55b3d1bcb9','10769cf5-314c-54ad-b33a-94b7335c14fd','18017','Original','Rising Bird — 1989 Original',1989,NULL,'Type 3','Official Tamiya historical material identifies ITEM 18017 Rising Bird as a Type 3 release from 1989. Exact day is intentionally not inferred from secondary chronology.',false,true,NULL,'manual','original','verified','unknown'),
  ('9cf118ce-bca6-537a-b242-8882d2a8e69e','10769cf5-314c-54ad-b33a-94b7335c14fd','18017','Reissue','Rising Bird — 2007 Reissue',2007,'2007-03-24','Type 3','Official Tamiya product page dates the 18017 Type 3 reissue to 24 March 2007. Same item number as the 1989 original, therefore a distinct TrackDash Release.',false,false,NULL,'manual','reissue','verified','unknown'),

  ('4b972969-2fb6-5ee4-b5d6-52c3080f671d','50142ae6-ab73-5912-bae3-36f363dac0d2','18018','Original','Vanquish Jr. — 1989 Original',1989,NULL,'Type 2','Official Tamiya product identity confirms ITEM 18018 / Type 2; Tamiya release-month archive places the historical release in July 1989. Exact day is left unset.',false,true,NULL,'manual','original','verified','unknown'),
  ('dd1f841f-11e0-50eb-b441-7a954ed2f9c9','50142ae6-ab73-5912-bae3-36f363dac0d2','18049','Chassis Variant','Vanquish Jr. — VS Chassis',2003,NULL,'VS','Official Tamiya catalog/archive identifies ITEM 18049 Vanquish Jr. on VS chassis in the January 2003 release block. Exact day is left unset.',false,false,NULL,'manual','special','verified','unknown'),
  ('4224e201-17d4-5cf7-af60-cbd618daa4bc','50142ae6-ab73-5912-bae3-36f363dac0d2','18062','Reissue','Vanquish RS — 2011 Initial Release',2011,'2011-07-16','VS','Contemporary specialist coverage quoting Tamiya July 2011 new-product information dates the initial 18062 Vanquish RS to 16 July 2011. A later 2013 occurrence is represented separately.',false,false,NULL,'manual','reissue','partial','unknown'),
  ('dbc4370d-bcbb-5939-aaf3-7138f4323248','50142ae6-ab73-5912-bae3-36f363dac0d2','18062','Reissue','Vanquish RS — 2013 Reissue',2013,'2013-11-21','VS','Tamiya official archive records ITEM 18062 with a 21 November 2013 release date. TrackDash keeps it separate from the documented 2011 initial RS occurrence.',false,false,NULL,'manual','reissue','verified','unknown'),

  ('82e3f1b1-5f77-5c70-8069-bd96b8d2a554','ac8ce928-eb4f-52e7-adc0-adb38e38bd4a','18020','Original','Saint Dragon Jr. — 1989 Original',1989,NULL,'Type 3','Official Tamiya identity confirms ITEM 18020 / Type 3. Tamiya historical month archive places the item in the October 1989 block; exact day remains unset.',false,true,NULL,'manual','original','verified','unknown'),
  ('51cfc7e0-e939-524d-8eb4-71e054d62431','ac8ce928-eb4f-52e7-adc0-adb38e38bd4a','18020','Reissue','Saint Dragon Jr. — 2012 Reissue',2012,'2012-07-21','Type 3','Official Tamiya page dates the Type 3 reissue of ITEM 18020 to 21 July 2012. Same item number as the original, so it is a distinct Release.',false,false,NULL,'manual','reissue','verified','unknown'),
  ('65a0a5e0-c8e9-5492-9776-52e70ff0f72f','ac8ce928-eb4f-52e7-adc0-adb38e38bd4a','18029','Special Edition','Saint Dragon Jr. — Ricky''s Special',1990,NULL,'Type 4','Official Tamiya page confirms ITEM 18029 Ricky''s Special and Type 4 chassis. The 1990 year is retained from specialist chronology; exact day remains unset.',false,false,NULL,'manual','special','partial','unknown'),
  ('9f9edc8e-0da7-580b-9d78-53161ded3218','ac8ce928-eb4f-52e7-adc0-adb38e38bd4a','18071','Premium','Saint Dragon Premium — VS Chassis',2012,'2012-05-26','VS','Official Tamiya Premium version on VS chassis, released 26 May 2012.',false,false,NULL,'manual','premium','verified','unknown'),

  ('6dec9906-e5ca-52f8-9b0b-808123fc2dbc','0131ea3c-8d80-5489-ad4d-bd3caf61b1e5','18021','Original','Terra Scorcher Jr. — 1989 Original',1989,NULL,'Type 2','Official Tamiya page verifies ITEM 18021 / Type 2. Historical 1989 dating is supported by specialist chronology and remains partial until a primary historical date source is found.',false,true,NULL,'manual','original','partial','unknown'),
  ('2376aca6-2bed-51fa-9444-f65d00bfe239','0131ea3c-8d80-5489-ad4d-bd3caf61b1e5','18050','Chassis Variant','Terra Scorcher Jr. — VS Chassis',2003,NULL,'VS','Official Tamiya identity and January 2003 archive establish ITEM 18050 as the VS-chassis revival. Exact day remains unset.',false,false,NULL,'manual','special','verified','unknown'),
  ('e5b3e302-10b7-5ceb-9253-6d104fce3f31','0131ea3c-8d80-5489-ad4d-bd3caf61b1e5','18064','Reissue','Terra Scorcher RS — Super II Chassis',2011,'2011-10-29','Super II','Official Tamiya RS version on Super II chassis, released 29 October 2011.',false,false,NULL,'manual','reissue','verified','unknown'),

  ('e14f4987-f9bd-53fc-976f-d2bdc611cc78','b0589404-18c6-5291-941a-5d548b482703','18024','Original','Winning Bird — 1990 Original',1990,NULL,'Type 3','Official Tamiya historical retrospective identifies ITEM 18024 / Type 3 as a 1990 release. Exact original day remains unset.',false,true,NULL,'manual','original','verified','unknown'),
  ('3a269f38-8a12-5d24-a42a-4d7c01bfc9e7','b0589404-18c6-5291-941a-5d548b482703','18024','Reissue','Winning Bird — 2007 Reissue',2007,'2007-03-24','Type 3','Official Tamiya page dates the ITEM 18024 Type 3 reissue to 24 March 2007. Same item number as the 1990 original, therefore kept as a separate Release.',false,false,NULL,'manual','reissue','verified','unknown')
on conflict (id) do nothing;

update products set canonical_release_id='9db74896-9b0d-5fb6-aaf8-6a55b3d1bcb9' where id='10769cf5-314c-54ad-b33a-94b7335c14fd';
update products set canonical_release_id='4b972969-2fb6-5ee4-b5d6-52c3080f671d' where id='50142ae6-ab73-5912-bae3-36f363dac0d2';
update products set canonical_release_id='82e3f1b1-5f77-5c70-8069-bd96b8d2a554' where id='ac8ce928-eb4f-52e7-adc0-adb38e38bd4a';
update products set canonical_release_id='6dec9906-e5ca-52f8-9b0b-808123fc2dbc' where id='0131ea3c-8d80-5489-ad4d-bd3caf61b1e5';
update products set canonical_release_id='e14f4987-f9bd-53fc-976f-d2bdc611cc78' where id='b0589404-18c6-5291-941a-5d548b482703';

insert into release_sources (id,release_id,source_type,source_url,verified_fields,checked_at,notes) values
  ('dfc05cf4-2446-5363-8699-439655116a69','9db74896-9b0d-5fb6-aaf8-6a55b3d1bcb9','official_archive','https://www.tamiya.com/cms/japan/mini4wd/jr_news/jr_news16/pdf/000191.pdf',array['itemNumber','editionName','releaseYear','chassis']::text[],'2026-09-15',NULL),
  ('89c91596-f6fc-53cd-819e-d0009eac1a4d','9cf118ce-bca6-537a-b242-8882d2a8e69e','official_manufacturer','https://www.tamiya.com/japan/products/18017/index.html',array['itemNumber','editionName','releaseYear','releaseDate','chassis']::text[],'2026-09-15',NULL),

  ('d7d24606-98cd-572d-a5a0-8c60db2d6934','4b972969-2fb6-5ee4-b5d6-52c3080f671d','official_manufacturer','https://www.tamiya.com/japan/products/18018/index.html',array['itemNumber','editionName','chassis']::text[],'2026-09-15',NULL),
  ('cd0ab055-c0e4-5285-a858-2cd7a82a130f','4b972969-2fb6-5ee4-b5d6-52c3080f671d','official_archive','https://www.tamiya.com/japan/newitems_month/list.html?current=198907',array['releaseYear']::text[],'2026-09-15','Official Tamiya archive places ITEM 18018 in July 1989.'),
  ('e6a06596-b59d-5a72-9cb0-4c0f2f88d93e','dd1f841f-11e0-50eb-b441-7a954ed2f9c9','official_manufacturer','https://www.tamiya.com/japan/products/18049/index.html',array['itemNumber','editionName','chassis']::text[],'2026-09-15',NULL),
  ('45edf815-3e19-5c9c-95a9-2038a454a67a','dd1f841f-11e0-50eb-b441-7a954ed2f9c9','official_archive','https://www.tamiya.com/japan/newitems_month/list.html?current=200301',array['releaseYear']::text[],'2026-09-15','Tamiya archive lists ITEM 18049 in January 2003.'),
  ('0af4465f-5842-5e7e-81e9-94dbb01ea689','4224e201-17d4-5cf7-af60-cbd618daa4bc','official_manufacturer','https://www.tamiya.com/japan/products/product_info_ex.html?genre_item=mini4wd_chassis_vs%2Cmachine_kit',array['itemNumber','editionName','chassis']::text[],'2026-09-15',NULL),
  ('66a5b33f-ff5a-5e66-af52-a9354a7b745b','4224e201-17d4-5cf7-af60-cbd618daa4bc','trusted_secondary','https://www.tea-league.com/mt/tea/archives/2011/06/20117tzx.html',array['releaseYear','releaseDate']::text[],'2026-09-15','Contemporary report reproduces Tamiya July 2011 launch schedule for ITEM 18062.'),
  ('c063ba19-4ecc-5e55-8ad9-258dc43daba2','dbc4370d-bcbb-5939-aaf3-7138f4323248','official_archive','https://tamiya.com/japan/newitems_month/list.html?current=201107&genre_item=30',array['itemNumber','editionName','releaseYear','releaseDate','chassis']::text[],'2026-09-15','Official Tamiya archive surfaces ITEM 18062 with a 21 Nov 2013 release date.'),

  ('41f2dcf1-1e5a-5d2e-819b-d48b19191821','82e3f1b1-5f77-5c70-8069-bd96b8d2a554','official_manufacturer','https://www.tamiya.com/japan/products/18020/index.html',array['itemNumber','editionName','chassis']::text[],'2026-09-15',NULL),
  ('ae92253c-cc17-5aec-b310-0c4dc2201322','82e3f1b1-5f77-5c70-8069-bd96b8d2a554','official_archive','https://www.tamiya.com/japan/newitems_month/list.html?current=198910',array['releaseYear']::text[],'2026-09-15','Tamiya archive places ITEM 18020 in the October 1989 historical block.'),
  ('c154d7c8-1c86-54e6-9154-80b9689b2022','51cfc7e0-e939-524d-8eb4-71e054d62431','official_manufacturer','https://www.tamiya.com/japan/products/18020/index.html',array['itemNumber','editionName','releaseYear','releaseDate','chassis']::text[],'2026-09-15',NULL),
  ('5cac6418-9f06-5af3-8073-4dffd9994d83','65a0a5e0-c8e9-5492-9776-52e70ff0f72f','official_manufacturer','https://www.tamiya.com/japan/products/18029/index.html',array['itemNumber','editionName','chassis']::text[],'2026-09-15',NULL),
  ('cdf80a1e-719b-53c7-aea8-a6b499cc164f','65a0a5e0-c8e9-5492-9776-52e70ff0f72f','trusted_secondary','https://mini-4wd.fandom.com/wiki/Saint_Dragon_Jr.',array['releaseYear']::text[],'2026-09-15','Collector chronology dates Ricky''s Special to 1990; no exact day promoted.'),
  ('ef33dae9-0199-5adc-9764-877b46feccce','9f9edc8e-0da7-580b-9d78-53161ded3218','official_manufacturer','https://www.tamiya.com/japan/products/18071/index.html',array['itemNumber','editionName','releaseYear','releaseDate','chassis']::text[],'2026-09-15',NULL),

  ('483a8e5d-8451-53a8-9467-c558a2adb8cd','6dec9906-e5ca-52f8-9b0b-808123fc2dbc','official_manufacturer','https://www.tamiya.com/japan/products/18021/index.html',array['itemNumber','editionName','chassis']::text[],'2026-09-15',NULL),
  ('7a475c5c-36d8-5ed4-b91f-b2c080eac7fa','6dec9906-e5ca-52f8-9b0b-808123fc2dbc','trusted_secondary','https://mini-4wd.fandom.com/wiki/Terra_Scorcher_Jr.',array['releaseYear']::text[],'2026-09-15','Collector chronology dates the original to 1989; exact day is not promoted.'),
  ('78bf099c-a041-5c32-b4c4-43e0a4556606','2376aca6-2bed-51fa-9444-f65d00bfe239','official_manufacturer','https://www.tamiya.com/japan/products/18050/index.html',array['itemNumber','editionName','chassis']::text[],'2026-09-15',NULL),
  ('436c63e2-83f1-5227-aa03-617030b89eaf','2376aca6-2bed-51fa-9444-f65d00bfe239','official_archive','https://www.tamiya.com/japan/newitems_month/list.html?current=200301',array['releaseYear']::text[],'2026-09-15','Tamiya archive lists ITEM 18050 in January 2003.'),
  ('f06899d9-9639-5794-baf5-86c8662ef971','e5b3e302-10b7-5ceb-9253-6d104fce3f31','official_manufacturer','https://www.tamiya.com/japan/products/18064/index.html',array['itemNumber','editionName','releaseYear','releaseDate','chassis']::text[],'2026-09-15',NULL),

  ('b16a3b98-ffce-5691-9ecb-a05145cf163a','e14f4987-f9bd-53fc-976f-d2bdc611cc78','official_archive','https://www.tamiya.com/cms/japan/mini4wd/jr_news/jr_news16/pdf/000191.pdf',array['itemNumber','editionName','releaseYear','chassis']::text[],'2026-09-15',NULL),
  ('323c01a0-ef34-580e-be60-5de4a500d450','3a269f38-8a12-5d24-a42a-4d7c01bfc9e7','official_manufacturer','https://www.tamiya.com/japan/products/18024/index.html',array['itemNumber','editionName','releaseYear','releaseDate','chassis']::text[],'2026-09-15',NULL)
on conflict (id) do update set
  release_id=excluded.release_id,
  source_type=excluded.source_type,
  source_url=excluded.source_url,
  verified_fields=excluded.verified_fields,
  checked_at=excluded.checked_at,
  notes=excluded.notes;
