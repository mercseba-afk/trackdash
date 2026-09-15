import type { Product, ProductRelease, ReleaseSource } from "@/lib/types"

const checkedAt = "2026-09-15"
const img = (item: string) => `https://www.tamiya.com/japan_contents/img/usr/item/1/${item}/${item}_1.jpg`

function source(id: string, releaseId: string, sourceType: ReleaseSource["sourceType"], sourceUrl: string, verifiedFields: string[], notes?: string): ReleaseSource {
  return { id, releaseId, sourceType, sourceUrl, verifiedFields, checkedAt, notes }
}

function release(input: {
  id: string
  productId: string
  item: string
  type: ProductRelease["releaseType"]
  editionType: ProductRelease["editionType"]
  name: string
  year: number
  date?: string
  chassis: ProductRelease["chassis"]
  original?: boolean
  verificationStatus: ProductRelease["verificationStatus"]
  notes: string
  sources: ReleaseSource[]
}): ProductRelease {
  return {
    id: input.id,
    productId: input.productId,
    itemNumber: input.item,
    releaseType: input.type,
    editionType: input.editionType,
    editionName: input.name,
    releaseYear: input.year,
    releaseDate: input.date,
    chassis: input.chassis,
    images: [],
    notes: input.notes,
    discontinued: false,
    isOriginal: input.original ?? false,
    verificationStatus: input.verificationStatus,
    productionStatus: "unknown",
    sources: input.sources,
  }
}

const jrNewsHistory = "https://www.tamiya.com/cms/japan/mini4wd/jr_news/jr_news16/pdf/000191.pdf"

