-- Catalog Expansion Wave 1 -- new Product/Release rows + Neo-Tridagger correction.
--
-- Adds: DASH-X1 Proto-Emperor (2 releases), Avante Mk.III (7 releases),
-- Neo-Tridagger ZMC Carbon Special 2023 Reissue (1 new release). Corrects
-- in place (same ids, no DELETE): Neo-Tridagger ZMC original date/year and
-- replaces the unsupported Premium-2016 row with the real 2019 Carbon Special.
-- Full audit trail is in docs/CATALOG_AUDIT.md's Catalog Expansion Wave 1 section.
--
-- Updated post-approval: Avante Mk.III Azure Clear Special item 95464 has
-- both an initial release month (2010-09) and a distinct 2023-11-11 reissue,
-- so releaseSeedKey "7" records the reissue separately.
--
-- LIVE-SCHEMA PREFLIGHT FIX (2026-09-07): this migration was dry-run against
-- the actual production schema before application. Product seedKey/productCode
-- are app-layer identity/compatibility fields and are NOT database columns.
-- New products therefore use the real products table shape
-- (category_id/brand_id/slug/...) and begin with canonical_release_id NULL;
-- after their release rows exist, canonical_release_id is set and the existing
-- Catalog Model V2 trigger derives canonical_item_number/chassis/year.
-- Release rows explicitly persist is_original/notes/verification fields so the
-- database matches lib/data/products.ts rather than relying on unsafe defaults.
-- The existing Neo-Tridagger official source is upserted because its verified
-- field set was expanded in this pass.
--
-- No image rows here (see 0016). Deterministic, idempotent-safe, and no schema
-- change. 0000-0014 remain historical and untouched.

insert into products (
  id, category_id, brand_id, slug, canonical_item_number, name, japanese_name,
  series, chassis, original_release_year, rarity, description, canonical_release_id
) values
  (
    '1acf7850-c8a9-5627-b104-54db6e235ba2',
    'cd755fcb-2bc5-5975-8ec0-f45e7df891cc',
    '382feca9-48e9-5144-a92d-41f77fb7e438',
    'dash-x1-proto-emperor-dash-x1-proto-emperor',
    NULL,
    'DASH-X1 Proto-Emperor',
    'ダッシュX1・原始皇帝（プロトエンペラー）',
    'Dash! Yonkuro',
    NULL,
    NULL,
    'Rare',
    'Jin Kidoin''s machine, Yonkuro Hinomaru''s rival in Dash! Yonkuro. Later superseded in-story by Proto-Emperor ZX -- a distinct machine from that later Product in this catalog.',
    NULL
  ),
  (
    'de719716-e50a-5811-b99d-18bbb153b166',
    'cd755fcb-2bc5-5975-8ec0-f45e7df891cc',
    '382feca9-48e9-5144-a92d-41f77fb7e438',
    'avante-mk-iii-avante-mk3',
    NULL,
    'Avante Mk.III',
    'アバンテMk.III',
    'Avante',
    NULL,
    NULL,
    'Uncommon',
    'The third-generation Avante PRO racer, launched in Azure and Nero colourways on the new MS chassis. A long-running special-edition family across MS and MA chassis variants.',
    NULL
  )
on conflict (id) do nothing;

