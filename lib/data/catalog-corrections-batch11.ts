import type { Product, ProductRelease, ReleaseSource } from "@/lib/types"

const GREAT_EMPEROR_PRODUCT_ID = "203f8219-9d37-5a1a-aad6-9437c80a1ea8"
const GREAT_EMPEROR_18036_ID = "8c2ca80b-8a9d-5b7a-9325-aec13a0db9ba"

const source18036TamiyaProduct: ReleaseSource = {
  id: "117c876f-49fb-5b3c-8203-f7052ce1505a",
  releaseId: GREAT_EMPEROR_18036_ID,
  sourceType: "official_manufacturer",
  sourceUrl: "https://www.tamiya.com/japan/products/18036/index.html",
  verifiedFields: ["itemNumber", "editionName", "chassis"],
  checkedAt: "2026-09-15",
  notes: "Tamiya Japan identifies ITEM 18036 Dash-001 Great Emperor and explicitly specifies the Zero chassis.",
}

const source18036TamiyaReleaseMonth: ReleaseSource = {
  id: "7c6761b4-9ceb-5c70-8657-3c917f2133ff",
  releaseId: GREAT_EMPEROR_18036_ID,
  sourceType: "official_manufacturer",
  sourceUrl: "https://tamiya.com/japan/newitems_month/list.html?catalog_open_month=201804&current=199109&genre_item=&sortkey=",
  verifiedFields: ["releaseYear"],
  checkedAt: "2026-09-15",
  notes: "Tamiya's official release-month archive lists ITEM 18036 among the September 1991 new products. No exact calendar day is inferred.",
}

function addSource(sources: ReleaseSource[], source: ReleaseSource): ReleaseSource[] {
  return sources.some((item) => item.id === source.id || item.sourceUrl === source.sourceUrl)
    ? sources
    : [...sources, source]
}

export function applyCatalogCorrectionsBatch11(products: Product[]): Product[] {
  return products.map((product) => {
    if (product.id !== GREAT_EMPEROR_PRODUCT_ID) return product

    let changed = false
    const releases = product.releases.map((release): ProductRelease => {
      if (release.id !== GREAT_EMPEROR_18036_ID) return release
      changed = true

      return {
        ...release,
        itemNumber: "18036",
        editionName: "Great Emperor",
        releaseYear: 1991,
        releaseDate: undefined,
        chassis: "Zero",
        verificationStatus: "verified",
        notes: "Original ITEM 18036 Dash-001 Great Emperor. Tamiya's product page specifies the Zero chassis; its official release-month archive places the release in September 1991. Exact day remains unclaimed.",
        sources: addSource(addSource(release.sources, source18036TamiyaProduct), source18036TamiyaReleaseMonth),
      }
    })

    if (!changed) return product

    return {
      ...product,
      chassis: "Zero",
      originalReleaseYear: 1991,
      releases,
    }
  })
}
