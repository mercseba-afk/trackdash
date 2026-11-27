import { speedChampionsCatalogIsPublic } from "@/lib/lego/catalog-visibility"
import { localizePublicPath, type PublicLocale } from "@/lib/seo/catalog-paths"
import { AmazonPurchaseButton } from "@/components/catalog/amazon-purchase-button"
import { amazonItalyUrlForRelease } from "@/lib/data/amazon-italy-products"
import { LegoPilotOffer } from "@/components/speed-champions/pilot-offer"
import { getLegoPilotShare } from "@/lib/server/lego-pilot-share"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { LegoMarketPrices } from "@/components/speed-champions/market-prices"
import { LegoListControls } from "@/components/speed-champions/personal-lists"
import { SetGallery } from "@/components/speed-champions/gallery"
import { speedChampionsSets, speedChampionsCatalogPath, speedChampionsSetName } from "@/lib/lego/catalog"
import { LegoStatusBadge } from "@/components/speed-champions/status-badge"
import { loadLegoMarketSummaries } from "@/lib/server/lego-market"
import { canBrowseSpeedChampions } from "@/lib/server/speed-champions-messaging-access"
import { localizedLegoStatusDescriptions } from "@/lib/lego/locale"

export async function SpeedChampionsSetPage({ setNumber, locale }: { setNumber: string; locale: PublicLocale }) {
  const copy = (it: string, en: string) => locale === "it" ? it : en
  if (!speedChampionsCatalogIsPublic && !(await canBrowseSpeedChampions())) notFound()
  const set = speedChampionsSets.find((entry) => entry.setNumber === setNumber)
  if (!set) notFound()
  const amazonUrl = amazonItalyUrlForRelease(set.releaseId)
  const pilotShare = setNumber === "75890" ? await getLegoPilotShare(set.releaseId) : null
  const asOf = new Date().toISOString()
  const market = (await loadLegoMarketSummaries([setNumber], asOf))[setNumber]
  const facts = [
    [copy("Codice set", "Set number"), set.setNumber],
    [copy("Anno di uscita", "Release year"), set.year],
    [copy("Pezzi", "Pieces"), set.pieces],
    [copy("Marchio auto", "Car brand"), set.carBrand],
    [copy("Auto nella confezione", "Cars in the box"), set.carCount],
    [copy("Serie", "Series"), set.series],
  ]
  return (
    <div className="space-y-6">
      <Link
        href={localizePublicPath(speedChampionsCatalogPath, locale)}
        className="inline-flex items-center gap-2 text-sm font-medium text-blue-700"
      >
        <ArrowLeft className="size-4" />
        {copy("Torna al catalogo", "Back to the catalogue")}
      </Link>
      <div className="grid items-start gap-8 md:grid-cols-2">
        <SetGallery set={set} locale={locale} />
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">
            LEGO Speed Champions · {set.setNumber}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{speedChampionsSetName(set, locale)}</h1>
          <div className="mt-4"><LegoStatusBadge status={set.status} locale={locale} />
            <p className="mt-3 text-sm leading-6 text-slate-600">{localizedLegoStatusDescriptions(locale)[set.status]}</p>
          </div>
          <dl className="mt-7 grid grid-cols-2 gap-x-5 gap-y-5 rounded-2xl border border-slate-200 bg-white p-5">
            {facts.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-slate-500">{label}</dt>
                <dd className="mt-1 font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
          {set.carCount === 2 && (
            <p className="mt-4 text-sm leading-6 text-slate-600">
              {copy("Questo codice identifica la confezione completa con due auto.", "This set number identifies the complete two-car pack.")}
            </p>
          )}
          {pilotShare && <LegoPilotOffer shareId={pilotShare} locale={locale} />}
          <LegoListControls setNumber={set.setNumber} locale={locale} />
          <LegoMarketPrices setNumber={set.setNumber} asOf={asOf} market={market} locale={locale} />
          {amazonUrl && (
            <div className="mt-4">
              <AmazonPurchaseButton href={amazonUrl} itemNumber={set.setNumber} it={locale === "it"} />
            </div>
          )}
        </div>
      </div>
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold">{copy("Fonti e verifica", "Sources and verification")}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {copy("Identità, numero di pezzi, immagini e stato verificati sulla scheda ufficiale LEGO il", "Set details, piece count, images and status checked against the official LEGO product page on")}{" "}
          {new Intl.DateTimeFormat(locale === "it" ? "it-IT" : "en-GB", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(set.statusCheckedAt))}.{" "}
          {copy("Lo stato riguarda il catalogo LEGO. La data esatta di ritiro è da verificare.", "The status refers to the LEGO catalogue. The exact retirement date is unverified.")}
        </p>
        <div className="mt-4 flex flex-wrap gap-5 text-sm font-medium text-blue-700">
          <a href={locale === "it" ? set.sourceUrl : set.sourceUrl.replace("/it-it/", "/en-gb/")} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1">
            {copy("Scheda ufficiale LEGO", "Official LEGO product page")}
            <ExternalLink className="size-3" />
          </a>
          <a
            href={set.yearSourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1"
          >
            {copy("Anno nel catalogo BrickLink", "Release year in the BrickLink catalogue")}
            <ExternalLink className="size-3" />
          </a>
        </div>
      </section>
    </div>
  )
}
