"use client"

import * as React from "react"
import Link from "next/link"
import { Boxes, Coins, Layers, TrendingUp, Trophy, ArrowRight, Heart, Sparkles } from "lucide-react"
import { useStore } from "@/lib/store"
import { useI18n } from "@/lib/i18n"
import { useMarketSignals } from "@/lib/market/context"
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
import { ProductImage } from "@/components/catalog/product-image"
import { RarityBadge, TrendIndicator } from "@/components/market-bits"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
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
  const byChassis = React.useMemo(() => breakdownBy(enriched, (entry) => entry.product.chassis ?? "Unknown").filter((bucket) => bucket.valuedCount > 0).slice(0, 6), [enriched])

  const level = collectorLevel(summary.count)
  const catalogProgress = Math.min(100, Math.round((summary.uniqueProducts / CATALOG_TARGET) * 100))
  const maxChassisValue = Math.max(1, ...byChassis.map((bucket) => bucket.value))

  if (collection.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <Header username={user?.username} />
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

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("dashboard.collectionValue")} value={summary.marketValueCount > 0 ? formatMoney(summary.marketValue) : "—"} icon={Coins} accent hint={<span>{summary.marketValueCount}/{summary.count} {it ? "valorizzati R3" : "valued by R3"}</span>} />
        <StatCard label={t("dashboard.gain")} value={summary.marketValueCount > 0 ? formatMoney(summary.gain) : "—"} icon={TrendingUp} hint={summary.marketValueCount > 0 ? <TrendIndicator value={summary.gainPercent} className="text-xs" /> : <span>{it ? "Dati reali insufficienti" : "Insufficient real data"}</span>} />
        <StatCard label={t("dashboard.unique")} value={summary.uniqueProducts} icon={Layers} hint={<span>{t("dashboard.sealed", { count: summary.sealedCount })}</span>} />
        <StatCard label={t("dashboard.trend")} value={summary.avgTrend90d != null ? <TrendIndicator value={summary.avgTrend90d} showIcon={false} /> : "—"} icon={TrendingUp} hint={summary.trendCount > 0 ? t("dashboard.avgHoldings") : (it ? "Nessun trend vendite ancora consolidato" : "No consolidated sales trend yet")} />
      </div>

      {summary.marketValueCount < summary.count ? (
        <p className="text-xs leading-relaxed text-muted-foreground">
          {it
            ? "Valore e rendimento usano esclusivamente segnali R3 reali compatibili con kit nuovi/completi/non montati. Le altre condizioni non ricevono stime artificiali."
            : "Value and performance use only real R3 signals compatible with new/complete/unbuilt kits. Other conditions receive no synthetic estimates."}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Trophy className="size-4 text-brand" /> {t("dashboard.level")}</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-semibold">{level.level}</span>
              <Badge variant="secondary">{t("dashboard.items", { count: summary.count })}</Badge>
            </div>
            {level.next ? (
              <div className="flex flex-col gap-2">
                <Progress value={level.progress} />
                <p className="text-xs text-muted-foreground">
                  {t("dashboard.moreItems", {
                    count: level.toNext,
                    itemWord: locale === "it" ? (level.toNext === 1 ? "pezzo" : "pezzi") : (level.toNext === 1 ? "item" : "items"),
                    level: level.next,
                  })}
                </p>
              </div>
            ) : <p className="text-xs text-muted-foreground">{t("dashboard.topLevel")}</p>}
            <div className="flex flex-col gap-2 border-t border-border pt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{t("dashboard.completion")}</span>
                <span className="font-medium tabular-nums">{summary.uniqueProducts}/{CATALOG_TARGET}</span>
              </div>
              <Progress value={catalogProgress} />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-base">{t("dashboard.mostValuable")}</CardTitle>
            <Button variant="ghost" size="sm" render={<Link href="/collection" />}>{t("dashboard.viewAll")} <ArrowRight /></Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {top.length === 0 ? (
              <p className="px-2 py-4 text-sm text-muted-foreground">{it ? "Nessun elemento della collezione ha ancora un valore R3 consolidato compatibile con la sua condizione." : "No collection item has a consolidated R3 value compatible with its condition yet."}</p>
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
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Sparkles className="size-4 text-brand" /> {t("dashboard.recent")}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {recent.map((entry) => (
                <Link key={entry.item.id} href={`/catalog/${entry.product.id}/releases/${entry.release.id}`} className="group flex flex-col gap-1.5">
                  <ProductImage product={entry.product} release={entry.release} className="aspect-[4/3] w-full" />
                  <p className="truncate text-xs font-medium group-hover:text-brand">{entry.product.name}</p>
                  {entry.marketValue != null ? <p className="text-xs font-semibold tabular-nums">{formatMoney(entry.marketValue)}</p> : <p className="text-[11px] text-muted-foreground">{it ? "Valore R3 non disponibile" : "R3 value unavailable"}</p>}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">{t("dashboard.valueChassis")}</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-2.5">
            {byChassis.length === 0 ? <p className="text-sm text-muted-foreground">{it ? "Dati R3 insufficienti per il confronto." : "Insufficient R3 data for comparison."}</p> : byChassis.map((bucket) => (
              <div key={bucket.label} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs"><span className="font-medium">{bucket.label}</span><span className="tabular-nums text-muted-foreground">{formatMoney(bucket.value)}</span></div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-brand" style={{ width: `${(bucket.value / maxChassisValue) * 100}%` }} /></div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

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
