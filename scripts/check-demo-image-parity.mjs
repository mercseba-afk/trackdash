#!/usr/bin/env node
// Ensures the runtime/demo catalog used by Scanner is projected from the same
// canonical image manifest that seeds Supabase. This guards against the drift
// found during the independent Catalog Foundation v1 review.
import { register } from "node:module"

register("./ts-extension-loader.mjs", import.meta.url)

const { PRODUCTS } = await import("../lib/data/corrected-products.ts")
const { stableUuid } = await import("../lib/data/stable-id.ts")
const { TAMIYA_IMAGES } = await import("./data/tamiya-image-manifest.ts")

const expectedProduct = new Map()
const expectedRelease = new Map()

for (const entry of TAMIYA_IMAGES) {
  if (entry.releaseSeedKey) {
    expectedRelease.set(
      stableUuid(`release:${entry.productSeedKey}:${entry.releaseSeedKey}`),
      entry.imageUrl,
    )
  } else {
    expectedProduct.set(stableUuid(`product:${entry.productSeedKey}`), entry.imageUrl)
  }
}

const errors = []

for (const product of PRODUCTS) {
  const expectedProductUrl = expectedProduct.get(product.id)
  const actualProductUrl = product.images?.[0]
  if ((expectedProductUrl ?? undefined) !== actualProductUrl) {
    errors.push(
      `${product.name}: demo product image differs from canonical manifest (expected ${expectedProductUrl ?? "none"}, got ${actualProductUrl ?? "none"})`,
    )
  }

  for (const release of product.releases) {
    const expectedReleaseUrl = expectedRelease.get(release.id)
    const actualReleaseUrl = release.images?.[0]
    if ((expectedReleaseUrl ?? undefined) !== actualReleaseUrl) {
      errors.push(
        `${product.name} / ${release.editionName}: demo release image differs from canonical manifest (expected ${expectedReleaseUrl ?? "none"}, got ${actualReleaseUrl ?? "none"})`,
      )
    }
  }
}

console.log("=== DEMO IMAGE PARITY CHECK ===")
console.log(`Products: ${PRODUCTS.length} | Releases: ${PRODUCTS.flatMap((p) => p.releases).length}`)
console.log(`Manifest mappings: ${TAMIYA_IMAGES.length}`)
console.log()

if (errors.length > 0) {
  console.log(`${errors.length} DEMO IMAGE PARITY VIOLATION(S):`)
  for (const error of errors) console.log(" -", error)
  process.exit(1)
}

console.log("DEMO IMAGE PARITY PASSED")
