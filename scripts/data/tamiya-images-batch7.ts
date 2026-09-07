import type { TamiyaImageEntry } from "./tamiya-images"

const officialImage = (item: string) =>
  `https://www.tamiya.com/japan_contents/img/usr/item/${item.startsWith("9") ? "9" : "1"}/${item}/${item}_1.jpg`

const releaseImage = (
  releaseSeedKey: string,
  item: string,
  sourcePageUrl: string,
  note: string,
): TamiyaImageEntry => ({
  productSeedKey: "18709",
  releaseSeedKey,
  imageUrl: officialImage(item),
  tamiyaItemNumber: item,
  sourcePageUrl,
  sourceDomain: "tamiya.com",
  sourceType: "official_manufacturer",
  note,
})

// Repo parity for the Avante Jr. correction already verified live.
// The 1988 original deliberately uses Product fallback because the current
// 18014 asset belongs to the documented 2024 reissue occurrence. ITEM 95501
// also remains fallback because the obvious official static asset path 404s.
export const TAMIYA_IMAGES_BATCH7: TamiyaImageEntry[] = [
  releaseImage("2", "18506", "https://www.tamiya.com/japan/products/18506/index.html", "Exact official image for Avante Jr. Black Special (2012 Reissue), ITEM 18506."),
  releaseImage("3", "95474", "https://www.tamiya.com/japan/products/95474/index.html", "Exact official image for Avante Jr. 30th Anniversary Special, ITEM 95474."),
  releaseImage("4", "18014", "https://www.tamiya.com/japan/products/18014/index.html", "Exact official current image for the documented 2024 Avante Jr. reissue of ITEM 18014."),
]
