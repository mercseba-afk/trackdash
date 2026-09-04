#!/usr/bin/env node
// Generates the catalog-image seed SQL from scripts/data/tamiya-images.ts,
// resolving each entry's natural keys (productItem/releaseItem) against
// lib/data/products.ts's real (stable, deterministic) UUIDs -- the same
// pattern scripts/generate-catalog-seed.mjs already uses for the catalog
// itself, extended to cover product_images/release_images.
//
// Usage:
//   node --experimental-strip-types scripts/seed-images.mjs
//
// Prints SQL to stdout. To regenerate the checked-in migration after
// editing scripts/data/tamiya-images.ts:
//   node --experimental-strip-types scripts/seed-images.mjs \
//     > supabase/migrations/0008_seed_catalog_images.sql
//
// Renumbered from 0006/0007 to 0008 as part of the Catalog Model V2 pass
// (see docs/CATALOG_MODEL_V2.md section 28): 0006 is now schema-only,
// 0007 is data normalization, and this image seed comes last since it
// references product/release rows that must already exist.
//
// Every statement is ON CONFLICT (id) DO NOTHING (each image row's id is
// itself a stableUuid() derived from its natural key), so re-running this
// after adding new TAMIYA_IMAGES entries is safe -- existing rows are
// left untouched, only genuinely new ones get inserted.
import { register } from "node:module"

register("./ts-extension-loader.mjs", import.meta.url)

const { PRODUCTS } = await import("../lib/data/products.ts")
const { stableUuid } = await import("../lib/data/stable-id.ts")
const { TAMIYA_IMAGES } = await import("./data/tamiya-images.ts")

function sqlStr(value) {
  if (value === undefined || value === null || value === "") return "NULL"
  return `'${String(value).replace(/'/g, "''")}'`
}

const lines = []
lines.push("-- Seed migration: catalog images (Images MVP).")
lines.push("--")
lines.push("-- Remote-hotlinked official Tamiya image URLs only -- no files")
lines.push("-- downloaded into this repository, nothing uploaded to Supabase")
lines.push("-- Storage. See scripts/data/tamiya-images.ts for the full source")
lines.push("-- mapping (with per-entry verification notes and Tamiya source")
lines.push("-- page URLs) and docs/IMAGES_MVP.md for the architecture writeup.")
lines.push("--")
lines.push("-- Generated FROM scripts/data/tamiya-images.ts (not hand-written)")
lines.push("-- by scripts/seed-images.mjs -- ids are stableUuid()-derived from")
lines.push("-- each entry's natural key, so re-running this after adding new")
lines.push("-- TAMIYA_IMAGES entries only ever inserts new rows.")
lines.push("--")
lines.push("-- position = 0 for every row here (the primary image). Additional")
lines.push("-- gallery images for the same product/release can be added later")
lines.push("-- at position 1, 2, 3, ... without changing this migration's ids.")
lines.push("")

const productImageRows = []
const releaseImageRows = []
const skipped = []

// Catalog Model V2 hardening (point 9): resolve each image entry by
// TrackDash's immutable seedKey/releaseSeedKey -- NOT by Tamiya item
// number. This mirrors how lib/data/products.ts derives every product/
// release UUID, so the image attaches to the right row no matter how the
// item number is later corrected. Each image row's OWN id is likewise
// derived from the immutable seedKey, never the item number.
for (const entry of TAMIYA_IMAGES) {
  const product = PRODUCTS.find((p) => p.seedKey === entry.productSeedKey)
  if (!product) {
    skipped.push(`productSeedKey ${entry.productSeedKey}: no matching product in lib/data/products.ts`)
    continue
  }

  if (entry.releaseSeedKey) {
    // Resolve the release by its stable UUID, which is itself derived from
    // productSeedKey + releaseSeedKey -- so this never depends on array
    // position or item number.
    const releaseId = stableUuid(`release:${entry.productSeedKey}:${entry.releaseSeedKey}`)
    const release = product.releases.find((r) => r.id === releaseId)
    if (!release) {
      skipped.push(`productSeedKey ${entry.productSeedKey} / releaseSeedKey ${entry.releaseSeedKey}: no matching release`)
      continue
    }
    const imageId = stableUuid(`release-image:${entry.productSeedKey}:${entry.releaseSeedKey}:0`)
    releaseImageRows.push(`  (${sqlStr(imageId)}, ${sqlStr(release.id)}, ${sqlStr(entry.imageUrl)}, 0)`)
  } else {
    const imageId = stableUuid(`product-image:${entry.productSeedKey}:0`)
    productImageRows.push(`  (${sqlStr(imageId)}, ${sqlStr(product.id)}, ${sqlStr(entry.imageUrl)}, 0)`)
  }
}

if (productImageRows.length > 0) {
  lines.push("insert into product_images (id, product_id, url, position) values")
  lines.push(productImageRows.join(",\n"))
  lines.push("on conflict (id) do nothing;")
  lines.push("")
}

if (releaseImageRows.length > 0) {
  lines.push("insert into release_images (id, release_id, url, position) values")
  lines.push(releaseImageRows.join(",\n"))
  lines.push("on conflict (id) do nothing;")
  lines.push("")
}

process.stdout.write(lines.join("\n"))

if (skipped.length > 0) {
  process.stderr.write("\nSkipped (no matching product/release found):\n")
  for (const s of skipped) process.stderr.write(`  - ${s}\n`)
}
