-- LB-ER34 Super Silhouette Nissan Skyline
-- First complete Hot Wheels casting-family audit in TrackDash.
--
-- Canonical hierarchy:
--   Product = casting
--   ProductRelease = meaningful commercial release/variation
--   Subvariant = minor manufacturing/package difference
--
-- This migration adds 8 historical/current Releases to the existing JBK59
-- pilot Release, for 9 canonical Releases total. The reported 2023 ZAMAC
-- 10-piece HKF21 variant is NOT inserted yet because independent
-- corroboration is still required.

-- ---------------------------------------------------------------------------
-- CASTING / PRODUCT
-- ---------------------------------------------------------------------------

update public.products
set
  original_release_year = 2022,
  description = coalesce(description, 'Hot Wheels LB-ER34 Super Silhouette Nissan Skyline casting, introduced in 2022 through Car Culture: Mountain Drifters. TrackDash groups meaningful commercial variations under this exact casting.'),
  metadata = coalesce(metadata, '{}'::jsonb) || '{"pilot":true,"casting_debut_year":2022,"casting_debut_series":"Car Culture: Mountain Drifters"}'::jsonb,
  updated_at = now()
where id = '5fbe93c1-ec35-5351-a34f-f754cd032920';

-- ---------------------------------------------------------------------------
-- RELEASES
-- ---------------------------------------------------------------------------

insert into public.product_releases (
  id, product_id, release_type, edition_type, edition_name, release_year,
  color, notes, discontinued, is_original, rarity, data_source,
  verification_status, production_status
) values
  (
    'f16ed92f-34fb-5fd6-bd8b-c26ff3e831ee',
    '5fbe93c1-ec35-5351-a34f-f754cd032920',
    'Premium',
    'original',
    'Car Culture Mountain Drifters LB-ER34 Super Silhouette Nissan Skyline — HCJ81',
    2022,
    'Red',
    'Debut commercial Release of this Hot Wheels casting; Mountain Drifters 4/5.',
    false,
    true,
    null,
    'trusted_secondary',
    'verified',
    'unknown'
  ),
  (
    '6fa99b92-d5e8-5b63-883c-b9250afe2486',
    '5fbe93c1-ec35-5351-a34f-f754cd032920',
    'Special Edition',
    'special',
    'Car Culture Mountain Drifters Chase LB-ER34 Super Silhouette Nissan Skyline — HCK01',
    2022,
    'Black',
    'Mountain Drifters 0/5 Chase.',
    false,
    false,
    null,
    'trusted_secondary',
    'verified',
    'unknown'
  ),
  (
    'a8f73ad5-0f8b-582d-b40b-fb25978386f7',
    '5fbe93c1-ec35-5351-a34f-f754cd032920',
    'Premium',
    'premium',
    'Team Transport #44 LB-ER34 Super Silhouette Nissan Skyline & Fleet Street — HCN54',
    2022,
    'Imperial red',
    'Car Culture Team Transport #44; packaged with Fleet Street.',
    false,
    false,
    null,
    'trusted_secondary',
    'verified',
    'unknown'
  ),
  (
    '946227f9-a7b3-5b83-96a8-e262d248761c',
    '5fbe93c1-ec35-5351-a34f-f754cd032920',
    'Premium',
    'premium',
    'Boulevard #70 LB-ER34 Super Silhouette Nissan Skyline — HKF21',
    2023,
    'White',
    '2023 Boulevard #70.',
    false,
    false,
    null,
    'trusted_secondary',
    'verified',
    'unknown'
  ),
  (
    'bfdb6a8f-29eb-5d14-aaa8-796b6cd7d202',
    '5fbe93c1-ec35-5351-a34f-f754cd032920',
    'Premium',
    'premium',
    'Car Culture 2-Pack Nissan Skylines LB-ER34 Super Silhouette Nissan Skyline — HKF49',
    2023,
    'Red',
    'Sold as part of the official Mattel Car Culture 2-Pack with Nissan Skyline Silhouette. Set-level SKU HKF49.',
    false,
    false,
    null,
    'mattel_official',
    'verified',
    'unknown'
  ),
  (
    '6db235b9-f2aa-5149-86b9-4b3d38ccc497',
    '5fbe93c1-ec35-5351-a34f-f754cd032920',
    'Premium',
    'premium',
    'Team Transport Fast & Furious LB-ER34 Super Silhouette Nissan Skyline & Carry On — HPX97',
    2023,
    'Silver',
    'Fast & Furious Car Culture Team Transport release packaged with Carry On.',
    false,
    false,
    null,
    'trusted_secondary',
    'verified',
    'unknown'
  ),
  (
    '97c74128-e89c-5b5d-b7aa-a8734d8fd3ab',
    '5fbe93c1-ec35-5351-a34f-f754cd032920',
    'Reissue',
    'reissue',
    'Boulevard All Stars LB-ER34 Super Silhouette Nissan Skyline — JDJ24',
    2024,
    'White',
    'Boulevard All Stars repackaging/rerelease; collector references describe the deco as identical to HKF21.',
    false,
    false,
    null,
    'trusted_secondary',
    'verified',
    'unknown'
  ),
  (
    '484b32b2-ca17-5bd9-af5b-68d50746b1b5',
    '5fbe93c1-ec35-5351-a34f-f754cd032920',
    'Special Edition',
    'special',
    'Car Culture Aérostyles Chase LB-ER34 Super Silhouette Nissan Skyline — JKF36',
    2026,
    'Gold',
    'Aérostyles 0/5 Chase.',
    false,
    false,
    null,
    'trusted_secondary',
    'verified',
    'unknown'
  )
