import type { Product } from "@/lib/types"
import { TAMIYA_IMAGES } from "../../scripts/data/tamiya-image-manifest"
import { stableUuid } from "./stable-id"

// Runtime/demo image projection from the SAME canonical manifest used to seed
// product_images/release_images in Supabase. This removes the old second source
// of truth where corrected-products carried hand-maintained `images` arrays that
// could drift away from the DB image manifest used by the real Catalog UI.
//
// Policy remains unchanged:
// - product-level manifest entry -> Product.images
// - release-level manifest entry -> only that exact ProductRelease.images
// - no release manifest entry -> [] (ProductImage will use Product fallback)
//
// Identity is derived only from immutable TrackDash seed keys, never item number.
export function applyCatalogImageManifest(products: Product[]): Product[] {
  const productImages = new Map<string, string>()
  const releaseImages = new Map<string, string>()

  for (const entry of TAMIYA_IMAGES) {
    const productId = stableUuid(`product:${entry.productSeedKey}`)

    if (entry.releaseSeedKey) {
      const releaseId = stableUuid(`release:${entry.productSeedKey}:${entry.releaseSeedKey}`)
      releaseImages.set(releaseId, entry.imageUrl)
    } else {
      productImages.set(productId, entry.imageUrl)
    }
  }

  return products.map((product) => ({
    ...product,
    images: productImages.has(product.id) ? [productImages.get(product.id)!] : [],
    releases: product.releases.map((release) => ({
      ...release,
      images: releaseImages.has(release.id) ? [releaseImages.get(release.id)!] : [],
    })),
  }))
}
