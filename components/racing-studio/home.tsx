import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Boxes, Heart, ScanLine, Store, TrendingUp } from "lucide-react"
import { speedChampionsCollectingGuide } from "@/lib/lego/collecting-guide"
import { guides } from "@/lib/guides"
import { setImagePath, speedChampionsPath, speedChampionsSetName, speedChampionsSets } from "@/lib/lego/catalog"
import { formatLegoPrice } from "@/lib/lego/price-format"
import { loadLegoMarketSummaries } from "@/lib/server/lego-market"
import { getCachedPublicMarketSignalMap } from "@/lib/market/public-cached"
import type { ReleaseMarketSignalMap } from "@/lib/market/view-types"
import { observedMarketReferenceIsHistorical, observedMarketReferencePrice } from "@/lib/market/presentation"
import { isRacingStudioPreview } from "@/lib/racing-studio"
import { localizePublicPath, releasePublicPath, type PublicLocale } from "@/lib/seo/catalog-paths"
import type { Product } from "@/lib/types"
import { RacingMarketCards } from "./market-cards"

export async function RacingHome({ products, locale }: { products: Product[]; locale: PublicLocale }) {
  const it = locale === "it"
  const path = (value: string) => localizePublicPath(value, locale)
  const copy = (italian: string, english: string) => it ? italian : english
  const legoSets = ["77239", "76934", "76917", "77242"].map((code) => speedChampionsSets.find((item) => item.setNumber === code)!)
  const [legoMarket, miniMarket]: [Awaited<ReturnType<typeof loadLegoMarketSummaries>>, ReleaseMarketSignalMap] = await Promise.all([
    loadLegoMarketSummaries(legoSets.map((set) => set.setNumber), new Date().toISOString()),
    isRacingStudioPreview() ? {} : getCachedPublicMarketSignalMap().catch(() => ({})),
  ])
  const miniReleases = products.filter((product) => product.catalogLaunchStatus !== "coming_soon").flatMap((product) =>
    product.releases.map((release) => ({ product, release })))
  const featuredMini = ["19434", "18615", "18630", "18714"].flatMap((code) => {
    const match = miniReleases.find(({ release }) => release.itemNumber === code)
    return match ? [match] : []
  })
  const features = [
    { icon: Boxes, name: copy("Cataloghi", "Catalogs"), description: copy("Cerca per codice, anno e telaio Mini 4WD oppure per marchio e numero di pezzi LEGO.", "Search by Mini 4WD item number, year and chassis or by LEGO brand and piece count."), url: "#cataloghi", label: copy("Scegli un catalogo", "Choose a catalog"), tone: "racing-wide" },
    { icon: TrendingUp, name: copy("Valori di mercato", "Market values"), description: copy("Confronta prezzi negli annunci, vendite osservate e riferimenti di mercato quando disponibili.", "Compare listing prices, observed sales and market references where available."), url: "#mercato", label: copy("Guarda i dati", "See the data"), tone: "racing-dark racing-value-feature" },
    { icon: Heart, name: copy("Collezione e Desideri", "Collection and Wishlist"), description: copy("Salva i modelli che hai e quelli che cerchi. Registra copie e condizioni nel catalogo di riferimento.", "Save the models you own and the ones you want. Record copies and conditions in the relevant catalog."), url: "#collezione", label: copy("Scopri la collezione", "Explore collections"), tone: "" },
    { icon: Store, name: copy("Mercatino", "Marketplace"), description: copy("Consulta le inserzioni, confronta le condizioni e fai un’offerta al venditore.", "Browse listings, compare condition and make an offer to the seller."), url: path("/shop"), label: copy("Apri il mercatino", "Open marketplace"), tone: "" },
    { icon: ScanLine, name: "Scanner", description: copy("Trova una release dal codice articolo o cerca un set LEGO con il numero sulla confezione.", "Find a release by item number or use the number on the box to find a LEGO set."), url: path("/find"), label: copy("Cerca un codice", "Look up a code"), tone: "racing-blue" },
  ]
  const worlds = [
    { image: "/catalog/dash-1-emperor-18012-1988-original-confezione.jpeg", name: "Tamiya Mini 4WD", id: "DASH-1 EMPEROR · #18012", description: copy("Modelli, release ed edizioni da collezione.", "Models, releases and collector editions."), cta: copy("Esplora Mini 4WD", "Explore Mini 4WD"), href: path("/catalog") },
    { image: "/speed-champions/images/76934-model.jpg", name: "LEGO Speed Champions", id: "FERRARI F40 · #76934", description: copy("Supercar, set iconici e modelli da collezione.", "Supercars, iconic sets and collectible models."), cta: copy("Esplora Speed Champions", "Explore Speed Champions"), href: path("/speed-champions/catalog") },
  ]
  const miniGuide = guides.find((guide) => guide.slug === "mini-4wd-prima-edizione-o-ristampa")!
  const legoGuide = speedChampionsCollectingGuide
  return (
    <>
      <section className="racing-hero" id="cataloghi">
        <div className="racing-wrap racing-hero-inner">
          <p className="racing-kicker">{copy("La casa digitale dei collezionisti", "A home for collectors")}</p>
          <h1>{copy("Due universi.", "Two worlds.")}<br /><span>{copy("Un’unica passione.", "One shared passion.")}</span></h1>
          <p className="racing-hero-description">{copy("Scopri, colleziona e segui il valore dei tuoi modelli.", "Discover, collect and follow the value of your models.")}</p>
          <div className="racing-worlds">
            {worlds.map((world, index) => (
              <article key={world.image} className={`racing-world ${index === 0 ? "" : "racing-world-lego"}`}>
                <Image src={world.image} alt="" fill priority sizes="(max-width: 800px) 96vw, 46vw" />
                <span className="racing-world-id">{world.id}</span>
                <div className="racing-world-copy">
                  <h2>{world.name}</h2><p>{world.description}</p>
                  <Link className="racing-button" href={world.href}>{world.cta}</Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="racing-wrap racing-section" id="funzionalita">
        <p className="racing-kicker">{copy("Gli strumenti TrackDash", "TrackDash tools")}</p>
        <h2>{copy("Pensato per il modo in cui collezioni davvero.", "Built around the way you collect.")}</h2>
        <div className="racing-features">
          {features.map(({ icon: Icon, name, description, url, label, tone }) => (
            <article key={name} className={`racing-feature ${tone}`}><Icon size={23} aria-hidden="true" /><h3>{name}</h3><p>{description}</p><Link href={url}>{label} <ArrowRight size={15} aria-hidden="true" /></Link></article>
          ))}
        </div>
      </section>
      <RacingMarketCards
        locale={locale}
        mini={featuredMini.map(({ product, release }) => {
          const signal = miniMarket[release.id]
          const price = observedMarketReferencePrice(signal)
          return {
            code: `#${release.itemNumber}`, href: releasePublicPath(product, release, locale),
            image: release.images?.[0] ?? product.images?.[0],
            name: release.editionName,
            summary: price == null ? copy("Vedi i dati della release", "View release data") : `${(observedMarketReferenceIsHistorical(signal) ? copy("Ultimo prezzo osservato", "Last observed price") : copy("Prezzi negli annunci", "Listing prices"))} · ${formatLegoPrice(Math.round(price * 100), locale)}`,
          }
        })}
        lego={legoSets.map((set) => {
          const price = legoMarket[set.setNumber]?.askingLowCents
          return { code: `#${set.setNumber}`, href: speedChampionsPath(set.setNumber, locale), image: setImagePath(set.setNumber, "box"), name: speedChampionsSetName(set, locale), summary: price == null ? copy("Vedi i dati del set", "View set data") : `${copy("Prezzi negli annunci da", "Listing prices from")} ${formatLegoPrice(price, locale)}` }
        })}
      />
      <StudioFeature id="collezione" image="/speed-champions/images/76917-model.jpg" label={copy("Collezione e Desideri", "Collection and Wishlist")} title={copy("La tua collezione, tutta in ordine.", "Your collection, organized.")} description={copy("Organizza i modelli tra Mini 4WD e Speed Champions, indica le condizioni di ogni copia, gestisci i desideri e segui i dati di mercato.", "Organize Mini 4WD and Speed Champions models, record each copy’s condition, manage your wishlist and follow market data.")} href="/signup" cta={copy("Inizia la tua collezione", "Start your collection")} />
      <StudioFeature id="mercatino" image="/catalog/dash-1-emperor-18025-1990-original-confezione.jpeg" label={copy("Il mercatino TrackDash", "TrackDash marketplace")} title={copy("Il tuo prossimo modello ti aspetta.", "Your next model awaits.")} description={copy("Scopri le Mini 4WD messe in vendita da altri collezionisti. Guarda foto, condizioni e prezzi, poi invia la tua offerta.", "Discover Mini 4WD models listed by other collectors. Check photos, condition and pricing, then make your offer.")} href={path("/shop")} cta={copy("Esplora il mercatino", "Explore the marketplace")} />
      <StudioFeature id="scanner" image="/catalog/dash-1-emperor-18012-1988-original-confezione.jpeg" label="Scanner" title={copy("Parti dalla scatola. Trova il tuo modello.", "Start with the box. Find your model.")} description={copy("Inquadra il barcode di una Mini 4WD oppure cerca un set Speed Champions con il codice sulla confezione.", "Scan a Mini 4WD barcode or look up a Speed Champions set using the number on the box.")} href={path("/find")} cta={copy("Cerca il tuo modello", "Find your model")} />
      <section className="racing-wrap racing-section" id="guide">
        <p className="racing-kicker">{copy("Guide TrackDash", "TrackDash guides")}</p>
        <h2>{copy("Un consiglio alla volta.", "One tip at a time.")}</h2>
        <div className="racing-guide-grid">
          <Link href={path(`/guide/${miniGuide.slug}`)} className="racing-guide-card"><div><Image src="/catalog/dash-1-emperor-18012-1988-original-confezione.jpeg" alt="" fill sizes="(max-width: 760px) 96vw, 52vw" /></div><h3>{miniGuide[locale].title}</h3><p>{miniGuide[locale].description}</p></Link>
          <Link href={path(`/guide/${legoGuide.slug}`)} className="racing-guide-card"><div><Image src="/speed-champions/images/76934-box.jpg" alt="" fill sizes="(max-width: 760px) 96vw, 38vw" /></div><h3>{legoGuide[locale].title}</h3><p>{legoGuide[locale].description}</p></Link>
        </div>
        <Link className="racing-text-link" href={path("/guide")}>{copy("Tutte le guide", "All guides")} →</Link>
      </section>
      <section className="racing-wrap racing-section racing-finish outer">
        <div className="racing-finish-panel"><h2>{copy("Scopri. Colleziona. Scambia.", "Discover. Collect. Trade.")}</h2><p>{copy("Crea il tuo account gratuito su TrackDash e organizza i tuoi modelli.", "Create a free TrackDash account and organize your models.")}</p><Link className="racing-button" href="/signup">{copy("Crea un account gratuito", "Create a free account")}</Link></div>
      </section>
    </>
  )
}

function StudioFeature({ id, image, label, title, description, href, cta }: {
  id: string; image: string; label: string; title: string; description: string; href: string; cta: string;
}) {
  return (
    <section className={`racing-story racing-story-${id}`} id={id}>
      <div className="racing-wrap racing-story-grid">
        <div className="racing-story-copy"><p className="racing-kicker">{label}</p><h2>{title}</h2><p>{description}</p><Link className="racing-button" href={href}>{cta}</Link></div>
        <div className="racing-story-photo"><Image src={image} alt="" fill sizes="(max-width: 760px) 96vw, 55vw" /></div>
      </div>
    </section>
  )
}
