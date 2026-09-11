import type { Product, ProductRelease, ReleaseSource } from "@/lib/types"

const AVANTE_MKII_PRODUCT_ID = "6dcb6511-5277-561f-a880-95ef828ce44f"
const AVANTE_18614_ID = "5a123617-c84c-5012-ab20-1a9d493259e0"
const AVANTE_94626_ID = "e7f6a362-9bac-53aa-8673-2fa308c50a17"
const AVANTE_94716_ID = "6c1d4fcf-7265-5a61-9be9-795e27eec353"
const AVANTE_95061_ID = "c819da54-1ebc-5a8b-a24f-77166cf70e8d"
const AVANTE_95525_ID = "5489c586-0f2a-5393-9447-dcf36bed8f1a"

function addSource(sources: ReleaseSource[], source: ReleaseSource): ReleaseSource[] {
  return sources.some((item) => item.id === source.id || item.sourceUrl === source.sourceUrl)
    ? sources
    : [...sources, source]
}

const source18614Tamiya: ReleaseSource = {
  id: "3f684782-f1e4-5ec5-8b0c-e04b817e8c6f",
  releaseId: AVANTE_18614_ID,
  sourceType: "official_manufacturer",
  sourceUrl: "https://www.tamiya.com/japan/products/18614/index.html",
  verifiedFields: ["itemNumber", "editionName", "chassis", "releaseYear", "releaseDate"],
  checkedAt: "2026-09-11",
  notes: "Tamiya Japan identifies ITEM 18614 Avante Mk.II, MS chassis, released 2006-06-24; the current product record was updated in August 2026.",
}

const source94626TamiyaUsa: ReleaseSource = {
  id: "4bbf1cea-06ee-5f25-9938-8803eab9ddaf",
  releaseId: AVANTE_94626_ID,
  sourceType: "official_manufacturer",
  sourceUrl: "https://www.tamiyausa.com/shop/132-pro/jr-pro-avante-mkii-black-sp/",
  verifiedFields: ["itemNumber", "editionName", "chassis", "productionStatus", "color"],
  checkedAt: "2026-09-11",
  notes: "Tamiya USA identifies ITEM 94626 Avante Mk.II Black Special, MS chassis and explicitly marks it Discontinued.",
}

const source94626History: ReleaseSource = {
  id: "b7f28a55-5319-5b36-97d7-5fb8a1fc4aff",
  releaseId: AVANTE_94626_ID,
  sourceType: "trusted_secondary",
  sourceUrl: "https://www.jokerteam.it/wp-content/uploads/2018/01/Mini-4wd-Avante-History.pdf",
  verifiedFields: ["releaseYear", "releaseDate"],
  checkedAt: "2026-09-11",
  notes: "Avante history reference records the Black Special release date as 2007-12-15.",
}

const source94716HobbySearch: ReleaseSource = {
  id: "d96c1c38-0bce-56fe-9340-6f8f5f2a3a0b",
  releaseId: AVANTE_94716_ID,
  sourceType: "trusted_secondary",
  sourceUrl: "https://www.1999.co.jp/10098463",
  verifiedFields: ["itemNumber", "barcodeJAN", "editionName", "chassis", "color"],
  checkedAt: "2026-09-11",
  notes: "Hobby Search identifies ITEM 94716 / JAN 4950344947164 as the Avante Mk.II V Special on MS chassis with violet plated body.",
}

const source94716History: ReleaseSource = {
  id: "00ad9e48-7a75-545b-9782-69ced9f0384a",
  releaseId: AVANTE_94716_ID,
  sourceType: "trusted_secondary",
  sourceUrl: "https://www.jokerteam.it/wp-content/uploads/2018/01/Mini-4wd-Avante-History.pdf",
  verifiedFields: ["releaseYear", "releaseDate"],
  checkedAt: "2026-09-11",
  notes: "Avante history reference records the V Special release date as 2009-10-01.",
}

const source95061Tamiya: ReleaseSource = {
  id: "89c305cb-389c-5fd2-bb7a-02dacc783c72",
  releaseId: AVANTE_95061_ID,
  sourceType: "official_manufacturer",
  sourceUrl: "https://www.tamiya.com/japan/products/95061/index.html",
  verifiedFields: ["itemNumber", "editionName", "chassis", "releaseYear", "releaseDate", "color"],
  checkedAt: "2026-09-11",
  notes: "Tamiya Japan identifies ITEM 95061 Avante Mk.II Pink Special (Clear Body), MS chassis, released 2015-05-02 as a limited kit.",
}

const source95525Rcjaz: ReleaseSource = {
  id: "7ca5e0b1-97d9-5c69-a363-0d4614ba5bf8",
  releaseId: AVANTE_95525_ID,
  sourceType: "trusted_secondary",
  sourceUrl: "https://www.rcjaz.co.uk/tamiya-95525-avante-mk-ii-asia-challenge-2020-special-ms-chassis-finals-in-taiwan-p-18352.html",
  verifiedFields: ["itemNumber", "barcodeJAN", "editionName", "chassis", "releaseYear", "countryMarket"],
  checkedAt: "2026-09-11",
  notes: "RCJAZ identifies Tamiya 95525 / GTIN 4950344955251 as Avante Mk.II Asia Challenge 2020 Special, MS chassis, Finals in Taiwan. Exact calendar release day remains unverified.",
}