insert into product_releases (
  id, product_id, item_number, release_type, edition_name, release_year,
  release_date, chassis, color, notes, discontinued, is_original, rarity,
  data_source, edition_type, verification_status, production_status
) values
  ('d9b9392b-d149-52a2-b862-0eafc66af7ef', '9793fbe8-dcf7-51c9-9f45-185194a0bc92', '95508', 'Reissue', 'Neo-Tridagger ZMC Carbon Special (2023 Reissue)', 2023, '2023-08-12', 'Super II', 'Black', NULL, false, false, NULL, 'manual', 'reissue', 'verified', 'unknown'),
  ('0226dfa5-5e29-5557-b134-ddbad7682e28', '1acf7850-c8a9-5627-b104-54db6e235ba2', '18074', 'Premium', 'Dash-X1 Proto-Emperor Premium', 2013, '2013-01-12', 'Super II', 'Violet', NULL, false, true, NULL, 'manual', 'original', 'verified', 'unknown'),
  ('6168c423-9f3e-5495-9a1d-06185ea7fa34', '1acf7850-c8a9-5627-b104-54db6e235ba2', '95450', 'Color Special', 'Dash-X1 Proto-Emperor Premium Black Special', 2019, '2019-01-12', 'Super II', 'Black', 'Chassis molded in Yellow ABS (per official retailer listing corroboration); body/A-parts Black -- hence "Black Special" naming despite the yellow chassis.', false, false, NULL, 'manual', 'color_special', 'verified', 'unknown'),
  ('497455cb-838d-5430-97dd-ae0be52e69e4', 'de719716-e50a-5811-b99d-18bbb153b166', '18626', 'Original', 'Avante Mk.III Azure', 2008, '2008-09-06', 'MS', 'Light Blue', NULL, false, true, NULL, 'manual', 'original', 'verified', 'unknown'),
  ('86763fe4-bfc0-551e-8541-c3fc9c2442b7', 'de719716-e50a-5811-b99d-18bbb153b166', '18627', 'Original', 'Avante Mk.III Nero', 2008, '2008-09-27', 'MS', 'Black', NULL, false, false, NULL, 'manual', 'other', 'verified', 'unknown'),
  ('68be3b41-30a7-55be-8cd9-f741193ce595', 'de719716-e50a-5811-b99d-18bbb153b166', '95087', 'Japan Cup Edition', 'Avante Mk.III Japan Cup 2015 Limited Edition', 2015, '2015-07-11', 'MA', 'Magenta', 'MS-chassis Azure body remounted on MA chassis for this limited edition -- chassis change alone does not imply a different Product per this catalog''s own convention.', false, false, NULL, 'manual', 'japan_cup', 'verified', 'unknown'),
  ('3ba49f54-21c9-532d-a34a-7b9e38668a6d', 'de719716-e50a-5811-b99d-18bbb153b166', '95425', 'Color Special', 'Avante Mk.III Red Special', 2018, '2018-12-01', 'MS', 'Red', 'This is a re-release: Tamiya''s own Avante Mk.III lineup lists an earlier Red Special (item 94692, June 27, 2009) not implemented in Wave 1 -- see Wave 2 candidates in docs/CATALOG_AUDIT.md.', false, false, NULL, 'manual', 'color_special', 'verified', 'unknown'),
  ('e31c9f48-a776-564a-a496-63771e4a4f9d', 'de719716-e50a-5811-b99d-18bbb153b166', '95469', 'Color Special', 'Avante Mk.III White Special', 2019, '2019-03-23', 'MS', 'White', 'This is a re-release: an earlier White Special (January 30, 2010, per the Fandom wiki) exists under a different, unconfirmed item number and was not implemented in Wave 1 -- see Wave 2 candidates.', false, false, NULL, 'manual', 'color_special', 'verified', 'unknown'),
  ('9d9d9015-81e5-5388-9d36-3e8b3b223b54', 'de719716-e50a-5811-b99d-18bbb153b166', '95464', 'Clear Body', 'Avante Mk.III Azure Clear Special (Polycarbonate Body)', 2010, NULL, 'MS', 'Clear/Azure', 'Official page states its own initial release as 2010年9月 (September 2010, month only) -- releaseDate left unset (no day stated by the source).', false, false, NULL, 'manual', 'color_special', 'verified', 'unknown'),
  ('cc1fb7fa-67db-5303-9514-80b9705fe732', 'de719716-e50a-5811-b99d-18bbb153b166', '95464', 'Reissue', 'Avante Mk.III Azure Clear Special (2023 Reissue)', 2023, '2023-11-11', 'MS', 'Clear/Azure', NULL, false, false, NULL, 'manual', 'reissue', 'verified', 'unknown')
on conflict (id) do nothing;

-- Correct the two pre-existing Neo-Tridagger rows in place, preserving UUIDs.
update product_releases
set item_number = '19409',
    edition_name = 'Neo-Tridagger ZMC',
    release_type = 'Original',
    edition_type = 'original',
    release_year = 1996,
    release_date = '1996-03-06',
    chassis = 'Super 1',
    color = NULL
where id = 'fcaf3f82-93b5-5a52-8087-c96e771a030c';

update product_releases
set item_number = '95508',
    edition_name = 'Neo-Tridagger ZMC Carbon Special',
    release_type = 'Color Special',
    edition_type = 'color_special',
    release_year = 2019,
    release_date = NULL,
    chassis = 'Super II',
    color = 'Black',
    notes = 'Initial release month: August 2019 (day not officially stated).',
    rarity = NULL,
    verification_status = 'verified'
where id = '73dcd8e6-82ab-54c4-961b-f4132bf6d638';

