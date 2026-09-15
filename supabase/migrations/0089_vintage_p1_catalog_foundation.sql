-- Vintage 100 Pilot — P1 catalog foundation.
--
-- Adds five historically important Product models that were completely absent
-- from TrackDash, together with their original canonical Releases:
--   18023 Dash-5 Dancing Doll (1990 / Type 3)
--   18028 Dash-01 Super Emperor (1990 / Type 3)
--   18031 Avante 2001 Jr. (1990 / Zero)
--   18032 Crimson Glory (1990 / historical FM)
--   18034 Dash-02 Neo Burning Sun (1991 / historical FM)
--
-- Historical FM is deliberately stored as NULL for chassis in this migration:
-- the app's controlled Chassis vocabulary currently contains FM-A but not FM,
-- and TrackDash must never coerce the older FM chassis into the later FM-A.
-- The official Tamiya provenance records the FM fact in notes; a dedicated
-- vocabulary extension can populate the chassis column later without changing
-- any Product/Release identity.
--
-- Tamiya provides first-release MONTHS for these historical kits, but not an
-- exact calendar day in the evidence used here. release_date therefore remains
-- NULL; release_year is verified and month provenance is retained in notes.
--
-- No price/Market Value/liquidity rows are created here.

insert into products (
  id, category_id, brand_id, slug, canonical_item_number, name, japanese_name,
  series, chassis, original_release_year, rarity, description, canonical_release_id
) values
  (
    'a0bed8eb-2899-50f8-8746-a8d08f7a52b7',
    'cd755fcb-2bc5-5975-8ec0-f45e7df891cc',
    '382feca9-48e9-5144-a92d-41f77fb7e438',
    'dash-5-dancing-doll-18023', NULL, 'Dash-5 Dancing Doll',
    'ダッシュ5号D.D.(ダンシングドール)', 'Dash! Yonkuro', NULL, NULL,
    'Uncommon',
    'Dash-5 D.D. (Dancing Doll), a Type 3 chassis machine from the Dash! Yonkuro-era Racing Mini 4WD lineup.',
    NULL
  ),
  (
    '033769c0-a8d7-554a-8e3d-b4049d505241',
    'cd755fcb-2bc5-5975-8ec0-f45e7df891cc',
    '382feca9-48e9-5144-a92d-41f77fb7e438',
    'dash-01-super-emperor-18028', NULL, 'Dash-01 Super Emperor',
    'ダッシュ01号・超皇帝（スーパーエンペラー）', 'Dash! Yonkuro', NULL, NULL,
    'Uncommon',
    'Dash-01 Super Emperor, the curved-body successor in the Emperor lineage, released on the Type 3 chassis.',
    NULL
  ),
  (
    '652fd9b9-5fea-5067-9432-3c09b24d5bfc',
    'cd755fcb-2bc5-5975-8ec0-f45e7df891cc',
    '382feca9-48e9-5144-a92d-41f77fb7e438',
    'avante-2001-jr-18031', NULL, 'Avante 2001 Jr.',
    'アバンテ2001 Jr.', 'Avante', NULL, NULL,
    'Uncommon',
    'Mini 4WD adaptation of the Avante 2001 RC design, using Tamiya''s Zero chassis.',
    NULL
  ),
  (
    'fb1e4d46-96e6-52e9-9017-baa3799ae060',
    'cd755fcb-2bc5-5975-8ec0-f45e7df891cc',
    '382feca9-48e9-5144-a92d-41f77fb7e438',
    'crimson-glory-18032', NULL, 'Crimson Glory',
    'クリムゾングローリー', 'Racing Mini 4WD', NULL, NULL,
    'Uncommon',
    'A front-motor vintage Racing Mini 4WD release from late 1990. Historical FM is preserved in provenance and is not mislabelled as FM-A.',
    NULL
  ),
  (
    '2a6f40df-f87d-5184-82b7-578c4ee857fc',
    'cd755fcb-2bc5-5975-8ec0-f45e7df891cc',
    '382feca9-48e9-5144-a92d-41f77fb7e438',
    'dash-02-neo-burning-sun-18034', NULL, 'Dash-02 Neo Burning Sun',
    'ダッシュ02号・新太陽（ネオ・バーニングサン）', 'Dash! Yonkuro', NULL, NULL,
    'Uncommon',
    'Dash-02 Neo Burning Sun, the front-motor successor in the Burning Sun lineage, originally built around Tamiya''s historical FM chassis.',
    NULL
  )
