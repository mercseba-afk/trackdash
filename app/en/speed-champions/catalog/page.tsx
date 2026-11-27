import { SpeedChampionsCatalogPage } from "@/components/speed-champions/catalog-page"
import { speedChampionsMetadata } from "@/lib/lego/seo"

export const dynamic = "force-dynamic"
export const metadata = speedChampionsMetadata("en")

export default function Page() {
  return <SpeedChampionsCatalogPage locale="en" />
}