on conflict (id) do nothing;

-- Existing 2025 JBK59 pilot Release remains unchanged as a ProductRelease.

-- ---------------------------------------------------------------------------
-- HOT WHEELS RELEASE DETAILS
-- ---------------------------------------------------------------------------

insert into public.hotwheels_release_details (
  release_id, line_slug, line_name, subseries, mix_code, collector_number,
  series_position, chase_type, packaging_variant, variation_code,
  country_of_manufacture, wheel_type, exclusivity, master_series, theme,
  metadata
) values
  (
    'f16ed92f-34fb-5fd6-bd8b-c26ff3e831ee',
    'car-culture', 'Car Culture', 'Mountain Drifters', null, null,
    '4/5', null, 'Car Culture illustrated blister card', 'A1',
    'Thailand', 'RRM5SP', null, 'Car Culture', 'Car Culture',
    '{"casting_debut":true}'::jsonb
  ),
  (
    '6fa99b92-d5e8-5b63-883c-b9250afe2486',
    'car-culture', 'Car Culture', 'Mountain Drifters', null, null,
    '0/5', 'Chase', 'Car Culture illustrated blister card', 'B1',
    'Thailand', 'RRM5SP', null, 'Car Culture', 'Car Culture',
    '{}'::jsonb
  ),
  (
    'a8f73ad5-0f8b-582d-b40b-fb25978386f7',
    'team-transport', 'Team Transport', 'Car Culture: Team Transport', 'R', '44',
    '#44', null, 'Team Transport two-vehicle package with Fleet Street', 'C1',
    'Thailand', 'RR10SPM', null, 'Team Transport', 'Car Culture',
    '{}'::jsonb
  ),
  (
    '946227f9-a7b3-5b83-96a8-e262d248761c',
    'boulevard', 'Boulevard', null, null, '70',
    '#70', null, 'Numbered Boulevard packaging', 'D1',
    'Thailand', 'RRM5SP', 'Walmart', 'Boulevard', 'Premium',
    '{}'::jsonb
  ),
  (
    'bfdb6a8f-29eb-5d14-aaa8-796b6cd7d202',
    'car-culture-2-pack', 'Car Culture 2-Pack', 'Nissan Skylines', null, null,
    null, null, 'Car Culture 2-Pack with Nissan Skyline Silhouette', null,
    'Thailand', 'RRM5SP', null, 'Car Culture 2-Pack', 'Car Culture',
    '{"set_sku":true}'::jsonb
  ),
  (
    '6db235b9-f2aa-5149-86b9-4b3d38ccc497',
    'team-transport', 'Team Transport', 'Fast & Furious', 'U', null,
    null, null, 'Team Transport two-vehicle package with Carry On', null,
    'Thailand', 'RR5SPM', null, 'Team Transport', 'Car Culture',
    '{"collector_reference_chase_label":"observed in one secondary catalog; not promoted to canonical chase_type"}'::jsonb
  ),
  (
    '97c74128-e89c-5b5d-b7aa-a8734d8fd3ab',
    'boulevard', 'Boulevard', 'All Stars', null, null,
    null, null, 'Boulevard All Stars unnumbered packaging', 'D2',
    'Thailand', 'RRM5SP', null, 'Boulevard', 'Premium',
    '{"repackages_release_identifier":"HKF21"}'::jsonb
  ),
  (
    '00826404-8ffd-59ae-a089-33244b432d3d',
    'car-culture', 'Car Culture', 'Silhouettes', null, null,
    '1/5', null, 'Car Culture illustrated blister card', 'F1',
    'Thailand', 'RRM5SP', null, 'Car Culture', 'Car Culture',
    '{"scale":"1:64","body_chassis":"Metal/Metal","wheels":"Real Riders"}'::jsonb
  ),
  (
    '484b32b2-ca17-5bd9-af5b-68d50746b1b5',
    'car-culture', 'Car Culture', 'Aérostyles', 'U', null,
    '0/5', 'Chase', 'Car Culture illustrated blister card', 'G1',
    'Thailand', 'RRM5SP', null, 'Car Culture', 'Car Culture',
    '{}'::jsonb
  )
