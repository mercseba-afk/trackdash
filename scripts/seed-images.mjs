#!/usr/bin/env node
// Generates the catalog-image seed SQL from the audited Tamiya image manifest,
// resolving each entry's IMMUTABLE seed keys (productSeedKey + releaseSeedKey)
// against the effective corrected catalog. Tamiya item numbers are NEVER used
// for identity (see scripts/data/tamiya-image-manifest.ts and docs/IMAGES_MVP.md).
//
// Usage:
//   node --experimental-strip-types scripts/seed-images.mjs
//   (or: pnpm db:seed:images:generate to overwrite the checked-in migration)
//
// Prints SQL to stdout. To regenerate the checked-in migration after editing
// the audited manifest data:
//   node --experimental-strip-types scripts/seed-images.mjs \
//     > supabase/migrations/0008_seed_catalog_images.sql
//
// Every statement is ON CONFLICT (id) DO NOTHING (each image row's id is
// itself a stableUuid() derived from its natural key), so re-running this
// after adding new image entries is safe -- existing rows are left untouched,
// only genuinely new ones get inserted.
//
// Validate the manifest first with: pnpm images:check
import { register } from "node:module"

register("./ts-extension-loader.mjs", import.meta.url)

const { PRODUCTS } = await import("../lib/data/corrected-products.ts")
const { stableUuid } = await import("../lib/data/stable-id.ts")
const { TAMIYA_IMAGES } = await import("./data/tamiya-image-manifest.ts")

function sqlStr(value) {
  if (value === undefined || value === null || value === "") return "NULL"
  return `'${String(value).replace(/'/g, "''")}'`
}

const lines = []
lines.push("-- Seed migration: catalog images (Images MVP).")
lines.push("--")
lines.push("-- Remote-hotlinked official Tamiya image URLs only -- no files")
lines.push("-- downloaded into this repository, nothing uploaded to Supabase")
lines.push("-- Storage. See scripts/data/tamiya-image-manifest.ts for the")
lines.push("-- canonical aggregate and docs/IMAGES_MVP.md for the architecture.")
lines.push("--")
lines.push("-- Generated FROM the audited image manifest (not hand-written)")
lines.push("-- by scripts/seed-images.mjs -- ids are stableUuid()-derived from")
lines.push("-- each entry's natural key, so re-running this after adding new")
lines.push("-- image entries only ever inserts new rows.")
lines.push("--")
lines.push("-- position = 0 for every row here (the primary image). Additional")
lines.push("-- gallery images for the same product/release can be added later")
lines.push("-- at position 1, 2, 3, ... without changing this migration's ids.")
lines.push("")

const productImageRows = []
const releaseImageRows = []
const skipped = []

// Resolve each image entry against the effective audited catalog. This keeps
// image generation aligned with post-seed Product/Release corrections and with
// newly added releases while retaining the frozen seed-key identity rule.
for (const entry of TAMIYA_IMAGES) {
  const product = PRODUCTS.find((p) => p.seedKey === entry.productSeedKey)
  if (!product) {
    skipped.push(`productSeedKey ${entry.productSeedKey}: no matching product in corrected catalog`)
    continue
  }

  if (entry.releaseSeedKey) {
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
