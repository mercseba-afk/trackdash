import { notFound } from "next/navigation"
import { AppPage } from "@/components/app-page"
import { ReleaseDetailScreen } from "@/components/screens/release-detail-screen"
import { fetchCatalogProductById } from "@/lib/actions/catalog"
import { getCatalogLocalizedCopy } from "@/lib/db/queries/catalog-copy"
import { getMarketSignalForRelease } from "@/lib/db/queries/market"
import type { ReleaseMarketSignalView, ReleaseMarketRegime, ReleaseMarketConfidence } from "@/lib/market/view-types"

export const revalidate = 45

function numberOrNull(value: string | number | null | undefined): number | null {
  if (value == null) return null
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

function toMarketSignalView(signal: Awaited<ReturnType<typeof getMarketSignalForRelease>> | null): ReleaseMarketSignalView | null {
  if (!signal) return null

  const valueEUR = numberOrNull(signal.marketValueEUR)
  const retailAnchorEUR = numberOrNull(signal.retailAnchorEUR)
  const activeAnchorEUR = numberOrNull(signal.activeAnchorEUR)
  const soldAnchorEUR = numberOrNull(signal.soldAnchorEUR)
  const hasMarketEvidence =
    (valueEUR != null && valueEUR > 0) ||
    (retailAnchorEUR != null && retailAnchorEUR > 0) ||
    (activeAnchorEUR != null && activeAnchorEUR > 0) ||
    (soldAnchorEUR != null && soldAnchorEUR > 0) ||
    signal.currentOfferCount > 0 ||
    signal.soldUnits > 0

  if (!hasMarketEvidence) return null

  return {
    marketRegime: signal.marketRegime as ReleaseMarketRegime,
    valueEUR: valueEUR != null && valueEUR > 0 ? valueEUR : null,
    lowEUR: numberOrNull(signal.lowEUR),
    highEUR: numberOrNull(signal.highEUR),
    confidenceScore: signal.confidenceScore,
    confidenceLabel: signal.confidenceLabel as ReleaseMarketConfidence,
    retailAnchorEUR,
    activeAnchorEUR,
    soldAnchorEUR,
    startingItemPriceEUR: numberOrNull(signal.startingItemPriceEUR),
    currentOfferCount: signal.currentOfferCount,
    soldUnits: signal.soldUnits,
    trendPercent: numberOrNull(signal.trendPercent),
    computedAt: signal.computedAt instanceof Date ? signal.computedAt.toISOString() : String(signal.computedAt),
  }
}

export default async function ReleasePage({
  params,
}: {
  params: Promise<{ id: string; releaseId: string }>
}) {
  const { id, releaseId } = await params

  const [product, dbMarketSignal, localizedCopy] = await Promise.all([
    fetchCatalogProductById(id).catch((error) => {
      console.error("Failed to load product for release detail:", error)
      return null
    }),
    getMarketSignalForRelease(releaseId).catch((error) => {
      console.error("Failed to load R3 market signal for release detail:", error)
      return null
    }),
    getCatalogLocalizedCopy(id).catch((error) => {
      console.error("Failed to load localized release copy:", error)
      return null
    }),
  ])

  if (!product) return notFound()

  const release = product.releases.find((candidate) => candidate.id === releaseId)
  if (!release) return notFound()

  return (
    <AppPage>
      <ReleaseDetailScreen
        product={product}
        release={release}
        localizedDescription={localizedCopy?.releases[releaseId]}
        marketSignal={toMarketSignalView(dbMarketSignal)}
      />
    </AppPage>
  )
}
