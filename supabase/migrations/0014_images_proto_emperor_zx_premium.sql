-- Micro-fix: exact Release image for Proto Emperor ZX Premium (item 95335).
--
-- Adds the single NEW release_images row for the corrected Proto Emperor
-- ZX Premium release (see 0013_catalog_proto_emperor_zx_fix.sql, which
-- corrected this release's data from the false item 95450 to the real
-- 95335 -- 0013 is NOT modified by this migration). Generated from
-- scripts/data/tamiya-images.ts by scripts/seed-images.mjs, filtered to the
-- one row not already present in 0008, 0011, or 0012 (all already applied
-- to live Supabase and NOT modified by this migration).
--
-- Official page https://www.tamiya.com/japan/products/95335/index.html
-- fetched directly this pass -- item, name, and release date confirmed
-- exact match; the image URL itself was read from the page's own body
-- markup, not guessed from the CDN path pattern.
--
-- Deterministic, idempotent (ON CONFLICT (id) DO NOTHING -- the id is
-- stableUuid()-derived from productSeedKey 18714 + releaseSeedKey 2, never
-- from the Tamiya item number), non-destructive (INSERT only, no
-- UPDATE/DELETE), touches only release_images -- no Product/Release
-- factual data, no Catalog Model V2 change, no image resolver change.
--
-- Not applied to Supabase in this pass.

insert into release_images (id, release_id, url, position) values
  ('46ab5119-c556-589c-99a8-91e947cb732f', 'f0614cb8-d0cb-521d-aa2c-4fc304f39430', 'https://www.tamiya.com/japan_contents/img/usr/item/9/95335/95335_1.jpg', 0)
on conflict (id) do nothing;
