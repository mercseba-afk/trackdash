import { notFound } from "next/navigation"
import { AppPage } from "@/components/app-page"
import { ReleaseDetailScreen } from "@/components/screens/release-detail-screen"
import { fetchCatalogProductById } from "@/lib/actions/catalog"

export const revalidate = 45

export default async function ReleasePage({
  params,
}: {
  params: Promise<{ id: string; releaseId: string }>
}) {
  const { id, releaseId } = await params

  const product = await fetchCatalogProductById(id).catch((error) => {
    console.error("Failed to load product for release detail:", error)
    return null
  })
  if (!product) return notFound()

  const release = product.releases.find((candidate) => candidate.id === releaseId)
  if (!release) return notFound()

  return (
    <AppPage>
      <ReleaseDetailScreen product={product} release={release} />
    </AppPage>
  )
}
