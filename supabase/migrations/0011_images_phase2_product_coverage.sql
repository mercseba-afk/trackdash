-- Images Phase 2 -- Step A1 product-image coverage pass.
--
-- Adds NEW product_images / release_images rows only (delta since
-- 0008_seed_catalog_images.sql, which is already applied to live
-- Supabase and is NOT modified by this migration). Generated from
-- scripts/data/tamiya-images.ts by scripts/seed-images.mjs, filtered to
-- the rows not already present in 0008 -- see docs/IMAGES_MVP.md for the
-- full pipeline and docs/CATALOG_MODEL_V2.md for the deploy history.
--
-- Deterministic, idempotent (ON CONFLICT (id) DO NOTHING -- every id is
-- stableUuid()-derived from the entry's seed keys, never from a Tamiya
-- item number), non-destructive (INSERT only, no UPDATE/DELETE), and
-- touches only product_images/release_images -- no Product/Release
-- factual fields and no Catalog Model V2 architecture change.
--
-- Not applied to Supabase in this pass.

insert into product_images (id, product_id, url, position) values
  ('c2df5c39-9263-5103-ab60-edd413d23dea', 'c7a440cc-dc07-5ecc-bae3-c2770dc8b66e', 'https://www.tamiya.com/japan_contents/img/usr/item/1/18640/18640_1.jpg', 0),
  ('1abffbf7-a935-5afa-a660-fde088e619e9', 'd341ec22-c1f9-5a03-906d-444f8eee5401', 'https://www.tamiya.com/japan_contents/img/usr/item/1/18646/18646_1.jpg', 0),
  ('95033fdd-c9f8-59db-80b2-99aa0520b3c4', '68acb096-f01b-55b2-949b-a959279a2fa5', 'https://www.tamiya.com/japan_contents/img/usr/item/1/18716/18716_1.jpg', 0),
  ('993f27df-ae02-5aed-ac06-f3050bf68fa4', '6f41e40f-a48e-509f-8602-dfd303e25795', 'https://www.tamiya.com/japan_contents/img/usr/item/1/18704/18704_1.jpg', 0),
  ('9b9292af-ca3e-5502-a85a-792f276cf787', '51deac9c-f8a7-5eff-984f-968d6ad88659', 'https://www.tamiya.com/japan_contents/img/usr/item/1/18637/18637_1.jpg', 0),
  ('e0e9c082-672d-5bbb-825b-5bd5ab81360f', '9793fbe8-dcf7-51c9-9f45-185194a0bc92', 'https://www.tamiya.com/japan_contents/img/usr/item/1/19409/19409_1.jpg', 0),
  ('fdf19c0e-0c22-5c88-a5e6-c0a2ad4170bc', '896cc70e-3048-594d-9389-cb9808a5ad53', 'https://www.tamiya.com/japan_contents/img/usr/item/1/19402/19402_1.jpg', 0),
  ('fb95622e-a340-5743-8638-a37366ebdcd0', 'f603ed6f-e601-5372-9fe7-6fd1034b6065', 'https://www.tamiya.com/japan_contents/img/usr/item/1/19406/19406_1.jpg', 0),
  ('577c8276-74f8-5f65-b7c8-514532c98765', '53791485-2948-5176-8acb-2ec947eafc51', 'https://www.tamiya.com/japan_contents/img/usr/item/1/19412/19412_1.jpg', 0),
  ('090e4890-9d90-507d-befa-3a83f33e0aac', 'a66d871c-00b1-56e5-9bc4-1621ea1729b2', 'https://www.tamiya.com/japan_contents/img/usr/item/1/19421/19421_1.jpg', 0),
  ('460122f3-a9da-59c1-8da7-279568fc324a', 'dee35418-283b-5603-889b-b3eb2d68eea5', 'https://www.tamiya.com/japan_contents/img/usr/item/1/19415/19415_1.jpg', 0),
  ('fc87ebdb-620a-531d-af8d-a724d74c7041', 'da28c703-24ef-5ebd-a952-87346735dc7e', 'https://www.tamiya.com/japan_contents/img/usr/item/1/19423/19423_1.jpg', 0),
  ('429a180e-e93d-5ed0-a368-fcc85a70ee8c', '82b478fd-21dd-5c93-82fb-bf50461a107d', 'https://www.tamiya.com/japan_contents/img/usr/item/1/18014/18014_1.jpg', 0),
  ('266c5dce-d04c-5adf-be59-34989c6da8ed', '6dcb6511-5277-561f-a880-95ef828ce44f', 'https://www.tamiya.com/japan_contents/img/usr/item/1/18614/18614_1.jpg', 0),
  ('8b9b047f-388f-5e74-aa30-2b6379891a32', 'dcd372ac-5ad2-5a70-ae48-f1c4a6d6de4a', 'https://www.tamiya.com/japan_contents/img/usr/item/1/18101/18101_1.jpg', 0),
  ('65ab98ce-01ec-5af5-b3e4-00be32ac6c26', 'a00d2b12-6a67-56ee-8db5-392eaf86d5c7', 'https://www.tamiya.com/japan_contents/img/usr/item/1/19407/19407_1.jpg', 0),
  ('e65f1208-1ce9-5c7a-93bb-dcf9facc9c0d', '203f8219-9d37-5a1a-aad6-9437c80a1ea8', 'https://www.tamiya.com/japan_contents/img/usr/item/1/18036/18036_1.jpg', 0),
  ('afa17552-5403-59d4-a528-5baa5548ae58', 'a1fd4f6d-0834-5f09-ac3c-5d4b398f0968', 'https://www.tamiya.com/japan_contents/img/usr/item/1/18038/18038_1.jpg', 0),
  ('1dd6f878-8473-52da-b0f5-9d142be6cbbb', '3b443635-b33f-5553-a39d-eba8b8cafddb', 'https://www.tamiya.com/japan_contents/img/usr/item/1/18015/18015_1.jpg', 0),
  ('872f55bf-dd85-5cd8-9be6-8845e7ad053f', '4b53383c-c417-53c6-addb-e87126546d89', 'https://www.tamiya.com/japan_contents/img/usr/item/1/18019/18019_1.jpg', 0),
  ('8506bfca-6b3c-5f54-b7a5-68fc2f166d19', 'd3b4ad34-05ac-592e-ad93-fab4cfde0a5a', 'https://www.tamiya.com/japan_contents/img/usr/item/1/19201/19201_1.jpg', 0),
  ('71596e32-473a-5bea-a879-96a1c0f48184', 'b972592b-ce68-5f39-b3a1-cdc8984d3817', 'https://www.tamiya.com/japan_contents/img/usr/item/1/18638/18638_1.jpg', 0),
  ('0adbe33a-49ed-5528-be3e-318de9ede2a3', 'fa551244-1a12-54ec-b937-ad1b5603e8bb', 'https://www.tamiya.com/japan_contents/img/usr/item/1/19401/19401_1.jpg', 0)
on conflict (id) do nothing;
