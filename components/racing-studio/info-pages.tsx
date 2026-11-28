import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { BookOpen, Boxes, Camera, MessageCircle, ScanLine, TrendingUp } from "lucide-react"
import { PublicShell } from "@/components/public-shell"
import { isRacingStudioEnabled, isRacingStudioPreview } from "@/lib/racing-studio"
import { localizePublicPath, publicAbsoluteUrl, publicLanguageAlternates, type PublicLocale } from "@/lib/seo/catalog-paths"
import { RacingPageHero } from "./page-hero"
import { RacingSectionNav, type RacingCatalog } from "./section-nav"

export function racingInfoMetadata(locale: PublicLocale, page: "find" | "how-it-works"): Metadata {
  const it = locale === "it"
  const title = page === "find" ? (it ? "Scanner e ricerca per codice" : "Scanner and item lookup") : (it ? "Come funziona TrackDash" : "How TrackDash works")
  return {
    title: `${title} | TrackDash`,
    description: page === "find"
      ? (it ? "Cerca una release Tamiya Mini 4WD o un set LEGO Speed Champions dal codice sulla confezione." : "Look up a Tamiya Mini 4WD release or a LEGO Speed Champions set by its box code.")
      : (it ? "Scopri come usare cataloghi, valori di mercato, collezione e mercatino su TrackDash." : "Learn how to use TrackDash catalogs, market data, collections and the marketplace."),
    alternates: { canonical: publicAbsoluteUrl(`/${page}`, locale), languages: publicLanguageAlternates(`/${page}`) },
  }
}

export function RacingInfoPage({ locale, page, catalog = "mini4wd" }: { locale: PublicLocale; page: "find" | "how-it-works"; catalog?: RacingCatalog }) {
  if (!isRacingStudioEnabled()) notFound()
  return (
    <PublicShell websiteOnly>
      <section className="racing-wrap py-8 sm:py-12">
        {page === "find" ? <ScannerGuide locale={locale} catalog={catalog} /> : <HowItWorks locale={locale} />}
      </section>
    </PublicShell>
  )
}

function ScannerGuide({ locale, catalog }: { locale: PublicLocale; catalog: RacingCatalog }) {
  const copy = (it: string, en: string) => locale === "it" ? it : en
  const lego = catalog === "lego"
  const preview = isRacingStudioPreview()
  const catalogPath = localizePublicPath(lego ? "/speed-champions/catalog" : "/catalog", locale)
  return <>
    <RacingPageHero kicker="Scanner" title={copy("Parti dalla scatola. Trova il tuo modello.", "Start with the box. Find your model.")} description={copy("Usa il codice sulla confezione per trovare la release Mini 4WD o il set LEGO esatto.", "Use the number on the box to find the exact Mini 4WD release or LEGO set.")} />
    <RacingSectionNav path="/find" selected={catalog} locale={locale} label={copy("Catalogo dello scanner", "Scanner catalog")} />
    <div className="racing-scanner-grid">
      <section className="racing-scanner-frame">
        <Image src={lego ? "/speed-champions/images/76934-box.jpg" : "/catalog/dash-1-emperor-18012-1988-original-confezione.jpeg"} alt="" fill sizes="(max-width: 760px) 96vw, 55vw" />
        <div>
          <ScanLine size={38} aria-hidden="true" />
          <h2>{lego ? copy("Leggi il numero set sulla scatola", "Read the set number on the box") : copy("Inquadra il codice a barre", "Frame the barcode")}</h2>
          <p>{lego ? copy("Cerca il codice a cinque cifre, per esempio 76934 per la Ferrari F40.", "Look for the five-digit number, such as 76934 for the Ferrari F40.") : copy("Quando il barcode corrisponde a una sola release, TrackDash apre direttamente la scheda.", "When the barcode matches one release, TrackDash opens its page directly.")}</p>
          {!lego && <Link className="racing-button" href={preview ? "/login" : "/scanner"}><Camera size={18} aria-hidden="true" />{copy("Apri lo scanner nell’app", "Open the scanner in the app")}</Link>}
        </div>
      </section>
      <aside className="grid content-start gap-4">
        <form action={catalogPath} className="racing-info-card" role="search" aria-label={lego ? "LEGO Speed Champions" : "Tamiya Mini 4WD"}>
          <p className="racing-kicker">{copy("Ricerca manuale", "Manual search")}</p>
          <h2>{copy("Hai già il codice?", "Already have the code?")}</h2>
          <p>{lego ? copy("Inserisci il numero del set o il nome dell’auto.", "Enter the set number or the car name.") : copy("Cerca nel catalogo per codice articolo o nome del modello.", "Search the catalog by item number or model name.")}</p>
          <label className="grid gap-2 font-semibold">{lego ? copy("Numero del set o nome", "Set number or name") : copy("Codice articolo o nome", "Item number or name")}<input name="q" type="search" autoComplete="off" placeholder={lego ? "76934" : "18012"} required className="min-h-11 rounded-lg border bg-white px-3 font-normal" /></label>
          <button type="submit" className="racing-button">{copy("Cerca nel catalogo", "Search the catalog")}</button>
        </form>
        <div className="racing-info-card">
          <h2>{lego ? copy("Controlla la confezione", "Check the box") : copy("Accesso alla fotocamera", "Camera access")}</h2>
          <p>{lego ? copy("Set con lo stesso modello di auto possono avere numeri diversi. Verifica foto, numero di pezzi e quante auto sono incluse.", "Sets featuring the same car can have different numbers. Check the photos, piece count and number of cars included.") : copy("Lo scanner con fotocamera richiede l’accesso a TrackDash. Se più release condividono un codice, puoi confrontarle e scegliere quella che corrisponde alla tua scatola.", "The camera scanner requires you to sign in to TrackDash. If releases share a number, compare them and choose the one that matches your box.")}</p>
          {lego && <Link href={localizePublicPath("/guide/lego-speed-champions-codice-set", locale)} className="racing-text-link !mt-0">{copy("Leggi la guida al codice set", "Read the set number guide")} →</Link>}
        </div>
      </aside>
    </div>
  </>
}

