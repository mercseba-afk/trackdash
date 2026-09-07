-- Independent Catalog Foundation v1 review cleanup.
-- Identity is untouched: these updates target factual/editorial metadata only.

-- Make the later 95296 occurrence explicit as the 2023 reissue.
update public.product_releases
set edition_name = 'Dash-1 Emperor (MS Chassis) Black Special (2023 Reissue)'
where product_id = (
  select id from public.products where name = 'Dash-1 Emperor' limit 1
)
  and item_number = '95296'
  and release_year = 2023;

-- Tamiya's current official item 18025 page explicitly gives the 2026 sale
-- date as 2026-08-29 and identifies the item as Dash-1 Emperor / Type 3.
update public.product_releases
set release_date = date '2026-08-29'
where product_id = (
  select id from public.products where name = 'Dash-1 Emperor' limit 1
)
  and item_number = '18025'
  and release_year = 2026;

-- Expand field-level provenance for that same 2026 release. Preserve the
-- existing source row/id; only the evidence metadata becomes more precise.
update public.release_sources
set verified_fields = array[
      'itemNumber',
      'chassis',
      'releaseDate',
      'releaseYear',
      'editionName'
    ]::text[],
    checked_at = date '2026-09-07',
    notes = 'Official Tamiya page explicitly identifies ITEM 18025, Dash-1 Emperor (Type 3 Chassis), and the 2026-08-29 sale date; it also records the initial 18025 release month as January 1990.'
where release_id = (
  select r.id
  from public.product_releases r
  join public.products p on p.id = r.product_id
  where p.name = 'Dash-1 Emperor'
    and r.item_number = '18025'
    and r.release_year = 2026
  limit 1
)
  and source_url = 'https://www.tamiya.com/english/products/18025/index.html';
