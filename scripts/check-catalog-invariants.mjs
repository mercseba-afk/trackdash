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
const { STABLE_ID_MANIFEST } = await import("../lib/data/stable-id-manifest.ts")

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
// 1-4, 17-18. ID shape + a permanent regression floor from the IMMUTABLE
// MANIFEST (Catalog Model V2 hardening point 5). The floor is imported
// from lib/data/stable-id-manifest.ts -- a checked-in, append-only
// literal -- NOT re-derived from PRODUCTS at runtime. This is the whole
// point: a runtime-derived floor could never notice an id DISAPPEARING
// (it would just re-derive the smaller set), whereas comparing against a
// fixed manifest hard-fails the moment any historically-allocated id is
// missing or has changed kind.
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

// Every id in the manifest must still be present in the catalog, with the
// same kind (product vs release). A missing/changed id would orphan real
// collection_items/wishlist_items rows in production.
{
  const productIdSet = new Set(allProductIds)
  const releaseIdSet = new Set(allReleaseIds)
  for (const entry of STABLE_ID_MANIFEST) {
    if (entry.kind === "product") {
      if (!productIdSet.has(entry.id)) fail(`Stable-id manifest: product id ${entry.id} ("${entry.label}") has DISAPPEARED or changed from the catalog`)
    } else {
      if (!releaseIdSet.has(entry.id)) fail(`Stable-id manifest: release id ${entry.id} ("${entry.label}") has DISAPPEARED or changed from the catalog`)
    }
  }
  // Also surface ids present now but NOT in the manifest -- these are new
  // legitimate rows that must be APPENDED to the manifest once their
  // migration is confirmed applied. Warning, not failure: adding a product
  // is normal; the manifest just needs updating.
  const manifestIds = new Set(STABLE_ID_MANIFEST.map((e) => e.id))
  for (const id of allIds) {
    if (!manifestIds.has(id)) warn(`Catalog id ${id} is not yet in the stable-id manifest -- append it to lib/data/stable-id-manifest.ts once its migration is confirmed applied`)
  }
}

