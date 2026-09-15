-- Vintage 100 Pilot — P2 early Racing Mini 4WD foundation.
--
-- Adds five missing early Racing Mini 4WD Product identities and keeps known
-- commercial occurrences separate at Release level:
--   18001 Hotshot Jr.        — 1986 original + 1998 limited reissue
--   18002 Hornet Jr.         — 1986 original + 1998 limited reissue
--   18004 Boomerang Jr.      — 1986 original (year remains partial evidence)
--   18007 Super Dragon Jr.   — 1987 original + 1998 memorial + 2012 reissue
--                              + 18067 Premium VS
--   18008 Thunder Dragon Jr. — 1987 original + 1998 memorial + 2012 reissue
--                              + 18068 Premium VS
--
-- Early packaging can carry historical KIT No. 29xx markings. TrackDash does
-- NOT invent separate Releases solely from that packaging-number transition;
-- those markings are retained in provenance/notes unless evidence proves a
-- distinct commercial occurrence. Thunder Dragon's alleged 2908 Japanese box
-- is specifically treated as unresolved numbering provenance, not a Release.
--
-- No market prices, R3 signals, trends, liquidity or sold evidence are created.

insert into products (
  id, category_id, brand_id, slug, canonical_item_number, name, japanese_name,
  series, chassis, original_release_year, rarity, description, canonical_release_id
) values
  (
    'a8dddf2c-ba7d-56e8-9816-adde32fd8907',
    'cd755fcb-2bc5-5975-8ec0-f45e7df891cc',
    '382feca9-48e9-5144-a92d-41f77fb7e438',
    'hotshot-jr-18001', NULL, 'Hotshot Jr.', 'ホットショットJr.',
    'Racing Mini 4WD', NULL, NULL, 'Uncommon',
    'The first-numbered Racing Mini 4WD model, based on Tamiya''s Hotshot R/C buggy and released on the Type 1 chassis.',
    NULL
  ),
  (
    'a508c0d6-651d-5469-92b6-002e86518a1a',
    'cd755fcb-2bc5-5975-8ec0-f45e7df891cc',
    '382feca9-48e9-5144-a92d-41f77fb7e438',
    'hornet-jr-18002', NULL, 'Hornet Jr.', 'ホーネットJr.',
    'Racing Mini 4WD', NULL, NULL, 'Uncommon',
    'Early Racing Mini 4WD adaptation of Tamiya''s Hornet R/C buggy, using the Type 1 chassis.',
    NULL
  ),
  (
    '28b59956-2803-5602-ac02-ca3e58abd862',
    'cd755fcb-2bc5-5975-8ec0-f45e7df891cc',
    '382feca9-48e9-5144-a92d-41f77fb7e438',
    'boomerang-jr-18004', NULL, 'Boomerang Jr.', 'ブーメランJr.',
    'Racing Mini 4WD', NULL, NULL, 'Uncommon',
    '1986 Racing Mini 4WD adaptation of the Boomerang R/C buggy, using Tamiya''s Type 1 chassis.',
    NULL
  ),
  (
    'd8c1c423-ae93-5f15-9caa-b7e1b5016760',
    'cd755fcb-2bc5-5975-8ec0-f45e7df891cc',
    '382feca9-48e9-5144-a92d-41f77fb7e438',
    'super-dragon-jr-18007', NULL, 'Super Dragon Jr.', 'スーパードラゴンJr.',
    'Racing Mini 4WD', NULL, NULL, 'Uncommon',
    'Dragon-series Racing Mini 4WD originally released in 1987 on the Type 1 chassis, with later Memorial, standard reissue and Premium occurrences kept separate.',
    NULL
  ),
  (
    '9babb5d8-f8d0-5741-bb12-22e5a069015a',
    'cd755fcb-2bc5-5975-8ec0-f45e7df891cc',
    '382feca9-48e9-5144-a92d-41f77fb7e438',
    'thunder-dragon-jr-18008', NULL, 'Thunder Dragon Jr.', 'サンダードラゴンJr.',
    'Racing Mini 4WD', NULL, NULL, 'Uncommon',
    'Late-1987 Dragon-series Racing Mini 4WD on Type 1 chassis, with later Memorial, standard reissue and Premium occurrences represented separately.',
    NULL
  )
on conflict (id) do nothing;

