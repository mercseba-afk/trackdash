import { getPublicLegoMarketSummary } from "@/lib/lego/market"
import { notFound } from "next/navigation"
import { SpeedChampionsCatalog } from "@/components/speed-champions/catalog"
import { canAccessSpeedChampions } from "@/lib/server/speed-champions-gate"
import { readSpeedChampionsPreview } from "@/lib/server/speed-champions-catalog"
export const dynamic = "force-dynamic"
export default async function Page() {
  if (!(await canAccessSpeedChampions())) notFound()
  const sets = await readSpeedChampionsPreview()
  const asOf = new Date().toISOString()
  const marketSummaries = Object.fromEntries(sets.map(set => [set.setNumber, getPublicLegoMarketSummary(set.setNumber, asOf)]))
  return <SpeedChampionsCatalog sets={sets} marketSummaries={marketSummaries} />
}
