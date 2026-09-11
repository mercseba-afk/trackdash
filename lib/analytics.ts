import type {
  CollectionItem,
  Condition,
  Product,
  ProductRelease,
  WishlistItem,
} from "@/lib/types"
import type {
  ReleaseMarketSignalMap,
  ReleaseMarketSignalView,
} from "@/lib/market/view-types"
import { getProductById, resolveRelease } from "@/lib/data/corrected-products"

// Human label for a release as owned, e.g. "1990 Original" or "2026 Reissue".
// Respects a per-item release-year override without mutating shared data.
export function releaseLabel(release: ProductRelease, displayYear?: number): string {
  const year = displayYear ?? release.releaseYear
  return `${year ?? "—"} ${release.releaseType}`
}

// R3 currently publishes a reference market for complete, new, unbuilt kits.
// Sealed and New / Opened collection states can use that release-level reference
// without inventing a condition multiplier. Built/Used/Incomplete deliberately
// remain unvalued until condition-specific evidence exists.
export function conditionUsesNewUnbuiltReference(condition: Condition): boolean {
  return condition === "Sealed" || condition === "New / Opened"
}

export interface EnrichedCollectionItem {
  item: CollectionItem
  product: Product
  release: ProductRelease
  marketSignal: ReleaseMarketSignalView | null
  marketValue: number | null
  marketTrend: number | null
  /**
   * Personal performance is deliberately separate from the release market
   * trend. Until historical FX lands, only EUR acquisition prices can be
   * compared with today's EUR Market Value without inventing a conversion.
   */
  personalGainEUR: number | null
  personalGainPercent: number | null
  displayYear?: number
  label: string
}

export function enrichCollection(
  collection: CollectionItem[],
  marketSignals: ReleaseMarketSignalMap = {},
): EnrichedCollectionItem[] {
  return collection
    .map((item): EnrichedCollectionItem | null => {
      const product = getProductById(item.productId)
      if (!product) return null
      const release = resolveRelease(product, item.releaseId)
      const marketSignal = marketSignals[release.id] ?? null
      const comparableCondition = conditionUsesNewUnbuiltReference(item.condition)
      const marketValue = comparableCondition ? marketSignal?.valueEUR ?? null : null
      const marketTrend = comparableCondition ? marketSignal?.trendPercent ?? null : null
      const canCalculatePersonalPerformance =
        marketValue != null &&
        item.acquisitionCurrency === "EUR" &&
        item.acquisitionPrice > 0
      const personalGainEUR = canCalculatePersonalPerformance
        ? marketValue - item.acquisitionPrice
        : null
      const personalGainPercent = canCalculatePersonalPerformance
        ? (personalGainEUR! / item.acquisitionPrice) * 100
        : null
      const displayYear = item.releaseYearOverride ?? release.releaseYear
      return {
        item,
        product,
        release,
        marketSignal,
        marketValue,
        marketTrend,
        personalGainEUR,
        personalGainPercent,
        displayYear,
        label: releaseLabel(release, displayYear),
      }
    })
    .filter((x): x is EnrichedCollectionItem => x !== null)
}

export interface PortfolioSummary {
  count: number
  uniqueProducts: number
  uniqueReleases: number
  marketValue: number
  marketValueCount: number
  /** Sum of purchase prices that are already denominated in EUR. */
  acquisitionCost: number
  acquisitionCostCount: number
  /** EUR purchase basis for copies that also have a comparable R3 value. */
  trackedAcquisitionCost: number
  gain: number
  gainPercent: number
  gainCount: number
  avgTrend90d: number | null
  trendCount: number
  sealedCount: number
}

