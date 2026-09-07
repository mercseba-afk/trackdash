import type { Product, ProductRelease, ReleaseSource } from "@/lib/types"

const img = (item: string) =>
  `https://www.tamiya.com/japan_contents/img/usr/item/${item.startsWith("9") ? "9" : "1"}/${item}/${item}_1.jpg`

const source = (
  id: string,
  releaseId: string,
  sourceUrl: string,
  verifiedFields: string[],
  notes?: string,
  sourceType: ReleaseSource["sourceType"] = "official_manufacturer",
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
  name?: string
  series?: Product["series"]
  description?: string
  imageItem?: string
  canonicalReleaseId?: string
  releases: Record<string, Partial<ProductRelease>>
  add?: ProductRelease[]
}

const PRODUCTS: Readonly<Record<string, ProductCorrection>> = {
  "c8132bd5-23ee-5f36-b3f6-a75ef0c27ea3": {
    series: "Aero",
    releases: {
      "a2baec17-32b5-5ca7-996b-4cdc2da725ba": {
        editionName: "Aero Avante (AR Chassis)", releaseYear: 2012, releaseDate: "2012-07-14", chassis: "AR",
        verificationStatus: "verified", images: [img("18701")],
        sources: [source("23168078-9207-5bb6-a911-1c9c935cb609", "a2baec17-32b5-5ca7-996b-4cdc2da725ba", "https://www.tamiya.com/japan/products/18701/index.html", ["itemNumber", "chassis", "releaseYear", "releaseDate", "editionName"])],
      },
      "107f030c-2b39-5659-8c00-ae11bd2a86d4": {
        itemNumber: "95062", releaseType: "Color Special", editionType: "color_special",
        editionName: "Aero Avante Violet Special (Clear Body) (AR Chassis)", releaseYear: 2015,
        releaseDate: "2015-06-06", chassis: "AR", color: "Violet / Clear", discontinued: false,
        isOriginal: false, rarity: "Uncommon", verificationStatus: "verified", productionStatus: "unknown",
        images: [img("95062")],
        notes: "Existing legacy slot corrected from a non-kit polycarbonate-body entry to Tamiya's documented complete Aero Avante Violet Special kit.",
        sources: [source("cbf2cd9c-c9c4-5b2d-94ab-232ccadba085", "107f030c-2b39-5659-8c00-ae11bd2a86d4", "https://www.tamiya.com/japan/products/95062/index.html", ["itemNumber", "chassis", "releaseYear", "releaseDate", "editionName", "color"])],
      },
    },
    add: [
      {
        id: "c4e3dc97-3c9d-5268-bc19-06095086f5e5", productId: "c8132bd5-23ee-5f36-b3f6-a75ef0c27ea3",
        itemNumber: "95267", releaseType: "Color Special", editionType: "color_special",
        editionName: "Aero Avante Gold Metallic (AR Chassis)", releaseYear: 2016, releaseDate: "2016-01-09",
        chassis: "AR", color: "Gold Metallic", images: [img("95267")], discontinued: false, isOriginal: false,
        rarity: "Uncommon", verificationStatus: "verified", productionStatus: "unknown",
        sources: [source("3320dabe-018e-598e-88da-068c0b9bc2b8", "c4e3dc97-3c9d-5268-bc19-06095086f5e5", "https://www.tamiya.com/japan/products/95267/index.html", ["itemNumber", "chassis", "releaseYear", "releaseDate", "editionName", "color"])],
      },
      {
        id: "9728c37c-503c-5359-bc45-cfc2f62a1e48", productId: "c8132bd5-23ee-5f36-b3f6-a75ef0c27ea3",
        itemNumber: "95268", releaseType: "Color Special", editionType: "color_special",
        editionName: "Aero Avante Blue Metallic (AR Chassis)", releaseYear: 2016, releaseDate: "2016-01-30",
        chassis: "AR", color: "Blue Metallic", images: [img("95268")], discontinued: false, isOriginal: false,
        rarity: "Uncommon", verificationStatus: "verified", productionStatus: "unknown",
        sources: [source("52d873cf-ef4d-5d13-9c67-b530871db5f0", "9728c37c-503c-5359-bc45-cfc2f62a1e48", "https://www.tamiya.com/japan/products/95268/index.html", ["itemNumber", "chassis", "releaseYear", "releaseDate", "editionName", "color"])],
      },
      {
        id: "4399ee13-81df-539c-9d46-783b789a1d82", productId: "c8132bd5-23ee-5f36-b3f6-a75ef0c27ea3",
        itemNumber: "95269", releaseType: "Color Special", editionType: "color_special",
        editionName: "Aero Avante Black Metallic (AR Chassis)", releaseYear: 2016, releaseDate: "2016-02-27",
        chassis: "AR", color: "Black Metallic", images: [img("95269")], discontinued: false, isOriginal: false,
        rarity: "Uncommon", verificationStatus: "verified", productionStatus: "unknown",
        sources: [source("c7226f11-7040-5aef-a638-cdaa123c0342", "4399ee13-81df-539c-9d46-783b789a1d82", "https://www.tamiya.com/japan/products/95269/index.html", ["itemNumber", "chassis", "releaseYear", "releaseDate", "editionName", "color"])],
      },
    ],
  },

  "c7a440cc-dc07-5ecc-bae3-c2770dc8b66e": {
    description: "Low-slung Mini 4WD PRO sports-car design by Takayuki Yamazaki, built around Tamiya's dual-shaft MA chassis.",
    releases: {
      "9a415521-3094-5724-a26b-e42a2c0148fa": {
        editionName: "Raikiri (MA Chassis)", releaseYear: 2015, releaseDate: "2015-01-10", chassis: "MA",
        verificationStatus: "verified",
        sources: [source("f00a80a9-c950-5ded-b85c-10940efd112a", "9a415521-3094-5724-a26b-e42a2c0148fa", "https://www.tamiya.com/japan/products/18640/index.html", ["itemNumber", "chassis", "releaseYear", "releaseDate", "editionName"])],
      },
      "5addae7a-e863-5cfe-8231-7af05fcfcbb6": {
        itemNumber: "95093", releaseType: "Japan Cup Edition", editionType: "japan_cup",
        editionName: "Raikiri Japan Cup 2016 (MA Chassis)", releaseYear: 2016, releaseDate: "2016-07-02",
        chassis: "MA", color: undefined, images: [], discontinued: false, isOriginal: false, rarity: "Uncommon",
        verificationStatus: "verified", productionStatus: "unknown",
        notes: "Existing legacy slot corrected from the unsupported 'Raikiri Black Special' to the documented Japan Cup 2016 complete kit. No exact release image is claimed in this pass.",
        sources: [source("c2d9dbcf-6c3c-5c74-8799-f646916d8e03", "5addae7a-e863-5cfe-8231-7af05fcfcbb6", "https://www.tamiya.com/cms/japan/mini4wd/jr_news/jr_news16/pdf/000190.pdf", ["itemNumber", "chassis", "releaseYear", "releaseDate", "editionName"], "Official Tamiya Jr. News documents the Japan Cup 2016 Raikiri kit.", "official_catalog_pdf")],
      },
    },
    add: [
      {
        id: "96d0bc96-ef24-5296-ac21-d038c1811048", productId: "c7a440cc-dc07-5ecc-bae3-c2770dc8b66e",
        itemNumber: "95417", releaseType: "Color Special", editionType: "color_special",
        editionName: "Raikiri Matte Pink Plated (MA Chassis)", releaseYear: 2018, releaseDate: "2018-03-31",
        chassis: "MA", color: "Matte Pink Plated", images: [img("95417")], discontinued: false, isOriginal: false,
        rarity: "Uncommon", verificationStatus: "verified", productionStatus: "unknown",
        sources: [source("41fb57dd-1c48-500f-a83e-f06aeb0356ed", "96d0bc96-ef24-5296-ac21-d038c1811048", "https://www.tamiya.com/japan/products/95417/index.html", ["itemNumber", "chassis", "releaseYear", "releaseDate", "editionName", "color"])],
      },
      {
        id: "26493506-a333-59b3-9050-62c6deecd0be", productId: "c7a440cc-dc07-5ecc-bae3-c2770dc8b66e",
        itemNumber: "95486", releaseType: "Color Special", editionType: "color_special",
        editionName: "Raikiri Pink Special (Polycarbonate Body) (MS Chassis)", releaseYear: 2025, releaseDate: "2025-08-30",
        chassis: "MS", color: "Pink", images: [img("95486")], discontinued: false, isOriginal: false,
        rarity: "Uncommon", verificationStatus: "verified", productionStatus: "unknown",
        sources: [source("2a73b45e-0353-5701-b5f6-85fbb8a97bf6", "26493506-a333-59b3-9050-62c6deecd0be", "https://www.tamiya.com/japan/products/95486/index.html", ["itemNumber", "chassis", "releaseYear", "releaseDate", "editionName", "color"])],
      },
    ],
  },

  "dcd372ac-5ad2-5a70-ae48-f1c4a6d6de4a": {
    name: "Super Avante Jr.",
    description: "Modern Mini 4WD interpretation of the Super Avante lineage, pairing the low racing body with Tamiya's lightweight VZ chassis.",
    releases: {
      "5e5251c2-a130-5fb0-93a7-2bd73c63736d": {
        editionName: "Super Avante Jr. (VZ Chassis)", releaseYear: 2022, releaseDate: "2022-06-25", chassis: "VZ",
        verificationStatus: "verified",
        sources: [source("5a4377da-4de5-5145-a6b9-da804bc159aa", "5e5251c2-a130-5fb0-93a7-2bd73c63736d", "https://www.tamiya.com/japan/products/18101/index.html", ["itemNumber", "chassis", "releaseYear", "releaseDate", "editionName"])],
      },
    },
    add: [{
      id: "13fa8bc9-0a44-51f5-ae90-885932c81b16", productId: "dcd372ac-5ad2-5a70-ae48-f1c4a6d6de4a",
      itemNumber: "95648", releaseType: "Color Special", editionType: "color_special",
      editionName: "Super Avante Jr. Black Special (VZ Chassis)", releaseYear: 2023, releaseDate: undefined,
      chassis: "VZ", color: "Black", images: [img("95648")], discontinued: false, isOriginal: false,
      rarity: "Uncommon", verificationStatus: "verified", productionStatus: "unknown",
      notes: "Official page identifies the initial release as May 2023; no day is inferred.",
      sources: [source("ee7ab4f5-970b-51d0-a991-359c5ea13da4", "13fa8bc9-0a44-51f5-ae90-885932c81b16", "https://www.tamiya.com/japan/products/95648/index.html", ["itemNumber", "chassis", "releaseYear", "editionName", "color"])],
    }],
  },

  "6f41e40f-a48e-509f-8602-dfd303e25795": {
    series: "Aero",
    releases: {
      "b57fbc18-d57c-5b3c-9def-ffb4e70c9e27": {
        editionName: "Shadow Shark (AR Chassis)", releaseYear: 2013, releaseDate: "2013-10-19", chassis: "AR",
        verificationStatus: "verified",
        sources: [source("fa3b5ee6-27f5-54c9-aa37-caaae7fa591b", "b57fbc18-d57c-5b3c-9def-ffb4e70c9e27", "https://www.tamiya.com/japan/products/18704/index.html", ["itemNumber", "chassis", "releaseYear", "releaseDate", "editionName"])],
      },
    },
    add: [
      {
        id: "e5eebd62-334d-5738-8c04-d52354cc56ab", productId: "6f41e40f-a48e-509f-8602-dfd303e25795",
        itemNumber: "95203", releaseType: "Color Special", editionType: "color_special",
        editionName: "Shadow Shark Yellow Special (AR Chassis)", releaseYear: 2015, releaseDate: "2015-05-30",
        chassis: "AR", color: "Yellow", images: [img("95203")], discontinued: false, isOriginal: false,
        rarity: "Uncommon", verificationStatus: "verified", productionStatus: "unknown",
        sources: [source("390b507b-329e-5220-a377-686e59a28d18", "e5eebd62-334d-5738-8c04-d52354cc56ab", "https://www.tamiya.com/japan/products/95203/index.html", ["itemNumber", "chassis", "releaseYear", "releaseDate", "editionName", "color"])],
      },
      {
        id: "10f430a6-2865-5f58-8041-b8bbbb2e2e6f", productId: "6f41e40f-a48e-509f-8602-dfd303e25795",
        itemNumber: "95224", releaseType: "Special Edition", editionType: "special",
        editionName: "Shadow Shark Italia Special (AR Chassis)", releaseYear: 2016, releaseDate: "2016-03-26",
        chassis: "AR", color: "Italia", images: [img("95224")], discontinued: false, isOriginal: false,
        rarity: "Uncommon", verificationStatus: "verified", productionStatus: "unknown",
        sources: [source("d54ac583-5c89-5ff3-9798-270d6fbc5c8c", "10f430a6-2865-5f58-8041-b8bbbb2e2e6f", "https://www.tamiya.com/japan/products/95224/index.html", ["itemNumber", "chassis", "releaseYear", "releaseDate", "editionName"])],
      },
    ],
  },

  "d341ec22-c1f9-5a03-906d-444f8eee5401": {
    description: "Mini 4WD PRO machine designed around a three-piece detachable cowl concept, running on Tamiya's dual-shaft MA chassis.",
    releases: {
      "d32c3468-4ce4-5968-ba4e-d1e47e30eb01": {
        editionName: "DCR-01 (MA Chassis)", releaseYear: 2017, releaseDate: "2017-05-27", chassis: "MA",
        verificationStatus: "verified",
        sources: [source("950d8a8d-6b38-5cab-b9f8-4fae14325f88", "d32c3468-4ce4-5968-ba4e-d1e47e30eb01", "https://www.tamiya.com/japan/products/18646/index.html", ["itemNumber", "chassis", "releaseYear", "releaseDate", "editionName"])],
      },
    },
    add: [{
      id: "dc6199ed-4cf0-5da4-85a4-a2141dc6a265", productId: "d341ec22-c1f9-5a03-906d-444f8eee5401",
      itemNumber: "95372", releaseType: "Color Special", editionType: "color_special",
      editionName: "DCR-01 Purple Special (MA Chassis)", releaseYear: 2018, releaseDate: "2018-01-13",
      chassis: "MA", color: "Purple", images: [img("95372")], discontinued: false, isOriginal: false,
      rarity: "Uncommon", verificationStatus: "verified", productionStatus: "unknown",
      sources: [source("50c18372-6b35-5b6d-9f2b-0bd357f5bc58", "dc6199ed-4cf0-5da4-85a4-a2141dc6a265", "https://www.tamiya.com/japan/products/95372/index.html", ["itemNumber", "chassis", "releaseYear", "releaseDate", "editionName", "color"])],
    }],
  },

  "b972592b-ce68-5f39-b3a1-cdc8984d3817": {
    description: "Mini 4WD PRO sports-car design by Takayuki Yamazaki, built on Tamiya's aerodynamically efficient dual-shaft MA chassis.",
    releases: {
      "08b3cc73-8c45-5ddd-bab4-9167c7f93c41": {
        editionName: "Tri Gale (MA Chassis)", releaseYear: 2014, releaseDate: "2014-05-31", chassis: "MA",
        verificationStatus: "verified",
        sources: [source("92cd580c-5a4b-5cac-958e-b10e4d8bfb05", "08b3cc73-8c45-5ddd-bab4-9167c7f93c41", "https://www.tamiya.com/japan/products/18638/index.html", ["itemNumber", "chassis", "releaseYear", "releaseDate", "editionName"])],
      },
    },
    add: [{
      id: "3bc0bd97-e11c-5c50-ad45-934b5f1f733b", productId: "b972592b-ce68-5f39-b3a1-cdc8984d3817",
      itemNumber: "95100", releaseType: "Japan Cup Edition", editionType: "japan_cup",
      editionName: "Tri Gale Japan Cup 2017 (MA Chassis)", releaseYear: 2017, releaseDate: "2017-06-10",
      chassis: "MA", images: [img("95100")], discontinued: false, isOriginal: false,
      rarity: "Uncommon", verificationStatus: "verified", productionStatus: "unknown",
      sources: [source("6237a1ac-d995-5afa-91f8-0ff3cb7c4392", "3bc0bd97-e11c-5c50-ad45-934b5f1f733b", "https://www.tamiya.com/japan/products/95100/index.html", ["itemNumber", "chassis", "releaseYear", "releaseDate", "editionName"])],
    }],
  },

  "2972e27d-7c75-5534-9ed4-1603ef4a6655": {
    description: "The original Dash-1 Emperor from Dash! Yonkuro: first released as item 18012 on the Type 1 chassis in 1988, then reworked across Type 3, MS and later premium/special editions.",
    imageItem: "18012", canonicalReleaseId: "e1069825-3715-5fa6-80e9-93dcee32d4be",
    releases: {
      "96adee91-eaec-5c73-9269-cf3875cfe02d": {
        releaseType: "Chassis Variant", editionType: "reissue", editionName: "Dash-1 Emperor (Type 3 Chassis)",
        releaseYear: 1990, releaseDate: undefined, chassis: "Type 3", isOriginal: false,
        verificationStatus: "verified",
        notes: "Documented Type 3 version first released in January 1990. It is a later occurrence in the Emperor family, not the original 1988 Dash-1 Emperor.",
        sources: [source("7d95ac4c-36a1-5dc5-bad2-1cca191d1396", "96adee91-eaec-5c73-9269-cf3875cfe02d", "https://www.tamiya.com/japan/products/18025/index.html", ["itemNumber", "chassis", "releaseYear", "editionName"])],
      },
    },
    add: [
      {
        id: "e1069825-3715-5fa6-80e9-93dcee32d4be", productId: "2972e27d-7c75-5534-9ed4-1603ef4a6655",
        itemNumber: "18012", releaseType: "Original", editionType: "original",
        editionName: "Dash-1 Emperor (Type 1 Chassis)", releaseYear: 1988, releaseDate: undefined,
        chassis: "Type 1", images: [], discontinued: false, isOriginal: true, rarity: "Very Rare",
        verificationStatus: "verified", productionStatus: "unknown",
        notes: "Original Dash-1 Emperor. Tamiya's historical monthly listing places item 18012 in September 1988; no exact day is inferred. Product-level official art is used as fallback rather than claiming a release-exact archival image.",
        sources: [
          source("aa4634c5-ea26-58bb-87c7-3f6c16f0d573", "e1069825-3715-5fa6-80e9-93dcee32d4be", "https://www.tamiya.com/japan/products/18012/index.html", ["itemNumber", "chassis", "editionName"]),
          source("fe180363-7ee4-5dd5-85c4-67a33c2dd707", "e1069825-3715-5fa6-80e9-93dcee32d4be", "https://www.tamiya.com/japan/newitems_month/list.html?current=198809", ["releaseYear"], "Official Tamiya monthly archive places the original item in September 1988.", "official_archive"),
        ],
      },
      {
        id: "0306bc1a-cdb6-5b9c-9461-91cd2a39e07c", productId: "2972e27d-7c75-5534-9ed4-1603ef4a6655",
        itemNumber: "18625", releaseType: "Chassis Variant", editionType: "reissue",
        editionName: "Dash-1 Emperor (MS Chassis)", releaseYear: 2008, releaseDate: "2008-07-12",
        chassis: "MS", images: [img("18625")], discontinued: false, isOriginal: false, rarity: "Uncommon",
        verificationStatus: "verified", productionStatus: "unknown",
        sources: [source("cec2ad9c-604f-5a14-98f4-290dec640252", "0306bc1a-cdb6-5b9c-9461-91cd2a39e07c", "https://www.tamiya.com/japan/products/18625/index.html", ["itemNumber", "chassis", "releaseYear", "releaseDate", "editionName"])],
      },
      {
        id: "061cc21a-4382-5bce-b08c-216b456fcaeb", productId: "2972e27d-7c75-5534-9ed4-1603ef4a6655",
        itemNumber: "95296", releaseType: "Color Special", editionType: "color_special",
        editionName: "Dash-1 Emperor (MS Chassis) Black Special (2017 Initial Release)", releaseYear: 2017,
        releaseDate: undefined, chassis: "MS", color: "Black", images: [], discontinued: false,
        isOriginal: false, rarity: "Rare", verificationStatus: "verified", productionStatus: "unknown",
        notes: "Tamiya states the initial release was February 2017. Kept separate from the documented 2023-05-27 reissue; no exact 2017 day or release-exact image is inferred.",
        sources: [source("7b229ed5-10e0-5934-b4e1-037fb5f2fcb1", "061cc21a-4382-5bce-b08c-216b456fcaeb", "https://www.tamiya.com/japan/products/95296/index.html", ["itemNumber", "chassis", "releaseYear", "editionName", "color"])],
      },
    ],
  },
}

export function applyCatalogCorrectionsBatch4(products: Product[]): Product[] {
  return products.map((product) => {
    const correction = PRODUCTS[product.id]
    if (!correction) return product

    const releases = product.releases.map((release) => {
      const patch = correction.releases[release.id]
      return patch ? { ...release, ...patch } : release
    })
    if (correction.add) {
      for (const added of correction.add) {
        if (!releases.some((release) => release.id === added.id)) releases.push(added)
      }
    }

    const canonicalReleaseId = correction.canonicalReleaseId ?? product.canonicalReleaseId
    const canonicalRelease = releases.find((release) => release.id === canonicalReleaseId)

    return {
      ...product,
      name: correction.name ?? product.name,
      series: correction.series ?? product.series,
      description: correction.description ?? product.description,
      images: correction.imageItem ? [img(correction.imageItem)] : product.images,
      releases,
      canonicalReleaseId,
      itemNumber: canonicalRelease?.itemNumber,
      chassis: canonicalRelease?.chassis,
      originalReleaseYear: canonicalRelease?.releaseYear,
      hasMultipleReleases: releases.length > 1,
    }
  })
}
