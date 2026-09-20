-- Manta Ray Mk.II family baseline.
-- Catalog-only on purpose: Price Intelligence enrollment is deferred until the
-- already-pending market queues have passed through the post-fix cron worker.
--
-- Identity notes:
-- - 18615 is the canonical Manta Ray Mk.II, released 2006-12-09 on MS chassis.
-- - 94665 is the earlier Black Special (2008) and is NOT conflated with 95466.
-- - 95466 is the distinct 2019 Black Special reissue; Tamiya later issued a
--   new production/release wave on 2023-08-26.
-- - No market signal is created here, so this migration cannot add scan jobs.

insert into public.products (
  id, category_id, brand_id, slug, canonical_item_number, name, japanese_name,
  series, chassis, original_release_year, rarity, description, description_it,
  metadata, canonical_release_id
) values (
  '277030d7-5caa-517a-b3d1-bd52d9c48815',
  'cd755fcb-2bc5-5975-8ec0-f45e7df891cc',
  '382feca9-48e9-5144-a92d-41f77fb7e438',
  'manta-ray-mkii-18615',
  null,
  'Manta Ray Mk.II',
  'マンタレイMk.II',
  'Mini 4WD PRO',
  null,
  null,
  'Uncommon',
  'The second-generation Manta Ray Mini 4WD family, introduced as ITEM 18615 on the MS chassis in 2006. TrackDash keeps the original Black Special (94665), the 2019 Black Special reissue (95466), White Specials and later variants as distinct Releases whenever their production identity can be verified.',
  'La seconda generazione della famiglia Manta Ray Mini 4WD, introdotta nel 2006 come ITEM 18615 su telaio MS. TrackDash mantiene separate la Black Special originale (94665), la ristampa Black Special del 2019 (95466), le White Special e le varianti successive quando l’identità della specifica Release può essere verificata.',
  '{}'::jsonb,
  null
)
on conflict (id) do update set
  slug=excluded.slug,
  name=excluded.name,
  japanese_name=excluded.japanese_name,
  series=excluded.series,
  rarity=excluded.rarity,
  description=excluded.description,
  description_it=excluded.description_it,
  updated_at=now();

