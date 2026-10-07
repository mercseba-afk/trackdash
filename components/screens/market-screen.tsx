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
  LockKeyhole,
  ShoppingBag,
  TrendingUp,
} from "lucide-react"
import { useMarketSignals } from "@/lib/market/context"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { formatMoney } from "@/lib/format"
import { collectorMarketTrend, observedMarketDisplayKind, observedMarketDisplayLabel, observedMarketDisplayPrice } from "@/lib/market/presentation"
import type { Product, ProductRelease } from "@/lib/types"
import { localizePublicPath, releasePublicPath } from "@/lib/seo/catalog-paths"
import type { ReleaseMarketSignalView } from "@/lib/market/view-types"
import { ProductImage } from "@/components/catalog/product-image"
import { PwaInstallSettingsButton } from "@/components/pwa-install-menu-item"
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

function hasMarketEvidence(signal: ReleaseMarketSignalView): boolean {
  return (
    (signal.valueEUR != null && signal.valueEUR > 0) ||
    observedMarketDisplayPrice(signal) != null ||
    signal.currentOfferCount > 0 ||
    signal.soldUnits > 0 ||
    signal.retailSourceCount > 0 ||
    collectorMarketTrend(signal) != null
  )
}

export function MarketScreen({ products }: { products: Product[] }) {
  const { locale } = useI18n()
  const { user } = useStore()
  const it = locale === "it"
  const marketSignals = useMarketSignals()
  const marketPath = localizePublicPath("/market", locale)
  const liveLoginHref = `/login?next=${encodeURIComponent(`${marketPath}#live-market`)}`
  const liveSignupHref = `/signup?next=${encodeURIComponent(`${marketPath}#live-market`)}`

  const rows = React.useMemo<Row[]>(() => products.flatMap((product) =>
    product.releases.flatMap((release) => {
      const signal = marketSignals[release.id]
      return signal && hasMarketEvidence(signal) ? [{ product, release, signal }] : []
    }),
  ), [marketSignals, products])

  const valued = React.useMemo(() => rows
    .filter((row) => row.signal.valueEUR != null && row.signal.valueEUR > 0)
    .sort((a, b) => (b.signal.valueEUR ?? 0) - (a.signal.valueEUR ?? 0)), [rows])
  const forming = React.useMemo(() => rows.filter((row) => row.signal.valueEUR == null), [rows])
  const trends = React.useMemo(() => rows
    .map((row) => ({ row, trend: collectorMarketTrend(row.signal) }))
    .filter((entry): entry is { row: Row; trend: number } => entry.trend != null)
    .sort((a, b) => b.trend - a.trend), [rows])
  const currentOffers = rows.reduce((sum, row) => sum + row.signal.currentOfferCount, 0)
  const example = React.useMemo(() => {
    const positive = valued
      .filter((row) => (collectorMarketTrend(row.signal) ?? 0) > 0)
      .sort((a, b) => (collectorMarketTrend(b.signal) ?? 0) - (collectorMarketTrend(a.signal) ?? 0))
    if (positive[0]) return positive[0]

    return valued.find((row) => collectorMarketTrend(row.signal) == null) ?? null
  }, [valued])

  const copy = it
    ? {
        kicker: "ANALISI DI MERCATO",
        titleA: "Scopri quanto vale davvero",
        titleB: "il mercato Mini 4WD.",
        intro: "TrackDash monitora prezzi, annunci e vendite per aiutarti a seguire il valore delle singole Release e della tua collezione, senza confondere prezzi richiesti e vendite reali.",
        explore: "Guarda i valori disponibili",
        catalog: "Vai al catalogo",
        signalsKicker: "COME LEGGIAMO IL MERCATO",
        signalsTitle: "Dati reali per capire il valore.",
        signalsIntro: "Vendite concluse, prezzi nei negozi e annunci attivi raccontano il mercato da punti di vista diversi. TrackDash li legge insieme per costruire un quadro più chiaro del valore di ogni Release.",
        retail: "Prezzi nei negozi",
        retailBody: "Ci aiutano a capire quanto costa oggi una Release quando è ancora disponibile come prodotto nuovo.",
        sold: "Vendite concluse",
        soldBody: "Mostrano quanto è stato realmente pagato per quella specifica Release e sono il riferimento più utile per il mercato del collezionismo.",
        asks: "ASK · Annunci attivi",
        asksBody: "ASK significa prezzo richiesto dal venditore. Mostra a quanto viene proposta oggi una Release e quanto è facile trovarla, ma non equivale a un prezzo realmente pagato.",
        resultKicker: "IL RISULTATO",
        resultTitle: "Valore di mercato: la stima TrackDash del valore attuale.",
        resultBody: "Quando ci sono abbastanza dati, il valore di mercato mostra una stima e una fascia indicativa. Quando i dati non bastano, TrackDash lo segnala senza inventare un prezzo.",
        confidence: "Affidabilità della stima",
        confidenceBody: "Indica quanto possiamo fidarci della stima in base alla quantità e alla qualità dei dati disponibili per quella specifica Release.",
        limitedKicker: "QUANDO I DATI SONO LIMITATI",
        limitedTitle: "Se i dati non bastano, non inventiamo un prezzo.",
        limitedBody: "Alcune Release sono rare o si muovono poco. In questi casi TrackDash mostra ciò che è disponibile e aspetta dati migliori prima di pubblicare una stima.",
        liveKicker: "DATI DISPONIBILI",
        liveTitle: "Valori e trend, Release per Release.",
        liveBody: "Qui trovi solo le Release per cui TrackDash ha già almeno un'evidenza di mercato reale. Apri una scheda per vedere valore stimato, disponibilità e andamento quando presenti.",
        betaTitle: "Beta mercato · Pro in arrivo",
        betaBody: "Per ora valori, segnali e trend attuali sono disponibili con l'account Free. TrackDash Pro aggiungerà soprattutto storico e grafici 30/90 giorni, alert, analisi della collezione e strumenti avanzati.",
      }
    : {
        kicker: "PRICE INTELLIGENCE",
        titleA: "See what the Mini 4WD market",
        titleB: "is really worth.",
        intro: "TrackDash monitors prices, listings and completed sales to help you follow individual Release values and your collection without confusing asking prices with real sales.",
        explore: "View available values",
        catalog: "Browse catalog",
        signalsKicker: "HOW WE READ THE MARKET",
        signalsTitle: "Real data to understand value.",
        signalsIntro: "Completed sales, store prices and active listings each tell a different part of the market story. TrackDash reads them together to build a clearer picture of each Release’s value.",
        retail: "Store prices",
        retailBody: "They help show what a Release costs today when it is still available as a new product.",
        sold: "Completed sales",
        soldBody: "They show what people actually paid for that specific Release and are the most useful reference for the collector market.",
        asks: "ASK · Active listings",
        asksBody: "ASK means the price requested by the seller. It shows today’s listing price and availability, but it is not the same as a completed sale.",
        resultKicker: "THE RESULT",
        resultTitle: "Market Value: TrackDash’s estimate of current value.",
        resultBody: "When there is enough data, Market Value shows an estimate and a useful range. When there is not, TrackDash says so instead of inventing a price.",
        confidence: "Estimate reliability",
        confidenceBody: "It shows how much trust we can place in the estimate based on the amount and quality of data available for that exact Release.",
        limitedKicker: "WHEN DATA IS LIMITED",
        limitedTitle: "If the data is not enough, we do not invent a price.",
        limitedBody: "Some Releases are rare or rarely traded. In those cases TrackDash shows what is available and waits for better data before publishing an estimate.",
        liveKicker: "AVAILABLE DATA",
        liveTitle: "Values and trends, Release by Release.",
        liveBody: "Here you can find only Releases for which TrackDash already has real market evidence. Open a Release to see estimated value, availability and trend when available.",
        betaTitle: "Market beta · Pro coming later",
        betaBody: "For now, current values, signals and trends are available with a Free account. TrackDash Pro will mainly add 30/90-day history and charts, alerts, collection analytics and advanced tools.",
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
              {user ? (
                <a href="#live-market" className="inline-flex h-11 items-center gap-2 rounded-md bg-brand px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0e49c7]">
                  {copy.explore} <ArrowRight className="size-4" />
                </a>
              ) : (
                <Link href={liveSignupHref} className="inline-flex h-11 items-center gap-2 rounded-md bg-brand px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0e49c7]">
                  {it ? "Crea account gratuito" : "Create free account"} <ArrowRight className="size-4" />
                </Link>
              )}
              <Link href={localizePublicPath("/catalog", locale)} className="inline-flex h-11 items-center rounded-md border border-[#c9d9eb] bg-white px-4 text-sm font-semibold text-navy transition hover:bg-[#f4f8fd]">
                {copy.catalog}
              </Link>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <MiniStat label={it ? "Release monitorate" : "Monitored Releases"} value={String(rows.length)} />
              <MiniStat label={it ? "Annunci osservati" : "Observed listings"} value={String(currentOffers)} />
              <MiniStat label={it ? "Prezzi aggiornati" : "Updated prices"} value={it ? "Mercato reale" : "Real market"} />
              <MiniStat label={it ? "La tua collezione" : "Your collection"} value={it ? "Sempre allineata" : "Always aligned"} />
            </div>
            <div className="rounded-2xl border border-[#d6e3f2] bg-white/75 p-4 shadow-sm backdrop-blur">
              <p className="text-sm font-semibold text-navy">{it ? "TrackDash sempre con te" : "TrackDash always with you"}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {it
                  ? "Crea il tuo account e installa l’app per controllare catalogo, mercato e collezione direttamente dalla schermata Home."
                  : "Create your account and install the app to keep catalog, market and collection directly on your Home Screen."}
              </p>
              <div className="mt-3">
                <PwaInstallSettingsButton />
              </div>
            </div>
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
              {it ? "Il primo valore stimato disponibile comparirà qui." : "The first available estimated value will appear here."}
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
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9b7a42]">{it ? "Valore di mercato" : "Market Value"}</span>
            <Badge variant="outline" className="border-[#e8d8ba] bg-[#fffaf1] text-[#785c30]">{it ? "Dati limitati" : "Limited data"}</Badge>
          </div>
          <p className="mt-6 text-2xl font-semibold tracking-tight text-[#513712]">{it ? "Mercato in osservazione" : "Market under observation"}</p>
          <p className="mt-2 text-sm leading-6 text-[#77684f]">{it ? "Mostriamo ciò che sappiamo già, ma aspettiamo dati sufficienti prima di pubblicare una stima." : "We show what is already known, but wait for enough data before publishing an estimate."}</p>
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

        {user ? (
          <>
            <Alert className="mb-3 bg-white"><Info /><AlertTitle>{it ? "Come leggere questi dati" : "How to read this data"}</AlertTitle><AlertDescription>{it ? "Le richieste dei venditori negli annunci aiutano a leggere il mercato corrente, mentre il Valore stimato dà più peso alle vendite concluse. I trend compaiono solo quando c'è abbastanza storico comparabile." : "Seller asks in listings help describe the current market, while Estimated value gives more weight to completed sales. Trends appear only when there is enough comparable history."}</AlertDescription></Alert>
            <Alert className="mb-5 border-brand/20 bg-brand-muted/40">
              <TrendingUp />
              <AlertTitle className="flex items-center gap-2">{copy.betaTitle}<Badge variant="outline" className="border-brand/25 bg-white text-brand">{it ? "Free durante la beta" : "Free during beta"}</Badge></AlertTitle>
              <AlertDescription>{copy.betaBody}</AlertDescription>
            </Alert>

            <Tabs defaultValue="values">
              <TabsList className="bg-white"><TabsTrigger value="values"><Activity data-icon="inline-start" />{it ? "Valori" : "Values"}</TabsTrigger><TabsTrigger value="trends"><TrendingUp data-icon="inline-start" />{it ? "Trend" : "Trends"}</TabsTrigger></TabsList>
              <TabsContent value="values" className="mt-4">
                <div className="grid gap-4 lg:grid-cols-2">
                  <MarketListCard title={it ? "Valori disponibili" : "Available values"} rows={valued} />
                  <MarketListCard title={it ? "Mercato osservato" : "Observed market"} rows={forming} forming />
                </div>
              </TabsContent>
              <TabsContent value="trends" className="mt-4">
                {trends.length === 0 ? (
                  <Card><CardContent className="py-8 text-center"><TrendingUp className="mx-auto mb-3 size-6 text-muted-foreground" /><p className="font-medium">{it ? "Nessun trend disponibile per ora" : "No trend available yet"}</p><p className="mx-auto mt-1 max-w-lg text-sm text-muted-foreground">{it ? "I trend compariranno quando avremo abbastanza osservazioni comparabili nel tempo per quella specifica Release." : "Trends will appear once there are enough comparable observations over time for that specific Release."}</p></CardContent></Card>
                ) : (
                  <div className="grid gap-4 lg:grid-cols-2"><TrendCard title={it ? "In crescita" : "Rising"} rows={trends.filter((entry) => entry.trend >= 0).map((entry) => entry.row)} icon={ArrowUpRight} /><TrendCard title={it ? "In calo" : "Falling"} rows={[...trends].reverse().filter((entry) => entry.trend < 0).map((entry) => entry.row)} icon={ArrowDownRight} /></div>
                )}
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="rounded-2xl border border-[#d7e2f0] bg-white px-5 py-8 text-center shadow-sm md:px-8">
            <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-brand-muted text-brand">
              <LockKeyhole className="size-5" />
            </span>
            <h3 className="mt-4 text-xl font-semibold text-navy">{it ? "Accedi per esplorare i segnali live" : "Sign in to explore live signals"}</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              {it
                ? "I valori nelle singole schede restano pubblici. Accedi per esplorare questa panoramica completa del mercato e dei trend disponibili."
                : "Values on individual Release pages remain public. Sign in to explore this complete market overview and available trends."}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link href={liveSignupHref} className="inline-flex h-10 items-center gap-2 rounded-md bg-brand px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0e49c7]">
                {it ? "Crea account gratuito" : "Create free account"} <ArrowRight className="size-4" />
              </Link>
              <Link href={liveLoginHref} className="inline-flex h-10 items-center gap-2 rounded-md border border-[#c9d9eb] bg-white px-4 text-sm font-semibold text-navy transition hover:bg-[#f4f8fd]">
                <LockKeyhole className="size-4" /> {it ? "Ho già un account" : "I already have an account"}
              </Link>
            </div>
          </div>
        )}
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
      <div className="flex items-center justify-between gap-3"><span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9ec0ff]">{it ? "Valore stimato" : "Estimated value"}</span><span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-[#dce9ff]"><span className="size-1.5 rounded-full bg-emerald-400" />{it ? `Affidabilità ${row.signal.confidenceLabel === "high" ? "alta" : row.signal.confidenceLabel === "medium" ? "media" : "bassa"}` : `${row.signal.confidenceLabel === "high" ? "High" : row.signal.confidenceLabel === "medium" ? "Medium" : "Low"} reliability`}</span></div>
      <p className="mt-5 text-sm font-medium text-[#d6e4f6]">{row.release.editionName}</p>
      <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.12em] text-[#8facd3]">Tamiya {row.release.itemNumber ?? "—"}</p>
      <p className="mt-6 text-4xl font-semibold tracking-[-0.04em] text-white">{formatMoney(value!)}</p>
      {low != null && high != null ? <p className="mt-2 text-sm text-[#bfd0e8]">{it ? "Range tipico" : "Typical range"} <strong className="font-semibold text-white">{formatMoney(low)}–{formatMoney(high)}</strong></p> : null}
      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/10 pt-4 text-xs text-[#9fb6d5]">
        {row.signal.soldUnits > 0 ? <span>{row.signal.soldUnits} {it ? "vendite" : "sold units"}</span> : null}
        {row.signal.retailSourceCount > 0 ? <span>{row.signal.retailSourceCount} retail</span> : null}
        {row.signal.currentOfferCount > 0 ? <span>{row.signal.currentOfferCount} {it ? "annunci osservati" : "observed listings"}</span> : null}
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
  const href = releasePublicPath(row.product, row.release, locale)
  const observedPrice = observedMarketDisplayPrice(row.signal)
  const observedKind = observedMarketDisplayKind(row.signal)
  const trend = collectorMarketTrend(row.signal)
  const hasExactReleaseImage = Boolean(row.release.images?.length)
  return (
    <Link href={href} className="group flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-[#f4f8fd]">
      <div className="relative h-12 w-16 shrink-0">
        <ProductImage
          product={row.product}
          release={hasExactReleaseImage ? row.release : undefined}
          size="sm"
          className="h-12 w-16 rounded-lg border border-border bg-white"
        />
        {!hasExactReleaseImage ? (
          <span className="absolute bottom-0.5 left-0.5 rounded bg-white/90 px-1 py-0.5 text-[8px] font-semibold uppercase tracking-[0.06em] text-[#6f7f91] shadow-sm">
            {it ? "Famiglia" : "Family"}
          </span>
        ) : null}
      </div>
      <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-navy group-hover:text-brand">{row.release.editionName}</p><div className="mt-0.5 flex flex-wrap items-center gap-1.5"><span className="text-xs text-muted-foreground">#{row.release.itemNumber ?? "—"}</span>{row.release.rarity ? <RarityBadge rarity={row.release.rarity} /> : null}</div></div>
      <div className="max-w-40 text-right">
        {forming
          ? observedPrice != null
            ? <><p className="text-[10px] text-muted-foreground">{observedMarketDisplayLabel(row.signal, it)}</p><p className="text-sm font-semibold tabular-nums text-navy">{observedKind === "sold" ? "≈ " : ""}{formatMoney(observedPrice)}</p></>
            : <p className="text-xs font-medium text-[#6f7f91]">{it ? "Dati in verifica" : "Data under review"}</p>
          : <p className="text-sm font-semibold tabular-nums text-navy">{formatMoney(row.signal.valueEUR!)}</p>}
        {trend != null ? <TrendIndicator value={trend} className="justify-end text-xs" /> : null}
        {!forming && observedPrice != null ? <p className="text-[11px] text-muted-foreground">{observedMarketDisplayLabel(row.signal, it)} {observedKind === "sold" ? "≈ " : ""}{formatMoney(observedPrice)}</p> : null}
      </div>
    </Link>
  )
}

function TrendCard({ title, rows, icon: Icon }: { title: string; rows: Row[]; icon: React.ComponentType<{ className?: string }>; }) {
  return <Card className="border-[#dfe7f0] bg-white shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2 text-base text-navy"><Icon className="size-4" />{title}</CardTitle></CardHeader><CardContent className="flex flex-col gap-0.5 p-2 pt-0">{rows.length === 0 ? <p className="px-2 py-4 text-sm text-muted-foreground">—</p> : rows.map((row) => <MarketRow key={row.release.id} row={row} forming={false} />)}</CardContent></Card>
}
