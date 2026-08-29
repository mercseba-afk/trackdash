"use client"

import * as React from "react"
import Link from "next/link"
import { Boxes, Coins, Layers, TrendingUp, Trophy, ArrowRight, Heart, Sparkles } from "lucide-react"
import { useStore } from "@/lib/store"
import {
  breakdownBy,
  enrichCollection,
  enrichWishlist,
  portfolioSummary,
  recentAdditions,
  topValued,
} from "@/lib/analytics"
import { CATALOG_TARGET } from "@/lib/data/products"
import { collectorLevel, formatMoney } from "@/lib/format"
import { StatCard } from "@/components/stat-card"
import { ProductArt } from "@/components/product-art"
import { RarityBadge, TrendIndicator } from "@/components/market-bits"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"

export function DashboardScreen() {
  const { collection, wishlist, user } = useStore()

  const enriched = React.useMemo(() => enrichCollection(collection), [collection])
  const summary = React.useMemo(() => portfolioSummary(enriched), [enriched])
  const wl = React.useMemo(() => enrichWishlist(wishlist), [wishlist])
  const recent = React.useMemo(() => recentAdditions(enriched, 4), [enriched])
  const top = React.useMemo(() => topValued(enriched, 5), [enriched])
  const byChassis = React.useMemo(() => breakdownBy(enriched, (e) => e.product.chassis).slice(0, 6), [enriched])

  const level = collectorLevel(summary.count)
  const catalogProgress = Math.min(100, Math.round((summary.uniqueProducts / CATALOG_TARGET) * 100))
  const maxChassisValue = Math.max(1, ...byChassis.map((b) => b.value))

  if (collection.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <Header username={user?.username} />
        <Empty className="rounded-lg border border-dashed border-border py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Boxes />
            </EmptyMedia>
            <EmptyTitle>Your garage is empty</EmptyTitle>
            <EmptyDescription>
              Add your first model from the catalog or the scanner to start tracking value.
            </EmptyDescription>
          </EmptyHeader>
          <div className="flex justify-center gap-2">
            <Button render={<Link href="/catalog" />}>Browse catalog</Button>
            <Button variant="outline" render={<Link href="/scanner" />}>
              Scan a box
            </Button>
          </div>
        </Empty>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Header username={user?.username} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Collection value"
          value={formatMoney(summary.marketValue)}
          icon={Coins}
          accent
          hint={<span>Demo estimate · {summary.count} items</span>}
        />
        <StatCard
          label="Unrealised gain"
          value={formatMoney(summary.gain)}
          icon={TrendingUp}
          hint={<TrendIndicator value={summary.gainPercent} className="text-xs" />}
        />
        <StatCard
          label="Unique models"
          value={summary.uniqueProducts}
          icon={Layers}
          hint={<span>{summary.sealedCount} sealed</span>}
        />
        <StatCard
          label="90-day trend"
          value={<TrendIndicator value={summary.avgTrend90d} showIcon={false} />}
          icon={TrendingUp}
          hint="Avg. across holdings"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Collector level */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="size-4 text-brand" /> Collector level
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-semibold">{level.level}</span>
              <Badge variant="secondary">{summary.count} items</Badge>
            </div>
            {level.next ? (
              <div className="flex flex-col gap-2">
                <Progress value={level.progress} />
                <p className="text-xs text-muted-foreground">
                  {level.toNext} more {level.toNext === 1 ? "item" : "items"} to reach{" "}
                  <span className="font-medium text-foreground">{level.next}</span>
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Top level reached. Legendary shelf.</p>
            )}
            <div className="flex flex-col gap-2 border-t border-border pt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Catalog completion</span>
                <span className="font-medium tabular-nums">
                  {summary.uniqueProducts}/{CATALOG_TARGET}
                </span>
              </div>
              <Progress value={catalogProgress} />
            </div>
          </CardContent>
        </Card>

        {/* Top valued */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-base">Most valuable</CardTitle>
            <Button variant="ghost" size="sm" render={<Link href="/collection" />}>
              View all <ArrowRight />
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {top.map((e, i) => (
              <Link
                key={e.item.id}
                href={`/catalog/${e.product.id}`}
                className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-accent"
              >
                <span className="w-4 text-center font-mono text-xs text-muted-foreground">{i + 1}</span>
                <ProductArt product={e.product} release={e.release} size="sm" className="h-9 w-14 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{e.product.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {e.label} · {e.item.condition}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums">{formatMoney(e.estimate.value)}</p>
                  <TrendIndicator value={e.estimate.trend90d} className="justify-end text-xs" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent additions */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4 text-brand" /> Recent additions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {recent.map((e) => (
                <Link key={e.item.id} href={`/catalog/${e.product.id}`} className="group flex flex-col gap-1.5">
                  <ProductArt product={e.product} className="aspect-[4/3] w-full" />
                  <p className="truncate text-xs font-medium group-hover:text-brand">{e.product.name}</p>
                  <p className="text-xs font-semibold tabular-nums">{formatMoney(e.estimate.value)}</p>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chassis breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Value by chassis</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5">
            {byChassis.map((b) => (
              <div key={b.label} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{b.label}</span>
                  <span className="tabular-nums text-muted-foreground">{formatMoney(b.value)}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${(b.value / maxChassisValue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Wishlist watch */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Heart className="size-4 text-brand" /> Wishlist watch
          </CardTitle>
          <Button variant="ghost" size="sm" render={<Link href="/wishlist" />}>
            Manage <ArrowRight />
          </Button>
        </CardHeader>
        <CardContent>
          {wl.length === 0 ? (
            <p className="text-sm text-muted-foreground">No models on your wishlist yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {wl.slice(0, 3).map((e) => (
                <Link
                  key={e.item.id}
                  href={`/catalog/${e.product.id}`}
                  className="flex items-center gap-3 rounded-lg border border-border p-2 hover:bg-accent"
                >
                  <ProductArt product={e.product} size="sm" className="h-12 w-16 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{e.product.name}</p>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <RarityBadge rarity={e.product.rarity} />
                      {e.belowTarget && (
                        <Badge className="bg-success text-white">At target</Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums">{formatMoney(e.estimate.value)}</p>
                    {e.item.targetPrice && (
                      <p className="text-xs text-muted-foreground">target {formatMoney(e.item.targetPrice)}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Header({ username }: { username?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-semibold tracking-tight text-balance">
        Welcome back{username ? `, ${username}` : ""}
      </h1>
      <p className="text-sm text-muted-foreground">
        Here&apos;s how your Mini 4WD collection is doing today.
      </p>
    </div>
  )
}
