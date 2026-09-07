-- Catalog Expansion Wave 1 -- product images for the two new products.
--
-- Adds the 2 NEW product_images rows (DASH-X1 Proto-Emperor, Avante Mk.III)
-- not already present in 0008/0011/0012/0014 (all already applied to live
-- Supabase and NOT modified by this migration). Release-level exact images
-- for these two products' individual editions were mostly not added in
-- this pass -- see docs/CATALOG_AUDIT.md's Wave 1 section for the honest
-- accounting -- with ONE exception, added post-approval (same migration,
-- not superseded by 0018): Avante Mk.III Azure Clear Special (2023
-- Reissue), releaseSeedKey "7", item 95464. Its official page explicitly
-- represents the 2023 reissue (states 2023-11-11 as its current on-sale
-- date), so its own image is attributed ONLY to that release -- never to
-- the 2010 original (releaseSeedKey "6"), which keeps falling back to
-- the product image per UNKNOWN > INVENTED.
--
-- All images verified via direct official-page fetch -- not
-- pattern-guessed. Deterministic (ids stableUuid()-derived from immutable
-- seed keys), idempotent (ON CONFLICT (id) DO NOTHING), INSERT-only, no
-- Product/Release factual data touched (see 0015 for that), no Catalog
-- Model V2 change, no image resolver change.
--
-- Not applied to Supabase in this pass.

insert into product_images (id, product_id, url, position) values
  ('70abef2c-0f15-5639-be8d-006e5b130cc1', '1acf7850-c8a9-5627-b104-54db6e235ba2', 'https://www.tamiya.com/japan_contents/img/usr/item/1/18074/18074_1.jpg', 0),
  ('f3de02ec-8dd3-50bf-a46d-9f557dd4bbda', 'de719716-e50a-5811-b99d-18bbb153b166', 'https://www.tamiya.com/japan_contents/img/usr/item/1/18626/18626_1.jpg', 0)
on conflict (id) do nothing;

insert into release_images (id, release_id, url, position) values
  ('29a8231c-3b01-599a-a4f4-4f44083eae51', 'cc1fb7fa-67db-5303-9514-80b9705fe732', 'https://www.tamiya.com/japan_contents/img/usr/item/9/95464/95464_1.jpg', 0)
on conflict (id) do nothing;
