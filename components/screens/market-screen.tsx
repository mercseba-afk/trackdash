"use client"

import * as React from "react"
import Link from "next/link"
import { Activity, ArrowDownRight, ArrowUpRight, Info, TrendingUp } from "lucide-react"
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

  const valued = React.useMemo(() => rows.filter((row) => row.signal.valueEUR != null && row.signal.valueEUR > 0).sort((a, b) => (b.signal.valueEUR ?? 0) - (a.signal.valueEUR ?? 0)), [rows])
  const forming = React.useMemo(() => rows.filter((row) => row.signal.valueEUR == null), [rows])
  const trends = React.useMemo(() => rows.filter((row) => row.signal.trendPercent != null).sort((a, b) => (b.signal.trendPercent ?? 0) - (a.signal.trendPercent ?? 0)), [rows])
  const currentOffers = rows.reduce((sum, row) => sum + row.signal.currentOfferCount, 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1"><h1 className="text-2xl font-semibold tracking-tight">{it ? "Mercato" : "Market"}</h1><p className="text-sm text-muted-foreground">{it ? "Segnali reali per singola Release: retail verificato, vendite concluse e richieste attive restano separati." : "Real signals for each Release: verified retail, completed sales and active asks remain separate."}</p></div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MiniStat label={it ? "Release monitorate" : "Tracked releases"} value={String(rows.length)} />
        <MiniStat label={it ? "Valori consolidati" : "Consolidated values"} value={String(valued.length)} />
        <MiniStat label={it ? "Offerte correnti" : "Current offers"} value={String(currentOffers)} />
        <MiniStat label={it ? "Trend reali" : "Real trends"} value={String(trends.length)} />
      </div>

      <Alert><Info /><AlertTitle>{it ? "Market Method v1" : "Market Method v1"}</AlertTitle><AlertDescription>{it ? "Questa pagina usa solo segnali R3 reali. Le richieste dei venditori non possono creare o gonfiare il Valore di mercato e un trend compare soltanto con una serie temporale sufficiente di vendite concluse." : "This page uses real R3 signals only. Seller asks cannot create or inflate Market Value, and a trend appears only when sufficient completed-sale history exists."}</AlertDescription></Alert>

      <Tabs defaultValue="values">
        <TabsList><TabsTrigger value="values"><Activity data-icon="inline-start" />{it ? "Valori" : "Values"}</TabsTrigger><TabsTrigger value="trends"><TrendingUp data-icon="inline-start" />{it ? "Trend" : "Trends"}</TabsTrigger></TabsList>
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
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: React.ReactNode }) {
  return <Card className="py-0"><CardContent className="flex flex-col gap-1 px-4 py-3"><span className="text-xs text-muted-foreground">{label}</span><span className="text-lg font-semibold tabular-nums">{value}</span></CardContent></Card>
}

function MarketListCard({ title, rows, forming = false }: { title: string; rows: Row[]; forming?: boolean }) {
  const { locale } = useI18n(); const it = locale === "it"
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}<Badge variant="secondary" className="ml-2">{rows.length}</Badge></CardTitle></CardHeader>
      <CardContent className="flex flex-col gap-0.5">
        {rows.length === 0 ? <p className="px-2 py-4 text-sm text-muted-foreground">{it ? "Nessuna Release in questo stato." : "No Releases in this state."}</p> : rows.map((row) => <MarketRow key={row.release.id} row={row} forming={forming} />)}
      </CardContent>
    </Card>
  )
}

function MarketRow({ row, forming }: { row: Row; forming: boolean }) {
  const { locale } = useI18n(); const it = locale === "it"
  const href = `/catalog/${row.product.id}/releases/${row.release.id}`
  return (
    <Link href={href} className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-accent">
      <ProductImage product={row.product} release={row.release} size="sm" className="h-12 w-16 shrink-0" />
      <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{row.release.editionName}</p><div className="mt-0.5 flex flex-wrap items-center gap-1.5"><span className="text-xs text-muted-foreground">#{row.release.itemNumber ?? "—"}</span>{row.release.rarity ? <RarityBadge rarity={row.release.rarity} /> : null}</div></div>
      <div className="max-w-40 text-right">
        {forming ? <p className="text-xs font-medium">{it ? "Non consolidato" : "Not consolidated"}</p> : <p className="text-sm font-semibold tabular-nums">{formatMoney(row.signal.valueEUR!)}</p>}
        {row.signal.trendPercent != null ? <TrendIndicator value={row.signal.trendPercent} className="justify-end text-xs" /> : null}
        {row.signal.startingItemPriceEUR != null ? <p className="text-[11px] text-muted-foreground">{it ? "Da" : "From"} {formatMoney(row.signal.startingItemPriceEUR)}</p> : null}
      </div>
    </Link>
  )
}

function TrendCard({ title, rows, icon: Icon }: { title: string; rows: Row[]; icon: React.ComponentType<{ className?: string }>; }) {
  return <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Icon className="size-4" />{title}</CardTitle></CardHeader><CardContent className="flex flex-col gap-0.5">{rows.length === 0 ? <p className="px-2 py-4 text-sm text-muted-foreground">—</p> : rows.map((row) => <MarketRow key={row.release.id} row={row} forming={false} />)}</CardContent></Card>
}