// -----------------------------------------------------------------------
// 5-9. canonical_release_id: ownership + compatibility field sync. With
// the compat fields now nullable (hardening point 1), a NULL canonical
// release means all three compat fields MUST be undefined too.
// -----------------------------------------------------------------------
for (const p of PRODUCTS) {
  if (!p.canonicalReleaseId) {
    // UNKNOWN > INVENTED: no canonical release => no compat facts either.
    if (p.itemNumber !== undefined) fail(`${p.name}: has no canonicalReleaseId but itemNumber is set ("${p.itemNumber}") -- compat fields must be undefined when there is no canonical release`)
    if (p.chassis !== undefined) fail(`${p.name}: has no canonicalReleaseId but chassis is set ("${p.chassis}")`)
    if (p.originalReleaseYear !== undefined) fail(`${p.name}: has no canonicalReleaseId but originalReleaseYear is set (${p.originalReleaseYear})`)
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
// Point 4 + 10: a "verified" release MUST have provenance -- HARD FAIL now,
// not a warning. The safe default is "unverified"; nothing reaches
// "verified" without an explicit official source (see
// lib/data/products.ts's buildReleases). This check guarantees that
// invariant holds even if a future edit sets verificationStatus by hand.
// -----------------------------------------------------------------------
for (const p of PRODUCTS) {
  for (const r of p.releases) {
    if (r.verificationStatus === "verified" && r.sources.length === 0) {
      fail(`${p.name} / ${r.editionName}: verificationStatus="verified" but has ZERO provenance sources -- a verified release must be traceable to evidence`)
    }
  }
}

// -----------------------------------------------------------------------
// Point 10: release_sources.verified_fields must use a controlled
// vocabulary (the app-field-key convention, matching ProductRelease's own
// property names), never arbitrary strings. This is what makes the
// field-level provenance checks below (barcode/MSRP) meaningful.
// -----------------------------------------------------------------------
const VALID_VERIFIED_FIELDS = new Set([
  "itemNumber",
  "chassis",
  "releaseYear",
  "releaseDate",
  "editionName",
  "color",
  "barcodeJAN",
  "msrpJPY",
  "msrpEUR",
  "countryMarket",
])
for (const p of PRODUCTS) {
  for (const r of p.releases) {
    for (const s of r.sources) {
      for (const f of s.verifiedFields) {
        if (!VALID_VERIFIED_FIELDS.has(f)) {
          fail(`${p.name} / ${r.editionName}: source verified_fields contains unknown field "${f}" (not in the controlled vocabulary)`)
        }
      }
    }
  }
}

// -----------------------------------------------------------------------
// Point 10: a populated FACTUAL barcode or MSRP must have provenance that
// specifically verifies THAT field -- being generically "verified"/
// "partial" is not enough. Checks barcodeJAN, msrpJPY, and msrpEUR
// independently. (This catalog currently has none of these populated, so
// these checks pass vacuously today -- they're a guard for the future.)
// -----------------------------------------------------------------------
function sourcesVerifyField(release, field) {
  return release.sources.some((s) => s.verifiedFields.includes(field))
}
for (const p of PRODUCTS) {
  for (const r of p.releases) {
    if (r.barcodeJAN !== undefined && !sourcesVerifyField(r, "barcodeJAN")) {
      fail(`${p.name} / ${r.editionName}: has a factual barcodeJAN but no source verifies "barcodeJAN"`)
    }
    if (r.msrpJPY !== undefined && !sourcesVerifyField(r, "msrpJPY")) {
      fail(`${p.name} / ${r.editionName}: has a factual msrpJPY but no source verifies "msrpJPY"`)
    }
    if (r.msrpEUR !== undefined && !sourcesVerifyField(r, "msrpEUR")) {
      fail(`${p.name} / ${r.editionName}: has a factual msrpEUR but no source verifies "msrpEUR"`)
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
// Point 7: cross-product item-number collision on ALL release item
// numbers (not just the product-level canonical one). The same item
// number on multiple releases of the SAME product can be legitimate
// (reissue reusing a number); the same item number on releases belonging
// to DIFFERENT products is a hard-fail collision (no allowlist exists yet
// -- add one, explicitly documented, only if a real case ever emerges).
// -----------------------------------------------------------------------
{
  const itemToProducts = new Map()
  for (const p of PRODUCTS) {
    for (const r of p.releases) {
      if (!r.itemNumber) continue
      if (!itemToProducts.has(r.itemNumber)) itemToProducts.set(r.itemNumber, new Set())
      itemToProducts.get(r.itemNumber).add(p.id)
    }
  }
  for (const [item, productIds] of itemToProducts) {
    if (productIds.size > 1) {
      const names = PRODUCTS.filter((p) => productIds.has(p.id)).map((p) => p.name)
      fail(`Item number "${item}" appears on releases of multiple DIFFERENT products: ${names.join(", ")} -- accidental cross-product collision`)
    }
  }
}

// -----------------------------------------------------------------------
// Point 8: duplicate release identity, NULL-aware. The DB unique
// constraint is (product_id, item_number, release_year, color) with NULLS
// NOT DISTINCT. Mirror that semantics here so a duplicate is caught BEFORE
// the migration runs: two releases of the same product with the same
// (item_number, release_year, color) tuple -- treating NULL as equal to
// NULL -- are a forbidden duplicate. Genuinely distinct reissues differ on
// at least one of the three and pass.
// -----------------------------------------------------------------------
{
  for (const p of PRODUCTS) {
    const seen = new Map()
    for (const r of p.releases) {
      // NULL-as-equal key: a literal sentinel for undefined, matching
      // NULLS NOT DISTINCT (two undefineds collide).
      const key = `${r.itemNumber ?? "\u0000NULL"}|${r.releaseYear ?? "\u0000NULL"}|${r.color ?? "\u0000NULL"}`
      if (seen.has(key)) {
        fail(`${p.name}: two releases share identity (item_number, release_year, color) = (${r.itemNumber ?? "NULL"}, ${r.releaseYear ?? "NULL"}, ${r.color ?? "NULL"}): "${seen.get(key)}" and "${r.editionName}" -- would violate the NULLS NOT DISTINCT unique constraint`)
      } else {
        seen.set(key, r.editionName)
      }
    }
  }
}

// -----------------------------------------------------------------------
// Point 9/21: image mappings reference existing product/release rows,
// resolved by IMMUTABLE seedKey/releaseSeedKey (the same way
// scripts/seed-images.mjs does), NOT by item number.
// -----------------------------------------------------------------------
const stableUuidForImages = (await import("../lib/data/stable-id.ts")).stableUuid
for (const entry of TAMIYA_IMAGES) {
  const product = PRODUCTS.find((p) => p.seedKey === entry.productSeedKey)
  if (!product) {
    fail(`Image mapping "${entry.imageUrl}": no product currently has seedKey "${entry.productSeedKey}"`)
    continue
  }
  if (entry.releaseSeedKey) {
    const releaseId = stableUuidForImages(`release:${entry.productSeedKey}:${entry.releaseSeedKey}`)
    const release = product.releases.find((r) => r.id === releaseId)
    if (!release) {
      fail(`Image mapping "${entry.imageUrl}": product "${product.name}" has no release with releaseSeedKey "${entry.releaseSeedKey}"`)
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
// Point 4: a FACTUAL, non-"unknown" production status
// (active/announced/discontinued) must be backed by evidence -- it must
// have statusCheckedAt AND at least one provenance source. "unknown" needs
// nothing. This stops a production claim from existing without evidence.
// -----------------------------------------------------------------------
for (const p of PRODUCTS) {
  for (const r of p.releases) {
    if (r.productionStatus !== "unknown") {
      if (!r.statusCheckedAt) {
        fail(`${p.name} / ${r.editionName}: productionStatus="${r.productionStatus}" (factual) but no statusCheckedAt`)
      }
      if (r.sources.length === 0) {
        fail(`${p.name} / ${r.editionName}: productionStatus="${r.productionStatus}" (factual) but no provenance source`)
      }
    }
  }
}

// -----------------------------------------------------------------------
// Point 2: no invented geographic default. If the seed layer ever
// reintroduced a `?? "Japan"` (or any blanket default), every release
// would carry the same non-null countryMarket. We can't prove a specific
// value is "real" here, but we CAN catch the invented-default smell: if
// EVERY release has the identical countryMarket, that's the signature of a
// hardcoded default rather than source-derived data. Today every release
// has countryMarket === undefined (no source data set it), so this passes.
// -----------------------------------------------------------------------
{
  const markets = PRODUCTS.flatMap((p) => p.releases.map((r) => r.countryMarket))
  const nonNull = markets.filter((m) => m !== undefined)
  const distinct = new Set(nonNull)
  if (nonNull.length === markets.length && distinct.size === 1) {
    fail(`Every release has the same non-null countryMarket ("${[...distinct][0]}") -- looks like a reintroduced invented default, not source data`)
  }
}

// -----------------------------------------------------------------------
// Point 3: factual msrpEUR must never be a currency conversion of msrpJPY.
// The two are independent facts (an official JP price converted to EUR is
// not an official European MSRP). We can't see the source math here, but a
// converted value would be a deterministic function of msrpJPY; the clean
// invariant is: a populated msrpEUR must have provenance specifically
// backing "msrpEUR" (checked below in the field-provenance block) AND must
// not silently exist only because msrpJPY does. Enforce the "EUR present
// implies its own provenance, independent of JPY" rule explicitly.
// (Today no release has either, so this passes vacuously -- it guards the
// future.)
// -----------------------------------------------------------------------
for (const p of PRODUCTS) {
  for (const r of p.releases) {
    if (r.msrpEUR !== undefined) {
      const eurBacked = r.sources.some((s) => s.verifiedFields.includes("msrpEUR"))
      if (!eurBacked) {
        fail(`${p.name} / ${r.editionName}: factual msrpEUR is set but no source backs "msrpEUR" -- a converted JP price is not an official EU MSRP`)
      }
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

    // Point 3: verify in the ACTUAL database that every product's three
    // compatibility columns match its canonical release's own columns --
    // i.e. that the DB-level triggers have kept them in sync and nothing
    // has drifted since deploy. This is the live counterpart to the
    // in-seed canonical-sync check above.
    const dbProducts = await db
      .select({
        id: schema.products.id,
        name: schema.products.name,
        canonicalReleaseId: schema.products.canonicalReleaseId,
        canonicalItemNumber: schema.products.canonicalItemNumber,
        chassis: schema.products.chassis,
        originalReleaseYear: schema.products.originalReleaseYear,
      })
      .from(schema.products)
    const dbReleases = await db
      .select({ id: schema.productReleases.id, productId: schema.productReleases.productId, itemNumber: schema.productReleases.itemNumber, chassis: schema.productReleases.chassis, releaseYear: schema.productReleases.releaseYear })
      .from(schema.productReleases)
    const dbReleaseById = new Map(dbReleases.map((r) => [r.id, r]))
    for (const p of dbProducts) {
      if (!p.canonicalReleaseId) {
        if (p.canonicalItemNumber !== null || p.chassis !== null || p.originalReleaseYear !== null) {
          fail(`DB product ${p.name}: canonical_release_id is NULL but a compat column is non-NULL (drift)`)
        }
        continue
      }
      const rel = dbReleaseById.get(p.canonicalReleaseId)
      if (!rel) {
        fail(`DB product ${p.name}: canonical_release_id ${p.canonicalReleaseId} not found`)
        continue
      }
      if (rel.productId !== p.id) fail(`DB product ${p.name}: canonical_release_id belongs to a different product (ownership violation)`)
      if ((p.canonicalItemNumber ?? null) !== (rel.itemNumber ?? null)) fail(`DB product ${p.name}: canonical_item_number drifted from canonical release`)
      if ((p.chassis ?? null) !== (rel.chassis ?? null)) fail(`DB product ${p.name}: chassis drifted from canonical release`)
      if ((p.originalReleaseYear ?? null) !== (rel.releaseYear ?? null)) fail(`DB product ${p.name}: original_release_year drifted from canonical release`)
    }

    await sql.end()
    dbChecksRan = true
  } catch (e) {
    warn(`Live-DB checks (Collection/Wishlist FK validity + canonical cache sync) could not run: ${e.message}`)
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
