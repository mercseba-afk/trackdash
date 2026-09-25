"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft, Check, ChevronDown, Handshake, Heart, LockKeyhole, Plus, UsersRound } from "lucide-react"
import { primaryRelease } from "@/lib/data/products"
import { getReleaseCommunityCountsAction } from "@/lib/actions/sharing"
import { useStore } from "@/lib/store"
import { useI18n } from "@/lib/i18n"
import { useMarketSignals } from "@/lib/market/context"
import { conditionUsesNewUnbuiltReference, enrichCollection, itemsForProduct } from "@/lib/analytics"
import { formatMoney, formatDate } from "@/lib/format"
import type { Product, ProductRelease } from "@/lib/types"
import type { ReleaseMarketSignalMap } from "@/lib/market/view-types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProductImage } from "@/components/catalog/product-image"
import { ProductCard } from "@/components/product-card"
import { RarityBadge } from "@/components/market-bits"
import { MarketSignalInline } from "@/components/market-signal-inline"
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
  const { collection, isInWishlist, user } = useStore()
  const { locale, t } = useI18n()
  const marketSignals = useMarketSignals()
  const [communityByRelease, setCommunityByRelease] = React.useState<Map<string, CommunityCount>>(new Map())

  const primary = primaryRelease(product)
  const sortedReleases = React.useMemo(() => sortReleasesForDisplay(product.releases), [product.releases])
  const owned = enrichCollection(collection, marketSignals)
  const mine = itemsForProduct(owned, product.id)
  const wished = isInWishlist(product.id)
  const publicDescription = locale === "it" && descriptionIt ? descriptionIt : product.description
  const productPath = `/catalog/${product.id}`
  const loginHref = `/login?next=${encodeURIComponent(productPath)}`

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
            {user ? (
              <>
                <AddToCollectionDialog product={product}><Button className="gap-1.5"><Plus className="size-4" /> {t("product.addCollection")}</Button></AddToCollectionDialog>
                <AddToWishlistDialog product={product}><Button variant="outline" className={cn("gap-1.5", wished && "border-brand text-brand")}><Heart className={cn("size-4", wished && "fill-brand")} /> {wished ? t("product.onWishlist") : t("product.wishlist")}</Button></AddToWishlistDialog>
              </>
            ) : (
              <>
                <Button render={<Link href={loginHref} />} className="gap-1.5">
                  <LockKeyhole className="size-4" /> {locale === "it" ? "Accedi e aggiungi alla collezione" : "Sign in and add to collection"}
                </Button>
                <Button variant="outline" render={<Link href={loginHref} />} className="gap-1.5">
                  <LockKeyhole className="size-4" /> Wishlist
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <section id="releases" className="scroll-mt-20">
        <Card className="overflow-hidden rounded-3xl border-border/70 shadow-[0_12px_36px_rgba(15,23,42,0.045)]">
          <CardHeader className="gap-1.5 border-b border-border/60 bg-gradient-to-br from-white via-white to-brand/5 px-4 py-5 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-brand">{locale === "it" ? "Identità del modello" : "Model identity"}</p>
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">{t("product.releasesTitle")}<Badge variant="secondary" className="rounded-full">{product.releases.length}</Badge></CardTitle>
              </div>
            </div>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{t("product.releasesDesc")}</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 p-3 sm:p-4">
            {sortedReleases.map((release) => (
              <ReleaseRow
                key={release.id}
                product={product}
                release={release}
                ownedCount={mine.filter((entry) => entry.release.id === release.id).length}
                community={communityByRelease.get(release.id)}
                marketSignals={marketSignals}
                isAuthed={Boolean(user)}
              />
            ))}
          </CardContent>
        </Card>
      </section>

      {mine.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">{locale === "it" ? "La tua collezione" : "Your collection"}</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-2">
            {mine.map((entry) => (
              <div key={entry.item.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <div className="flex items-center gap-3"><ProductImage product={entry.product} release={entry.release} className="size-10 rounded-md" size="sm" /><div><p className="font-medium">{entry.label}</p><p className="text-xs text-muted-foreground">{entry.item.condition} · {entry.release.itemNumber ? `#${entry.release.itemNumber}` : "—"} · {locale === "it" ? "acquisito" : "acquired"} {formatDate(entry.item.acquisitionDate)}</p></div></div>
                <CollectionMarketValue entry={entry} it={locale === "it"} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {related.length > 0 && <section className="flex flex-col gap-4 pt-2"><h2 className="text-lg font-semibold tracking-tight">{t("product.related")}</h2><div className="grid grid-cols-2 gap-4 md:grid-cols-4">{related.map((relatedProduct) => <ProductCard key={relatedProduct.id} product={relatedProduct} />)}</div></section>}
    </div>
  )
}

function CollectionMarketValue({ entry, it }: { entry: ReturnType<typeof enrichCollection>[number]; it: boolean }) {
  if (!conditionUsesNewUnbuiltReference(entry.item.condition)) {
    return (
      <p className="max-w-40 text-right text-[11px] leading-tight text-muted-foreground">
        {it ? "Riferimento mercato non disponibile per questa condizione" : "Market reference unavailable for this condition"}
      </p>
    )
  }

  return (
    <div className="max-w-44 text-right">
      <MarketSignalInline signal={entry.marketSignal} />
    </div>
  )
}

function ReleaseRow({
  product,
  release,
  ownedCount,
  community,
  marketSignals,
  isAuthed,
}: {
  product: Product
  release: ProductRelease
  ownedCount: number
  community?: CommunityCount
  marketSignals: ReleaseMarketSignalMap
  isAuthed: boolean
}) {
  const { locale, t } = useI18n()
  const marketSignal = marketSignals[release.id] ?? null
  const releaseHref = `/catalog/${product.id}/releases/${release.id}`
  const collectorsHref = `${releaseHref}#collectors`
  const loginHref = `/login?next=${encodeURIComponent(releaseHref)}`
  const owned = ownedCount > 0
  const ownershipLabel = locale === "it"
    ? (ownedCount === 1 ? "1 copia tua" : `${ownedCount} copie tue`)
    : (ownedCount === 1 ? "1 copy owned" : `${ownedCount} copies owned`)

  return (
    <article className="group overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_7px_22px_rgba(15,23,42,0.035)] transition-all duration-200 hover:border-brand/30 hover:shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
      <div className="grid gap-0 md:grid-cols-[160px_minmax(0,1fr)_minmax(190px,auto)]">
        <Link href={releaseHref} className="relative block overflow-hidden border-b border-border/50 bg-gradient-to-br from-white to-muted/20 md:border-b-0 md:border-r">
          <ProductImage product={product} release={release} className="aspect-[4/3] h-full min-h-36 w-full transition-transform duration-300 group-hover:scale-[1.02] md:min-h-0" size="md" />
          <span className={cn(
            "absolute left-2.5 top-2.5 rounded-full px-2 py-1 text-[10px] font-semibold shadow-sm",
            release.isOriginal ? "border border-border/70 bg-white/90 text-foreground" : "bg-brand text-white",
          )}>
            {release.isOriginal ? t("common.original") : t("common.reissue")}
          </span>
        </Link>

        <div className="min-w-0 p-3.5 sm:p-4 md:p-5">
          <Link href={releaseHref} className="text-base font-semibold leading-snug tracking-tight text-foreground transition-colors hover:text-brand sm:text-lg">
            {release.editionName}
          </Link>

          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span className="font-semibold tabular-nums text-foreground">{release.itemNumber ? `#${release.itemNumber}` : "—"}</span>
            <span>·</span>
            <span>{release.chassis ?? "—"}</span>
            <span>·</span>
            <span>{release.releaseYear ?? "—"}</span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {release.rarity ? <RarityBadge rarity={release.rarity} /> : <Badge variant="outline" className="rounded-full text-[10px] font-medium">{locale === "it" ? "Rarità da verificare" : "Rarity to verify"}</Badge>}
            <ProductionBadge release={release} locale={locale} />
            {owned ? <Badge className="gap-1 rounded-full bg-success/15 text-success"><Check className="size-3" />{ownershipLabel}</Badge> : null}
          </div>

          {community && community.collectors > 0 ? (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <Link href={collectorsHref} className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"><UsersRound className="size-3.5" />{community.collectors} {t("common.collectors")}</Link>
              {community.openToOffers > 0 ? <Link href={collectorsHref} className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-brand/25 bg-brand/10 px-2.5 text-xs font-semibold text-brand transition-colors hover:bg-brand/15"><Handshake className="size-3.5" />{community.openToOffers} {t("common.acceptingOffers")}</Link> : null}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col justify-between gap-3 border-t border-border/60 bg-muted/15 p-3.5 sm:flex-row sm:items-center sm:p-4 md:items-stretch md:border-l md:border-t-0 md:p-4">
          <div className="flex min-w-0 items-center md:items-start md:justify-end">
            <div className="text-left md:text-right"><MarketSignalInline signal={marketSignal} showStartingPrice showBothReferences /></div>
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto md:flex-col md:items-stretch md:justify-end">
            <Button size="sm" variant="outline" className="flex-1 rounded-xl bg-white md:flex-none" render={<Link href={releaseHref} />}>{t("product.viewRelease")}</Button>
            {isAuthed ? (
              <AddToCollectionDialog product={product} defaultReleaseId={release.id}>
                <Button size="sm" variant={owned ? "outline" : "default"} className="flex-1 gap-1.5 rounded-xl md:flex-none">{owned ? <Check className="size-4" /> : <Plus className="size-4" />}{owned ? t("product.addAnother") : t("product.addThis")}</Button>
              </AddToCollectionDialog>
            ) : (
              <Button size="sm" className="flex-1 gap-1.5 rounded-xl md:flex-none" render={<Link href={loginHref} />}>
                <LockKeyhole className="size-4" /> {locale === "it" ? "Accedi per aggiungere" : "Sign in to add"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

function ProductionBadge({ release, locale }: { release: ProductRelease; locale: string }) {
  if (release.productionStatus === "unknown") return null
  const it = locale === "it"
  if (release.productionStatus === "discontinued") {
    return <Badge variant="secondary" className="rounded-full text-[10px] font-semibold">{it ? "Fuori produzione" : "Discontinued"}</Badge>
  }
  if (release.productionStatus === "active") {
    return <Badge variant="outline" className="rounded-full text-[10px] font-medium">{it ? "In produzione" : "In production"}</Badge>
  }
  return <Badge variant="outline" className="rounded-full text-[10px] font-medium">{it ? "Annunciata" : "Announced"}</Badge>
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
