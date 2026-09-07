import type { Product, ProductRelease, ReleaseSource } from "@/lib/types"

const img = (item: string) =>
  `https://www.tamiya.com/japan_contents/img/usr/item/${item.startsWith("9") ? "9" : "1"}/${item}/${item}_1.jpg`

const official = (
  id: string,
  releaseId: string,
  item: string,
  verifiedFields: string[],
  notes?: string,
): ReleaseSource => ({
  id,
  releaseId,
  sourceType: "official_manufacturer",
  sourceUrl: `https://www.tamiya.com/japan/products/${item}/index.html`,
  verifiedFields,
  checkedAt: "2026-09-07",
  notes,
})

const PRODUCTS: Record<
  string,
  {
    name?: string
    imageItem: string
    releases: Record<string, Partial<ProductRelease>>
    add?: ProductRelease[]
  }
> = {
  // Astute Jr. — legacy TrackDash seed identity 19412 is frozen and intentionally unchanged.
  "be48e786-11c6-567f-b063-8026957bb403": {
    name: "Astute Jr.",
    imageItem: "18033",
    releases: {
      "3d1c1580-c921-530f-9aaf-7ca5ff77e86c": {
        itemNumber: "18033",
        editionName: "Astute Jr.",
        releaseYear: 1991,
        chassis: "Zero",
        verificationStatus: "verified",
        notes: "Official Tamiya identity is Astute Jr., item 18033, on the Zero chassis. Exact historical day is intentionally left unset.",
        sources: [official("3b8fc360-beb1-57b4-83f0-a86f4702f302", "3d1c1580-c921-530f-9aaf-7ca5ff77e86c", "18033", ["itemNumber", "chassis", "editionName"])],
      },
      "96deae1d-dfec-5aaf-a247-835386533002": {
        itemNumber: "18077",
        releaseType: "Reissue",
        editionType: "reissue",
        editionName: "Astute RS (Super-II Chassis)",
        releaseYear: 2013,
        releaseDate: "2013-02-09",
        chassis: "Super II",
        verificationStatus: "verified",
        images: [img("18077")],
        notes: "Existing legacy reissue slot corrected to the documented Astute RS release.",
        sources: [official("b7c1dc0e-0694-52be-b18c-6c776509b620", "96deae1d-dfec-5aaf-a247-835386533002", "18077", ["itemNumber", "chassis", "releaseDate", "releaseYear", "editionName"])],
      },
    },
  },

  // Copperfang.
  "e2f47ba4-03f1-5adb-8252-471c76729292": {
    imageItem: "18715",
    releases: {
      "9058782c-0e3c-5a3d-9f9c-391365d3e81e": {
        itemNumber: "18715",
        editionName: "Copperfang (FM-A Chassis)",
        releaseYear: 2019,
        releaseDate: "2019-02-09",
        chassis: "FM-A",
        verificationStatus: "verified",
        images: [img("18715")],
        sources: [official("bef0a955-a5a2-5183-bb04-4effd4fec126", "9058782c-0e3c-5a3d-9f9c-391365d3e81e", "18715", ["itemNumber", "chassis", "releaseDate", "releaseYear", "editionName"])],
      },
    },
    add: [
      {
        id: "2ef185b6-0b2a-5208-a8c6-582d6b4d9c58",
        productId: "e2f47ba4-03f1-5adb-8252-471c76729292",
        itemNumber: "95589",
        releaseType: "Color Special",
        editionType: "color_special",
        editionName: "Copperfang Black Special (FM-A Chassis)",
        releaseYear: 2020,
        releaseDate: "2020-11-14",
        chassis: "FM-A",
        color: "Black",
        images: [img("95589")],
        discontinued: false,
        isOriginal: false,
        rarity: "Uncommon",
        verificationStatus: "verified",
        productionStatus: "unknown",
        sources: [official("bb5a3bb9-2217-5838-86f1-268b951f9064", "2ef185b6-0b2a-5208-a8c6-582d6b4d9c58", "95589", ["itemNumber", "chassis", "releaseDate", "releaseYear", "editionName", "color"])],
      },
    ],
  },

  // Dash-0 Horizon — legacy name "Dash-01 Horizon" and Super-II canonical chassis were incorrect.
  "813a9ba0-170e-5636-9a9a-a7e7fca32366": {
    name: "Dash-0 Horizon",
    imageItem: "18030",
    releases: {
      "a0b042ac-7e6c-57f4-98a2-bd92e8e39f39": {
        itemNumber: "18030",
        editionName: "Dash-0 Horizon",
        releaseYear: 1990,
        chassis: "Zero",
        verificationStatus: "verified",
        images: [img("18030")],
        notes: "Official Tamiya page identifies Dash-0 Horizon, item 18030, Zero chassis; exact historical day is left unset.",
        sources: [official("d0c4acdc-1917-5bbf-a994-abbc57aa9212", "a0b042ac-7e6c-57f4-98a2-bd92e8e39f39", "18030", ["itemNumber", "chassis", "editionName"])],
      },
    },
    add: [
      {
        id: "f2dda5bd-a337-5f5a-b4ed-7d6288e16f22",
        productId: "813a9ba0-170e-5636-9a9a-a7e7fca32366",
        itemNumber: "18073",
        releaseType: "Premium",
        editionType: "premium",
        editionName: "Dash-0 Horizon Premium (Super-II Chassis)",
        releaseYear: 2012,
        releaseDate: "2012-06-30",
        chassis: "Super II",
        images: [img("18073")],
        discontinued: false,
        isOriginal: false,
        rarity: "Uncommon",
        verificationStatus: "verified",
        productionStatus: "unknown",
        sources: [official("fc6a0e1c-d4a5-5e1c-b9b1-05134900c758", "f2dda5bd-a337-5f5a-b4ed-7d6288e16f22", "18073", ["itemNumber", "chassis", "releaseDate", "releaseYear", "editionName"])],
      },
    ],
  },

  // Dash-4 Cannonball.
  "d2c3e3d8-050d-5b9b-932f-023f2ee7dce2": {
    name: "Dash-4 Cannonball",
    imageItem: "18022",
    releases: {
      "c63b8f4a-43f3-597b-82e5-f0e45bb45b7a": {
        itemNumber: "18022",
        editionName: "Dash-4 Cannonball",
        releaseYear: 1990,
        chassis: "Type 3",
        verificationStatus: "verified",
        images: [img("18022")],
        notes: "Official Tamiya identity verified; exact historical day is intentionally left unset.",
        sources: [official("af336f72-22b4-5155-a248-77ab9c71ac95", "c63b8f4a-43f3-597b-82e5-f0e45bb45b7a", "18022", ["itemNumber", "chassis", "editionName"])],
      },
    },
    add: [
      {
        id: "7e6cd351-658c-5558-bff9-3a1ea608e6d4",
        productId: "d2c3e3d8-050d-5b9b-932f-023f2ee7dce2",
        itemNumber: "95225",
        releaseType: "Premium",
        editionType: "premium",
        editionName: "Dash-4 Cannonball Premium (Super-II Chassis)",
        releaseYear: 2015,
        releaseDate: "2015-11-14",
        chassis: "Super II",
        images: [img("95225")],
        discontinued: false,
        isOriginal: false,
        rarity: "Uncommon",
        verificationStatus: "verified",
        productionStatus: "unknown",
        sources: [official("351cf87f-1422-57c1-977d-14e4c23e67a0", "7e6cd351-658c-5558-bff9-3a1ea608e6d4", "95225", ["itemNumber", "chassis", "releaseDate", "releaseYear", "editionName"])],
      },
    ],
  },

  // Fire Dragon Jr.
  "65c7f3e3-ebfc-55a6-8855-c0c495164b72": {
    name: "Fire Dragon Jr.",
    imageItem: "18011",
    releases: {
      "0e24ff2a-70e6-5909-b28d-67400a365c92": {
        itemNumber: "18011",
        editionName: "Fire Dragon Jr.",
        releaseYear: 1988,
        chassis: "Type 1",
        verificationStatus: "verified",
        images: [],
        notes: "Original identity corrected to Fire Dragon Jr., item 18011, Type 1. Current official product asset is used only as Product-level fallback, not claimed as an archival exact image of the 1988 occurrence.",
        sources: [official("4c89b033-c7ac-55e6-b9a3-288f52253352", "0e24ff2a-70e6-5909-b28d-67400a365c92", "18011", ["itemNumber", "chassis", "editionName"])],
      },
      "daf1d532-80b5-524f-896e-fb577dae2445": {
        itemNumber: "18072",
        releaseType: "Premium",
        editionType: "premium",
        editionName: "Fire Dragon Premium (VS Chassis)",
        releaseYear: 2012,
        releaseDate: "2012-07-07",
        chassis: "VS",
        verificationStatus: "verified",
        images: [img("18072")],
        sources: [official("1837a66c-58a3-5d6b-acd6-1c3431d43cec", "daf1d532-80b5-524f-896e-fb577dae2445", "18072", ["itemNumber", "chassis", "releaseDate", "releaseYear", "editionName"])],
      },
    },
  },

  // Manta Ray Jr.
  "0b2e1cf8-6c19-5342-89ef-6a53b3f51af3": {
    name: "Manta Ray Jr.",
    imageItem: "18035",
    releases: {
      "b86d459a-bd44-5c68-b104-9ca4cedaf413": {
        itemNumber: "18035",
        editionName: "Manta Ray Jr.",
        releaseYear: 1991,
        chassis: "Zero",
        verificationStatus: "verified",
        images: [],
        notes: "Original identity corrected to item 18035 / Zero chassis. Product image is used as fallback; no unsupported exact historical asset claim is made.",
        sources: [official("2b8b947d-8abb-56d9-971a-c6d85d50909e", "b86d459a-bd44-5c68-b104-9ca4cedaf413", "18035", ["itemNumber", "editionName"])],
      },
      "5277616b-91d3-5f0c-b893-d77778beaf95": {
        itemNumber: "18053",
        releaseType: "Chassis Variant",
        editionType: "reissue",
        editionName: "Manta Ray Jr. (VS Chassis)",
        releaseYear: 2003,
        releaseDate: "2003-02-20",
        chassis: "VS",
        verificationStatus: "verified",
        images: [img("18053")],
        sources: [official("55682d09-f41c-5579-84e6-ad645681388d", "5277616b-91d3-5f0c-b893-d77778beaf95", "18053", ["itemNumber", "chassis", "editionName"])],
      },
    },
  },

  // Mad Bull Jr. — official chassis is Super TZ-X; this batch adds that factual value to the controlled TS vocabulary.
  "643f208f-c8f6-5574-b9cf-565e28602d17": {
    name: "Mad Bull Jr.",
    imageItem: "18056",
    releases: {
      "454a8d07-e963-5699-9a8c-2151917f75a5": {
        itemNumber: "18056",
        editionName: "Mad Bull Jr.",
        releaseYear: 2003,
        chassis: "Super TZ-X",
        verificationStatus: "verified",
        images: [],
        notes: "Official page states this model was first released in 2003 and uses Super TZ-X. Current 2013 asset remains Product fallback for the historical original.",
        sources: [official("6cdfe0e6-05a3-5721-bb26-e7b347924fb0", "454a8d07-e963-5699-9a8c-2151917f75a5", "18056", ["itemNumber", "chassis", "editionName"], "Official page documents a 2013 re-release and explicitly states the model was first released in 2003.")],
      },
      "eb3b81bb-3a11-56af-a0cf-b625a1501434": {
        itemNumber: "18056",
        releaseType: "Reissue",
        editionType: "reissue",
        editionName: "Mad Bull Jr. (2013 Reissue)",
        releaseYear: 2013,
        releaseDate: "2013-11-02",
        chassis: "Super TZ-X",
        verificationStatus: "verified",
        images: [img("18056")],
        sources: [official("5ba96eab-072a-504d-ae96-4a8d11c9c749", "eb3b81bb-3a11-56af-a0cf-b625a1501434", "18056", ["itemNumber", "chassis", "releaseDate", "releaseYear", "editionName"])],
      },
    },
  },

  // Thunder Shot Jr.
  "059b5b3f-9ee9-5932-b39f-879642b9414c": {
    name: "Thunder Shot Jr.",
    imageItem: "18009",
    releases: {
      "dcaa9d00-fe3f-5bc4-9bfa-5bc1078e2087": {
        itemNumber: "18009",
        editionName: "Thunder Shot Jr.",
        releaseYear: 1988,
        chassis: "Type 1",
        verificationStatus: "verified",
        images: [img("18009")],
        sources: [official("c5976118-d051-5a9a-a86d-fbfd0cb7137a", "dcaa9d00-fe3f-5bc4-9bfa-5bc1078e2087", "18009", ["itemNumber", "chassis", "editionName"])],
      },
      "f4e3f6b8-8ce6-5b87-9d94-5f64a24c031a": {
        itemNumber: "18013",
        releaseType: "Color Special",
        editionType: "color_special",
        editionName: "Thunder Shot Jr. Black Special",
        releaseYear: 1988,
        chassis: "Type 1",
        color: "Black",
        verificationStatus: "verified",
        images: [img("18013")],
        notes: "Legacy 2015 Premium slot corrected to the documented 1988 Black Special; exact day intentionally left unset without stronger primary evidence.",
        sources: [official("8fab8cff-2fdc-596c-8ed9-769dce8fe124", "f4e3f6b8-8ce6-5b87-9d94-5f64a24c031a", "18013", ["itemNumber", "editionName", "color"])],
      },
    },
  },
}

export function applyCatalogCorrectionsBatch2(products: Product[]): Product[] {
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
      name: correction.name ?? product.name,
      images: [img(correction.imageItem)],
      releases,
      // Keep compatibility/cache fields derived from the corrected canonical release.
      itemNumber: canonicalRelease?.itemNumber,
      chassis: canonicalRelease?.chassis,
      originalReleaseYear: canonicalRelease?.releaseYear,
      hasMultipleReleases: releases.length > 1,
    }
  })
}
