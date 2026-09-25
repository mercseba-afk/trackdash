-- Thunder Dragon Clear Special (95336): keep the official Tamiya page as
-- the identity/specification authority, but replace the dead legacy direct
-- Tamiya JPG with an exact archived product image from Hobby Search.
-- The Tamiya legacy asset currently returns 404 through the Next.js image
-- optimizer, which causes ProductImage to fall back to the placeholder.

update public.release_images
set url = 'https://www.1999.co.jp/itbig47/10477144a.jpg'
where release_id = '650fcdc3-c510-4630-bff3-d176a68bf5c0'
  and position = 0;

insert into public.release_sources (
  release_id,
  source_type,
  source_url,
  verified_fields,
  checked_at,
  notes
)
select
  '650fcdc3-c510-4630-bff3-d176a68bf5c0'::uuid,
  'trusted_secondary',
  'https://www.1999.co.jp/10477144',
  array['itemNumber','barcodeJan','editionName','releaseYear','image']::text[],
  current_date,
  'Exact Hobby Search archive for ITEM 95336 / JAN 4950344953363. Used as the rendered image fallback because the legacy direct Tamiya 95336 JPG no longer resolves; official Tamiya pages remain the identity authority.'
where not exists (
  select 1
  from public.release_sources
  where release_id = '650fcdc3-c510-4630-bff3-d176a68bf5c0'
    and source_url = 'https://www.1999.co.jp/10477144'
);
