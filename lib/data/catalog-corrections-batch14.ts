import type { Product, ProductRelease, ReleaseSource } from "@/lib/types"

const checkedAt = "2026-09-15"
const JR_NEWS_191 = "https://www.tamiya.com/cms/japan/mini4wd/jr_news/jr_news16/pdf/000191.pdf"
const RACING_HISTORY = "https://www.mini4wditalia.it/2022/05/20/racing-mini-4wd/"
const img = (item: string) => `https://www.tamiya.com/japan_contents/img/usr/item/1/${item}/${item}_1.jpg`

function source(id: string, releaseId: string, sourceType: ReleaseSource["sourceType"], sourceUrl: string, verifiedFields: string[], notes?: string): ReleaseSource {
  return { id, releaseId, sourceType, sourceUrl, verifiedFields, checkedAt, notes }
}

function makeRelease(input: {
  id: string
  productId: string
  item: string
  name: string
  year: number
  chassis: ProductRelease["chassis"]
  original: boolean
  type?: ProductRelease["releaseType"]
  editionType?: ProductRelease["editionType"]
  releaseDate?: string
  verificationStatus?: ProductRelease["verificationStatus"]
  notes: string
  sources: ReleaseSource[]
}): ProductRelease {
  return {
    id: input.id,
    productId: input.productId,
    itemNumber: input.item,
    releaseType: input.type ?? (input.original ? "Original" : "Reissue"),
    editionType: input.editionType ?? (input.original ? "original" : "reissue"),
    editionName: input.name,
    releaseYear: input.year,
    releaseDate: input.releaseDate,
    chassis: input.chassis,
    images: [],
    notes: input.notes,
    discontinued: false,
    isOriginal: input.original,
    verificationStatus: input.verificationStatus ?? "verified",
    productionStatus: "unknown",
    sources: input.sources,
  }
}

