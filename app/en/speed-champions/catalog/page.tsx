import { SpeedChampionsCatalogPage } from "@/components/speed-champions/catalog-page"
import { speedChampionsMetadata } from "@/lib/lego/seo"

export const dynamic = "force-dynamic"
export const metadata = speedChampionsMetadata("en")

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const { q } = await searchParams
  const initialQuery = Array.isArray(q) ? q[0] : q
  return <SpeedChampionsCatalogPage locale="en" initialQuery={initialQuery} />
}
