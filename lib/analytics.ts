import type {
  CollectionItem,
  MarketEstimate,
  Product,
  ProductRelease,
  WishlistItem,
} from "@/lib/types"
import { getProductEstimate, getReleaseEstimate } from "@/lib/data/market"
import { getProductById, resolveRelease } from "@/lib/data/products"

// Human label for a release as owned, e.g. "1990 Original" or "2026 Reissue".
// Respects a per-item release-year override without mutating shared data.
export function releaseLabel(release: ProductRelease, displayYear?: number): string {
  const year = displayYear ?? release.releaseYear
  // Catalog Model V2 hardening (point 2): year can be genuinely unknown.
  return `${year ?? "—"} ${release.releaseType}`
}

export interface EnrichedCollectionItem {
  item: CollectionItem
  product: Product
  release: ProductRelease
  estimate: MarketEstimate
  displayYear?: number // release-year override if set, else the release year; undefined when genuinely unknown
  label: string // e.g. "2026 Reissue"
}

export function enrichCollection(collection: CollectionItem[]): EnrichedCollectionItem[] {
  return collection
    .map((item): EnrichedCollectionItem | null => {
      const product = getProductById(item.productId)
      if (!product) return null
      const release = resolveRelease(product, item.releaseId)
      const estimate = getReleaseEstimate(product, release, item.condition)
      const displayYear = item.releaseYearOverride ?? release.releaseYear
      return { item, product, release, estimate, displayYear, label: releaseLabel(release, displayYear) }
    })
    .filter((x): x is EnrichedCollectionItem => x !== null)
}

export interface PortfolioSummary {
  count: number
  uniqueProducts: number
  uniqueReleases: number
  marketValue: number
  acquisitionCost: number
  gain: number
  gainPercent: number
  avgTrend90d: number
  sealedCount: number
}

export function portfolioSummary(enriched: EnrichedCollectionItem[]): PortfolioSummary {
  const marketValue = enriched.reduce((sum, e) => sum + e.estimate.value, 0)
  const acquisitionCost = enriched.reduce((sum, e) => sum + e.item.acquisitionPrice, 0)
  const gain = marketValue - acquisitionCost
  const uniqueProducts = new Set(enriched.map((e) => e.product.id)).size
  const uniqueReleases = new Set(enriched.map((e) => e.release.id)).size
  const avgTrend90d =
    enriched.length > 0
      ? Math.round(enriched.reduce((s, e) => s + e.estimate.trend90d, 0) / enriched.length)
      : 0
  return {
    count: enriched.length,
    uniqueProducts,
    uniqueReleases,
    marketValue,
    acquisitionCost,
    gain,
    gainPercent: acquisitionCost > 0 ? Math.round((gain / acquisitionCost) * 100) : 0,
    avgTrend90d,
    sealedCount: enriched.filter((e) => e.item.condition === "Sealed").length,
  }
}

export interface Breakdown {
  label: string
  count: number
  value: number
}

export function breakdownBy(
  enriched: EnrichedCollectionItem[],
  key: (e: EnrichedCollectionItem) => string,
): Breakdown[] {
  const map = new Map<string, Breakdown>()
  for (const e of enriched) {
    const label = key(e)
    const cur = map.get(label) ?? { label, count: 0, value: 0 }
    cur.count += 1
    cur.value += e.estimate.value
    map.set(label, cur)
  }
  return Array.from(map.values()).sort((a, b) => b.value - a.value)
}

export function topValued(enriched: EnrichedCollectionItem[], n = 5): EnrichedCollectionItem[] {
  return [...enriched].sort((a, b) => b.estimate.value - a.estimate.value).slice(0, n)
}

export function recentAdditions(enriched: EnrichedCollectionItem[], n = 6): EnrichedCollectionItem[] {
  return [...enriched]
    .sort((a, b) => +new Date(b.item.createdAt) - +new Date(a.item.createdAt))
    .slice(0, n)
}

// Count how many physical copies of a given release the collector owns — used to
// surface "×2" aggregation while still tracking each copy as its own item.
export function releaseOwnedCount(enriched: EnrichedCollectionItem[], releaseId: string): number {
  return enriched.filter((e) => e.release.id === releaseId).length
}

// All collection items belonging to one model (across every release), for the
// "Your collection" section on the product page.
export function itemsForProduct(
  enriched: EnrichedCollectionItem[],
  productId: string,
): EnrichedCollectionItem[] {
  return enriched.filter((e) => e.product.id === productId)
}

export interface EnrichedWishlistItem {
  item: WishlistItem
  product: Product
  release?: ProductRelease
  estimate: MarketEstimate
  label?: string
  belowTarget: boolean
}

export function enrichWishlist(wishlist: WishlistItem[]): EnrichedWishlistItem[] {
  return wishlist
    .map((item): EnrichedWishlistItem | null => {
      const product = getProductById(item.productId)
      if (!product) return null
      // If a specific release is targeted, value that; otherwise the whole model.
      const release = item.releaseId ? resolveRelease(product, item.releaseId) : undefined
      const estimate = release
        ? getReleaseEstimate(product, release)
        : getProductEstimate(product)
      const belowTarget = item.targetPrice ? estimate.value <= item.targetPrice : false
      return {
        item,
        product,
        release,
        estimate,
        label: release ? releaseLabel(release) : undefined,
        belowTarget,
      }
    })
    .filter((x): x is EnrichedWishlistItem => x !== null)
}
