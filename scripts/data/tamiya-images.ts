// Tamiya official-source image mapping for the TrackDash catalog seed
// (lib/data/products.ts).
//
// MVP SCOPE (see docs/IMAGES_MVP.md for the full write-up): remote-hotlinks
// official Tamiya image URLs. The database stores only the URL — never a
// locally-hosted copy. Swapping these for our own hosted/licensed images
// later is a data change (edit this file, regenerate the seed migration),
// not a UI or schema change — see lib/images/resolve.ts and
// components/catalog/product-image.tsx, which don't know or care where a
// URL came from.
//
// EVERY entry here was individually verified by fetching the actual
// Tamiya product page and confirming the page's own title/description
// names the same model as the `productItem` (and, where set,
// `releaseItem`) it's attached to — never generated from a URL pattern
// applied blindly to an item number. Several of this catalog's seed item
// numbers do NOT match Tamiya's real numbering for that model (the seed's
// own header comment already says its item numbers are illustrative, not
// a complete real database) — e.g. this catalog's item "18626" for "Aero
// Avante" is actually a different real Tamiya product (Avante Mk.III
// Azure, a PRO-series kit); the real Aero Avante is Tamiya item 18701.
// Mappings below key on THIS catalog's natural identifiers (productItem/
// releaseItem, matching lib/data/products.ts's SEEDS), not on assuming
// those numbers resolve correctly against tamiya.com — each `sourcePageUrl`
// records exactly which real Tamiya page was actually used, specifically
// so a mismatch like the Aero Avante one is auditable rather than silently
// wrong.
//
// Coverage is intentionally partial. Every model in this file was matched
// with high confidence; anything not confidently matchable was left out
// rather than guessed — see the OUTPUT report for this step for the exact
// count and the full list of what was deliberately left unmatched.

export interface TamiyaImageEntry {
  /** Matches a SEEDS entry's `item` field in lib/data/products.ts. */
  productItem: string
  /**
   * Set only when this image is for one specific release rather than the
   * product in general — matches that release's own `item` field (its
   * ReleaseSeed.item, or the parent SEEDS entry's `item` when the release
   * doesn't override it).
   */
  releaseItem?: string
  /** Release year, for disambiguating when a product has multiple releases sharing one item number. */
  releaseYear?: number
  imageUrl: string
  sourcePageUrl: string
  sourceDomain: "tamiya.com"
  /** Real Tamiya item number the image/page actually uses, when it differs from productItem/releaseItem above. */
  verifiedAgainstItem?: string
  note?: string
}

export const TAMIYA_IMAGES: TamiyaImageEntry[] = [
  {
    productItem: "18025",
    releaseItem: "18025",
    releaseYear: 1990,
    imageUrl: "https://www.tamiya.com/japan_contents/img/usr/item/1/18025/18025_1.jpg",
    sourcePageUrl: "https://www.tamiya.com/english/products/18025/index.html",
    sourceDomain: "tamiya.com",
    note:
      "Exact item-number and name match: 'Dash-1 Emperor (Type 3 Chassis)'. Stored as a release_images row only (this is its original 1990 release) -- the generic product view still shows it via the resolver's product->releases fallback (lib/images/resolve.ts), not via a duplicate product_images row.",
  },
  {
    productItem: "19401",
    imageUrl: "https://www.tamiya.com/japan_contents/img/usr/item/1/19431/19431_1.jpg",
    sourcePageUrl: "https://www.tamiya.com/english/products/19431/index.html",
    sourceDomain: "tamiya.com",
    verifiedAgainstItem: "19431",
    note:
      "Product-level only (not a specific release): page title is 'Magnum Saber Premium (Super-II Chassis)', Tamiya item 19431, the Premium reissue -- not this catalog's item 19401. Confirmed by name/description, not by item number.",
  },
  {
    productItem: "18626",
    imageUrl: "https://www.tamiya.com/japan_contents/img/usr/item/1/18701/18701_1.jpg",
    sourcePageUrl: "https://www.tamiya.com/english/products/18701/index.html",
    sourceDomain: "tamiya.com",
    verifiedAgainstItem: "18701",
    note:
      "Product-level only. This catalog's item 18626 for 'Aero Avante' does not match Tamiya's real numbering for that model (18626 is actually 'Avante Mk.III Azure', a different kit) -- confirmed the real 'Aero Avante' by name/description instead, Tamiya item 18701.",
  },
]
