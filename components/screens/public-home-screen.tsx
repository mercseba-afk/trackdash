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
  ScanLine,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react"
import { ProductImage } from "@/components/catalog/product-image"
import { useI18n } from "@/lib/i18n"
import { useMarketSignals } from "@/lib/market/context"
import { formatMoney } from "@/lib/format"
import type { ReleaseMarketSignalView } from "@/lib/market/view-types"
import type { Product, ProductRelease } from "@/lib/types"

type ReleaseEntry = {
  product: Product
  release: ProductRelease
  signal: ReleaseMarketSignalView | null
}

function releaseHref(product: Product, release: ProductRelease) {
  return `/catalog/${product.id}/releases/${release.id}`
}

function marketScore(entry: ReleaseEntry) {
  const signal = entry.signal
  if (!signal) return 0

  const positiveTrend = signal.trendPercent != null && signal.trendPercent > 0 ? signal.trendPercent : 0
  const recentSales = signal.recentSoldUnits3m ?? 0
  const offers = signal.currentOfferCount ?? 0
  const hasValue = signal.valueEUR != null ? 1 : 0

  return positiveTrend * 1000 + recentSales * 80 + offers * 10 + hasValue
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
  if (!signal) return it ? "Dal catalogo TrackDash" : "From the TrackDash catalog"

  if (signal.trendPercent != null && signal.trendPercent >= 3) {
    const trend = Math.abs(signal.trendPercent).toLocaleString(it ? "it-IT" : "en-US", { maximumFractionDigits: 1 })
    return it ? `Trend +${trend}%` : `Trend +${trend}%`
  }

  if ((signal.recentSoldUnits3m ?? 0) > 0) {
    return it
      ? `${signal.recentSoldUnits3m} vendite recenti`
      : `${signal.recentSoldUnits3m} recent sales`
  }

  if (signal.currentOfferCount > 0) {
    return it
      ? `${signal.currentOfferCount} annunci attivi`
      : `${signal.currentOfferCount} active listings`
  }

  return it ? "Mercato da seguire" : "Market to watch"
}

