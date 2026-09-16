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

  const featured = products
    .flatMap((product) => product.releases.map((release) => ({ product, release })))
    .find(({ release }) => release.itemNumber === "95467")
    ?? products.flatMap((product) => product.releases.map((release) => ({ product, release })))[0]

  const featuredSignal = featured ? signals[featured.release.id] : null
  const catalogPreview = products
    .flatMap((product) => product.releases.map((release) => ({ product, release, signal: signals[release.id] })))
    .filter(({ release }) => Boolean(release.itemNumber))
    .sort((a, b) => (b.signal?.valueEUR ?? 0) - (a.signal?.valueEUR ?? 0))
    .slice(0, 4)

  return (
    <div className="overflow-hidden">
      <section className="relative border-b border-[#dbe4ef] bg-white">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[#1558e8]" />
        <div className="mx-auto grid min-h-[640px] w-full max-w-7xl items-center gap-10 px-4 py-14 md:px-6 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-20">
          <div className="relative z-10 max-w-2xl">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[#4d6482]">
              {it ? "LA CASA DIGITALE DEI COLLEZIONISTI MINI 4WD" : "THE DIGITAL HOME FOR MINI 4WD COLLECTORS"}
            </p>
            <h1 className="mt-5 max-w-[760px] text-[clamp(3rem,7vw,6.3rem)] font-semibold leading-[.88] tracking-[-0.075em] text-[#081a3a]">
              {it ? "Conosci ogni Release." : "Know every Release."}
              <span className="block text-[#1558e8]">{it ? "Dai valore a ogni storia." : "Value every story."}</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-[#5e6f84] md:text-lg">
              {it
                ? "Catalogo esatto, collezione personale, scanner e Price Intelligence per capire quale Mini 4WD hai davanti e cosa significa davvero sul mercato."
                : "Exact catalog identity, personal collection, scanner and Price Intelligence to understand the Mini 4WD in front of you and what it really means on the market."}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/catalog" className="inline-flex h-12 items-center gap-2 rounded-md bg-[#1558e8] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0e49c7]">
                {it ? "Esplora il catalogo" : "Explore the catalog"} <ArrowRight className="size-4" />
              </Link>
              <Link href="/market" className="inline-flex h-12 items-center rounded-md border border-[#cbd8e8] bg-white px-5 text-sm font-semibold text-[#174696] transition hover:bg-[#eef4fd]">
                {it ? "Come calcoliamo il valore" : "How value works"}
              </Link>
            </div>
            <p className="mt-4 text-xs text-[#718096]">
              {it ? "Catalogo e valori pubblici. L'account serve solo per le funzioni personali." : "Catalog and market values are public. An account is only needed for personal features."}
            </p>
          </div>

          <div className="relative min-h-[430px] border border-[#d6e1ee] bg-[#eaf1fc] p-5 md:p-8">
            <div className="absolute right-[-70px] top-8 h-px w-72 -rotate-[18deg] bg-[#ef4545]" />
            <div className="absolute right-[-55px] top-16 h-px w-80 -rotate-[18deg] bg-[#1558e8]/20" />
            {featured ? (
              <>
                <div className="flex h-[265px] items-center justify-center overflow-hidden">
                  <ProductImage product={featured.product} release={featured.release} className="h-full w-full border-0 bg-transparent object-contain" />
                </div>
                <div className="border-l-2 border-[#ef4545] pl-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#60728a]">{it ? "RELEASE IN EVIDENZA" : "FEATURED RELEASE"}</p>
                  <Link href={releaseHref(featured.product, featured.release)} className="mt-1 block text-sm font-semibold text-[#10264d] hover:text-[#1558e8]">
                    Tamiya {featured.release.itemNumber ?? "—"} · {featured.release.editionName}
                  </Link>
                </div>
                <div className="mt-5 bg-[#103d86] p-5 text-white">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#b9ccec]">Market Value</span>
                    {featuredSignal ? <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#80e0b6]">● {confidenceLabel(featuredSignal.confidenceLabel, it)}</span> : null}
                  </div>
                  <div className="mt-3 text-4xl font-semibold tracking-[-0.06em]">
                    {featuredSignal?.valueEUR != null ? formatMoney(featuredSignal.valueEUR) : (it ? "Non consolidato" : "Not consolidated")}
                  </div>
                  <div className="mt-4 flex flex-wrap items-end justify-between gap-2 border-t border-white/20 pt-3 text-xs text-[#d4e0f4]">
                    <span>
                      {featuredSignal?.lowEUR != null && featuredSignal?.highEUR != null
                        ? `${it ? "Range" : "Typical range"} ${formatMoney(featuredSignal.lowEUR)}–${formatMoney(featuredSignal.highEUR)}`
                        : (it ? "Il valore appare solo quando i dati lo supportano." : "Value appears only when the evidence supports it.")}
                    </span>
                    {featuredSignal?.recentSoldUnits3m != null ? <strong>{featuredSignal.recentSoldUnits3m} {it ? "vendite recenti" : "recent sales"}</strong> : null}
                  </div>
                </div>
              </>
            ) : (
              <div className="grid h-full place-items-center text-sm text-[#60728a]">{it ? "Catalogo in caricamento" : "Catalog loading"}</div>
            )}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-[#eaf1fc]">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 md:px-6 lg:px-8 lg:py-20">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[#596d88]">{it ? "UN SOLO POSTO, QUATTRO FUNZIONI" : "ONE CLEAR PLACE"}</p>
          <h2 className="mt-4 max-w-3xl text-4xl font-semibold leading-[.95] tracking-[-0.06em] text-[#081a3a] md:text-6xl">
            {it ? "Pensato per il modo in cui collezioni davvero." : "Built around how collectors actually use it."}
          </h2>

          <div className="mt-10 grid gap-px overflow-hidden border border-[#d8e2ef] bg-[#d8e2ef] md:grid-cols-2 lg:grid-cols-4">
            <Feature number="01" icon={Search} title="Catalog" text={it ? "Trova il Product e la Release esatta, non solo il nome del modello." : "Find the exact Product and Release, not just the model name."} />
            <Feature number="02" icon={Boxes} title={it ? "Collezione" : "Collection"} text={it ? "Salva ciò che possiedi e guarda il valore stimato di oggi." : "Keep what you own and see its current estimated value."} />
            <Feature number="03" icon={ScanLine} title="Scanner" text={it ? "Parti da Item Number o fotocamera e arriva alla Release corretta." : "Start from an Item Number or camera scan and land on the right Release."} />
            <Feature number="04" icon={ShieldCheck} title="Market Value" text={it ? "Un valore con range e affidabilità, separato dai prezzi richiesti." : "A value with range and confidence, kept separate from asking prices."} />
          </div>
        </div>
      </section>

      <section className="bg-[#0c3375] text-white">
        <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 py-16 md:px-6 lg:grid-cols-[.85fr_1.15fr] lg:px-8 lg:py-20">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[#bfd0ef]">Price Intelligence</p>
            <h2 className="mt-4 text-4xl font-semibold leading-[.95] tracking-[-0.06em] md:text-6xl">
              {it ? "Un valore chiaro, non un gioco di ipotesi." : "A clear value, not a guessing game."}
            </h2>
            <p className="mt-6 max-w-lg text-sm leading-6 text-[#cfdbef] md:text-base">
              {it
                ? "Vendite concluse, retail verificato e ASK attive hanno significati diversi. TrackDash li mantiene separati e pubblica un Market Value solo quando le evidenze lo giustificano."
                : "Completed sales, verified retail and active asks mean different things. TrackDash keeps them separate and publishes Market Value only when the evidence supports it."}
            </p>
            <Link href="/market" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-white underline decoration-[#ef4545] decoration-2 underline-offset-4">
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
        <div className="mx-auto w-full max-w-7xl px-4 py-16 md:px-6 lg:px-8 lg:py-20">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[#596d88]">{it ? "DAL CATALOGO" : "FROM THE CATALOG"}</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-[-0.055em] text-[#081a3a] md:text-5xl">{it ? "Release, non semplici prodotti." : "Releases, not generic products."}</h2>
            </div>
            <Link href="/catalog" className="inline-flex items-center gap-2 text-sm font-semibold text-[#1558e8]">{it ? "Vedi tutto il catalogo" : "View the full catalog"} <ArrowRight className="size-4" /></Link>
          </div>

          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {catalogPreview.map(({ product, release, signal }) => (
              <Link key={release.id} href={releaseHref(product, release)} className="group overflow-hidden border border-[#dbe4ef] bg-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#123d7a]/10">
                <div className="aspect-[4/3] bg-[#edf3fc] p-4">
                  <ProductImage product={product} release={release} className="h-full w-full border-0 bg-transparent object-contain" />
                </div>
                <div className="p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#63758c]">Tamiya {release.itemNumber ?? "—"}</p>
                  <h3 className="mt-2 line-clamp-2 text-lg font-semibold tracking-[-0.035em] text-[#10264d] group-hover:text-[#1558e8]">{release.editionName}</h3>
                  <p className="mt-1 text-xs text-[#718096]">{release.releaseYear ?? "—"} · {release.chassis ?? product.chassis ?? "—"}</p>
                  <div className="mt-4 border-t border-[#e1e8f1] pt-3 text-sm font-semibold text-[#123f8f]">
                    {signal?.valueEUR != null ? `${formatMoney(signal.valueEUR)} ${it ? "Market Value" : "Market Value"}` : (it ? "Valore non ancora consolidato" : "Value not yet consolidated")}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#dbe4ef] bg-[#eaf1fc]">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-14 md:px-6 lg:grid-cols-2 lg:px-8 lg:py-16">
          <div className="border border-[#d7e1ee] bg-white p-7 md:p-9">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[#596d88]">{it ? "LA TUA COLLEZIONE" : "YOUR COLLECTION"}</p>
            <h2 className="mt-4 text-4xl font-semibold leading-[.95] tracking-[-0.055em] text-[#081a3a]">{it ? "Quello che possiedi, finalmente ordinato per Release." : "What you own, finally organised by exact Release."}</h2>
            <p className="mt-5 max-w-xl text-sm leading-6 text-[#617087]">{it ? "Il totale stimato di oggi resta una funzione Free. Pro servirà a capire come il valore cambia nel tempo, non a nascondere il valore corrente." : "Today's estimated total stays Free. Pro is for understanding how value changes over time, not for hiding the current value."}</p>
            <Link href="/login?next=%2Fcollection" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[#1558e8]">{it ? "Apri la tua collezione" : "Open your collection"} <ArrowRight className="size-4" /></Link>
          </div>
          <div className="relative overflow-hidden bg-[#1558e8] p-7 text-white md:p-9">
            <div className="absolute right-[-35px] top-8 h-1 w-48 -rotate-[19deg] bg-[#ef4545]" />
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[#cbd9f2]">Scanner</p>
            <h2 className="mt-4 max-w-md text-4xl font-semibold leading-[.95] tracking-[-0.055em]">{it ? "Una scansione. La Release giusta." : "One scan. The right Release."}</h2>
            <div className="mt-8 grid min-h-36 place-items-center border border-white/30 bg-[#0d3a82] font-mono text-4xl font-semibold tracking-[0.12em]">95467</div>
            <p className="mt-4 text-sm text-[#d7e2f4]">{it ? "Ricerca manuale sempre disponibile; la scansione con fotocamera riduce l'inserimento manuale." : "Manual search remains available; camera scanning reduces manual entry."}</p>
            <Link href="/login?next=%2Fscanner" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white">{it ? "Apri Scanner" : "Open Scanner"} <ArrowRight className="size-4" /></Link>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-6 px-4 py-14 md:flex-row md:items-center md:px-6 lg:px-8">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[#596d88]">TrackDash</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#081a3a] md:text-4xl">{it ? "Parti dalla Release che stai cercando." : "Start with the Release you're looking for."}</h2>
          </div>
          <Link href="/catalog" className="inline-flex h-12 items-center gap-2 rounded-md bg-[#1558e8] px-5 text-sm font-semibold text-white transition hover:bg-[#0e49c7]">{it ? "Esplora il catalogo" : "Explore the catalog"} <ArrowRight className="size-4" /></Link>
        </div>
      </section>
    </div>
  )
}

function Feature({ number, icon: Icon, title, text }: { number: string; icon: React.ComponentType<{ className?: string }>; title: string; text: string }) {
  return (
    <article className="min-h-56 bg-white p-6">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] font-bold tracking-[0.16em] text-[#ef4545]">{number}</span>
        <Icon className="size-5 text-[#1558e8]" />
      </div>
      <h3 className="mt-10 text-xl font-semibold tracking-[-0.04em] text-[#10264d]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#617087]">{text}</p>
    </article>
  )
}

function MarketCell({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="min-h-44 bg-white p-6 text-[#10264d]">
      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-[#67788f]">{label}</span>
      <strong className="mt-5 block text-2xl font-semibold tracking-[-0.045em]">{value}</strong>
      <p className="mt-2 text-xs leading-5 text-[#6c7a8d]">{detail}</p>
    </div>
  )
}
