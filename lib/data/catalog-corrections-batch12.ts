import type { Product, ProductRelease, ReleaseSource } from "@/lib/types"

const checkedAt = "2026-09-15"

const img = (item: string) =>
  `https://www.tamiya.com/japan_contents/img/usr/item/1/${item}/${item}_1.jpg`

function source(
  id: string,
  releaseId: string,
  sourceType: ReleaseSource["sourceType"],
  sourceUrl: string,
  verifiedFields: string[],
  notes?: string,
): ReleaseSource {
  return { id, releaseId, sourceType, sourceUrl, verifiedFields, checkedAt, notes }
}

function originalRelease(input: {
  id: string
  productId: string
  item: string
  name: string
  year: number
  chassis?: ProductRelease["chassis"]
  sources: ReleaseSource[]
  notes: string
}): ProductRelease {
  return {
    id: input.id,
    productId: input.productId,
    itemNumber: input.item,
    releaseType: "Original",
    editionType: "original",
    editionName: input.name,
    releaseYear: input.year,
    // Official evidence currently establishes month/year for these historical
    // releases, not an exact calendar day. UNKNOWN > INVENTED: keep unset.
    releaseDate: undefined,
    chassis: input.chassis,
    images: [],
    notes: input.notes,
    discontinued: false,
    isOriginal: true,
    verificationStatus: "verified",
    // Presence on Tamiya's current website is identity/history evidence only;
    // it is not sufficient to claim this exact historical occurrence is still
    // actively produced. Marketplace availability belongs to Market Data.
    productionStatus: "unknown",
    sources: input.sources,
  }
}

