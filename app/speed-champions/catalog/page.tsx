import { notFound } from "next/navigation"
import { SpeedChampionsCatalog } from "@/components/speed-champions/catalog"
import { canAccessSpeedChampions } from "@/lib/server/speed-champions-gate"
export const dynamic = "force-dynamic"
export default async function Page() {
  if (!(await canAccessSpeedChampions())) notFound()
  return <SpeedChampionsCatalog asOf={new Date().toISOString()} />
}
