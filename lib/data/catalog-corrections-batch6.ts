import type { Product, ProductRelease } from "@/lib/types"

// Final Catalog Foundation guardrail cleanup.
// These releases already carry evidence-backed factual productionStatus values
// from earlier audit batches. Catalog Model V2 requires the date on which that
// status claim was checked as well. This batch adds only that missing metadata;
// no identity, genealogy, item number or release fact is changed here.
const STATUS_CHECKED_AT = "2026-09-07"

const RELEASE_PATCHES: Readonly<Record<string, Partial<ProductRelease>>> = {
  // Avante Jr. family.
  "cafbb6ca-1aba-5732-946d-0045d054aa5c": { statusCheckedAt: STATUS_CHECKED_AT },
  "7f3f7461-0dee-5d6a-b99d-36e2d910f0ef": { statusCheckedAt: STATUS_CHECKED_AT },
  "df8815eb-fd68-54ba-a908-e4fecbe9b5cf": { statusCheckedAt: STATUS_CHECKED_AT },
  "c680423c-a5eb-564c-afa6-953a105e9310": { statusCheckedAt: STATUS_CHECKED_AT },
  "91bcff13-76b4-5a09-a83b-1cfb85400b40": { statusCheckedAt: STATUS_CHECKED_AT },

  // Aero Thunder Shot factual discontinued statuses.
  "8c08137b-cfc6-5c1d-8d1b-a151d53afc01": { statusCheckedAt: STATUS_CHECKED_AT },
  "d0e6d2fc-3566-5004-a479-52f89253863b": { statusCheckedAt: STATUS_CHECKED_AT },
  "e96a1769-9b91-55b8-84c4-697799d0b441": { statusCheckedAt: STATUS_CHECKED_AT },
}

export function applyCatalogCorrectionsBatch6(products: Product[]): Product[] {
  return products.map((product) => {
    let changed = false
    const releases = product.releases.map((release) => {
      const patch = RELEASE_PATCHES[release.id]
      if (!patch) return release
      changed = true
      return { ...release, ...patch }
    })
    return changed ? { ...product, releases } : product
  })
}
