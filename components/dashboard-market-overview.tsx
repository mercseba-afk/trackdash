"use client"

import * as React from "react"
import Link from "next/link"
import { Activity, ArrowRight, Clock, Gem, History, TrendingUp } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useMarketSignals } from "@/lib/market/context"
import type { ReleaseMarketSignalView } from "@/lib/market/view-types"
import type { Product, ProductRelease } from "@/lib/types"
import { formatMoney } from "@/lib/format"
import { collectorMarketTrend, observedMarketDisplayKind, observedMarketDisplayPrice, observedMarketReferenceIsHistorical } from "@/lib/market/presentation"
import { highestVerifiedAskingRows, latestVerifiedAskingRows, recentCollectorMarketTrend, verifiedAskingObservation } from "@/lib/market/highlights"
import { ProductImage } from "@/components/catalog/product-image"
import { TrendIndicator } from "@/components/market-bits"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface MarketRow {
  product: Product
  release: ProductRelease
  signal: ReleaseMarketSignalView
}

function hasMeaningfulActivity(signal: ReleaseMarketSignalView): boolean {
  const trend = collectorMarketTrend(signal)
  if (trend != null) return trend > 0
  return signal.recentSoldUnits3m != null && signal.recentSoldUnits3m >= 2
}

function isEditoriallyPositive(signal: ReleaseMarketSignalView): boolean {
  const trend = collectorMarketTrend(signal)
  return trend == null || trend > 0
}

function releaseYear(release: ProductRelease): number | null {
  if (release.releaseYear == null) return null
  const value = Number(release.releaseYear)
  return Number.isFinite(value) ? value : null
}

function takeDistinctProducts(rows: MarketRow[], limit: number): MarketRow[] {
  const productIds = new Set<string>()
  const result: MarketRow[] = []

  for (const row of rows) {
    if (productIds.has(row.product.id)) continue
    productIds.add(row.product.id)
    result.push(row)
    if (result.length >= limit) break
  }

  return result
}

export function DashboardMarketOverview({ products }: { products: Product[] }) {
  const { locale } = useI18n()
  const it = locale === "it"
  const marketSignals = useMarketSignals()

  const rows = React.useMemo<MarketRow[]>(() => products.flatMap((product) =>
    product.releases.flatMap((release) => {
      const signal = marketSignals[release.id]
      return signal ? [{ product, release, signal }] : []
    }),
  ), [marketSignals, products])

  const active = React.useMemo(
    () => rows.filter((row) => hasMeaningfulActivity(row.signal) && isEditoriallyPositive(row.signal)),
    [rows],
  )

  const vintage = React.useMemo(() => takeDistinctProducts(active
    .filter((row) => {
      const year = releaseYear(row.release)
      return year != null && year <= 2000 && row.signal.valueEUR != null && row.signal.valueEUR > 0
    })
    .sort((a, b) => {
      const recentDelta = (b.signal.recentSoldUnits3m ?? 0) - (a.signal.recentSoldUnits3m ?? 0)
      if (recentDelta !== 0) return recentDelta
      const trendDelta = Math.abs(collectorMarketTrend(b.signal) ?? 0) - Math.abs(collectorMarketTrend(a.signal) ?? 0)
      if (trendDelta !== 0) return trendDelta
      return (b.signal.valueEUR ?? 0) - (a.signal.valueEUR ?? 0)
    }), 4), [active])

  const gainers = React.useMemo(() => takeDistinctProducts(rows
    .filter((row) => row.signal.valueEUR != null && row.signal.valueEUR > 0 && (collectorMarketTrend(row.signal) ?? 0) > 0)
    .filter((row) => recentCollectorMarketTrend(row.signal) != null)
    .sort((a, b) => (collectorMarketTrend(b.signal) ?? 0) - (collectorMarketTrend(a.signal) ?? 0)), 4), [rows])

  const latestVerifications = React.useMemo(() => latestVerifiedAskingRows(rows), [rows])

  // Rank the same fresh, dated asking projection shown on Release pages.
  // Each block is independent, so a growth entry cannot hide a higher quote.
  const highestAsks = React.useMemo(() => highestVerifiedAskingRows(rows), [rows])

  const mostTraded = React.useMemo(() => takeDistinctProducts(active
    .filter((row) => row.signal.recentSoldUnits3m != null && row.signal.recentSoldUnits3m > 0)
    .sort((a, b) => (b.signal.recentSoldUnits3m ?? 0) - (a.signal.recentSoldUnits3m ?? 0)), 4), [active])

  const sectionCount = [latestVerifications, gainers, highestAsks, mostTraded, vintage].filter((section) => section.length > 0).length
  if (sectionCount === 0) return null

  return (
    <section className="flex flex-col gap-4" aria-labelledby="market-now-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="market-now-title" className="text-lg font-semibold tracking-tight">{it ? "Mercato in evidenza" : "Market highlights"}</h2>
          <p className="max-w-3xl text-sm text-muted-foreground">
            {it
              ? "Quotazioni verificate di recente e movimenti confermati."
              : "Recently verified quotes and confirmed movements."}
          </p>
        </div>
        <Button variant="ghost" size="sm" render={<Link href="/market" />}>
          {it ? "Vedi tutto il mercato" : "View full market"} <ArrowRight />
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {latestVerifications.length > 0 ? (
          <MarketBlock
            title={it ? "Novità dal mercato" : "Market updates"}
            subtitle={it ? "Prezzi richiesti dai venditori, verificati di recente." : "Sellers’ asking prices, recently verified."}
            rows={latestVerifications}
            priceMode="verified_asking"
            icon={Clock}
            it={it}
          />
        ) : null}
        {gainers.length > 0 ? (
          <MarketBlock
            title={it ? "In crescita" : "Growing"}
            subtitle={it ? "Andamenti positivi confermati negli ultimi 30 giorni." : "Positive movements confirmed in the last 30 days."}
            rows={gainers}
            icon={TrendingUp}
            it={it}
          />
        ) : null}

        {highestAsks.length > 0 ? (
          <MarketBlock
            title={it ? "Le richieste più alte" : "Highest asking prices"}
            subtitle={it ? "Le release con i prezzi richiesti più elevati." : "Releases with the highest asking prices."}
            rows={highestAsks}
            priceMode="asking"
            icon={Gem}
            it={it}
          />
        ) : null}

        {mostTraded.length > 0 ? (
          <MarketBlock
            title={it ? "Più scambiate di recente" : "Most traded recently"}
            subtitle={it ? "Le Release con più vendite osservate negli ultimi mesi." : "Releases with the most observed sales in recent months."}
            rows={mostTraded}
            icon={Activity}
            it={it}
          />
        ) : null}

        {vintage.length > 0 ? (
          <MarketBlock
            title={it ? "Vintage in evidenza" : "Vintage highlights"}
            subtitle={it ? "Le Release storiche con vendite o movimenti recenti." : "Vintage Releases with recent sales or movement."}
            rows={vintage}
            icon={History}
            it={it}
          />
        ) : null}
      </div>
    </section>
  )
}

