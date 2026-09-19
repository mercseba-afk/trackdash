-- Dash-1 Emperor catalog provenance refinements found during the 2026-09-19 audit.
-- This migration follows already-applied 0108; do not rewrite historical migrations.

-- 94670 factory-finished occurrence: contemporary coverage of the then-live
-- Tamiya product page gives the exact 2008-09-27 release date. A Japanese
-- specialist retailer independently exposes JAN 4950344946709.
update public.product_releases
set
  release_date = date '2008-09-27',
  barcode_jan = '4950344946709',
  notes = 'Factory-finished Dash-1 Emperor on MS chassis. Contemporary 2008 coverage of the then-live official Tamiya catalog page gives the 2008-09-27 release date; specialist retail metadata corroborates ITEM 94670 and JAN 4950344946709. This finished product stays outside the new_complete_unbuilt valuation lane.',
  updated_at = now()
where id = '0c785a52-a667-5da5-8a31-9bf0a7f4f7db';

-- 94704 exact JAN from a specialist product record. The existing 2009-09-12
-- date remains supported by contemporary reporting that referenced Tamiya's
-- original product page.
update public.product_releases
set
  barcode_jan = '4950344947041',
  updated_at = now()
where id = 'ad3ca562-8d30-517d-8471-9018d26d7af2';

-- Replace the 94666 retailer image of the later 95622 reissue with official
-- Tamiya USA media for ITEM 94666 itself. This is release-specific official art.
update public.release_images
set
  url = 'https://www.tamiyausa.com/media/CACHE/images/products/jr-dash-1-emperor-special-kit-jr-dash-1-emperor-special-kit-94666-1.jpg-220b/e970bb61f0d31af4e4a89b4e6dec874f.jpg',
  position = 0
where id = '819708bf-09be-44e5-9e3e-4c565356c4fa'
  and release_id = '37ba9a79-6609-5b36-966d-bad0b383eb3a';

insert into public.release_sources (
  id, release_id, source_type, source_url, verified_fields, checked_at, notes
) values
(
  '28012f67-89e1-52eb-a576-a1d23cf00fcf',
  '0c785a52-a667-5da5-8a31-9bf0a7f4f7db',
  'trusted_secondary',
  'https://www.tea-league.com/mt/tea/archives/2008/09/1ms.html',
  array['itemNumber','releaseDate','editionName','chassis','format'],
  date '2026-09-19',
  'Contemporary September 2008 report reproduces details from the then-live Tamiya 94670 catalog page and states the planned 2008-09-27 release.'
),
(
  '939f243f-30c5-56ee-b479-3d7ec85a71b3',
  '0c785a52-a667-5da5-8a31-9bf0a7f4f7db',
  'trusted_secondary',
  'https://hs-tamtam.co.jp/product/detail/27272/',
  array['itemNumber','barcodeJAN','editionName','format'],
  date '2026-09-19',
  'Japanese specialist retailer record identifies ITEM 94670 and JAN 4950344946709.'
),
(
  '58c48686-089c-54ca-98b2-08a4fcea8c8e',
  'ad3ca562-8d30-517d-8471-9018d26d7af2',
  'trusted_secondary',
  'https://hs-tamtam.co.jp/product/detail/31866/',
  array['itemNumber','barcodeJAN','editionName','chassis'],
  date '2026-09-19',
  'Japanese specialist retailer record identifies ITEM 94704 and JAN 4950344947041.'
)
on conflict (id) do update set
  release_id = excluded.release_id,
  source_type = excluded.source_type,
  source_url = excluded.source_url,
  verified_fields = excluded.verified_fields,
  checked_at = excluded.checked_at,
  notes = excluded.notes;
