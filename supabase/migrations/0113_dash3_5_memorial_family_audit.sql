-- Dash-3 Shooting Star / Dash-4 Cannonball / Dash-5 Dancing Doll
-- family audit and Memorial Box Vol.1 production-wave split.
--
-- TrackDash models the 2005 Memorial Box occurrences as distinct production
-- waves because the box contains complete buildable versions of the same cars,
-- and collectors can own those occurrences independently of the 1989/1990
-- originals. The parent set ITEM 94547 was released on 2005-04-30.
--
-- Important bundle rule:
-- 95625 (2021 Great Emperor Special Kit) contains a Shooting Star body,
-- 95624 contains a Cannonball body, and 95623 contains a Dancing Doll body.
-- These are NOT inserted here as standalone Releases because they are alternate
-- bodies bundled into different primary kits. They wait for explicit bundle/set
-- modeling rather than inflating the single-car catalog.

-- Existing originals: tighten historical month/JAN provenance.
update public.product_releases
set
  barcode_jan = '4950344180196',
  notes = 'Original Dash-3 Shooting Star on Type 3 chassis. Official Tamiya product history states the first release month was September 1989. Exact day is intentionally not inferred. Hobby Search corroborates JAN 4950344180196.',
  updated_at = now()
where id = '178ef6b8-594c-5cf4-8084-3c910576b29b';

update public.product_releases
set
  barcode_jan = '4950344180226',
  notes = 'Original Dash-4 Cannonball on Type 3 chassis. Official Tamiya product history states the first release month was January 1990. Exact day is intentionally not inferred. Hobby Search corroborates JAN 4950344180226.',
  updated_at = now()
where id = 'c63b8f4a-43f3-597b-82e5-f0e45bb45b7a';

update public.product_releases
set
  barcode_jan = '4950344180233',
  notes = 'Original Dash-5 Dancing Doll on Type 3 chassis. Official Tamiya product history states the first release month was March 1990. Exact day is intentionally not inferred. Hobby Search corroborates JAN 4950344180233.',
  updated_at = now()
where id = '0febe9c7-2a10-5766-9b87-1342121d3e38';

update public.product_releases
set
  barcode_jan = '4950344952250',
  notes = 'Official Dash-4 Cannonball Premium on Super-II chassis, released 2015-11-14. Hobby Search corroborates JAN 4950344952250.',
  updated_at = now()
where id = '7e6cd351-658c-5558-bff9-3a1ea608e6d4';

-- Dash-3 Shooting Star — 2005 Memorial Box Vol.1 occurrence.
insert into public.product_releases (
  id, product_id, item_number, release_type, edition_name, release_year,
  release_date, chassis, barcode_jan, color, country_market, notes,
  discontinued, is_original, rarity, data_source, edition_type,
  verification_status, production_status, status_checked_at
) values (
  '4acac9d3-be92-45f0-b277-d1b89cc3a1df',
  '4b53383c-c417-53c6-addb-e87126546d89',
  '18019',
  'Reissue',
  'Dash-3 Shooting Star — 2005 Memorial Box Vol.1 Reissue',
  2005,
  date '2005-04-30',
  'Type 3',
  null,
  null,
  'Japan',
  'Production occurrence supplied inside Tamiya Racer Mini 4WD Memorial Box Vol.1 (parent set ITEM 94547). The box contents explicitly include Dash-3 Shooting Star. The current official 18019 image is used only as a visual reference to the same Type-3 specification, not as archival 2005 packaging.',
  true,
  false,
  null,
  'audited_mixed',
  'reissue',
  'partial',
  'discontinued',
  now()
)
on conflict (id) do update set
  item_number=excluded.item_number, edition_name=excluded.edition_name,
  release_year=excluded.release_year, release_date=excluded.release_date,
  chassis=excluded.chassis, notes=excluded.notes, data_source=excluded.data_source,
  edition_type=excluded.edition_type, verification_status=excluded.verification_status,
  production_status=excluded.production_status, updated_at=now();