function trendText(signal: ReleaseMarketSignalView | null, it: boolean) {
  if (signal?.trendPercent == null) return it ? "Trend in costruzione" : "Trend building"
  const value = Math.abs(signal.trendPercent).toLocaleString(it ? "it-IT" : "en-US", { maximumFractionDigits: 1 })
  if (signal.trendPercent > 0) return `+${value}%`
  if (signal.trendPercent < 0) return `−${value}%`
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
      .filter(({ release, signal }) => Boolean(release.itemNumber) && Boolean(signal))
      .sort((a, b) => marketScore(b) - marketScore(a))

    const primary = distinctByProduct(ranked, 4)
    if (primary.length >= 4) return primary

    const fallback = distinctByProduct(
      releases.filter(({ release }) => Boolean(release.itemNumber)),
      8,
    )

    for (const entry of fallback) {
      if (!primary.some((item) => item.release.id === entry.release.id)) primary.push(entry)
      if (primary.length === 4) break
    }

    return primary
  }, [releases])

  const heroStrip = watchList.length > 0 ? watchList : releases.slice(0, 4)

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
      .filter(({ signal }) => signal?.valueEUR != null)
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
      <section className="relative border-b border-line bg-white">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-brand" />
        <div className="mx-auto w-full max-w-7xl px-4 pb-8 pt-12 sm:px-6 lg:px-8 lg:pb-10 lg:pt-20">
          <div className="max-w-4xl">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground sm:text-[11px]">
              {it ? "LA CASA DIGITALE DEI COLLEZIONISTI MINI 4WD" : "THE DIGITAL HOME FOR MINI 4WD COLLECTORS"}
            </p>
            <h1 className="mt-5 max-w-[960px] text-[clamp(3.2rem,13vw,5.6rem)] font-semibold leading-[.88] tracking-[-0.075em] text-ink lg:text-[clamp(5rem,7vw,6.6rem)]">
              {it ? "Trova la versione esatta." : "Find the exact version."}
              <span className="block text-brand">{it ? "Segui il suo valore." : "Track its value."}</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
              {it
                ? "TrackDash ti aiuta a riconoscere il modello e la sua Release — cioè la specifica versione o edizione —, seguirne il valore e organizzare la tua collezione."
                : "TrackDash helps you identify the model and its exact Release, follow its value and organise your collection."}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/catalog" className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-brand px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0e49c7]">
                {it ? "Esplora il catalogo" : "Explore the catalog"} <ArrowRight className="size-4" />
              </Link>
              <Link href="/market" className="inline-flex h-12 items-center justify-center rounded-md border border-line bg-white px-5 text-sm font-semibold text-navy transition hover:bg-brand-muted">
                {it ? "Scopri i valori di mercato" : "Explore market values"}
              </Link>
            </div>
            <p className="mt-4 text-xs leading-5 text-muted-foreground">
              {it
                ? "Catalogo e valori sono consultabili da tutti. Crea un account per collezione, wishlist e scanner."
                : "Catalog and market values are open to everyone. Create an account for collection, wishlist and scanner."}
            </p>
          </div>

          {heroStrip.length > 0 ? (
            <div className="relative mt-10 overflow-hidden border border-line bg-[#eef4fb] px-3 py-4 sm:px-5 sm:py-5">
              <div className="pointer-events-none absolute -right-20 top-0 h-28 w-80 -rotate-6 bg-brand/5" />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                {heroStrip.slice(0, 4).map(({ product, release }, index) => (
                  <Link
                    key={release.id}
                    href={releaseHref(product, release)}
                    className="group relative h-32 overflow-hidden bg-white/80 p-2 sm:h-44 sm:p-3"
                    aria-label={`${product.name} — ${release.editionName}`}
                  >
                    <ProductImage product={product} release={release} className="h-full w-full border-0 bg-transparent object-contain transition-transform duration-300 group-hover:scale-[1.04]" />
                    <span className="absolute bottom-2 left-2 rounded-sm bg-white/90 px-2 py-1 font-mono text-[9px] font-semibold text-navy shadow-sm backdrop-blur">
                      #{release.itemNumber ?? "—"}
                    </span>
                    {index === 0 ? <span className="absolute right-2 top-2 size-2 rounded-full bg-brand-red" /> : null}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {watchList.length > 0 ? (
        <section className="bg-white">
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
                <WatchCard key={entry.release.id} entry={entry} it={it} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section id="how-it-works" className="bg-[#eef4fb]">
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
              title={it ? "Trova il modello. Scegli la Release." : "Find the model. Choose the Release."}
              text={
                it
                  ? "Cerca per nome, anno, chassis o codice articolo. TrackDash separa originali, ristampe ed edizioni speciali per aiutarti a identificare esattamente ciò che stai guardando."
                  : "Search by name, year, chassis or item number. TrackDash separates originals, reissues and special editions so you can identify exactly what you are looking at."
              }
              tone="light"
            />
            <FeatureCard
              number="02"
              icon={ShieldCheck}
              title={it ? "Capisci quanto vale." : "Understand what it is worth."}
              text={
                it
                  ? "Market Value, vendite concluse e ASK restano distinti. Così puoi leggere il mercato senza confondere un prezzo richiesto con un prezzo realmente pagato."
                  : "Market Value, completed sales and ASK remain distinct, so you do not confuse an asking price with a price actually paid."
              }
              tone="dark"
            />
            <FeatureCard
              number="03"
              icon={Boxes}
              title={it ? "Organizza la tua collezione." : "Organise your collection."}
              text={
                it
                  ? "Aggiungi le Release che possiedi, gestisci più copie dello stesso modello e guarda in un colpo d’occhio il valore stimato della tua raccolta."
                  : "Add the Releases you own, manage multiple copies of the same model and see your collection’s estimated value at a glance."
              }
              tone="brand"
            />
            <FeatureCard
              number="04"
              icon={ScanLine}
              title={it ? "Dalla scatola alla scheda." : "From the box to the right page."}
              text={
                it
                  ? "Scansiona il codice a barre oppure inserisci il codice articolo: TrackDash ti porta alla scheda corretta senza dover cercare tra versioni simili."
                  : "Scan the barcode or enter the item number and TrackDash takes you to the correct page without searching through similar versions."
              }
              tone="soft"
            />
          </div>
        </div>
      </section>

      {familyProduct && familyPreviewRelease ? (
        <section className="border-y border-line bg-white">
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
                {it ? "Un modello può avere più Release." : "One model can have multiple Releases."}
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground md:text-base">
                {it
                  ? "Una Mini 4WD può tornare sul mercato anni dopo, cambiare chassis o uscire in un’edizione speciale. Per TrackDash sono Release diverse, perché possono avere storia e valore diversi."
                  : "A Mini 4WD can return years later, change chassis or appear as a special edition. TrackDash treats those as different Releases because their history and value can differ."}
              </p>

              <div className="mt-7 overflow-hidden border border-line">
                {familyProduct.releases.slice(0, 4).map((release) => (
                  <Link
                    key={release.id}
                    href={releaseHref(familyProduct, release)}
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

              <Link href="/catalog" className="mt-6 inline-flex items-center gap-2 self-start text-sm font-semibold text-brand">
                {it ? "Esplora tutto il catalogo" : "Explore the full catalog"} <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <section className="bg-navy text-white">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[.85fr_1.15fr] lg:px-8 lg:py-16">
          <div className="flex flex-col justify-center">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-white/65">PRICE INTELLIGENCE</p>
            <h2 className="mt-4 text-4xl font-semibold leading-[.96] tracking-[-0.06em] md:text-6xl">
              {it ? "Capisci quanto vale oggi. E come si sta muovendo." : "Understand what it is worth today. And how it is moving."}
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-6 text-white/75 md:text-base">
              {it
                ? "TrackDash confronta vendite concluse, prezzi nei negozi e ASK — i prezzi richiesti negli annunci attivi — e pubblica una stima solo quando i dati sono sufficienti."
                : "TrackDash compares completed sales, store prices and ASK — prices requested in active listings — and only publishes an estimate when the data is sufficient."}
            </p>
            <Link href="/market" className="mt-7 inline-flex items-center gap-2 self-start text-sm font-semibold text-white underline decoration-brand-red decoration-2 underline-offset-4">
              {it ? "Scopri i valori di mercato" : "Explore market values"} <ArrowRight className="size-4" />
            </Link>
          </div>

          {marketDemo ? <MarketPreview entry={marketDemo} it={it} /> : null}
        </div>
      </section>

      <section className="bg-white">
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
                ? "La collezione non è solo una lista: ogni copia resta collegata alla sua Release, con condizione, prezzo pagato e valore di mercato quando disponibile."
                : "Your collection is more than a list: every copy stays linked to its exact Release, with condition, purchase price and market value when available."}
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <CollectionPoint icon={Boxes} title={it ? "Release esatte" : "Exact Releases"} text={it ? "Sai quale versione possiedi davvero." : "Know exactly which version you own."} />
              <CollectionPoint icon={Copy} title={it ? "Più copie" : "Multiple copies"} text={it ? "Gestisci più esemplari della stessa Release." : "Manage multiple copies of the same Release."} />
              <CollectionPoint icon={TrendingUp} title={it ? "Valore stimato" : "Estimated value"} text={it ? "Vedi quanto vale oggi la raccolta." : "See what your collection is worth today."} />
              <CollectionPoint icon={Heart} title="Wishlist" text={it ? "Tieni separato ciò che hai da ciò che stai cercando." : "Keep what you own separate from what you want."} />
            </div>
            <Link href="/login?next=%2Fcollection" className="mt-7 inline-flex items-center gap-2 self-start text-sm font-semibold text-brand">
              {it ? "Apri la tua collezione" : "Open your collection"} <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="overflow-hidden border border-line bg-[#eef4fb] p-4 sm:p-6">
            <div className="rounded-xl bg-white p-5 shadow-[0_18px_45px_rgba(11,50,117,0.10)]">
              <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{it ? "LA MIA COLLEZIONE" : "MY COLLECTION"}</p>
                  <p className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-ink">{it ? "Valore oggi" : "Value today"}</p>
                </div>
                <span className="rounded-full bg-brand-muted px-3 py-1 text-xs font-semibold text-brand">{it ? "per Release" : "by Release"}</span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <CollectionMetric title={it ? "Release possedute" : "Owned Releases"} value="12" detail={it ? "versioni identificate" : "identified versions"} />
                <CollectionMetric title={it ? "Copie totali" : "Total copies"} value="16" detail={it ? "più esemplari gestibili" : "multiple copies supported"} />
                <CollectionMetric title={it ? "Valore stimato" : "Estimated value"} value="€ 428" detail={it ? "quando i dati sono disponibili" : "when data is available"} />
                <CollectionMetric title="Wishlist" value="7" detail={it ? "modelli da tenere d’occhio" : "models to watch"} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {scannerExample ? (
        <section className="border-y border-line bg-[#eef4fb]">
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

      <section className="bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid gap-7 border border-line bg-[#f8fafc] p-7 sm:p-9 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-brand">{it ? "INIZIA DA QUI" : "START HERE"}</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-ink md:text-4xl">
                {it ? "Esplora il catalogo. Il resto viene da sé." : "Explore the catalog. The rest follows."}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                {it
                  ? "Cerca una Mini 4WD che conosci, apri la sua Release e scopri come TrackDash organizza catalogo, valori e collezione."
                  : "Search for a Mini 4WD you know, open its Release and see how TrackDash connects catalog, values and collection."}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/catalog" className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-brand px-5 text-sm font-semibold text-white">
                {it ? "Esplora il catalogo" : "Explore catalog"} <ArrowRight className="size-4" />
              </Link>
              <Link href="/login" className="inline-flex h-11 items-center justify-center rounded-md border border-line bg-white px-5 text-sm font-semibold text-navy">
                {it ? "Crea un account" : "Create an account"}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function WatchCard({ entry, it }: { entry: ReleaseEntry; it: boolean }) {
  const { product, release, signal } = entry

  return (
    <Link
      href={releaseHref(product, release)}
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
            <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Market Value</p>
            <p className="mt-0.5 text-lg font-semibold text-navy">{signal?.valueEUR != null ? formatMoney(signal.valueEUR) : (it ? "Dati in arrivo" : "Data coming soon")}</p>
          </div>
          {signal?.trendPercent != null ? (
            <span className={`text-sm font-semibold ${signal.trendPercent >= 0 ? "text-emerald-700" : "text-brand-red"}`}>
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
}: {
  number: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  text: string
  tone: "light" | "dark" | "brand" | "soft"
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
        ) : null}
      </div>

      <div className="grid sm:grid-cols-[.82fr_1.18fr]">
        <div className="flex min-h-[250px] items-center justify-center bg-brand-muted p-5">
          <ProductImage product={product} release={release} className="h-[220px] w-full border-0 bg-transparent object-contain" />
        </div>
        <div className="p-5 sm:p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Market Value</p>
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
              value={signal.startingItemPriceEUR != null ? `${it ? "Da" : "From"} ${formatMoney(signal.startingItemPriceEUR)}` : "—"}
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

function CollectionMetric({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <div className="border border-line bg-[#f8fafc] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">{title}</p>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-navy">{value}</p>
      <p className="mt-1 text-[11px] leading-4 text-muted-foreground">{detail}</p>
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
