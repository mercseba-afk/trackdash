"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowRight,
  Barcode,
  Boxes,
  ChevronLeft,
  ChevronRight,
  Copy,
  Heart,
  HandCoins,
  Handshake,
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
import { collectorMarketTrend } from "@/lib/market/presentation"
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
  if (!signal) return it ? "Dal mercato" : "From the market"

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

  return it ? "Release in crescita" : "Rising Release"
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

export function PublicHomeScreen({ products }: { products: Product[] }) {
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
        if (trend == null || trend <= 0) return false

        return true
      })
      .sort((a, b) => marketScore(b) - marketScore(a))

    return distinctByProduct(ranked, 4)
  }, [releases])

  const familyProduct = React.useMemo(() => {
    return [...products]
      .filter((product) => product.releases.length >= 2)
      .sort((a, b) => {
        const score = (product: Product) =>
          product.releases.length * 10 +
          product.releases.filter((release) => signals[release.id]?.valueEUR != null).length * 4 +
          product.releases.filter((release) => (signals[release.id]?.trendPercent ?? 0) > 0).length * 6
        return score(b) - score(a)
      })[0]
  }, [products, signals])

  const familyPreviewRelease = familyProduct
    ? familyProduct.releases.find((release) => release.images?.length) ?? familyProduct.releases[0]
    : null

  const marketDemo = React.useMemo(() => {
    const growing = releases
      .filter(
        ({ signal }) =>
          signal?.valueEUR != null &&
          signal.trendPercent != null &&
          signal.trendPercent > 0 &&
          signal.lowEUR != null &&
          signal.highEUR != null &&
          signal.highEUR > signal.lowEUR,
      )
      .sort((a, b) => (b.signal?.trendPercent ?? 0) - (a.signal?.trendPercent ?? 0))

    if (growing[0]) return growing[0]

    return releases
      .filter(({ signal }) =>
        signal?.valueEUR != null &&
        (signal.trendPercent == null || signal.trendPercent > 0),
      )
      .sort((a, b) => marketScore(b) - marketScore(a))[0] ?? null
  }, [releases])

  const scannerExample = watchList[1] ?? watchList[0] ?? releases[0] ?? null

  const scrollCarousel = (direction: -1 | 1) => {
    const element = carouselRef.current
    if (!element) return
    element.scrollBy({ left: direction * Math.max(280, element.clientWidth * 0.72), behavior: "smooth" })
  }

  return (
    <div className="overflow-hidden bg-background">
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
                    ? "Una selezione basata sui dati che TrackDash sta osservando: trend, vendite recenti e attività di mercato."
                    : "A selection based on the data TrackDash is observing: trends, recent sales and market activity."}
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
                  ? "Valore di mercato, vendite concluse e ASK restano distinti. Così puoi capire meglio il valore della tua Release senza confondere un prezzo richiesto con uno realmente pagato."
                  : "Market Value, completed sales and ASK remain distinct, so you can understand a Release without confusing an asking price with one actually paid."
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
                  ? "Segui vendite concluse, ASK, disponibilità e trend quando i dati sono sufficienti. Così capisci come si sta muovendo davvero ogni Release."
                  : "Follow completed sales, ASK, availability and trends when enough data is available, so you can see how each Release is really moving."
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

      {familyProduct && familyPreviewRelease ? (
        <section data-reveal className="border-y border-line bg-white">
          <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[.85fr_1.15fr] lg:px-8 lg:py-16">
            <div className="flex min-h-[340px] items-center justify-center bg-brand-muted p-6 sm:p-8">
              <ProductImage
                product={familyProduct}
                release={familyPreviewRelease}
                className="h-[300px] w-full max-w-[520px] border-0 bg-transparent object-contain"
                size="lg"
              />
            </div>

            <div className="flex flex-col justify-center">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-brand">
                {it ? "MODELLO E RELEASE" : "MODEL AND RELEASES"}
              </p>
              <h2 className="mt-3 text-4xl font-semibold leading-[.97] tracking-[-0.055em] text-ink md:text-5xl">
                {it ? "Trova il tuo modello. Scopri tutte le sue Release." : "Find your model. Discover all its Releases."}
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground md:text-base">
                {it
                  ? "Cerca una Mini 4WD e confronta le sue diverse versioni: originali, ristampe ed edizioni speciali possono avere storia, caratteristiche e valore diversi."
                  : "Search for a Mini 4WD and compare its versions: originals, reissues and special editions can have different history, features and value."}
              </p>

              <div className="mt-7 overflow-hidden border border-line">
                {familyProduct.releases.slice(0, 4).map((release) => (
                  <Link
                    key={release.id}
                    href={releaseHref(familyProduct, release, locale)}
                    className="grid grid-cols-[72px_1fr_auto] items-center gap-3 border-b border-line bg-white px-3 py-3 last:border-b-0 hover:bg-brand-muted/60"
                  >
                    <div className="font-mono text-xs font-semibold text-brand">{release.releaseYear ?? "—"}</div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{release.editionName}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        #{release.itemNumber ?? "—"} · {release.chassis ?? "—"}
                      </p>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>

              <Link href={localizePublicPath("/catalog", locale)} className="mt-6 inline-flex items-center gap-2 self-start text-sm font-semibold text-brand">
                {it ? "Trova il tuo modello nel catalogo" : "Find your model in the catalog"} <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <section data-reveal className="bg-navy text-white">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[.85fr_1.15fr] lg:px-8 lg:py-16">
          <div className="flex flex-col justify-center">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-white/65">{it ? "ANALISI DI MERCATO" : "PRICE INTELLIGENCE"}</p>
            <h2 className="mt-4 text-4xl font-semibold leading-[.96] tracking-[-0.06em] md:text-6xl">
              {marketDemo?.signal?.trendPercent != null
                ? (it ? "Capisci quanto vale oggi. E come si sta muovendo." : "Understand what it is worth today. And how it is moving.")
                : (it ? "Capisci quanto vale oggi." : "Understand what it is worth today.")}
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-6 text-white/75 md:text-base">
              {it
                ? "TrackDash confronta vendite concluse, prezzi nei negozi e ASK — i prezzi richiesti negli annunci attivi — e pubblica una stima solo quando i dati sono sufficienti. Il trend compare quando esiste abbastanza storico."
                : "TrackDash compares completed sales, store prices and ASK — prices requested in active listings — and only publishes an estimate when the data is sufficient."}
            </p>
            <Link href={localizePublicPath("/market", locale)} className="mt-7 inline-flex items-center gap-2 self-start text-sm font-semibold text-white underline decoration-brand-red decoration-2 underline-offset-4">
              {it ? "Scopri i valori di mercato" : "Explore market values"} <ArrowRight className="size-4" />
            </Link>
          </div>

          {marketDemo ? <MarketPreview entry={marketDemo} it={it} /> : null}
        </div>
      </section>

      <section data-reveal className="bg-white">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[.95fr_1.05fr] lg:px-8 lg:py-16">
          <div className="flex flex-col justify-center">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-brand">
              {it ? "LA TUA COLLEZIONE" : "YOUR COLLECTION"}
            </p>
            <h2 className="mt-3 max-w-xl text-4xl font-semibold leading-[.97] tracking-[-0.055em] text-ink md:text-5xl">
              {it ? "Tutto quello che possiedi, in un unico posto." : "Everything you own, in one place."}
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-6 text-muted-foreground md:text-base">
              {it
                ? "Registra le Release che possiedi, indica la condizione di ogni copia e controlla il mercato. Per le copie sigillate TrackDash può usare il Market Value aggiornato come stima; per copie aperte o usate non inventa svalutazioni."
                : "Register the Releases you own, record each copy's condition and watch the market. For sealed copies TrackDash can use the latest Market Value as an estimate; for opened or used copies it does not invent discounts."}
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <CollectionPoint icon={Boxes} title={it ? "Release esatte" : "Exact Releases"} text={it ? "Sai quale versione possiedi davvero." : "Know exactly which version you own."} />
              <CollectionPoint icon={Copy} title={it ? "Più copie" : "Multiple copies"} text={it ? "Gestisci più esemplari della stessa Release." : "Manage multiple copies of the same Release."} />
              <CollectionPoint icon={TrendingUp} title={it ? "Valore stimato" : "Estimated value"} text={it ? "Stima aggiornata delle copie sigillate, senza inventare valori per aperte o usate." : "Updated estimate for sealed copies, without inventing values for opened or used ones."} />
              <CollectionPoint icon={Heart} title={it ? "Desideri" : "Wishlist"} text={it ? "Tieni separato ciò che hai da ciò che stai cercando." : "Keep what you own separate from what you want."} />
            </div>
            <Link href="/login?next=%2Fcollection" className="mt-7 inline-flex items-center gap-2 self-start text-sm font-semibold text-brand">
              {it ? "Apri la tua collezione" : "Open your collection"} <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="overflow-hidden border border-line bg-[#eef4fb] p-4 sm:p-6">
            <div className="rounded-xl bg-white p-5 shadow-[0_18px_45px_rgba(11,50,117,0.10)] sm:p-6">
              <div className="border-b border-line pb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{it ? "IL TUO PERCORSO SU TRACKDASH" : "YOUR TRACKDASH FLOW"}</p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-ink">{it ? "Dalla tua Release alla prossima." : "From your Release to the next one."}</p>
              </div>
              <div className="mt-4 grid gap-3">
                <FlowStep number="01" icon={ShieldCheck} title={it ? "Scopri quanto vale" : "Discover what it is worth"} text={it ? "Apri la Release esatta e consulta valore di mercato, vendite e ASK disponibili." : "Open the exact Release and check available Market Value, sales and ASK."} />
                <FlowStep number="02" icon={Boxes} title={it ? "Registra la tua collezione" : "Build your collection"} text={it ? "Aggiungi le Release che possiedi e tieni ogni copia collegata alla versione corretta." : "Add the Releases you own and keep every copy tied to the correct version."} />
                <FlowStep number="03" icon={TrendingUp} title={it ? "Controlla il mercato" : "Watch the market"} text={it ? "Segui prezzi, disponibilità, vendite e trend per capire quando il mercato si muove." : "Follow prices, availability, sales and trends to see when the market moves."} />
                <FlowStep number="04" icon={Handshake} title={it ? "Compra e vendi altre Release" : "Buy and sell other Releases"} text={it ? "Trova copie offerte da altri collezionisti oppure apri le tue alle offerte e tratta direttamente con loro." : "Find copies offered by other collectors or open yours to offers and negotiate directly with them."} />
              </div>
              <p className="mt-4 border-l-2 border-brand pl-3 text-xs leading-5 text-muted-foreground">
                {it ? "Pagamento e spedizione vengono concordati direttamente tra i collezionisti." : "Payment and shipping are arranged directly between collectors."}
              </p>
            </div>
          </div>
        </div>
      </section>


      <section data-reveal id="community" className="border-y border-line bg-[#f8fafc]">
        <div className="mx-auto grid w-full max-w-7xl gap-9 px-4 py-14 sm:px-6 lg:grid-cols-[.9fr_1.1fr] lg:px-8 lg:py-16">
          <div className="flex flex-col justify-center">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-brand">
              {it ? "TRA COLLEZIONISTI" : "COLLECTOR TO COLLECTOR"}
            </p>
            <h2 className="mt-3 max-w-xl text-4xl font-semibold leading-[.97] tracking-[-0.055em] text-ink md:text-5xl">
              {it ? "Trova la Release che cerchi, contatta il collezionista e fai la tua offerta." : "Find the Release you want, contact the collector and make your offer."}
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-6 text-muted-foreground md:text-base">
              {it
                ? "Le copie condivise dai collezionisti possono comparire direttamente nella scheda della Release. Da lì puoi entrare in contatto con il proprietario, aprire una conversazione e inviare un’offerta."
                : "Copies shared by collectors can appear directly on the Release page. From there you can contact the owner, start a conversation and make an offer."}
            </p>

            <div className="mt-7 grid gap-3">
              <CollectionPoint
                icon={MessageCircle}
                title={it ? "Chat tra collezionisti" : "Collector chat"}
                text={it ? "Parlate della Release e dei dettagli prima di concludere." : "Discuss the Release and the details before agreeing a deal."}
              />
              <CollectionPoint
                icon={HandCoins}
                title={it ? "Offerte e controproposte" : "Offers and counteroffers"}
                text={it ? "Invia una proposta; il venditore può accettare, rifiutare o controproporre." : "Send an offer; the seller can accept, decline or counter."}
              />
              <CollectionPoint
                icon={Handshake}
                title={it ? "Accordo e vendita confermata" : "Agreement and confirmed sale"}
                text={it ? "Una vendita conclusa può essere confermata da entrambi e contribuire ai dati aggregati di mercato." : "A completed sale can be confirmed by both collectors and contribute to aggregated market data."}
              />
            </div>

            <p className="mt-5 max-w-xl border-l-2 border-brand pl-4 text-xs leading-5 text-muted-foreground">
              {it
                ? "TrackDash non gestisce ancora pagamento o spedizione: vengono concordati direttamente tra gli utenti. La piattaforma facilita contatto, trattativa e conferma dell’accordo."
                : "TrackDash does not yet handle payment or shipping: collectors arrange those directly. The platform supports contact, negotiation and confirmation of the agreement."}
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup?next=%2Fmessages" className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-brand px-5 text-sm font-semibold text-white">
                {it ? "Crea account gratuito" : "Create free account"} <ArrowRight className="size-4" />
              </Link>
              <Link href="/login?next=%2Fmessages" className="inline-flex h-11 items-center justify-center rounded-md border border-line bg-white px-5 text-sm font-semibold text-navy">
                {it ? "Accedi ai messaggi" : "Open messages"}
              </Link>
            </div>
          </div>

          <div className="flex items-center">
            <div className="w-full overflow-hidden border border-line bg-white shadow-[0_20px_55px_rgba(11,50,117,0.10)]">
              <div className="flex items-center justify-between border-b border-line bg-navy px-5 py-4 text-white">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/60">{it ? "TRATTATIVA" : "DEAL"}</p>
                  <p className="mt-1 font-semibold">{it ? "Una Release tra due collezionisti" : "A Release between two collectors"}</p>
                </div>
                <Handshake className="size-5 text-white/80" />
              </div>
              <div className="space-y-3 p-5 sm:p-6">
                <div className="ml-auto max-w-[82%] rounded-2xl rounded-br-sm bg-brand px-4 py-3 text-sm leading-5 text-white">
                  {it ? "Ciao! È ancora disponibile? Vorrei farti un’offerta." : "Hi! Is it still available? I’d like to make an offer."}
                </div>
                <div className="max-w-[82%] rounded-2xl rounded-bl-sm bg-brand-muted px-4 py-3 text-sm leading-5 text-navy">
                  {it ? "Sì, è disponibile. Mandami pure la proposta." : "Yes, it is. Send me your offer."}
                </div>
                <div className="mt-5 border border-line bg-[#f8fafc] p-4">
                  <div className="flex items-center gap-2">
                    <HandCoins className="size-4 text-brand" />
                    <p className="text-sm font-semibold text-ink">{it ? "Offerta strutturata" : "Structured offer"}</p>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    {it ? "Il venditore può accettare, rifiutare o inviare una controproposta." : "The seller can accept, decline or send a counteroffer."}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-md bg-brand px-3 py-2 text-xs font-semibold text-white">{it ? "Accetta" : "Accept"}</span>
                    <span className="rounded-md border border-line bg-white px-3 py-2 text-xs font-semibold text-navy">{it ? "Controproponi" : "Counter"}</span>
                    <span className="rounded-md border border-line bg-white px-3 py-2 text-xs font-semibold text-muted-foreground">{it ? "Rifiuta" : "Decline"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 border border-brand/20 bg-brand/5 p-4">
                  <Handshake className="size-5 shrink-0 text-brand" />
                  <div>
                    <p className="text-sm font-semibold text-ink">{it ? "Accordo raggiunto" : "Deal agreed"}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{it ? "Pagamento e spedizione vengono concordati direttamente tra i due collezionisti." : "Payment and shipping are arranged directly between the two collectors."}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {scannerExample ? (
        <section data-reveal className="border-y border-line bg-[#eef4fb]">
          <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_1fr] lg:px-8 lg:py-16">
            <div className="relative overflow-hidden bg-navy p-5 text-white sm:p-7">
              <div className="mx-auto max-w-md rounded-[28px] border border-white/15 bg-[#07162f] p-3 shadow-2xl">
                <div className="relative aspect-[4/3] overflow-hidden rounded-[20px] bg-white">
                  <ProductImage product={scannerExample.product} release={scannerExample.release} className="h-full w-full border-0 bg-white object-contain" />
                  <div className="pointer-events-none absolute inset-x-5 top-1/2 h-0.5 bg-brand-red shadow-[0_0_16px_rgba(255,30,30,.65)] animate-pulse" />
                  <div className="absolute inset-4 rounded-xl border border-brand/40" />
                </div>
                <div className="mt-3 rounded-[18px] bg-white p-4 text-ink">
                  <div className="flex items-center gap-2 text-brand">
                    <Sparkles className="size-4" />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.15em]">{it ? "Scheda trovata" : "Match found"}</span>
                  </div>
                  <p className="mt-2 font-semibold">{scannerExample.release.editionName}</p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    #{scannerExample.release.itemNumber ?? "—"} · {scannerExample.release.releaseYear ?? "—"} · {scannerExample.release.chassis ?? "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-brand">{it ? "SCANNER" : "SCANNER"}</p>
              <h2 className="mt-3 text-4xl font-semibold leading-[.97] tracking-[-0.055em] text-ink md:text-5xl">
                {it ? "Scansiona la scatola. Trova subito la scheda corretta." : "Scan the box. Find the right page instantly."}
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-6 text-muted-foreground md:text-base">
                {it
                  ? "Inquadra il codice a barre della confezione oppure inserisci il codice articolo (Item Number). TrackDash identifica il modello e, quando possibile, la Release esatta."
                  : "Scan the barcode on the box or enter the Item Number. TrackDash identifies the model and, when possible, the exact Release."}
              </p>
              <div className="mt-6 flex gap-3 border-l-2 border-brand pl-4">
                <Barcode className="mt-0.5 size-5 shrink-0 text-brand" />
                <p className="text-sm leading-6 text-muted-foreground">
                  {it
                    ? "Se lo stesso codice è stato riutilizzato per più Release, TrackDash non sceglie a caso: ti mostra le versioni da verificare."
                    : "If the same code was reused for multiple Releases, TrackDash does not guess: it shows the versions to verify."}
                </p>
              </div>
              <Link href="/login?next=%2Fscanner" className="mt-7 inline-flex items-center gap-2 self-start text-sm font-semibold text-brand">
                {it ? "Prova lo Scanner" : "Try the Scanner"} <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>
      ) : null}

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
            <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{it ? "Valore di mercato" : "Market Value"}</p>
            <p className="mt-0.5 text-lg font-semibold text-navy">{signal?.valueEUR != null ? formatMoney(signal.valueEUR) : (it ? "Dati in arrivo" : "Data coming soon")}</p>
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

function MarketPreview({ entry, it }: { entry: ReleaseEntry; it: boolean }) {
  const { product, release, signal } = entry
  if (!signal) return null

  const hasRange = signal.lowEUR != null && signal.highEUR != null && signal.highEUR > signal.lowEUR

  return (
    <div className="overflow-hidden bg-white text-ink shadow-[0_24px_70px_rgba(0,0,0,.22)]">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-brand">{it ? "ESEMPIO REALE" : "REAL EXAMPLE"}</p>
          <p className="mt-1 text-sm font-semibold">{release.editionName}</p>
        </div>
        {signal.trendPercent != null && signal.trendPercent > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <TrendingUp className="size-3.5" /> {trendText(signal, it)}
          </span>
        ) : signal.soldUnits > 0 ? (
          <span className="rounded-full bg-brand-muted px-3 py-1 text-xs font-semibold text-brand">
            {signal.soldUnits} {it ? "vendite osservate" : "observed sales"}
          </span>
        ) : null}
      </div>

      <div className="grid sm:grid-cols-[.82fr_1.18fr]">
        <div className="flex min-h-[250px] items-center justify-center bg-brand-muted p-5">
          <ProductImage product={product} release={release} className="h-[220px] w-full border-0 bg-transparent object-contain" />
        </div>
        <div className="p-5 sm:p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{it ? "Valore di mercato" : "Market Value"}</p>
          <div className="mt-2 flex items-end gap-3">
            <p className="text-4xl font-semibold tracking-[-0.06em] text-navy">{signal.valueEUR != null ? formatMoney(signal.valueEUR) : "—"}</p>
            {signal.trendPercent != null ? <span className="pb-1 text-sm font-semibold text-emerald-700">{trendText(signal, it)}</span> : null}
          </div>
          <div className="mt-5 h-16 overflow-hidden border-b border-line">
            <svg viewBox="0 0 320 64" className="h-full w-full" preserveAspectRatio="none" aria-hidden="true">
              <path d="M0 54 C48 50 72 47 110 42 S168 31 202 36 S256 20 320 10" fill="none" stroke="currentColor" strokeWidth="4" className="text-brand" />
              <path d="M0 54 C48 50 72 47 110 42 S168 31 202 36 S256 20 320 10 L320 64 L0 64 Z" className="fill-brand/10" />
            </svg>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <SmallMetric
              label={it ? "Fascia indicativa" : "Estimated range"}
              value={hasRange ? `${formatMoney(signal.lowEUR!)}–${formatMoney(signal.highEUR!)}` : "—"}
            />
            <SmallMetric
              label="ASK"
              value={signal.startingItemPriceEUR != null ? `${it ? "Osservato" : "Observed"} ${formatMoney(signal.startingItemPriceEUR)}` : "—"}
            />
            <SmallMetric label={it ? "Vendite osservate" : "Observed sales"} value={String(signal.soldUnits)} />
            <SmallMetric label={it ? "Annunci attivi" : "Active listings"} value={String(signal.currentOfferCount)} />
          </div>
        </div>
      </div>
    </div>
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

function FlowStep({
  number,
  icon: Icon,
  title,
  text,
}: {
  number: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  text: string
}) {
  return (
    <div className="grid grid-cols-[42px_1fr] gap-3 border border-line bg-[#f8fafc] p-4">
      <div className="flex size-10 items-center justify-center rounded-full bg-brand-muted text-brand">
        <Icon className="size-4" />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-bold tracking-[0.14em] text-brand">{number}</span>
          <p className="text-sm font-semibold text-ink">{title}</p>
        </div>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p>
      </div>
    </div>
  )
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line bg-[#f8fafc] p-3">
      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-navy">{value}</p>
    </div>
  )
}
