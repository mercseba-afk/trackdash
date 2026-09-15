-- Vintage 100 Pilot — P2 second wave.
-- Adds five missing historical Racing Mini 4WD Products and separates known
-- same-item-number commercial occurrences. No market/R3 data is created.

insert into products (
  id, category_id, brand_id, slug, canonical_item_number, name, japanese_name,
  series, chassis, original_release_year, rarity, description, canonical_release_id
) values
  ('10769cf5-314c-54ad-b33a-94b7335c14fd','cd755fcb-2bc5-5975-8ec0-f45e7df891cc','382feca9-48e9-5144-a92d-41f77fb7e438','rising-bird-18017',NULL,'Rising Bird','ライジング・バード','Racing Mini 4WD',NULL,NULL,'Uncommon','Racing Mini 4WD released in 1989 on the Type 3 chassis, later reissued under the same ITEM 18017 in 2007.',NULL),
  ('50142ae6-ab73-5912-bae3-36f363dac0d2','cd755fcb-2bc5-5975-8ec0-f45e7df891cc','382feca9-48e9-5144-a92d-41f77fb7e438','vanquish-jr-18018',NULL,'Vanquish Jr.','バンキッシュJr.','Racing Mini 4WD',NULL,NULL,'Uncommon','Racing Mini 4WD adaptation of the Vanquish R/C buggy, released in 1989 on the Type 2 chassis.',NULL),
  ('ac8ce928-eb4f-52e7-adc0-adb38e38bd4a','cd755fcb-2bc5-5975-8ec0-f45e7df891cc','382feca9-48e9-5144-a92d-41f77fb7e438','saint-dragon-jr-18020',NULL,'Saint Dragon Jr.','セイントドラゴンJr.','Racing Mini 4WD',NULL,NULL,'Uncommon','Dragon-series Racing Mini 4WD originally released in 1989 on the Type 3 chassis, with a later standard reissue under the same item number.',NULL),
  ('0131ea3c-8d80-5489-ad4d-bd3caf61b1e5','cd755fcb-2bc5-5975-8ec0-f45e7df891cc','382feca9-48e9-5144-a92d-41f77fb7e438','terra-scorcher-jr-18021',NULL,'Terra Scorcher Jr.','スコーチャーJr.','Racing Mini 4WD',NULL,NULL,'Uncommon','Late-1989 Racing Mini 4WD based on the Terra Scorcher R/C buggy, using the Type 2 chassis.',NULL),
  ('b0589404-18c6-5291-941a-5d548b482703','cd755fcb-2bc5-5975-8ec0-f45e7df891cc','382feca9-48e9-5144-a92d-41f77fb7e438','winning-bird-18024',NULL,'Winning Bird','ウイニングバード','Racing Mini 4WD',NULL,NULL,'Uncommon','Racing Mini 4WD originally released in 1990 on the Type 3 chassis and reissued under the same ITEM 18024 in 2007.',NULL)
on conflict (id) do nothing;

insert into product_releases (
  id, product_id, item_number, release_type, edition_name, release_year,
  release_date, chassis, notes, discontinued, is_original, rarity,
  data_source, edition_type, verification_status, production_status
) values
  ('9db74896-9b0d-5fb6-aaf8-6a55b3d1bcb9','10769cf5-314c-54ad-b33a-94b7335c14fd','18017','Original','Rising Bird — 1989 Original',1989,NULL,'Type 3','Tamiya historical Jr. News identifies ITEM 18017 / Type 3 as a 1989 release. A 2007 occurrence uses the same item number.',false,true,NULL,'manual','original','verified','unknown'),
  ('9cf118ce-bca6-537a-b242-8882d2a8e69e','10769cf5-314c-54ad-b33a-94b7335c14fd','18017','Reissue','Rising Bird — 2007 Reissue',2007,'2007-03-24','Type 3','Official Tamiya page explicitly dates ITEM 18017 to 24 March 2007.',false,false,NULL,'manual','reissue','verified','unknown'),
  ('4b972969-2fb6-5ee4-b5d6-52c3080f671d','50142ae6-ab73-5912-bae3-36f363dac0d2','18018','Original','Vanquish Jr. — 1989 Original',1989,NULL,'Type 2','Official Tamiya identity verifies ITEM 18018 / Type 2; the official release-month archive places it in July 1989.',false,true,NULL,'manual','original','verified','unknown'),
  ('82e3f1b1-5f77-5c70-8069-bd96b8d2a554','ac8ce928-eb4f-52e7-adc0-adb38e38bd4a','18020','Original','Saint Dragon Jr. — 1989 Original',1989,NULL,'Type 3','Official Tamiya identity verifies ITEM 18020 / Type 3. Historical specialist evidence places the original in October 1989; current Tamiya page is the 2012 occurrence.',false,true,NULL,'manual','original','partial','unknown'),
  ('51cfc7e0-e939-524d-8eb4-71e054d62431','ac8ce928-eb4f-52e7-adc0-adb38e38bd4a','18020','Reissue','Saint Dragon Jr. — 2012 Reissue',2012,'2012-07-21','Type 3','Official Tamiya page explicitly dates the ITEM 18020 reissue to 21 July 2012.',false,false,NULL,'manual','reissue','verified','unknown'),
  ('6dec9906-e5ca-52f8-9b0b-808123fc2dbc','0131ea3c-8d80-5489-ad4d-bd3caf61b1e5','18021','Original','Terra Scorcher Jr. — 1989 Original',1989,NULL,'Type 2','Official Tamiya identity verifies ITEM 18021 / Type 2. Historical specialist evidence places the original in November 1989.',false,true,NULL,'manual','original','partial','unknown'),
  ('e14f4987-f9bd-53fc-976f-d2bdc611cc78','b0589404-18c6-5291-941a-5d548b482703','18024','Original','Winning Bird — 1990 Original',1990,NULL,'Type 3','Tamiya historical Jr. News identifies ITEM 18024 / Type 3 as a 1990 release. A 2007 occurrence uses the same item number.',false,true,NULL,'manual','original','verified','unknown'),
  ('3a269f38-8a12-5d24-a42a-4d7c01bfc9e7','b0589404-18c6-5291-941a-5d548b482703','18024','Reissue','Winning Bird — 2007 Reissue',2007,'2007-03-24','Type 3','Official Tamiya page explicitly dates ITEM 18024 to 24 March 2007.',false,false,NULL,'manual','reissue','verified','unknown')
