import type { CollectionItem, MarketEstimate, Product, WishlistItem } from "@/lib/types"
import { getMarketEstimate } from "@/lib/data/market"
import { getProductById } from "@/lib/data/products"

export interface EnrichedCollectionItem {
  item: CollectionItem
  product: Product
  estimate: MarketEstimate
  variantName?: string
}

export function enrichCollection(collection: CollectionItem[]): EnrichedCollectionItem[] {
  return collection
    .map((item): EnrichedCollectionItem | null => {
      const product = getProductById(item.productId)
      if (!product) return null
      const estimate = getMarketEstimate(product)
      const variantName = product.variants.find((v) => v.id === item.variantId)?.variantName
      return { item, product, estimate, variantName }
    })
    .filter((x): x is EnrichedCollectionItem => x !== null)
}

export interface PortfolioSummary {
  count: number
  uniqueProducts: number
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
  const avgTrend90d =
    enriched.length > 0
      ? Math.round(enriched.reduce((s, e) => s + e.estimate.trend90d, 0) / enriched.length)
      : 0
  return {
    count: enriched.length,
    uniqueProducts,
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

export interface EnrichedWishlistItem {
  item: WishlistItem
  product: Product
  estimate: MarketEstimate
  variantName?: string
  belowTarget: boolean
}

export function enrichWishlist(wishlist: WishlistItem[]): EnrichedWishlistItem[] {
  return wishlist
    .map((item): EnrichedWishlistItem | null => {
      const product = getProductById(item.productId)
      if (!product) return null
      const estimate = getMarketEstimate(product)
      const variantName = product.variants.find((v) => v.id === item.variantId)?.variantName
      const belowTarget = item.targetPrice ? estimate.value <= item.targetPrice : false
      return { item, product, estimate, variantName, belowTarget }
    })
    .filter((x): x is EnrichedWishlistItem => x !== null)
}
