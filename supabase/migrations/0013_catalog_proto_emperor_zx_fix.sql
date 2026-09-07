-- Catalog integrity hardening -- Proto Emperor ZX fix.
--
-- Corrects a real Release/Product association error discovered during the
-- Images Phase 2B hardening pass: this product's Premium release was
-- recorded with item 95450, which was found (this pass) to belong to an
-- entirely different Dash! Yonkuro machine ("DASH-X1 PROTO-EMPEROR PREMIUM
-- BLACK SPECIAL", not Proto Emperor ZX). Full audit trail, including the
-- Tamiya + RCJaz cross-check for both releases, is in
-- docs/CATALOG_AUDIT.md's dedicated "Proto Emperor ZX" section.
--
-- Preserves ALL identity: Product UUID, both Release UUIDs, and both
-- release_sources UUIDs are UNCHANGED -- this migration only UPDATEs
-- factual columns and provenance, exactly like 0007's normalization
-- pattern. No FK is touched, no row is deleted or inserted.
--
-- Product a1fd4f6d-0834-5f09-ac3c-5d4b398f0968 (seedKey 18714, "Proto
-- Emperor ZX"):
--   canonical_item_number / chassis / original_release_year are set here
--   to MATCH exactly what buildReleases() would derive from Release 1
--   below (canonicalReleaseId's own item_number/chassis/release_year) --
--   consistent with the existing "never set independently of the
--   canonical release" invariant, not a second independent source.
--
-- Release 1 (4d5b0a9a-498f-51fc-accd-9316ca11c843, releaseSeedKey "1",
-- Original/canonical): chassis corrected "Super II" -> "Zero";
-- release_year corrected 2016 -> 2007; release_date added (2007-09-01).
-- item_number (18038) and edition_name ("Proto Emperor ZX") unchanged --
-- already correct.
--
-- Release 2 (f0614cb8-d0cb-521d-aa2c-4fc304f39430, releaseSeedKey "2",
-- Premium): item_number 95450 -> 95335; edition_name "Proto Emperor ZX
-- Premium (Black Special)" -> "Proto Emperor ZX Premium"; release_type
-- "Color Special" -> "Premium"; edition_type "color_special" -> "premium";
-- release_year 2019 -> 2017; release_date added (2017-07-15); color
-- "Black" -> "Purple". No rarity/estimated-MSRP columns exist in this
-- table (those are app-level DEMO fields only, never written to the DB --
-- see lib/data/products.ts's own header) -- nothing to touch there.
--
-- release_sources: both rows keep their existing id (the source id derives
-- from productSeedKey+releaseSeedKey+index, never from the URL or
-- verified_fields it carries, so correcting those in place is exactly
-- right -- no new row, no orphan). Release 1's source gains "chassis" and
-- "releaseYear" to verified_fields (both independently confirmed
-- alongside item_number and release_date -- releaseYear is a same-pass
-- metadata correction: this source already verified releaseDate
-- 2007-09-01, whose own year is 2007, but verifiedFields hadn't listed
-- releaseYear as its own explicit entry). Release 2's source is
-- corrected from the false 95450 URL to the real 95335 one, with
-- verified_fields updated to what was actually confirmed on that page
-- (itemNumber, releaseDate, chassis, releaseYear -- same same-pass
-- addition). No reference to 95450 remains anywhere after this
-- migration.
--
-- Deterministic, idempotent-safe (plain UPDATEs by primary key -- running
-- this migration twice produces the same end state, not an error), no
-- UPDATE/DELETE beyond these two products/product_releases rows and two
-- release_sources rows, no schema change, no other Product/Release
-- touched.
--
-- Not applied to Supabase in this pass.

update products
set canonical_item_number = '18038',
    chassis = 'Zero',
    original_release_year = 2007
where id = 'a1fd4f6d-0834-5f09-ac3c-5d4b398f0968';

update product_releases
set item_number = '18038',
    edition_name = 'Proto Emperor ZX',
    release_type = 'Original',
    edition_type = 'original',
    release_year = 2007,
    release_date = '2007-09-01',
    chassis = 'Zero'
where id = '4d5b0a9a-498f-51fc-accd-9316ca11c843';

update product_releases
set item_number = '95335',
    edition_name = 'Proto Emperor ZX Premium',
    release_type = 'Premium',
    edition_type = 'premium',
    release_year = 2017,
    release_date = '2017-07-15',
    chassis = 'Super II',
    color = 'Purple'
where id = 'f0614cb8-d0cb-521d-aa2c-4fc304f39430';

update release_sources
set source_url = 'https://www.tamiya.com/japan/products/18038/index.html',
    verified_fields = '{"itemNumber","releaseDate","chassis","releaseYear"}'::text[],
    checked_at = '2026-09-06'
where id = '81682ed7-0173-52fb-8e03-3dcd1853750c';

update release_sources
set source_url = 'https://www.tamiya.com/japan/products/95335/index.html',
    verified_fields = '{"itemNumber","releaseDate","chassis","releaseYear"}'::text[],
    checked_at = '2026-09-06'
where id = 'dd2218b0-2adc-51a9-8cba-d540e6c8212a';
