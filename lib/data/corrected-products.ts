import type { Product, ProductRelease } from "@/lib/types"
import {
  PRODUCTS as BASE_PRODUCTS,
  getRelatedProducts,
} from "./products"
import { applyCatalogReleaseCorrections } from "./catalog-release-corrections"

// Runtime/demo compatibility view of the historical seed catalog after applying
// evidence-backed factual corrections. The production catalog itself is DB-backed;
// this module exists for client-side demo utilities such as Scanner and for any
// helper that still needs the local seed representation.
export const PRODUCTS: Product[] = applyCatalogReleaseCorrections(BASE_PRODUCTS)

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
  for (const product of PRODUCTS) {
    const releaseHit = product.releases.find(
      (r) => r.itemNumber?.toLowerCase() === q || r.barcodeJAN?.toLowerCase() === q,
    )
    if (releaseHit) return { product, release: releaseHit }
    if (product.productCode?.toLowerCase() === q || product.itemNumber?.toLowerCase() === q) {
      return { product }
    }
  }
  return undefined
}