const vintageP2MidProducts: Product[] = [
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
    description: "Racing Mini 4WD introduced in 1989 on the Type 3 chassis, with a later 2007 reissue using the same item number.",
    images: [img("18017")],
    canonicalReleaseId: "9db74896-9b0d-5fb6-aaf8-6a55b3d1bcb9",
    hasMultipleReleases: true,
    releases: [
      release({
        id: "9db74896-9b0d-5fb6-aaf8-6a55b3d1bcb9",
        productId: "10769cf5-314c-54ad-b33a-94b7335c14fd",
        item: "18017",
        type: "Original",
        editionType: "original",
        name: "Rising Bird — 1989 Original",
        year: 1989,
        chassis: "Type 3",
        original: true,
        verificationStatus: "verified",
        notes: "Official Tamiya historical material identifies ITEM 18017 Rising Bird as a Type 3 release from 1989. Exact day is intentionally not inferred from secondary chronology.",
        sources: [
          source("dfc05cf4-2446-5363-8699-439655116a69", "9db74896-9b0d-5fb6-aaf8-6a55b3d1bcb9", "official_archive", jrNewsHistory, ["itemNumber", "editionName", "releaseYear", "chassis"]),
        ],
      }),
      release({
        id: "9cf118ce-bca6-537a-b242-8882d2a8e69e",
        productId: "10769cf5-314c-54ad-b33a-94b7335c14fd",
        item: "18017",
        type: "Reissue",
        editionType: "reissue",
        name: "Rising Bird — 2007 Reissue",
        year: 2007,
        date: "2007-03-24",
        chassis: "Type 3",
        verificationStatus: "verified",
        notes: "Official Tamiya product page dates the 18017 Type 3 reissue to 24 March 2007. Same item number as the 1989 original, therefore a distinct TrackDash Release.",
        sources: [
          source("89c91596-f6fc-53cd-819e-d0009eac1a4d", "9cf118ce-bca6-537a-b242-8882d2a8e69e", "official_manufacturer", "https://www.tamiya.com/japan/products/18017/index.html", ["itemNumber", "editionName", "releaseYear", "releaseDate", "chassis"]),
        ],
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
    description: "Vanquish-derived Racing Mini 4WD family spanning the original Type 2 kit, a VS chassis revival and later RS occurrences.",
    images: [img("18018")],
    canonicalReleaseId: "4b972969-2fb6-5ee4-b5d6-52c3080f671d",
    hasMultipleReleases: true,
    releases: [
      release({
        id: "4b972969-2fb6-5ee4-b5d6-52c3080f671d",
        productId: "50142ae6-ab73-5912-bae3-36f363dac0d2",
        item: "18018",
        type: "Original",
        editionType: "original",
        name: "Vanquish Jr. — 1989 Original",
        year: 1989,
        chassis: "Type 2",
        original: true,
        verificationStatus: "verified",
        notes: "Official Tamiya product identity confirms ITEM 18018 / Type 2; Tamiya's release-month archive places the historical release in July 1989. Exact day is left unset.",
        sources: [
          source("d7d24606-98cd-572d-a5a0-8c60db2d6934", "4b972969-2fb6-5ee4-b5d6-52c3080f671d", "official_manufacturer", "https://www.tamiya.com/japan/products/18018/index.html", ["itemNumber", "editionName", "chassis"]),
          source("cd0ab055-c0e4-5285-a858-2cd7a82a130f", "4b972969-2fb6-5ee4-b5d6-52c3080f671d", "official_archive", "https://www.tamiya.com/japan/newitems_month/list.html?current=198907", ["releaseYear"], "Official Tamiya archive places ITEM 18018 in July 1989."),
        ],
      }),
      release({
        id: "dd1f841f-11e0-50eb-b441-7a954ed2f9c9",
        productId: "50142ae6-ab73-5912-bae3-36f363dac0d2",
        item: "18049",
        type: "Chassis Variant",
        editionType: "special",
        name: "Vanquish Jr. — VS Chassis",
        year: 2003,
        chassis: "VS",
        verificationStatus: "verified",
        notes: "Official Tamiya catalog/archive identifies ITEM 18049 Vanquish Jr. on VS chassis in the January 2003 release block. Exact day is left unset.",
        sources: [
          source("e6a06596-b59d-5a72-9cb0-4c0f2f88d93e", "dd1f841f-11e0-50eb-b441-7a954ed2f9c9", "official_manufacturer", "https://www.tamiya.com/japan/products/18049/index.html", ["itemNumber", "editionName", "chassis"]),
          source("45edf815-3e19-5c9c-95a9-2038a454a67a", "dd1f841f-11e0-50eb-b441-7a954ed2f9c9", "official_archive", "https://www.tamiya.com/japan/newitems_month/list.html?current=200301", ["releaseYear"], "Tamiya archive lists ITEM 18049 in January 2003."),
        ],
      }),
      release({
        id: "4224e201-17d4-5cf7-af60-cbd618daa4bc",
        productId: "50142ae6-ab73-5912-bae3-36f363dac0d2",
        item: "18062",
        type: "Reissue",
        editionType: "reissue",
        name: "Vanquish RS — 2011 Initial Release",
        year: 2011,
        date: "2011-07-16",
        chassis: "VS",
        verificationStatus: "partial",
        notes: "Contemporary specialist coverage quoting Tamiya's July 2011 new-product announcement dates the initial 18062 Vanquish RS to 16 July 2011. Current Tamiya catalog still confirms ITEM 18062 / VS. A later 2013 occurrence is represented separately.",
        sources: [
          source("0af4465f-5842-5e7e-81e9-94dbb01ea689", "4224e201-17d4-5cf7-af60-cbd618daa4bc", "official_manufacturer", "https://www.tamiya.com/japan/products/product_info_ex.html?genre_item=mini4wd_chassis_vs%2Cmachine_kit", ["itemNumber", "editionName", "chassis"]),
          source("66a5b33f-ff5a-5e66-af52-a9354a7b745b", "4224e201-17d4-5cf7-af60-cbd618daa4bc", "trusted_secondary", "https://www.tea-league.com/mt/tea/archives/2011/06/20117tzx.html", ["releaseYear", "releaseDate"], "Contemporary report reproduces Tamiya's July 2011 launch schedule for ITEM 18062."),
        ],
      }),
      release({
        id: "dbc4370d-bcbb-5939-aaf3-7138f4323248",
        productId: "50142ae6-ab73-5912-bae3-36f363dac0d2",
        item: "18062",
        type: "Reissue",
        editionType: "reissue",
        name: "Vanquish RS — 2013 Reissue",
        year: 2013,
        date: "2013-11-21",
        chassis: "VS",
        verificationStatus: "verified",
        notes: "Tamiya's official archive currently records ITEM 18062 with a 21 November 2013 release date. TrackDash keeps this commercial occurrence separate from the documented 2011 initial RS release.",
        sources: [
          source("c063ba19-4ecc-5e55-8ad9-258dc43daba2", "dbc4370d-bcbb-5939-aaf3-7138f4323248", "official_archive", "https://tamiya.com/japan/newitems_month/list.html?current=201107&genre_item=30", ["itemNumber", "editionName", "releaseYear", "releaseDate", "chassis"], "Official Tamiya archive surfaces ITEM 18062 with a 21 Nov 2013 release date."),
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
    description: "Dragon-series Racing Mini 4WD with original Type 3, Ricky Type 4, modern Type 3 reissue and VS Premium occurrences kept distinct.",
    images: [img("18020")],
    canonicalReleaseId: "82e3f1b1-5f77-5c70-8069-bd96b8d2a554",
    hasMultipleReleases: true,
    releases: [
      release({
        id: "82e3f1b1-5f77-5c70-8069-bd96b8d2a554",
        productId: "ac8ce928-eb4f-52e7-adc0-adb38e38bd4a",
        item: "18020",
        type: "Original",
        editionType: "original",
        name: "Saint Dragon Jr. — 1989 Original",
        year: 1989,
        chassis: "Type 3",
        original: true,
        verificationStatus: "verified",
        notes: "Official Tamiya identity confirms ITEM 18020 / Type 3. Tamiya's historical month archive places the item in the October 1989 block; exact day remains unset.",
        sources: [
          source("41f2dcf1-1e5a-5d2e-819b-d48b19191821", "82e3f1b1-5f77-5c70-8069-bd96b8d2a554", "official_manufacturer", "https://www.tamiya.com/japan/products/18020/index.html", ["itemNumber", "editionName", "chassis"]),
          source("ae92253c-cc17-5aec-b310-0c4dc2201322", "82e3f1b1-5f77-5c70-8069-bd96b8d2a554", "official_archive", "https://www.tamiya.com/japan/newitems_month/list.html?current=198910", ["releaseYear"], "Tamiya archive places ITEM 18020 in the October 1989 historical block."),
        ],
      }),
      release({
        id: "51cfc7e0-e939-524d-8eb4-71e054d62431",
        productId: "ac8ce928-eb4f-52e7-adc0-adb38e38bd4a",
        item: "18020",
        type: "Reissue",
        editionType: "reissue",
        name: "Saint Dragon Jr. — 2012 Reissue",
        year: 2012,
        date: "2012-07-21",
        chassis: "Type 3",
        verificationStatus: "verified",
        notes: "Official Tamiya page dates the Type 3 reissue of ITEM 18020 to 21 July 2012. Same item number as the original, so it is a distinct Release.",
        sources: [
          source("c154d7c8-1c86-54e6-9154-80b9689b2022", "51cfc7e0-e939-524d-8eb4-71e054d62431", "official_manufacturer", "https://www.tamiya.com/japan/products/18020/index.html", ["itemNumber", "editionName", "releaseYear", "releaseDate", "chassis"]),
        ],
      }),
      release({
        id: "65a0a5e0-c8e9-5492-9776-52e70ff0f72f",
        productId: "ac8ce928-eb4f-52e7-adc0-adb38e38bd4a",
        item: "18029",
        type: "Special Edition",
        editionType: "special",
        name: "Saint Dragon Jr. — Ricky's Special",
        year: 1990,
        chassis: "Type 4",
        verificationStatus: "partial",
        notes: "Official Tamiya page confirms ITEM 18029 Ricky's Special and historical Type 4 chassis. The 1990 year is retained from specialist chronology; exact day is intentionally unset.",
        sources: [
          source("5cac6418-9f06-5af3-8073-4dffd9994d83", "65a0a5e0-c8e9-5492-9776-52e70ff0f72f", "official_manufacturer", "https://www.tamiya.com/japan/products/18029/index.html", ["itemNumber", "editionName", "chassis"]),
          source("cdf80a1e-719b-53c7-aea8-a6b499cc164f", "65a0a5e0-c8e9-5492-9776-52e70ff0f72f", "trusted_secondary", "https://mini-4wd.fandom.com/wiki/Saint_Dragon_Jr.", ["releaseYear"], "Collector chronology dates Ricky's Special to 1990; no exact day promoted into TrackDash."),
        ],
      }),
      release({
        id: "9f9edc8e-0da7-580b-9d78-53161ded3218",
        productId: "ac8ce928-eb4f-52e7-adc0-adb38e38bd4a",
        item: "18071",
        type: "Premium",
        editionType: "premium",
        name: "Saint Dragon Premium — VS Chassis",
        year: 2012,
        date: "2012-05-26",
        chassis: "VS",
        verificationStatus: "verified",
        notes: "Official Tamiya Premium version on VS chassis, released 26 May 2012.",
        sources: [
          source("ef33dae9-0199-5adc-9764-877b46feccce", "9f9edc8e-0da7-580b-9d78-53161ded3218", "official_manufacturer", "https://www.tamiya.com/japan/products/18071/index.html", ["itemNumber", "editionName", "releaseYear", "releaseDate", "chassis"]),
        ],
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
    description: "Scorcher family spanning the original Type 2 machine, a 2003 VS revival and the later Super II RS version.",
    images: [img("18021")],
    canonicalReleaseId: "6dec9906-e5ca-52f8-9b0b-808123fc2dbc",
    hasMultipleReleases: true,
    releases: [
      release({
        id: "6dec9906-e5ca-52f8-9b0b-808123fc2dbc",
        productId: "0131ea3c-8d80-5489-ad4d-bd3caf61b1e5",
        item: "18021",
        type: "Original",
        editionType: "original",
        name: "Terra Scorcher Jr. — 1989 Original",
        year: 1989,
        chassis: "Type 2",
        original: true,
        verificationStatus: "partial",
        notes: "Official Tamiya page verifies ITEM 18021 / Type 2. Historical 1989 dating is supported by specialist chronology and remains partial until a primary historical date source is found.",
        sources: [
          source("483a8e5d-8451-53a8-9467-c558a2adb8cd", "6dec9906-e5ca-52f8-9b0b-808123fc2dbc", "official_manufacturer", "https://www.tamiya.com/japan/products/18021/index.html", ["itemNumber", "editionName", "chassis"]),
          source("7a475c5c-36d8-5ed4-b91f-b2c080eac7fa", "6dec9906-e5ca-52f8-9b0b-808123fc2dbc", "trusted_secondary", "https://mini-4wd.fandom.com/wiki/Terra_Scorcher_Jr.", ["releaseYear"], "Collector chronology dates the original to 1989; exact day is not promoted."),
        ],
      }),
      release({
        id: "2376aca6-2bed-51fa-9444-f65d00bfe239",
        productId: "0131ea3c-8d80-5489-ad4d-bd3caf61b1e5",
        item: "18050",
        type: "Chassis Variant",
        editionType: "special",
        name: "Terra Scorcher Jr. — VS Chassis",
        year: 2003,
        chassis: "VS",
        verificationStatus: "verified",
        notes: "Official Tamiya identity and January 2003 archive establish ITEM 18050 as the VS-chassis revival. Exact day remains unset.",
        sources: [
          source("78bf099c-a041-5c32-b4c4-43e0a4556606", "2376aca6-2bed-51fa-9444-f65d00bfe239", "official_manufacturer", "https://www.tamiya.com/japan/products/18050/index.html", ["itemNumber", "editionName", "chassis"]),
          source("436c63e2-83f1-5227-aa03-617030b89eaf", "2376aca6-2bed-51fa-9444-f65d00bfe239", "official_archive", "https://www.tamiya.com/japan/newitems_month/list.html?current=200301", ["releaseYear"], "Tamiya archive lists ITEM 18050 in January 2003."),
        ],
      }),
      release({
        id: "e5b3e302-10b7-5ceb-9253-6d104fce3f31",
        productId: "0131ea3c-8d80-5489-ad4d-bd3caf61b1e5",
        item: "18064",
        type: "Reissue",
        editionType: "reissue",
        name: "Terra Scorcher RS — Super II Chassis",
        year: 2011,
        date: "2011-10-29",
        chassis: "Super II",
        verificationStatus: "verified",
        notes: "Official Tamiya RS version on Super II chassis, released 29 October 2011.",
        sources: [
          source("f06899d9-9639-5794-baf5-86c8662ef971", "e5b3e302-10b7-5ceb-9253-6d104fce3f31", "official_manufacturer", "https://www.tamiya.com/japan/products/18064/index.html", ["itemNumber", "editionName", "releaseYear", "releaseDate", "chassis"]),
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
    description: "Type 3 Racing Mini 4WD from 1990, later reissued in 2007 under the same ITEM 18024 identity.",
    images: [img("18024")],
    canonicalReleaseId: "e14f4987-f9bd-53fc-976f-d2bdc611cc78",
    hasMultipleReleases: true,
    releases: [
      release({
        id: "e14f4987-f9bd-53fc-976f-d2bdc611cc78",
        productId: "b0589404-18c6-5291-941a-5d548b482703",
        item: "18024",
        type: "Original",
        editionType: "original",
        name: "Winning Bird — 1990 Original",
        year: 1990,
        chassis: "Type 3",
        original: true,
        verificationStatus: "verified",
        notes: "Official Tamiya historical retrospective identifies ITEM 18024 / Type 3 as a 1990 release. Exact original day remains unset.",
        sources: [
          source("b16a3b98-ffce-5691-9ecb-a05145cf163a", "e14f4987-f9bd-53fc-976f-d2bdc611cc78", "official_archive", jrNewsHistory, ["itemNumber", "editionName", "releaseYear", "chassis"]),
        ],
      }),
      release({
        id: "3a269f38-8a12-5d24-a42a-4d7c01bfc9e7",
        productId: "b0589404-18c6-5291-941a-5d548b482703",
        item: "18024",
        type: "Reissue",
        editionType: "reissue",
        name: "Winning Bird — 2007 Reissue",
        year: 2007,
        date: "2007-03-24",
        chassis: "Type 3",
        verificationStatus: "verified",
        notes: "Official Tamiya page dates the ITEM 18024 Type 3 reissue to 24 March 2007. Same Item Number as the 1990 original, therefore kept as a separate Release.",
        sources: [
          source("323c01a0-ef34-580e-be60-5de4a500d450", "3a269f38-8a12-5d24-a42a-4d7c01bfc9e7", "official_manufacturer", "https://www.tamiya.com/japan/products/18024/index.html", ["itemNumber", "editionName", "releaseYear", "releaseDate", "chassis"]),
        ],
      }),
    ],
  },
]

export function applyCatalogCorrectionsBatch14(products: Product[]): Product[] {
  const ids = new Set(products.map((product) => product.id))
  return [...products, ...vintageP2MidProducts.filter((product) => !ids.has(product.id))]
}
