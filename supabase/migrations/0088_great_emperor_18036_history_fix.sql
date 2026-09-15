-- Great Emperor (ITEM 18036) historical identity correction.
--
-- Tamiya's official product page identifies Dash-001 Great Emperor as a
-- Zero-chassis kit. Tamiya's official monthly archive lists ITEM 18036 among
-- September 1991 new products. The exact calendar day is not established, so
-- release_date intentionally remains NULL.
--
-- Existing Product/Release UUIDs are preserved so collections, market evidence
-- and any other foreign keys keep their meaning.

update product_releases
set item_number = '18036',
    edition_name = 'Great Emperor',
    release_year = 1991,
    release_date = null,
    chassis = 'Zero',
    verification_status = 'verified',
    notes = 'Original ITEM 18036 Dash-001 Great Emperor. Tamiya''s product page specifies the Zero chassis; its official release-month archive places the release in September 1991. Exact day remains unclaimed.',
    updated_at = now()
where id = '8c2ca80b-8a9d-5b7a-9325-aec13a0db9ba';

update release_sources
set source_type = 'official_manufacturer',
    source_url = 'https://www.tamiya.com/japan/products/18036/index.html',
    verified_fields = array['itemNumber','editionName','chassis']::text[],
    checked_at = '2026-09-15',
    notes = 'Tamiya Japan identifies ITEM 18036 Dash-001 Great Emperor and explicitly specifies the Zero chassis.'
where id = '580f6156-bede-5d31-8d01-05f797a8a344';

insert into release_sources (
  id, release_id, source_type, source_url, verified_fields, checked_at, notes
) values (
  '7c6761b4-9ceb-5c70-8657-3c917f2133ff',
  '8c2ca80b-8a9d-5b7a-9325-aec13a0db9ba',
  'official_manufacturer',
  'https://tamiya.com/japan/newitems_month/list.html?catalog_open_month=201804&current=199109&genre_item=&sortkey=',
  array['releaseYear']::text[],
  '2026-09-15',
  'Tamiya''s official release-month archive lists ITEM 18036 among the September 1991 new products. No exact calendar day is inferred.'
)
on conflict (id) do update set
  release_id = excluded.release_id,
  source_type = excluded.source_type,
  source_url = excluded.source_url,
  verified_fields = excluded.verified_fields,
  checked_at = excluded.checked_at,
  notes = excluded.notes;

update products
set chassis = 'Zero',
    original_release_year = 1991,
    updated_at = now()
where id = '203f8219-9d37-5a1a-aad6-9437c80a1ea8';
