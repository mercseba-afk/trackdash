"use client"

import * as React from "react"
import Link from "next/link"
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  CircleHelp,
  Info,
  LineChart,
  ShoppingBag,
  TrendingUp,
} from "lucide-react"
import { PRODUCTS } from "@/lib/data/corrected-products"
import { useMarketSignals } from "@/lib/market/context"
import { useI18n } from "@/lib/i18n"
import { formatMoney } from "@/lib/format"
import type { Product, ProductRelease } from "@/lib/types"
import type { ReleaseMarketSignalView } from "@/lib/market/view-types"
import { ProductImage } from "@/components/catalog/product-image"
import { RarityBadge, TrendIndicator } from "@/components/market-bits"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Row {
  product: Product
  release: ProductRelease
  signal: ReleaseMarketSignalView
}

export function MarketScreen() {
  const { locale } = useI18n()
  const it = locale === "it"
  const marketSignals = useMarketSignals()

  const rows = React.useMemo<Row[]>(() => PRODUCTS.flatMap((product) =>
    product.releases.flatMap((release) => {
      const signal = marketSignals[release.id]
      return signal ? [{ product, release, signal }] : []
    }),
  ), [marketSignals])

  const valued = React.useMemo(() => rows
    .filter((row) => row.signal.valueEUR != null && row.signal.valueEUR > 0)
    .sort((a, b) => (b.signal.valueEUR ?? 0) - (a.signal.valueEUR ?? 0)), [rows])
  const forming = React.useMemo(() => rows.filter((row) => row.signal.valueEUR == null), [rows])
  const trends = React.useMemo(() => rows
    .filter((row) => row.signal.trendPercent != null)
    .sort((a, b) => (b.signal.trendPercent ?? 0) - (a.signal.trendPercent ?? 0)), [rows])
  const currentOffers = rows.reduce((sum, row) => sum + row.signal.currentOfferCount, 0)
  const example = valued[0]

  const copy = it
    ? {
        kicker: "PRICE INTELLIGENCE",
        titleA: "Capire quanto vale una Release",
        titleB: "e perché.",
        intro: "TrackDash separa i diversi segnali di mercato e costruisce un Market Value solo quando le evidenze disponibili sono sufficienti. Niente prezzi richiesti spacciati per valore reale.",
        explore: "Esplora i segnali live",
        catalog: "Vai al catalogo",
        signalsKicker: "I SEGNALI",
        signalsTitle: "Segnali diversi. Significati diversi.",
        signalsIntro: "Retail, vendite concluse e richieste attive servono a raccontare cose diverse. TrackDash li mantiene separati prima di costruire una lettura del mercato.",
        retail: "Retail verificato",
        retailBody: "Prezzi correnti o riferimenti retail verificati. Utili per capire disponibilità e contesto del nuovo.",
        sold: "Vendite concluse",
        soldBody: "Prezzi realmente pagati quando l'identità della Release è sufficientemente affidabile. È il segnale più importante per il secondario.",
        asks: "Richieste attive",
        asksBody: "Prezzi chiesti dai venditori in questo momento. Mostrano disponibilità, ma da soli non definiscono il Market Value.",
        resultKicker: "IL RISULTATO",
        resultTitle: "Market Value è una stima ragionata, non una scorciatoia.",
        resultBody: "Quando le evidenze sono sufficienti TrackDash restituisce un valore, un range e un livello di confidence. Se i dati non bastano, lo dice apertamente.",
        confidence: "Confidence",
        confidenceBody: "La confidence misura quanto è solida l'evidenza disponibile per quella specifica Release, non quanto ci piace il risultato.",
        limitedKicker: "QUANDO I DATI SONO LIMITATI",
        limitedTitle: "L'incertezza deve restare visibile.",
        limitedBody: "Una Release senza abbastanza evidenza non riceve un valore inventato. TrackDash continua a mostrare quello che sappiamo — offerte correnti, vendite disponibili e contesto — senza fingere precisione.",
        liveKicker: "SEGNALI LIVE",
        liveTitle: "Il mercato reale, Release per Release.",
        liveBody: "Qui sotto trovi esclusivamente segnali R3 reali già disponibili in TrackDash. Ogni riga porta alla singola Release, dove puoi vedere il contesto completo.",
      }
    : {
        kicker: "PRICE INTELLIGENCE",
        titleA: "Know what a Release is worth",
        titleB: "and why.",
        intro: "TrackDash separates different market signals and only builds a Market Value when the available evidence is strong enough. Asking prices are never presented as demonstrated value.",
        explore: "Explore live signals",
        catalog: "Browse catalog",
        signalsKicker: "THE SIGNALS",
        signalsTitle: "Different signals. Different meaning.",
        signalsIntro: "Retail, completed sales and active asks answer different questions. TrackDash keeps them separate before building a market view.",
        retail: "Verified retail",
        retailBody: "Current or verified retail references. Useful for understanding availability and the context of new stock.",
        sold: "Completed sales",
        soldBody: "Prices collectors actually paid when the exact Release identity is sufficiently reliable. This is the key signal for secondary-market value.",
        asks: "Active asks",
        asksBody: "What sellers are asking right now. They show availability, but cannot define Market Value on their own.",
        resultKicker: "THE RESULT",
        resultTitle: "Market Value is a considered estimate, not a shortcut.",
        resultBody: "When evidence is sufficient, TrackDash returns a value, a range and a confidence level. When it is not, uncertainty stays visible.",
        confidence: "Confidence",
        confidenceBody: "Confidence describes the strength of evidence for that exact Release — not how attractive the number looks.",
        limitedKicker: "WHEN DATA IS LIMITED",
        limitedTitle: "Uncertainty should stay visible.",
        limitedBody: "A Release without enough evidence does not receive an invented value. TrackDash still shows what is known — current offers, completed sales and context — without pretending to know more.",
        liveKicker: "LIVE SIGNALS",
        liveTitle: "The real market, Release by Release.",
        liveBody: "Below you will find only real R3 signals already available in TrackDash. Every row links to the exact Release and its full market context.",
      }

  return (
    <div className="flex flex-col gap-8 md:gap-10">
      <section className="relative overflow-hidden rounded-[28px] border border-[#d9e4f2] bg-[linear-gradient(135deg,#f8fbff_0%,#eef5ff_58%,#f8fafc_100%)] px-5 py-8 shadow-[0_18px_50px_rgba(15,56,120,0.08)] md:px-8 md:py-12 lg:px-12 lg:py-14">
        <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full border-[28px] border-white/70" />
        <div className="pointer-events-none absolute -bottom-20 right-20 h-40 w-80 rotate-[-8deg] rounded-[999px] border border-[#c9dcf7] opacity-70" />
        <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">{copy.kicker}</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-navy sm:text-5xl lg:text-[60px] lg:leading-[1.02]">
              {copy.titleA}<br /><span className="text-brand">{copy.titleB}</span>
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-[#55708f] md:text-base md:leading-7">{copy.intro}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#live-market" className="inline-flex h-11 items-center gap-2 rounded-md bg-brand px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0e49c7]">
                {copy.explore} <ArrowRight className="size-4" />
              </a>
              <Link href="/catalog" className="inline-flex h-11 items-center rounded-md border border-[#c9d9eb] bg-white px-4 text-sm font-semibold text-navy transition hover:bg-[#f4f8fd]">
                {copy.catalog}
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MiniStat label={it ? "Release monitorate" : "Tracked releases"} value={String(rows.length)} />
            <MiniStat label={it ? "Valori consolidati" : "Consolidated values"} value={String(valued.length)} />
            <MiniStat label={it ? "Offerte correnti" : "Current offers"} value={String(currentOffers)} />
            <MiniStat label={it ? "Trend reali" : "Real trends"} value={String(trends.length)} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 rounded-[28px] border border-border bg-white p-5 md:p-8 lg:grid-cols-[0.82fr_1.18fr] lg:gap-10">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">{copy.signalsKicker}</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-navy md:text-4xl">{copy.signalsTitle}</h2>
          <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground md:text-base">{copy.signalsIntro}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
          <SignalCard number="01" icon={ShoppingBag} title={copy.retail} body={copy.retailBody} />
          <SignalCard number="02" icon={BadgeCheck} title={copy.sold} body={copy.soldBody} />
          <SignalCard number="03" icon={LineChart} title={copy.asks} body={copy.asksBody} />
        </div>
      </section>

      <section className="grid overflow-hidden rounded-[28px] border border-[#173f79] bg-navy text-white lg:grid-cols-[1fr_0.95fr]">
        <div className="p-6 md:p-9 lg:p-10">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a8c8ff]">{copy.resultKicker}</p>
          <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-[-0.035em] md:text-4xl">{copy.resultTitle}</h2>
          <p className="mt-4 max-w-xl text-sm leading-6 text-[#c8d8ec] md:text-base">{copy.resultBody}</p>
          <div className="mt-7 rounded-2xl border border-white/15 bg-white/[0.06] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold"><CircleHelp className="size-4 text-[#9ec0ff]" />{copy.confidence}</div>
            <p className="mt-2 text-sm leading-6 text-[#c8d8ec]">{copy.confidenceBody}</p>
          </div>
        </div>

        <div className="border-t border-white/10 bg-white/[0.04] p-6 md:p-9 lg:border-l lg:border-t-0 lg:p-10">
          {example ? <ValueExample row={example} /> : (
            <div className="flex min-h-64 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.04] p-6 text-center text-sm text-[#c8d8ec]">
              {it ? "Il primo Market Value consolidato comparirà qui." : "The first consolidated Market Value will appear here."}
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 rounded-[28px] border border-[#eadfca] bg-[#fffaf1] p-5 md:p-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-10">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a66a19]">{copy.limitedKicker}</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-[#513712] md:text-4xl">{copy.limitedTitle}</h2>
          <p className="mt-4 text-sm leading-6 text-[#77684f] md:text-base">{copy.limitedBody}</p>
        </div>
        <div className="rounded-2xl border border-[#ead8b7] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9b7a42]">Market Value</span>
            <Badge variant="outline" className="border-[#e8d8ba] bg-[#fffaf1] text-[#785c30]">{it ? "Dati limitati" : "Limited data"}</Badge>
          </div>
          <p className="mt-6 text-2xl font-semibold tracking-tight text-[#513712]">{it ? "Non ancora consolidato" : "Not yet consolidated"}</p>
          <p className="mt-2 text-sm leading-6 text-[#77684f]">{it ? "Il contesto resta visibile, ma TrackDash non pubblica un numero finché il segnale non è abbastanza affidabile." : "Context remains visible, but TrackDash does not publish a number until the signal is reliable enough."}</p>
        </div>
      </section>

      <section id="live-market" className="scroll-mt-28 rounded-[28px] border border-border bg-[#f8fafc] p-4 md:p-6 lg:p-8">
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">{copy.liveKicker}</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-navy md:text-4xl">{copy.liveTitle}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">{copy.liveBody}</p>
          </div>
        </div>

        <Alert className="mb-5 bg-white"><Info /><AlertTitle>Market Method v1</AlertTitle><AlertDescription>{it ? "Questa sezione usa solo segnali R3 reali. Le richieste dei venditori non possono creare o gonfiare il Valore di mercato e un trend compare soltanto con una serie temporale sufficiente di vendite concluse." : "This section uses real R3 signals only. Seller asks cannot create or inflate Market Value, and a trend appears only when sufficient completed-sale history exists."}</AlertDescription></Alert>

        <Tabs defaultValue="values">
          <TabsList className="bg-white"><TabsTrigger value="values"><Activity data-icon="inline-start" />{it ? "Valori" : "Values"}</TabsTrigger><TabsTrigger value="trends"><TrendingUp data-icon="inline-start" />{it ? "Trend" : "Trends"}</TabsTrigger></TabsList>
          <TabsContent value="values" className="mt-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <MarketListCard title={it ? "Valore di mercato consolidato" : "Consolidated Market Value"} rows={valued} />
              <MarketListCard title={it ? "Mercato in formazione" : "Market forming"} rows={forming} forming />
            </div>
          </TabsContent>
          <TabsContent value="trends" className="mt-4">
            {trends.length === 0 ? (
              <Card><CardContent className="py-8 text-center"><TrendingUp className="mx-auto mb-3 size-6 text-muted-foreground" /><p className="font-medium">{it ? "Nessun trend vendite ancora consolidato" : "No consolidated sales trend yet"}</p><p className="mx-auto mt-1 max-w-lg text-sm text-muted-foreground">{it ? "È corretto così: TrackDash non genera trend da prezzi richiesti o da pochi snapshot. Appariranno quando avremo una serie temporale sufficiente di vendite concluse per la singola Release." : "This is intentional: TrackDash does not generate trends from asking prices or a few snapshots. Trends will appear once enough completed-sale history exists for the exact Release."}</p></CardContent></Card>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2"><TrendCard title={it ? "In crescita" : "Rising"} rows={trends.filter((row) => (row.signal.trendPercent ?? 0) >= 0)} icon={ArrowUpRight} /><TrendCard title={it ? "In calo" : "Falling"} rows={[...trends].reverse().filter((row) => (row.signal.trendPercent ?? 0) < 0)} icon={ArrowDownRight} /></div>
            )}
          </TabsContent>
        </Tabs>
      </section>
    </div>
  )
}

function SignalCard({ number, icon: Icon, title, body }: { number: string; icon: React.ComponentType<{ className?: string }>; title: string; body: string }) {
  return (
    <article className="rounded-2xl border border-[#dfe7f0] bg-[#fbfdff] p-4">
      <div className="flex items-center justify-between"><span className="font-mono text-[10px] font-semibold tracking-[0.16em] text-[#8396ad]">{number}</span><Icon className="size-4 text-brand" /></div>
      <h3 className="mt-5 text-base font-semibold text-navy">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
    </article>
  )
}

function ValueExample({ row }: { row: Row }) {
  const { locale } = useI18n()
  const it = locale === "it"
  const low = row.signal.lowEUR
  const high = row.signal.highEUR
  const value = row.signal.valueEUR
  return (
    <div className="rounded-2xl border border-white/15 bg-[#09295f] p-5 shadow-[0_16px_35px_rgba(0,0,0,0.18)] md:p-6">
      <div className="flex items-center justify-between gap-3"><span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9ec0ff]">Market Value</span><span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-[#dce9ff]"><span className="size-1.5 rounded-full bg-emerald-400" />{row.signal.confidenceLabel} confidence</span></div>
      <p className="mt-5 text-sm font-medium text-[#d6e4f6]">{row.release.editionName}</p>
      <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.12em] text-[#8facd3]">Tamiya {row.release.itemNumber ?? "—"}</p>
      <p className="mt-6 text-4xl font-semibold tracking-[-0.04em] text-white">{formatMoney(value!)}</p>
      {low != null && high != null ? <p className="mt-2 text-sm text-[#bfd0e8]">{it ? "Range tipico" : "Typical range"} <strong className="font-semibold text-white">{formatMoney(low)}–{formatMoney(high)}</strong></p> : null}
      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/10 pt-4 text-xs text-[#9fb6d5]">
        {row.signal.soldUnits > 0 ? <span>{row.signal.soldUnits} {it ? "vendite" : "sold units"}</span> : null}
        {row.signal.retailSourceCount > 0 ? <span>{row.signal.retailSourceCount} retail</span> : null}
        {row.signal.currentOfferCount > 0 ? <span>{row.signal.currentOfferCount} {it ? "offerte" : "offers"}</span> : null}
      </div>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: React.ReactNode }) {
  return <Card className="border-[#dce7f4] bg-white/85 py-0 shadow-sm backdrop-blur"><CardContent className="flex min-h-[84px] flex-col justify-center gap-1 px-4 py-3"><span className="text-[11px] font-medium text-muted-foreground">{label}</span><span className="text-xl font-semibold tabular-nums text-navy">{value}</span></CardContent></Card>
}

function MarketListCard({ title, rows, forming = false }: { title: string; rows: Row[]; forming?: boolean }) {
  const { locale } = useI18n(); const it = locale === "it"
  return (
    <Card className="overflow-hidden border-[#dfe7f0] bg-white shadow-sm">
      <CardHeader className="border-b border-border/70 bg-[#fbfdff]"><CardTitle className="text-base text-navy">{title}<Badge variant="secondary" className="ml-2">{rows.length}</Badge></CardTitle></CardHeader>
      <CardContent className="flex flex-col gap-0.5 p-2">
        {rows.length === 0 ? <p className="px-3 py-5 text-sm text-muted-foreground">{it ? "Nessuna Release in questo stato." : "No Releases in this state."}</p> : rows.map((row) => <MarketRow key={row.release.id} row={row} forming={forming} />)}
      </CardContent>
    </Card>
  )
}

function MarketRow({ row, forming }: { row: Row; forming: boolean }) {
  const { locale } = useI18n(); const it = locale === "it"
  const href = `/catalog/${row.product.id}/releases/${row.release.id}`
  return (
    <Link href={href} className="group flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-[#f4f8fd]">
      <ProductImage product={row.product} release={row.release} size="sm" className="h-12 w-16 shrink-0 rounded-lg border border-border bg-white" />
      <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-navy group-hover:text-brand">{row.release.editionName}</p><div className="mt-0.5 flex flex-wrap items-center gap-1.5"><span className="text-xs text-muted-foreground">#{row.release.itemNumber ?? "—"}</span>{row.release.rarity ? <RarityBadge rarity={row.release.rarity} /> : null}</div></div>
      <div className="max-w-40 text-right">
        {forming ? <p className="text-xs font-medium text-[#6f7f91]">{it ? "Non consolidato" : "Not consolidated"}</p> : <p className="text-sm font-semibold tabular-nums text-navy">{formatMoney(row.signal.valueEUR!)}</p>}
        {row.signal.trendPercent != null ? <TrendIndicator value={row.signal.trendPercent} className="justify-end text-xs" /> : null}
        {row.signal.startingItemPriceEUR != null ? <p className="text-[11px] text-muted-foreground">{it ? "Da" : "From"} {formatMoney(row.signal.startingItemPriceEUR)}</p> : null}
      </div>
    </Link>
  )
}

function TrendCard({ title, rows, icon: Icon }: { title: string; rows: Row[]; icon: React.ComponentType<{ className?: string }>; }) {
  return <Card className="border-[#dfe7f0] bg-white shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2 text-base text-navy"><Icon className="size-4" />{title}</CardTitle></CardHeader><CardContent className="flex flex-col gap-0.5 p-2 pt-0">{rows.length === 0 ? <p className="px-2 py-4 text-sm text-muted-foreground">—</p> : rows.map((row) => <MarketRow key={row.release.id} row={row} forming={false} />)}</CardContent></Card>
}
