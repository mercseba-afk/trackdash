"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowRight,
  Boxes,
  Heart,
  ScanLine,
  Sparkles,
  TrendingUp,
  Trophy,
} from "lucide-react"
import { useStore } from "@/lib/store"
import {
  enrichCollection,
  enrichWishlist,
  portfolioSummary,
  recentAdditions,
  topValued,
} from "@/lib/analytics"
import { collectorLevel, formatMoney, formatDate } from "@/lib/format"
import { CATALOG_TARGET } from "@/lib/data/products"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { MarketValue, TrendPill } from "@/components/market-value"
import { ProductPlate } from "@/components/product-plate"

export default function DashboardPage() {
  const { collection, wishlist, user, hydrated } = useStore()

  const enriched = React.useMemo(() => enrichCollection(collection), [collection])
  const enrichedWishlist = React.useMemo(() => enrichWishlist(wishlist), [wishlist])
  const summary = React.useMemo(() => portfolioSummary(enriched), [enriched])
  const top = React.useMemo(() => topValued(enriched, 4), [enriched])
  const recent = React.useMemo(() => recentAdditions(enriched, 4), [enriched])
  const level = collectorLevel(summary.count)
  const deals = enrichedWishlist.filter((w) => w.belowTarget).length

  if (!hydrated) return <DashboardSkeleton />

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            Welcome back{user ? `, ${user.username}` : ""}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Your garage</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href="/browse" />}>
            <Sparkles data-icon="inline-start" />
            Browse catalog
          </Button>
          <Button render={<Link href="/add" />}>
            <ScanLine data-icon="inline-start" />
            Add a model
          </Button>
        </div>
      </div>

      {/* Portfolio hero */}
      <Card className="overflow-hidden">
        <div className="grid gap-0 md:grid-cols-[1.3fr_1fr]">
          <div className="flex flex-col gap-4 p-5">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Estimated collection value
              </p>
              <div className="mt-1 flex items-center gap-3">
                <span className="font-mono text-4xl font-semibold tabular-nums">
                  {formatMoney(summary.marketValue)}
                </span>
                <TrendPill value={summary.avgTrend90d} className="text-sm" />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Demo market data · updated August 2026
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <MiniStat label="Models" value={String(summary.count)} />
              <MiniStat label="Unique" value={String(summary.uniqueProducts)} />
              <MiniStat label="Sealed" value={String(summary.sealedCount)} />
            </div>

            <Separator />

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Invested</span>
              <span className="font-mono tabular-nums">{formatMoney(summary.acquisitionCost)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Unrealized gain</span>
              <span
                className={
                  summary.gain >= 0
                    ? "font-mono tabular-nums text-success"
                    : "font-mono tabular-nums text-destructive"
                }
              >
                {summary.gain >= 0 ? "+" : ""}
                {formatMoney(summary.gain)} ({summary.gainPercent >= 0 ? "+" : ""}
                {summary.gainPercent}%)
              </span>
            </div>
          </div>

          {/* Collector level */}
          <div className="flex flex-col justify-between gap-4 border-t bg-muted/40 p-5 md:border-l md:border-t-0">
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
                <Trophy className="size-5" />
              </span>
              <div>
                <p className="text-xs text-muted-foreground">Collector level</p>
                <p className="text-lg font-semibold">{level.level}</p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{level.next ? `Next: ${level.next}` : "Max level reached"}</span>
                {level.next && <span>{level.toNext} to go</span>}
              </div>
              <Progress value={level.progress} />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Catalog completion</span>
                <span>
                  {summary.uniqueProducts}/{CATALOG_TARGET}
                </span>
              </div>
              <Progress value={(summary.uniqueProducts / CATALOG_TARGET) * 100} />
            </div>
          </div>
        </div>
      </Card>

      {/* Quick links */}
      <div className="grid gap-3 sm:grid-cols-3">
        <QuickLink
          href="/collection"
          icon={Boxes}
          title="My Collection"
          desc={`${summary.count} models logged`}
        />
        <QuickLink
          href="/wishlist"
          icon={Heart}
          title="Wishlist"
          desc={deals > 0 ? `${deals} at/under target` : `${wishlist.length} tracked`}
          highlight={deals > 0}
        />
        <QuickLink href="/insights" icon={TrendingUp} title="Insights" desc="Value & trends" />
      </div>

      {/* Top valued + recent */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Most valuable</h2>
            <Link href="/collection" className="text-xs text-muted-foreground hover:text-foreground">
              View all
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {top.map((e) => (
              <Link
                key={e.item.id}
                href={`/product/${e.product.id}`}
                className="flex items-center gap-3 rounded-lg bg-card p-2 ring-1 ring-foreground/10 hover:ring-foreground/20"
              >
                <div className="w-16 shrink-0 overflow-hidden rounded-md">
                  <ProductPlate product={e.product} size="sm" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{e.product.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {e.variantName ?? e.product.chassis} · {e.item.condition}
                  </p>
                </div>
                <MarketValue estimate={e.estimate} size="sm" showTrend={false} />
              </Link>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recently added</h2>
            <Link href="/collection" className="text-xs text-muted-foreground hover:text-foreground">
              View all
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {recent.map((e) => (
              <Link
                key={e.item.id}
                href={`/product/${e.product.id}`}
                className="flex items-center gap-3 rounded-lg bg-card p-2 ring-1 ring-foreground/10 hover:ring-foreground/20"
              >
                <div className="w-16 shrink-0 overflow-hidden rounded-md">
                  <ProductPlate product={e.product} size="sm" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{e.product.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    Added {formatDate(e.item.createdAt)}
                  </p>
                </div>
                <Badge variant="secondary">{e.item.condition}</Badge>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-2.5">
      <p className="font-mono text-xl font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function QuickLink({
  href,
  icon: Icon,
  title,
  desc,
  highlight,
}: {
  href: string
  icon: React.ElementType
  title: string
  desc: string
  highlight?: boolean
}) {
  return (
    <Link href={href}>
      <Card className="transition-shadow hover:ring-foreground/20">
        <CardContent className="flex items-center gap-3">
          <span
            className={
              highlight
                ? "flex size-10 items-center justify-center rounded-lg bg-brand/10 text-brand"
                : "flex size-10 items-center justify-center rounded-lg bg-muted text-foreground"
            }
          >
            <Icon className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{title}</p>
            <p className="truncate text-xs text-muted-foreground">{desc}</p>
          </div>
          <ArrowRight className="size-4 text-muted-foreground" />
        </CardContent>
      </Card>
    </Link>
  )
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-64 w-full rounded-xl" />
      <div className="grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
    </div>
  )
}
