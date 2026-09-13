import type { Product, ProductRelease } from "@/lib/types"
import {
  PRODUCTS as BASE_PRODUCTS,
  getRelatedProducts,
} from "./products"
import { applyCatalogReleaseCorrections } from "./catalog-release-corrections"
import { applyCatalogCorrectionsBatch3 } from "./catalog-corrections-batch3"
import { applyCatalogCorrectionsBatch4 } from "./catalog-corrections-batch4"
import { applyCatalogCorrectionsBatch5 } from "./catalog-corrections-batch5"
import { applyCatalogCorrectionsBatch6 } from "./catalog-corrections-batch6"
import { applyCatalogCorrectionsBatch7 } from "./catalog-corrections-batch7"
import { applyCatalogCorrectionsBatch8 } from "./catalog-corrections-batch8"
import { applyCatalogCorrectionsBatch9 } from "./catalog-corrections-batch9"
import { applyCatalogCorrectionsBatch10 } from "./catalog-corrections-batch10"
import { applyCatalogImageManifest } from "./catalog-image-overlay"

// Runtime/demo compatibility view of the historical seed catalog after applying
// every evidence-backed factual correction in sequence. The production catalog
// itself is DB-backed; this module keeps Scanner and local/demo helpers aligned
// with that same effective catalog instead of silently reading stale seed facts.
//
// NOTE: applyCatalogReleaseCorrections() is a legacy composition entry point that
// already applies catalog-corrections-batch2 internally. Do NOT apply Batch 2 a
// second time here: its additive release corrections are intentionally not a
// separate pass through this module.
//
// Images are projected last from the canonical Tamiya image manifest. That same
// manifest seeds Supabase, so Scanner/demo helpers no longer maintain a second,
// hand-synchronized image source of truth.
const BATCH2_PRODUCTS = applyCatalogReleaseCorrections(BASE_PRODUCTS)
const BATCH3_PRODUCTS = applyCatalogCorrectionsBatch3(BATCH2_PRODUCTS)
const BATCH4_PRODUCTS = applyCatalogCorrectionsBatch4(BATCH3_PRODUCTS)
const BATCH5_PRODUCTS = applyCatalogCorrectionsBatch5(BATCH4_PRODUCTS)
const BATCH6_PRODUCTS = applyCatalogCorrectionsBatch6(BATCH5_PRODUCTS)
const BATCH7_PRODUCTS = applyCatalogCorrectionsBatch7(BATCH6_PRODUCTS)
const BATCH8_PRODUCTS = applyCatalogCorrectionsBatch8(BATCH7_PRODUCTS)
const BATCH9_PRODUCTS = applyCatalogCorrectionsBatch9(BATCH8_PRODUCTS)
const BATCH10_PRODUCTS = applyCatalogCorrectionsBatch10(BATCH9_PRODUCTS)
export const PRODUCTS: Product[] = applyCatalogImageManifest(BATCH10_PRODUCTS)

export { getRelatedProducts }

export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id)
}

export function getReleaseById(releaseId: string): { product: Product; release: ProductRelease } | undefined {
  for (const product of PRODUCTS) {
    const release = product.releases.find((r) => r.id === releaseId)
    if (release) return { product, release }
  }
  return undefined
}

export function primaryRelease(product: Product): ProductRelease {
  return product.releases.find((r) => r.isOriginal) ?? product.releases[0]
}

export function resolveRelease(product: Product, releaseId?: string): ProductRelease {
  if (releaseId) {
    const found = product.releases.find((r) => r.id === releaseId)
    if (found) return found
  }
  return primaryRelease(product)
}

function normalizeScannerCode(value: string) {
  return value.trim().replace(/[\s-]+/g, "").toLowerCase()
}

function isValidEan13(value: string) {
  if (!/^\d{13}$/.test(value)) return false
  const digits = [...value].map(Number)
  const checksumBase = digits.slice(0, 12).reduce(
    (sum, digit, index) => sum + digit * (index % 2 === 0 ? 1 : 3),
    0,
  )
  return (10 - (checksumBase % 10)) % 10 === digits[12]
}

/**
 * Tamiya's standard JAN/EAN-13 for many kits is 4950344 + the five-digit
 * item number + the EAN check digit. We only use this as a conservative
 * fallback after an explicit barcodeJAN match and only when checksum/prefix
 * are both valid, so an arbitrary barcode can never be mistaken for an item.
 */
export function tamiyaItemNumberFromJan(value: string): string | undefined {
  const normalized = normalizeScannerCode(value)
  if (!isValidEan13(normalized) || !normalized.startsWith("4950344")) return undefined
  return normalized.slice(7, 12)
}

export function findByCode(query: string): { product: Product; release?: ProductRelease } | undefined {
  const q = normalizeScannerCode(query)
  if (!q) return undefined

  // Scanner identity priority is deliberately global, not product-by-product:
  // 1) exact release item/JAN, 2) conservative Tamiya JAN derivation,
  // 3) canonical product item, 4) legacy productCode.
  // A legacy productCode must never steal a real Tamiya release item number from
  // a different product (e.g. Avante Mk.II productCode 95110 vs Emperor release 95110).
  for (const product of PRODUCTS) {
    const releaseHit = product.releases.find(
      (r) => normalizeScannerCode(r.itemNumber ?? "") === q || normalizeScannerCode(r.barcodeJAN ?? "") === q,
    )
    if (releaseHit) return { product, release: releaseHit }
  }

  const derivedTamiyaItem = tamiyaItemNumberFromJan(q)
  if (derivedTamiyaItem) {
    for (const product of PRODUCTS) {
      const releaseHit = product.releases.find(
        (release) => normalizeScannerCode(release.itemNumber ?? "") === derivedTamiyaItem,
      )
      if (releaseHit) return { product, release: releaseHit }
    }
  }

  const productByItem = PRODUCTS.find(
    (product) => normalizeScannerCode(product.itemNumber ?? "") === q,
  )
  if (productByItem) return { product: productByItem }

  const productByLegacyCode = PRODUCTS.find(
    (product) => normalizeScannerCode(product.productCode ?? "") === q,
  )
  if (productByLegacyCode) return { product: productByLegacyCode }

  return undefined
}
