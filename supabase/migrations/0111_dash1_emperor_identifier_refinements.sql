-- Dash-1 Emperor safe identifier refinements after the family audit.
--
-- Add only identifiers that are stable for the exact Release. ITEM 18625 is a
-- deliberate exception: official Tamiya Japan and Tamiya USA currently publish
-- different GTIN/JAN-style identifiers for the same item, so TrackDash keeps its
-- single barcode_jan field NULL until the schema can represent regional codes.

update public.product_releases
set
  barcode_jan = '4950344089789',
  notes = '2026 spot-production reissue of ITEM 18025 on the Type 3 chassis. Tamiya official product data establishes the 2026-08-29 release; Japanese retail metadata independently confirms JAN 4950344089789 for this production wave. The Item Number is shared with the 1990 occurrence, so unattended marketplace attribution remains fail-closed.',
  updated_at = now()
where id = '79e32904-fe5d-5d30-bf54-8643ce4b42d3';

update public.product_releases
set
  barcode_jan = '4950344951109',
  notes = 'Official Tamiya memorial edition celebrating 30 years of the Japan Cup. Specialist Japanese product metadata confirms JAN 4950344951109 for ITEM 95110.',
  updated_at = now()
where id = 'b7eeb76a-e117-59ae-b31c-b099368421af';

update public.product_releases
set
  barcode_jan = '4950344956227',
  notes = 'Official Tamiya page states the 2021-08-21 release date and identifies ITEM 94666 from August 2008 as the initial version of this special kit. Specialist Japanese product metadata confirms JAN 4950344956227 for ITEM 95622.',
  updated_at = now()
where id = '2b202422-17d3-5800-9c10-e33541d67e10';

update public.product_releases
set
  barcode_jan = null,
  notes = 'Official Tamiya product identity for ITEM 18625 is verified, but the current regional catalogs expose two different identifiers: Tamiya Japan inventory lists 4950344064267 while the 2026 Tamiya USA MAP list exposes 4950344186259. TrackDash therefore keeps barcode_jan unset rather than pretending one regional code is universally canonical.',
  updated_at = now()
where id = '0306bc1a-cdb6-5b9c-9461-91cd2a39e07c';

insert into public.release_sources (
  id, release_id, source_type, source_url, verified_fields, checked_at, notes
) values
(
  '24632d44-27ed-5214-923c-33302acdf2d3',
  '79e32904-fe5d-5d30-bf54-8643ce4b42d3',
  'trusted_secondary',
  'https://www.yamada-denkiweb.com/7802582017/',
  array['itemNumber','releaseDate','releaseYear','barcodeJAN','editionName'],
  date '2026-09-19',
  'Yamada identifies Tamiya ITEM 18025 spot production, release date 2026-08-29 and JAN 4950344089789.'
),
(
  'c6959925-ab4a-5c9c-9a54-89a635affbff',
  'b7eeb76a-e117-59ae-b31c-b099368421af',
  'trusted_secondary',
  'https://www.1999.co.jp/10531183',
  array['itemNumber','barcodeJAN','editionName'],
  date '2026-09-19',
  'Hobby Search identifies ITEM 95110 and JAN 4950344951109.'
),
(
  'cafecba5-78a9-51a1-938f-8f9fe3810430',
  '2b202422-17d3-5800-9c10-e33541d67e10',
  'trusted_secondary',
  'https://www.1999.co.jp/10778417',
  array['itemNumber','barcodeJAN','editionName'],
  date '2026-09-19',
  'Hobby Search identifies ITEM 95622 and JAN 4950344956227.'
),
(
  '6f45258b-99f5-50d6-b61f-1c4bcacd64fc',
  '0306bc1a-cdb6-5b9c-9461-91cd2a39e07c',
  'official_catalog_pdf',
  'https://www.e-tamiya.com/download/zaikocheck/list_mini4.pdf',
  array[]::text[],
  date '2026-09-19',
  'Official Tamiya Japan inventory lists ITEM 18625 with identifier 4950344064267. Stored as provenance only because Tamiya USA publishes a different regional identifier.'
),
(
  '8af5567f-382a-5eb4-a984-0810df259046',
  '0306bc1a-cdb6-5b9c-9461-91cd2a39e07c',
  'official_catalog_pdf',
  'https://www.tamiyausa.com/media/files/map-feb-2026-1239-08db.pdf',
  array[]::text[],
  date '2026-09-19',
  'Official Tamiya USA 2026 MAP list exposes ITEM 18625 with GTIN 4950344186259. TrackDash deliberately does not collapse this and the Japan code into one canonical barcode.'
)
on conflict (id) do update set
  release_id=excluded.release_id,
  source_type=excluded.source_type,
  source_url=excluded.source_url,
  verified_fields=excluded.verified_fields,
  checked_at=excluded.checked_at,
  notes=excluded.notes;
