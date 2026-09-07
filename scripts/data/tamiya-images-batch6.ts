import type { TamiyaImageEntry } from "./tamiya-images"

const officialImage = (item: string) =>
  `https://www.tamiya.com/japan_contents/img/usr/item/${item.startsWith("9") ? "9" : "1"}/${item}/${item}_1.jpg`
const officialPage = (item: string) => `https://www.tamiya.com/japan/products/${item}/index.html`

const release = (
  releaseSeedKey: string,
  item: string,
  note: string,
): TamiyaImageEntry => ({
  productSeedKey: "18709",
  releaseSeedKey,
  imageUrl: officialImage(item),
  tamiyaItemNumber: item,
  sourcePageUrl: officialPage(item),
  sourceDomain: "tamiya.com",
  sourceType: "official_manufacturer",
  note,
})

// Avante Jr. audit. The Product-level 18014 image already exists in the base
// manifest and is deliberately used as generic/fallback imagery. It is NOT
// attached to the 1988 original occurrence because the current official asset
// belongs to the 2024 reissue page.
export const TAMIYA_IMAGES_BATCH6: TamiyaImageEntry[] = [
  release("2", "18506", "Exact official image for the documented Avante Jr. Black Special 2012 reissue."),
  release("3", "95474", "Exact official image for Avante Jr. 30th Anniversary Special, released 2018-12-22."),
  release("4", "18014", "Exact current official image for the 2024 Avante Jr. reissue; never scoped to the 1988 original."),
  // 95501 is deliberately absent: the obvious official static item paths were
  // tested through TrackDash on 2026-09-07 and returned 404. Product fallback
  // is safer than inventing or hotlinking a third-party exact image.
]
