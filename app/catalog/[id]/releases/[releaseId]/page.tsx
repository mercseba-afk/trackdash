import { notFound } from "next/navigation"
import { AppPage } from "@/components/app-page"
import { ReleaseDetailScreen } from "@/components/screens/release-detail-screen"
import { fetchCatalogProductById } from "@/lib/actions/catalog"
import { getCatalogLocalizedCopy } from "@/lib/db/queries/catalog-copy"
import { getPublicMarketSignalForRelease } from "@/lib/market/public"

export const revalidate = 45

export default async function ReleasePage({
  params,
}: {
  params: Promise<{ id: string; releaseId: string }>
}) {
  const { id, releaseId } = await params

  const [product, marketSignal, localizedCopy] = await Promise.all([
    fetchCatalogProductById(id).catch((error) => {
      console.error("Failed to load product for release detail:", error)
      return null
    }),
    getPublicMarketSignalForRelease(releaseId).catch((error) => {
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
        marketSignal={marketSignal}
      />
    </AppPage>
  )
}