const vintageP1Products: Product[] = [
  {
    id: "a0bed8eb-2899-50f8-8746-a8d08f7a52b7",
    category: "mini4wd",
    seedKey: "18023",
    itemNumber: "18023",
    name: "Dash-5 Dancing Doll",
    japaneseName: "ダッシュ5号D.D.(ダンシングドール)",
    series: "Dash! Yonkuro",
    chassis: "Type 3",
    originalReleaseYear: 1990,
    // Catalog fallback only; public Market Value/liquidity never derives from
    // this editorial rarity label. Revisit after the Vintage 100 distribution.
    rarity: "Uncommon",
    description: "Dash-5 D.D. (Dancing Doll), a Type 3 chassis machine from the Dash! Yonkuro-era Racing Mini 4WD lineup.",
    images: [img("18023")],
    canonicalReleaseId: "0febe9c7-2a10-5766-9b87-1342121d3e38",
    hasMultipleReleases: false,
    releases: [
      originalRelease({
        id: "0febe9c7-2a10-5766-9b87-1342121d3e38",
        productId: "a0bed8eb-2899-50f8-8746-a8d08f7a52b7",
        item: "18023",
        name: "Dash-5 Dancing Doll",
        year: 1990,
        chassis: "Type 3",
        notes: "Official Tamiya page states first release month March 1990. Exact day is not stated and is intentionally left unset.",
        sources: [
          source(
            "63b933c3-4052-50ef-b3bd-c4211f430d78",
            "0febe9c7-2a10-5766-9b87-1342121d3e38",
            "official_manufacturer",
            "https://www.tamiya.com/japan/products/18023/index.html",
            ["itemNumber", "editionName", "chassis", "releaseYear"],
            "Tamiya identifies ITEM 18023 Dash-5 D.D. (Dancing Doll), Type 3 chassis, first released March 1990.",
          ),
        ],
      }),
    ],
  },
  {
    id: "033769c0-a8d7-554a-8e3d-b4049d505241",
    category: "mini4wd",
    seedKey: "18028",
    itemNumber: "18028",
    name: "Dash-01 Super Emperor",
    japaneseName: "ダッシュ01号・超皇帝（スーパーエンペラー）",
    series: "Dash! Yonkuro",
    chassis: "Type 3",
    originalReleaseYear: 1990,
    rarity: "Uncommon",
    description: "Dash-01 Super Emperor, the curved-body successor in the Emperor lineage, released on the Type 3 chassis.",
    images: [img("18028")],
    canonicalReleaseId: "c8bdd30e-625d-511e-b92c-d132044b16b4",
    hasMultipleReleases: false,
    releases: [
      originalRelease({
        id: "c8bdd30e-625d-511e-b92c-d132044b16b4",
        productId: "033769c0-a8d7-554a-8e3d-b4049d505241",
        item: "18028",
        name: "Dash-01 Super Emperor",
        year: 1990,
        chassis: "Type 3",
        notes: "Official Tamiya page states first release month June 1990. Exact day is not stated and is intentionally left unset.",
        sources: [
          source(
            "1e03aaec-b39c-5d80-bd66-403a0fb3a476",
            "c8bdd30e-625d-511e-b92c-d132044b16b4",
            "official_manufacturer",
            "https://www.tamiya.com/japan/products/18028/index.html",
            ["itemNumber", "editionName", "chassis", "releaseYear"],
            "Tamiya identifies ITEM 18028 Dash-01 Super Emperor, Type 3 chassis, first released June 1990.",
          ),
        ],
      }),
    ],
  },
  {
    id: "652fd9b9-5fea-5067-9432-3c09b24d5bfc",
    category: "mini4wd",
    seedKey: "18031",
    itemNumber: "18031",
    name: "Avante 2001 Jr.",
    japaneseName: "アバンテ2001 Jr.",
    series: "Avante",
    chassis: "Zero",
    originalReleaseYear: 1990,
    rarity: "Uncommon",
    description: "Mini 4WD adaptation of the Avante 2001 RC design, using Tamiya's Zero chassis.",
    images: [img("18031")],
    canonicalReleaseId: "d7d593b9-9451-5b68-b845-14aaecac4988",
    hasMultipleReleases: false,
    releases: [
      originalRelease({
        id: "d7d593b9-9451-5b68-b845-14aaecac4988",
        productId: "652fd9b9-5fea-5067-9432-3c09b24d5bfc",
        item: "18031",
        name: "Avante 2001 Jr.",
        year: 1990,
        chassis: "Zero",
        notes: "Official Tamiya identity confirms ITEM 18031 / Zero chassis. Tamiya's release-month archive places the release in November 1990; exact day is intentionally left unset.",
        sources: [
          source(
            "31448148-f28c-51a2-acc4-9bb30a0a807b",
            "d7d593b9-9451-5b68-b845-14aaecac4988",
            "official_manufacturer",
            "https://www.tamiya.com/japan/products/18031/index.html",
            ["itemNumber", "editionName", "chassis"],
          ),
          source(
            "25760664-c5eb-5064-849b-11a20321255d",
            "d7d593b9-9451-5b68-b845-14aaecac4988",
            "official_archive",
            "https://www.tamiya.com/japan/newitems_month/list.html?current=199011",
            ["releaseYear"],
            "Tamiya official release-month archive places ITEM 18031 in November 1990. No exact day inferred.",
          ),
        ],
      }),
    ],
  },
  {
    id: "fb1e4d46-96e6-52e9-9017-baa3799ae060",
    category: "mini4wd",
    seedKey: "18032",
    itemNumber: "18032",
    name: "Crimson Glory",
    japaneseName: "クリムゾングローリー",
    series: "Racing Mini 4WD",
    chassis: "FM",
    originalReleaseYear: 1990,
    rarity: "Uncommon",
    description: "A front-motor vintage Racing Mini 4WD release from late 1990 on Tamiya's historical FM chassis, distinct from the much later FM-A platform.",
    images: [img("18032")],
    canonicalReleaseId: "5132b078-5f0d-55bd-9673-d73efb7a601c",
    hasMultipleReleases: false,
    releases: [
      originalRelease({
        id: "5132b078-5f0d-55bd-9673-d73efb7a601c",
        productId: "fb1e4d46-96e6-52e9-9017-baa3799ae060",
        item: "18032",
        name: "Crimson Glory",
        year: 1990,
        chassis: "FM",
        notes: "Tamiya identifies ITEM 18032 as an FM-chassis machine. Official release-month evidence places it in November 1990; exact day remains unset.",
        sources: [
          source(
            "d7712d90-af26-5a74-957d-5be39dab0b97",
            "5132b078-5f0d-55bd-9673-d73efb7a601c",
            "official_manufacturer",
            "https://www.tamiya.com/japan/products/18032/index.html",
            ["itemNumber", "editionName", "chassis"],
            "Official Tamiya product page identifies ITEM 18032 Crimson Glory on the historical FM chassis.",
          ),
          source(
            "1b0f9240-b769-54a9-9c3d-916e43f99a44",
            "5132b078-5f0d-55bd-9673-d73efb7a601c",
            "official_archive",
            "https://www.tamiya.com/japan/newitems_month/list.html?current=199011",
            ["releaseYear"],
            "Tamiya official release-month archive places ITEM 18032 in November 1990. No exact day inferred.",
          ),
        ],
      }),
    ],
  },
  {
    id: "2a6f40df-f87d-5184-82b7-578c4ee857fc",
    category: "mini4wd",
    seedKey: "18034",
    itemNumber: "18034",
    name: "Dash-02 Neo Burning Sun",
    japaneseName: "ダッシュ02号・新太陽（ネオ・バーニングサン）",
    series: "Dash! Yonkuro",
    chassis: "FM",
    originalReleaseYear: 1991,
    rarity: "Uncommon",
    description: "Dash-02 Neo Burning Sun, the front-motor successor in the Burning Sun lineage, originally built around Tamiya's historical FM chassis.",
    images: [img("18034")],
    canonicalReleaseId: "b6d59af9-6b3c-51be-8046-02faa28e7d97",
    hasMultipleReleases: false,
    releases: [
      originalRelease({
        id: "b6d59af9-6b3c-51be-8046-02faa28e7d97",
        productId: "2a6f40df-f87d-5184-82b7-578c4ee857fc",
        item: "18034",
        name: "Dash-02 Neo Burning Sun",
        year: 1991,
        chassis: "FM",
        notes: "Tamiya identifies ITEM 18034 as an FM-chassis machine. Official release-month evidence places it in June 1991; exact day remains unset.",
        sources: [
          source(
            "2dddfb00-2327-59fc-89e3-e9d5c18014cd",
            "b6d59af9-6b3c-51be-8046-02faa28e7d97",
            "official_manufacturer",
            "https://www.tamiya.com/japan/products/18034/index.html",
            ["itemNumber", "editionName", "chassis"],
            "Official Tamiya product page identifies ITEM 18034 Dash-02 Neo Burning Sun on the historical FM chassis.",
          ),
          source(
            "18e73dff-1194-55f3-b311-f2097ecda410",
            "b6d59af9-6b3c-51be-8046-02faa28e7d97",
            "official_archive",
            "https://www.tamiya.com/japan/newitems_month/list.html?current=199106",
            ["releaseYear"],
            "Tamiya official release-month archive places ITEM 18034 in June 1991. No exact day inferred.",
          ),
        ],
      }),
    ],
  },
]

export function applyCatalogCorrectionsBatch12(products: Product[]): Product[] {
  const ids = new Set(products.map((product) => product.id))
  return [...products, ...vintageP1Products.filter((product) => !ids.has(product.id))]
}
