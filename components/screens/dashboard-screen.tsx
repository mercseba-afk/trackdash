"use client"

import * as React from "react"
import Link from "next/link"
import { Boxes, Coins, Layers, TrendingUp, ArrowRight, Heart, Sparkles } from "lucide-react"
import { useStore } from "@/lib/store"
import { useI18n } from "@/lib/i18n"
import { useMarketSignals } from "@/lib/market/context"
import {
  enrichCollection,
  enrichWishlist,
  portfolioSummary,
  recentAdditions,
  topValued,
} from "@/lib/analytics"
import { formatMoney } from "@/lib/format"
import { StatCard } from "@/components/stat-card"
import { ProductImage } from "@/components/catalog/product-image"
import { DashboardMarketOverview } from "@/components/dashboard-market-overview"
import { RarityBadge, TrendIndicator } from "@/components/market-bits"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"

export function DashboardScreen() {
  const { collection, wishlist, user } = useStore()
  const { locale, t } = useI18n()
  const it = locale === "it"
  const marketSignals = useMarketSignals()

  const enriched = React.useMemo(() => enrichCollection(collection, marketSignals), [collection, marketSignals])
  const summary = React.useMemo(() => portfolioSummary(enriched), [enriched])
  const wl = React.useMemo(() => enrichWishlist(wishlist, marketSignals), [wishlist, marketSignals])
  const recent = React.useMemo(() => recentAdditions(enriched, 4), [enriched])
  const top = React.useMemo(() => topValued(enriched, 5), [enriched])

  if (collection.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <Header username={user?.username} />
        <DashboardMarketOverview />
        <Empty className="rounded-lg border border-dashed border-border py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon"><Boxes /></EmptyMedia>
            <EmptyTitle>{t("dashboard.emptyTitle")}</EmptyTitle>
            <EmptyDescription>{t("dashboard.emptyDesc")}</EmptyDescription>
          </EmptyHeader>
          <div className="flex justify-center gap-2">
            <Button render={<Link href="/catalog" />}>{t("dashboard.browse")}</Button>
            <Button variant="outline" render={<Link href="/scanner" />}>{t("dashboard.scan")}</Button>
          </div>
        </Empty>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Header username={user?.username} />
      <DashboardMarketOverview />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("dashboard.collectionValue")} value={summary.marketValueCount > 0 ? formatMoney(summary.marketValue) : "—"} icon={Coins} accent hint={<span>{summary.marketValueCount}/{summary.count} {it ? "con Valore stimato" : "with an Estimated value"}</span>} />
        <StatCard label={t("dashboard.gain")} value={summary.gainCount > 0 ? formatMoney(summary.gain) : "—"} icon={TrendingUp} hint={summary.gainCount > 0 ? <TrendIndicator value={summary.gainPercent} className="text-xs" /> : <span>{it ? "Rendimento EUR non disponibile" : "EUR performance unavailable"}</span>} />
        <StatCard label={t("dashboard.unique")} value={summary.uniqueProducts} icon={Layers} hint={<span>{t("dashboard.sealed", { count: summary.sealedCount })}</span>} />
        <StatCard label={t("dashboard.trend")} value={summary.avgTrend90d != null ? <TrendIndicator value={summary.avgTrend90d} showIcon={false} /> : "—"} icon={TrendingUp} hint={summary.trendCount > 0 ? t("dashboard.avgHoldings") : (it ? "Trend di mercato in arrivo" : "Market trend coming soon")} />
      </div>

      {summary.marketValueCount < summary.count || summary.gainCount < summary.marketValueCount ? (
        <p className="text-xs leading-relaxed text-muted-foreground">
          {it
            ? "Valori e rendimenti vengono mostrati solo quando TrackDash dispone di dati di mercato affidabili e compatibili con la condizione dei tuoi pezzi."
            : "Values and performance are shown only when TrackDash has reliable market data compatible with the condition of your items."}
        </p>
      ) : null}

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-base">{t("dashboard.mostValuable")}</CardTitle>
          <Button variant="ghost" size="sm" render={<Link href="/collection" />}>{t("dashboard.viewAll")} <ArrowRight /></Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {top.length === 0 ? (
            <p className="px-2 py-4 text-sm text-muted-foreground">{it ? "Nessun elemento della collezione ha ancora un Valore stimato disponibile." : "No collection item has an Estimated value available yet."}</p>
          ) : top.map((entry, index) => (
            <Link key={entry.item.id} href={`/catalog/${entry.product.id}/releases/${entry.release.id}`} className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-accent">
              <span className="w-4 text-center font-mono text-xs text-muted-foreground">{index + 1}</span>
              <ProductImage product={entry.product} release={entry.release} size="sm" className="h-9 w-14 shrink-0" />
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{entry.product.name}</p><p className="truncate text-xs text-muted-foreground">{entry.label} · {entry.item.condition}</p></div>
              <div className="text-right"><p className="text-sm font-semibold tabular-nums">{formatMoney(entry.marketValue!)}</p>{entry.marketTrend != null ? <TrendIndicator value={entry.marketTrend} className="justify-end text-xs" /> : null}</div>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base"><Sparkles className="size-4 text-brand" /> {t("dashboard.recent")}</CardTitle>
          <Button variant="ghost" size="sm" render={<Link href="/collection" />}>{t("dashboard.viewAll")} <ArrowRight /></Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {recent.map((entry) => (
              <Link key={entry.item.id} href={`/catalog/${entry.product.id}/releases/${entry.release.id}`} className="group flex flex-col gap-1.5">
                <ProductImage product={entry.product} release={entry.release} className="aspect-[4/3] w-full" />
                <p className="truncate text-xs font-medium group-hover:text-brand">{entry.product.name}</p>
                {entry.marketValue != null ? <p className="text-xs font-semibold tabular-nums">{formatMoney(entry.marketValue)}</p> : <p className="text-[11px] text-muted-foreground">{it ? "Dati di mercato in arrivo" : "Market data coming soon"}</p>}
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base"><Heart className="size-4 text-brand" /> {t("dashboard.wishlistWatch")}</CardTitle>
          <Button variant="ghost" size="sm" render={<Link href="/wishlist" />}>{t("dashboard.manage")} <ArrowRight /></Button>
        </CardHeader>
        <CardContent>
          {wl.length === 0 ? <p className="text-sm text-muted-foreground">{t("dashboard.noWishlist")}</p> : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {wl.slice(0, 3).map((entry) => (
                <Link key={entry.item.id} href={entry.release ? `/catalog/${entry.product.id}/releases/${entry.release.id}` : `/catalog/${entry.product.id}`} className="flex items-center gap-3 rounded-lg border border-border p-2 hover:bg-accent">
                  <ProductImage product={entry.product} release={entry.release} size="sm" className="h-12 w-16 shrink-0" />
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{entry.product.name}</p><div className="mt-1 flex items-center gap-1.5"><RarityBadge rarity={entry.release?.rarity ?? entry.product.rarity} />{entry.belowTarget && <Badge className="bg-success text-white">{t("dashboard.target")}</Badge>}</div></div>
                  <div className="text-right">{entry.marketValue != null ? <p className="text-sm font-semibold tabular-nums">{formatMoney(entry.marketValue)}</p> : entry.currentPrice != null ? <p className="text-sm font-semibold tabular-nums">{it ? "Da " : "From "}{formatMoney(entry.currentPrice)}</p> : <p className="text-xs text-muted-foreground">—</p>}{entry.item.targetPrice && <p className="text-xs text-muted-foreground">{t("wishlist.target")} {formatMoney(entry.item.targetPrice)}</p>}</div>
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
  const { t } = useI18n()
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-semibold tracking-tight text-balance">{t("dashboard.welcome", { user: username ? `, ${username}` : "" })}</h1>
      <p className="text-sm text-muted-foreground">{t("dashboard.subtitle")}</p>
    </div>
  )
}
