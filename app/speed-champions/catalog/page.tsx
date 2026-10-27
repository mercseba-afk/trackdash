import { speedChampionsSets } from "@/lib/lego/catalog"
import { getPublicLegoMarketSummary } from "@/lib/lego/market"
import { notFound } from "next/navigation"
import { SpeedChampionsCatalog } from "@/components/speed-champions/catalog"
import { canAccessSpeedChampions } from "@/lib/server/speed-champions-gate"
export const dynamic = "force-dynamic"
export default async function Page() {
  if (!(await canAccessSpeedChampions())) notFound()
  const asOf = new Date().toISOString()
  const marketSummaries = Object.fromEntries(speedChampionsSets.map(set => [set.setNumber, getPublicLegoMarketSummary(set.setNumber, asOf)]))
  return <SpeedChampionsCatalog marketSummaries={marketSummaries} />
}
