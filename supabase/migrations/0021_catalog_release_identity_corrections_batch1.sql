-- Catalog/Image Audit corrective batch 1.
--
-- Three legacy ProductRelease UUIDs are valid immutable TrackDash identities,
-- but their factual Tamiya metadata was wrong or inherited from the parent.
-- Correct facts in place: NEVER replace/re-key these release UUIDs.
--
-- Evidence: official Tamiya manufacturer pages checked 2026-09-07.
-- UNKNOWN > INVENTED: no unsupported historical day/barcode/MSRP is added.

begin;

-- Dash-1 Emperor Black Special.
-- This existing release identity now represents the documented 2023 reissue of
-- item 95296. The official page states initial release month February 2017 but
-- gives no exact historical day; the current exact image is therefore attached
-- only to the documented 2023-05-27 occurrence.
update product_releases
set item_number = '95296',
    edition_name = 'Dash-1 Emperor (MS Chassis) Black Special',
    release_year = 2023,
    release_date = '2023-05-27',
    chassis = 'MS',
    color = 'Black',
    verification_status = 'verified',
    notes = 'Documented 2023 reissue of item 95296. Official Tamiya page states the initial release was February 2017; no exact 2017 day is inferred.',
    updated_at = now()
where id = '96babc1a-f153-59fa-b840-7ff68fb50f38';

-- Dash-1 Emperor Memorial — 30 Years of the Japan Cup.
update product_releases
set item_number = '95110',
    edition_name = 'Dash-1 Emperor Memorial (MS Chassis) 30 Years of the Japan Cup',
    release_year = 2018,
    release_date = '2018-06-23',
    chassis = 'MS',
    color = 'Silver',
    verification_status = 'verified',
    notes = 'Official Tamiya memorial edition celebrating 30 years of the Japan Cup.',
    updated_at = now()
where id = 'b7eeb76a-e117-59ae-b31c-b099368421af';

-- Aero Avante Black Special.
update product_releases
set item_number = '95376',
    edition_name = 'Aero Avante Black Special (AR Chassis)',
    release_year = 2018,
    release_date = '2018-02-10',
    chassis = 'AR',
    color = 'Black',
    verification_status = 'verified',
    notes = 'Official Tamiya Aero Avante Black Special release on the AR chassis.',
    updated_at = now()
where id = '21b0cb0d-bb39-51ff-a5e6-df45c3245372';

-- Provenance for the corrected factual fields. IDs are the same deterministic
-- release-source UUIDv5 values produced by the catalog source convention.
insert into release_sources
  (id, release_id, source_type, source_url, verified_fields, checked_at, notes)
values
  (
    '1e30636b-cf6b-575e-8148-774724e32b40',
    '96babc1a-f153-59fa-b840-7ff68fb50f38',
    'official_manufacturer',
    'https://www.tamiya.com/japan/products/95296/index.html',
    array['itemNumber','chassis','releaseDate','releaseYear','editionName','color']::text[],
    '2026-09-07',
    'Official page documents the 2023-05-27 reissue and states initial release month February 2017.'
  ),
  (
    'c5d7f890-392a-5891-bafe-78a6360928aa',
    'b7eeb76a-e117-59ae-b31c-b099368421af',
    'official_manufacturer',
    'https://www.tamiya.com/japan/products/95110/index.html',
    array['itemNumber','chassis','releaseDate','releaseYear','editionName','color']::text[],
    '2026-09-07',
    null
  ),
  (
    'c95f2df0-78a6-5ae5-927f-11df2da8776c',
    '21b0cb0d-bb39-51ff-a5e6-df45c3245372',
    'official_manufacturer',
    'https://www.tamiya.com/japan/products/95376/index.html',
    array['itemNumber','chassis','releaseDate','releaseYear','editionName','color']::text[],
    '2026-09-07',
    null
  )
on conflict (id) do update
set release_id = excluded.release_id,
    source_type = excluded.source_type,
    source_url = excluded.source_url,
    verified_fields = excluded.verified_fields,
    checked_at = excluded.checked_at,
    notes = excluded.notes;

-- A release has exactly one seeded primary (position 0) image. Remove only a
-- conflicting legacy primary for these three targets, never gallery positions.
delete from release_images
where position = 0
  and release_id in (
    '96babc1a-f153-59fa-b840-7ff68fb50f38',
    'b7eeb76a-e117-59ae-b31c-b099368421af',
    '21b0cb0d-bb39-51ff-a5e6-df45c3245372'
  )
  and id not in (
    'c17d0b90-0c4d-5529-84d7-dace8f958c57',
    'c7f5bd13-97e4-5d4b-a4dd-0ce9658ca180',
    'a6305380-1700-5922-8b31-1d1ff06249a9'
  );

insert into release_images (id, release_id, url, position)
values
  (
    'c17d0b90-0c4d-5529-84d7-dace8f958c57',
    '96babc1a-f153-59fa-b840-7ff68fb50f38',
    'https://www.tamiya.com/japan_contents/img/usr/item/9/95296/95296_1.jpg',
    0
  ),
  (
    'c7f5bd13-97e4-5d4b-a4dd-0ce9658ca180',
    'b7eeb76a-e117-59ae-b31c-b099368421af',
    'https://www.tamiya.com/japan_contents/img/usr/item/9/95110/95110_1.jpg',
    0
  ),
  (
    'a6305380-1700-5922-8b31-1d1ff06249a9',
    '21b0cb0d-bb39-51ff-a5e6-df45c3245372',
    'https://www.tamiya.com/japan_contents/img/usr/item/9/95376/95376_1.jpg',
    0
  )
on conflict (id) do update
set release_id = excluded.release_id,
    url = excluded.url,
    position = excluded.position;

commit;
