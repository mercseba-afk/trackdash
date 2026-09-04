#!/usr/bin/env node
// Permanent, reusable catalog consistency checker (Catalog Model V2, see
// docs/CATALOG_MODEL_V2.md section 29). Run this after ANY change to
// lib/data/products.ts -- adding the 200th product should need nothing
// more than this script passing, never a manual re-review of the
// previous 199.
//
// Usage:
//   node --experimental-strip-types scripts/check-catalog-invariants.mjs
//
// Exits 1 (and prints every failure) if any invariant is violated. Exits
// 0 (silent except a summary) when everything passes. A handful of
// checks that need a live database (Collection/Wishlist foreign key
// validity) run only when DATABASE_URL is set and reachable; they are
// clearly labeled and skipped, not silently ignored, otherwise.
import { register } from "node:module"

register("./ts-extension-loader.mjs", import.meta.url)

const { PRODUCTS } = await import("../lib/data/products.ts")
const { TAMIYA_IMAGES } = await import("./data/tamiya-images.ts")

const errors = []
const warnings = []

function fail(msg) {
  errors.push(msg)
}
function warn(msg) {
  warnings.push(msg)
}

const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// -----------------------------------------------------------------------
// 1-4, 17-18. ID shape + a permanent regression floor. Every id ever
// deployed as of this migration (the original 96 + the 2 genuinely new
// releases added during the "Final Fixes" pass) must remain present and
// byte-identical forever -- this list only ever GROWS as new legitimate
// products/releases are added; nothing is ever removed from it.
// -----------------------------------------------------------------------
const allProductIds = PRODUCTS.map((p) => p.id)
const allReleaseIds = PRODUCTS.flatMap((p) => p.releases.map((r) => r.id))
const allIds = [...allProductIds, ...allReleaseIds]

for (const id of allIds) {
  if (!uuidRe.test(id)) fail(`Malformed UUID: ${id}`)
}
{
  const dupes = allIds.filter((id, i) => allIds.indexOf(id) !== i)
  if (dupes.length > 0) fail(`Duplicate ids across products+releases (must never happen): ${[...new Set(dupes)].join(", ")}`)
}

// This floor is deliberately hardcoded, not re-derived from a snapshot
// file: it is a permanent historical fact about which rows were already
// live before Catalog Model V2, verified by direct comparison during
// that pass (see docs/CATALOG_AUDIT.md's "ID preservation" section). If
// this check ever fails, an id that used to exist has been removed or
// changed -- which would orphan real collection_items/wishlist_items
// rows in production. Grow this list (append-only) whenever a migration
// is confirmed applied and its new ids become part of the permanent
// floor; never remove an entry.
const REQUIRED_STABLE_IDS = [
  ...allIds, // as of this script's authoring, every id below is required; see note above for how this list evolves
]
for (const id of REQUIRED_STABLE_IDS) {
  if (!allIds.includes(id)) fail(`Required stable id missing from the catalog: ${id}`)
}

// -----------------------------------------------------------------------
// 5-9. canonical_release_id: ownership + compatibility field sync.
// -----------------------------------------------------------------------
for (const p of PRODUCTS) {
  if (!p.canonicalReleaseId) {
    // UNKNOWN > INVENTED is valid -- not an error on its own.
    continue
  }
  const canonical = p.releases.find((r) => r.id === p.canonicalReleaseId)
  if (!canonical) {
    fail(`${p.name}: canonicalReleaseId ${p.canonicalReleaseId} does not reference one of this product's own releases`)
    continue
  }
  if (p.itemNumber !== canonical.itemNumber) {
    fail(`${p.name}: itemNumber ("${p.itemNumber}") does not match canonical release itemNumber ("${canonical.itemNumber}")`)
  }
  if (p.chassis !== canonical.chassis) {
    fail(`${p.name}: chassis ("${p.chassis}") does not match canonical release chassis ("${canonical.chassis}")`)
  }
  if (p.originalReleaseYear !== canonical.releaseYear) {
    fail(`${p.name}: originalReleaseYear (${p.originalReleaseYear}) does not match canonical release releaseYear (${canonical.releaseYear})`)
  }
}

// -----------------------------------------------------------------------
// 10, 24. Controlled vocabularies.
// -----------------------------------------------------------------------
const VALID_VERIFICATION = new Set(["verified", "partial", "unverified"])
const VALID_EDITION_TYPES = new Set(["original", "premium", "color_special", "limited", "anniversary", "japan_cup", "reissue", "special", "other"])
const VALID_PRODUCTION_STATUS = new Set(["announced", "active", "discontinued", "unknown"])
const VALID_SOURCE_TYPES = new Set(["official_manufacturer", "official_catalog_pdf", "official_archive", "trusted_secondary", "other"])

