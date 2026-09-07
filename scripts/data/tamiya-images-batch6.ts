import type { TamiyaImageEntry } from "./tamiya-images"

const officialImage = (item: string) =>
  `https://www.tamiya.com/japan_contents/img/usr/item/${item.startsWith("9") ? "9" : "1"}/${item}/${item}_1.jpg`

const releaseImage = (
  productSeedKey: string,
  releaseSeedKey: string,
  item: string,
  sourcePageUrl: string,
  note: string,
): TamiyaImageEntry => ({
  productSeedKey,
  releaseSeedKey,
  imageUrl: officialImage(item),
  tamiyaItemNumber: item,
  sourcePageUrl,
  sourceDomain: "tamiya.com",
  sourceType: "official_manufacturer",
  note,
})

// Full Catalog Audit — final foundation image batch.
// Only item-scoped official Tamiya assets attributable to the exact commercial
// release are included. Raikiri Japan Cup 2016, the 1988 Emperor original and
// the initial 2017 Emperor Black Special deliberately remain on Product fallback
// because this pass does not have an attributable release-exact archival asset.
export const TAMIYA_IMAGES_BATCH6: TamiyaImageEntry[] = [
  releaseImage("18626", "2", "95062", "https://www.tamiya.com/japan/products/95062/index.html", "Exact official image for Aero Avante Violet Special (Clear Body), ITEM 95062."),
  releaseImage("18626", "4", "95267", "https://www.tamiya.com/japan/products/95267/index.html", "Exact official image for Aero Avante Gold Metallic, ITEM 95267."),
  releaseImage("18626", "5", "95268", "https://www.tamiya.com/japan/products/95268/index.html", "Exact official image for Aero Avante Blue Metallic, ITEM 95268."),
  releaseImage("18626", "6", "95269", "https://www.tamiya.com/japan/products/95269/index.html", "Exact official image for Aero Avante Black Metallic, ITEM 95269."),

  releaseImage("18646", "3", "95417", "https://www.tamiya.com/japan/products/95417/index.html", "Exact official image for Raikiri Matte Pink Plated, ITEM 95417."),
  releaseImage("18646", "4", "95486", "https://www.tamiya.com/japan/products/95486/index.html", "Exact official image for Raikiri Pink Special (Polycarbonate Body), ITEM 95486."),

  releaseImage("18716", "2", "95648", "https://www.tamiya.com/japan/products/95648/index.html", "Exact official image for Super Avante Jr. Black Special, ITEM 95648."),

  releaseImage("18095", "2", "95203", "https://www.tamiya.com/japan/products/95203/index.html", "Exact official image for Shadow Shark Yellow Special, ITEM 95203."),
  releaseImage("18095", "3", "95224", "https://www.tamiya.com/japan/products/95224/index.html", "Exact official image for Shadow Shark Italia Special, ITEM 95224."),

  releaseImage("18647", "2", "95372", "https://www.tamiya.com/japan/products/95372/index.html", "Exact official image for DCR-01 Purple Special, ITEM 95372."),
  releaseImage("18660", "2", "95100", "https://www.tamiya.com/japan/products/95100/index.html", "Exact official image for Tri Gale Japan Cup 2017, ITEM 95100."),

  releaseImage("18025", "7", "18625", "https://www.tamiya.com/japan/products/18625/index.html", "Exact official image for Dash-1 Emperor (MS Chassis), ITEM 18625."),
]