-- Dash-3 Shooting Star — 2008 MS-chassis redesign.
insert into public.product_releases (
  id, product_id, item_number, release_type, edition_name, release_year,
  release_date, chassis, barcode_jan, color, country_market, notes,
  discontinued, is_original, rarity, data_source, edition_type,
  verification_status, production_status, status_checked_at
) values (
  'a743ba55-5883-4872-a4b5-5ab1134df426',
  '4b53383c-c417-53c6-addb-e87126546d89',
  '18630',
  'Chassis Variant',
  'Dash-3 Shooting Star (MS Chassis)',
  2008,
  date '2008-12-20',
  'MS',
  '4950344064311',
  null,
  null,
  'Official Tamiya MS-chassis redesign released 2008-12-20. Hobby Search corroborates JAN 4950344064311.',
  false,
  false,
  null,
  'tamiya_official',
  'other',
  'verified',
  'active',
  now()
)
on conflict (id) do update set
  item_number=excluded.item_number, edition_name=excluded.edition_name,
  release_year=excluded.release_year, release_date=excluded.release_date,
  chassis=excluded.chassis, barcode_jan=excluded.barcode_jan,
  notes=excluded.notes, data_source=excluded.data_source,
  edition_type=excluded.edition_type, verification_status=excluded.verification_status,
  production_status=excluded.production_status, updated_at=now();

-- Dash-4 Cannonball — 2005 Memorial Box Vol.1 occurrence.
insert into public.product_releases (
  id, product_id, item_number, release_type, edition_name, release_year,
  release_date, chassis, barcode_jan, color, country_market, notes,
  discontinued, is_original, rarity, data_source, edition_type,
  verification_status, production_status, status_checked_at
) values (
  '6eb03b77-583b-469f-b1da-99cbfcf092b9',
  'd2c3e3d8-050d-5b9b-932f-023f2ee7dce2',
  '18022',
  'Reissue',
  'Dash-4 Cannonball — 2005 Memorial Box Vol.1 Reissue',
  2005,
  date '2005-04-30',
  'Type 3',
  null,
  null,
  'Japan',
  'Production occurrence supplied inside Tamiya Racer Mini 4WD Memorial Box Vol.1 (parent set ITEM 94547). The box contents explicitly include Cannonball. The current official 18022 image is used only as a visual reference to the same Type-3 specification, not as archival 2005 packaging.',
  true,
  false,
  null,
  'audited_mixed',
  'reissue',
  'partial',
  'discontinued',
  now()
)
on conflict (id) do update set
  item_number=excluded.item_number, edition_name=excluded.edition_name,
  release_year=excluded.release_year, release_date=excluded.release_date,
  chassis=excluded.chassis, notes=excluded.notes, data_source=excluded.data_source,
  edition_type=excluded.edition_type, verification_status=excluded.verification_status,
  production_status=excluded.production_status, updated_at=now();

-- Dash-5 Dancing Doll — 2005 Memorial Box Vol.1 occurrence.
insert into public.product_releases (
  id, product_id, item_number, release_type, edition_name, release_year,
  release_date, chassis, barcode_jan, color, country_market, notes,
  discontinued, is_original, rarity, data_source, edition_type,
  verification_status, production_status, status_checked_at
) values (
  '648599ef-e45d-4362-b560-dacc70b5e781',
  'a0bed8eb-2899-50f8-8746-a8d08f7a52b7',
  '18023',
  'Reissue',
  'Dash-5 Dancing Doll — 2005 Memorial Box Vol.1 Reissue',
  2005,
  date '2005-04-30',
  'Type 3',
  null,
  null,
  'Japan',
  'Production occurrence supplied inside Tamiya Racer Mini 4WD Memorial Box Vol.1 (parent set ITEM 94547). The box contents explicitly include Dash-5 Dancing Doll. The current official 18023 image is used only as a visual reference to the same Type-3 specification, not as archival 2005 packaging.',
  true,
  false,
  null,
  'audited_mixed',
  'reissue',
  'partial',
  'discontinued',
  now()
)
on conflict (id) do update set
  item_number=excluded.item_number, edition_name=excluded.edition_name,
  release_year=excluded.release_year, release_date=excluded.release_date,
  chassis=excluded.chassis, notes=excluded.notes, data_source=excluded.data_source,
  edition_type=excluded.edition_type, verification_status=excluded.verification_status,
  production_status=excluded.production_status, updated_at=now();

-- Official/release-specific visual references.
insert into public.release_images (id, release_id, url, position) values
(
  '9afe23a2-0edc-448e-a38e-13571b937ea3',
  '4acac9d3-be92-45f0-b277-d1b89cc3a1df',
  'https://www.tamiya.com/japan_contents/img/usr/item/1/18019/18019_1.jpg', 0
),
(
  '036af624-bd90-414d-8123-91b1be4fdb1d',
  'a743ba55-5883-4872-a4b5-5ab1134df426',
  'https://www.tamiya.com/japan_contents/img/usr/item/1/18630/18630_1.jpg', 0
),
(
  '24ce1888-2ed6-443f-a45b-7cb599414965',
  '6eb03b77-583b-469f-b1da-99cbfcf092b9',
  'https://www.tamiya.com/japan_contents/img/usr/item/1/18022/18022_1.jpg', 0
),
(
  'a215827f-3215-473c-9fe0-8954d25b1021',
  '648599ef-e45d-4362-b560-dacc70b5e781',
  'https://www.tamiya.com/japan_contents/img/usr/item/1/18023/18023_1.jpg', 0
),
(
  '095106bc-540d-4613-8132-7bb5bed4405b',
  '0febe9c7-2a10-5766-9b87-1342121d3e38',
  'https://www.tamiya.com/japan_contents/img/usr/item/1/18023/18023_1.jpg', 0
)
on conflict (id) do update set
  release_id=excluded.release_id, url=excluded.url, position=excluded.position;

