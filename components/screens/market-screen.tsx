"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowDownRight, ArrowUpRight, Crown, Info, TrendingUp } from "lucide-react"
import { PRODUCTS } from "@/lib/data/products"
import { getProductEstimate } from "@/lib/data/market"
import { formatMoney } from "@/lib/format"
import type { MarketEstimate, Product } from "@/lib/types"
import { ProductArt } from "@/components/product-art"
import { RarityBadge, TrendIndicator } from "@/components/market-bits"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Row {
  product: Product
  estimate: MarketEstimate
}

export function MarketScreen() {
  const rows = React.useMemo<Row[]>(
    () => PRODUCTS.map((product) => ({ product, estimate: getProductEstimate(product) })),
    [],
  )

  const gainers = React.useMemo(
    () => [...rows].sort((a, b) => b.estimate.trend90d - a.estimate.trend90d).slice(0, 8),
    [rows],
  )
  const fallers = React.useMemo(
    () => [...rows].sort((a, b) => a.estimate.trend90d - b.estimate.trend90d).slice(0, 8),
    [rows],
  )
  const grails = React.useMemo(
    () =>
      [...rows]
        .filter((r) => r.product.rarity === "Grail" || r.product.rarity === "Very Rare")
        .sort((a, b) => b.estimate.value - a.estimate.value)
        .slice(0, 8),
    [rows],
  )

  const avgTrend = Math.round(rows.reduce((s, r) => s + r.estimate.trend90d, 0) / rows.length)
  const totalTracked = rows.length
  const risingCount = rows.filter((r) => r.estimate.direction === "rising").length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Market</h1>
        <p className="text-sm text-muted-foreground">
          Indicative price movement across the catalog, ranked by 90-day trend.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MiniStat label="Models tracked" value={String(totalTracked)} />
        <MiniStat label="Market trend (90d)" value={<TrendIndicator value={avgTrend} showIcon={false} />} />
        <MiniStat label="Rising now" value={`${risingCount}`} />
        <MiniStat label="Grails listed" value={String(rows.filter((r) => r.product.rarity === "Grail").length)} />
      </div>

      <Alert>
        <Info />
        <AlertTitle>Demo market data</AlertTitle>
        <AlertDescription>
          These are transparent, generated estimates for demonstration — not appraisals or offers. A production build
          sources sold listings and active asks with a clear confidence signal.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="gainers">
        <TabsList>
          <TabsTrigger value="gainers">
            <TrendingUp data-icon="inline-start" />
            Movers
          </TabsTrigger>
          <TabsTrigger value="grails">
            <Crown data-icon="inline-start" />
            Grails
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gainers" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <MoverCard title="Top gainers" icon={ArrowUpRight} rows={gainers} tone="up" />
            <MoverCard title="Biggest fallers" icon={ArrowDownRight} rows={fallers} tone="down" />
          </div>
        </TabsContent>

        <TabsContent value="grails" className="mt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {grails.map((r) => (
              <Link
                key={r.product.id}
                href={`/catalog/${r.product.id}`}
                className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-accent"
              >
                <ProductArt product={r.product} size="sm" className="h-16 w-24 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.product.name}</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <RarityBadge rarity={r.product.rarity} />
                    <Badge variant="outline" className="text-xs">
                      orig. {r.product.originalReleaseYear}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums">{formatMoney(r.estimate.value)}</p>
                  <TrendIndicator value={r.estimate.trend90d} className="justify-end text-xs" />
                </div>
              </Link>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card className="py-0">
      <CardContent className="flex flex-col gap-1 px-4 py-3">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-lg font-semibold tabular-nums">{value}</span>
      </CardContent>
    </Card>
  )
}

function MoverCard({
  title,
  icon: Icon,
  rows,
  tone,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  rows: Row[]
  tone: "up" | "down"
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className={tone === "up" ? "size-4 text-success" : "size-4 text-destructive"} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-0.5">
        {rows.map((r, i) => (
          <Link
            key={r.product.id}
            href={`/catalog/${r.product.id}`}
            className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-accent"
          >
            <span className="w-4 text-center font-mono text-xs text-muted-foreground">{i + 1}</span>
            <ProductArt product={r.product} size="sm" className="h-9 w-14 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{r.product.name}</p>
              <p className="truncate text-xs text-muted-foreground">{r.product.chassis}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold tabular-nums">{formatMoney(r.estimate.value)}</p>
              <TrendIndicator value={r.estimate.trend90d} className="justify-end text-xs" />
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