export function portfolioSummary(enriched: EnrichedCollectionItem[]): PortfolioSummary {
  const valued = enriched.filter((entry) => entry.marketValue != null)
  const marketValue = valued.reduce((sum, entry) => sum + (entry.marketValue ?? 0), 0)

  // Never add USD/JPY/GBP amounts directly to EUR. Foreign-currency purchase
  // history remains visible per copy and will enter these totals only after the
  // historical-FX module can establish a dated EUR basis.
  const eurPurchases = enriched.filter(
    (entry) => entry.item.acquisitionCurrency === "EUR" && entry.item.acquisitionPrice > 0,
  )
  const acquisitionCost = eurPurchases.reduce((sum, entry) => sum + entry.item.acquisitionPrice, 0)

  const performanceEntries = enriched.filter(
    (entry) => entry.personalGainEUR != null && entry.personalGainPercent != null,
  )
  const trackedAcquisitionCost = performanceEntries.reduce(
    (sum, entry) => sum + entry.item.acquisitionPrice,
    0,
  )
  const gain = performanceEntries.reduce((sum, entry) => sum + (entry.personalGainEUR ?? 0), 0)
  const uniqueProducts = new Set(enriched.map((entry) => entry.product.id)).size
  const uniqueReleases = new Set(enriched.map((entry) => entry.release.id)).size
  const trends = valued
    .map((entry) => entry.marketTrend)
    .filter((value): value is number => value != null)
  const avgTrend90d = trends.length > 0
    ? Math.round((trends.reduce((sum, value) => sum + value, 0) / trends.length) * 10) / 10
    : null

  return {
    count: enriched.length,
    uniqueProducts,
    uniqueReleases,
    marketValue,
    marketValueCount: valued.length,
    acquisitionCost,
    acquisitionCostCount: eurPurchases.length,
    trackedAcquisitionCost,
    gain,
    gainPercent: trackedAcquisitionCost > 0 ? (gain / trackedAcquisitionCost) * 100 : 0,
    gainCount: performanceEntries.length,
    avgTrend90d,
    trendCount: trends.length,
    sealedCount: enriched.filter((entry) => entry.item.condition === "Sealed").length,
  }
}

export interface Breakdown {
  label: string
  count: number
  valuedCount: number
  value: number
}

export function breakdownBy(
  enriched: EnrichedCollectionItem[],
  key: (entry: EnrichedCollectionItem) => string,
): Breakdown[] {
  const map = new Map<string, Breakdown>()
  for (const entry of enriched) {
    const label = key(entry)
    const current = map.get(label) ?? { label, count: 0, valuedCount: 0, value: 0 }
    current.count += 1
    if (entry.marketValue != null) {
      current.valuedCount += 1
      current.value += entry.marketValue
    }
    map.set(label, current)
  }
  return Array.from(map.values()).sort((a, b) => b.value - a.value)
}

export function topValued(enriched: EnrichedCollectionItem[], n = 5): EnrichedCollectionItem[] {
  return enriched
    .filter((entry) => entry.marketValue != null)
    .sort((a, b) => (b.marketValue ?? 0) - (a.marketValue ?? 0))
    .slice(0, n)
}

export function recentAdditions(enriched: EnrichedCollectionItem[], n = 6): EnrichedCollectionItem[] {
  return [...enriched]
    .sort((a, b) => +new Date(b.item.createdAt) - +new Date(a.item.createdAt))
    .slice(0, n)
}

export function releaseOwnedCount(enriched: EnrichedCollectionItem[], releaseId: string): number {
  return enriched.filter((entry) => entry.release.id === releaseId).length
}

export function itemsForProduct(
  enriched: EnrichedCollectionItem[],
  productId: string,
): EnrichedCollectionItem[] {
  return enriched.filter((entry) => entry.product.id === productId)
}

export interface EnrichedWishlistItem {
  item: WishlistItem
  product: Product
  release?: ProductRelease
  marketSignal: ReleaseMarketSignalView | null
  marketValue: number | null
  currentPrice: number | null
  label?: string
  belowTarget: boolean
}

function lowestStartingPrice(product: Product, marketSignals: ReleaseMarketSignalMap): number | null {
  let lowest: number | null = null
  for (const release of product.releases) {
    const price = marketSignals[release.id]?.startingItemPriceEUR
    if (price == null || price <= 0) continue
    if (lowest == null || price < lowest) lowest = price
  }
  return lowest
}

export function enrichWishlist(
  wishlist: WishlistItem[],
  marketSignals: ReleaseMarketSignalMap = {},
): EnrichedWishlistItem[] {
  return wishlist
    .map((item): EnrichedWishlistItem | null => {
      const product = getProductById(item.productId)
      if (!product) return null
      const release = item.releaseId ? resolveRelease(product, item.releaseId) : undefined
      const marketSignal = release ? marketSignals[release.id] ?? null : null
      const marketValue = release ? marketSignal?.valueEUR ?? null : null
      const currentPrice = release
        ? marketSignal?.startingItemPriceEUR ?? null
        : lowestStartingPrice(product, marketSignals)
      const belowTarget = item.targetPrice != null && currentPrice != null
        ? currentPrice <= item.targetPrice
        : false

      return {
        item,
        product,
        release,
        marketSignal,
        marketValue,
        currentPrice,
        label: release ? releaseLabel(release) : undefined,
        belowTarget,
      }
    })
    .filter((x): x is EnrichedWishlistItem => x !== null)
}
