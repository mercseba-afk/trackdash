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
const ORIGINAL_ID = "cafbb6ca-1aba-5732-946d-0045d054aa5c"
const BLACK_2012_ID = "7f3f7461-0dee-5d6a-b99d-36e2d910f0ef"
const ANNIVERSARY_ID = "df8815eb-fd68-54ba-a908-e4fecbe9b5cf"
const REISSUE_2024_ID = "c680423c-a5eb-564c-afa6-953a105e9310"
const BLACK_2024_ID = "91bcff13-76b4-5a09-a83b-1cfb85400b40"

const additions: ProductRelease[] = [
  {
    id: ANNIVERSARY_ID,
    productId: PRODUCT_ID,
    itemNumber: "95474",
    releaseType: "Anniversary",
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
    sources: [
      source(
        "aa99f698-43b2-573a-b22e-05be5fdf7078",
        ANNIVERSARY_ID,
        "https://www.tamiya.com/japan/products/95474/index.html",
        ["itemNumber", "chassis", "releaseYear", "releaseDate", "editionName", "color"],
      ),
    ],
  },
  {
    id: REISSUE_2024_ID,
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
    sources: [
      source(
        "36eb755d-d890-5b3f-96c9-9c4c37e1f1c8",
        REISSUE_2024_ID,
        "https://www.tamiya.com/japan/products/18014/index.html",
        ["itemNumber", "chassis", "releaseYear", "releaseDate", "editionName", "color"],
      ),
    ],
  },
  {
    id: BLACK_2024_ID,
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
    sources: [
      source(
        "fac26b0c-79cb-5a7b-9a16-28ad106c36ab",
        BLACK_2024_ID,
        "https://www.tamiya.com/japan/products/95501/index.html",
        ["itemNumber", "chassis", "releaseYear", "releaseDate", "editionName", "color"],
      ),
    ],
  },
]

export function applyCatalogCorrectionsBatch4(products: Product[]): Product[] {
  return products.map((product) => {
    if (product.id !== PRODUCT_ID) return product

    const releases = product.releases.map((release) => {
      if (release.id === ORIGINAL_ID) {
        return {
          ...release,
          itemNumber: "18014",
          releaseType: "Original",
          editionType: "original" as const,
          editionName: "Avante Jr.",
          releaseYear: 1988,
          releaseDate: undefined,
          chassis: "Type 2",
          color: "Blue",
          images: [],
          discontinued: true,
          isOriginal: true,
          rarity: "Very Rare" as const,
          verificationStatus: "verified" as const,
          productionStatus: "discontinued" as const,
          notes: "Original Avante Jr. occurrence. Tamiya confirms item 18014, Type 2 chassis and first release in December 1988; no exact day or archival exact image is inferred.",
          sources: [
            source(
              "671f1490-fe87-5e8d-8ed9-1b5bcbce24ab",
              ORIGINAL_ID,
              "https://www.tamiya.com/japan/products/18014/index.html",
              ["itemNumber", "chassis", "releaseYear", "editionName", "color"],
              "Current page is the 2024 reissue but explicitly documents the original first-release month (December 1988).",
            ),
          ],
        }
      }

      if (release.id === BLACK_2012_ID) {
        return {
          ...release,
          itemNumber: "18506",
          releaseType: "Color Special",
          editionType: "color_special" as const,
          editionName: "Avante Jr. Black Special (2012 Reissue)",
          releaseYear: 2012,
          releaseDate: "2012-06-16",
          chassis: "Type 2",
          color: "Smoke / Black",
          images: [img("18506")],
          discontinued: true,
          isOriginal: false,
          rarity: "Rare" as const,
          verificationStatus: "verified" as const,
          productionStatus: "discontinued" as const,
          notes: "The legacy invented 'Avante (Premium)' slot is reused without changing its UUID for the real, officially documented 2012 Avante Jr. Black Special reissue. Tamiya notes the Black Special was first released in September 1989.",
          sources: [
            source(
              "6abc8050-1dcd-5369-969b-a814bbd916e5",
              BLACK_2012_ID,
              "https://www.tamiya.com/japan/products/18506/index.html",
              ["itemNumber", "chassis", "releaseYear", "releaseDate", "editionName", "color"],
            ),
          ],
        }
      }

      return release
    })

    releases.push(...additions)

    return {
      ...product,
      name: "Avante Jr.",
      series: "Racing Mini 4WD",
      rarity: "Uncommon",
      description: "The landmark Mini 4WD adaptation of Tamiya's RC Avante, first released in December 1988 on the Type 2 chassis.",
      images: [img("18014")],
      releases,
      itemNumber: "18014",
      chassis: "Type 2",
      originalReleaseYear: 1988,
      hasMultipleReleases: true,
    }
  })
}