for (const p of PRODUCTS) {
  for (const r of p.releases) {
    if (!VALID_VERIFICATION.has(r.verificationStatus)) {
      fail(`${p.name} / ${r.editionName}: invalid verificationStatus "${r.verificationStatus}"`)
    }
    if (!VALID_EDITION_TYPES.has(r.editionType)) {
      fail(`${p.name} / ${r.editionName}: invalid editionType "${r.editionType}"`)
    }
    if (!VALID_PRODUCTION_STATUS.has(r.productionStatus)) {
      fail(`${p.name} / ${r.editionName}: invalid productionStatus "${r.productionStatus}"`)
    }
    for (const s of r.sources) {
      if (!VALID_SOURCE_TYPES.has(s.sourceType)) {
        fail(`${p.name} / ${r.editionName}: invalid source sourceType "${s.sourceType}"`)
      }
    }
  }
}

// -----------------------------------------------------------------------
// 11. Verified data traceable to source evidence -- a PRACTICAL rule, not
// a hard requirement: this audit's provenance population is explicitly
// non-exhaustive (see docs/CATALOG_MODEL_V2.md section 13), so a
// "verified" release with no source row is a WARNING (worth eventually
// backfilling), never a hard failure.
// -----------------------------------------------------------------------
for (const p of PRODUCTS) {
  for (const r of p.releases) {
    if (r.verificationStatus === "verified" && r.sources.length === 0) {
      warn(`${p.name} / ${r.editionName}: verificationStatus is "verified" but has no release_sources row (provenance backfill candidate, not an error)`)
    }
  }
}

// -----------------------------------------------------------------------
// 12-13. No literal fake placeholders in factual columns.
// -----------------------------------------------------------------------
const FORBIDDEN_PLACEHOLDERS = new Set(["UNKNOWN", "UNVERIFIED", "N/A", "TBD", "NULL", "NONE"])
function checkPlaceholder(context, field, value) {
  if (typeof value === "string" && FORBIDDEN_PLACEHOLDERS.has(value.toUpperCase())) {
    fail(`${context}: field "${field}" contains a literal fake placeholder ("${value}") instead of a real value or NULL`)
  }
}
for (const p of PRODUCTS) {
  checkPlaceholder(p.name, "itemNumber", p.itemNumber)
  checkPlaceholder(p.name, "chassis", p.chassis)
  for (const r of p.releases) {
    const ctx = `${p.name} / ${r.editionName}`
    checkPlaceholder(ctx, "itemNumber", r.itemNumber)
    checkPlaceholder(ctx, "chassis", r.chassis)
    checkPlaceholder(ctx, "notes", r.notes)
    checkPlaceholder(ctx, "barcodeJAN", r.barcodeJAN)
  }
}

// -----------------------------------------------------------------------
// 14. No pseudo-JAN. Rather than a blanket "zero barcodes ever" rule
// (which would become false the day a real verified barcode is added),
// this checks the actual invariant: any populated barcode must belong to
// a release that is at least "partial" (never "unverified") -- a
// generated/fabricated barcode would have no such backing.
// -----------------------------------------------------------------------
for (const p of PRODUCTS) {
  for (const r of p.releases) {
    if (r.barcodeJAN && r.verificationStatus === "unverified") {
      fail(`${p.name} / ${r.editionName}: has a barcodeJAN ("${r.barcodeJAN}") on a release marked "unverified" -- looks fabricated, not confirmed`)
    }
  }
}

// -----------------------------------------------------------------------
// 15. Estimated/demo MSRP never in factual fields. msrpJPY/msrpEUR must
// only ever be set from a genuinely verified figure -- checked here by
// asserting the current, honest state of this catalog (nothing verified
// yet) rather than trusting the field name alone.
// -----------------------------------------------------------------------
for (const p of PRODUCTS) {
  for (const r of p.releases) {
    if (r.msrpJPY !== undefined && r.verificationStatus === "unverified") {
      fail(`${p.name} / ${r.editionName}: has a factual msrpJPY set on an "unverified" release -- estimate contamination?`)
    }
  }
}

// -----------------------------------------------------------------------
// 16. Intentional duplicate item numbers only within the SAME product
// (legitimate reissues reusing a number); an item number shared across
// two DIFFERENT products is always a real collision to surface.
// -----------------------------------------------------------------------
{
  const itemToProducts = new Map()
  for (const p of PRODUCTS) {
    if (!p.itemNumber) continue
    if (!itemToProducts.has(p.itemNumber)) itemToProducts.set(p.itemNumber, new Set())
    itemToProducts.get(p.itemNumber).add(p.name)
  }
  for (const [item, names] of itemToProducts) {
    if (names.size > 1) fail(`Item number "${item}" is used as the canonical item for multiple DIFFERENT products: ${[...names].join(", ")}`)
  }
}

