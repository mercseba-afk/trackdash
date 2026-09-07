import type { Product, ProductRelease } from "@/lib/types"

// Audited post-seed factual corrections for legacy release rows whose immutable
// TrackDash identity (UUID) is valid but whose old Tamiya metadata was not.
//
// IMPORTANT:
// - Keys are existing immutable ProductRelease UUIDs. Never replace/re-key them
//   when a factual item number changes.
// - These corrections are evidence-backed, not guesses. UNKNOWN > INVENTED.
// - The live database receives the same corrections through the matching
//   Supabase migration. This layer keeps demo/scanner utilities and future seed
//   generation from reintroducing the superseded legacy metadata.
// - Exact image URLs below are official Tamiya assets attributable to the exact
//   corrected release represented by the row.

type ReleaseCorrection = Partial<Omit<ProductRelease, "id" | "productId">>

export const CATALOG_RELEASE_CORRECTIONS: Readonly<Record<string, ReleaseCorrection>> = {
  // Immutable identity: productSeedKey 18025 / releaseSeedKey 3.
  // The legacy row called this a 2015 Super-II "Premium Black Special" and
  // attached item 95359. The official Tamiya 95296 page instead documents
  // Dash-1 Emperor (MS Chassis) Black Special. We intentionally model the
  // documented 2023 reissue here because the current official image/page is
  // attributable to that occurrence; the same page states the initial release
  // only as February 2017, without a day. Do not invent a 2017 exact date/image.
  "96babc1a-f153-59fa-b840-7ff68fb50f38": {
    itemNumber: "95296",
    editionName: "Dash-1 Emperor (MS Chassis) Black Special",
    releaseYear: 2023,
    releaseDate: "2023-05-27",
    chassis: "MS",
    color: "Black",
    verificationStatus: "verified",
    images: ["https://www.tamiya.com/japan_contents/img/usr/item/9/95296/95296_1.jpg"],
    notes: "Documented 2023 reissue of item 95296. Official Tamiya page states the initial release was February 2017; no exact 2017 day is inferred.",
    sources: [
      {
        id: "1e30636b-cf6b-575e-8148-774724e32b40",
        releaseId: "96babc1a-f153-59fa-b840-7ff68fb50f38",
        sourceType: "official_manufacturer",
        sourceUrl: "https://www.tamiya.com/japan/products/95296/index.html",
        verifiedFields: ["itemNumber", "chassis", "releaseDate", "releaseYear", "editionName", "color"],
        checkedAt: "2026-09-07",
        notes: "Official page documents the 2023-05-27 reissue and states initial release month February 2017.",
      },
    ],
  },

  // Immutable identity: productSeedKey 18025 / releaseSeedKey 4.
  "b7eeb76a-e117-59ae-b31c-b099368421af": {
    itemNumber: "95110",
    editionName: "Dash-1 Emperor Memorial (MS Chassis) 30 Years of the Japan Cup",
    releaseYear: 2018,
    releaseDate: "2018-06-23",
    chassis: "MS",
    color: "Silver",
    verificationStatus: "verified",
    images: ["https://www.tamiya.com/japan_contents/img/usr/item/9/95110/95110_1.jpg"],
    notes: "Official Tamiya memorial edition celebrating 30 years of the Japan Cup.",
    sources: [
      {
        id: "c5d7f890-392a-5891-bafe-78a6360928aa",
        releaseId: "b7eeb76a-e117-59ae-b31c-b099368421af",
        sourceType: "official_manufacturer",
        sourceUrl: "https://www.tamiya.com/japan/products/95110/index.html",
        verifiedFields: ["itemNumber", "chassis", "releaseDate", "releaseYear", "editionName", "color"],
        checkedAt: "2026-09-07",
      },
    ],
  },

  // Immutable identity: productSeedKey 18626 / releaseSeedKey 3.
  "21b0cb0d-bb39-51ff-a5e6-df45c3245372": {
    itemNumber: "95376",
    editionName: "Aero Avante Black Special (AR Chassis)",
    releaseYear: 2018,
    releaseDate: "2018-02-10",
    chassis: "AR",
    color: "Black",
    verificationStatus: "verified",
    images: ["https://www.tamiya.com/japan_contents/img/usr/item/9/95376/95376_1.jpg"],
    notes: "Official Tamiya Aero Avante Black Special release on the AR chassis.",
    sources: [
      {
        id: "c95f2df0-78a6-5ae5-927f-11df2da8776c",
        releaseId: "21b0cb0d-bb39-51ff-a5e6-df45c3245372",
        sourceType: "official_manufacturer",
        sourceUrl: "https://www.tamiya.com/japan/products/95376/index.html",
        verifiedFields: ["itemNumber", "chassis", "releaseDate", "releaseYear", "editionName", "color"],
        checkedAt: "2026-09-07",
      },
    ],
  },
}

export function applyCatalogReleaseCorrections(products: Product[]): Product[] {
  return products.map((product) => {
    let changed = false
    const releases = product.releases.map((release) => {
      const correction = CATALOG_RELEASE_CORRECTIONS[release.id]
      if (!correction) return release
      changed = true
      return { ...release, ...correction }
    })
    return changed ? { ...product, releases } : product
  })
}
