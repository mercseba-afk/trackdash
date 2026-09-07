-- Image Audit / Fix — batch 2
--
-- Adds 15 exact release-level images for releases whose identity is already
-- sufficiently established. Known-bad/ambiguous catalog rows (including the
-- current Dash-1 Emperor entries using item 95359 and 92403) are deliberately
-- excluded: those require factual catalog correction before any image is
-- attached.
--
-- IDs are deterministic stableUuid(`release-image:<productSeedKey>:<releaseSeedKey>:0`)
-- values, never derived from Tamiya item numbers. Idempotent via
-- ON CONFLICT (id) DO NOTHING.

insert into release_images (id, release_id, url, position) values
  ('8199f68f-b033-517b-8b2d-8d7e960d251a', 'a2baec17-32b5-5ca7-996b-4cdc2da725ba', 'https://www.tamiya.com/japan_contents/img/usr/item/1/18701/18701_1.jpg', 0),
  ('7e5ecb66-acb4-5a52-8ef1-03ffbec60a80', 'a9a18e0d-7aa2-5481-94b6-ebc670daaa55', 'https://www.tamiya.com/japan_contents/img/usr/item/1/18716/18716_1.jpg', 0),
  ('1482a270-7888-528b-a329-afc624feb547', 'cbd6e611-e421-5c10-bbd3-352beb80f6fc', 'https://www.tamiya.com/japan_contents/img/usr/item/1/18637/18637_1.jpg', 0),
  ('19676511-2907-56ed-a358-7e2e92bd1d4a', '5a123617-c84c-5012-ab20-1a9d493259e0', 'https://www.tamiya.com/japan_contents/img/usr/item/1/18614/18614_1.jpg', 0),
  ('1299876d-0229-5204-969a-a2369c8c4d18', '4d5b0a9a-498f-51fc-accd-9316ca11c843', 'https://www.tamiya.com/japan_contents/img/usr/item/1/18038/18038_1.jpg', 0),
  ('4c610980-a4b2-5037-b705-44a4cc9c6a2c', '0226dfa5-5e29-5557-b134-ddbad7682e28', 'https://www.tamiya.com/japan_contents/img/usr/item/1/18074/18074_1.jpg', 0),
  ('d3265d2d-11a1-5899-ae9d-2f8e68204fe4', 'fcaf3f82-93b5-5a52-8087-c96e771a030c', 'https://www.tamiya.com/japan_contents/img/usr/item/1/19409/19409_1.jpg', 0),
  ('688f7957-bd99-58ab-a26f-cfb245677408', 'd9b9392b-d149-52a2-b862-0eafc66af7ef', 'https://www.tamiya.com/japan_contents/img/usr/item/9/95508/95508_1.jpg', 0),
  ('0d45686f-c5c7-51a6-91e5-0c22c931b5bd', '79e32904-fe5d-5d30-bf54-8643ce4b42d3', 'https://www.tamiya.com/japan_contents/img/usr/item/1/18025/18025_1.jpg', 0),
  ('f97c9244-c30e-545c-8bba-31af3ecf54fc', '4a1b7d1f-a2f7-5113-9962-21fa14a47968', 'https://www.tamiya.com/japan_contents/img/usr/item/1/19401/19401_1.jpg', 0),
  ('c92b5256-f8ed-5622-8f17-f2d34971d1bb', 'e23951fd-63a5-5233-8c53-969c57e98819', 'https://www.tamiya.com/japan_contents/img/usr/item/1/19402/19402_1.jpg', 0),
  ('23003031-7822-59ae-ba04-d33624d7cabd', '6ed25d50-4099-5924-b7e5-d7a21945a3f6', 'https://www.tamiya.com/japan_contents/img/usr/item/1/19406/19406_1.jpg', 0),
  ('5291e4f7-0e7f-5831-b1b3-07effdbcf258', 'efd6902b-f080-5165-8a13-0375c1d32298', 'https://www.tamiya.com/japan_contents/img/usr/item/1/19412/19412_1.jpg', 0),
  ('3721d20f-7d93-557d-b551-a05cda3a8417', '7683c862-f484-5603-aa28-c76ae7453892', 'https://www.tamiya.com/japan_contents/img/usr/item/1/19421/19421_1.jpg', 0),
  ('40f73ba8-b0f4-5f16-aedf-71e7fc4bfc98', '71addadb-04b3-579f-96f2-c5e976cf1cd5', 'https://www.tamiya.com/japan_contents/img/usr/item/1/19415/19415_1.jpg', 0)
on conflict (id) do nothing;