on conflict (id) do nothing;

insert into product_releases (
  id, product_id, item_number, release_type, edition_name, release_year,
  release_date, chassis, notes, discontinued, is_original, rarity,
  data_source, edition_type, verification_status, production_status
) values
  (
    '0febe9c7-2a10-5766-9b87-1342121d3e38',
    'a0bed8eb-2899-50f8-8746-a8d08f7a52b7',
    '18023', 'Original', 'Dash-5 Dancing Doll', 1990, NULL, 'Type 3',
    'Official Tamiya page states first release month March 1990. Exact day is not stated and is intentionally left unset.',
    false, true, NULL, 'manual', 'original', 'verified', 'unknown'
  ),
  (
    'c8bdd30e-625d-511e-b92c-d132044b16b4',
    '033769c0-a8d7-554a-8e3d-b4049d505241',
    '18028', 'Original', 'Dash-01 Super Emperor', 1990, NULL, 'Type 3',
    'Official Tamiya page states first release month June 1990. Exact day is not stated and is intentionally left unset.',
    false, true, NULL, 'manual', 'original', 'verified', 'unknown'
  ),
  (
    'd7d593b9-9451-5b68-b845-14aaecac4988',
    '652fd9b9-5fea-5067-9432-3c09b24d5bfc',
    '18031', 'Original', 'Avante 2001 Jr.', 1990, NULL, 'Zero',
    'Official Tamiya identity confirms ITEM 18031 / Zero chassis. Tamiya''s release-month archive places the release in November 1990; exact day is intentionally left unset.',
    false, true, NULL, 'manual', 'original', 'verified', 'unknown'
  ),
  (
    '5132b078-5f0d-55bd-9673-d73efb7a601c',
    'fb1e4d46-96e6-52e9-9017-baa3799ae060',
    '18032', 'Original', 'Crimson Glory', 1990, NULL, NULL,
    'Tamiya identifies ITEM 18032 as an FM-chassis machine. TrackDash''s current controlled Chassis vocabulary lacks historical FM, so chassis remains unset instead of being incorrectly mapped to FM-A. Tamiya''s release-month archive places the release in November 1990; exact day remains unset.',
    false, true, NULL, 'manual', 'original', 'verified', 'unknown'
  ),
  (
    'b6d59af9-6b3c-51be-8046-02faa28e7d97',
    '2a6f40df-f87d-5184-82b7-578c4ee857fc',
    '18034', 'Original', 'Dash-02 Neo Burning Sun', 1991, NULL, NULL,
    'Tamiya identifies ITEM 18034 as an FM-chassis machine. TrackDash''s current controlled Chassis vocabulary lacks historical FM, so chassis remains unset instead of being incorrectly mapped to FM-A. Tamiya''s release-month archive places the release in June 1991; exact day remains unset.',
    false, true, NULL, 'manual', 'original', 'verified', 'unknown'
  )
on conflict (id) do nothing;

-- Canonical release assignment happens after release creation. The Catalog V2
-- trigger derives canonical_item_number/chassis/original_release_year from each
-- canonical release, including the intentional NULL chassis for historical FM.
update products set canonical_release_id = '0febe9c7-2a10-5766-9b87-1342121d3e38'
where id = 'a0bed8eb-2899-50f8-8746-a8d08f7a52b7';
update products set canonical_release_id = 'c8bdd30e-625d-511e-b92c-d132044b16b4'
where id = '033769c0-a8d7-554a-8e3d-b4049d505241';
update products set canonical_release_id = 'd7d593b9-9451-5b68-b845-14aaecac4988'
where id = '652fd9b9-5fea-5067-9432-3c09b24d5bfc';
update products set canonical_release_id = '5132b078-5f0d-55bd-9673-d73efb7a601c'
where id = 'fb1e4d46-96e6-52e9-9017-baa3799ae060';
update products set canonical_release_id = 'b6d59af9-6b3c-51be-8046-02faa28e7d97'
where id = '2a6f40df-f87d-5184-82b7-578c4ee857fc';

