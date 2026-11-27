import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { BookOpen, Boxes, ScanLine, Store, TrendingUp } from "lucide-react"
import { PublicShell } from "@/components/public-shell"
import { isRacingStudioEnabled, isRacingStudioPreview } from "@/lib/racing-studio"
import { localizePublicPath, publicAbsoluteUrl, publicLanguageAlternates, type PublicLocale } from "@/lib/seo/catalog-paths"

export function racingInfoMetadata(locale: PublicLocale, page: "find" | "how-it-works"): Metadata {
  const it = locale === "it"
  const title = page === "find" ? (it ? "Scanner e ricerca per codice" : "Scanner and item lookup") : (it ? "Come funziona TrackDash" : "How TrackDash works")
  return {
    title: `${title} | TrackDash`,
    alternates: { canonical: publicAbsoluteUrl(`/${page}`, locale), languages: publicLanguageAlternates(`/${page}`) },
  }
}

export function RacingInfoPage({ locale, page }: { locale: PublicLocale; page: "find" | "how-it-works" }) {
  if (!isRacingStudioEnabled()) notFound()
  const it = locale === "it"
  const path = (value: string) => localizePublicPath(value, locale)
  const preview = isRacingStudioPreview()
  const copy = (italian: string, english: string) => it ? italian : english
  const search = page === "find"
  const steps = [
    { icon: Boxes, title: copy("Riconosci la versione esatta", "Identify the exact release"), desc: copy("Cerca nel catalogo per codice articolo Mini 4WD o per numero set LEGO. Apri la scheda per controllare anno, confezione e dettagli.", "Look up a Mini 4WD item number or a LEGO set number. Open its page to check the year, box and details."), url: path("/find"), button: copy("Cerca per codice", "Look up a code") },
    { icon: TrendingUp, title: copy("Segui il mercato", "Follow the market"), desc: copy("Ogni catalogo ha la propria pagina di mercato. I prezzi negli annunci descrivono le richieste dei venditori. Le vendite osservate documentano transazioni concluse.", "Each catalog has its own market page. Listing prices show what sellers ask. Observed sales document completed transactions."), url: path("/market"), button: copy("Valori Mini 4WD", "Mini 4WD market values"), second: path("/speed-champions/market"), secondLabel: copy("Valori LEGO", "LEGO market values") },
    { icon: BookOpen, title: copy("Organizza collezione e desideri", "Organize your collection and wishlist"), desc: copy("Con un solo account puoi gestire le copie e i desideri nei rispettivi cataloghi.", "Use one account to manage copies and wishlists in their respective collections."), url: "/signup", button: copy("Crea un account", "Create an account") },
    { icon: Store, title: copy("Esplora il mercatino Mini 4WD", "Explore the Mini 4WD marketplace"), desc: copy("Guarda foto, condizioni e prezzi richiesti dai collezionisti. L’offerta apre un dialogo diretto con il venditore.", "Check collectors’ photos, conditions and asking prices. Make an offer to speak directly with the seller."), url: path("/shop"), button: copy("Vai al mercatino", "Open marketplace") },
  ]

  return (
    <PublicShell websiteOnly>
      <section className="racing-wrap pb-16">
        <header className="racing-page-intro">
          <p className="racing-kicker">TrackDash</p>
          <h1>{search ? copy("Parti dal codice. Trova il tuo modello.", "Start with the code. Find your model.") : copy("Come funziona TrackDash", "How TrackDash works")}</h1>
          <p>{search ? copy("Inserisci il codice che trovi sulla confezione, scegliendo il catalogo corretto.", "Enter the code on the box in the relevant catalog.") : copy("Dalla ricerca del modello alla collezione, con strumenti dedicati a Mini 4WD e Speed Champions.", "From identifying a model to building a collection, with tools for Mini 4WD and Speed Champions.")}</p>
        </header>
        {search ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[["Tamiya Mini 4WD", "/catalog", "18012"], ["LEGO Speed Champions", "/speed-champions/catalog", "76934"]].map(([name, url, sample]) => (
              <form action={path(url)} key={url} className="racing-info-card" role="search" aria-label={name}>
                <ScanLine size={27} aria-hidden="true" />
                <h2>{name}</h2>
                <label className="grid gap-2 font-semibold">{copy("Codice articolo o set", "Item or set number")}<input name="q" type="search" autoComplete="off" placeholder={sample} required className="min-h-11 rounded-lg border bg-white px-3 font-normal" /></label>
                <button type="submit" className="racing-button">{copy("Cerca nel catalogo", "Search the catalog")}</button>
                {url === "/catalog" && !preview && <Link className="racing-text-link" href="/scanner">{copy("Inquadra il barcode Mini 4WD", "Scan a Mini 4WD barcode")} →</Link>}
              </form>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {steps.map(({ icon: Icon, title, desc, url, button, second, secondLabel }) => <article key={title} className="racing-info-card"><Icon size={27} aria-hidden="true" /><h2>{title}</h2><p>{desc}</p><div className="flex flex-wrap items-center gap-3"><Link className="racing-button" href={url}>{button}</Link>{second && <Link className="racing-text-link !mt-0" href={second}>{secondLabel} →</Link>}</div></article>)}
          </div>
        )}
      </section>
    </PublicShell>
  )
}