const vintageP2SecondWave: Product[] = [
  {
    id: "10769cf5-314c-54ad-b33a-94b7335c14fd",
    category: "mini4wd",
    seedKey: "18017",
    itemNumber: "18017",
    name: "Rising Bird",
    japaneseName: "ライジング・バード",
    series: "Racing Mini 4WD",
    chassis: "Type 3",
    originalReleaseYear: 1989,
    rarity: "Uncommon",
    description: "Racing Mini 4WD released in 1989 on the Type 3 chassis, later reissued under the same ITEM 18017 in 2007.",
    images: [img("18017")],
    canonicalReleaseId: "9db74896-9b0d-5fb6-aaf8-6a55b3d1bcb9",
    hasMultipleReleases: true,
    releases: [
      makeRelease({
        id: "9db74896-9b0d-5fb6-aaf8-6a55b3d1bcb9",
        productId: "10769cf5-314c-54ad-b33a-94b7335c14fd",
        item: "18017",
        name: "Rising Bird — 1989 Original",
        year: 1989,
        chassis: "Type 3",
        original: true,
        notes: "Tamiya's historical Jr. News identifies ITEM 18017 Rising Bird / Type 3 as a 1989 release. The current Tamiya page documents a later 2007 occurrence with the same item number, so generic 18017 evidence is Release-ambiguous.",
        sources: [source("794e9ab3-6cee-53ed-b8c0-cbb8eae47812", "9db74896-9b0d-5fb6-aaf8-6a55b3d1bcb9", "official_catalog_pdf", JR_NEWS_191, ["itemNumber", "editionName", "chassis", "releaseYear"])],
      }),
      makeRelease({
        id: "9cf118ce-bca6-537a-b242-8882d2a8e69e",
        productId: "10769cf5-314c-54ad-b33a-94b7335c14fd",
        item: "18017",
        name: "Rising Bird — 2007 Reissue",
        year: 2007,
        releaseDate: "2007-03-24",
        chassis: "Type 3",
        original: false,
        notes: "Official Tamiya page explicitly dates ITEM 18017 to 24 March 2007. TrackDash keeps this occurrence separate from the 1989 original.",
        sources: [source("d180363c-60c6-50fb-851a-44c88c0f617b", "9cf118ce-bca6-537a-b242-8882d2a8e69e", "official_manufacturer", "https://www.tamiya.com/japan/products/18017/index.html", ["itemNumber", "editionName", "chassis", "releaseYear", "releaseDate"])],
      }),
    ],
  },
  {
    id: "50142ae6-ab73-5912-bae3-36f363dac0d2",
    category: "mini4wd",
    seedKey: "18018",
    itemNumber: "18018",
    name: "Vanquish Jr.",
    japaneseName: "バンキッシュJr.",
    series: "Racing Mini 4WD",
    chassis: "Type 2",
    originalReleaseYear: 1989,
    rarity: "Uncommon",
    description: "Racing Mini 4WD adaptation of the Vanquish R/C buggy, released in 1989 on the Type 2 chassis.",
    images: [img("18018")],
    canonicalReleaseId: "4b972969-2fb6-5ee4-b5d6-52c3080f671d",
    hasMultipleReleases: false,
    releases: [
      makeRelease({
        id: "4b972969-2fb6-5ee4-b5d6-52c3080f671d",
        productId: "50142ae6-ab73-5912-bae3-36f363dac0d2",
        item: "18018",
        name: "Vanquish Jr. — 1989 Original",
        year: 1989,
        chassis: "Type 2",
        original: true,
        notes: "Official Tamiya identity verifies ITEM 18018 / Type 2 and Tamiya's release-month archive places the model in July 1989. Exact day is intentionally left unset in TrackDash because the primary archive evidence establishes the month, not the day.",
        sources: [
          source("de162cc1-ad5f-5f4b-aa94-a97a39caf797", "4b972969-2fb6-5ee4-b5d6-52c3080f671d", "official_manufacturer", "https://www.tamiya.com/japan/products/18018/index.html", ["itemNumber", "editionName", "chassis"]),
          source("4bece259-fbed-5ed1-a2b5-5681a693b338", "4b972969-2fb6-5ee4-b5d6-52c3080f671d", "official_archive", "https://www.tamiya.com/japan/newitems_month/list.html?current=198907", ["releaseYear"], "Tamiya's official archive lists ITEM 18018 in July 1989."),
        ],
      }),
    ],
  },
  {
    id: "ac8ce928-eb4f-52e7-adc0-adb38e38bd4a",
    category: "mini4wd",
    seedKey: "18020",
    itemNumber: "18020",
    name: "Saint Dragon Jr.",
    japaneseName: "セイントドラゴンJr.",
    series: "Racing Mini 4WD",
    chassis: "Type 3",
    originalReleaseYear: 1989,
    rarity: "Uncommon",
    description: "Dragon-series Racing Mini 4WD originally released in 1989 on the Type 3 chassis, with a later standard reissue under the same item number.",
    images: [img("18020")],
    canonicalReleaseId: "82e3f1b1-5f77-5c70-8069-bd96b8d2a554",
    hasMultipleReleases: true,
    releases: [
      makeRelease({
        id: "82e3f1b1-5f77-5c70-8069-bd96b8d2a554",
        productId: "ac8ce928-eb4f-52e7-adc0-adb38e38bd4a",
        item: "18020",
        name: "Saint Dragon Jr. — 1989 Original",
        year: 1989,
        chassis: "Type 3",
        original: true,
        verificationStatus: "partial",
        notes: "Official Tamiya page verifies ITEM 18020 / Type 3. Historical catalog references place the original in October 1989; because the current Tamiya page is specifically the 2012 occurrence, the original-year field remains partial rather than overstated as fully verified.",
        sources: [
          source("57f65b9b-01ed-56ca-bdc4-eef7051bef76", "82e3f1b1-5f77-5c70-8069-bd96b8d2a554", "official_manufacturer", "https://www.tamiya.com/japan/products/18020/index.html", ["itemNumber", "editionName", "chassis"]),
          source("aa0e575e-f096-55cb-bf60-55c88ff21035", "82e3f1b1-5f77-5c70-8069-bd96b8d2a554", "trusted_secondary", RACING_HISTORY, ["releaseYear"], "Historical Racing Mini 4WD catalog places Saint Dragon Jr. in October 1989."),
        ],
      }),
      makeRelease({
        id: "51cfc7e0-e939-524d-8eb4-71e054d62431",
        productId: "ac8ce928-eb4f-52e7-adc0-adb38e38bd4a",
        item: "18020",
        name: "Saint Dragon Jr. — 2012 Reissue",
        year: 2012,
        releaseDate: "2012-07-21",
        chassis: "Type 3",
        original: false,
        notes: "Official Tamiya page explicitly dates the ITEM 18020 Type 3 reissue to 21 July 2012.",
        sources: [source("b6e9620e-1bd9-5ecc-9524-d1cd0961d5ae", "51cfc7e0-e939-524d-8eb4-71e054d62431", "official_manufacturer", "https://www.tamiya.com/japan/products/18020/index.html", ["itemNumber", "editionName", "chassis", "releaseYear", "releaseDate"])],
      }),
    ],
  },
  {
    id: "0131ea3c-8d80-5489-ad4d-bd3caf61b1e5",
    category: "mini4wd",
    seedKey: "18021",
    itemNumber: "18021",
    name: "Terra Scorcher Jr.",
    japaneseName: "スコーチャーJr.",
    series: "Racing Mini 4WD",
    chassis: "Type 2",
    originalReleaseYear: 1989,
    rarity: "Uncommon",
    description: "Late-1989 Racing Mini 4WD based on the Terra Scorcher R/C buggy, using the Type 2 chassis.",
    images: [img("18021")],
    canonicalReleaseId: "6dec9906-e5ca-52f8-9b0b-808123fc2dbc",
    hasMultipleReleases: false,
    releases: [
      makeRelease({
        id: "6dec9906-e5ca-52f8-9b0b-808123fc2dbc",
        productId: "0131ea3c-8d80-5489-ad4d-bd3caf61b1e5",
        item: "18021",
        name: "Terra Scorcher Jr. — 1989 Original",
        year: 1989,
        chassis: "Type 2",
        original: true,
        verificationStatus: "partial",
        notes: "Official Tamiya identity verifies ITEM 18021 / Type 2. Specialist historical catalogs place the original in November 1989. TrackDash leaves the exact day unset and keeps the release partial until equivalent primary date evidence is captured.",
        sources: [
          source("ed85fd47-dc3d-57c5-b7a8-49a43da09399", "6dec9906-e5ca-52f8-9b0b-808123fc2dbc", "official_manufacturer", "https://www.tamiya.com/japan/products/18021/index.html", ["itemNumber", "editionName", "chassis"]),
          source("5727868c-042a-5d39-8c5b-82b9c2cd3523", "6dec9906-e5ca-52f8-9b0b-808123fc2dbc", "trusted_secondary", RACING_HISTORY, ["releaseYear"], "Historical Racing Mini 4WD catalog places Terra Scorcher Jr. in November 1989."),
        ],
      }),
    ],
  },
  {
    id: "b0589404-18c6-5291-941a-5d548b482703",
    category: "mini4wd",
    seedKey: "18024",
    itemNumber: "18024",
    name: "Winning Bird",
    japaneseName: "ウイニングバード",
    series: "Racing Mini 4WD",
    chassis: "Type 3",
    originalReleaseYear: 1990,
    rarity: "Uncommon",
    description: "Racing Mini 4WD originally released in 1990 on the Type 3 chassis and reissued under the same ITEM 18024 in 2007.",
    images: [img("18024")],
    canonicalReleaseId: "e14f4987-f9bd-53fc-976f-d2bdc611cc78",
    hasMultipleReleases: true,
    releases: [
      makeRelease({
        id: "e14f4987-f9bd-53fc-976f-d2bdc611cc78",
        productId: "b0589404-18c6-5291-941a-5d548b482703",
        item: "18024",
        name: "Winning Bird — 1990 Original",
        year: 1990,
        chassis: "Type 3",
        original: true,
        notes: "Tamiya's historical Jr. News identifies ITEM 18024 Winning Bird / Type 3 as a 1990 release. The current Tamiya page is a 2007 reissue with the same item number, so the two occurrences are explicitly separated.",
        sources: [source("a59259d4-7228-5917-b87c-e580f6360350", "e14f4987-f9bd-53fc-976f-d2bdc611cc78", "official_catalog_pdf", JR_NEWS_191, ["itemNumber", "editionName", "chassis", "releaseYear"])],
      }),
      makeRelease({
        id: "3a269f38-8a12-5d24-a42a-4d7c01bfc9e7",
        productId: "b0589404-18c6-5291-941a-5d548b482703",
        item: "18024",
        name: "Winning Bird — 2007 Reissue",
        year: 2007,
        releaseDate: "2007-03-24",
        chassis: "Type 3",
        original: false,
        notes: "Official Tamiya page explicitly dates ITEM 18024 to 24 March 2007. This Release remains separate from the 1990 original.",
        sources: [source("1af54b7c-f72d-5b3f-b690-12e46b15caf3", "3a269f38-8a12-5d24-a42a-4d7c01bfc9e7", "official_manufacturer", "https://www.tamiya.com/japan/products/18024/index.html", ["itemNumber", "editionName", "chassis", "releaseYear", "releaseDate"])],
      }),
    ],
  },
]

export function applyCatalogCorrectionsBatch14(products: Product[]): Product[] {
  const ids = new Set(products.map((product) => product.id))
  return [...products, ...vintageP2SecondWave.filter((product) => !ids.has(product.id))]
}
