import { getRacingPreviewSnapshot } from "@/lib/server/racing-preview-snapshot"
import { releasePublicPath } from "@/lib/seo/catalog-paths"
import type { ShopCopy } from "@/lib/server/shop"

const examples = [
  { code: "18714", id: "00000000-0000-4000-8000-000000000001" },
  { code: "18069", id: "00000000-0000-4000-8000-000000000002" },
]

export function racingPreviewListings(shareId?: string): ShopCopy[] {
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
