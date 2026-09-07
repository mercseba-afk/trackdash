import type { Product, ProductRelease, ReleaseSource } from "@/lib/types"

const img = (item: string) =>
  `https://www.tamiya.com/japan_contents/img/usr/item/${item.startsWith("9") ? "9" : "1"}/${item}/${item}_1.jpg`

const source = (
  id: string,
  releaseId: string,
  sourceType: ReleaseSource["sourceType"],
  sourceUrl: string,
  verifiedFields: string[],
  notes?: string,
): ReleaseSource => ({
  id,
  releaseId,
  sourceType,
  sourceUrl,
  verifiedFields,
  checkedAt: "2026-09-07",
  notes,
})

type ProductCorrection = {
  name: string
  series: Product["series"]
  rarity: Product["rarity"]
  description: string
  imageItem: string
  releases: Record<string, Partial<ProductRelease>>
  add?: ProductRelease[]
}

const PRODUCTS: Readonly<Record<string, ProductCorrection>> = {
  // Legacy seedKey 18717 was incorrectly modeled as a standalone Emperor special.
  // The immutable TrackDash UUID is preserved, but the catalog identity is corrected
  // to the real Tamiya model represented by the seed item family: Dyipne.
  "6d6174e7-4040-5035-a3a4-cede97265d38": {
    name: "Dyipne",
    series: "Racing Mini 4WD",
    rarity: "Common",
    description: "Jeepney-inspired Mini 4WD model on the front-motor FM-A chassis, with a bright red body and distinctive passenger-bus styling.",
    imageItem: "95551",
    releases: {
      "8c923a15-a5e7-5e5c-ab8f-b2d1f722ac76": {
        itemNumber: "95551",
        releaseType: "Original",
        editionType: "original",
        editionName: "Dyipne (FM-A Chassis)",
        releaseYear: 2019,
        releaseDate: undefined,
        chassis: "FM-A",
        color: "Red",
        images: [img("95551")],
        discontinued: false,
        isOriginal: true,
        rarity: "Common",
        verificationStatus: "verified",
        productionStatus: "unknown",
        notes: "Original 2019 Dyipne occurrence. Tamiya's current item 18717 page explicitly states it has the same contents as ITEM 95551 released in 2019; no exact 2019 day is inferred.",
        sources: [
          source(
            "ac6b358e-3fb6-5e60-a56e-5a6b0c991940",
            "8c923a15-a5e7-5e5c-ab8f-b2d1f722ac76",
            "official_manufacturer",
            "https://www.tamiya.com/japan/products/18717/index.html",
            ["itemNumber", "chassis", "releaseYear", "editionName", "color"],
            "Official Tamiya page for the 2025 reissue states that it has the same contents as ITEM 95551 Dyipne, released in 2019.",
          ),
          source(
            "c65adb6c-cb0f-501a-8d4a-5843da307f57",
            "8c923a15-a5e7-5e5c-ab8f-b2d1f722ac76",
            "trusted_secondary",
            "https://www.rcjaz.co.uk/tamiya-95551-dyipne-fma-chassis-p-16393.html",
            ["itemNumber", "chassis", "editionName"],
            "RCJaz independently corroborates item 95551 as Dyipne on the FM-A chassis.",
          ),
        ],
      },
    },
    add: [
      {
        id: "beb90479-df22-5667-bfe5-6517d3cfa351",
        productId: "6d6174e7-4040-5035-a3a4-cede97265d38",
        itemNumber: "18717",
        releaseType: "Reissue",
        editionType: "reissue",
        editionName: "Dyipne (2025 Japan Reissue)",
        releaseYear: 2025,
        releaseDate: "2025-08-30",
        chassis: "FM-A",
        color: "Red",
        images: [img("18717")],
        discontinued: false,
        isOriginal: false,
        rarity: "Common",
        verificationStatus: "verified",
        productionStatus: "unknown",
        notes: "Official Japanese-market reissue of Dyipne; Tamiya states it has the same contents as the 2019 ITEM 95551 release.",
        sources: [
          source(
            "d5ccdcde-5b92-55ef-b75a-04e77a87d2e2",
            "beb90479-df22-5667-bfe5-6517d3cfa351",
            "official_manufacturer",
            "https://www.tamiya.com/japan/products/18717/index.html",
            ["itemNumber", "chassis", "releaseYear", "releaseDate", "editionName", "color"],
          ),
        ],
      },
    ],
  },

  // Legacy seedKey 18718 mixed a wrong item number with an "Aero Avante Japan Cup 2013"
  // label. The documented 2013 Japan Cup machine is Aero Thunder Shot, so the stable
  // Product identity is normalized to that real model and its known commercial releases.
  "07cc02e9-2626-5a60-92fb-2c2ed2402d7f": {
    name: "Aero Thunder Shot",
    series: "Aero",
    rarity: "Common",
    description: "Aerodynamic redesign of the classic Thunder Shot for the Mini 4WD REV generation, built around Tamiya's AR chassis.",
    imageItem: "18702",
    releases: {
      "035abf4d-65da-5b0c-855d-9e611798c4e4": {
        itemNumber: "18702",
        releaseType: "Original",
        editionType: "original",
        editionName: "Aero Thunder Shot (AR Chassis)",
        releaseYear: 2012,
        releaseDate: "2012-11-23",
        chassis: "AR",
        color: undefined,
        images: [img("18702")],
        discontinued: false,
        isOriginal: true,
        rarity: "Common",
        verificationStatus: "verified",
        productionStatus: "unknown",
        notes: "Canonical Aero Thunder Shot release, documented by Tamiya as Mini 4WD REV Series No.2.",
        sources: [
          source(
            "08a6eff7-0cb4-587f-b814-03fac432f5ff",
            "035abf4d-65da-5b0c-855d-9e611798c4e4",
            "official_manufacturer",
            "https://www.tamiya.com/japan/products/18702/index.html",
            ["itemNumber", "chassis", "releaseYear", "releaseDate", "editionName"],
          ),
        ],
      },
    },
    add: [
      {
        id: "8c08137b-cfc6-5c1d-8d1b-a151d53afc01",
        productId: "07cc02e9-2626-5a60-92fb-2c2ed2402d7f",
        itemNumber: "94967",
        releaseType: "Japan Cup Edition",
        editionType: "japan_cup",
        editionName: "Aero Thunder Shot Japan Cup 2013 Limited (AR Chassis)",
        releaseYear: 2013,
        releaseDate: "2013-07-06",
        chassis: "AR",
        color: "Royal Blue",
        images: [img("94967")],
        discontinued: true,
        isOriginal: false,
        rarity: "Rare",
        verificationStatus: "verified",
        productionStatus: "discontinued",
        notes: "Japan Cup 2013 commemorative Aero Thunder Shot. Official Tamiya retrospective confirms the edition; item/date/chassis are independently corroborated by historical catalog references.",
        sources: [
          source(
            "e6b20a56-a354-58f2-b664-04056ad510d9",
            "8c08137b-cfc6-5c1d-8d1b-a151d53afc01",
            "official_manufacturer",
            "https://www.tamiya.com/japan/mini4wd/feature/2019/0612.html",
            ["releaseYear", "editionName"],
            "Official Tamiya Japan Cup retrospective identifies Aero Thunder Shot Japan Cup 2013 as the commemorative machine for that season.",
          ),
          source(
            "099e12cb-06e7-5173-80e5-05fb33db73fb",
            "8c08137b-cfc6-5c1d-8d1b-a151d53afc01",
            "trusted_secondary",
            "https://mini-4wd.fandom.com/wiki/Aero_Thunder_Shot",
            ["itemNumber", "chassis", "releaseYear", "releaseDate", "editionName", "color"],
          ),
        ],
      },
      {
        id: "d0e6d2fc-3566-5004-a479-52f89253863b",
        productId: "07cc02e9-2626-5a60-92fb-2c2ed2402d7f",
        itemNumber: "94990",
        releaseType: "Color Special",
        editionType: "color_special",
        editionName: "Aero Thunder Shot Silver Metallic Special (AR Chassis)",
        releaseYear: undefined,
        releaseDate: undefined,
        chassis: "AR",
        color: "Silver Metallic",
        images: [],
        discontinued: true,
        isOriginal: false,
        rarity: "Rare",
        verificationStatus: "partial",
        productionStatus: "discontinued",
        notes: "Known limited Silver Metallic release. The historical official Tamiya item-scoped image is no longer available, so this release deliberately uses the Product fallback image instead of a third-party photo. Exact release date/year remain unset pending stronger primary evidence.",
        sources: [
          source(
            "5cd7c9a6-337a-519a-8a8b-872da70742b0",
            "d0e6d2fc-3566-5004-a479-52f89253863b",
            "trusted_secondary",
            "https://mini-4wd.fandom.com/wiki/Aero_Thunder_Shot",
            ["itemNumber", "chassis", "editionName", "color"],
          ),
        ],
      },
      {
        id: "e96a1769-9b91-55b8-84c4-697799d0b441",
        productId: "07cc02e9-2626-5a60-92fb-2c2ed2402d7f",
        itemNumber: "95273",
        releaseType: "Limited Edition",
        editionType: "limited",
        editionName: "Aero Thunder Shot Asia Challenge 2016 (AR Chassis)",
        releaseYear: 2016,
        releaseDate: undefined,
        chassis: "AR",
        color: "Red",
        images: [],
        discontinued: true,
        isOriginal: false,
        rarity: "Rare",
        verificationStatus: "partial",
        productionStatus: "discontinued",
        notes: "Asia Challenge 2016 commemorative release. Tamiya's historical item-scoped image currently returns 404, so the release deliberately uses the Product fallback image.",
        sources: [
          source(
            "2e7117a6-3349-5445-af73-b1cacc987519",
            "e96a1769-9b91-55b8-84c4-697799d0b441",
            "trusted_secondary",
            "https://www.rcjaz.com.au/tamiya-95273-aero-thunder-shot-ar-chassis-commemorative-kit-p-90073792.html",
            ["itemNumber", "chassis", "releaseYear", "editionName", "color"],
          ),
        ],
      },
      {
        id: "324310d8-9c3d-5fa9-9d75-1202b43cfce7",
        productId: "07cc02e9-2626-5a60-92fb-2c2ed2402d7f",
        itemNumber: "95286",
        releaseType: "Color Special",
        editionType: "color_special",
        editionName: "Aero Thunder Shot Black Special (AR Chassis)",
        releaseYear: 2017,
        releaseDate: "2017-02-11",
        chassis: "AR",
        color: "Smoke",
        images: [img("95286")],
        discontinued: false,
        isOriginal: false,
        rarity: "Uncommon",
        verificationStatus: "verified",
        productionStatus: "unknown",
        notes: "Official Black Special with smoke ABS body and black/red color scheme.",
        sources: [
          source(
            "5f5edfe3-5c89-5586-94e4-2c11e66f712f",
            "324310d8-9c3d-5fa9-9d75-1202b43cfce7",
            "official_manufacturer",
            "https://www.tamiya.com/japan/products/95286/index.html",
            ["itemNumber", "chassis", "releaseYear", "releaseDate", "editionName", "color"],
          ),
        ],
      },
    ],
  },

  // Legacy seedKey 18091 carried the invented name "Sword Flash". Tamiya item
  // 18091 is Mach-Bullet, so the existing immutable Product/Release UUIDs are
  // retained and their factual identity is corrected in place.
  "5b415a05-bc7c-589c-8b9c-3b3806479f6b": {
    name: "Mach-Bullet",
    series: "Racing Mini 4WD",
    rarity: "Common",
    description: "Vintage racing-car-inspired Mini 4WD with a long bonnet, exposed-driver styling and Tamiya's lightweight VS chassis.",
    imageItem: "18091",
    releases: {
      "2a5e1b1b-07e8-57fa-a202-0b38982b168e": {
        itemNumber: "18091",
        releaseType: "Original",
        editionType: "original",
        editionName: "Mach-Bullet (VS Chassis)",
        releaseYear: 2018,
        releaseDate: "2018-05-26",
        chassis: "VS",
        color: "Light Blue",
        images: [img("18091")],
        discontinued: false,
        isOriginal: true,
        rarity: "Common",
        verificationStatus: "verified",
        productionStatus: "unknown",
        notes: "Official Tamiya Mach-Bullet release on the VS chassis.",
        sources: [
          source(
            "f68e1dd6-614a-5b42-96f7-83021d26216e",
            "2a5e1b1b-07e8-57fa-a202-0b38982b168e",
            "official_manufacturer",
            "https://www.tamiya.com/japan/products/18091/index.html",
            ["itemNumber", "chassis", "releaseYear", "releaseDate", "editionName", "color"],
          ),
        ],
      },
    },
  },
}

export function applyCatalogCorrectionsBatch3(products: Product[]): Product[] {
  return products.map((product) => {
    const correction = PRODUCTS[product.id]
    if (!correction) return product

    const releases = product.releases.map((release) => {
      const patch = correction.releases[release.id]
      return patch ? { ...release, ...patch } : release
    })
    if (correction.add) releases.push(...correction.add)

    const canonicalRelease = releases.find((release) => release.id === product.canonicalReleaseId)

    return {
      ...product,
      name: correction.name,
      series: correction.series,
      rarity: correction.rarity,
      description: correction.description,
      images: [img(correction.imageItem)],
      releases,
      itemNumber: canonicalRelease?.itemNumber,
      chassis: canonicalRelease?.chassis,
      originalReleaseYear: canonicalRelease?.releaseYear,
      hasMultipleReleases: releases.length > 1,
    }
  })
}
