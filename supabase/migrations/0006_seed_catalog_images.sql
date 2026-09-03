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
  ('0adbe33a-49ed-5528-be3e-318de9ede2a3', 'fa551244-1a12-54ec-b937-ad1b5603e8bb', 'https://www.tamiya.com/japan_contents/img/usr/item/1/19431/19431_1.jpg', 0),
  ('125d4998-efa9-501d-a0ee-1e1fa9e15546', 'c8132bd5-23ee-5f36-b3f6-a75ef0c27ea3', 'https://www.tamiya.com/japan_contents/img/usr/item/1/18701/18701_1.jpg', 0)
on conflict (id) do nothing;

insert into release_images (id, release_id, url, position) values
  ('b2dcd845-d3aa-5805-892e-d0909846c3d4', '96adee91-eaec-5c73-9269-cf3875cfe02d', 'https://www.tamiya.com/japan_contents/img/usr/item/1/18025/18025_1.jpg', 0)
on conflict (id) do nothing;