insert into public.product_releases (
  id, product_id, item_number, release_type, edition_name, release_year,
  release_date, chassis, barcode_jan, color, country_market, notes,
  discontinued, is_original, rarity, data_source, edition_type,
  verification_status, production_status, status_checked_at,
  description, description_it
) values
(
  '6a14c7a3-bd78-57b3-89fe-6c764818991a',
  '277030d7-5caa-517a-b3d1-bd52d9c48815',
  '18615',
  'Original',
  'Manta Ray Mk.II',
  2006,
  date '2006-12-09',
  'MS',
  '4950344186150',
  null,
  null,
  'Original Manta Ray Mk.II Mini 4WD PRO release. Tamiya confirms ITEM 18615, MS chassis and the 2006-12-09 release date. JAN 4950344186150 is independently corroborated by Japanese specialist retail metadata.',
  false,
  true,
  null,
  'audited_mixed',
  'original',
  'verified',
  'unknown',
  now(),
  'Original 2006 Manta Ray Mk.II on the MS chassis.',
  'Manta Ray Mk.II originale del 2006 su telaio MS.'
),
(
  'b2805fb7-cdd3-5dbf-a724-f73d54702844',
  '277030d7-5caa-517a-b3d1-bd52d9c48815',
  '95466',
  'Reissue',
  'Manta Ray Mk.II Black Special (2019 Reissue)',
  2019,
  date '2019-03-02',
  'MS',
  '4950344954667',
  'Smoke / Blue',
  null,
  '2019 reissue of the earlier ITEM 94665 Manta Ray Mk.II Black Special. Tamiya confirms ITEM 95466, MS chassis, first-release month March 2019 and a new 2023-08-26 release wave. Rakuten product metadata corroborates the exact 2019-03-02 release day and JAN 4950344954667; Tamiya USA official 2026 pricing data independently confirms the JAN. Regional availability signals differ, so TrackDash keeps production status conservative rather than declaring a global discontinued state.',
  false,
  false,
  null,
  'audited_mixed',
  'reissue',
  'verified',
  'unknown',
  now(),
  'Black Special reissue released in 2019, distinct from the earlier 94665 Black Special.',
  'Ristampa Black Special del 2019, distinta dalla precedente Black Special 94665.'
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
set canonical_release_id='6a14c7a3-bd78-57b3-89fe-6c764818991a',
    updated_at=now()
where id='277030d7-5caa-517a-b3d1-bd52d9c48815';

insert into public.release_sources (
  id, release_id, source_type, source_url, verified_fields, checked_at, notes
) values
(
  '2c81b209-b749-5bd9-820e-ddb05ad45161',
  '6a14c7a3-bd78-57b3-89fe-6c764818991a',
  'official_manufacturer',
  'https://www.tamiya.com/japan/products/18615/index.html',
  array['itemNumber','editionName','releaseDate','releaseYear','chassis'],
  date '2026-09-20',
  'Official Tamiya product page confirms ITEM 18615, Manta Ray Mk.II, MS chassis and release date 2006-12-09.'
),
(
  '42c1b209-b749-5bd9-820e-ddb05ad45162',
  '6a14c7a3-bd78-57b3-89fe-6c764818991a',
  'trusted_secondary',
  'https://www.1999.co.jp/10087709',
  array['barcodeJAN','itemNumber','chassis'],
  date '2026-09-20',
  'Hobby Search independently corroborates JAN 4950344186150 for ITEM 18615.'
),
(
  'e68962e8-c21b-547e-a84a-39ec4dde30e5',
  'b2805fb7-cdd3-5dbf-a724-f73d54702844',
  'official_manufacturer',
  'https://www.tamiya.com/japan/products/95466/index.html',
  array['itemNumber','editionName','releaseYear','chassis','color'],
  date '2026-09-20',
  'Official Tamiya page confirms ITEM 95466, Black Special specification, MS chassis, first-release month March 2019 and the later 2023-08-26 release wave.'
),
(
  '7bc0ac49-9ad9-5071-9e63-ced60bb3a629',
  'b2805fb7-cdd3-5dbf-a724-f73d54702844',
  'trusted_secondary',
  'https://product.rakuten.co.jp/product/-/789761af74736060b9d5bcb6c30f303e/',
  array['releaseDate','barcodeJAN','itemNumber'],
  date '2026-09-20',
  'Rakuten product metadata records release date 2019-03-02 and JAN 4950344954667 for ITEM 95466.'
),
(
  '071962d8-c519-5fd2-bbfb-7d710ac30780',
  'b2805fb7-cdd3-5dbf-a724-f73d54702844',
  'official_catalog_pdf',
  'https://www.tamiyausa.com/media/files/map-feb-2026-1239-08db.pdf',
  array['barcodeJAN','itemNumber','editionName'],
  date '2026-09-20',
  'Official Tamiya USA February 2026 MAP list independently confirms ITEM 95466 and JAN 4950344954667.'
)
on conflict (id) do update set
  release_id=excluded.release_id,
  source_type=excluded.source_type,
  source_url=excluded.source_url,
  verified_fields=excluded.verified_fields,
  checked_at=excluded.checked_at,
  notes=excluded.notes;

insert into public.release_images (id, release_id, url, position) values (
  '72d80de8-02cf-5a90-a83c-505d00d7a558',
  'b2805fb7-cdd3-5dbf-a724-f73d54702844',
  'https://d7z22c0gz59ng.cloudfront.net/japan_contents/img/usr/item/9/95466/95466_1.jpg',
  0
)
on conflict (id) do update set
  release_id=excluded.release_id,
  url=excluded.url,
  position=excluded.position;

-- Intentionally no market_release_signals insert here.
-- This preserves the current market queues until their first post-fix cron pass.
