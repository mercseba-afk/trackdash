-- Proto Emperor ZX historical release split + scanner identity audit.
--
-- The existing TrackDash row for item 18038 represented Tamiya's officially
-- documented 2007-09-01 resale. Independent historical evidence confirms the
-- same item number had an original commercial occurrence on 1992-02-18.
-- We preserve the existing 2007 Release UUID so any owned copies already tied
-- to it keep their meaning, convert it from Original -> Reissue, and add a NEW
-- stable Release UUID for the 1992 original. The Product canonical release is
-- then moved to the historical original.
--
-- Barcode provenance is also completed:
--   18038 2007 reissue -> JAN 4950344997107 (Hobby Search / HLJ)
--   95335 2017 Premium -> JAN 4950344953356 (Hobby Search / retailer data)
-- The 1992 original barcode remains NULL: UNKNOWN > INVENTED.

update product_releases
set release_type = 'Reissue',
    edition_type = 'reissue',
    edition_name = 'Proto Emperor ZX (2007 Reissue)',
    release_year = 2007,
    release_date = '2007-09-01',
    chassis = 'Zero',
    barcode_jan = '4950344997107',
    is_original = false,
    verification_status = 'verified',
    notes = 'Official Tamiya page documents this item 18038 occurrence as the 2007-09-01 resale. The historical 1992 original is modeled separately in TrackDash.',
    updated_at = now()
where id = '4d5b0a9a-498f-51fc-accd-9316ca11c843';

update product_releases
set barcode_jan = '4950344953356',
    rarity = 'Rare',
    verification_status = 'verified',
    updated_at = now()
where id = 'f0614cb8-d0cb-521d-aa2c-4fc304f39430';

insert into product_releases (
  id,
  product_id,
  item_number,
  release_type,
  edition_name,
  release_year,
  release_date,
  chassis,
  barcode_jan,
  color,
  country_market,
  notes,
  discontinued,
  is_original,
  rarity,
  edition_type,
  verification_status,
  production_status,
  status_checked_at,
  description,
  description_it
) values (
  '83e6ea7d-aa3d-5524-b640-73c407ee272a',
  'a1fd4f6d-0834-5f09-ac3c-5d4b398f0968',
  '18038',
  'Original',
  'Proto Emperor ZX (1992 Original)',
  1992,
  '1992-02-18',
  'Zero',
  null,
  'Purple body / gray Zero chassis / white large-diameter wheels',
  'Japan',
  'Original 1992 commercial occurrence of item 18038. A 1991 event pre-sale was reported before the regular February 1992 release. The later 2007 resale keeps item 18038 but is modeled as a separate TrackDash Release.',
  true,
  true,
  'Rare',
  'original',
  'partial',
  'discontinued',
  '2026-09-13',
  'The original Proto Emperor ZX commercial release on the Zero chassis.',
  'La release originale del 1992 della Proto Emperor ZX su telaio Zero.'
)
on conflict (id) do update set
  product_id = excluded.product_id,
  item_number = excluded.item_number,
  release_type = excluded.release_type,
  edition_name = excluded.edition_name,
  release_year = excluded.release_year,
  release_date = excluded.release_date,
  chassis = excluded.chassis,
  barcode_jan = excluded.barcode_jan,
  color = excluded.color,
  country_market = excluded.country_market,
  notes = excluded.notes,
  discontinued = excluded.discontinued,
  is_original = excluded.is_original,
  rarity = excluded.rarity,
  edition_type = excluded.edition_type,
  verification_status = excluded.verification_status,
  production_status = excluded.production_status,
  status_checked_at = excluded.status_checked_at,
  description = excluded.description,
  description_it = excluded.description_it,
  updated_at = now();

insert into release_sources (
  id, release_id, source_type, source_url, verified_fields, checked_at, notes
) values
  (
    '6c16171d-24b5-5a7b-b992-ecbc2818baad',
    '83e6ea7d-aa3d-5524-b640-73c407ee272a',
    'trusted_secondary',
    'https://corocoro-news.jp/special/317457/',
    array['itemNumber','editionName','chassis','releaseYear']::text[],
    '2026-09-13',
    'CoroCoro official editorial history identifies Proto Emperor ZX as a February 1992 commercial release, item 18038 / Zero chassis, and notes an earlier 1991 event pre-sale.'
  ),
  (
    '15060696-03b7-53af-a153-5709e9c61e79',
    '83e6ea7d-aa3d-5524-b640-73c407ee272a',
    'trusted_secondary',
    'https://w.atwiki.jp/mini4vipwiki/pages/107.html',
    array['itemNumber','releaseDate','chassis','releaseYear']::text[],
    '2026-09-13',
    'Independent Japanese Mini 4WD reference records ITEM 18038, Zero chassis, original sale 1992-02-18 and resale 2007-09-01.'
  ),
  (
    '46b62344-a015-5365-8f0e-f55ea2f70882',
    '4d5b0a9a-498f-51fc-accd-9316ca11c843',
    'trusted_secondary',
    'https://www.1999.co.jp/10086737',
    array['itemNumber','barcodeJAN','editionName','chassis']::text[],
    '2026-09-13',
    'Hobby Search identifies item 18038 / JAN 4950344997107 as Proto Emperor ZX on the Zero chassis.'
  ),
  (
    '4753afc0-5aa1-5d82-92e4-d3c50e7e3303',
    'f0614cb8-d0cb-521d-aa2c-4fc304f39430',
    'trusted_secondary',
    'https://www.1999.co.jp/10460640',
    array['itemNumber','barcodeJAN','editionName','chassis']::text[],
    '2026-09-13',
    'Hobby Search identifies item 95335 / JAN 4950344953356 as Proto Emperor ZX Premium on the Super-II chassis.'
  )
on conflict (id) do update set
  release_id = excluded.release_id,
  source_type = excluded.source_type,
  source_url = excluded.source_url,
  verified_fields = excluded.verified_fields,
  checked_at = excluded.checked_at,
  notes = excluded.notes;

update release_sources
set notes = 'Official Tamiya page documents item 18038 on the Zero chassis and explicitly dates the 2007 resale to 2007-09-01. It is evidence for the reissue, not the historical 1992 occurrence.',
    checked_at = '2026-09-13'
where id = '81682ed7-0173-52fb-8e03-3dcd1853750c';

update release_sources
set checked_at = '2026-09-13',
    notes = 'Official Tamiya page identifies item 95335 Proto Emperor ZX Premium, Super-II chassis, released 2017-07-15.'
where id = 'dd2218b0-2adc-51a9-8cba-d540e6c8212a';

update products
set canonical_item_number = '18038',
    canonical_release_id = '83e6ea7d-aa3d-5524-b640-73c407ee272a',
    chassis = 'Zero',
    original_release_year = 1992,
    description = 'Proto Emperor ZX debuted commercially in 1992 on the Zero chassis, was reissued under the same item 18038 in 2007, and received a Super-II Premium edition in 2017.',
    description_it = 'Proto Emperor ZX debuttò commercialmente nel 1992 su telaio Zero, fu ristampata con lo stesso item 18038 nel 2007 e ricevette una versione Premium su Super-II nel 2017.',
    updated_at = now()
where id = 'a1fd4f6d-0834-5f09-ac3c-5d4b398f0968';
