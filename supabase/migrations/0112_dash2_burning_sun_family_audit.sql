-- Dash-2 Burning Sun family audit, stacked after Dash-1 migrations 0108–0111.
--
-- Catalog and Price Intelligence remain separate:
-- - real commercial/production occurrences may exist with zero market evidence;
-- - no Market Value is invented;
-- - reused Item Numbers are enrolled only after every known occurrence exists so
--   migration 0103 can keep unattended eBay attribution fail-closed.
--
-- Deliberately NOT published in this migration:
--   94819 Green-Plated Body Specification (2011): identity/JAN are verified,
--   but TrackDash still lacks a durable release-specific image URL suitable for
--   the catalog.
--   92343/92344/92345/92346 Burning Sun Helios (2016 amusement prizes):
--   identity is supported, but release-specific catalog imagery remains too weak.
--   ITEM 94615 Metallic Body Edition (2007) is a five-kit bundle, not a
--   standalone Burning Sun Release; it waits for explicit bundle/set modeling.

-- Existing original Type-1 and Type-3 rows: tighten provenance and identifiers.
update public.product_releases
set
  barcode_jan = '4950344180158',
  notes = 'Original Dash-2 Burning Sun on Type 1 chassis. Tamiya official archive places ITEM 18015 in February 1989. Exact day is intentionally not inferred. The current official product image depicts the Type-1 specification; it is not claimed as an archival 1989 package photo.',
  updated_at = now()
where id = '1d677e65-ca9c-5549-94c5-32e9b957b31a';

update public.product_releases
set
  barcode_jan = '4950344180264',
  notes = 'Type 3 occurrence of Dash-2 Burning Sun. Tamiya official product data identifies ITEM 18026 and the first release month as February 1990. Exact day remains unset because the official source gives the month, while day-level references are secondary.',
  updated_at = now()
where id = '45f04c74-a41c-5514-87a2-ab47ea6d66b6';

