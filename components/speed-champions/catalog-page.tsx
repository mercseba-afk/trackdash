import { speedChampionsCatalogIsVisible } from "@/lib/lego/catalog-visibility"
import { notFound } from "next/navigation"
import { speedChampionsSets } from "@/lib/lego/catalog"
import { loadLegoMarketSummaries } from "@/lib/server/lego-market"
import { canBrowseSpeedChampions } from "@/lib/server/speed-champions-messaging-access"
import type { PublicLocale } from "@/lib/seo/catalog-paths"
import { SpeedChampionsCatalog } from "./catalog"

export async function SpeedChampionsCatalogPage({ locale, initialQuery = "" }: { locale: PublicLocale; initialQuery?: string }) {
  if (!speedChampionsCatalogIsVisible() && !(await canBrowseSpeedChampions())) notFound()
  const asOf = new Date().toISOString()
  const marketSummaries = await loadLegoMarketSummaries(speedChampionsSets.map(set => set.setNumber), asOf)
  return <SpeedChampionsCatalog key={initialQuery} marketSummaries={marketSummaries} locale={locale} initialQuery={initialQuery} />
}
