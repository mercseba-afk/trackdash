import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { speedChampionsCatalogIsPublic, speedChampionsCatalogIsVisible } from "@/lib/lego/catalog-visibility"
import { setImagePath, speedChampionsPath, speedChampionsSetName, speedChampionsSets } from "@/lib/lego/catalog"
import { formatLegoPrice } from "@/lib/lego/price-format"
import { getLegoObservedSales } from "@/lib/lego/market"
import { isRacingStudioEnabled } from "@/lib/racing-studio"
import { canBrowseSpeedChampions } from "@/lib/server/speed-champions-messaging-access"
import { loadLegoMarketSummaries } from "@/lib/server/lego-market"
import { publicAbsoluteUrl, publicLanguageAlternates, type PublicLocale } from "@/lib/seo/catalog-paths"

export function legoMarketMetadata(locale: PublicLocale): Metadata {
  const path = "/speed-champions/market"
  return {
    title: locale === "it" ? "Prezzi e vendite LEGO Speed Champions | TrackDash" : "LEGO Speed Champions Prices & Sales | TrackDash",
    description: locale === "it" ? "Confronta i prezzi negli annunci e le vendite osservate per ogni set LEGO Speed Champions." : "Compare listing prices and observed sales by LEGO Speed Champions set.",
    alternates: { canonical: publicAbsoluteUrl(path, locale), languages: publicLanguageAlternates(path) },
    robots: { index: speedChampionsCatalogIsPublic && isRacingStudioEnabled(), follow: speedChampionsCatalogIsPublic && isRacingStudioEnabled() },
  }
}

export async function LegoMarketPage({ locale }: { locale: PublicLocale }) {
  if (!isRacingStudioEnabled() || (!speedChampionsCatalogIsVisible() && !(await canBrowseSpeedChampions()))) notFound()
  const it = locale === "it"
  const asOf = new Date().toISOString()
  const summaries = await loadLegoMarketSummaries(speedChampionsSets.map((set) => set.setNumber), asOf)
  const entries = speedChampionsSets.map((set) => ({
    set, market: summaries[set.setNumber], sales: getLegoObservedSales(set.setNumber, asOf).length,
  })).sort((a, b) => b.sales - a.sales || b.market.askingCount - a.market.askingCount)

  return (
    <section>
      <header className="racing-page-intro">
        <p className="racing-kicker">LEGO Speed Champions</p>
        <h1>{it ? "Valori di mercato LEGO Speed Champions" : "LEGO Speed Champions market values"}</h1>
        <p>{it ? "Confronta i prezzi negli annunci e le vendite osservate per codice set. Le singole schede mostrano condizioni e date dei rilevamenti." : "Compare listing prices and observed sales by set number. Open each set to see the condition and observation dates."}</p>
      </header>
      <div className="racing-table-scroll" role="region" tabIndex={0} aria-label={it ? "Dati di mercato per set" : "Market data by set"}>
        <table className="racing-market-table">
          <thead><tr><th scope="col">{it ? "Set LEGO" : "LEGO set"}</th><th scope="col">{it ? "Prezzi negli annunci" : "Listing prices"}</th><th scope="col">{it ? "Vendite osservate" : "Observed sales"}</th></tr></thead>
          <tbody>{entries.map(({ set, market, sales }) => <tr key={set.setNumber}>
            <th scope="row"><Link href={speedChampionsPath(set.setNumber, locale)}><Image alt="" width={58} height={48} src={setImagePath(set.setNumber, "box")} /><span><small>#{set.setNumber}</small>{speedChampionsSetName(set, locale)}</span></Link></th>
            <td>{market.askingLowCents == null ? "—" : <>{formatLegoPrice(market.askingLowCents, locale)}{market.askingHighCents != null && market.askingHighCents !== market.askingLowCents && ` – ${formatLegoPrice(market.askingHighCents, locale)}`}</>}</td>
            <td>{sales || "—"}</td>
          </tr>)}</tbody>
        </table>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{it ? "I prezzi negli annunci escludono la spedizione. Le vendite osservate si riferiscono a set dichiarati nuovi." : "Listing prices exclude shipping. Observed sales cover sets listed as new."}</p>
    </section>
  )
}
