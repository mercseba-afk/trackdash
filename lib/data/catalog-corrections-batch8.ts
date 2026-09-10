import type { Product, ProductRelease, ReleaseSource } from "@/lib/types"

const DYNA_HAWK_PRODUCT_ID = "d3b4ad34-05ac-592e-ad93-fab4cfde0a5a"
const DYNA_94717_ID = "1ede5023-9035-5342-b207-6242c5f5190a"
const DYNA_95467_ID = "ace0d1b1-aaf3-589a-977c-a3df07c83c73"
const DYNA_95000_ID = "67423b20-d880-5e54-a83f-dc06dcba6f75"

function addSource(sources: ReleaseSource[], source: ReleaseSource): ReleaseSource[] {
  return sources.some((item) => item.id === source.id || item.sourceUrl === source.sourceUrl)
    ? sources
    : [...sources, source]
}

const source94717Flyer: ReleaseSource = {
  id: "854ce4c5-1920-57e9-8111-ce1fb07da00f",
  releaseId: DYNA_94717_ID,
  sourceType: "official_catalog_pdf",
  sourceUrl: "https://www.fantasyland.it/wordpress/wp-content/themes/fantasyland/documenti/tamiya/volantini/TA_2010-02.pdf",
  verifiedFields: ["itemNumber", "editionName", "chassis", "releaseYear"],
  checkedAt: "2026-09-10",
  notes: "Archived Tamiya Italy February 2010 flyer identifies TA 94717 Dyna-Hawk GX as a limited-edition Super XX kit.",
}

const source95467TamiyaUsa: ReleaseSource = {
  id: "4db23491-03cf-5c5d-b94d-f13b6cca2fdb",
  releaseId: DYNA_95467_ID,
  sourceType: "official_manufacturer",
  sourceUrl: "https://www.tamiyausa.com/shop/132-super/jr-dyna-hawk-gx-super-xx-sp-2/",
  verifiedFields: ["itemNumber", "editionName", "chassis", "productionStatus"],
  checkedAt: "2026-09-10",
  notes: "Tamiya USA identifies item 95467 as Dyna-Hawk GX Super XX Special and explicitly marks it Discontinued.",
}

const source95000Bic: ReleaseSource = {
  id: "a9e1dcba-2a3e-54ee-a921-4d9f2eb06df8",
  releaseId: DYNA_95000_ID,
  sourceType: "trusted_secondary",
  sourceUrl: "https://www.biccamera.com/bc/item/1428801/",
  verifiedFields: ["itemNumber", "editionName", "chassis", "releaseYear", "releaseDate", "color"],
  checkedAt: "2026-09-10",
  notes: "Bic Camera's Tamiya product record identifies item 95000, the Black Special Super XX kit, with manufacturer release date 2013-12-21 and black/red specification.",
}

const source95000Hlj: ReleaseSource = {
  id: "5dfbc8ff-c71a-5375-9637-a1055b4b7d7e",
  releaseId: DYNA_95000_ID,
  sourceType: "trusted_secondary",
  sourceUrl: "https://www.hlj.com/dyna-hawk-gx-black-sp-super-xx-tam95000",
  verifiedFields: ["itemNumber", "barcodeJAN", "chassis", "productionStatus"],
  checkedAt: "2026-09-10",
  notes: "HLJ corroborates TAM95000 / JAN 4950344950003, Super XX identity and discontinued status. Its 2013-12-19 listing date is treated as retailer availability, not used over the 2013-12-21 manufacturer release date recorded by Bic Camera.",
}

const blackSpecial95000: ProductRelease = {
  id: DYNA_95000_ID,
  productId: DYNA_HAWK_PRODUCT_ID,
  itemNumber: "95000",
  releaseType: "Limited Edition",
  editionType: "limited",
  editionName: "Dyna-Hawk GX Black Special (Super XX Chassis)",
  releaseYear: 2013,
  releaseDate: "2013-12-21",
  chassis: "Super XX",
  barcodeJAN: "4950344950003",
  color: "Black body / red Super XX chassis / red tires",
  countryMarket: "Japan",
  images: [],
  notes: "Documented Dyna-Hawk GX Black Special. Exact release identity is backed by independent catalog/retailer records; exact package imagery is supplied by the audited image manifest.",
  discontinued: true,
  isOriginal: false,
  rarity: "Rare",
  verificationStatus: "verified",
  productionStatus: "discontinued",
  statusCheckedAt: "2026-09-10",
  sources: [source95000Bic, source95000Hlj],
}

export function applyCatalogCorrectionsBatch8(products: Product[]): Product[] {
  return products.map((product) => {
    if (product.id !== DYNA_HAWK_PRODUCT_ID) return product

    let releases = product.releases.map((release): ProductRelease => {
      if (release.id === DYNA_94717_ID) {
        return {
          ...release,
          rarity: "Rare",
          verificationStatus: "verified",
          sources: addSource(release.sources, source94717Flyer),
        }
      }

      if (release.id === DYNA_95467_ID) {
        return {
          ...release,
          rarity: "Uncommon",
          discontinued: true,
          productionStatus: "discontinued",
          statusCheckedAt: "2026-09-10",
          sources: addSource(release.sources, source95467TamiyaUsa),
        }
      }

      return release
    })

    if (!releases.some((release) => release.id === DYNA_95000_ID || release.itemNumber === "95000")) {
      releases = [...releases, blackSpecial95000]
    }

    releases.sort((a, b) => (a.releaseYear ?? Number.MAX_SAFE_INTEGER) - (b.releaseYear ?? Number.MAX_SAFE_INTEGER))
    return { ...product, releases }
  })
}
