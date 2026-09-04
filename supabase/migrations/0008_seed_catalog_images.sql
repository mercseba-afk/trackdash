-- Seed migration: catalog images (Images MVP).
--
-- Remote-hotlinked official Tamiya image URLs only -- no files
-- downloaded into this repository, nothing uploaded to Supabase
-- Storage. See scripts/data/tamiya-images.ts for the full source
-- mapping (with per-entry verification notes and Tamiya source
-- page URLs) and docs/IMAGES_MVP.md for the architecture writeup.
--
-- Generated FROM scripts/data/tamiya-images.ts (not hand-written)
-- by scripts/seed-images.mjs -- ids are stableUuid()-derived from
-- each entry's natural key, so re-running this after adding new
-- TAMIYA_IMAGES entries only ever inserts new rows.
--
-- position = 0 for every row here (the primary image). Additional
-- gallery images for the same product/release can be added later
-- at position 1, 2, 3, ... without changing this migration's ids.

insert into product_images (id, product_id, url, position) values
  ('9e1157f1-53a8-578e-a14f-8eac573467ad', '2972e27d-7c75-5534-9ed4-1603ef4a6655', 'https://www.tamiya.com/japan_contents/img/usr/item/1/18025/18025_1.jpg', 0),
  ('cacdc4a7-d35e-5a2a-8e2d-ed25543c978f', 'c8132bd5-23ee-5f36-b3f6-a75ef0c27ea3', 'https://www.tamiya.com/japan_contents/img/usr/item/1/18701/18701_1.jpg', 0)
on conflict (id) do nothing;

insert into release_images (id, release_id, url, position) values
  ('bde20635-f05e-5ebc-a1b5-33ed63d91da5', '0fdbfd56-f257-5b84-b541-e08a7450cc34', 'https://www.tamiya.com/japan_contents/img/usr/item/1/19431/19431_1.jpg', 0)
on conflict (id) do nothing;
