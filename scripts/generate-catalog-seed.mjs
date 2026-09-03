#!/usr/bin/env node
// Generates the catalog seed SQL from lib/data/products.ts — the actual
// app source, not a hand-copied duplicate — so the ids and data in the
// database seed are always byte-for-byte what the app itself computes at
// runtime via lib/data/stable-id.ts's stableUuid().
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
// left untouched, only the new ones get inserted.
import { register } from "node:module"
import { pathToFileURL } from "node:url"

register("./ts-extension-loader.mjs", import.meta.url)

const { PRODUCTS, TAMIYA_BRAND_ID, MINI4WD_CATEGORY_ID } = await import("../lib/data/products.ts")

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
lines.push("-- Generated FROM lib/data/products.ts (not hand-written) by")
lines.push("-- scripts/generate-catalog-seed.mjs, so the ids below are byte-for-byte")
lines.push("-- identical to the ones the app computes at runtime via")
lines.push("-- lib/data/stable-id.ts's stableUuid() -- both are derived from the exact")
lines.push("-- same natural keys (item numbers, release indices). Re-running the")
lines.push("-- generator after adding new SEEDS entries only ever produces new rows;")
lines.push("-- it never changes an id that already exists.")
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
const releaseRows = []
for (const p of PRODUCTS) {
  for (const r of p.releases) {
    releaseRows.push(
      `  (${sqlStr(r.id)}, ${sqlStr(p.id)}, ${sqlStr(r.itemNumber)}, ${sqlStr(r.releaseType)}, ${sqlStr(r.editionName)}, ${sqlNum(r.releaseYear)}, NULL, ${sqlStr(r.chassis)}, ${sqlStr(r.barcodeJAN)}, ${sqlStr(r.color)}, ${sqlStr(r.countryMarket)}, ${sqlNum(r.msrpJPY)}, ${sqlNum(r.msrpEUR)}, ${sqlStr(r.notes)}, ${sqlBool(r.discontinued)}, ${sqlBool(r.isOriginal)}, ${sqlStr(r.rarity)}, 'manual')`,
    )
  }
}
lines.push(releaseRows.join(",\n"))
lines.push("on conflict (id) do nothing;")
lines.push("")

process.stdout.write(lines.join("\n"))
