import type { Product, ProductRelease } from "@/lib/types"

// Independent-review cleanup after Catalog Foundation v1.
// This batch intentionally changes no TrackDash identity. It only:
// - makes the 2023 Dash-1 Emperor Black Special occurrence explicit in its label;
// - completes the 2026 item 18025 provenance with fields documented by Tamiya's
//   current official product page and records the exact 2026-08-29 sale date.
const EMPEROR_BLACK_2023 = "96babc1a-f153-59fa-b840-7ff68fb50f38"
const EMPEROR_2026 = "79e32904-fe5d-5d30-bf54-8643ce4b42d3"

const VERIFIED_2026_FIELDS = [
  "itemNumber",
  "chassis",
  "releaseDate",
  "releaseYear",
  "editionName",
]

export function applyCatalogCorrectionsBatch7(products: Product[]): Product[] {
  return products.map((product) => {
    let changed = false

    const releases = product.releases.map((release): ProductRelease => {
      if (release.id === EMPEROR_BLACK_2023) {
        changed = true
        return {
          ...release,
          editionName: "Dash-1 Emperor (MS Chassis) Black Special (2023 Reissue)",
        }
      }

      if (release.id === EMPEROR_2026) {
        changed = true
        return {
          ...release,
          releaseDate: "2026-08-29",
          verificationStatus: "verified",
          notes:
            "Official Tamiya 2026 reissue of item 18025 on the Type 3 chassis, released around 2026-08-29. The same page states the original item 18025 occurrence was first released in January 1990.",
          sources: release.sources.map((source) =>
            source.sourceUrl?.includes("/products/18025/")
              ? {
                  ...source,
                  verifiedFields: VERIFIED_2026_FIELDS,
                  checkedAt: "2026-09-07",
                  notes:
                    "Official Tamiya page explicitly identifies ITEM 18025, Dash-1 Emperor (Type 3 Chassis), and the 2026-08-29 sale date; it also records the initial 18025 release month as January 1990.",
                }
              : source,
          ),
        }
      }

      return release
    })

    return changed ? { ...product, releases } : product
  })
}