-- Provenance.
insert into public.release_sources (
  id, release_id, source_type, source_url, verified_fields, checked_at, notes
) values
(
  '61bb1cfb-ffbf-45db-8346-5d669b705c58',
  '178ef6b8-594c-5cf4-8084-3c910576b29b',
  'official_manufacturer',
  'https://www.tamiya.com/japan/products/18019/index.html',
  array['itemNumber','releaseYear','chassis','editionName'],
  date '2026-09-19',
  'Official Tamiya page states first release month September 1989.'
),
(
  'ea8fd422-222a-4932-bd70-e60f5f68597a',
  '178ef6b8-594c-5cf4-8084-3c910576b29b',
  'trusted_secondary',
  'https://www.1999.co.jp/10087279',
  array['barcodeJAN'],
  date '2026-09-19',
  'Hobby Search corroborates JAN 4950344180196.'
),
(
  '605722be-cd62-4cfa-9c49-d1f10442d83c',
  'a743ba55-5883-4872-a4b5-5ab1134df426',
  'official_manufacturer',
  'https://www.tamiya.com/japan/products/18630/index.html',
  array['itemNumber','releaseDate','releaseYear','chassis','editionName'],
  date '2026-09-19',
  'Official Tamiya page documents ITEM 18630 and 2008-12-20 release.'
),
(
  'ae94707b-680c-4566-abdc-0da6b8831fe4',
  'a743ba55-5883-4872-a4b5-5ab1134df426',
  'trusted_secondary',
  'https://www.1999.co.jp/10087730',
  array['barcodeJAN'],
  date '2026-09-19',
  'Hobby Search corroborates JAN 4950344064311.'
),
(
  '2383bf04-8e01-4776-a9e8-95db81f09ffe',
  'c63b8f4a-43f3-597b-82e5-f0e45bb45b7a',
  'official_manufacturer',
  'https://www.tamiya.com/japan/products/18022/index.html',
  array['itemNumber','releaseYear','chassis','editionName'],
  date '2026-09-19',
  'Official Tamiya page states first release month January 1990.'
),
(
  '00eaf050-cf2a-49c3-969f-7309be6fe0f2',
  'c63b8f4a-43f3-597b-82e5-f0e45bb45b7a',
  'trusted_secondary',
  'https://www.1999.co.jp/10087287',
  array['barcodeJAN'],
  date '2026-09-19',
  'Hobby Search corroborates JAN 4950344180226.'
),
(
  '3dbee309-459a-43e0-9d7d-11186fbd4e89',
  '7e6cd351-658c-5558-bff9-3a1ea608e6d4',
  'official_manufacturer',
  'https://www.tamiya.com/japan/products/95225/index.html',
  array['itemNumber','releaseDate','releaseYear','chassis','editionName'],
  date '2026-09-19',
  'Official Tamiya page documents ITEM 95225 and 2015-11-14 release.'
),
(
  '55ee2722-c381-422a-b509-4198ec435c13',
  '7e6cd351-658c-5558-bff9-3a1ea608e6d4',
  'trusted_secondary',
  'https://www.1999.co.jp/10343596',
  array['barcodeJAN'],
  date '2026-09-19',
  'Hobby Search corroborates JAN 4950344952250.'
),
(
  '709e6f14-1ecf-4039-9131-49ec5db97a8b',
  '0febe9c7-2a10-5766-9b87-1342121d3e38',
  'official_manufacturer',
  'https://www.tamiya.com/japan/products/18023/index.html',
  array['itemNumber','releaseYear','chassis','editionName'],
  date '2026-09-19',
  'Official Tamiya page states first release month March 1990.'
),
(
  '75c2acc1-8fec-4a5a-a490-610bb7b61ea8',
  '0febe9c7-2a10-5766-9b87-1342121d3e38',
  'trusted_secondary',
  'https://www.1999.co.jp/10087288',
  array['barcodeJAN'],
  date '2026-09-19',
  'Hobby Search corroborates JAN 4950344180233.'
),
(
  'bac3b9a7-18c1-4f36-9821-bd7bc0c1a54f',
  '4acac9d3-be92-45f0-b277-d1b89cc3a1df',
  'trusted_secondary',
  'https://www.rcjaz.co.uk/tamiya-94547-special-memorial-box-vol-mini-4wd-display-set-p-6625.html',
  array['editionName','releaseYear'],
  date '2026-09-19',
  'RCJAZ documents ITEM 94547 Memorial Box Vol.1 and explicitly lists Dash-3 Shooting Star among the five included complete kits.'
),
(
  '6d27fcf9-3f2e-4cd4-a4ba-1605b437af06',
  '6eb03b77-583b-469f-b1da-99cbfcf092b9',
  'trusted_secondary',
  'https://www.rcjaz.co.uk/tamiya-94547-special-memorial-box-vol-mini-4wd-display-set-p-6625.html',
  array['editionName','releaseYear'],
  date '2026-09-19',
  'RCJAZ documents ITEM 94547 Memorial Box Vol.1 and explicitly lists Cannonball among the five included complete kits.'
),
(
  '4ccc1a92-0fc0-459c-b0a1-8132ae0645b6',
  '648599ef-e45d-4362-b560-dacc70b5e781',
  'trusted_secondary',
  'https://www.rcjaz.co.uk/tamiya-94547-special-memorial-box-vol-mini-4wd-display-set-p-6625.html',
  array['editionName','releaseYear'],
  date '2026-09-19',
  'RCJAZ documents ITEM 94547 Memorial Box Vol.1 and explicitly lists Dash-5 Dancing Doll among the five included complete kits.'
),
(
  '3e30498f-36fd-40ea-9173-80a602f1c65e',
  '4acac9d3-be92-45f0-b277-d1b89cc3a1df',
  'trusted_secondary',
  'https://www.suruga-ya.jp/product/detail/603007008',
  array['releaseDate'],
  date '2026-09-19',
  'Suruga-ya documents parent set ITEM 94547 release date 2005-04-30.'
),
(
  '96526ac7-2521-44be-9ed2-8a808d59d6f2',
  '6eb03b77-583b-469f-b1da-99cbfcf092b9',
  'trusted_secondary',
  'https://www.suruga-ya.jp/product/detail/603007008',
  array['releaseDate'],
  date '2026-09-19',
  'Suruga-ya documents parent set ITEM 94547 release date 2005-04-30.'
),
(
  '41f85f8d-8421-44e6-9b81-6a95a58c0553',
  '648599ef-e45d-4362-b560-dacc70b5e781',
  'trusted_secondary',
  'https://www.suruga-ya.jp/product/detail/603007008',
  array['releaseDate'],
  date '2026-09-19',
  'Suruga-ya documents parent set ITEM 94547 release date 2005-04-30.'
)
on conflict (id) do update set
  release_id=excluded.release_id, source_type=excluded.source_type,
  source_url=excluded.source_url, verified_fields=excluded.verified_fields,
  checked_at=excluded.checked_at, notes=excluded.notes;

