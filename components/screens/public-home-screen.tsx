"use client"

import Link from "next/link"
import { ArrowRight, Boxes, ScanLine, Search, ShieldCheck } from "lucide-react"
import { ProductImage } from "@/components/catalog/product-image"
import { useI18n } from "@/lib/i18n"
import { useMarketSignals } from "@/lib/market/context"
import { formatMoney } from "@/lib/format"
import type { Product, ProductRelease } from "@/lib/types"

function releaseHref(product: Product, release: ProductRelease) {
  return `/catalog/${product.id}/releases/${release.id}`
}

function confidenceLabel(value: "low" | "medium" | "high", it: boolean) {
  if (!it) return `${value[0].toUpperCase()}${value.slice(1)} confidence`
  if (value === "high") return "Affidabilità alta"
  if (value === "medium") return "Affidabilità media"
  return "Affidabilità bassa"
}

export function PublicHomeScreen({ products }: { products: Product[] }) {
  const { locale } = useI18n()
  const it = locale === "it"
  const signals = useMarketSignals()

  const releases = products.flatMap((product) =>
    product.releases.map((release) => ({ product, release, signal: signals[release.id] })),
  )

  const featured = releases.find(({ release }) => release.itemNumber === "95467") ?? releases[0]
  const catalogPreview = releases
    .filter(({ release }) => Boolean(release.itemNumber))
    .sort((a, b) => (b.signal?.valueEUR ?? 0) - (a.signal?.valueEUR ?? 0))
    .slice(0, 4)

  const availableNow = releases
    .filter(({ release, signal }) => Boolean(release.itemNumber) && signal?.startingItemPriceEUR != null && signal.currentOfferCount > 0)
    .sort((a, b) => (a.signal?.startingItemPriceEUR ?? Number.POSITIVE_INFINITY) - (b.signal?.startingItemPriceEUR ?? Number.POSITIVE_INFINITY))
    .slice(0, 4)

  const featuredSignal = featured?.signal ?? null

  return (
    <div className="overflow-hidden bg-background">
      <section className="relative border-b border-line bg-white">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-brand" />
        <div className="mx-auto grid min-h-[640px] w-full max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.04fr_.96fr] lg:px-8 lg:py-20">
          <div className="relative z-10 max-w-2xl">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground sm:text-[11px]">
              {it ? "LA CASA DIGITALE DEI COLLEZIONISTI MINI 4WD" : "THE DIGITAL HOME FOR MINI 4WD COLLECTORS"}
            </p>
            <h1 className="mt-5 max-w-[760px] text-[clamp(3.2rem,14vw,5.2rem)] font-semibold leading-[.87] tracking-[-0.075em] text-ink lg:text-[clamp(4.8rem,7vw,6.3rem)]">
              {it ? "Conosci ogni Release." : "Know every Release."}
              <span className="block text-brand">{it ? "Dai valore a ogni storia." : "Value every story."}</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-muted-foreground md:text-lg">
              {it
                ? "Catalogo esatto, collezione personale, scanner e Price Intelligence per capire quale Mini 4WD hai davanti e cosa significa davvero sul mercato."
                : "Exact catalog identity, personal collection, scanner and Price Intelligence to understand the Mini 4WD in front of you and what it really means on the market."}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/catalog" className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-brand px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0e49c7]">
                {it ? "Esplora il catalogo" : "Explore the catalog"} <ArrowRight className="size-4" />
              </Link>
              <Link href="/market" className="inline-flex h-12 items-center justify-center rounded-md border border-line bg-white px-5 text-sm font-semibold text-navy transition hover:bg-brand-muted">
                {it ? "Come calcoliamo il valore" : "How value works"}
              </Link>
            </div>
            <p className="mt-4 text-xs leading-5 text-muted-foreground">
              {it ? "Catalogo e valori pubblici. L'account serve solo per le funzioni personali." : "Catalog and market values are public. An account is only needed for personal features."}
            </p>
          </div>

          <div className="relative min-h-[430px] overflow-hidden border border-line bg-brand-muted p-5 sm:p-7 md:p-8">
            <div className="absolute right-[-70px] top-8 h-px w-72 -rotate-[18deg] bg-brand-red" />
            <div className="absolute right-[-55px] top-16 h-px w-80 -rotate-[18deg] bg-brand/20" />
            {featured ? (
              <>
                <div className="flex h-[240px] items-center justify-center overflow-hidden sm:h-[265px]">
                  <ProductImage product={featured.product} release={featured.release} className="h-full w-full border-0 bg-transparent object-contain" />
                </div>
                <div className="border-l-2 border-brand-red pl-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{it ? "RELEASE IN EVIDENZA" : "FEATURED RELEASE"}</p>
                  <Link href={releaseHref(featured.product, featured.release)} className="mt-1 block text-sm font-semibold text-ink hover:text-brand">
                    Tamiya {featured.release.itemNumber ?? "—"} · {featured.release.editionName}
                  </Link>
                </div>
                <div className="mt-5 bg-navy p-5 text-white">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/70">Market Value</span>
                    {featuredSignal ? <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#80e0b6]">● {confidenceLabel(featuredSignal.confidenceLabel, it)}</span> : null}
                  </div>
                  <div className="mt-3 text-4xl font-semibold tracking-[-0.06em]">
                    {featuredSignal?.valueEUR != null ? formatMoney(featuredSignal.valueEUR) : (it ? "Non consolidato" : "Not consolidated")}
                  </div>
                  <div className="mt-4 flex flex-wrap items-end justify-between gap-2 border-t border-white/20 pt-3 text-xs text-white/75">
                    <span>
                      {featuredSignal?.lowEUR != null && featuredSignal?.highEUR != null
                        ? `${it ? "Range" : "Typical range"} ${formatMoney(featuredSignal.lowEUR)}–${formatMoney(featuredSignal.highEUR)}`
                        : (it ? "Il valore appare solo quando i dati lo supportano." : "Value appears only when the evidence supports it.")}
                    </span>
                    {featuredSignal?.recentSoldUnits3m != null && featuredSignal.recentSoldUnits3m > 0 ? <strong>{featuredSignal.recentSoldUnits3m} {it ? "vendite recenti" : "recent sales"}</strong> : null}
                  </div>
                </div>
              </>
            ) : (
              <div className="grid h-full place-items-center text-sm text-muted-foreground">{it ? "Catalogo in caricamento" : "Catalog loading"}</div>
            )}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-[#eef4fb]">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{it ? "UN SOLO POSTO, QUATTRO FUNZIONI" : "ONE CLEAR PLACE"}</p>
          <h2 className="mt-4 max-w-3xl text-4xl font-semibold leading-[.95] tracking-[-0.06em] text-ink md:text-6xl">
            {it ? "Pensato per il modo in cui collezioni davvero." : "Built around how collectors actually use it."}
          </h2>

          <div className="mt-10 grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            <Feature number="01" icon={Search} title="Catalog" text={it ? "Trova il Product e la Release esatta, non solo il nome del modello." : "Find the exact Product and Release, not just the model name."} />
            <Feature number="02" icon={Boxes} title={it ? "Collezione" : "Collection"} text={it ? "Salva ciò che possiedi e guarda il valore stimato di oggi." : "Keep what you own and see its current estimated value."} />
            <Feature number="03" icon={ScanLine} title="Scanner" text={it ? "Parti da Item Number o fotocamera e arriva alla Release corretta." : "Start from an Item Number or camera scan and land on the right Release."} />
            <Feature number="04" icon={ShieldCheck} title="Market Value" text={it ? "Un valore con range e affidabilità, separato dai prezzi richiesti." : "A value with range and confidence, kept separate from asking prices."} />
          </div>
        </div>
      </section>

      {featured ? (
        <section className="border-y border-line bg-white">
          <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="grid gap-8 lg:grid-cols-[.72fr_1.28fr] lg:items-end">
              <div>
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{it ? "DENTRO TRACKDASH" : "INSIDE TRACKDASH"}</p>
                <h2 className="mt-4 text-4xl font-semibold leading-[.95] tracking-[-0.06em] text-ink md:text-6xl">
                  {it ? "Prima identifichi la Release. Poi capisci il mercato." : "Identify the Release first. Then understand the market."}
                </h2>
                <p className="mt-5 max-w-xl text-sm leading-6 text-muted-foreground md:text-base">
                  {it
                    ? "Nome, Item Number, anno e chassis restano il punto di partenza. Il valore arriva dopo, con evidenze separate e leggibili."
                    : "Name, Item Number, year and chassis stay the starting point. Value comes next, with separate and readable evidence."}
                </p>
              </div>
              <Link href={releaseHref(featured.product, featured.release)} className="inline-flex items-center gap-2 justify-self-start text-sm font-semibold text-brand lg:justify-self-end">
                {it ? "Apri questa Release" : "Open this Release"} <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="mt-10 overflow-hidden border border-line bg-[#f7f9fc] shadow-[0_18px_55px_rgba(11,50,117,0.08)]">
              <div className="flex items-center justify-between border-b border-line bg-white px-4 py-3 sm:px-5">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-brand-red" />
                  <span className="size-2 rounded-full bg-[#d59a00]" />
                  <span className="size-2 rounded-full bg-[#23865f]" />
                </div>
                <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">TrackDash · Release detail</span>
              </div>

              <div className="grid lg:grid-cols-[.9fr_1.1fr]">
                <div className="flex min-h-[300px] items-center justify-center border-b border-line bg-brand-muted p-6 sm:min-h-[390px] sm:p-10 lg:border-b-0 lg:border-r">
                  <ProductImage product={featured.product} release={featured.release} className="h-full max-h-[360px] w-full border-0 bg-transparent object-contain" />
                </div>

                <div className="p-5 sm:p-7 lg:p-9">
                  <div className="border-l-2 border-brand-red pl-3">
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Tamiya {featured.release.itemNumber ?? "—"}</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-[-0.045em] text-ink sm:text-3xl">{featured.release.editionName}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{featured.release.releaseYear ?? "—"} · {featured.release.chassis ?? featured.product.chassis ?? "—"}</p>
                  </div>

                  <div className="mt-7 grid gap-px bg-line sm:grid-cols-2">
                    <PreviewCell label="Market Value" value={featuredSignal?.valueEUR != null ? formatMoney(featuredSignal.valueEUR) : (it ? "Non consolidato" : "Not consolidated")} detail={featuredSignal ? confidenceLabel(featuredSignal.confidenceLabel, it) : (it ? "In attesa di evidenze sufficienti" : "Waiting for enough evidence")} />
                    <PreviewCell label={it ? "Range" : "Typical range"} value={featuredSignal?.lowEUR != null && featuredSignal?.highEUR != null ? `${formatMoney(featuredSignal.lowEUR)}–${formatMoney(featuredSignal.highEUR)}` : "—"} detail={it ? "Intervallo del metodo corrente" : "Current-method range"} />
                    <PreviewCell label={it ? "Disponibile da" : "Available from"} value={featuredSignal?.startingItemPriceEUR != null ? formatMoney(featuredSignal.startingItemPriceEUR) : "—"} detail={it ? "Prezzo articolo, spedizione esclusa" : "Item price, shipping excluded"} />
                    <PreviewCell label={it ? "Offerte correnti" : "Current offers"} value={featuredSignal ? String(featuredSignal.currentOfferCount) : "—"} detail={it ? "ASK separate dal Market Value" : "Asks kept separate from Market Value"} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="bg-navy text-white">
        <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[.85fr_1.15fr] lg:px-8 lg:py-20">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">Price Intelligence</p>
            <h2 className="mt-4 text-4xl font-semibold leading-[.95] tracking-[-0.06em] md:text-6xl">
              {it ? "Un valore chiaro, non un gioco di ipotesi." : "A clear value, not a guessing game."}
            </h2>
            <p className="mt-6 max-w-lg text-sm leading-6 text-white/75 md:text-base">
              {it
                ? "Vendite concluse, retail verificato e ASK attive hanno significati diversi. TrackDash li mantiene separati e pubblica un Market Value solo quando le evidenze lo giustificano."
                : "Completed sales, verified retail and active asks mean different things. TrackDash keeps them separate and publishes Market Value only when the evidence supports it."}
            </p>
            <Link href="/market" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-white underline decoration-brand-red decoration-2 underline-offset-4">
              {it ? "Apri Price Intelligence" : "Open Price Intelligence"} <ArrowRight className="size-4" />
            </Link>
          </div>

          {featuredSignal && featured ? (
            <div className="grid gap-px bg-white/20 sm:grid-cols-2">
              <MarketCell label="Market Value" value={featuredSignal.valueEUR != null ? formatMoney(featuredSignal.valueEUR) : (it ? "Non consolidato" : "Not consolidated")} detail={confidenceLabel(featuredSignal.confidenceLabel, it)} />
              <MarketCell label={it ? "Vendite concluse" : "Completed sales"} value={featuredSignal.soldAnchorEUR != null ? formatMoney(featuredSignal.soldAnchorEUR) : "—"} detail={`${featuredSignal.soldUnits} ${it ? "unità usate come evidenza" : "units in evidence"}`} />
              <MarketCell label={it ? "Disponibilità attuale" : "Available now"} value={featuredSignal.startingItemPriceEUR != null ? `${it ? "Da" : "From"} ${formatMoney(featuredSignal.startingItemPriceEUR)}` : "—"} detail={it ? "ASK corrente, separata dal Market Value" : "Current ask, separate from Market Value"} />
              <MarketCell label={it ? "Range" : "Typical range"} value={featuredSignal.lowEUR != null && featuredSignal.highEUR != null ? `${formatMoney(featuredSignal.lowEUR)}–${formatMoney(featuredSignal.highEUR)}` : "—"} detail={it ? "Intervallo coerente con il metodo corrente" : "Range produced by the current method"} />
            </div>
          ) : null}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{it ? "DAL CATALOGO" : "FROM THE CATALOG"}</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-[-0.055em] text-ink md:text-5xl">{it ? "Release, non semplici prodotti." : "Releases, not generic products."}</h2>
            </div>
            <Link href="/catalog" className="inline-flex items-center gap-2 text-sm font-semibold text-brand">{it ? "Vedi tutto il catalogo" : "View the full catalog"} <ArrowRight className="size-4" /></Link>
          </div>

          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {catalogPreview.map(({ product, release, signal }) => (
              <Link key={release.id} href={releaseHref(product, release)} className="group overflow-hidden border border-line bg-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-navy/10">
                <div className="aspect-[4/3] bg-brand-muted p-4">
                  <ProductImage product={product} release={release} className="h-full w-full border-0 bg-transparent object-contain" />
                </div>
                <div className="p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Tamiya {release.itemNumber ?? "—"}</p>
                  <h3 className="mt-2 line-clamp-2 text-lg font-semibold tracking-[-0.035em] text-ink group-hover:text-brand">{release.editionName}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{release.releaseYear ?? "—"} · {release.chassis ?? product.chassis ?? "—"}</p>
                  <div className="mt-4 border-t border-line pt-3 text-sm font-semibold text-navy">
                    {signal?.valueEUR != null ? `${formatMoney(signal.valueEUR)} Market Value` : (it ? "Valore non ancora consolidato" : "Value not yet consolidated")}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-[#eef4fb]">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_.9fr] lg:px-8 lg:py-20">
          <div className="border border-line bg-white p-7 sm:p-9 lg:p-10">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{it ? "LA TUA COLLEZIONE" : "YOUR COLLECTION"}</p>
            <h2 className="mt-4 max-w-xl text-4xl font-semibold leading-[.95] tracking-[-0.055em] text-ink md:text-5xl">{it ? "Quello che possiedi, finalmente ordinato per Release." : "What you own, finally organised by exact Release."}</h2>
            <p className="mt-5 max-w-xl text-sm leading-6 text-muted-foreground md:text-base">{it ? "Il totale stimato di oggi resta una funzione Free. Pro servirà a capire come il valore cambia nel tempo, non a nascondere il valore corrente." : "Today's estimated total stays Free. Pro is for understanding how value changes over time, not for hiding the current value."}</p>
            <Link href="/login?next=%2Fcollection" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-brand">{it ? "Apri la tua collezione" : "Open your collection"} <ArrowRight className="size-4" /></Link>
          </div>

          <div className="relative overflow-hidden bg-brand p-7 text-white sm:p-9 lg:p-10">
            <div className="absolute right-[-35px] top-8 h-1 w-48 -rotate-[19deg] bg-brand-red" />
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">{it ? "COLLECTION VALUE" : "COLLECTION VALUE"}</p>
            <div className="mt-8 grid gap-px bg-white/25 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <CollectionMetric value="Release" label={it ? "al centro della collezione" : "at the centre of your collection"} />
              <CollectionMetric value="Free" label={it ? "valore stimato di oggi" : "today's estimated value"} />
              <CollectionMetric value="Wishlist" label={it ? "separata da ciò che possiedi" : "separate from what you own"} />
              <CollectionMetric value="Pro" label={it ? "storico e andamento nel tempo" : "history and value over time"} />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[.82fr_1.18fr] lg:px-8 lg:py-20">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Scanner</p>
            <h2 className="mt-4 max-w-xl text-4xl font-semibold leading-[.95] tracking-[-0.055em] text-ink md:text-5xl">{it ? "Una scansione. La Release giusta." : "One scan. The right Release."}</h2>
            <p className="mt-5 max-w-xl text-sm leading-6 text-muted-foreground md:text-base">{it ? "Ricerca manuale sempre disponibile; la scansione con fotocamera riduce l'inserimento manuale e ti porta alla scheda corretta." : "Manual search remains available; camera scanning reduces manual entry and takes you to the correct Release."}</p>
            <Link href="/login?next=%2Fscanner" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-brand">{it ? "Apri Scanner" : "Open Scanner"} <ArrowRight className="size-4" /></Link>
          </div>

          <div className="relative overflow-hidden border border-line bg-navy p-5 text-white sm:p-8">
            <div className="absolute left-[-55px] top-14 h-px w-60 rotate-[18deg] bg-brand-red" />
            <div className="relative mx-auto max-w-lg border border-white/25 bg-[#123f8f] p-5 sm:p-7">
              <div className="flex items-center justify-between gap-3 border-b border-white/20 pb-4">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/65">{it ? "ITEM NUMBER" : "ITEM NUMBER"}</span>
                <span className="text-xs font-semibold text-[#80e0b6]">● {it ? "PRONTO" : "READY"}</span>
              </div>
              <div className="my-8 grid min-h-40 place-items-center border border-white/25 bg-[#0b3275] font-mono text-5xl font-semibold tracking-[0.12em] sm:text-6xl">95467</div>
              <div className="flex items-center justify-between gap-4 text-xs text-white/70">
                <span>{it ? "Identificazione Release" : "Release identification"}</span>
                <span className="font-semibold text-white">Tamiya</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {availableNow.length > 0 ? (
        <section className="border-t border-line bg-[#eef4fb]">
          <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{it ? "DISPONIBILI ORA" : "AVAILABLE NOW"}</p>
                <h2 className="mt-3 max-w-2xl text-4xl font-semibold leading-[.96] tracking-[-0.055em] text-ink md:text-5xl">{it ? "Release con disponibilità reale, non vetrine morte." : "Releases with real availability, not dead listings."}</h2>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">{it ? "Qui compaiono solo Release per cui TrackDash vede almeno un'offerta corrente. Il prezzo mostrato è l'articolo più basso, spedizione esclusa." : "Only Releases with at least one current offer appear here. The shown price is the lowest item price, shipping excluded."}</p>
              </div>
              <Link href="/catalog" className="inline-flex items-center gap-2 text-sm font-semibold text-brand">{it ? "Esplora tutte le Release" : "Explore all Releases"} <ArrowRight className="size-4" /></Link>
            </div>

            <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {availableNow.map(({ product, release, signal }) => (
                <Link key={release.id} href={releaseHref(product, release)} className="group overflow-hidden border border-line bg-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-navy/10">
                  <div className="aspect-[4/3] bg-white p-4">
                    <ProductImage product={product} release={release} className="h-full w-full border-0 bg-transparent object-contain" />
                  </div>
                  <div className="border-t border-line p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Tamiya {release.itemNumber ?? "—"}</p>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-success">● {it ? "Disponibile" : "Available"}</span>
                    </div>
                    <h3 className="mt-2 line-clamp-2 text-lg font-semibold tracking-[-0.035em] text-ink group-hover:text-brand">{release.editionName}</h3>
                    <div className="mt-4 flex items-end justify-between gap-3 border-t border-line pt-3">
                      <div>
                        <span className="block font-mono text-[9px] uppercase tracking-[0.13em] text-muted-foreground">{it ? "DA" : "FROM"}</span>
                        <strong className="mt-1 block text-xl font-semibold tracking-[-0.04em] text-navy">{signal?.startingItemPriceEUR != null ? formatMoney(signal.startingItemPriceEUR) : "—"}</strong>
                      </div>
                      <div className="text-right text-[11px] leading-5 text-muted-foreground">
                        <div>{signal?.currentOfferCount ?? 0} {it ? "offerte" : "offers"}</div>
                        {signal?.recentSoldUnits3m != null && signal.recentSoldUnits3m > 0 ? <div>{signal.recentSoldUnits3m} {it ? "vendite recenti" : "recent sales"}</div> : null}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}

function Feature({ number, icon: Icon, title, text }: { number: string; icon: React.ComponentType<{ className?: string }>; title: string; text: string }) {
  return (
    <article className="min-h-56 bg-white p-6">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] font-bold tracking-[0.16em] text-brand-red">{number}</span>
        <Icon className="size-5 text-brand" />
      </div>
      <h3 className="mt-10 text-xl font-semibold tracking-[-0.04em] text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
    </article>
  )
}

function PreviewCell({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="min-h-36 bg-white p-5">
      <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      <strong className="mt-4 block text-2xl font-semibold tracking-[-0.045em] text-ink">{value}</strong>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{detail}</p>
    </div>
  )
}

function MarketCell({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="min-h-44 bg-white p-6 text-ink">
      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">{label}</span>
      <strong className="mt-5 block text-2xl font-semibold tracking-[-0.045em]">{value}</strong>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{detail}</p>
    </div>
  )
}

function CollectionMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-h-28 bg-[#0b3275] p-5">
      <strong className="block text-2xl font-semibold tracking-[-0.045em] text-white">{value}</strong>
      <span className="mt-2 block text-xs leading-5 text-white/70">{label}</span>
    </div>
  )
}
