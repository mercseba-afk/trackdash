import type { TamiyaImageEntry } from "./tamiya-images"

const officialImage = (item: string) =>
  `https://www.tamiya.com/japan_contents/img/usr/item/${item.startsWith("9") ? "9" : "1"}/${item}/${item}_1.jpg`
const officialPage = (item: string) => `https://www.tamiya.com/japan/products/${item}/index.html`

const product = (productSeedKey: string, item: string, note: string): TamiyaImageEntry => ({
  productSeedKey,
  imageUrl: officialImage(item),
  tamiyaItemNumber: item,
  sourcePageUrl: officialPage(item),
  sourceDomain: "tamiya.com",
  sourceType: "official_manufacturer",
  note,
})

const release = (
  productSeedKey: string,
  releaseSeedKey: string,
  item: string,
  note: string,
): TamiyaImageEntry => ({
  productSeedKey,
  releaseSeedKey,
  imageUrl: officialImage(item),
  tamiyaItemNumber: item,
  sourcePageUrl: officialPage(item),
  sourceDomain: "tamiya.com",
  sourceType: "official_manufacturer",
  note,
})

// Image Audit batch 4 — first pass over Product rows that had no Product-level
// image. Product images are allowed as generic/fallback identity imagery.
// Release-level entries below are present ONLY where the official item-scoped
// asset is attributable to that concrete occurrence. Historical originals for
// Fire Dragon, Manta Ray and Mad Bull deliberately use Product fallback instead
// of claiming a modern/reissue asset as an archival exact release image.
export const TAMIYA_IMAGES_BATCH4: TamiyaImageEntry[] = [
  // Product-level main images.
  product("19412", "18033", "Official Astute Jr. item image; Product-level identity image and fallback."),
  product("18092", "18715", "Official Copperfang (FM-A) item image; Product-level identity image and fallback."),
  product("19415", "18030", "Official Dash-0 Horizon item image; Product-level identity image and fallback."),
  product("18704", "18022", "Official Dash-4 Cannonball item image; Product-level identity image and fallback."),
  product("19414", "18011", "Official Fire Dragon Jr. item image used at Product level only for the historical original fallback."),
  product("19413", "18035", "Official Manta Ray Jr. item image used at Product level only for the historical original fallback."),
  product("18615", "18056", "Official Mad Bull Jr. item image from the documented 2013 re-release; Product fallback only for the 2003 original."),
  product("18075", "18009", "Official Thunder Shot Jr. item image; Product-level identity image and fallback."),

  // Exact release images.
  release("19412", "2", "18077", "Exact official image for Astute RS (Super-II), 2013 release."),

  release("18092", "1", "18715", "Exact official image for Copperfang (FM-A), 2019 release."),
  release("18092", "2", "95589", "Exact official image for Copperfang Black Special (FM-A), 2020 release."),

  release("19415", "1", "18030", "Exact official item-scoped image for Dash-0 Horizon."),
  release("19415", "2", "18073", "Exact official image for Dash-0 Horizon Premium (Super-II), 2012 release."),

  release("18704", "1", "18022", "Exact official item-scoped image for Dash-4 Cannonball."),
  release("18704", "2", "95225", "Exact official image for Dash-4 Cannonball Premium (Super-II), 2015 release."),

  release("19414", "2", "18072", "Exact official image for Fire Dragon Premium (VS), 2012 release."),
  release("19413", "2", "18053", "Exact official image for Manta Ray Jr. (VS Chassis), 2003 release."),
  release("18615", "2", "18056", "Exact official image for the documented Mad Bull Jr. 2013 re-release."),

  release("18075", "1", "18009", "Exact official item-scoped image for Thunder Shot Jr."),
  release("18075", "2", "18013", "Exact official image for Thunder Shot Jr. Black Special."),
]