-- Enter every buildable Release into Market Method v4.
-- Auto-enrollment sees 18019/18022/18023 as reused identifiers and parks both
-- waves. Unique 18630 and 95225 may run unattended eBay Active.
insert into public.market_release_signals (
  release_id, condition, market_regime, market_value_eur, low_eur, high_eur,
  confidence_score, confidence_label, retail_anchor_eur, active_anchor_eur,
  sold_anchor_eur, retail_source_count, active_offer_count, current_offer_count,
  sold_units, sold_source_count, sold_evidence_count, shipping_known_ratio,
  algorithm_version, market_method_version, computed_at
)
select
  pr.id, 'new_complete_unbuilt', 'insufficient',
  null,null,null,0,'low',null,null,null,0,0,0,0,0,0,0,'r3','v4',now()
from public.product_releases pr
where pr.id in (
  '178ef6b8-594c-5cf4-8084-3c910576b29b',
  '4acac9d3-be92-45f0-b277-d1b89cc3a1df',
  'a743ba55-5883-4872-a4b5-5ab1134df426',
  'c63b8f4a-43f3-597b-82e5-f0e45bb45b7a',
  '6eb03b77-583b-469f-b1da-99cbfcf092b9',
  '7e6cd351-658c-5558-bff9-3a1ea608e6d4',
  '0febe9c7-2a10-5766-9b87-1342121d3e38',
  '648599ef-e45d-4362-b560-dacc70b5e781'
)
on conflict (release_id, condition) do nothing;