insert into release_sources (
  id, release_id, source_type, source_url, verified_fields, checked_at, notes
) values
  (
    '63b933c3-4052-50ef-b3bd-c4211f430d78',
    '0febe9c7-2a10-5766-9b87-1342121d3e38',
    'official_manufacturer', 'https://www.tamiya.com/japan/products/18023/index.html',
    array['itemNumber','editionName','chassis','releaseYear']::text[], '2026-09-15',
    'Tamiya identifies ITEM 18023 Dash-5 D.D. (Dancing Doll), Type 3 chassis, first released March 1990.'
  ),
  (
    '1e03aaec-b39c-5d80-bd66-403a0fb3a476',
    'c8bdd30e-625d-511e-b92c-d132044b16b4',
    'official_manufacturer', 'https://www.tamiya.com/japan/products/18028/index.html',
    array['itemNumber','editionName','chassis','releaseYear']::text[], '2026-09-15',
    'Tamiya identifies ITEM 18028 Dash-01 Super Emperor, Type 3 chassis, first released June 1990.'
  ),
  (
    '31448148-f28c-51a2-acc4-9bb30a0a807b',
    'd7d593b9-9451-5b68-b845-14aaecac4988',
    'official_manufacturer', 'https://www.tamiya.com/japan/products/18031/index.html',
    array['itemNumber','editionName','chassis']::text[], '2026-09-15', NULL
  ),
  (
    '25760664-c5eb-5064-849b-11a20321255d',
    'd7d593b9-9451-5b68-b845-14aaecac4988',
    'official_archive', 'https://www.tamiya.com/japan/newitems_month/list.html?current=199011',
    array['releaseYear']::text[], '2026-09-15',
    'Tamiya official release-month archive places ITEM 18031 in November 1990. No exact day inferred.'
  ),
  (
    'd7712d90-af26-5a74-957d-5be39dab0b97',
    '5132b078-5f0d-55bd-9673-d73efb7a601c',
    'official_manufacturer', 'https://www.tamiya.com/japan/products/18032/index.html',
    array['itemNumber','editionName']::text[], '2026-09-15',
    'Official page also states historical FM chassis; omitted from the typed chassis field until TrackDash adds FM to its controlled vocabulary.'
  ),
  (
    '1b0f9240-b769-54a9-9c3d-916e43f99a44',
    '5132b078-5f0d-55bd-9673-d73efb7a601c',
    'official_archive', 'https://www.tamiya.com/japan/newitems_month/list.html?current=199011',
    array['releaseYear']::text[], '2026-09-15',
    'Tamiya official release-month archive places ITEM 18032 in November 1990. No exact day inferred.'
  ),
  (
    '2dddfb00-2327-59fc-89e3-e9d5c18014cd',
    'b6d59af9-6b3c-51be-8046-02faa28e7d97',
    'official_manufacturer', 'https://www.tamiya.com/japan/products/18034/index.html',
    array['itemNumber','editionName']::text[], '2026-09-15',
    'Official page also states historical FM chassis; omitted from the typed chassis field until TrackDash adds FM to its controlled vocabulary.'
  ),
  (
    '18e73dff-1194-55f3-b311-f2097ecda410',
    'b6d59af9-6b3c-51be-8046-02faa28e7d97',
    'official_archive', 'https://www.tamiya.com/japan/newitems_month/list.html?current=199106',
    array['releaseYear']::text[], '2026-09-15',
    'Tamiya official release-month archive places ITEM 18034 in June 1991. No exact day inferred.'
  )
on conflict (id) do update set
  release_id = excluded.release_id,
  source_type = excluded.source_type,
  source_url = excluded.source_url,
  verified_fields = excluded.verified_fields,
  checked_at = excluded.checked_at,
  notes = excluded.notes;
