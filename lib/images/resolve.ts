import type { Product, ProductRelease } from "@/lib/types"

// Single place that knows the image-resolution priority (see
// docs/IMAGES_MVP.md) for a catalog object — two DIFFERENT chains
// depending on whether a specific release is in view or not, see each
// function below for why they differ. Nothing else in the app should
// re-implement either chain — components/catalog/product-image.tsx is the
// only consumer, and it doesn't know or care whether a resolved URL came
// from a release row, a product row, or (product view only) a sibling
// release's row.
//
// Both functions return `null` (never an empty string) when there is
// genuinely no image anywhere in the chain — the UI component treats
// `null` as "use the placeholder", not as an error.

function firstImage(images: string[] | undefined): string | null {
  return images && images.length > 0 ? images[0] : null
}

/**
 * Resolves the image for a specific RELEASE. Priority:
 *   1. This release's own image (release_images)
 *   2. The parent product's generic image (product_images)
 *   3. null — caller should show the placeholder
 *
 * Deliberately does NOT fall back to a sibling release's image (see
 * resolveProductImageUrl for where that fallback belongs instead) — doing
 * so here would show a different edition's photo as though it were the
 * specifically selected release, which is misleading precisely because
 * releases of the same product can look genuinely different (see
 * docs/CATALOG_AUDIT.md's note on the Dash-1 Emperor 2026 reissue: its
 * current product page's photo is not evidence of what the original 1990
 * release looked like).
 */
export function resolveReleaseImageUrl(release: ProductRelease | null | undefined, product: Product | null | undefined): string | null {
  const releaseImage = firstImage(release?.images)
  if (releaseImage) return releaseImage

  const productImage = firstImage(product?.images)
  if (productImage) return productImage

  return null
}

/**
 * Resolves the image for a PRODUCT in general (no specific release
 * selected — e.g. a catalog grid card). Priority:
 *   1. The product's own image (product_images)
 *   2. Any release of the product that has an image
 *   3. null — caller should show the placeholder
 *
 * The sibling-release fallback (step 2) is intentionally only here, not
 * in resolveReleaseImageUrl — showing *some* representative photo for the
 * model in general is reasonable; showing it in place of a specifically
 * selected, different edition is not.
 */
export function resolveProductImageUrl(product: Product | null | undefined): string | null {
  const productImage = firstImage(product?.images)
  if (productImage) return productImage

  const anyReleaseImage = product?.releases?.map((r) => firstImage(r.images)).find((url): url is string => Boolean(url))
  if (anyReleaseImage) return anyReleaseImage

  return null
}

/**
 * Convenience single entry point: resolves using the release priority
 * when a release is given, otherwise the product priority. This is what
 * components/catalog/product-image.tsx actually calls — the two
 * functions above exist separately mainly so screens that already know
 * they don't have a release (or explicitly want product-only resolution)
 * can call the narrower one directly and make that intent obvious.
 */
export function resolveDisplayImageUrl(product: Product | null | undefined, release?: ProductRelease | null): string | null {
  return release ? resolveReleaseImageUrl(release, product) : resolveProductImageUrl(product)
}
