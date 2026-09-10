"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft, Check, ChevronDown, Handshake, Heart, Info, Plus, UsersRound } from "lucide-react"
import { primaryRelease } from "@/lib/data/products"
import { getReleaseEstimate } from "@/lib/data/market"
import { getReleaseCommunityCountsAction } from "@/lib/actions/sharing"
import { useStore } from "@/lib/store"
import { useI18n } from "@/lib/i18n"
import { enrichCollection, itemsForProduct } from "@/lib/analytics"
import { formatMoney, formatDate } from "@/lib/format"
import type { Product, ProductRelease } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProductImage } from "@/components/catalog/product-image"
import { ProductCard } from "@/components/product-card"
import { MarketEstimateCard, RarityBadge, TrendIndicator } from "@/components/market-bits"
import { AddToCollectionDialog, AddToWishlistDialog } from "@/components/add-item-dialogs"
import { cn } from "@/lib/utils"

type CommunityCount = { collectors: number; openToOffers: number }

export function ProductDetailScreen({
  product,
  related,
  descriptionIt,
}: {
  product: Product
  related: Product[]
  descriptionIt?: string | null
}) {
  const { collection, isInWishlist } = useStore()
  const { locale, t } = useI18n()
  const [communityByRelease, setCommunityByRelease] = React.useState<Map<string, CommunityCount>>(new Map())

  const primary = primaryRelease(product)
  const sortedReleases = React.useMemo(() => sortReleasesForDisplay(product.releases), [product.releases])
  const owned = enrichCollection(collection)
  const mine = itemsForProduct(owned, product.id)
  const wished = isInWishlist(product.id)
  const publicDescription = locale === "it" && descriptionIt ? descriptionIt : product.description

  React.useEffect(() => {
    let cancelled = false
    getReleaseCommunityCountsAction(product.id)
      .then((rows) => {
        if (cancelled) return
        setCommunityByRelease(new Map(rows.map((row) => [row.releaseId, { collectors: row.collectors, openToOffers: row.openToOffers }])))
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [product.id])

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" render={<Link href="/catalog" />} className="-ml-2 w-fit text-muted-foreground">
        <ArrowLeft data-icon="inline-start" /> {t("product.back")}
      </Button>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col gap-4"><ProductImage product={product} className="aspect-[4/3] w-full rounded-xl border" size="lg" /></div>
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2"><Badge variant="secondary">{product.series}</Badge></div>
            <h1 className="text-2xl font-semibold tracking-tight text-balance md:text-3xl">{product.name}</h1>
            {product.japaneseName && <p className="-mt-1 text-sm text-muted-foreground">{product.japaneseName}</p>}
            {publicDescription ? <p className="leading-relaxed text-muted-foreground text-pretty">{publicDescription}</p> : null}
            <Link href="#releases" className="group inline-flex w-fit items-center gap-2 rounded-lg border border-brand/25 bg-brand/5 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-brand/10">
              <span className="font-semibold text-brand">{product.releases.length}</span>
              <span>{locale === "it" ? "Release ed edizioni" : product.releases.length === 1 ? "Release" : "Releases & editions"}</span>
              <ChevronDown className="size-4 text-brand transition-transform group-hover:translate-y-0.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-lg border bg-card p-4 text-sm">
            <Spec label={t("product.firstReleased")} value={product.originalReleaseYear ? String(product.originalReleaseYear) : "—"} />
            <Spec label={t("product.chassisOriginal")} value={product.chassis ?? "—"} />
            <Spec label={t("product.itemOriginal")} value={primary.itemNumber ? `#${primary.itemNumber}` : "—"} />
            <Spec label={t("product.series")} value={product.series} />
          </div>

          <div className="flex flex-wrap gap-2">
            <AddToCollectionDialog product={product}><Button className="gap-1.5"><Plus className="size-4" /> {t("product.addCollection")}</Button></AddToCollectionDialog>
            <AddToWishlistDialog product={product}><Button variant="outline" className={cn("gap-1.5", wished && "border-brand text-brand")}><Heart className={cn("size-4", wished && "fill-brand")} /> {wished ? t("product.onWishlist") : t("product.wishlist")}</Button></AddToWishlistDialog>
          </div>

          {mine.length > 0 && <div className="rounded-lg border border-success/40 bg-success/5 px-3 py-2 text-sm text-success"><Check className="mr-1 inline size-4" />{t(mine.length === 1 ? "product.ownOne" : "product.ownMany", { count: mine.length })}</div>}
        </div>
      </div>

      <section id="releases" className="scroll-mt-20">
        <Card>
          <CardHeader className="gap-1.5">
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">{t("product.releasesTitle")}<Badge variant="secondary">{product.releases.length}</Badge></CardTitle>
            <p className="text-sm text-muted-foreground">{t("product.releasesDesc")}</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {sortedReleases.map((r) => <ReleaseRow key={r.id} product={product} release={r} owned={mine.some((m) => m.release.id === r.id)} community={communityByRelease.get(r.id)} />)}
          </CardContent>
        </Card>
      </section>

      {mine.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">{locale === "it" ? "La tua collezione" : "Your collection"}</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-2">
            {mine.map((m) => (
              <div key={m.item.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <div className="flex items-center gap-3"><ProductImage product={m.product} release={m.release} className="size-10 rounded-md" size="sm" /><div><p className="font-medium">{m.label}</p><p className="text-xs text-muted-foreground">{m.item.condition} · {m.release.itemNumber ? `#${m.release.itemNumber}` : "—"} · {locale === "it" ? "acquisito" : "acquired"} {formatDate(m.item.acquisitionDate)}</p></div></div>
                <div className="text-right">
                  {m.estimate.isDemo ? (
                    <p className="max-w-28 text-[11px] leading-tight text-muted-foreground">{locale === "it" ? "Dati mercato in arrivo" : "Market data coming soon"}</p>
                  ) : (
                    <><p className="font-semibold tabular-nums">{formatMoney(m.estimate.value)}</p><TrendIndicator value={m.estimate.trend90d} className="justify-end text-xs" /></>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <MarketEstimateCard estimate={getReleaseEstimate(product, primary)} title={t("product.marketOriginal")} msrp={product.msrpEUR} />
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Info className="size-4 text-muted-foreground" /> {t("product.howValue")}</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground"><p>{t("product.valueText1")}</p><p>{t("product.valueText2")}</p></CardContent>
        </Card>
      </div>

      {related.length > 0 && <section className="flex flex-col gap-4 pt-2"><h2 className="text-lg font-semibold tracking-tight">{t("product.related")}</h2><div className="grid grid-cols-2 gap-4 md:grid-cols-4">{related.map((p) => <ProductCard key={p.id} product={p} />)}</div></section>}
    </div>
  )
}

function ReleaseRow({ product, release, owned, community }: { product: Product; release: ProductRelease; owned: boolean; community?: CommunityCount }) {
  const { locale, t } = useI18n()
  const estimate = getReleaseEstimate(product, release)
  const releaseHref = `/catalog/${product.id}/releases/${release.id}`
  const collectorsHref = `${releaseHref}#collectors`
  return (
    <div className="rounded-xl border border-border bg-background p-3 sm:p-4">
      <div className="grid grid-cols-[minmax(112px,36%)_minmax(0,1fr)] gap-x-3 gap-y-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:gap-x-4">
        <Link href={releaseHref} className="block shrink-0 sm:row-span-2"><ProductImage product={product} release={release} className="aspect-[4/3] h-full min-h-24 w-full max-h-32 rounded-lg sm:h-24 sm:min-h-0 sm:w-32" size="md" /></Link>
        <div className="min-w-0 sm:self-start sm:pt-0.5">
          <Link href={releaseHref} className="font-medium leading-snug hover:text-brand hover:underline">{release.editionName}</Link>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{release.itemNumber ? `#${release.itemNumber}` : "—"} · {release.chassis ?? "—"} · {release.releaseYear ?? "—"}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">{release.isOriginal ? <Badge variant="outline">{t("common.original")}</Badge> : <Badge variant="secondary" className="bg-brand/15 text-brand">{t("common.reissue")}</Badge>}</div>
        </div>
        <div className="col-span-2 flex flex-col gap-2 sm:col-span-1 sm:col-start-2 sm:row-start-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {release.rarity ? <RarityBadge rarity={release.rarity} /> : <Badge variant="outline" className="text-[10px] font-medium">{locale === "it" ? "Rarità da verificare" : "Rarity to verify"}</Badge>}
            <ProductionBadge release={release} locale={locale} />
          </div>
          {community && community.collectors > 0 ? (
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
              <Link href={collectorsHref} className="w-fit text-[10px] font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground">{t("common.collectors")}</Link>
              <div className="flex flex-wrap items-center gap-1.5">
                <Link href={collectorsHref} className="inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"><UsersRound className="size-3.5" />{community.collectors}</Link>
                {community.openToOffers > 0 ? <Link href={collectorsHref} className="inline-flex h-7 items-center gap-1.5 rounded-md border border-brand/25 bg-brand/10 px-2 text-xs font-semibold text-brand transition-colors hover:bg-brand/15"><Handshake className="size-3.5" />{community.openToOffers} {t("common.acceptingOffers")}</Link> : null}
              </div>
            </div>
          ) : null}
        </div>
        <div className="col-span-2 flex items-center justify-between gap-3 border-t border-border pt-3 sm:col-span-1 sm:col-start-3 sm:row-span-2 sm:row-start-1 sm:ml-auto sm:flex-col sm:items-end sm:justify-center sm:border-0 sm:pt-0">
          <div className="text-left sm:text-right">
            {estimate.isDemo ? (
              <p className="max-w-28 text-[11px] leading-tight text-muted-foreground">{locale === "it" ? "Dati mercato in arrivo" : "Market data coming soon"}</p>
            ) : (
              <><p className="font-semibold tabular-nums">{formatMoney(estimate.value)}</p><TrendIndicator value={estimate.trend90d} className="text-xs sm:justify-end" /></>
            )}
          </div>
          <div className="flex items-center gap-2"><Button size="sm" variant="outline" render={<Link href={releaseHref} />}>{t("product.viewRelease")}</Button><AddToCollectionDialog product={product} defaultReleaseId={release.id}><Button size="sm" variant={owned ? "outline" : "default"} className="gap-1.5">{owned ? <Check className="size-4" /> : <Plus className="size-4" />}{owned ? t("product.addAnother") : t("product.addThis")}</Button></AddToCollectionDialog></div>
        </div>
      </div>
    </div>
  )
}

function ProductionBadge({ release, locale }: { release: ProductRelease; locale: string }) {
  if (release.productionStatus === "unknown") return null
  const it = locale === "it"
  if (release.productionStatus === "discontinued") {
    return <Badge variant="secondary" className="text-[10px] font-semibold">{it ? "Fuori produzione" : "Discontinued"}</Badge>
  }
  if (release.productionStatus === "active") {
    return <Badge variant="outline" className="text-[10px] font-medium">{it ? "In produzione" : "In production"}</Badge>
  }
  return <Badge variant="outline" className="text-[10px] font-medium">{it ? "Annunciata" : "Announced"}</Badge>
}

function sortReleasesForDisplay(releases: ProductRelease[]): ProductRelease[] {
  return [...releases].sort((a, b) => {
    if (a.isOriginal !== b.isOriginal) return a.isOriginal ? -1 : 1
    const yearA = a.releaseYear ?? Number.MAX_SAFE_INTEGER
    const yearB = b.releaseYear ?? Number.MAX_SAFE_INTEGER
    if (yearA !== yearB) return yearA - yearB
    const dateA = a.releaseDate ?? "9999-12-31"
    const dateB = b.releaseDate ?? "9999-12-31"
    if (dateA !== dateB) return dateA.localeCompare(dateB)
    return a.editionName.localeCompare(b.editionName)
  })
}

function Spec({ label, value }: { label: string; value: string }) {
  return <div className="flex flex-col gap-0.5"><span className="text-xs text-muted-foreground">{label}</span><span className="font-medium">{value}</span></div>
}
