import { setImagePath, speedChampionsPath, speedChampionsSets } from "@/lib/lego/catalog"
import { getRacingPreviewSnapshot } from "@/lib/server/racing-preview-snapshot"
import { releasePublicPath } from "@/lib/seo/catalog-paths"
import type { ShopCopy } from "@/lib/server/shop"

const examples = [
  { code: "18714", id: "00000000-0000-4000-8000-000000000001" },
  { code: "18069", id: "00000000-0000-4000-8000-000000000002" },
]

const legoExamples = [
  { code: "76934", id: "00000000-0000-4000-8000-000000000003" },
  { code: "77239", id: "00000000-0000-4000-8000-000000000004" },
]

export function racingPreviewListings(shareId?: string, catalog: "mini4wd" | "lego" = "mini4wd"): ShopCopy[] {
  if (catalog === "lego") {
    return legoExamples.filter((row) => !shareId || row.id === shareId).flatMap(({ id, code }) => {
      const set = speedChampionsSets.find(({ setNumber }) => setNumber === code)
      if (!set) return []
      return [{
        id, username: "TrackDash Demo", name: set.name, editionName: "LEGO Speed Champions",
        itemNumber: code, releaseYear: set.year, chassis: null,
        condition: "Sealed", askingPrice: null, askingCurrency: null,
        imageUrl: setImagePath(code, "box"), fallbackImageUrl: null, isCopyPhoto: false,
        releaseHref: speedChampionsPath(code), isMine: false,
      }]
    })
  }
  const { products } = getRacingPreviewSnapshot()
  return examples.filter((entry) => !shareId || entry.id === shareId).flatMap(({ id, code }) => {
    const product = products.find((item) => item.releases.some((release) => release.itemNumber === code))
    const release = product?.releases.find((item) => item.itemNumber === code)
    if (!product || !release) return []

    return [{
      id, username: "TrackDash Demo", name: product.name, editionName: release.editionName,
      itemNumber: code, releaseYear: release.releaseYear ?? null, chassis: release.chassis ?? null,
      condition: "Sealed", askingPrice: null, askingCurrency: null,
      imageUrl: release.images?.[0] ?? product.images?.[0] ?? null, fallbackImageUrl: null,
      isCopyPhoto: false, releaseHref: releasePublicPath(product, release), isMine: false,
    }]
  })
}
