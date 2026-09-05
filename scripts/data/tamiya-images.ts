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
// IDENTITY (Catalog Model V2 hardening, point 9): entries are keyed by
// TrackDash's OWN immutable identifiers -- a product's `seedKey` and,
// for release-specific images, that release's `releaseSeedKey` -- NOT by
// Tamiya item number. Item numbers are correctable factual data (see
// lib/data/products.ts's file header) and must never determine which
// product/release an image attaches to, nor the image row's UUID. The
// Tamiya item number and source page are retained purely as
// human-readable metadata/verification in `note`/`sourcePageUrl`.
//
// Every entry here was individually verified during the catalog
// integrity audit by fetching the actual Tamiya product page and
// confirming the page's own title/description names the same model as
// the seedKey/releaseSeedKey it's attached to.
//
// Coverage is intentionally partial. Every model in this file was
// matched with high confidence; anything not confidently matchable was
// left out rather than guessed.

export interface TamiyaImageEntry {
  /** TrackDash product `seedKey` (immutable identity anchor). Resolves to the product UUID via stableUuid(`product:${productSeedKey}`). */
  productSeedKey: string
  /**
   * TrackDash release `releaseSeedKey` (immutable), set ONLY when this
   * image is for one specific release rather than the product in general.
   * Resolves to the release UUID via
   * stableUuid(`release:${productSeedKey}:${releaseSeedKey}`).
   */
  releaseSeedKey?: string
  /** The image URL. Required and non-empty; validated by scripts/check-images.mjs. */
  imageUrl: string
  /** Human-readable metadata only — NOT used for identity. The Tamiya item number this photo depicts. Optional (UNKNOWN > INVENTED). */
  tamiyaItemNumber?: string
  /** The page the image was found on / verified against. Recommended; the validator can require it (see REQUIRE_SOURCE_URL in scripts/check-images.mjs). */
  sourcePageUrl?: string
  /**
   * Where the image came from, as a controlled value. `official_manufacturer`
   * = the manufacturer's own site; `official_catalog` = an official PDF/print
   * catalog; `other` = anything else. Distinct from `sourceDomain` (a raw
   * host string). Optional — undefined when genuinely unknown.
   */
  sourceType?: "official_manufacturer" | "official_catalog" | "other"
  /** Raw source host (e.g. "tamiya.com"). Human-readable metadata. */
  sourceDomain?: string
  /**
   * Attribution / licensing metadata, when known. UNKNOWN > INVENTED: leave
   * every field undefined rather than guessing. Recording an official image
   * URL here for development/private-beta use does NOT by itself grant any
   * redistribution or public-hotlinking right — see docs/IMAGES_MVP.md.
   * This is a metadata slot, not a legal determination.
   */
  attribution?: {
    /** Rights holder / source name, when known (e.g. "Tamiya Inc."). */
    holder?: string
    /** A license identifier or short description, when actually known. Never invent one. */
    license?: string
    /** Free-text note about usage constraints, when known. */
    usageNote?: string
  }
  /** Free-text note (verification detail, why product- vs release-level, etc.). */
  note?: string
}

export const TAMIYA_IMAGES: TamiyaImageEntry[] = [
  {
    // Product-level (Dash-1 Emperor), deliberately NOT attached to the
    // 1990 original release specifically: the current tamiya.com/18025
    // page documents the item as sold TODAY (still Type 3 Chassis), which
    // isn't archival proof of the 1990 box's appearance. Storing it at
    // product level (product_images) rather than on the 1990 release row
    // avoids implying an evidentiary claim this pass can't support; the
    // resolver's product-view fallback still surfaces it for the generic
    // product page, and never as release-specific proof for the 1990 row
    // (see lib/images/resolve.ts).
    productSeedKey: "18025",
    imageUrl: "https://www.tamiya.com/japan_contents/img/usr/item/1/18025/18025_1.jpg",
    tamiyaItemNumber: "18025",
    sourcePageUrl: "https://www.tamiya.com/english/products/18025/index.html",
    sourceDomain: "tamiya.com",
    sourceType: "official_manufacturer",
    note:
      "Exact item-number and name match: 'Dash-1 Emperor (Type 3 Chassis)'. Stored as a product_images row (generic), NOT release_images -- see comment above for why.",
  },
  {
    // Release-level: specifically the Magnum Saber PREMIUM release (this
    // product's 2nd release, releaseSeedKey "2"), not a generic photo for
    // the product. Scoping it to that release means the ORIGINAL 1994
    // release (a visually different car) is correctly left on the
    // placeholder rather than shown with the Premium's photo.
    productSeedKey: "19401",
    releaseSeedKey: "2",
    imageUrl: "https://www.tamiya.com/japan_contents/img/usr/item/1/19431/19431_1.jpg",
    tamiyaItemNumber: "19431",
    sourcePageUrl: "https://www.tamiya.com/english/products/19431/index.html",
    sourceDomain: "tamiya.com",
    sourceType: "official_manufacturer",
    note:
      "Page title 'Magnum Saber Premium (Super-II Chassis)', Tamiya item 19431 -- matches this catalog's Magnum Saber Premium release. Scoped to that release only.",
  },
  {
    // Product-level (Aero Avante). seedKey 18626 is this product's frozen
    // identity anchor (unchanged since creation); its canonical item was
    // corrected to 18701 during the audit, which is the item this photo
    // depicts -- but the image attaches by seedKey, independent of that
    // correctable number.
    productSeedKey: "18626",
    imageUrl: "https://www.tamiya.com/japan_contents/img/usr/item/1/18701/18701_1.jpg",
    tamiyaItemNumber: "18701",
    sourcePageUrl: "https://www.tamiya.com/english/products/18701/index.html",
    sourceDomain: "tamiya.com",
    sourceType: "official_manufacturer",
    note: "Exact item-number and name match: 'Aero Avante (AR Chassis)', Tamiya item 18701.",
  },
]