insert into product_releases (
  id, product_id, item_number, release_type, edition_name, release_year,
  release_date, chassis, notes, discontinued, is_original, rarity,
  data_source, edition_type, verification_status, production_status
) values
  (
    'aae2febe-da13-55d0-a5c7-3151c2b16778',
    'a8dddf2c-ba7d-56e8-9816-adde32fd8907',
    '18001', 'Original', 'Hotshot Jr. — 1986 Original', 1986, NULL, 'Type 1',
    'Tamiya identifies ITEM 18001 Hotshot Jr. on Type 1 chassis; the official historical Jr. News retrospective places the original in 1986. Early collector packaging can carry KIT No. 2901; TrackDash preserves that as first-batch provenance rather than inventing a separate official Release.',
    false, true, NULL, 'manual', 'original', 'verified', 'unknown'
  ),
  (
    '24ecf550-ce34-5bed-a192-31ec8e857ea6',
    'a8dddf2c-ba7d-56e8-9816-adde32fd8907',
    '18001', 'Reissue', 'Hotshot Jr. — 1998 Limited Reissue', 1998, NULL, 'Type 1',
    'Collector-market and specialist historical sources identify a 1998 limited/Memorial reissue retaining 18001. It must remain separate from the 1986 original for market analysis.',
    false, false, NULL, 'manual', 'reissue', 'partial', 'unknown'
  ),
  (
    '42ee427f-60ed-598b-bc68-b07c2e2cb195',
    'a508c0d6-651d-5469-92b6-002e86518a1a',
    '18002', 'Original', 'Hornet Jr. — 1986 Original', 1986, NULL, 'Type 1',
    'Tamiya identifies ITEM 18002 Hornet Jr. on Type 1 chassis; the official Jr. News retrospective places the original in 1986. Early packaging can show KIT No. 2902 and is treated as first-batch provenance within the original Release.',
    false, true, NULL, 'manual', 'original', 'verified', 'unknown'
  ),
  (
    '554acb0b-0987-551b-8619-c3bff7e3bab0',
    'a508c0d6-651d-5469-92b6-002e86518a1a',
    '18002', 'Reissue', 'Hornet Jr. — 1998 Limited Reissue', 1998, NULL, 'Type 1',
    'A 1998 Memorial/Limited Reissue is documented in specialist history and marketplace provenance and retains the standard 18002 identity. Kept separate from the 1986 original.',
    false, false, NULL, 'manual', 'reissue', 'partial', 'unknown'
  ),
  (
    '676c2d8e-df56-5b73-9e6e-4ff732b4bbc4',
    '28b59956-2803-5602-ac02-ca3e58abd862',
    '18004', 'Original', 'Boomerang Jr. — 1986 Original', 1986, NULL, 'Type 1',
    'Official Tamiya identity verifies 18004 / Type 1. The 1986 original year and early KIT No. 2904 provenance are currently supported by specialist secondary catalog research, so the Release remains partial rather than fully verified.',
    false, true, NULL, 'manual', 'original', 'partial', 'unknown'
  ),
  (
    '855153e5-fa4b-548c-9ae3-464b9fe46e15',
    'd8c1c423-ae93-5f15-9caa-b7e1b5016760',
    '18007', 'Original', 'Super Dragon Jr. — 1987 Original', 1987, NULL, 'Type 1',
    'Official Tamiya identity verifies 18007 / Type 1 and the official historical Jr. News retrospective places Super Dragon Jr. in 1987. Early KIT No. 2907 packaging is treated as original-batch provenance, not automatically as a separate commercial Release.',
    false, true, NULL, 'manual', 'original', 'verified', 'unknown'
  ),
  (
    '2514e6f0-9121-55db-899b-03976f4ec11f',
    'd8c1c423-ae93-5f15-9caa-b7e1b5016760',
    '18007', 'Reissue', 'Super Dragon Jr. — 1998 Memorial Reissue', 1998, NULL, 'Type 1',
    'Specialist history and closed-market provenance identify a 1998 Memorial/Limited Reissue. It is explicitly separated from both the 1987 original and the 2012 standard reissue.',
    false, false, NULL, 'manual', 'reissue', 'partial', 'unknown'
  ),
  (
    '9ce0c921-2bfe-5c34-b21f-d8b28c430104',
    'd8c1c423-ae93-5f15-9caa-b7e1b5016760',
    '18007', 'Reissue', 'Super Dragon Jr. — 2012 Reissue', 2012, '2012-06-16', 'Type 1',
    'Official Tamiya product page explicitly dates the standard 18007 Type 1 reissue to 16 June 2012.',
    false, false, NULL, 'manual', 'reissue', 'verified', 'unknown'
  ),
  (
    'a4208dcd-08fa-5391-ad03-3c1ebf481507',
    'd8c1c423-ae93-5f15-9caa-b7e1b5016760',
    '18067', 'Premium', 'Super Dragon Premium — VS Chassis', 2012, '2012-02-25', 'VS',
    'Official Tamiya Premium release on VS chassis, distinct from every Type 1 Super Dragon Jr. occurrence.',
    false, false, NULL, 'manual', 'premium', 'verified', 'unknown'
  ),
  (
    'ef8c9a34-a78f-5f47-9f48-79460a21d40b',
    '9babb5d8-f8d0-5741-bb12-22e5a069015a',
    '18008', 'Original', 'Thunder Dragon Jr. — 1987 Original', 1987, NULL, 'Type 1',
    'Official Tamiya identity verifies 18008 / Type 1 and the official Jr. News retrospective places Thunder Dragon Jr. in 1987. Secondary sources conflict on whether a Japanese first batch should be called KIT No. 2908; TrackDash therefore stores 18008 and records the numbering ambiguity rather than inventing a second Release.',
    false, true, NULL, 'manual', 'original', 'verified', 'unknown'
  ),
  (
    'fcef2cc9-4f5e-5d09-8f80-5f2fcc644372',
    '9babb5d8-f8d0-5741-bb12-22e5a069015a',
    '18008', 'Reissue', 'Thunder Dragon Jr. — 1998 Memorial Reissue', 1998, NULL, 'Type 1',
    '1998 Memorial/Limited Reissue, distinct from both the 1987 original and 2012 standard reissue.',
    false, false, NULL, 'manual', 'reissue', 'partial', 'unknown'
  ),
  (
    'a52d2eca-f226-5fc7-97bc-4437ad44feb9',
    '9babb5d8-f8d0-5741-bb12-22e5a069015a',
    '18008', 'Reissue', 'Thunder Dragon Jr. — 2012 Reissue', 2012, '2012-06-16', 'Type 1',
    'Official Tamiya product page explicitly dates the standard 18008 Type 1 reissue to 16 June 2012.',
    false, false, NULL, 'manual', 'reissue', 'verified', 'unknown'
  ),
  (
    'bbc9e062-ba69-5cf9-9228-de2de15640a6',
    '9babb5d8-f8d0-5741-bb12-22e5a069015a',
    '18068', 'Premium', 'Thunder Dragon Premium — VS Chassis', 2012, '2012-03-17', 'VS',
    'Official Tamiya Premium release on VS chassis, separate from Type 1 Thunder Dragon Jr. occurrences.',
    false, false, NULL, 'manual', 'premium', 'verified', 'unknown'
  )
