#!/usr/bin/env node
// Generates the catalog seed SQL from lib/data/products.ts plus the audited
// post-seed correction layer in lib/data/catalog-release-corrections.ts.
// The correction layer preserves immutable product/release UUIDs while ensuring
// factual item/chassis/date corrections are not reintroduced by a future seed
// regeneration.
//
// Usage:
//   node --experimental-strip-types scripts/generate-catalog-seed.mjs
//
// Prints SQL to stdout. To regenerate the checked-in seed migration after
// adding new entries to SEEDS in lib/data/products.ts:
//   node --experimental-strip-types scripts/generate-catalog-seed.mjs \
//     > supabase/migrations/0003_seed_initial_catalog.sql
//
// Every statement is ON CONFLICT (id) DO NOTHING, so re-running this
// after adding a handful of new SEEDS entries is safe — existing rows are
// left untouched, only the new ones get inserted. Deployed factual corrections
// are handled by their own forward migrations.
import { register } from "node:module"

register("./ts-extension-loader.mjs", import.meta.url)

const { PRODUCTS: BASE_PRODUCTS, TAMIYA_BRAND_ID, MINI4WD_CATEGORY_ID } = await import("../lib/data/products.ts")
const { applyCatalogReleaseCorrections } = await import("../lib/data/catalog-release-corrections.ts")
const PRODUCTS = applyCatalogReleaseCorrections(BASE_PRODUCTS)

function sqlStr(value) {
  if (value === undefined || value === null || value === "") return "NULL"
  return `'${String(value).replace(/'/g, "''")}'`
}

function sqlNum(value) {
  if (value === undefined || value === null) return "NULL"
  return String(value)
}

function sqlBool(value) {
  return value ? "true" : "false"
}

function slugify(name, seedKey) {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  // Uses seedKey (a frozen, internal identity anchor -- see
  // lib/data/products.ts's file header), not itemNumber, specifically so
  // correcting a wrong item number during a future audit never changes
  // an already-deployed product's slug. slug isn't used for id
  // generation (already safe) or for any current route/lookup
  // (getProductBySlug exists but nothing calls it yet) -- this is a
  // forward-looking correctness fix, not a response to an active bug.
  return `${base}-${seedKey}`
}

const lines = []

lines.push("-- Seed migration: TrackDash's first real catalog dataset.")
lines.push("--")
lines.push("-- NOT throwaway/disposable demo data: this is the same curated set of")
lines.push("-- real, recognizable Tamiya Mini 4WD models previously hardcoded only in")
lines.push("-- lib/data/products.ts, now also persisted as real rows so that")
lines.push("-- collection_items/wishlist_items (which have NOT NULL foreign keys into")
lines.push("-- products/product_releases) have real catalog rows to reference.")
lines.push("--")
lines.push("-- Generated FROM lib/data/products.ts plus the audited factual correction")
lines.push("-- overlay, so immutable ids remain byte-for-byte identical while corrected")
lines.push("-- release facts are carried into any future clean seed generation.")
lines.push("--")
lines.push("-- Every INSERT is ON CONFLICT (id) DO NOTHING, so this migration is safe")
lines.push("-- to re-run (e.g. against a project that already has these rows).")
lines.push("")

lines.push("insert into brands (id, slug, name) values")
lines.push(`  (${sqlStr(TAMIYA_BRAND_ID)}, 'tamiya', 'Tamiya')`)
lines.push("on conflict (id) do nothing;")
lines.push("")

lines.push("insert into categories (id, slug, name) values")
lines.push(`  (${sqlStr(MINI4WD_CATEGORY_ID)}, 'mini4wd', 'Mini 4WD')`)
lines.push("on conflict (id) do nothing;")
lines.push("")

lines.push(
  "insert into products (id, category_id, brand_id, slug, canonical_item_number, name, japanese_name, series, chassis, original_release_year, rarity, description) values",
)
const productRows = PRODUCTS.map((p) => {
  const slug = slugify(p.name, p.seedKey)
  return `  (${sqlStr(p.id)}, ${sqlStr(MINI4WD_CATEGORY_ID)}, ${sqlStr(TAMIYA_BRAND_ID)}, ${sqlStr(slug)}, ${sqlStr(p.itemNumber)}, ${sqlStr(p.name)}, ${sqlStr(p.japaneseName)}, ${sqlStr(p.series)}, ${sqlStr(p.chassis)}, ${sqlNum(p.originalReleaseYear)}, ${sqlStr(p.rarity)}, ${sqlStr(p.description)})`
})
lines.push(productRows.join(",\n"))
lines.push("on conflict (id) do nothing;")
lines.push("")

lines.push(
  "insert into product_releases (id, product_id, item_number, release_type, edition_name, release_year, release_date, chassis, barcode_jan, color, country_market, msrp_jpy, msrp_eur, notes, discontinued, is_original, rarity, data_source) values",
)
// SAFE BY CONSTRUCTION (see docs/CATALOG_AUDIT.md "Final Fixes" +
// lib/data/products.ts's file header): r.msrpJPY / r.msrpEUR here are
// ProductRelease's FACTUAL, verified-only fields -- buildReleases() in
// lib/data/products.ts populates them exclusively from
// verifiedMsrpJPY, never from estimatedMsrpJPY. A future developer
// regenerating this seed for a NEW product cannot accidentally write an
// estimate into these DB columns by using this script as-is; doing so
// would require deliberately reading r.estimatedMsrpJPY/EUR here
// instead, which this script does not do on purpose. Do not "fix" a
// future undefined/NULL msrp_jpy by wiring in the estimate here --
// that's the exact mistake this whole audit corrected.
const releaseRows = []
for (const p of PRODUCTS) {
  for (const r of p.releases) {
    releaseRows.push(
      `  (${sqlStr(r.id)}, ${sqlStr(p.id)}, ${sqlStr(r.itemNumber)}, ${sqlStr(r.releaseType)}, ${sqlStr(r.editionName)}, ${sqlNum(r.releaseYear)}, ${sqlStr(r.releaseDate)}, ${sqlStr(r.chassis)}, ${sqlStr(r.barcodeJAN)}, ${sqlStr(r.color)}, ${sqlStr(r.countryMarket)}, ${sqlNum(r.msrpJPY)}, ${sqlNum(r.msrpEUR)}, ${sqlStr(r.notes)}, ${sqlBool(r.discontinued)}, ${sqlBool(r.isOriginal)}, ${sqlStr(r.rarity)}, 'manual')`,
    )
  }
}
lines.push(releaseRows.join(",\n"))
lines.push("on conflict (id) do nothing;")
lines.push("")

process.stdout.write(lines.join("\n"))
