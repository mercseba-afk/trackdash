import type { Product, ProductRelease, ReleaseSource } from "@/lib/types"

const img = (item: string) =>
  `https://www.tamiya.com/japan_contents/img/usr/item/${item.startsWith("9") ? "9" : "1"}/${item}/${item}_1.jpg`

const source = (
  id: string,
  releaseId: string,
  sourceUrl: string,
  verifiedFields: string[],
  notes?: string,
): ReleaseSource => ({
  id,
  releaseId,
  sourceType: "official_manufacturer",
  sourceUrl,
  verifiedFields,
  checkedAt: "2026-09-07",
  notes,
})

const PRODUCT_ID = "82b478fd-21dd-5c93-82fb-bf50461a107d"

export function applyCatalogCorrectionsBatch5(products: Product[]): Product[] {
  return products.map((product) => {
    if (product.id !== PRODUCT_ID) return product

    const patches: Record<string, Partial<ProductRelease>> = {
      "cafbb6ca-1aba-5732-946d-0045d054aa5c": {
        itemNumber: "18014",
        releaseType: "Original",
        editionType: "original",
        editionName: "Avante Jr.",
        releaseYear: 1988,
        releaseDate: undefined,
        chassis: "Type 2",
        color: "Blue",
        images: [],
        discontinued: true,
        isOriginal: true,
        rarity: "Very Rare",
        verificationStatus: "verified",
        productionStatus: "discontinued",
        notes: "Original Avante Jr. occurrence. Tamiya confirms item 18014, Type 2 chassis and first release in December 1988; no exact day or archival exact image is inferred.",
        sources: [source("671f1490-fe87-5e8d-8ed9-1b5bcbce24ab", "cafbb6ca-1aba-5732-946d-0045d054aa5c", "https://www.tamiya.com/japan/products/18014/index.html", ["itemNumber", "chassis", "releaseYear", "editionName", "color"], "Current page is the 2024 reissue but explicitly documents the original first-release month (December 1988).")],
      },
      "7f3f7461-0dee-5d6a-b99d-36e2d910f0ef": {
        itemNumber: "18506",
        releaseType: "Color Special",
        editionType: "color_special",
        editionName: "Avante Jr. Black Special (2012 Reissue)",
        releaseYear: 2012,
        releaseDate: "2012-06-16",
        chassis: "Type 2",
        color: "Smoke / Black",
        images: [img("18506")],
        discontinued: true,
        isOriginal: false,
        rarity: "Rare",
        verificationStatus: "verified",
        productionStatus: "discontinued",
        notes: "The legacy invented Avante (Premium) slot is reused without changing its UUID for the real, officially documented 2012 Avante Jr. Black Special reissue. Tamiya notes the Black Special was first released in September 1989.",
        sources: [source("6abc8050-1dcd-5369-969b-a814bbd916e5", "7f3f7461-0dee-5d6a-b99d-36e2d910f0ef", "https://www.tamiya.com/japan/products/18506/index.html", ["itemNumber", "chassis", "releaseYear", "releaseDate", "editionName", "color"])],
      },
    }

    const releases = product.releases.map((release) => {
      const patch = patches[release.id]
      return patch ? { ...release, ...patch } : release
    })

    const additions: ProductRelease[] = [
      {
        id: "df8815eb-fd68-54ba-a908-e4fecbe9b5cf",
        productId: PRODUCT_ID,
        itemNumber: "95474",
        releaseType: "Anniversary Edition",
        editionType: "anniversary",
        editionName: "Avante Jr. 30th Anniversary Special",
        releaseYear: 2018,
        releaseDate: "2018-12-22",
        chassis: "Type 2",
        color: "Blue / Blue Plated",
        images: [img("95474")],
        discontinued: true,
        isOriginal: false,
        rarity: "Rare",
        verificationStatus: "verified",
        productionStatus: "discontinued",
        notes: "Official 30th Anniversary revival with both original blue and blue-plated bodies and commemorative stickers.",
        sources: [source("aa99f698-43b2-573a-b22e-05be5fdf7078", "df8815eb-fd68-54ba-a908-e4fecbe9b5cf", "https://www.tamiya.com/japan/products/95474/index.html", ["itemNumber", "chassis", "releaseYear", "releaseDate", "editionName", "color"])],
      },
      {
        id: "c680423c-a5eb-564c-afa6-953a105e9310",
        productId: PRODUCT_ID,
        itemNumber: "18014",
        releaseType: "Reissue",
        editionType: "reissue",
        editionName: "Avante Jr. (2024 Reissue)",
        releaseYear: 2024,
        releaseDate: "2024-09-07",
        chassis: "Type 2",
        color: "Blue",
        images: [img("18014")],
        discontinued: false,
        isOriginal: false,
        rarity: "Common",
        verificationStatus: "verified",
        productionStatus: "active",
        notes: "Current Tamiya reissue of item 18014. Tamiya explicitly states the first release month was December 1988.",
        sources: [source("36eb755d-d890-5b3f-96c9-9c4c37e1f1c8", "c680423c-a5eb-564c-afa6-953a105e9310", "https://www.tamiya.com/japan/products/18014/index.html", ["itemNumber", "chassis", "releaseYear", "releaseDate", "editionName", "color"])],
      },
      {
        id: "91bcff13-76b4-5a09-a83b-1cfb85400b40",
        productId: PRODUCT_ID,
        itemNumber: "95501",
        releaseType: "Color Special",
        editionType: "color_special",
        editionName: "Avante Jr. Black Special (2024 Reissue)",
        releaseYear: 2024,
        releaseDate: "2024-09-07",
        chassis: "Type 2",
        color: "Smoke / Black",
        images: [],
        discontinued: false,
        isOriginal: false,
        rarity: "Uncommon",
        verificationStatus: "verified",
        productionStatus: "active",
        notes: "Official 2024 Black Special reissue. The obvious legacy item-scoped static image paths currently return 404 through TrackDash, so this occurrence deliberately uses Product fallback until an official exact asset is demonstrated.",
        sources: [source("fac26b0c-79cb-5a7b-9a16-28ad106c36ab", "91bcff13-76b4-5a09-a83b-1cfb85400b40", "https://www.tamiya.com/japan/products/95501/index.html", ["itemNumber", "chassis", "releaseYear", "releaseDate", "editionName", "color"])],
      },
    ]

    for (const added of additions) {
      if (!releases.some((release) => release.id === added.id)) releases.push(added)
    }

    const canonicalReleaseId = "cafbb6ca-1aba-5732-946d-0045d054aa5c"
    const canonical = releases.find((release) => release.id === canonicalReleaseId)

    return {
      ...product,
      name: "Avante Jr.",
      series: "Avante",
      description: "The original Avante Jr. Mini 4WD family, introduced in 1988 on the Type 2 chassis and later revived through Black Special, anniversary and modern reissue editions.",
      images: [img("18014")],
      releases,
      canonicalReleaseId,
      itemNumber: canonical?.itemNumber,
      chassis: canonical?.chassis,
      originalReleaseYear: canonical?.releaseYear,
      hasMultipleReleases: true,
    }
  })
}
