"use client"

import * as React from "react"
import { HomeDiscovery } from "@/components/home-discovery"
import type { ShopCopy } from "@/lib/server/shop"
import Link from "next/link"
import {
  ArrowRight,
  Barcode,
  Boxes,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  ScanLine,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react"
import { ProductImage } from "@/components/catalog/product-image"
import { useI18n } from "@/lib/i18n"
import { useMarketSignals } from "@/lib/market/context"
import { latestVerifiedAskingRows, recentCollectorMarketTrend as collectorMarketTrend, verifiedAskingObservation } from "@/lib/market/highlights"
import { formatMoney } from "@/lib/format"
import type { ReleaseMarketSignalView } from "@/lib/market/view-types"
import type { Product, ProductRelease } from "@/lib/types"
import { localizePublicPath, releasePublicPath, type PublicLocale } from "@/lib/seo/catalog-paths"

type ReleaseEntry = {
  product: Product
  release: ProductRelease
  signal: ReleaseMarketSignalView | null
}

function releaseHref(product: Product, release: ProductRelease, locale: PublicLocale) {
  return releasePublicPath(product, release, locale)
}

function marketScore(entry: ReleaseEntry) {
  const signal = entry.signal
  if (!signal) return 0

  const trend = collectorMarketTrend(signal)
  const positiveTrend = trend != null && trend > 0 ? trend : 0
  const recentSales = signal.recentSoldUnits3m ?? 0
  const observedSales = signal.soldUnits ?? 0
  const offers = signal.currentOfferCount ?? 0

  return positiveTrend * 1000 + recentSales * 80 + observedSales * 2 + offers * 10
}

function distinctByProduct(entries: ReleaseEntry[], count: number) {
  const seen = new Set<string>()
  const result: ReleaseEntry[] = []

  for (const entry of entries) {
    if (seen.has(entry.product.id)) continue
    seen.add(entry.product.id)
    result.push(entry)
    if (result.length === count) break
  }

  return result
}

function watchReason(entry: ReleaseEntry, it: boolean) {
  const signal = entry.signal
  if (!signal) return it ? "Mercato attivo" : "Active market"

  const trend = collectorMarketTrend(signal)
  if (trend != null && trend >= 3) {
    const value = Math.abs(trend).toLocaleString(it ? "it-IT" : "en-US", { maximumFractionDigits: 1 })
    return `Trend +${value}%`
  }

  if ((signal.recentSoldUnits3m ?? 0) > 0) {
    return it
      ? `${signal.recentSoldUnits3m} vendite recenti`
      : `${signal.recentSoldUnits3m} recent sales`
  }

  if ((signal.soldUnits ?? 0) > 0) {
    return it
      ? `${signal.soldUnits} vendite osservate`
      : `${signal.soldUnits} observed sales`
  }

  if ((signal.currentOfferCount ?? 0) > 0) {
    return it
      ? `${signal.currentOfferCount} annunci attivi`
      : `${signal.currentOfferCount} active listings`
  }

  return it ? "Mercato attivo" : "Active market"
}

function trendText(signal: ReleaseMarketSignalView | null, it: boolean) {
  if (!signal) return null
  const trend = collectorMarketTrend(signal)
  if (trend == null) return null

  const value = Math.abs(trend).toLocaleString(it ? "it-IT" : "en-US", { maximumFractionDigits: 1 })
  if (trend > 0) return `+${value}%`
  if (trend < 0) return `−${value}%`
  return "0%"
}

export function PublicHomeScreen({ products, copies = [] }: { products: Product[]; copies?: ShopCopy[] }) {
  const { locale } = useI18n()
  const it = locale === "it"
  const signals = useMarketSignals()
  const carouselRef = React.useRef<HTMLDivElement>(null)

  const releases = React.useMemo<ReleaseEntry[]>(
    () =>
      products.flatMap((product) =>
        product.releases.map((release) => ({
          product,
          release,
          signal: signals[release.id] ?? null,
        })),
      ),
    [products, signals],
  )

  const watchList = React.useMemo(() => {
    const ranked = [...releases]
      .filter(({ release, signal }) => {
        if (!release.itemNumber || !release.images?.length || !signal) return false
        if (signal.valueEUR == null || signal.valueEUR <= 0) return false

        const trend = collectorMarketTrend(signal)
        if (trend != null && trend < 0) return false

        const hasMeaningfulActivity =
          (signal.recentSoldUnits3m ?? 0) > 0 ||
          (signal.soldUnits ?? 0) >= 3 ||
          (signal.currentOfferCount ?? 0) >= 5

        return hasMeaningfulActivity
      })
      .sort((a, b) => marketScore(b) - marketScore(a))

    const checked = latestVerifiedAskingRows(releases.filter(
      (entry): entry is ReleaseEntry & { signal: ReleaseMarketSignalView } => entry.signal != null && Boolean(entry.release.itemNumber),
    ))
    return distinctByProduct([...checked, ...ranked], 4)
  }, [releases])

  const scrollCarousel = (direction: -1 | 1) => {
    const element = carouselRef.current
    if (!element) return
    element.scrollBy({ left: direction * Math.max(280, element.clientWidth * 0.72), behavior: "smooth" })
  }

  return (
    <div className="td-public-home overflow-hidden bg-background">
      <section data-reveal="hero" className="relative overflow-hidden border-b border-line bg-[#eef3f7]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-brand" />
        <div className="relative mx-auto w-full max-w-[1440px] px-4 pb-10 pt-12 sm:px-6 lg:px-8 lg:pb-9 lg:pt-12">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(500px,.92fr)] lg:items-center lg:gap-8 xl:grid-cols-[minmax(0,1.04fr)_minmax(560px,.96fr)] xl:gap-10">
            <div className="td-hero-copy relative z-10 max-w-[46rem]">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground sm:text-[11px]">
                {it ? "LA CASA DIGITALE DEI COLLEZIONISTI MINI 4WD" : "THE DIGITAL HOME FOR MINI 4WD COLLECTORS"}
              </p>
              <h1 className="mt-5 text-[clamp(3.2rem,13vw,5.6rem)] font-semibold leading-[.88] tracking-[-0.075em] text-ink lg:max-w-[44rem] lg:text-[3.75rem] lg:leading-[.94] xl:text-[4.1rem]">
                {it ? "Trova la versione esatta." : "Find the exact version."}
                <span className="block text-brand">{it ? "Segui il suo valore." : "Track its value."}</span>
              </h1>
              <p className="mt-6 max-w-[42rem] text-base leading-7 text-muted-foreground md:text-lg lg:mt-5">
                {it
                  ? "Identifica la Release esatta, scopri quanto vale, registrala nella tua collezione, controlla il mercato e entra in contatto con altri collezionisti per comprare o vendere."
                  : "Identify the exact Release, discover what it is worth, add it to your collection, watch the market and connect with other collectors to buy or sell."}
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:mt-6">
                <Link href={localizePublicPath("/catalog", locale)} className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-brand px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0e49c7]">
                  {it ? "Esplora il catalogo" : "Explore the catalog"} <ArrowRight className="size-4" />
                </Link>
                <Link href={localizePublicPath("/market", locale)} className="inline-flex h-12 items-center justify-center rounded-md border border-line bg-white px-5 text-sm font-semibold text-navy transition hover:bg-brand-muted">
                  {it ? "Scopri i valori di mercato" : "Explore market values"}
                </Link>
                <Link href="/signup" className="inline-flex h-12 items-center justify-center rounded-md bg-navy px-5 text-sm font-semibold text-white transition hover:bg-[#102c55]">
                  {it ? "Crea account gratuito" : "Create free account"}
                </Link>
              </div>
              <p className="mt-4 max-w-[43rem] text-xs leading-5 text-muted-foreground">
                {it
                  ? "Catalogo e valori sono consultabili da tutti. Crea un account per Collezione, Desideri, Scanner, messaggi e offerte tra collezionisti."
                  : "Catalog and market values are open to everyone. Create an account for Collection, Wishlist, Scanner, messages and collector offers."}
              </p>
            </div>

            <div className="td-hero-art relative flex min-h-[300px] items-center justify-center sm:min-h-[390px] lg:hidden">
              <img
                src="/trackdash-hero-mini4wd-transparent.svg"
                alt={it ? "Avante Jr., Dash-1 Emperor, Neo-Tridagger ZMC e Magnum Saber in esposizione" : "Avante Jr., Dash-1 Emperor, Neo-Tridagger ZMC and Magnum Saber on display"}
                className="h-auto max-h-[430px] w-full object-contain"
                width={800}
                height={450}
                loading="eager"
                fetchPriority="high"
              />
            </div>

            <div className="td-hero-art relative hidden min-h-[360px] overflow-hidden lg:block xl:min-h-[390px]">
              <img
                src="/trackdash-hero-mini4wd-transparent.svg"
                alt={it ? "Avante Jr., Dash-1 Emperor, Neo-Tridagger ZMC e Magnum Saber in esposizione" : "Avante Jr., Dash-1 Emperor, Neo-Tridagger ZMC and Magnum Saber on display"}
                className="absolute right-[1%] top-1/2 h-auto w-[98%] max-w-none -translate-y-1/2 object-contain xl:right-[2%] xl:w-[101%]"
                width={800}
                height={450}
                loading="eager"
                fetchPriority="high"
              />
            </div>
          </div>

          <div className="mt-7 border border-line bg-white/80 p-4 shadow-[0_12px_34px_rgba(15,23,42,0.05)] backdrop-blur-sm sm:p-5 lg:mt-5">
            <div className="mb-3">
              <p className="text-sm font-semibold text-ink">{it ? "Trova subito la tua Mini 4WD" : "Find your Mini 4WD now"}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {it ? "Cerca per nome o codice articolo e vai direttamente al catalogo." : "Search by name or item number and jump straight to the catalog."}
              </p>
            </div>
            <form action="/catalog" className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-brand" />
                <input
                  type="search"
                  name="q"
                  placeholder={it ? "Es. 18069, 95467, Avante, Dash-1 Emperor…" : "E.g. 18069, 95467, Avante, Dash-1 Emperor…"}
                  className="h-14 w-full rounded-md border border-line bg-white pl-12 pr-4 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
                  aria-label={it ? "Cerca modello o codice articolo" : "Search model or item number"}
                />
              </div>
              <button type="submit" className="inline-flex h-14 items-center justify-center gap-2 rounded-md bg-navy px-6 text-sm font-semibold text-white transition hover:bg-[#102c55]">
                {it ? "Cerca nel catalogo" : "Search catalog"} <ArrowRight className="size-4" />
              </button>
            </form>
          </div>
        </div>
      </section>

      {watchList.length > 0 ? (
        <section data-reveal className="bg-white">
          <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
            <div className="flex items-end justify-between gap-5">
              <div>
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-brand">
                  {it ? "DAL MERCATO" : "FROM THE MARKET"}
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.055em] text-ink sm:text-4xl md:text-5xl">
                  {it ? "Release da tenere d’occhio." : "Releases to keep an eye on."}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                  {it
                    ? "Quotazioni verificate di recente e movimenti confermati."
                    : "Recently verified quotes and confirmed movements."}
                </p>
              </div>
              <div className="hidden gap-2 sm:flex">
                <button
                  type="button"
                  onClick={() => scrollCarousel(-1)}
                  className="inline-flex size-10 items-center justify-center border border-line bg-white text-navy transition hover:bg-brand-muted"
                  aria-label={it ? "Scorri indietro" : "Scroll back"}
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollCarousel(1)}
                  className="inline-flex size-10 items-center justify-center border border-line bg-white text-navy transition hover:bg-brand-muted"
                  aria-label={it ? "Scorri avanti" : "Scroll forward"}
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>

            <div
              ref={carouselRef}
              className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {watchList.map((entry) => (
                <WatchCard key={entry.release.id} entry={entry} it={it} locale={locale} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section data-reveal id="how-it-works" className="bg-[#eef4fb]">
        <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {it ? "COSA PUOI FARE CON TRACKDASH" : "WHAT YOU CAN DO WITH TRACKDASH"}
          </p>
          <h2 className="mt-4 max-w-3xl text-4xl font-semibold leading-[.96] tracking-[-0.06em] text-ink md:text-6xl">
            {it ? "Pensato per il modo in cui collezioni davvero." : "Built around how collectors actually collect."}
          </h2>

          <div className="mt-9 grid gap-4 md:grid-cols-2">
            <FeatureCard
              number="01"
              icon={Search}
              title={it ? "Trova il tuo modello." : "Find your model."}
              text={
                it
                  ? "Cerca per nome, anno, chassis o codice articolo. Apri la Release corretta e scopri subito i dati disponibili e il suo valore di mercato."
                  : "Search by name, year, chassis or item number. Open the correct Release and see the available data and market value."
              }
              tone="light"
              href={localizePublicPath("/catalog", locale)}
              linkLabel={it ? "Vai al catalogo" : "Open catalog"}
            />
            <FeatureCard
              number="02"
              icon={ShieldCheck}
              title={it ? "Scopri quanto vale oggi." : "See what it is worth today."}
              text={
                it
                  ? "Riferimento mercato, vendite concluse e prezzi negli annunci ti aiutano a conoscere il valore della tua Release, ciascuno con la propria etichetta."
                  : "Market Value, completed sales and asking prices help you understand your Release, each with its own label."
              }
              tone="dark"
              href={localizePublicPath("/market", locale)}
              linkLabel={it ? "Scopri i valori" : "Explore values"}
            />
            <FeatureCard
              number="03"
              icon={Boxes}
              title={it ? "Organizza la tua collezione." : "Organise your collection."}
              text={
                it
                  ? "Aggiungi le Release che possiedi, indica la condizione di ogni copia e consulta la stima aggiornata delle sole copie sigillate."
                  : "Add the Releases you own, record each copy's condition and see the updated estimate for sealed copies only."
              }
              tone="brand"
              href="/login?next=%2Fcollection"
              linkLabel={it ? "Vai alla collezione" : "Open collection"}
            />
            <FeatureCard
              number="04"
              icon={TrendingUp}
              title={it ? "Controlla il mercato." : "Watch the market."}
              text={
                it
                  ? "Segui vendite concluse, prezzi negli annunci, disponibilità e trend quando i dati sono sufficienti. Così capisci come si sta muovendo davvero ogni Release."
                  : "Follow completed sales, listing prices, availability and trends when enough data is available, so you can see how each Release is really moving."
              }
              tone="soft"
              href={localizePublicPath("/market", locale)}
              linkLabel={it ? "Controlla il mercato" : "Watch the market"}
            />
            <div className="md:col-span-2">
              <FeatureCard
                number="05"
                icon={MessageCircle}
                title={it ? "Compra e vendi tra collezionisti." : "Buy and sell with collectors."}
                text={
                  it
                    ? "Rendi una copia disponibile alle offerte oppure trova la Release che cerchi. Scrivi agli altri collezionisti, fai offerte, controproposte e raggiungi un accordo."
                    : "Open a copy to offers or find the Release you want. Message other collectors, make offers, counteroffers and reach an agreement."
                }
                tone="dark"
                href="/signup?next=%2Fmessages"
                linkLabel={it ? "Crea account e partecipa" : "Create an account and join"}
              />
            </div>
          </div>
        </div>
      </section>

      <HomeDiscovery products={products} copies={copies} />

      <section data-reveal className="bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid gap-7 border border-line bg-[#f8fafc] p-7 sm:p-9 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-brand">{it ? "INIZIA DA QUI" : "START HERE"}</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-ink md:text-4xl">
                {it ? "Scopri. Colleziona. Scambia." : "Discover. Collect. Trade."}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                {it
                  ? "Crea il tuo account e inserisci le Release che possiedi. Più collezioni crescono su TrackDash, più diventa facile trovare una Release, contattare il collezionista e fare un’offerta."
                  : "Create your account and add the Releases you own. As more collections grow on TrackDash, it becomes easier to find a Release, contact the collector and make an offer."}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/signup?next=%2Fcollection" className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-brand px-5 text-sm font-semibold text-white">
                {it ? "Crea account gratuito" : "Create free account"} <ArrowRight className="size-4" />
              </Link>
              <Link href={localizePublicPath("/market", locale)} className="inline-flex h-11 items-center justify-center rounded-md border border-line bg-white px-5 text-sm font-semibold text-navy">
                {it ? "Tieni d’occhio il mercato" : "Watch the market"}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}


function WatchCard({ entry, it, locale }: { entry: ReleaseEntry; it: boolean; locale: PublicLocale }) {
  const { product, release, signal } = entry
  const checked = verifiedAskingObservation(signal)
  const price = checked?.priceEUR ?? signal?.valueEUR

  return (
    <Link
      href={releaseHref(product, release, locale)}
      className="group min-w-[82%] snap-start overflow-hidden border border-line bg-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-navy/10 sm:min-w-[46%] lg:min-w-[31%]"
    >
      <div className="relative aspect-[4/3] bg-brand-muted p-4">
        <ProductImage product={product} release={release} className="h-full w-full border-0 bg-transparent object-contain transition-transform duration-300 group-hover:scale-[1.03]" />
        <span className="absolute left-3 top-3 rounded-full bg-navy px-3 py-1 text-[10px] font-semibold text-white">
          {watchReason(entry, it)}
        </span>
      </div>
      <div className="p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Tamiya #{release.itemNumber ?? "—"}</p>
        <h3 className="mt-2 line-clamp-2 text-lg font-semibold tracking-[-0.035em] text-ink">{release.editionName}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{release.releaseYear ?? "—"} · {release.chassis ?? product.chassis ?? "—"}</p>
        <div className="mt-4 flex items-end justify-between gap-3 border-t border-line pt-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{checked ? (it ? "Prezzi negli annunci" : "Listing prices") : (it ? "Riferimento mercato" : "Market reference")}</p>
            <p className="mt-0.5 text-lg font-semibold text-navy">{price != null ? formatMoney(price) : (it ? "Dati in arrivo" : "Data coming soon")}</p>
            {checked ? <p className="mt-1 text-[11px] text-muted-foreground">{it ? "Verificato il" : "Checked on"} {new Intl.DateTimeFormat(it ? "it-IT" : "en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(checked.observedAt))}</p> : null}
            {checked && signal?.representativeAskSellerCount ? <p className="mt-1 text-[11px] text-muted-foreground">{it ? "Prezzi rilevati" : "Seller quotes"} · {signal.representativeAskSellerCount} {it ? "venditori" : "sellers"}</p> : null}
          </div>
          {trendText(signal, it) ? (
            <span className="text-sm font-semibold text-emerald-700">
              {trendText(signal, it)}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  )
}

function FeatureCard({
  number,
  icon: Icon,
  title,
  text,
  tone,
  href,
  linkLabel,
}: {
  number: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  text: string
  tone: "light" | "dark" | "brand" | "soft"
  href?: string
  linkLabel?: string
}) {
  const classes =
    tone === "dark"
      ? "bg-navy text-white"
      : tone === "brand"
        ? "bg-brand text-white"
        : tone === "soft"
          ? "bg-white text-ink"
          : "bg-[#f8fafc] text-ink"

  const muted = tone === "dark" || tone === "brand" ? "text-white/72" : "text-muted-foreground"
  const accent = tone === "dark" || tone === "brand" ? "text-white" : "text-brand"

  return (
    <article className={`min-h-[270px] p-6 sm:p-8 ${classes}`}>
      <div className="flex items-center justify-between">
        <span className={`font-mono text-[11px] font-bold tracking-[0.18em] ${accent}`}>{number}</span>
        <Icon className={`size-6 ${accent}`} />
      </div>
      <h3 className="mt-12 max-w-md text-2xl font-semibold leading-tight tracking-[-0.045em] sm:text-3xl">{title}</h3>
      <p className={`mt-4 max-w-lg text-sm leading-6 sm:text-base ${muted}`}>{text}</p>
      {href && linkLabel ? (
        <Link href={href} className={`mt-6 inline-flex items-center gap-2 text-sm font-semibold ${accent}`}>
          {linkLabel} <ArrowRight className="size-4" />
        </Link>
      ) : null}
    </article>
  )
}

function CollectionPoint({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  text: string
}) {
  return (
    <div className="border border-line bg-[#f8fafc] p-4">
      <Icon className="size-5 text-brand" />
      <p className="mt-3 text-sm font-semibold text-ink">{title}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p>
    </div>
  )
}