function HowItWorks({ locale }: { locale: PublicLocale }) {
  const copy = (it: string, en: string) => locale === "it" ? it : en
  const path = (value: string) => localizePublicPath(value, locale)
  const steps = [
    { icon: Boxes, title: copy("Trova il tuo modello.", "Find your model."), mini: copy("Cerca per nome, anno, telaio o codice articolo. Apri la release esatta e controlla anno, versione, confezione e dati disponibili.", "Search by name, year, chassis or item number. Open the exact release to check year, edition, box and available data."), lego: copy("Cerca per numero set, auto, marchio o anno. La scheda mostra pezzi, auto incluse e stato nel catalogo ufficiale LEGO.", "Search by set number, car, brand or year. The set page shows piece count, included cars and official LEGO catalog status."), links: [[path("/catalog"), "Mini 4WD"], [path("/speed-champions/catalog"), "LEGO Speed Champions"]] },
    { icon: TrendingUp, title: copy("Scopri quanto vale oggi.", "See what it is worth today."), mini: copy("Riferimento di mercato, vendite concluse e prezzi negli annunci sono mostrati separatamente. La stima TrackDash indica anche l’affidabilità quando i dati bastano.", "Market reference, completed sales and listing prices are shown separately. The TrackDash estimate includes a reliability level when enough evidence is available."), lego: copy("Confronta prezzi negli annunci e vendite osservate dello stesso set, tenendo conto di condizioni e spedizione.", "Compare asking prices and observed sales for the same set, taking condition and shipping into account."), links: [[path("/market"), copy("Mercato Mini 4WD", "Mini 4WD market")], [path("/speed-champions/market"), copy("Mercato LEGO", "LEGO market")]] },
    { icon: BookOpen, title: copy("Organizza collezione e desideri.", "Organize your collection and wishlist."), mini: copy("Aggiungi le release che possiedi, indica la condizione di ogni copia e consulta la stima delle copie sigillate.", "Add the releases you own, record each copy’s condition and see the estimate for sealed copies."), lego: copy("Salva i set che possiedi con condizioni e quantità. Usa la lista desideri per tenere a portata di mano i set che cerchi.", "Save the sets you own with their condition and quantity. Use the wishlist to keep track of the sets you want."), links: [["/signup?next=%2Fcollection", copy("Crea un account", "Create an account")]] },
    { icon: TrendingUp, title: copy("Controlla il mercato.", "Watch the market."), mini: copy("Segui disponibilità, vendite concluse, prezzi richiesti e trend quando ci sono dati comparabili.", "Follow availability, completed sales, asking prices and trends when comparable data is available."), lego: copy("Apri la pagina del mercato LEGO per confrontare set, data e condizioni dei rilevamenti. Usa il numero set per confrontare la stessa confezione.", "Open the LEGO market page to compare sets, observation dates and conditions. Use the set number to compare the same box."), links: [[path("/market"), copy("Valori Mini 4WD", "Mini 4WD values")], [path("/speed-champions/market"), copy("Valori LEGO", "LEGO values")]] },
    { icon: MessageCircle, title: copy("Compra e vendi tra collezionisti.", "Buy and sell with collectors."), mini: copy("Rendi disponibile una copia oppure consulta foto, condizioni e prezzo nel Mercatino. Scrivi al venditore, invia un’offerta o rispondi con una controproposta.", "List a copy or check photos, condition and price in the Marketplace. Message the seller, make an offer or send a counteroffer."), lego: copy("La scheda LEGO del Mercatino è dedicata agli annunci Speed Champions.", "The LEGO Marketplace tab is dedicated to Speed Champions listings."), links: [[path("/shop"), copy("Mercatino Mini 4WD", "Mini 4WD Marketplace")], [path("/shop?catalog=lego"), copy("Mercatino LEGO", "LEGO Marketplace")]] },
    { icon: ScanLine, title: copy("Parti dal codice sulla scatola.", "Start with the number on the box."), mini: copy("Dopo l’accesso, usa la fotocamera per leggere il barcode oppure inserisci Item Number o JAN/EAN nello scanner.", "After signing in, scan the barcode with your camera or enter the item number or JAN/EAN."), lego: copy("Cerca il numero set sulla confezione per trovare direttamente la scheda Speed Champions corretta.", "Look up the set number from the box to find the right Speed Champions page."), links: [[path("/find"), "Scanner"]] },
  ]

  return <>
    <RacingPageHero kicker="TrackDash" title={copy("Come funziona TrackDash", "How TrackDash works")} description={copy("Dalla ricerca del modello alla tua collezione. Scopri quali strumenti usare per Mini 4WD e LEGO Speed Champions.", "From identifying a model to building your collection. Find the right tools for Mini 4WD and LEGO Speed Champions.")} />
    <div className="racing-help-grid">
      {steps.map(({ icon: Icon, title, mini, lego, links }, index) => <article key={title} className={`racing-info-card ${index === 1 ? "racing-dark" : ""}`}>
        <Icon size={26} aria-hidden="true" />
        <h2>{title}</h2>
        <p><strong>Mini 4WD.</strong> {mini}</p>
        <p><strong>LEGO Speed Champions.</strong> {lego}</p>
        <div className="flex flex-wrap gap-3">{links.map(([url, label]) => <Link key={url} href={url} className="racing-button">{label}</Link>)}</div>
      </article>)}
    </div>
  </>
}
