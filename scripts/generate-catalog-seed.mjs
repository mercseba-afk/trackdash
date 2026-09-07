#!/usr/bin/env node
// Generates the catalog seed SQL from the effective audited catalog exposed by
// lib/data/corrected-products.ts. That module chains every post-seed correction
// overlay while preserving immutable Product/Release UUIDs.
//
// Usage:
//   node --experimental-strip-types scripts/generate-catalog-seed.mjs
//
// Prints SQL to stdout. To regenerate the checked-in seed migration after
// adding new catalog entries:
//   node --experimental-strip-types scripts/generate-catalog-seed.mjs \
//     > supabase/migrations/0003_seed_initial_catalog.sql
//
// Every statement is ON CONFLICT (id) DO NOTHING, so re-running this
// after adding new rows is safe — existing rows are left untouched. Deployed
// factual corrections remain handled by their own forward migrations.
import { register } from "node:module"

register("./ts-extension-loader.mjs", import.meta.url)

const { TAMIYA_BRAND_ID, MINI4WD_CATEGORY_ID } = await import("../lib/data/products.ts")
const { PRODUCTS } = await import("../lib/data/corrected-products.ts")

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
  // an already-deployed product's identity anchor.
  return `${base}-${seedKey}`
}

const lines = []

lines.push("-- Seed migration: TrackDash's first real catalog dataset.")
lines.push("--")
lines.push("-- NOT throwaway/disposable demo data: this is the same curated set of")
lines.push("-- real, recognizable Tamiya Mini 4WD models exposed by the effective")
lines.push("-- corrected catalog, now persisted as real rows so that")
lines.push("-- collection_items/wishlist_items (which have NOT NULL foreign keys into")
lines.push("-- products/product_releases) have real catalog rows to reference.")
lines.push("--")
lines.push("-- Generated FROM lib/data/corrected-products.ts, so immutable ids remain")
lines.push("-- stable while audited factual corrections are carried into any future")
lines.push("-- clean seed generation.")
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
// SAFE BY CONSTRUCTION: r.msrpJPY / r.msrpEUR are ProductRelease's FACTUAL,
// verified-only fields. Never wire estimatedMsrpJPY/EUR into these DB columns.
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
