import type { Product, ProductRelease } from "@/lib/types"
import {
  PRODUCTS as BASE_PRODUCTS,
  getRelatedProducts,
} from "./products"
import { applyCatalogReleaseCorrections } from "./catalog-release-corrections"
import { applyCatalogCorrectionsBatch3 } from "./catalog-corrections-batch3"
import { applyCatalogCorrectionsBatch4 } from "./catalog-corrections-batch4"

// Runtime/demo compatibility view of the historical seed catalog after applying
// every evidence-backed factual correction in sequence. The production catalog
// itself is DB-backed; this module keeps Scanner and local/demo helpers aligned
// with that same effective catalog instead of silently reading stale seed facts.
//
// NOTE: applyCatalogReleaseCorrections() is a legacy composition entry point that
// already applies catalog-corrections-batch2 internally. Do NOT apply Batch 2 a
// second time here: its additive release corrections are intentionally not a
// separate pass through this module.
const BATCH2_PRODUCTS = applyCatalogReleaseCorrections(BASE_PRODUCTS)
const BATCH3_PRODUCTS = applyCatalogCorrectionsBatch3(BATCH2_PRODUCTS)
export const PRODUCTS: Product[] = applyCatalogCorrectionsBatch4(BATCH3_PRODUCTS)

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

export function findByCode(query: string): { product: Product; release?: ProductRelease } | undefined {
  const q = query.trim().toLowerCase()
  if (!q) return undefined

  // Scanner identity priority is deliberately global, not product-by-product:
  // 1) exact release item/JAN, 2) canonical product item, 3) legacy productCode.
  // A legacy productCode must never steal a real Tamiya release item number from
  // a different product (e.g. Avante Mk.II productCode 95110 vs Emperor release 95110).
  for (const product of PRODUCTS) {
    const releaseHit = product.releases.find(
      (r) => r.itemNumber?.toLowerCase() === q || r.barcodeJAN?.toLowerCase() === q,
    )
    if (releaseHit) return { product, release: releaseHit }
  }

  const productByItem = PRODUCTS.find((product) => product.itemNumber?.toLowerCase() === q)
  if (productByItem) return { product: productByItem }

  const productByLegacyCode = PRODUCTS.find((product) => product.productCode?.toLowerCase() === q)
  if (productByLegacyCode) return { product: productByLegacyCode }

  return undefined
}
