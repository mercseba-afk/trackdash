import { speedChampionsSets } from "@/lib/lego/catalog"
import { loadLegoMarketSummaries } from "@/lib/server/lego-market"
import { notFound } from "next/navigation"
import { SpeedChampionsCatalog } from "@/components/speed-champions/catalog"
import { canBrowseSpeedChampions } from "@/lib/server/speed-champions-messaging-access"
export const dynamic = "force-dynamic"
export default async function Page() {
  if (!(await canBrowseSpeedChampions())) notFound()
  const asOf = new Date().toISOString()
  const marketSummaries = await loadLegoMarketSummaries(speedChampionsSets.map(set => set.setNumber), asOf)
  return <SpeedChampionsCatalog marketSummaries={marketSummaries} />
}
