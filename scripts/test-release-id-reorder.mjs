#!/usr/bin/env node
// Catalog Model V2 hardening (point 1): proves release UUIDs are truly
// independent of array position. Builds a multi-release product's releases
// in NORMAL order, then PHYSICALLY REVERSES the `releases` array and builds
// again, and confirms each release (matched by releaseSeedKey/editionName)
// keeps a byte-identical UUID. This can only hold because the UUID derives
// from productSeedKey + the release's own explicit releaseSeedKey, never
// from `i + 1`.
//
// Usage: node --experimental-strip-types scripts/test-release-id-reorder.mjs
import { register } from "node:module"

register("./ts-extension-loader.mjs", import.meta.url)

const { buildReleases } = await import("../lib/data/products.ts")

let failures = 0

// A synthetic multi-release product, mirroring the real seed shape. Each
// release has an explicit releaseSeedKey (as every real release now does).
const seed = {
  seedKey: "reorder-test",
  code: "00000",
  name: "Reorder Test Model",
  series: "Racing Mini 4WD",
  chassis: "MA",
  originalReleaseYear: 1990,
  rarity: "Common",
  estimatedMsrpJPY: 1000,
  desc: "synthetic",
  releases: [
    { releaseSeedKey: "1", type: "Original", year: 1990, original: true },
    { releaseSeedKey: "2", type: "Premium", name: "Test Premium", year: 2012, item: "99999" },
    { releaseSeedKey: "3", type: "Reissue", name: "Test Reissue", year: 2019, item: "88888" },
  ],
}

const productId = "00000000-0000-0000-0000-000000000000"

// Build in normal order -> map editionName -> id.
const normal = buildReleases(productId, seed)
const normalById = new Map(normal.map((r) => [r.editionName, r.id]))

// Build with the releases array PHYSICALLY REVERSED.
const reversedSeed = { ...seed, releases: [...seed.releases].reverse() }
const reversed = buildReleases(productId, reversedSeed)

// Every release must keep the SAME id despite moving position.
for (const r of reversed) {
  const expected = normalById.get(r.editionName)
  if (expected !== r.id) {
    console.log(`[reorder] FAIL: "${r.editionName}" id changed on reorder: ${expected} -> ${r.id}`)
    failures++
  } else {
    console.log(`[reorder] "${r.editionName}": ${r.id} (stable across reorder) OK`)
  }
}

// Also confirm the id SETS are identical (no id appeared/disappeared).
const normalSet = new Set(normal.map((r) => r.id))
const reversedSet = new Set(reversed.map((r) => r.id))
const setsEqual = normalSet.size === reversedSet.size && [...normalSet].every((id) => reversedSet.has(id))
if (!setsEqual) {
  console.log("[reorder] FAIL: id set changed under reorder")
  failures++
}

if (failures === 0) {
  console.log("\nRELEASE-ID REORDER TEST PASSED -- UUIDs independent of array position")
  process.exit(0)
} else {
  console.log(`\nRELEASE-ID REORDER TEST FAILED (${failures} problem(s))`)
  process.exit(1)
}
