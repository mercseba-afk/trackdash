"use client"

import * as React from "react"
import Link from "next/link"
import { Activity, ArrowRight, Gem, History, TrendingUp } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useMarketSignals } from "@/lib/market/context"
import type { ReleaseMarketSignalView } from "@/lib/market/view-types"
import type { Product, ProductRelease } from "@/lib/types"
import { formatMoney } from "@/lib/format"
import { collectorMarketTrend, observedMarketDisplayKind, observedMarketDisplayLabel, observedMarketDisplayPrice } from "@/lib/market/presentation"
import { ProductImage } from "@/components/catalog/product-image"
import { RarityBadge, TrendIndicator } from "@/components/market-bits"
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

function recentSalesLabel(signal: ReleaseMarketSignalView, it: boolean): string {
  if (signal.recentSoldUnits3m != null && signal.recentSoldPeriodStart && signal.recentSoldPeriodEnd) {
    const start = new Date(`${signal.recentSoldPeriodStart}T00:00:00Z`)
    const end = new Date(`${signal.recentSoldPeriodEnd}T00:00:00Z`)
    const locale = it ? "it-IT" : "en-US"
    const monthFormatter = new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" })
    const startMonth = monthFormatter.format(start).replace(".", "")
    const endMonth = monthFormatter.format(end).replace(".", "")
    const period = start.getUTCFullYear() === end.getUTCFullYear()
      ? `${startMonth}–${endMonth} ${end.getUTCFullYear()}`
      : `${startMonth} ${start.getUTCFullYear()}–${endMonth} ${end.getUTCFullYear()}`
    return it
      ? `${signal.recentSoldUnits3m} ${signal.recentSoldUnits3m === 1 ? "vendita" : "vendite"} · ${period}`
      : `${signal.recentSoldUnits3m} ${signal.recentSoldUnits3m === 1 ? "sale" : "sales"} · ${period}`
  }

  return it
    ? `${signal.soldUnits} ${signal.soldUnits === 1 ? "vendita osservata" : "vendite osservate"}`
    : `${signal.soldUnits} observed ${signal.soldUnits === 1 ? "sale" : "sales"}`
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

  const highValue = React.useMemo(() => takeDistinctProducts(active
    .filter((row) => row.signal.valueEUR != null && row.signal.valueEUR > 0)
    .sort((a, b) => (b.signal.valueEUR ?? 0) - (a.signal.valueEUR ?? 0)), 4), [active])

  const gainers = React.useMemo(() => takeDistinctProducts(rows
    .filter((row) => (collectorMarketTrend(row.signal) ?? 0) > 0)
    .sort((a, b) => (collectorMarketTrend(b.signal) ?? 0) - (collectorMarketTrend(a.signal) ?? 0)), 4), [rows])

  const mostTraded = React.useMemo(() => takeDistinctProducts(active
    .filter((row) => row.signal.recentSoldUnits3m != null && row.signal.recentSoldUnits3m > 0)
    .sort((a, b) => (b.signal.recentSoldUnits3m ?? 0) - (a.signal.recentSoldUnits3m ?? 0)), 4), [active])

  const sectionCount = [gainers, highValue, mostTraded, vintage].filter((section) => section.length > 0).length
  if (sectionCount === 0) return null

  return (
    <section className="flex flex-col gap-4" aria-labelledby="market-now-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="market-now-title" className="text-lg font-semibold tracking-tight">{it ? "Mercato in evidenza" : "Market highlights"}</h2>
          <p className="max-w-3xl text-sm text-muted-foreground">
            {it
              ? "Le Release da seguire per crescita, valore e vendite recenti."
              : "Releases worth following for growth, value and recent sales."}
          </p>
        </div>
        <Button variant="ghost" size="sm" render={<Link href="/market" />}>
          {it ? "Vedi tutto il mercato" : "View full market"} <ArrowRight />
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {gainers.length > 0 ? (
          <MarketBlock
            title={it ? "In crescita" : "Growing"}
            subtitle={it ? "Le Release con l'andamento positivo più significativo." : "Releases with the strongest positive movement."}
            rows={gainers}
            icon={TrendingUp}
            it={it}
          />
        ) : null}

        {highValue.length > 0 ? (
          <MarketBlock
            title={it ? "Valori più alti" : "Highest values"}
            subtitle={it ? "Le stime più alte tra le Release con attività di mercato recente." : "The highest estimates among Releases with recent market activity."}
            rows={highValue}
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
}: {
  title: string
  subtitle: string
  rows: MarketRow[]
  icon: React.ComponentType<{ className?: string }>
  it: boolean
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base"><Icon className="size-4 text-brand" /> {title}</CardTitle>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-0.5">
        {rows.map((row) => <MarketRowItem key={row.release.id} row={row} it={it} />)}
      </CardContent>
    </Card>
  )
}

function MarketRowItem({ row, it }: { row: MarketRow; it: boolean }) {
  const href = `/catalog/${row.product.id}/releases/${row.release.id}`
  const year = releaseYear(row.release)
  const salesLabel = recentSalesLabel(row.signal, it)
  const displayPrice = observedMarketDisplayPrice(row.signal)
  const displayKind = observedMarketDisplayKind(row.signal)
  const showProductFamily = row.release.editionName.trim().toLowerCase() !== row.product.name.trim().toLowerCase()

  return (
    <Link href={href} className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-accent">
      <ProductImage product={row.product} release={row.release} size="sm" className="h-12 w-16 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{row.release.editionName}</p>
        {showProductFamily ? <p className="truncate text-[11px] text-muted-foreground">{row.product.name}</p> : null}
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          {year != null ? <span className="text-xs text-muted-foreground">{year}</span> : null}
          <span className="text-xs text-muted-foreground">#{row.release.itemNumber ?? "—"}</span>
          {row.release.rarity ? <RarityBadge rarity={row.release.rarity} /> : null}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
          <span>{salesLabel}</span>
          {row.signal.currentOfferCount > 0 ? <><span aria-hidden>·</span><span>{row.signal.currentOfferCount} {it ? "annunci osservati" : "observed listings"}</span></> : null}
        </div>
      </div>
      <div className="max-w-36 shrink-0 text-right">
        {row.signal.valueEUR != null ? (
          <>
            <p className="text-[10px] text-muted-foreground">{it ? "Valore stimato" : "Estimated value"}</p>
            <p className="text-sm font-semibold tabular-nums">{formatMoney(row.signal.valueEUR)}</p>
          </>
        ) : displayPrice != null ? (
          <>
            <p className="text-[10px] text-muted-foreground">{observedMarketDisplayLabel(row.signal, it)}</p>
            <p className="text-sm font-semibold tabular-nums">{displayKind === "sold" ? "≈ " : ""}{formatMoney(displayPrice)}</p>
          </>
        ) : (
          <Badge variant="secondary">{it ? "Valore in verifica" : "Value under review"}</Badge>
        )}
        {collectorMarketTrend(row.signal) != null ? (
          <div className="mt-0.5 flex flex-col items-end">
            <TrendIndicator value={collectorMarketTrend(row.signal)!} className="text-xs" />
            {row.signal.trendWindowMonths != null
              ? <span className="text-[10px] text-muted-foreground">{it
                  ? row.signal.trendWindowMonths === 1 ? "ultimo mese" : `ultimi ${row.signal.trendWindowMonths} mesi`
                  : row.signal.trendWindowMonths === 1 ? "last month" : `last ${row.signal.trendWindowMonths} months`}</span>
              : null}
          </div>
        ) : null}
      </div>
    </Link>
  )
}