-- 2005 Memorial Box Vol.1 production occurrence.
-- Multiple catalog histories identify the Burning Sun inside parent set 94547 as
-- the Type-1 ITEM 18015 kit. The parent set itself has a 2005-04-30 release date.
-- Keep the standalone JAN NULL because the boxed component was not independently
-- sold with its own barcode; do not copy the parent box JAN or infer one.
insert into public.product_releases (
  id, product_id, item_number, release_type, edition_name, release_year,
  release_date, chassis, barcode_jan, color, country_market, notes,
  discontinued, is_original, rarity, data_source, edition_type,
  verification_status, production_status, status_checked_at
) values (
  'd748a354-b903-4810-9e85-cb715bb4099c',
  '3b443635-b33f-5553-a39d-eba8b8cafddb',
  '18015',
  'Reissue',
  'Dash-2 Burning Sun (Type 1 Chassis) — 2005 Memorial Box Vol.1 Reissue',
  2005,
  date '2005-04-30',
  'Type 1',
  null,
  'Green',
  'Japan',
  'Production occurrence supplied inside Tamiya Racer Mini 4WD Memorial Box Vol.1 (parent set ITEM 94547). Suruga-ya documents the box release date and contents; independent Mini 4WD catalog history identifies the included Burning Sun as the Type-1 ITEM 18015 kit. The current official 18015 image is reused only as a visual reference to the same physical specification, not as archival Memorial Box packaging.',
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
  data_source=excluded.data_source,
  edition_type=excluded.edition_type,
  verification_status=excluded.verification_status,
  production_status=excluded.production_status,
  status_checked_at=excluded.status_checked_at,
  updated_at=now();

-- 2008 MS-chassis kit.
-- The official Tamiya product page gives the exact date. Current regional
-- official catalogs expose different GTIN/JAN-style identifiers
-- (Japan 4950344064298 vs USA 4950344186280), so the single barcode_jan field
-- stays NULL rather than collapsing a regional distinction.
insert into public.product_releases (
  id, product_id, item_number, release_type, edition_name, release_year,
  release_date, chassis, barcode_jan, color, country_market, notes,
  discontinued, is_original, rarity, data_source, edition_type,
  verification_status, production_status, status_checked_at
) values (
  '4846e9d4-58be-4142-b8a6-a2cd72fea1db',
  '3b443635-b33f-5553-a39d-eba8b8cafddb',
  '18628',
  'Chassis Variant',
  'Dash-2 Burning Sun (MS Chassis)',
  2008,
  date '2008-11-01',
  'MS',
  null,
  'Green',
  null,
  'Official Tamiya kit released 2008-11-01 on MS chassis. TrackDash deliberately leaves barcode_jan unset because current official Japan inventory lists 4950344064298 while the Tamiya USA 2026 MAP list exposes 4950344186280.',
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
  data_source=excluded.data_source,
  edition_type=excluded.edition_type,
  verification_status=excluded.verification_status,
  production_status=excluded.production_status,
  status_checked_at=excluded.status_checked_at,
  updated_at=now();

-- 2009 factory-finished MS model. Keep outside new_complete_unbuilt valuation.
insert into public.product_releases (
  id, product_id, item_number, release_type, edition_name, release_year,
  release_date, chassis, barcode_jan, color, country_market, notes,
  discontinued, is_original, rarity, data_source, edition_type,
  verification_status, production_status, status_checked_at
) values (
  'b3517afc-c8ac-403f-882f-a065677b66b3',
  '3b443635-b33f-5553-a39d-eba8b8cafddb',
  '94675',
  'Other',
  'Dash-2 Burning Sun (MS Chassis) Finished Model',
  2009,
  date '2009-01-24',
  'MS',
  '4950344946754',
  'Green',
  null,
  'Factory-finished MS-chassis model. Contemporary January 2009 coverage reproducing the then-live Tamiya catalog page gives ITEM 94675 and a 2009-01-24 release date; specialist retail metadata confirms JAN 4950344946754. Finished products stay outside TrackDash new_complete_unbuilt valuation.',
  true,
  false,
  null,
  'audited_mixed',
  'other',
  'verified',
  'discontinued',
  now()
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
  notes=excluded.notes,
  discontinued=excluded.discontinued,
  is_original=excluded.is_original,
  data_source=excluded.data_source,
  edition_type=excluded.edition_type,
  verification_status=excluded.verification_status,
  production_status=excluded.production_status,
  status_checked_at=excluded.status_checked_at,
  updated_at=now();

insert into public.release_images (id, release_id, url, position) values
(
  '88d0aa8a-8c88-4645-8122-31d9243bdb48',
  'd748a354-b903-4810-9e85-cb715bb4099c',
  'https://www.tamiya.com/japan_contents/img/usr/item/1/18015/18015_1.jpg',
  0
),
(
  'dd9d76df-e371-40f6-87e0-52f6996e2460',
  '4846e9d4-58be-4142-b8a6-a2cd72fea1db',
  'https://www.tamiya.com/japan_contents/img/usr/item/1/18628/18628_1.jpg',
  0
),
(
  'bedc7242-400e-48f6-80d7-6dfaadbb9629',
  'b3517afc-c8ac-403f-882f-a065677b66b3',
  'https://www.tamiya.com/japan_contents/img/usr/item/9/94675/94675_1.jpg',
  0
)
on conflict (id) do update set
  release_id=excluded.release_id,
  url=excluded.url,
  position=excluded.position;

insert into public.release_sources (
  id, release_id, source_type, source_url, verified_fields, checked_at, notes
) values
(
  'fbde0522-1209-49ae-9ab2-f1968d246b95',
  'd748a354-b903-4810-9e85-cb715bb4099c',
  'trusted_secondary',
  'https://www.suruga-ya.jp/product/detail/603007008',
  array['releaseDate','releaseYear','editionName'],
  date '2026-09-19',
  'Suruga-ya identifies parent set ITEM 94547 Racer Mini 4WD Memorial Box Vol.1, release date 2005-04-30, and lists Dash-2 Burning Sun among its five included kits.'
),
(
  'a6d9a3c2-89f5-46c8-a22c-31802e3bd655',
  'd748a354-b903-4810-9e85-cb715bb4099c',
  'trusted_secondary',
  'https://streetmini4wd.altervista.org/php5/index.php?title=Storia_delle_Mini4wD',
  array['itemNumber','chassis','editionName'],
  date '2026-09-19',
  'Independent Mini 4WD catalog history explicitly identifies the Burning Sun in 94547 as Type-1 ITEM 18015.'
),
(
  '4817d53c-917f-48d5-96d5-b0a33ed495d1',
  '4846e9d4-58be-4142-b8a6-a2cd72fea1db',
  'official_manufacturer',
  'https://www.tamiya.com/japan/products/18628/index.html',
  array['itemNumber','releaseDate','releaseYear','chassis','editionName'],
  date '2026-09-19',
  'Official Tamiya product page documents ITEM 18628 and the exact 2008-11-01 release date.'
),
(
  '1366a6d8-7541-41e1-b101-d4437a2fbf3b',
  '4846e9d4-58be-4142-b8a6-a2cd72fea1db',
  'official_catalog_pdf',
  'https://www.e-tamiya.com/download/zaikocheck/list_mini4.pdf',
  array[]::text[],
  date '2026-09-19',
  'Official Tamiya Japan inventory lists ITEM 18628 with regional identifier 4950344064298. Stored as provenance only because Tamiya USA exposes a different identifier.'
),
(
  '6ced4384-1649-4519-b7c7-20b92405fef1',
  '4846e9d4-58be-4142-b8a6-a2cd72fea1db',
  'official_catalog_pdf',
  'https://www.tamiyausa.com/media/files/map-feb-2026-1239-08db.pdf',
  array[]::text[],
  date '2026-09-19',
  'Official Tamiya USA 2026 MAP list exposes ITEM 18628 with regional identifier 4950344186280. TrackDash deliberately does not collapse the two regional codes.'
),
(
  'bab74d19-2bc8-4c63-9eac-80b66c082532',
  'b3517afc-c8ac-403f-882f-a065677b66b3',
  'trusted_secondary',
  'https://www.tea-league.com/mt/tea/archives/2009/01/2ms_1.html',
  array['itemNumber','releaseDate','releaseYear','editionName','chassis','format'],
  date '2026-09-19',
  'Contemporary 2009 report reproduces details from the then-live official Tamiya 94675 catalog page and states the planned 2009-01-24 release.'
),
(
  '0abf0470-78ab-466f-a129-c5dfeb6dcc5c',
  'b3517afc-c8ac-403f-882f-a065677b66b3',
  'trusted_secondary',
  'https://item.rakuten.co.jp/llhat/4950344946754/',
  array['itemNumber','barcodeJAN','editionName','format'],
  date '2026-09-19',
  'Japanese retailer record identifies ITEM 94675 finished model and JAN 4950344946754.'
),
(
  '7bdc56a1-2dcc-488c-a1f1-c90525cbd4a0',
  '1d677e65-ca9c-5549-94c5-32e9b957b31a',
  'official_archive',
  'https://www.tamiya.com/japan/newitems_month/list.html?current=198902',
  array['itemNumber','releaseYear'],
  date '2026-09-19',
  'Official Tamiya monthly archive places ITEM 18015 in February 1989.'
),
(
  '55e0abb2-9b98-4a46-9447-965a1d0b0be8',
  '1d677e65-ca9c-5549-94c5-32e9b957b31a',
  'trusted_secondary',
  'https://www.1999.co.jp/10087275',
  array['barcodeJAN'],
  date '2026-09-19',
  'Hobby Search metadata corroborates JAN 4950344180158 for ITEM 18015.'
),
(
  'd228812b-74c0-42cc-8fa3-2775c6d8f9a3',
  '45f04c74-a41c-5514-87a2-ab47ea6d66b6',
  'trusted_secondary',
  'https://www.1999.co.jp/10087291',
  array['barcodeJAN'],
  date '2026-09-19',
  'Hobby Search metadata corroborates JAN 4950344180264 for ITEM 18026.'
)
on conflict (id) do update set
  release_id=excluded.release_id,
  source_type=excluded.source_type,
  source_url=excluded.source_url,
  verified_fields=excluded.verified_fields,
  checked_at=excluded.checked_at,
  notes=excluded.notes;

-- Enroll only buildable kit releases. Insert both 18015 occurrences after the
-- 2005 row exists, so auto-enrollment sees the reused Item Number and parks
-- eBay Active for both.
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
  '1d677e65-ca9c-5549-94c5-32e9b957b31a',
  'd748a354-b903-4810-9e85-cb715bb4099c',
  '45f04c74-a41c-5514-87a2-ab47ea6d66b6',
  '4846e9d4-58be-4142-b8a6-a2cd72fea1db'
)
on conflict (release_id, condition) do nothing;
