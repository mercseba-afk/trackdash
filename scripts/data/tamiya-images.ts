// Tamiya official-source image mapping for the TrackDash catalog seed
// (lib/data/products.ts).
//
// MVP SCOPE (see docs/IMAGES_MVP.md): remote-hotlinks official Tamiya
// image URLs. The database stores only the URL — never a locally-hosted
// copy. Swapping these for our own hosted/licensed images later is a
// data change (edit this file, regenerate the seed migration), not a UI
// or schema change — see lib/images/resolve.ts and
// components/catalog/product-image.tsx, which don't know or care where a
// URL came from.
//
// EVERY entry here was individually verified by fetching the actual
// Tamiya product page and confirming the page's own title/description
// names the same model as the `productItem` (and, where set,
// `releaseItem`) it's attached to — never generated from a URL pattern
// applied blindly to an item number.
//
// UPDATED after the catalog integrity pass (docs/CATALOG_AUDIT.md):
// mappings below key on this catalog's CURRENT, corrected item numbers.
// The Aero Avante entry no longer needs the "our fake item number happens
// to point at a real photo of a different real item" workaround its
// first version required — the catalog itself now uses the real Tamiya
// item (18701) that the photo actually depicts.
//
// Coverage is intentionally partial. Every model in this file was matched
// with high confidence; anything not confidently matchable was left out
// rather than guessed.

export interface TamiyaImageEntry {
  /** Matches a product's CURRENT (post-correction) item number in lib/data/products.ts. */
  productItem: string
  /**
   * Set only when this image is for one specific release rather than the
   * product in general — matches that release's own (post-correction)
   * item field.
   */
  releaseItem?: string
  /** Release year, for disambiguating when a product has multiple releases sharing one item number. */
  releaseYear?: number
  imageUrl: string
  sourcePageUrl: string
  sourceDomain: "tamiya.com"
  note?: string
}

export const TAMIYA_IMAGES: TamiyaImageEntry[] = [
  {
    // Product-level, deliberately NOT attached to the 1990 original
    // release specifically: the current tamiya.com/18025 page (and its
    // photo) documents the item as it's sold TODAY, which this pass
    // confirmed is still "Type 3 Chassis" (see docs/CATALOG_AUDIT.md) --
    // but that's not the same as archival proof of the 1990 box's actual
    // appearance/packaging. Attaching it generically (product_images)
    // rather than to release_images for the specific 1990 row avoids
    // implying an evidentiary claim this pass can't support. The
    // resolver's product-view fallback still surfaces it for the generic
    // product page; it will NOT be used for the 1990 release specifically
    // (see lib/images/resolve.ts -- release view never falls back to a
    // sibling/product image being mistaken for release-specific proof
    // beyond its own release_images row, and this is stored at
    // product_images, not attached to any one release row at all).
    productItem: "18025",
    imageUrl: "https://www.tamiya.com/japan_contents/img/usr/item/1/18025/18025_1.jpg",
    sourcePageUrl: "https://www.tamiya.com/english/products/18025/index.html",
    sourceDomain: "tamiya.com",
    note:
      "Exact item-number and name match: 'Dash-1 Emperor (Type 3 Chassis)'. Stored as a product_images row (generic), NOT release_images -- see comment above for why.",
  },
  {
    // Release-level: this is specifically the Premium (item 19431)
    // release's own photo, not a generic photo for the product. Keeping
    // it scoped to that release means the ORIGINAL 1994 release (item
    // 19401, Super-1 chassis, a visually different car) is correctly
    // left on the placeholder rather than shown as if it looked like the
    // Premium.
    productItem: "19401",
    releaseItem: "19431",
    releaseYear: 2012,
    imageUrl: "https://www.tamiya.com/japan_contents/img/usr/item/1/19431/19431_1.jpg",
    sourcePageUrl: "https://www.tamiya.com/english/products/19431/index.html",
    sourceDomain: "tamiya.com",
    note:
      "Page title 'Magnum Saber Premium (Super-II Chassis)', Tamiya item 19431 -- matches this catalog's Magnum Saber Premium release (corrected during the catalog integrity pass to also use item 19431). Scoped to that release only, not the generic product, so the visually different 1994 original isn't shown with the Premium's photo.",
  },
  {
    // Product-level: the catalog's Aero Avante now correctly uses item
    // 18701 (corrected during the catalog integrity pass), matching this
    // photo's real Tamiya item directly -- no more natural-key mismatch
    // to work around.
    productItem: "18701",
    imageUrl: "https://www.tamiya.com/japan_contents/img/usr/item/1/18701/18701_1.jpg",
    sourcePageUrl: "https://www.tamiya.com/english/products/18701/index.html",
    sourceDomain: "tamiya.com",
    note: "Exact item-number and name match: 'Aero Avante (AR Chassis)', Tamiya item 18701.",
  },
]