-- Set canonical releases only AFTER their release rows exist. The Catalog Model
-- V2 trigger then derives canonical_item_number/chassis/original_release_year.
update products
set canonical_release_id = '0226dfa5-5e29-5557-b134-ddbad7682e28'
where id = '1acf7850-c8a9-5627-b104-54db6e235ba2';

update products
set canonical_release_id = '497455cb-838d-5430-97dd-ae0be52e69e4'
where id = 'de719716-e50a-5811-b99d-18bbb153b166';

insert into release_sources (id, release_id, source_type, source_url, verified_fields, checked_at, notes) values
  ('228c6838-37e1-5ac0-a6f1-734d304c8422', 'fcaf3f82-93b5-5a52-8087-c96e771a030c', 'official_manufacturer', 'https://www.tamiya.com/japan/products/19409/index.html', '{"itemNumber","chassis","editionName"}'::text[], '2026-09-04', NULL),
  ('07309dc2-d6c4-57ee-8435-a001ee5e5ec0', 'fcaf3f82-93b5-5a52-8087-c96e771a030c', 'trusted_secondary', 'https://mini-4wd.fandom.com/wiki/Neo-Tridagger_ZMC', '{"releaseYear","releaseDate"}'::text[], '2026-09-07', 'Corroborated independently by w.atwiki.jp/mini4vipwiki/pages/178.html (same exact date, 1996-03-06). Two independent trusted-secondary sources concur; no official primary source states this historical date.'),
  ('10b33526-c0dc-57fa-b4f8-0620f33087dc', '73dcd8e6-82ab-54c4-961b-f4132bf6d638', 'official_manufacturer', 'https://www.tamiya.com/japan/products/95508/index.html', '{"itemNumber","chassis","editionName"}'::text[], '2026-09-07', 'Page states its own initial release as 2019年8月 (August 2019, month only) -- releaseYear 2019 verified, releaseDate left unset (no day stated).'),
  ('c9a2eeea-9e1b-5e1e-b885-a875681699d0', '73dcd8e6-82ab-54c4-961b-f4132bf6d638', 'trusted_secondary', 'https://www.rcjaz.com/tamiya-95508-neotridagger-zmc-carbon-special-superii-p-14563.html', '{"itemNumber","chassis"}'::text[], '2026-09-07', 'RCJaz cross-check: concurs with Tamiya on item number and chassis.'),
  ('79715fe8-809a-5a31-bf73-330a7fd95a8f', 'd9b9392b-d149-52a2-b862-0eafc66af7ef', 'official_manufacturer', 'https://www.tamiya.com/japan/products/95508/index.html', '{"itemNumber","chassis","releaseDate","releaseYear"}'::text[], '2026-09-07', 'Page explicitly states 2023年8月12日(土)発売日指定 (2023-08-12) as this item''s current on-sale date -- distinct from the 2019 initial release recorded on releaseSeedKey "2".'),
  ('8f95a94d-c3bb-5e67-a5fb-467a7d11e571', '0226dfa5-5e29-5557-b134-ddbad7682e28', 'official_manufacturer', 'https://www.tamiya.com/japan/products/18074/index.html', '{"itemNumber","chassis","releaseDate","releaseYear","editionName","color"}'::text[], '2026-09-07', NULL),
  ('5f5cc87e-6ccf-54fd-821e-6e27991114c5', '0226dfa5-5e29-5557-b134-ddbad7682e28', 'trusted_secondary', 'https://www.rcjaz.com/tamiya-18074-jr-dashx1-proto-emperor-premium-super-ii-chassis-p-90059083.html', '{"itemNumber","chassis"}'::text[], '2026-09-07', 'RCJaz cross-check: concurs with Tamiya on item and chassis.'),
  ('b7d48d11-11a8-518a-8858-21bbcd285097', '6168c423-9f3e-5495-9a1d-06185ea7fa34', 'official_manufacturer', 'https://www.tamiya.com/japan/products/95450/index.html', '{"itemNumber","chassis","releaseDate","releaseYear","editionName","color"}'::text[], '2026-09-06', 'This item was ORIGINALLY (incorrectly) attached to the Proto Emperor ZX product in this catalog; confirmed this pass to belong to Dash-X1 Proto-Emperor instead -- see the Catalog Integrity Hardening pass and this Product''s own header comment.'),
  ('62bdc4fe-846d-55ec-a5c9-17a62a75e502', '6168c423-9f3e-5495-9a1d-06185ea7fa34', 'trusted_secondary', 'https://mini-4wd.fandom.com/wiki/Dash-X1_Proto-Emperor', '{"releaseDate","releaseYear"}'::text[], '2026-09-07', 'Fandom wiki''s structured release table independently states January 12, 2019 for item 95450 -- matches the official page exactly.'),
  ('9ff2bdff-569a-5a93-8991-879b8ed06722', '497455cb-838d-5430-97dd-ae0be52e69e4', 'official_manufacturer', 'https://www.tamiya.com/japan/products/18626/index.html', '{"itemNumber","chassis","releaseDate","releaseYear","editionName"}'::text[], '2026-09-07', NULL),
  ('e66b46bb-ee01-5689-a322-0cdb05970850', '86763fe4-bfc0-551e-8541-c3fc9c2442b7', 'official_manufacturer', 'https://www.tamiya.com/japan/products/18627/index.html', '{"itemNumber","chassis","releaseDate","releaseYear","editionName","color"}'::text[], '2026-09-07', NULL),
  ('949c6dec-3d13-54ca-a8de-223fe20bb830', '68be3b41-30a7-55be-8cd9-f741193ce595', 'official_manufacturer', 'https://www.tamiya.com/japan/products/95087/index.html', '{"itemNumber","chassis","releaseDate","releaseYear","editionName"}'::text[], '2026-09-07', NULL),
  ('4bfa5a87-1af7-5e8b-b361-861b359e831c', '3ba49f54-21c9-532d-a34a-7b9e38668a6d', 'official_manufacturer', 'https://www.tamiya.com/japan/products/95425/index.html', '{"itemNumber","chassis","releaseDate","releaseYear","editionName"}'::text[], '2026-09-07', NULL),
  ('6b1174cb-080e-5f5a-83fa-764c943ace40', '3ba49f54-21c9-532d-a34a-7b9e38668a6d', 'trusted_secondary', 'https://www.rcjaz.com/tamiya-94692-avante-mkiii-red-special-p-90012922.html', '{}'::text[], '2026-09-07', 'Corroborates that an EARLIER Red Special exists under a different item (94692) -- evidence this 95425 release is a re-release, not the original; not used to back any of THIS release''s own field values.'),
  ('37e804d6-421d-5948-b6bd-2475705c0827', 'e31c9f48-a776-564a-a496-63771e4a4f9d', 'official_manufacturer', 'https://www.tamiya.com/japan/products/95469/index.html', '{"itemNumber","chassis","releaseDate","releaseYear","editionName"}'::text[], '2026-09-07', NULL),
  ('3bb2c0b3-1b97-58b9-b7cf-ca5437661f3f', '9d9d9015-81e5-5388-9d36-3e8b3b223b54', 'official_manufacturer', 'https://www.tamiya.com/japan/products/95464/index.html', '{"itemNumber","chassis","releaseYear","editionName"}'::text[], '2026-09-07', 'Page states its own initial release as 2010年9月 (month only) -- releaseYear verified, releaseDate left unset.'),
  ('370c340c-c220-562b-b8dd-b60bf1d51f18', '9d9d9015-81e5-5388-9d36-3e8b3b223b54', 'trusted_secondary', 'https://www.rcjaz.com/tamiya-95464-avante-mkiii-azure-clear-special-polycarbonate-body-ms-chassis-p-12108.html', '{"itemNumber","chassis"}'::text[], '2026-09-07', 'RCJaz cross-check: concurs with Tamiya on item and chassis (MS).'),
  ('fa842d08-2f18-5d81-aed1-bbdaed77f5a4', 'cc1fb7fa-67db-5303-9514-80b9705fe732', 'official_manufacturer', 'https://www.tamiya.com/japan/products/95464/index.html', '{"itemNumber","chassis","releaseDate","releaseYear","editionName"}'::text[], '2026-09-07', 'Same official page as releaseSeedKey "6" (same item), fetched directly -- explicitly states 2023年11月11日(土)頃発売 (2023-11-11) as this item''s current on-sale date, distinct from the 2010年9月 initial release recorded on releaseSeedKey "6". Same pattern as Neo-Tridagger ZMC Carbon Special''s 2019-initial/2023-reissue split.')
on conflict (id) do update set
  release_id = excluded.release_id,
  source_type = excluded.source_type,
  source_url = excluded.source_url,
  verified_fields = excluded.verified_fields,
  checked_at = excluded.checked_at,
  notes = excluded.notes;
