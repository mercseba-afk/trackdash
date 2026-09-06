-- Images Phase 2B/2C -- exact release images for special editions.
--
-- Adds NEW release_images rows only (delta since 0008 + 0011, both
-- already applied to live Supabase and NOT modified by this migration).
-- Generated from scripts/data/tamiya-images.ts by scripts/seed-images.mjs,
-- filtered to the rows not already present in either prior migration --
-- see docs/IMAGES_MVP.md for the full pipeline.
--
-- Covers Premium/special-edition releases visually distinct from their
-- product's generic image: Victory/Cyclone/Beat/Hurricane/Sonic Magnum
-- Premiums, Vanguard Sonic Premium, Great Emperor Premium, Dash-1 Emperor
-- Premium, Dash-2 Burning Sun (Type 3 Chassis) -- an audit-driven gap
-- recovery, verified via direct fetch in the hardening pass -- and the
-- mandatory Dyna-Hawk GX case: item 95467, the 2019 Super XX Special
-- reissue, confirmed via a direct official-page fetch.
--
-- Two releases were deliberately left uncovered after direct verification
-- in the hardening pass, per UNKNOWN > INVENTED:
--   - Dyna-Hawk GX Super XX Special, item 94717: no live official
--     tamiya.com page exists (confirmed 404); identity is well
--     corroborated by trusted secondary sources, but no photo source
--     meets this project's bar.
--   - Proto Emperor ZX Premium (Black Special), recorded item 95450:
--     that item number was found, on direct verification, to belong to
--     a DIFFERENT Dash! Yonkuro machine ("DASH-X1 PROTO-EMPEROR
--     BLACK SPECIAL", 原始皇帝) -- not "Proto Emperor ZX"
--     (プロトエンペラーZX, whose own Premium is item 95335). The item
--     number already recorded on this release is confirmed wrong; no
--     image is attached to avoid a cross-machine mismatch. The
--     item-number correction itself is out of scope for this pass
--     (report/audit only, no Catalog Model V2 change).
--
-- Deterministic, idempotent (ON CONFLICT (id) DO NOTHING -- every id is
-- stableUuid()-derived from the entry's immutable seed keys, never from a
-- Tamiya item number or array position), non-destructive (INSERT only, no
-- UPDATE/DELETE), and touches only release_images -- no Product/Release
-- factual fields and no Catalog Model V2 architecture change.
--
-- Not applied to Supabase in this pass.

insert into release_images (id, release_id, url, position) values
  ('74bfa696-440f-5f10-bdaf-6e3bb129b716', 'ace0d1b1-aaf3-589a-977c-a3df07c83c73', 'https://www.tamiya.com/japan_contents/img/usr/item/9/95467/95467_1.jpg', 0),
  ('bf7589ee-eb1f-5902-a3e1-93020e6078eb', '0bdb9bcd-e4aa-53ab-b004-984cae96fdca', 'https://www.tamiya.com/japan_contents/img/usr/item/1/19434/19434_1.jpg', 0),
  ('9fc8baf7-0ab5-5159-9fec-97183878a452', '62cca367-8a73-5280-b2a2-0aa9497d093d', 'https://www.tamiya.com/japan_contents/img/usr/item/1/19432/19432_1.jpg', 0),
  ('eee0e8d5-8b23-5ee8-8313-a8b6db6edb31', '85a3549a-d563-5dda-bc6d-bd1ac684601e', 'https://www.tamiya.com/japan_contents/img/usr/item/1/19440/19440_1.jpg', 0),
  ('d22a6a4e-674b-57a2-8a2f-197e10ad8234', 'a49b33d9-9f2c-5333-9521-8a7c732995d2', 'https://www.tamiya.com/japan_contents/img/usr/item/1/19444/19444_1.jpg', 0),
  ('ac8fa7b0-e5d7-5ab7-983d-daa7a67dbebd', 'e1b626f8-e0ea-52c9-86f0-eb870561d70d', 'https://www.tamiya.com/japan_contents/img/usr/item/1/19441/19441_1.jpg', 0),
  ('57b7829f-ea44-5242-abc1-a4fe4f37a559', 'b3639c7d-581e-5da8-9ec4-ea1eb9d61193', 'https://www.tamiya.com/japan_contents/img/usr/item/1/19435/19435_1.jpg', 0),
  ('bd906c39-7c67-5495-8c38-a81d1e308f75', '532f8e3a-f55f-5936-abcd-58e0f8538785', 'https://www.tamiya.com/japan_contents/img/usr/item/1/18075/18075_1.jpg', 0),
  ('a02559cf-2f34-5e16-9d4b-5e5900c36273', 'f576fa21-8e57-5fa0-953e-f468653e3767', 'https://www.tamiya.com/japan_contents/img/usr/item/1/18069/18069_1.jpg', 0),
  ('d91772b9-3ab4-5f5c-9ede-9309feb2b0e5', '45f04c74-a41c-5514-87a2-ab47ea6d66b6', 'https://www.tamiya.com/japan_contents/img/usr/item/1/18026/18026_1.jpg', 0)
on conflict (id) do nothing;