on conflict (release_id) do update set
  line_slug = excluded.line_slug,
  line_name = excluded.line_name,
  subseries = excluded.subseries,
  mix_code = excluded.mix_code,
  collector_number = excluded.collector_number,
  series_position = excluded.series_position,
  chase_type = excluded.chase_type,
  packaging_variant = excluded.packaging_variant,
  variation_code = excluded.variation_code,
  country_of_manufacture = excluded.country_of_manufacture,
  wheel_type = excluded.wheel_type,
  exclusivity = excluded.exclusivity,
  master_series = excluded.master_series,
  theme = excluded.theme,
  metadata = excluded.metadata,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- IDENTIFIERS
-- ---------------------------------------------------------------------------

insert into public.release_identifiers (
  id, release_id, scheme, value, market, is_primary, verification_status,
  source_url, checked_at
) values
  (
    '22f90bf8-f376-5557-a79e-45dd715b576c',
    'f16ed92f-34fb-5fd6-bd8b-c26ff3e831ee',
    'mattel_toy_number', 'HCJ81', null, true, 'verified',
    'https://catalog.hwcollectorsnews.com/SeriesDefinitions/Details/1477',
    '2026-09-23'
  ),
  (
    '9b522f3e-d604-5d32-90b7-928817cbaf5e',
    '6fa99b92-d5e8-5b63-883c-b9250afe2486',
    'mattel_toy_number', 'HCK01', null, true, 'verified',
    'https://www.hwtreasure.com/lb-er34-super-silhouette-nissan-skyline/',
    '2026-09-23'
  ),
  (
    '3c2ab964-7d0c-5bfc-a54e-91c6aaabe084',
    'a8f73ad5-0f8b-582d-b40b-fb25978386f7',
    'mattel_toy_number', 'HCN54', null, true, 'verified',
    'https://www.164custom.com/team-transport_series.html',
    '2026-09-23'
  ),
  (
    '38352341-237c-5f80-8918-80eeda0e7a67',
    '946227f9-a7b3-5b83-96a8-e262d248761c',
    'mattel_toy_number', 'HKF21', null, true, 'verified',
    'https://catalog.hwcollectorsnews.com/SeriesDefinitions/Details/1591',
    '2026-09-23'
  ),
  (
    'bf610a6e-7b3d-5282-a5c1-4336ab032adb',
    'bfdb6a8f-29eb-5d14-aaa8-796b6cd7d202',
    'mattel_set_sku', 'HKF49', null, true, 'verified',
    'https://creations.mattel.com/en-it/products/hot-wheels-premium-car-culture-2-pack-hkf49',
    '2026-09-23'
  ),
  (
    'd9c70296-370f-5385-afd5-bee72f38aef0',
    '6db235b9-f2aa-5149-86b9-4b3d38ccc497',
    'mattel_toy_number', 'HPX97', null, true, 'verified',
    'https://www.164custom.com/hot-wheels/car-culture-team-transport/2023.html',
    '2026-09-23'
  ),
  (
    '8f55964d-ece2-546e-9968-6942087d1136',
    '97c74128-e89c-5b5d-b7aa-a8734d8fd3ab',
    'mattel_toy_number', 'JDJ24', null, true, 'verified',
    'https://catalog.hwcollectorsnews.com/SeriesDefinitions/Details/1861',
    '2026-09-23'
  ),
  (
    '6dc1c84a-f911-526f-89e1-1580eebde4e2',
    '484b32b2-ca17-5bd9-af5b-68d50746b1b5',
    'mattel_toy_number', 'JKF36', null, true, 'verified',
    'https://catalog.hwcollectorsnews.com/seriesdefinitions/details/2311',
    '2026-09-23'
  )
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- PROVENANCE
-- ---------------------------------------------------------------------------

