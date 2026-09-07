-- Image Audit / Fix — batch 1 (Avante Mk.III family)
--
-- Adds exact release-level images only where the image can be attributed
-- with high confidence to that specific Release. No resolver/UI/schema or
-- Product/Release factual data changes.
--
-- Covered here:
--   releaseSeedKey 1 — 18626 Avante Mk.III Azure
--   releaseSeedKey 2 — 18627 Avante Mk.III Nero
--   releaseSeedKey 3 — 95087 Avante Mk.III Japan Cup 2015 Limited Edition
--   releaseSeedKey 4 — 95425 Avante Mk.III Red Special
--   releaseSeedKey 5 — 95469 Avante Mk.III White Special
--
-- releaseSeedKey 7 (95464, 2023 Reissue) already has its exact image from
-- migration 0016 and is intentionally not duplicated here.
-- releaseSeedKey 6 (95464, 2010 original) remains on Product fallback: the
-- current official 95464 page represents the 2023 reissue and is not
-- archival proof for the 2010 release.
--
-- 95450 DASH-X1 Proto-Emperor Premium Black Special is part of the same
-- audit batch but is deliberately not inserted in this migration yet: its
-- exact identity/appearance is verified, but we do not yet have an official
-- image asset URL attributable with the same evidentiary standard. Keeping
-- the fallback is preferable to inventing/guessing an image URL.
--
-- IDs are deterministic stableUuid(`release-image:<productSeedKey>:<releaseSeedKey>:0`)
-- values, never derived from Tamiya item numbers. Idempotent via
-- ON CONFLICT (id) DO NOTHING.

insert into release_images (id, release_id, url, position) values
  ('47d09877-8068-5e19-beac-725d54e4f0bc', '497455cb-838d-5430-97dd-ae0be52e69e4', 'https://www.tamiya.com/japan_contents/img/usr/item/1/18626/18626_1.jpg', 0),
  ('c9017410-eac7-59a8-9610-64022841a9eb', '86763fe4-bfc0-551e-8541-c3fc9c2442b7', 'https://www.tamiyausa.com/media/CACHE/images/products/jr-avante-mkiii-nero-2-none-3-fcaa/4c1ca4708b399ec2e758fe4984b9d7f7.jpg', 0),
  ('a81bad8f-f6c2-5c25-9a87-a092f1b979f7', '68be3b41-30a7-55be-8cd9-f741193ce595', 'https://www.tamiyausa.com/media/CACHE/images/products/jr-avante-mkiii-3-ma-chassis-japan-cup-2015-1-41ca/47986f138fd27a4a803d6b7ce0758a38.jpg', 0),
  ('2af0f788-40ce-58d7-8255-34e5c76f87c8', '3ba49f54-21c9-532d-a34a-7b9e38668a6d', 'https://d7z22c0gz59ng.cloudfront.net/cms/img/usr/item/9/95425/95425_1.jpg', 0),
  ('e0a6c73f-54bd-5bbf-af45-bd917de6b4bf', 'e31c9f48-a776-564a-a496-63771e4a4f9d', 'https://d7z22c0gz59ng.cloudfront.net/cms/img/usr/item/9/95469/95469_4c2.jpg', 0)
on conflict (id) do nothing;
