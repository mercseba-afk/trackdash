#!/usr/bin/env node
// Standalone image-manifest validator (Images Phase 1). Runs independently
// of the full catalog invariant checker:
//
//   pnpm images:check
//   (or: node --experimental-strip-types scripts/check-images.mjs)
//
// Hard-fails (exit 1) on any of:
//   - productSeedKey that matches no product
//   - releaseSeedKey that matches no release of that product
//   - releaseSeedKey whose resolved release belongs to a DIFFERENT product
//   - duplicate identical mapping (same target + same URL)
//   - the SAME exact release targeted by two different image entries
//     (a release can have at most one seeded primary image here)
//   - empty or malformed image URL
//   - missing source URL when the manifest marks it required
//   - any sign that image identity was derived from a Tamiya item number
//
// Exit 0 (with a short summary) when the manifest is clean.
//
// IDENTITY RULE (must match scripts/seed-images.mjs exactly):
//   product image row id  = stableUuid(`product-image:${productSeedKey}:0`)
//   release image row id  = stableUuid(`release-image:${productSeedKey}:${releaseSeedKey}:0`)
//   release row id        = stableUuid(`release:${productSeedKey}:${releaseSeedKey}`)
// The Tamiya item number never appears in any of these keys.
import { register } from "node:module"

register("./ts-extension-loader.mjs", import.meta.url)

const { PRODUCTS } = await import("../lib/data/products.ts")
const { stableUuid } = await import("../lib/data/stable-id.ts")
const { TAMIYA_IMAGES } = await import("./data/tamiya-images.ts")

// Set true if every entry must carry a sourcePageUrl. Kept configurable so
// a future non-source-tracked image set (e.g. our own hosted photos) can
// opt out without weakening the check for the current source-tracked set.
const REQUIRE_SOURCE_URL = true

const errors = []
const fail = (msg) => errors.push(msg)

const productBySeedKey = new Map(PRODUCTS.map((p) => [p.seedKey, p]))

// Track the resolved TARGET id of each entry to catch duplicate mappings
// and two entries hitting the same exact release.
const seenTargetIds = new Map() // targetId -> first entry index
const seenExactMapping = new Set() // `${targetId}|${url}` -> duplicate-identical detection

function isValidHttpUrl(u) {
  if (typeof u !== "string" || u.trim() === "") return false
  try {
    const parsed = new URL(u)
    return parsed.protocol === "https:" || parsed.protocol === "http:"
  } catch {
    return false
  }
}

TAMIYA_IMAGES.forEach((entry, i) => {
  const where = `entry #${i + 1} (productSeedKey "${entry.productSeedKey}"${entry.releaseSeedKey ? `, releaseSeedKey "${entry.releaseSeedKey}"` : ""})`

  // --- URL validity ---
  if (!isValidHttpUrl(entry.imageUrl)) {
    fail(`${where}: imageUrl is empty or malformed ("${entry.imageUrl}")`)
  }

  // --- source URL required (when configured) ---
  if (REQUIRE_SOURCE_URL && (!entry.sourcePageUrl || String(entry.sourcePageUrl).trim() === "")) {
    fail(`${where}: sourcePageUrl is required but missing`)
  }
  if (entry.sourcePageUrl !== undefined && !isValidHttpUrl(entry.sourcePageUrl)) {
    fail(`${where}: sourcePageUrl is set but malformed ("${entry.sourcePageUrl}")`)
  }

  // --- identity must not be item-number-derived ---
  // The manifest interface has no productItem/releaseItem field, and item
  // number is optional metadata only. Defensive: if a future edit ever
  // reintroduces an item-number-shaped identity field, catch it.
  if ("productItem" in entry || "releaseItem" in entry || "itemNumber" in entry) {
    fail(`${where}: uses an item-number-shaped identity field -- image identity must derive from seed keys only`)
  }

  // --- product must exist ---
  const product = productBySeedKey.get(entry.productSeedKey)
  if (!product) {
    fail(`${where}: no product has seedKey "${entry.productSeedKey}"`)
    return // can't resolve target id without a product
  }

  let targetId
  if (entry.releaseSeedKey) {
    const releaseId = stableUuid(`release:${entry.productSeedKey}:${entry.releaseSeedKey}`)
    const release = product.releases.find((r) => r.id === releaseId)
    if (!release) {
      fail(`${where}: product "${product.name}" has no release with releaseSeedKey "${entry.releaseSeedKey}"`)
      return
    }
    // Ownership: the resolved release must actually belong to this product.
    // (stableUuid derivation ties them together, but assert it explicitly so
    // a mismatch can never slip through silently.)
    if (release.productId !== product.id) {
      fail(`${where}: resolved release belongs to a different product (ownership violation)`)
      return
    }
    targetId = stableUuid(`release-image:${entry.productSeedKey}:${entry.releaseSeedKey}:0`)

    // A given exact release must not be targeted by more than one entry.
    const releaseKey = `release:${release.id}`
    if (seenTargetIds.has(releaseKey)) {
      fail(`${where}: release "${release.editionName}" is already targeted by entry #${seenTargetIds.get(releaseKey) + 1} -- a release can have at most one seeded primary image`)
    } else {
      seenTargetIds.set(releaseKey, i)
    }
  } else {
    targetId = stableUuid(`product-image:${entry.productSeedKey}:0`)
    const productKey = `product:${product.id}`
    if (seenTargetIds.has(productKey)) {
      fail(`${where}: product "${product.name}" is already targeted by entry #${seenTargetIds.get(productKey) + 1} -- a product can have at most one seeded primary image`)
    } else {
      seenTargetIds.set(productKey, i)
    }
  }

  // --- duplicate identical mapping (same target row + same URL) ---
  const exactKey = `${targetId}|${entry.imageUrl}`
  if (seenExactMapping.has(exactKey)) {
    fail(`${where}: duplicate identical mapping (same target image row and URL as an earlier entry)`)
  } else {
    seenExactMapping.add(exactKey)
  }
})

// -----------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------
const productEntries = TAMIYA_IMAGES.filter((e) => !e.releaseSeedKey).length
const releaseEntries = TAMIYA_IMAGES.filter((e) => e.releaseSeedKey).length
console.log("=== IMAGE MANIFEST CHECK ===")
console.log(`Entries: ${TAMIYA_IMAGES.length} (${productEntries} product-level, ${releaseEntries} release-level)`)
console.log(`Source-URL required: ${REQUIRE_SOURCE_URL}`)
console.log()
if (errors.length === 0) {
  console.log("ALL IMAGE MANIFEST CHECKS PASSED")
  process.exit(0)
} else {
  console.log(`${errors.length} IMAGE MANIFEST VIOLATION(S):`)
  for (const e of errors) console.log(" -", e)
  process.exit(1)
}