insert into public.release_sources (
  id, release_id, source_type, source_url, verified_fields, checked_at, notes
) values
  (
    '297ae42b-7e93-57c8-93a2-026204b8b4be',
    'f16ed92f-34fb-5fd6-bd8b-c26ff3e831ee',
    'trusted_secondary',
    'https://catalog.hwcollectorsnews.com/SeriesDefinitions/Details/1477',
    array['editionName','releaseYear','color','hotwheelsDetails.seriesPosition','hotwheelsDetails.variationCode','hotwheelsDetails.countryOfManufacture','hotwheelsDetails.wheelType'],
    '2026-09-23',
    'Hot Wheels Newsletter confirms HCJ81 as the 2022 Mountain Drifters 4/5 red debut variation, made in Thailand with RRM5SP wheels.'
  ),
  (
    '3bfb067e-23a0-5397-96cb-8c526bd9e4d4',
    '6fa99b92-d5e8-5b63-883c-b9250afe2486',
    'trusted_secondary',
    'https://catalog.hwcollectorsnews.com/SeriesDefinitions/Details/1477',
    array['editionName','releaseYear','color','hotwheelsDetails.seriesPosition','hotwheelsDetails.variationCode','hotwheelsDetails.countryOfManufacture','hotwheelsDetails.wheelType'],
    '2026-09-23',
    'Hot Wheels Newsletter confirms HCK01 as the black Mountain Drifters 0/5 Chase.'
  ),
  (
    'ce5027f8-01d6-5a90-84ea-a51837f2a1cd',
    '6fa99b92-d5e8-5b63-883c-b9250afe2486',
    'trusted_secondary',
    'https://www.hwtreasure.com/lb-er34-super-silhouette-nissan-skyline/',
    array['editionName','releaseYear','color','hotwheelsDetails.chaseType'],
    '2026-09-23',
    'HWtreasure independently corroborates HCK01 as the 2022 Mountain Drifters Chase.'
  ),
  (
    '4ed5f865-d0eb-5963-9ca1-57a0c9e64792',
    'a8f73ad5-0f8b-582d-b40b-fb25978386f7',
    'trusted_secondary',
    'https://www.164custom.com/team-transport_series.html',
    array['editionName','releaseYear','color','hotwheelsDetails.collectorNumber','hotwheelsDetails.mixCode'],
    '2026-09-23',
    'Collector checklist confirms HCN54 as 2022 Team Transport #44, Mix R.'
  ),
  (
    '2bbdb44b-aba8-52ce-8c43-5f577a52cb2e',
    '946227f9-a7b3-5b83-96a8-e262d248761c',
    'trusted_secondary',
    'https://catalog.hwcollectorsnews.com/SeriesDefinitions/Details/1591',
    array['editionName','releaseYear','color','hotwheelsDetails.collectorNumber','hotwheelsDetails.variationCode','hotwheelsDetails.countryOfManufacture','hotwheelsDetails.wheelType'],
    '2026-09-23',
    'Hot Wheels Newsletter confirms HKF21 as 2023 Boulevard #70, variation D1, Thailand, RRM5SP.'
  ),
  (
    '0e2c4b0f-d0ba-528b-b298-0a314f7afd31',
    '946227f9-a7b3-5b83-96a8-e262d248761c',
    'trusted_secondary',
    'https://99diecast.com/products/hot-wheels-lb-er34-super-silhouette-nissan-skyline-boulevard-2023-70',
    array['hotwheelsDetails.exclusivity'],
    '2026-09-23',
    'Retail collector reference identifies the 2023 Boulevard release as Walmart/store exclusive.'
  ),
  (
    'd1d8d3ce-e2f9-5a60-a23a-1f6fffb1d9ba',
    'bfdb6a8f-29eb-5d14-aaa8-796b6cd7d202',
    'official_manufacturer',
    'https://creations.mattel.com/en-it/products/hot-wheels-premium-car-culture-2-pack-hkf49',
    array['editionName','releaseYear'],
    '2026-09-23',
    'Mattel confirms official Car Culture Nissan Skylines 2-Pack SKU HKF49 including the LB-ER34 Super Silhouette Nissan Skyline.'
  ),
  (
    '881c11b0-bf53-5cff-86d4-8facc383ce25',
    '6db235b9-f2aa-5149-86b9-4b3d38ccc497',
    'trusted_secondary',
    'https://www.164custom.com/hot-wheels/car-culture-team-transport/2023.html',
    array['editionName','releaseYear','color','hotwheelsDetails.mixCode'],
    '2026-09-23',
    'Collector checklist confirms HPX97 as 2023 Team Transport Fast & Furious, silver, Mix U.'
  ),
  (
    '4f625200-49c5-5ec8-bc22-22279beb6910',
    '6db235b9-f2aa-5149-86b9-4b3d38ccc497',
    'trusted_secondary',
    'https://hotwheels.fandom.com/wiki/2023_Car_Culture%3A_Team_Transport',
    array['hotwheelsDetails.countryOfManufacture','hotwheelsDetails.wheelType'],
    '2026-09-23',
    'Collector reference corroborates Thailand manufacture and RR5SPM wheels. Chase labeling remains intentionally unpromoted pending stronger corroboration.'
  ),
  (
    'd2ec4857-5369-529b-a5e7-6c7d6f9a598b',
    '97c74128-e89c-5b5d-b7aa-a8734d8fd3ab',
    'trusted_secondary',
    'https://catalog.hwcollectorsnews.com/SeriesDefinitions/Details/1861',
    array['editionName','releaseYear','color','hotwheelsDetails.variationCode','hotwheelsDetails.countryOfManufacture','hotwheelsDetails.wheelType'],
    '2026-09-23',
    'Hot Wheels Newsletter confirms JDJ24 as the 2024 Boulevard All Stars rerelease, variation D2, identical deco to HKF21.'
  ),
  (
    '61bd4780-ef25-528b-8892-44c68e55e645',
    '484b32b2-ca17-5bd9-af5b-68d50746b1b5',
    'trusted_secondary',
    'https://catalog.hwcollectorsnews.com/seriesdefinitions/details/2311',
    array['editionName','releaseYear','color','hotwheelsDetails.seriesPosition','hotwheelsDetails.chaseType','hotwheelsDetails.variationCode','hotwheelsDetails.countryOfManufacture','hotwheelsDetails.wheelType'],
    '2026-09-23',
    'Hot Wheels Newsletter confirms JKF36 as the 2026 Aérostyles 0/5 gold Chase, G1, Thailand, RRM5SP.'
  ),
  (
    '11666a36-e2e4-577b-ae61-cae118cc4ca9',
    '484b32b2-ca17-5bd9-af5b-68d50746b1b5',
    'trusted_secondary',
    'https://orangetrackdiecast.com/2026/08/06/hot-wheels-2026-car-culture-aero-styles-u-case-report/',
    array['hotwheelsDetails.mixCode','hotwheelsDetails.chaseType'],
    '2026-09-23',
    'Orange Track Diecast independently corroborates the Aérostyles Mix U Chase identity.'
  )
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- CANONICAL CASTING RELEASE
-- ---------------------------------------------------------------------------

update public.products
set
  canonical_release_id = 'f16ed92f-34fb-5fd6-bd8b-c26ff3e831ee',
  original_release_year = 2022,
  updated_at = now()
where id = '5fbe93c1-ec35-5351-a34f-f754cd032920';
