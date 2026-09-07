import type { TamiyaImageEntry } from "./tamiya-images"

const officialImage = (item: string) =>
  `https://www.tamiya.com/japan_contents/img/usr/item/${item.startsWith("9") ? "9" : "1"}/${item}/${item}_1.jpg`

const entry = (
  productSeedKey: string,
  item: string,
  sourcePageUrl: string,
  note: string,
  releaseSeedKey?: string,
): TamiyaImageEntry => ({
  productSeedKey,
  ...(releaseSeedKey ? { releaseSeedKey } : {}),
  imageUrl: officialImage(item),
  tamiyaItemNumber: item,
  sourcePageUrl,
  sourceDomain: "tamiya.com",
  sourceType: "official_manufacturer",
  note,
})

// Image Audit batch 5 — hierarchy/identity cleanup for three legacy Product rows.
// All image URLs are item-scoped Tamiya assets and were verified through the
// TrackDash production Next image optimizer. 94990 and 95273 are intentionally
// absent at release level because their historical official assets currently 404;
// those releases must use Aero Thunder Shot's Product fallback image.
export const TAMIYA_IMAGES_BATCH5: TamiyaImageEntry[] = [
  // Dyipne: ITEM 95551 is the original 2019 occurrence; current Tamiya ITEM 18717
  // explicitly states it has the same contents as the 2019 95551 product.
  entry(
    "18717",
    "95551",
    "https://www.tamiya.com/japan/products/18717/index.html",
    "Official item-scoped 95551 asset used as Dyipne Product identity image; current Tamiya 18717 page explicitly identifies ITEM 95551 as the 2019 Dyipne occurrence.",
  ),
  entry(
    "18717",
    "95551",
    "https://www.tamiya.com/japan/products/18717/index.html",
    "Exact official item-scoped asset for the original 2019 ITEM 95551 Dyipne occurrence, corroborated by Tamiya's current 18717 page.",
    "1",
  ),
  entry(
    "18717",
    "18717",
    "https://www.tamiya.com/japan/products/18717/index.html",
    "Exact official image for the documented 2025 Japan reissue of Dyipne.",
    "2",
  ),

  // Aero Thunder Shot family.
  entry(
    "18718",
    "18702",
    "https://www.tamiya.com/japan/products/18702/index.html",
    "Official Aero Thunder Shot ITEM 18702 image; Product-level identity image and fallback for historical releases without an attributable surviving official asset.",
  ),
  entry(
    "18718",
    "18702",
    "https://www.tamiya.com/japan/products/18702/index.html",
    "Exact official image for the canonical 2012 Aero Thunder Shot ITEM 18702 release.",
    "1",
  ),
  entry(
    "18718",
    "94967",
    "https://www.tamiya.com/japan/mini4wd/feature/2019/0612.html",
    "Exact Tamiya item-scoped asset for Aero Thunder Shot Japan Cup 2013 Limited. Tamiya's Japan Cup retrospective confirms the edition; item identity is independently corroborated in the catalog evidence layer.",
    "2",
  ),
  entry(
    "18718",
    "95286",
    "https://www.tamiya.com/japan/products/95286/index.html",
    "Exact official image for Aero Thunder Shot Black Special (AR Chassis), 2017 release.",
    "5",
  ),

  // Mach-Bullet.
  entry(
    "18091",
    "18091",
    "https://www.tamiya.com/japan/products/18091/index.html",
    "Official Mach-Bullet ITEM 18091 image; Product-level identity image and fallback.",
  ),
  entry(
    "18091",
    "18091",
    "https://www.tamiya.com/japan/products/18091/index.html",
    "Exact official image for Mach-Bullet (VS Chassis), 2018 release.",
    "1",
  ),
]