function MarketBlock({
  title,
  subtitle,
  rows,
  icon: Icon,
  it,
  priceMode = "market",
}: {
  title: string
  subtitle: string
  rows: MarketRow[]
  priceMode?: "market" | "asking" | "verified_asking"
  icon: React.ComponentType<{ className?: string }>
  it: boolean
}) {
  return (
    <Card className={priceMode === "verified_asking" ? "border-brand/20 bg-brand/5" : undefined}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base"><Icon className="size-4 text-brand" /> {title}</CardTitle>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardHeader>
      <CardContent className="divide-y divide-border/70">
        {rows.map((row) => <MarketRowItem key={row.release.id} row={row} it={it} priceMode={priceMode} />)}
      </CardContent>
    </Card>
  )
}

function MarketRowItem({ row, it, priceMode }: { row: MarketRow; it: boolean; priceMode: "market" | "asking" | "verified_asking" }) {
  const href = `/catalog/${row.product.id}/releases/${row.release.id}`
  const year = releaseYear(row.release)
  const isMarket = priceMode === "market"
  const displayPrice = isMarket
    ? observedMarketDisplayPrice(row.signal)
    : verifiedAskingObservation(row.signal)?.priceEUR ?? null
  const displayKind = isMarket ? observedMarketDisplayKind(row.signal) : "ask"
  const estimate = isMarket ? row.signal.valueEUR : null
  const price = estimate ?? displayPrice
  const trend = isMarket ? recentCollectorMarketTrend(row.signal) : null
  const priceLabel = estimate != null
    ? (it ? "Riferimento mercato" : "Market reference")
    : displayKind === "sold"
      ? (it ? "Vendite concluse" : "Completed sales")
      : isMarket && observedMarketReferenceIsHistorical(row.signal)
        ? (it ? "Ultimo prezzo osservato" : "Last observed asking price")
        : (it ? "Prezzi negli annunci" : "Listing prices")
  const identity = [row.release.itemNumber ? `#${row.release.itemNumber}` : null, year].filter(Boolean).join(" · ")

  return (
    <Link href={href} className="flex items-center gap-3 rounded-md px-1 py-3 hover:bg-accent sm:gap-4 sm:px-2">
      <ProductImage
        product={row.product}
        release={row.release}
        sizes="(min-width: 640px) 112px, 96px"
        className="aspect-[4/3] w-24 shrink-0 rounded-lg bg-white sm:w-28"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug font-semibold wrap-anywhere sm:text-base">{row.release.editionName}</p>
        {identity ? <p className="mt-0.5 text-xs text-muted-foreground">{identity}</p> : null}
        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          {price != null ? (
            <>
              <span className="text-sm font-semibold tabular-nums whitespace-nowrap">{estimate == null && displayKind === "sold" ? "≈ " : ""}{formatMoney(price)}</span>
              <span className="text-xs text-muted-foreground">{priceLabel}</span>
            </>
          ) : (
            <Badge variant="secondary">{it ? "Valore in verifica" : "Value under review"}</Badge>
          )}
          {trend != null ? <TrendIndicator value={trend} className="text-xs" /> : null}
        </div>
      </div>
    </Link>
  )
}