on conflict (id) do nothing;

-- Canonical releases are assigned after all release rows exist. Catalog V2
-- triggers then derive each Product's canonical item/chassis/original year.
update products set canonical_release_id = 'aae2febe-da13-55d0-a5c7-3151c2b16778'
where id = 'a8dddf2c-ba7d-56e8-9816-adde32fd8907';
update products set canonical_release_id = '42ee427f-60ed-598b-bc68-b07c2e2cb195'
where id = 'a508c0d6-651d-5469-92b6-002e86518a1a';
update products set canonical_release_id = '676c2d8e-df56-5b73-9e6e-4ff732b4bbc4'
where id = '28b59956-2803-5602-ac02-ca3e58abd862';
update products set canonical_release_id = '855153e5-fa4b-548c-9ae3-464b9fe46e15'
where id = 'd8c1c423-ae93-5f15-9caa-b7e1b5016760';
update products set canonical_release_id = 'ef8c9a34-a78f-5f47-9f48-79460a21d40b'
where id = '9babb5d8-f8d0-5741-bb12-22e5a069015a';

insert into release_sources (
  id, release_id, source_type, source_url, verified_fields, checked_at, notes
) values
  ('fc546015-1a4c-5346-bb67-d986baf5f27c','aae2febe-da13-55d0-a5c7-3151c2b16778','official_manufacturer','https://www.tamiya.com/japan/products/18001/index.html',array['itemNumber','editionName','chassis']::text[],'2026-09-15',NULL),
  ('a8c6354d-457d-552d-8dc9-81cb62b56d2d','aae2febe-da13-55d0-a5c7-3151c2b16778','official_archive','https://www.tamiya.com/cms/japan/mini4wd/jr_news/jr_news16/pdf/000191.pdf',array['releaseYear','chassis']::text[],'2026-09-15','Tamiya Jr. News historical retrospective lists Hotshot Jr. ITEM 18001 / Type 1 / released in 1986.'),
  ('a4836fed-218d-548a-b8e9-0d5656e7e01f','24ecf550-ce34-5bed-a192-31ec8e857ea6','trusted_secondary','https://ekizo.mandarake.co.jp/auction/item/itemInfoJa.html?index=769459',array['itemNumber','editionName','releaseYear']::text[],'2026-09-15','Mandarake identifies Hotshot Jr. limited reissue 18001, issued in 1998.'),
  ('498177eb-cfb9-5388-8d89-67363dc060f8','24ecf550-ce34-5bed-a192-31ec8e857ea6','trusted_secondary','https://www.tea-league.com/mt/tea/archives/2000/01/19821999.html',array['editionName','releaseYear']::text[],'2026-09-15','Historical Mini 4WD timeline lists the Hotshot Jr. Memorial/Limited Reissue in December 1998.'),

  ('9728122d-62b9-5b2f-a70c-0381eaf9f12f','42ee427f-60ed-598b-bc68-b07c2e2cb195','official_manufacturer','https://www.tamiya.com/japan/products/18002/index.html',array['itemNumber','editionName','chassis']::text[],'2026-09-15',NULL),
  ('0167e856-0646-55a0-b7b2-fc5caebcf837','42ee427f-60ed-598b-bc68-b07c2e2cb195','official_archive','https://www.tamiya.com/cms/japan/mini4wd/jr_news/jr_news16/pdf/000191.pdf',array['releaseYear','chassis']::text[],'2026-09-15','Tamiya Jr. News historical retrospective lists Hornet Jr. ITEM 18002 / Type 1 / released in 1986.'),
  ('1423501a-fdfc-5ec3-9b65-e6836715bad1','554acb0b-0987-551b-8619-c3bff7e3bab0','trusted_secondary','https://www.tea-league.com/mt/tea/archives/2000/01/19821999.html',array['editionName','releaseYear']::text[],'2026-09-15','Historical timeline lists Hornet Jr. among the December 1998 Memorial/Limited Reissues.'),
  ('bd8ff14b-37a1-5dbc-8382-e14260a8c6be','554acb0b-0987-551b-8619-c3bff7e3bab0','other','https://auctions.yahoo.co.jp/closedsearch/closedsearch/%E3%83%9F%E3%83%8B%E5%9B%9B%E9%A7%86%20%E3%83%9B%E3%83%BC%E3%83%8D%E3%83%83%E3%83%88jr/25464',array['itemNumber','releaseYear']::text[],'2026-09-15','Closed-market provenance contains explicit 1998 unbuilt Hornet Jr. reissue listings carrying 18002.'),

  ('1b0ff312-ebc5-5fe6-b981-4270e5b8f7a9','676c2d8e-df56-5b73-9e6e-4ff732b4bbc4','official_manufacturer','https://www.tamiya.com/japan/products/18004/index.html',array['itemNumber','editionName','chassis']::text[],'2026-09-15',NULL),
  ('c9ba25b5-cbd3-5743-b9ad-a5d764ea1535','676c2d8e-df56-5b73-9e6e-4ff732b4bbc4','trusted_secondary','https://mini-4wd.fandom.com/wiki/Boomerang_Jr.',array['releaseYear']::text[],'2026-09-15','Collector reference places the original Boomerang Jr. release in 1986 and records early KIT No. 2904 / later 18004 numbering.'),

  ('cd0bc5b1-6603-5acf-bb7f-e3662efd4368','855153e5-fa4b-548c-9ae3-464b9fe46e15','official_manufacturer','https://www.tamiya.com/japan/products/18007/index.html',array['itemNumber','editionName','chassis']::text[],'2026-09-15',NULL),
  ('a6d48255-d473-5dbb-acce-aea106518a20','855153e5-fa4b-548c-9ae3-464b9fe46e15','official_archive','https://www.tamiya.com/cms/japan/mini4wd/jr_news/jr_news16/pdf/000191.pdf',array['releaseYear','chassis']::text[],'2026-09-15','Tamiya Jr. News historical retrospective lists Super Dragon Jr. ITEM 18007 / Type 1 / released in 1987.'),
  ('8ebeba34-3cd1-5875-8d98-1a21f45b0776','2514e6f0-9121-55db-899b-03976f4ec11f','trusted_secondary','https://www.tea-league.com/mt/tea/archives/2000/01/19821999.html',array['editionName','releaseYear']::text[],'2026-09-15',NULL),
  ('e345bd3b-c8d9-5b4e-b3d4-f254fe7f9619','2514e6f0-9121-55db-899b-03976f4ec11f','other','https://auctions.yahoo.co.jp/closedsearch/closedsearch/%E3%82%B9%E3%83%BC%E3%83%91%E3%83%BC%E3%83%89%E3%83%A9%E3%82%B4%E3%83%B3%20%E3%82%BF%E3%83%9F%E3%83%A4/0/',array['editionName','releaseYear']::text[],'2026-09-15','Closed results include explicit 1998 limited-reissue Super Dragon Jr. kits.'),
  ('6cd0d27c-762a-53ae-8d10-9e69cdf5a605','9ce0c921-2bfe-5c34-b21f-d8b28c430104','official_manufacturer','https://www.tamiya.com/japan/products/18007/index.html',array['itemNumber','editionName','releaseYear','releaseDate','chassis']::text[],'2026-09-15',NULL),
  ('ff752c99-ea1f-59fc-8b23-ab4bb5db2eb2','a4208dcd-08fa-5391-ad03-3c1ebf481507','official_manufacturer','https://www.tamiya.com/japan/products/18067/index.html',array['itemNumber','editionName','releaseYear','releaseDate','chassis']::text[],'2026-09-15',NULL),

  ('c965e5bb-7653-5edb-b64e-caf4e752583d','ef8c9a34-a78f-5f47-9f48-79460a21d40b','official_manufacturer','https://www.tamiya.com/japan/products/18008/index.html',array['itemNumber','editionName','chassis']::text[],'2026-09-15',NULL),
  ('6e15352d-29d7-5111-b4a0-f3f02e954eb4','ef8c9a34-a78f-5f47-9f48-79460a21d40b','official_archive','https://www.tamiya.com/cms/japan/mini4wd/jr_news/jr_news16/pdf/000191.pdf',array['releaseYear','chassis']::text[],'2026-09-15','Tamiya Jr. News historical retrospective lists Thunder Dragon Jr. ITEM 18008 / Type 1 / released in 1987.'),
  ('5c476392-be6d-5bbd-acd8-2f6433fab41f','ef8c9a34-a78f-5f47-9f48-79460a21d40b','trusted_secondary','https://re-cube.co.jp/toyokawa/new_item/entry-1638.html',array['itemNumber']::text[],'2026-09-15','Physical-box/insert inspection corrected an earlier 2908 claim to KIT No. 18008; retained to document numbering ambiguity instead of asserting 2908 as a separate Japanese Release.'),
  ('05eaf41f-5043-5a9f-8028-cb930369e73c','fcef2cc9-4f5e-5d09-8f80-5f2fcc644372','trusted_secondary','https://www.tea-league.com/mt/tea/archives/2000/01/19821999.html',array['editionName','releaseYear']::text[],'2026-09-15',NULL),
  ('d8061bc7-0bcd-522f-b3b1-ee1a1f1c35e2','fcef2cc9-4f5e-5d09-8f80-5f2fcc644372','other','https://auctions.yahoo.co.jp/closedsearch/closedsearch/%E3%82%B5%E3%83%B3%E3%83%80%E3%83%BC%E3%83%89%E3%83%A9%E3%82%B4%E3%83%B3jr/2084250966',array['itemNumber','editionName','releaseYear']::text[],'2026-09-15','Closed results include explicit 1998 unbuilt limited-reissue 18008 Thunder Dragon Jr. kits.'),
  ('b1b11627-836b-5747-842c-fb8ae5cc5d19','a52d2eca-f226-5fc7-97bc-4437ad44feb9','official_manufacturer','https://www.tamiya.com/japan/products/18008/index.html',array['itemNumber','editionName','releaseYear','releaseDate','chassis']::text[],'2026-09-15',NULL),
  ('d2683646-4f48-5e61-83dd-10396d385306','bbc9e062-ba69-5cf9-9228-de2de15640a6','official_manufacturer','https://www.tamiya.com/japan/products/18068/index.html',array['itemNumber','editionName','releaseYear','releaseDate','chassis']::text[],'2026-09-15',NULL)
on conflict (id) do update set
  release_id = excluded.release_id,
  source_type = excluded.source_type,
  source_url = excluded.source_url,
  verified_fields = excluded.verified_fields,
  checked_at = excluded.checked_at,
  notes = excluded.notes;
