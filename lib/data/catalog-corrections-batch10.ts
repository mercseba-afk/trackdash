import type { Product, ProductRelease, ReleaseSource } from "@/lib/types"

const PROTO_ZX_PRODUCT_ID = "a1fd4f6d-0834-5f09-ac3c-5d4b398f0968"
const PROTO_ZX_2007_ID = "4d5b0a9a-498f-51fc-accd-9316ca11c843"
const PROTO_ZX_2017_ID = "f0614cb8-d0cb-521d-aa2c-4fc304f39430"
const PROTO_ZX_1992_ID = "83e6ea7d-aa3d-5524-b640-73c407ee272a"

function addSource(sources: ReleaseSource[], source: ReleaseSource): ReleaseSource[] {
  return sources.some((item) => item.id === source.id || item.sourceUrl === source.sourceUrl)
    ? sources
    : [...sources, source]
}

const source1992CoroCoro: ReleaseSource = {
  id: "6c16171d-24b5-5a7b-b992-ecbc2818baad",
  releaseId: PROTO_ZX_1992_ID,
  sourceType: "trusted_secondary",
  sourceUrl: "https://corocoro-news.jp/special/317457/",
  verifiedFields: ["itemNumber", "editionName", "chassis", "releaseYear"],
  checkedAt: "2026-09-13",
  notes: "CoroCoro's official editorial history identifies Proto Emperor ZX as a February 1992 commercial release, item 18038 / Zero chassis, while also noting an earlier 1991 event pre-sale.",
}

const source1992AtWiki: ReleaseSource = {
  id: "15060696-03b7-53af-a153-5709e9c61e79",
  releaseId: PROTO_ZX_1992_ID,
  sourceType: "trusted_secondary",
  sourceUrl: "https://w.atwiki.jp/mini4vipwiki/pages/107.html",
  verifiedFields: ["itemNumber", "releaseDate", "chassis", "releaseYear"],
  checkedAt: "2026-09-13",
  notes: "Independent Japanese Mini 4WD reference records ITEM 18038, Zero chassis, original sale 1992-02-18 and the later 2007-09-01 resale of the same item.",
}

const source2007HobbySearch: ReleaseSource = {
  id: "46b62344-a015-5365-8f0e-f55ea2f70882",
  releaseId: PROTO_ZX_2007_ID,
  sourceType: "trusted_secondary",
  sourceUrl: "https://www.1999.co.jp/10086737",
  verifiedFields: ["itemNumber", "barcodeJAN", "editionName", "chassis"],
  checkedAt: "2026-09-13",
  notes: "Hobby Search identifies item 18038 / JAN 4950344997107 as Proto Emperor ZX on the Zero chassis. Official Tamiya separately dates this resale to 2007-09-01.",
}

const source2017HobbySearch: ReleaseSource = {
  id: "4753afc0-5aa1-5d82-92e4-d3c50e7e3303",
  releaseId: PROTO_ZX_2017_ID,
  sourceType: "trusted_secondary",
  sourceUrl: "https://www.1999.co.jp/10460640",
  verifiedFields: ["itemNumber", "barcodeJAN", "editionName", "chassis"],
  checkedAt: "2026-09-13",
  notes: "Hobby Search identifies item 95335 / JAN 4950344953356 as Proto Emperor ZX Premium on the Super-II chassis.",
}

const original1992: ProductRelease = {
  id: PROTO_ZX_1992_ID,
  productId: PROTO_ZX_PRODUCT_ID,
  itemNumber: "18038",
  releaseType: "Original",
  editionType: "original",
  editionName: "Proto Emperor ZX (1992 Original)",
  releaseYear: 1992,
  releaseDate: "1992-02-18",
  chassis: "Zero",
  color: "Purple body / gray Zero chassis / white large-diameter wheels",
  countryMarket: "Japan",
  images: [],
  notes: "Original 1992 commercial occurrence of item 18038. A limited advance sale was reported in 1991; the regular release followed in February 1992. The later 2007 resale keeps the same Tamiya item number but is modeled as a separate TrackDash Release.",
  discontinued: true,
  isOriginal: true,
  rarity: "Rare",
  verificationStatus: "partial",
  productionStatus: "discontinued",
  statusCheckedAt: "2026-09-13",
  sources: [source1992CoroCoro, source1992AtWiki],
}

export function applyCatalogCorrectionsBatch10(products: Product[]): Product[] {
  return products.map((product) => {
    if (product.id !== PROTO_ZX_PRODUCT_ID) return product

    let releases = product.releases.map((release): ProductRelease => {
      if (release.id === PROTO_ZX_2007_ID) {
        return {
          ...release,
          releaseType: "Reissue",
          editionType: "reissue",
          editionName: "Proto Emperor ZX (2007 Reissue)",
          releaseYear: 2007,
          releaseDate: "2007-09-01",
          chassis: "Zero",
          barcodeJAN: "4950344997107",
          isOriginal: false,
          verificationStatus: "verified",
          sources: addSource(release.sources, source2007HobbySearch),
        }
      }

      if (release.id === PROTO_ZX_2017_ID) {
        return {
          ...release,
          barcodeJAN: "4950344953356",
          rarity: "Rare",
          verificationStatus: "verified",
          sources: addSource(release.sources, source2017HobbySearch),
        }
      }

      return release
    })

    if (!releases.some((release) => release.id === PROTO_ZX_1992_ID)) {
      releases = [...releases, original1992]
    }

    releases.sort((a, b) => (a.releaseYear ?? Number.MAX_SAFE_INTEGER) - (b.releaseYear ?? Number.MAX_SAFE_INTEGER))

    return {
      ...product,
      canonicalReleaseId: PROTO_ZX_1992_ID,
      itemNumber: "18038",
      chassis: "Zero",
      originalReleaseYear: 1992,
      releases,
      hasMultipleReleases: true,
    }
  })
}
