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
 *   1. This release's own exact image (release_images)
 *   2. null — caller should show the placeholder
 *
 * A specific Release must NEVER silently inherit a Product-level or sibling
 * image. Variants can differ in body colour, plated parts, wheels, stickers
 * and even chassis. Showing a representative family image as though it were
 * exact is more misleading than an explicit placeholder.
 */
export function resolveReleaseImageUrl(release: ProductRelease | null | undefined, product: Product | null | undefined): string | null {
  const releaseImage = firstImage(release?.images)
  if (releaseImage) return releaseImage

  return null
}

/**
 * Resolves the image for a PRODUCT in general (no specific release
 * selected — e.g. a catalog grid card). Priority:
 *   1. The product's own image (product_images)
 *   2. The oldest release (by year, then date) that has an image
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

  let oldestReleaseImage: { image: string; year: number; date: string; index: number } | null = null

  for (const [index, release] of (product?.releases ?? []).entries()) {
    const image = firstImage(release.images)
    if (!image) continue

    const year = release.releaseYear ?? Number.POSITIVE_INFINITY
    const date = release.releaseDate ?? "9999-12-31"

    if (
      !oldestReleaseImage ||
      year < oldestReleaseImage.year ||
      (year === oldestReleaseImage.year && date < oldestReleaseImage.date) ||
      (year === oldestReleaseImage.year && date === oldestReleaseImage.date && index < oldestReleaseImage.index)
    ) {
      oldestReleaseImage = { image, year, date, index }
    }
  }

  return oldestReleaseImage?.image ?? null
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
