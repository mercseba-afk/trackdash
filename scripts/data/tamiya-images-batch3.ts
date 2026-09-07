import type { TamiyaImageEntry } from "./tamiya-images.ts"

// Image Audit batch 3 — exact images for legacy release identities corrected
// by lib/data/catalog-release-corrections.ts and migration 0021.
// Identity remains TrackDash productSeedKey + releaseSeedKey; item numbers are
// verification metadata only and never participate in UUID generation.
export const TAMIYA_IMAGES_BATCH3: TamiyaImageEntry[] = [
  {
    productSeedKey: "18025",
    releaseSeedKey: "3",
    imageUrl: "https://www.tamiya.com/japan_contents/img/usr/item/9/95296/95296_1.jpg",
    tamiyaItemNumber: "95296",
    sourcePageUrl: "https://www.tamiya.com/japan/products/95296/index.html",
    sourceDomain: "tamiya.com",
    sourceType: "official_manufacturer",
    note: "Exact image for the documented 2023 reissue of Dash-1 Emperor (MS Chassis) Black Special, item 95296. The official page states initial release month February 2017; this current asset is not treated as archival proof of the 2017 occurrence.",
  },
  {
    productSeedKey: "18025",
    releaseSeedKey: "4",
    imageUrl: "https://www.tamiya.com/japan_contents/img/usr/item/9/95110/95110_1.jpg",
    tamiyaItemNumber: "95110",
    sourcePageUrl: "https://www.tamiya.com/japan/products/95110/index.html",
    sourceDomain: "tamiya.com",
    sourceType: "official_manufacturer",
    note: "Exact Dash-1 Emperor Memorial (MS Chassis) 30 Years of the Japan Cup image; official Tamiya item 95110 page confirms 2018-06-23.",
  },
  {
    productSeedKey: "18626",
    releaseSeedKey: "3",
    imageUrl: "https://www.tamiya.com/japan_contents/img/usr/item/9/95376/95376_1.jpg",
    tamiyaItemNumber: "95376",
    sourcePageUrl: "https://www.tamiya.com/japan/products/95376/index.html",
    sourceDomain: "tamiya.com",
    sourceType: "official_manufacturer",
    note: "Exact Aero Avante Black Special (AR Chassis) image; official Tamiya item 95376 page confirms 2018-02-10.",
  },
]
