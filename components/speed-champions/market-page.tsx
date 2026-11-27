import { RacingPageHero } from "@/components/racing-studio/page-hero"
import { BadgeCheck, ChartNoAxesCombined, Tags } from "lucide-react"
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
import { localizePublicPath, publicAbsoluteUrl, publicLanguageAlternates, type PublicLocale } from "@/lib/seo/catalog-paths"

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

  const copy = (italian: string, english: string) => it ? italian : english
  const evidence = [
    { icon: Tags, title: copy("Prezzi negli annunci", "Listing prices"), description: copy("Mostrano quanto chiedono i venditori per il set. Il riepilogo esclude la spedizione. Nella scheda trovi le condizioni e la data del rilevamento.", "These show what sellers ask for the set. The summary excludes shipping. The set page shows condition and observation date.") },
    { icon: BadgeCheck, title: copy("Vendite osservate", "Observed sales"), description: copy("Indicano le transazioni concluse che TrackDash ha potuto osservare. I prezzi si riferiscono a set dichiarati nuovi.", "These are completed transactions TrackDash has observed. Prices refer to sets listed as new.") },
    { icon: ChartNoAxesCombined, title: copy("Riferimento di mercato", "Market reference"), description: copy("Una stima richiede dati comparabili sullo stesso set e sulle stesse condizioni. Quando i dati sono limitati, puoi comunque consultare gli annunci e le vendite disponibili.", "An estimate requires comparable data for the same set and condition. When evidence is limited, you can still browse the available listings and sales.") },
  ]

  return (
    <section>
      <RacingPageHero kicker={copy("Analisi di mercato", "Price intelligence")} title={copy("Valori di mercato LEGO Speed Champions", "LEGO Speed Champions market values")} description={copy("Scopri quanto chiedono i venditori e quali vendite di set Speed Champions abbiamo osservato.", "See how much sellers ask and which Speed Champions sales TrackDash has observed.")}>
        <a className="racing-button" href="#live-market">{copy("Guarda i dati disponibili", "View available data")}</a>
        <Link className="racing-button racing-button-outline" href={localizePublicPath("/speed-champions/catalog", locale)}>{copy("Vai al catalogo LEGO", "Open the LEGO catalog")}</Link>
      </RacingPageHero>
      <section className="racing-market-explainer">
        <p className="racing-kicker">{copy("Come leggiamo il mercato", "How we read the market")}</p>
        <h2>{copy("Dati reali per capire il valore.", "Real data to understand value.")}</h2>
        <div className="racing-market-method mt-5">
          {evidence.map(({ icon: Icon, title, description }) => <article key={title} className="racing-info-card"><Icon size={25} aria-hidden="true" /><h3>{title}</h3><p>{description}</p></article>)}
        </div>
      </section>
      <section className="racing-market-reference racing-info-card racing-dark">
        <p className="racing-kicker">{copy("Quando i dati sono limitati", "When evidence is limited")}</p>
        <h2>{copy("Ogni stima parte da vendite comparabili.", "Every estimate starts with comparable sales.")}</h2>
        <p>{copy("Un solo prezzo o annunci riferiti a condizioni diverse aiutano a orientarsi. Apri la scheda del set per vedere quali dati sono disponibili e quando sono stati rilevati.", "A single price or listings in different conditions can help you get oriented. Open the set page to see what evidence is available and when it was recorded.")}</p>
      </section>
      <div className="racing-market-explainer" id="live-market">
        <p className="racing-kicker">{copy("Dati disponibili", "Available data")}</p>
        <h2>{copy("Prezzi e vendite, set per set.", "Prices and sales by set.")}</h2>
        <p className="mt-3 text-muted-foreground">{copy("Apri la scheda per vedere le condizioni, le date e le eventuali vendite rilevate.", "Open a set page to see condition, observation dates and any recorded sales.")}</p>
      </div>
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