const blackSpecial: ProductRelease = {
  id: AVANTE_94626_ID,
  productId: AVANTE_MKII_PRODUCT_ID,
  itemNumber: "94626",
  releaseType: "Special Edition",
  editionType: "special",
  editionName: "Avante Mk.II Black Special",
  releaseYear: 2007,
  releaseDate: "2007-12-15",
  chassis: "MS",
  color: "Black reinforced body / gray MS chassis / fluorescent orange wheels",
  countryMarket: "Japan / International",
  images: [],
  notes: "Discontinued Black Special. No exact completed-sale result was observed in the 2023-09-11 to 2026-09-10 Product Research scan; absence in that window is not treated as proof of no market.",
  discontinued: true,
  isOriginal: false,
  rarity: "Rare",
  verificationStatus: "verified",
  productionStatus: "discontinued",
  statusCheckedAt: "2026-09-11",
  sources: [source94626TamiyaUsa, source94626History],
}

const vSpecial: ProductRelease = {
  id: AVANTE_94716_ID,
  productId: AVANTE_MKII_PRODUCT_ID,
  itemNumber: "94716",
  releaseType: "Limited Edition",
  editionType: "limited",
  editionName: "Avante Mk.II V Special",
  releaseYear: 2009,
  releaseDate: "2009-10-01",
  chassis: "MS",
  barcodeJAN: "4950344947164",
  color: "Violet metal-plated body / black MS chassis",
  countryMarket: "Japan",
  images: [],
  notes: "Limited V Special. Zero exact completed-sale rows were observed in the three-year Product Research scan; rarity reflects limited status, age and observed market scarcity, not an invented price.",
  discontinued: false,
  isOriginal: false,
  rarity: "Rare",
  verificationStatus: "verified",
  productionStatus: "unknown",
  sources: [source94716HobbySearch, source94716History],
}

const pinkSpecial: ProductRelease = {
  id: AVANTE_95061_ID,
  productId: AVANTE_MKII_PRODUCT_ID,
  itemNumber: "95061",
  releaseType: "Clear Body",
  editionType: "special",
  editionName: "Avante Mk.II Pink Special (Clear Body)",
  releaseYear: 2015,
  releaseDate: "2015-05-02",
  chassis: "MS",
  barcodeJAN: "4950344950614",
  color: "Clear polycarbonate body / pink parts and wheels / white hard low-profile tires",
  countryMarket: "Japan / International",
  images: [],
  notes: "Limited clear-body Pink Special. Thirteen exact sold units across nine sellers were observed in the audited three-year Product Research window.",
  discontinued: false,
  isOriginal: false,
  rarity: "Uncommon",
  verificationStatus: "verified",
  productionStatus: "unknown",
  sources: [source95061Tamiya],
}

const asiaChallenge2020: ProductRelease = {
  id: AVANTE_95525_ID,
  productId: AVANTE_MKII_PRODUCT_ID,
  itemNumber: "95525",
  releaseType: "Limited Edition",
  editionType: "limited",
  editionName: "Avante Mk.II Asia Challenge 2020 Special (Taiwan Final)",
  releaseYear: 2020,
  chassis: "MS",
  barcodeJAN: "4950344955251",
  color: "Asia Challenge 2020 Taiwan Final livery",
  countryMarket: "Taiwan / Asia Challenge",
  images: [],
  notes: "Regional/event special associated with the Asia Challenge 2020 Finals in Taiwan. Exact release day is intentionally left unknown; eighteen exact sold units were observed in the audited three-year Product Research window.",
  discontinued: false,
  isOriginal: false,
  rarity: "Uncommon",
  verificationStatus: "verified",
  productionStatus: "unknown",
  sources: [source95525Rcjaz],
}

export function applyCatalogCorrectionsBatch9(products: Product[]): Product[] {
  return products.map((product) => {
    if (product.id !== AVANTE_MKII_PRODUCT_ID) return product

    let releases = product.releases.map((release): ProductRelease => {
      if (release.id !== AVANTE_18614_ID) return release
      return {
        ...release,
        rarity: "Common",
        verificationStatus: "verified",
        sources: addSource(release.sources, source18614Tamiya),
      }
    })

    for (const candidate of [blackSpecial, vSpecial, pinkSpecial, asiaChallenge2020]) {
      if (!releases.some((release) => release.id === candidate.id || release.itemNumber === candidate.itemNumber)) {
        releases = [...releases, candidate]
      }
    }

    releases.sort((a, b) => (a.releaseYear ?? Number.MAX_SAFE_INTEGER) - (b.releaseYear ?? Number.MAX_SAFE_INTEGER))
    return { ...product, releases }
  })
}