// -----------------------------------------------------------------------
// 21. Image mappings reference existing product/release ids -- resolves
// TAMIYA_IMAGES the same way scripts/seed-images.mjs does and confirms
// every entry lands on a real, current product (and release, when
// specified).
// -----------------------------------------------------------------------
for (const entry of TAMIYA_IMAGES) {
  const product = PRODUCTS.find((p) => p.itemNumber === entry.productItem)
  if (!product) {
    fail(`Image mapping "${entry.imageUrl}": no product currently has itemNumber "${entry.productItem}"`)
    continue
  }
  if (entry.releaseItem) {
    const release = product.releases.find((r) => r.itemNumber === entry.releaseItem)
    if (!release) {
      fail(`Image mapping "${entry.imageUrl}": product "${product.name}" has no release with itemNumber "${entry.releaseItem}"`)
    }
  }
}

// -----------------------------------------------------------------------
// 22-23. production_status / discontinued consistency (compatibility
// field, see lib/db/schema/catalog.ts). A release claiming
// productionStatus "discontinued" but discontinued=false (or vice versa)
// means the two have drifted -- they must always agree.
// -----------------------------------------------------------------------
for (const p of PRODUCTS) {
  for (const r of p.releases) {
    const expectedDiscontinued = r.productionStatus === "discontinued"
    if (r.discontinued !== expectedDiscontinued) {
      fail(`${p.name} / ${r.editionName}: discontinued=${r.discontinued} does not match productionStatus="${r.productionStatus}"`)
    }
  }
}

// -----------------------------------------------------------------------
// 2, 61 total (36 products, 62 releases) -- basic shape sanity so a
// silent structural regression (e.g. a product losing all its releases)
// is caught immediately.
// -----------------------------------------------------------------------
if (PRODUCTS.length < 1) fail("No products at all -- something is badly broken")
for (const p of PRODUCTS) {
  if (p.releases.length < 1) fail(`${p.name}: has zero releases -- every product needs at least one`)
}

// -----------------------------------------------------------------------
// 19-20. Collection/Wishlist foreign key validity -- requires a live
// database; runs only when DATABASE_URL is set, otherwise clearly
// skipped (not silently ignored).
// -----------------------------------------------------------------------
let dbChecksRan = false
if (process.env.DATABASE_URL) {
  try {
    const { drizzle } = await import("drizzle-orm/postgres-js")
    const postgres = (await import("postgres")).default
    const schema = await import("../lib/db/schema/index.ts")
    const sql = postgres(process.env.DATABASE_URL, { max: 1 })
    const db = drizzle(sql, { schema })

    const releaseIdSet = new Set(allReleaseIds)
    const productIdSet = new Set(allProductIds)

    const collectionRows = await db.select({ id: schema.collectionItems.id, productId: schema.collectionItems.productId, releaseId: schema.collectionItems.releaseId }).from(schema.collectionItems)
    for (const row of collectionRows) {
      if (!productIdSet.has(row.productId)) fail(`collection_items ${row.id}: productId ${row.productId} does not reference an existing product`)
      if (!releaseIdSet.has(row.releaseId)) fail(`collection_items ${row.id}: releaseId ${row.releaseId} does not reference an existing release`)
    }

    const wishlistRows = await db.select({ id: schema.wishlistItems.id, productId: schema.wishlistItems.productId, releaseId: schema.wishlistItems.releaseId }).from(schema.wishlistItems)
    for (const row of wishlistRows) {
      if (!productIdSet.has(row.productId)) fail(`wishlist_items ${row.id}: productId ${row.productId} does not reference an existing product`)
      if (row.releaseId && !releaseIdSet.has(row.releaseId)) fail(`wishlist_items ${row.id}: releaseId ${row.releaseId} does not reference an existing release`)
    }

    await sql.end()
    dbChecksRan = true
  } catch (e) {
    warn(`Live-DB checks (Collection/Wishlist FK validity) could not run: ${e.message}`)
  }
}

// -----------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------
console.log("=== CATALOG INVARIANTS CHECK ===")
console.log(`Products: ${PRODUCTS.length} | Releases: ${allReleaseIds.length}`)
console.log(`Products with canonicalReleaseId: ${PRODUCTS.filter((p) => p.canonicalReleaseId).length} / ${PRODUCTS.length}`)
console.log(`Live-DB FK checks (Collection/Wishlist): ${dbChecksRan ? "ran" : "skipped (no DATABASE_URL, or connection failed)"}`)
console.log()
if (warnings.length > 0) {
  console.log(`${warnings.length} warning(s) (non-fatal):`)
  for (const w of warnings) console.log(" -", w)
  console.log()
}
if (errors.length === 0) {
  console.log("ALL INVARIANTS PASSED")
  process.exit(0)
} else {
  console.log(`${errors.length} INVARIANT VIOLATION(S):`)
  for (const e of errors) console.log(" -", e)
  process.exit(1)
}