on conflict (id) do nothing;

update products set canonical_release_id='9db74896-9b0d-5fb6-aaf8-6a55b3d1bcb9' where id='10769cf5-314c-54ad-b33a-94b7335c14fd';
update products set canonical_release_id='4b972969-2fb6-5ee4-b5d6-52c3080f671d' where id='50142ae6-ab73-5912-bae3-36f363dac0d2';
update products set canonical_release_id='82e3f1b1-5f77-5c70-8069-bd96b8d2a554' where id='ac8ce928-eb4f-52e7-adc0-adb38e38bd4a';
update products set canonical_release_id='6dec9906-e5ca-52f8-9b0b-808123fc2dbc' where id='0131ea3c-8d80-5489-ad4d-bd3caf61b1e5';
update products set canonical_release_id='e14f4987-f9bd-53fc-976f-d2bdc611cc78' where id='b0589404-18c6-5291-941a-5d548b482703';

insert into release_sources (id, release_id, source_type, source_url, verified_fields, checked_at, notes) values
  ('794e9ab3-6cee-53ed-b8c0-cbb8eae47812','9db74896-9b0d-5fb6-aaf8-6a55b3d1bcb9','official_catalog_pdf','https://www.tamiya.com/cms/japan/mini4wd/jr_news/jr_news16/pdf/000191.pdf',array['itemNumber','editionName','chassis','releaseYear']::text[],'2026-09-15',NULL),
  ('d180363c-60c6-50fb-851a-44c88c0f617b','9cf118ce-bca6-537a-b242-8882d2a8e69e','official_manufacturer','https://www.tamiya.com/japan/products/18017/index.html',array['itemNumber','editionName','chassis','releaseYear','releaseDate']::text[],'2026-09-15',NULL),
  ('de162cc1-ad5f-5f4b-aa94-a97a39caf797','4b972969-2fb6-5ee4-b5d6-52c3080f671d','official_manufacturer','https://www.tamiya.com/japan/products/18018/index.html',array['itemNumber','editionName','chassis']::text[],'2026-09-15',NULL),
  ('4bece259-fbed-5ed1-a2b5-5681a693b338','4b972969-2fb6-5ee4-b5d6-52c3080f671d','official_archive','https://www.tamiya.com/japan/newitems_month/list.html?current=198907',array['releaseYear']::text[],'2026-09-15','Tamiya official archive lists ITEM 18018 in July 1989.'),
  ('57f65b9b-01ed-56ca-bdc4-eef7051bef76','82e3f1b1-5f77-5c70-8069-bd96b8d2a554','official_manufacturer','https://www.tamiya.com/japan/products/18020/index.html',array['itemNumber','editionName','chassis']::text[],'2026-09-15',NULL),
  ('aa0e575e-f096-55cb-bf60-55c88ff21035','82e3f1b1-5f77-5c70-8069-bd96b8d2a554','trusted_secondary','https://www.mini4wditalia.it/2022/05/20/racing-mini-4wd/',array['releaseYear']::text[],'2026-09-15','Historical Racing Mini 4WD catalog places the original Saint Dragon Jr. in October 1989.'),
  ('b6e9620e-1bd9-5ecc-9524-d1cd0961d5ae','51cfc7e0-e939-524d-8eb4-71e054d62431','official_manufacturer','https://www.tamiya.com/japan/products/18020/index.html',array['itemNumber','editionName','chassis','releaseYear','releaseDate']::text[],'2026-09-15',NULL),
  ('ed85fd47-dc3d-57c5-b7a8-49a43da09399','6dec9906-e5ca-52f8-9b0b-808123fc2dbc','official_manufacturer','https://www.tamiya.com/japan/products/18021/index.html',array['itemNumber','editionName','chassis']::text[],'2026-09-15',NULL),
  ('5727868c-042a-5d39-8c5b-82b9c2cd3523','6dec9906-e5ca-52f8-9b0b-808123fc2dbc','trusted_secondary','https://www.mini4wditalia.it/2022/05/20/racing-mini-4wd/',array['releaseYear']::text[],'2026-09-15','Historical Racing Mini 4WD catalog places Terra Scorcher Jr. in November 1989.'),
  ('a59259d4-7228-5917-b87c-e580f6360350','e14f4987-f9bd-53fc-976f-d2bdc611cc78','official_catalog_pdf','https://www.tamiya.com/cms/japan/mini4wd/jr_news/jr_news16/pdf/000191.pdf',array['itemNumber','editionName','chassis','releaseYear']::text[],'2026-09-15',NULL),
  ('1af54b7c-f72d-5b3f-b690-12e46b15caf3','3a269f38-8a12-5d24-a42a-4d7c01bfc9e7','official_manufacturer','https://www.tamiya.com/japan/products/18024/index.html',array['itemNumber','editionName','chassis','releaseYear','releaseDate']::text[],'2026-09-15',NULL)
on conflict (id) do update set release_id=excluded.release_id, source_type=excluded.source_type, source_url=excluded.source_url, verified_fields=excluded.verified_fields, checked_at=excluded.checked_at, notes=excluded.notes;
