-- Hot Wheels pilot catalog: first five exact collector Releases.
--
-- Scope:
--   1 RLC / 1 Elite 64 / 1 Super Treasure Hunt / 1 Boulevard / 1 Car Culture.
--
-- Deliberately NOT included:
-- - no canonical catalog images (image rights are still unresolved);
-- - no invented UPC/EAN;
-- - no invented rarity;
-- - no Market Value / ASK / SOLD observations yet;
-- - no public Hot Wheels navigation (vertical remains gated).

-- ---------------------------------------------------------------------------
-- PRODUCTS / CASTINGS
-- ---------------------------------------------------------------------------

insert into public.products (
  id, category_id, brand_id, slug, name, series, rarity, metadata
) values
  (
    'ee58f803-abd2-5f2e-925a-4e23b9ebd744',
    'cdaaff01-f4f9-52ff-951a-ddbbba542d5c',
    '6f100164-74bd-56bd-9dd1-221ea269ed8a',
    'hot-wheels-lamborghini-miura-p400-sv',
    'Lamborghini Miura P400 SV',
    'Hot Wheels',
    null,
    '{"pilot":true}'::jsonb
  ),
  (
    '55d5c7dd-9cc3-5a86-a77a-5d7f0bd25e9f',
    'cdaaff01-f4f9-52ff-951a-ddbbba542d5c',
    '6f100164-74bd-56bd-9dd1-221ea269ed8a',
    'hot-wheels-aston-martin-valkyrie',
    'Aston Martin Valkyrie',
    'Hot Wheels',
    null,
    '{"pilot":true}'::jsonb
  ),
  (
    '4a33a634-8c59-5aa7-8e19-db943050e82e',
    'cdaaff01-f4f9-52ff-951a-ddbbba542d5c',
    '6f100164-74bd-56bd-9dd1-221ea269ed8a',
    'hot-wheels-87-audi-quattro',
    '''87 Audi quattro',
    'Hot Wheels',
    null,
    '{"pilot":true}'::jsonb
  ),
  (
    'fbe56388-f5f6-54ae-96f1-dc6035217c28',
    'cdaaff01-f4f9-52ff-951a-ddbbba542d5c',
    '6f100164-74bd-56bd-9dd1-221ea269ed8a',
    'hot-wheels-alfa-romeo-gtv6-3-0',
    'Alfa Romeo GTV6 3.0',
    'Hot Wheels',
    null,
    '{"pilot":true}'::jsonb
  ),
  (
    '5fbe93c1-ec35-5351-a34f-f754cd032920',
    'cdaaff01-f4f9-52ff-951a-ddbbba542d5c',
    '6f100164-74bd-56bd-9dd1-221ea269ed8a',
    'hot-wheels-lb-er34-super-silhouette-nissan-skyline',
    'LB-ER34 Super Silhouette Nissan Skyline',
    'Hot Wheels',
    null,
    '{"pilot":true}'::jsonb
  )
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- EXACT COMMERCIAL RELEASES
-- ---------------------------------------------------------------------------

insert into public.product_releases (
  id,
  product_id,
  release_type,
  edition_type,
  edition_name,
  release_year,
  color,
  discontinued,
  is_original,
  rarity,
  data_source,
  verification_status,
  production_status
) values
  (
    '3d33ed78-11bb-53e5-8270-f98cbf8973ba',
    'ee58f803-abd2-5f2e-925a-4e23b9ebd744',
    'Limited Edition',
    'limited',
    'RLC ''71 Lamborghini Miura P400 SV — HWF11',
    2025,
    'Modified Spectraflame antifreeze',
    false,
    false,
    null,
    'mattel_official',
    'verified',
    'unknown'
  ),
  (
    '4fc40b09-13e6-50aa-825a-d200f3593dd8',
    '55d5c7dd-9cc3-5a86-a77a-5d7f0bd25e9f',
    'Premium',
    'premium',
    'Elite 64 Aston Martin Valkyrie — HWR91',
    2025,
    'Metallic teal',
    false,
    false,
    null,
    'mattel_official',
    'verified',
    'unknown'
  ),
  (
    '5df0b21d-965c-5515-9dbf-dfa4cd8b2774',
    '4a33a634-8c59-5aa7-8e19-db943050e82e',
    'Special Edition',
    'special',
    '2025 Super Treasure Hunt ''87 Audi quattro — JBC35',
    2025,
    'Spectraflame seafoam green',
    false,
    false,
    null,
    'trusted_secondary',
    'verified',
    'unknown'
  ),
  (
    '6ab4881e-a184-5bb0-9cf1-a57109c4ea9a',
    'fbe56388-f5f6-54ae-96f1-dc6035217c28',
    'Premium',
    'premium',
    'Boulevard Alfa Romeo GTV6 3.0 — JBL16',
    2025,
    null,
    false,
    false,
    null,
    'mattel_official',
    'verified',
    'unknown'
  ),
  (
    '00826404-8ffd-59ae-a089-33244b432d3d',
    '5fbe93c1-ec35-5351-a34f-f754cd032920',
    'Premium',
    'premium',
    'Car Culture Silhouettes LB-ER34 Super Silhouette Nissan Skyline — JBK59',
    2025,
    'White',
    false,
    false,
    null,
    'mattel_official',
    'verified',
    'unknown'
  )
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- HOT WHEELS-SPECIFIC RELEASE DETAILS
-- ---------------------------------------------------------------------------

insert into public.hotwheels_release_details (
  release_id,
  line_slug,
  line_name,
  subseries,
  mix_code,
  collector_number,
  series_position,
  chase_type,
  packaging_variant,
  metadata
) values
  (
    '3d33ed78-11bb-53e5-8270-f98cbf8973ba',
    'red-line-club',
    'Red Line Club',
    'RLC Exclusive',
    null,
    null,
    null,
    null,
    'Acrylic case with decorative outer box',
    '{"scale":"1:64","body_type":"ZAMAC","wheels":"Real Riders Kidney Bean"}'::jsonb
  ),
  (
    '4fc40b09-13e6-50aa-825a-d200f3593dd8',
    'elite-64',
    'Elite 64',
    null,
    null,
    null,
    null,
    null,
    'Illustrated blister card in Kar Keepers clamshell',
    '{"scale":"1:64","body_type":"ZAMAC","feature":"opening gull-wing doors"}'::jsonb
  ),
  (
    '5df0b21d-965c-5515-9dbf-dfa4cd8b2774',
    'mainline',
    'Mainline',
    'Factory Fresh',
    'A',
    '016/250',
    '2/5',
    'Super Treasure Hunt',
    'Mainline blister card',
    '{"scale":"1:64","wheel_type":"Real Riders"}'::jsonb
  ),
  (
    '6ab4881e-a184-5bb0-9cf1-a57109c4ea9a',
    'boulevard',
    'Boulevard',
    null,
    null,
    null,
    null,
    null,
    'Numbered Boulevard packaging',
    '{"scale":"1:64","body_chassis":"Metal/Metal","wheels":"Real Riders"}'::jsonb
  ),
  (
    '00826404-8ffd-59ae-a089-33244b432d3d',
    'car-culture',
    'Car Culture',
    'Silhouettes',
    null,
    null,
    '1/5',
    null,
    'Car Culture illustrated blister card',
    '{"scale":"1:64","body_chassis":"Metal/Metal","wheels":"Real Riders"}'::jsonb
  )
on conflict (release_id) do nothing;

-- ---------------------------------------------------------------------------
-- RELEASE IDENTIFIERS
-- ---------------------------------------------------------------------------

insert into public.release_identifiers (
  id,
  release_id,
  scheme,
  value,
  market,
  is_primary,
  verification_status,
  source_url,
  checked_at
) values
  (
    '78716661-15d6-5d27-b1d6-4ebecbdc4f1d',
    '3d33ed78-11bb-53e5-8270-f98cbf8973ba',
    'mattel_sku',
    'HWF11',
    null,
    true,
    'verified',
    'https://creations.mattel.com/products/hot-wheels-rlc-71-lamborghini-hwf11',
    '2026-09-23'
  ),
  (
    '69a62c5e-fed1-5b8e-8845-2d72f368bfeb',
    '4fc40b09-13e6-50aa-825a-d200f3593dd8',
    'mattel_sku',
    'HWR91',
    null,
    true,
    'verified',
    'https://creations.mattel.com/products/hot-wheels-elite-64-aston-martin-valkyrie-hwr91',
    '2026-09-23'
  ),
  (
    '3b2dda73-38ae-569e-9342-3e8b013080e4',
    '5df0b21d-965c-5515-9dbf-dfa4cd8b2774',
    'mattel_toy_number',
    'JBC35',
    null,
    true,
    'verified',
    'https://www.hwtreasure.com/2025-super/87-audi-quattro/',
    '2026-09-23'
  ),
  (
    '55f38e32-6684-55db-88a5-c3f468f9ce75',
    '6ab4881e-a184-5bb0-9cf1-a57109c4ea9a',
    'mattel_sku',
    'JBL16',
    null,
    true,
    'verified',
    'https://creations.mattel.com/products/hot-wheels-boulevard-vehicle-jbl16',
    '2026-09-23'
  ),
  (
    'a3969e8b-a764-5791-917b-2afd0d989482',
    '00826404-8ffd-59ae-a089-33244b432d3d',
    'mattel_sku',
    'JBK59',
    null,
    true,
    'verified',
    'https://creations.mattel.com/en-de/products/hot-wheels-premium-car-culture-silhouettes-lb-er34-nissan-skyline-jbk59',
    '2026-09-23'
  )
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- FACTUAL PROVENANCE
-- ---------------------------------------------------------------------------

insert into public.release_sources (
  id,
  release_id,
  source_type,
  source_url,
  verified_fields,
  checked_at,
  notes
) values
  (
    'f92c4eb1-b8df-5d2b-929e-12414f134685',
    '3d33ed78-11bb-53e5-8270-f98cbf8973ba',
    'official_manufacturer',
    'https://creations.mattel.com/products/hot-wheels-rlc-71-lamborghini-hwf11',
    array['editionName','releaseYear','color'],
    '2026-09-23',
    'Mattel confirms the 2025 RLC release identity, HWF11 SKU, Spectraflame antifreeze color and 1:64 specification.'
  ),
  (
    '4a033614-7bf0-511a-bc91-f1920d1646cf',
    '4fc40b09-13e6-50aa-825a-d200f3593dd8',
    'official_manufacturer',
    'https://creations.mattel.com/en-fr/products/hot-wheels-elite-64-aston-martin-valkyrie-hwr91',
    array['editionName','releaseYear','color'],
    '2026-09-23',
    'Mattel confirms the Elite 64 Aston Martin Valkyrie identity, HWR91 SKU, metallic teal color and 2025 product copyright.'
  ),
  (
    'e052b8f6-2472-5481-8382-7321a6f48582',
    '5df0b21d-965c-5515-9dbf-dfa4cd8b2774',
    'trusted_secondary',
    'https://www.hwtreasure.com/2025-super/87-audi-quattro/',
    array['editionName','releaseYear','color'],
    '2026-09-23',
    'HWtreasure identifies JBC35 as the 2025 Super Treasure Hunt, Mix A, Factory Fresh 2/5, collector number 16/250.'
  ),
  (
    '762c7bf5-1276-5ef0-83b7-70968efaeac3',
    '5df0b21d-965c-5515-9dbf-dfa4cd8b2774',
    'trusted_secondary',
    'https://catalog.hwcollectorsnews.com/seriesdefinitions/details/1941',
    array['editionName','releaseYear'],
    '2026-09-23',
    'Hot Wheels Newsletter collector catalog independently corroborates JBC35 as the 2025 Super Treasure Hunt Audi quattro.'
  ),
  (
    '61ee7290-2f8c-5529-bd3b-8441b70d6781',
    '6ab4881e-a184-5bb0-9cf1-a57109c4ea9a',
    'official_manufacturer',
    'https://creations.mattel.com/products/hot-wheels-boulevard-vehicle-jbl16',
    array['editionName','releaseYear'],
    '2026-09-23',
    'Mattel confirms the Boulevard Alfa Romeo GTV6 3.0 identity, JBL16 SKU and 2025 product copyright.'
  ),
  (
    'f0965faa-f542-5ba0-9016-d3c48ee2e584',
    '00826404-8ffd-59ae-a089-33244b432d3d',
    'official_manufacturer',
    'https://creations.mattel.com/en-de/products/hot-wheels-premium-car-culture-silhouettes-lb-er34-nissan-skyline-jbk59',
    array['editionName','releaseYear'],
    '2026-09-23',
    'Mattel confirms the Car Culture Silhouettes LB-ER34 release identity, JBK59 SKU and 2025 product copyright.'
  ),
  (
    'ba89181a-7227-5183-b4b4-ae56e18732e0',
    '00826404-8ffd-59ae-a089-33244b432d3d',
    'trusted_secondary',
    'https://hotwheels.fandom.com/wiki/2025_Car_Culture',
    array['color'],
    '2026-09-23',
    'Collector reference corroborates JBK59 as Silhouettes 1/5 with white body color.'
  )
on conflict (id) do nothing;
