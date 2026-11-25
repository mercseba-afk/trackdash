"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Check, ChevronDown, Handshake, Plus, UsersRound } from "lucide-react"
import { AmazonPurchaseButton } from "@/components/catalog/amazon-purchase-button"
import { amazonItalyUrlForRelease } from "@/lib/data/amazon-italy-products"
import { primaryRelease } from "@/lib/data/products"
import { getReleaseCommunityCountsAction } from "@/lib/actions/sharing"
import { useStore } from "@/lib/store"
import { useI18n } from "@/lib/i18n"
import { conditionLabel, productDescriptionForLocale, releaseTypeLabel } from "@/lib/i18n/catalog-labels"
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
import { AddToCollectionDialog } from "@/components/add-item-dialogs"
import { cn } from "@/lib/utils"
import { localizePublicPath, releasePublicPath, withCollectionIntent } from "@/lib/seo/catalog-paths"

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
  const { collection, user } = useStore()
  const { locale, t } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()
  const marketSignals = useMarketSignals()
  const [communityByRelease, setCommunityByRelease] = React.useState<Map<string, CommunityCount>>(new Map())

  const primary = primaryRelease(product)
  const sortedReleases = React.useMemo(() => sortReleasesForDisplay(product.releases), [product.releases])
  const owned = enrichCollection(collection, marketSignals)
  const mine = itemsForProduct(owned, product.id)
  const publicDescription = productDescriptionForLocale(product, descriptionIt, locale === "it")
  const intent = searchParams.get("intent")
  const primaryPath = releasePublicPath(product, primary, locale)

  // Preserve existing family-level account links by continuing on the exact edition.
  React.useEffect(() => {
    if (!user || (intent !== "collection" && intent !== "wishlist")) return
    router.replace(withCollectionIntent(primaryPath, intent), { scroll: false })
  }, [intent, primaryPath, router, user])

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
      <Button variant="ghost" size="sm" render={<Link href={localizePublicPath("/catalog", locale)} />} className="-ml-2 w-fit text-muted-foreground">
        <ArrowLeft data-icon="inline-start" /> {t("product.back")}
      </Button>

      <section aria-labelledby="family-title" className="rounded-2xl border border-brand/15 bg-brand/5 p-4 sm:p-6">
        <div className="grid grid-cols-[minmax(0,1fr)_108px] items-center gap-3 min-[360px]:grid-cols-[minmax(0,1fr)_128px] sm:grid-cols-[minmax(0,1fr)_240px] sm:gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand">{locale === "it" ? "Famiglia Mini 4WD" : "Mini 4WD family"}</p>
            {product.originalReleaseYear ? <span className="mb-2 inline-flex rounded-md bg-brand/10 px-2 py-1 text-xs font-medium text-foreground">{locale === "it" ? "Dal" : "Since"} {product.originalReleaseYear}</span> : null}
            <h1 id="family-title" className="break-words text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">{product.name}</h1>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">{product.series} · Tamiya</p>
          </div>
          <ProductImage product={product} className="aspect-[16/11] w-full rounded-xl bg-white" size="md" sizes="(min-width: 1024px) 320px, (min-width: 640px) 240px, 128px" />
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {locale === "it"
            ? `Esplora le release di ${product.name}: originali, ristampe ed edizioni speciali.`
            : `Explore the ${product.name} releases: originals, reissues and special editions.`}
        </p>
        <details className="group mt-4 border-t border-brand/15 pt-2">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden">
            {locale === "it" ? "Informazioni sulla famiglia" : "About this family"}
            <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180 motion-reduce:transition-none" />
          </summary>
          <div className="pb-2 pt-2">
            {product.japaneseName && <p className="mb-3 text-sm text-muted-foreground">{product.japaneseName}</p>}
            {publicDescription ? <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{publicDescription}</p> : null}
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <Spec label={t("product.firstReleased")} value={product.originalReleaseYear ? String(product.originalReleaseYear) : "—"} />
              <Spec label={t("product.chassisOriginal")} value={product.chassis ?? "—"} />
              <Spec label={t("product.itemOriginal")} value={primary.itemNumber ? `#${primary.itemNumber}` : "—"} />
              <Spec label={t("product.series")} value={product.series} />
            </div>
          </div>
        </details>
        <Link href="#releases" className="mt-3 flex min-h-11 items-center justify-between gap-3 rounded-xl bg-brand px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:w-fit sm:min-w-64">
          <span className="flex items-center gap-2"><span className="inline-flex min-w-7 items-center justify-center rounded-lg bg-white/15 px-1.5 py-1 font-semibold tabular-nums">{product.releases.length}</span>{locale === "it" ? "release da esplorare" : product.releases.length === 1 ? "release to explore" : "releases to explore"}</span>
          <ChevronDown className="size-4 shrink-0" />
        </Link>
      </section>

      <section id="releases" className="scroll-mt-20">
        <Card className="overflow-hidden rounded-3xl border-border/70 shadow-[0_12px_36px_rgba(15,23,42,0.045)]">
          <CardHeader className="gap-1.5 border-b border-border/60 bg-gradient-to-br from-white via-white to-brand/5 px-4 py-5 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-brand">{locale === "it" ? "Release della famiglia" : "Family releases"}</p>
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
            {mine.map((entry) => {
              const acquisitionDate = entry.item.acquisitionDate && Number.isFinite(Date.parse(entry.item.acquisitionDate))
                ? formatDate(entry.item.acquisitionDate)
                : null
              return (
              <div key={entry.item.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <div className="flex items-center gap-3"><ProductImage product={entry.product} release={entry.release} className="size-10 rounded-md" size="sm" /><div><p className="font-medium">{entry.label}</p><p className="text-xs text-muted-foreground">{conditionLabel(entry.item.condition, locale === "it")} · {entry.release.itemNumber ? `#${entry.release.itemNumber}` : "—"}{acquisitionDate ? <> · {locale === "it" ? "acquisito" : "acquired"} {acquisitionDate}</> : null}</p></div></div>
                <CollectionMarketValue entry={entry} it={locale === "it"} />
              </div>
              )
            })}
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
  const amazonUrl = amazonItalyUrlForRelease(release.id)
  const marketSignal = marketSignals[release.id] ?? null
  const releaseHref = releasePublicPath(product, release, locale)
  const collectorsHref = `${releaseHref}#collectors`
  const collectionSignupHref = `/signup?next=${encodeURIComponent(withCollectionIntent(releaseHref, "collection"))}`
  const owned = ownedCount > 0
  const ownershipLabel = locale === "it"
    ? (ownedCount === 1 ? "1 copia tua" : `${ownedCount} copie tue`)
    : (ownedCount === 1 ? "1 copy owned" : `${ownedCount} copies owned`)

  return (
    <article className="group overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_7px_22px_rgba(15,23,42,0.035)] transition-all duration-200 hover:border-brand/30 hover:shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
      <div className="grid gap-0 md:grid-cols-[minmax(240px,32%)_minmax(0,1fr)] lg:grid-cols-[minmax(320px,34%)_minmax(0,1fr)]">
        <Link href={releaseHref} className="relative block overflow-hidden border-b border-border/50 bg-gradient-to-br from-white to-muted/20 md:border-b-0 md:border-r">
          <ProductImage
            product={product}
            release={release}
            className="aspect-[3/2] h-full min-h-32 w-full transition-transform duration-300 group-hover:scale-[1.02] md:min-h-0"
            size="md"
            sizes="(min-width: 1280px) 420px, (min-width: 1024px) 34vw, (min-width: 768px) 32vw, 100vw"
          />
          <span className={cn(
            "absolute left-2.5 top-2.5 rounded-full px-2 py-1 text-[10px] font-semibold shadow-sm",
            release.isOriginal ? "border border-border/70 bg-white/90 text-foreground" : "bg-brand text-white",
          )}>
            {releaseTypeLabel(release.releaseType, locale === "it")}
          </span>
        </Link>

        <div className="min-w-0">
          <div className="p-3 sm:p-3.5 md:p-4">
          <Link href={releaseHref} className="text-base font-semibold leading-snug tracking-tight text-foreground transition-colors hover:text-brand sm:text-lg">
            {release.editionName}
          </Link>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span className="font-semibold tabular-nums text-foreground">{release.itemNumber ? `#${release.itemNumber}` : "—"}</span>
            <span>·</span>
            <span>{release.chassis ?? "—"}</span>
            <span>·</span>
            <span>{release.releaseYear ?? "—"}</span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {release.rarity ? (
              <RarityBadge rarity={release.rarity} className="text-[9px]" />
            ) : (
              <Badge variant="outline" className="rounded-full px-1.5 py-0.5 text-[9px] font-medium">
                {locale === "it" ? "Rarità da verificare" : "Rarity to verify"}
              </Badge>
            )}
            <ProductionBadge release={release} locale={locale} compact />
            {owned ? (
              <Badge className="gap-1 rounded-full bg-success/15 px-1.5 py-0.5 text-[10px] text-success">
                <Check className="size-2.5" />{ownershipLabel}
              </Badge>
            ) : null}
          </div>

          {community && community.collectors > 0 ? (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Link href={collectorsHref} className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"><UsersRound className="size-3.5" />{community.collectors} {t("common.collectors")}</Link>
              {community.openToOffers > 0 ? <Link href={collectorsHref} className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-brand/25 bg-brand/10 px-2.5 text-xs font-semibold text-brand transition-colors hover:bg-brand/15"><Handshake className="size-3.5" />{community.openToOffers} {t("common.acceptingOffers")}</Link> : null}
            </div>
          ) : null}
        </div>

          <div className="border-t border-border/60 bg-muted/10 p-3 sm:p-3.5 md:p-4">
            <MarketSignalInline signal={marketSignal} showStartingPrice showBothReferences compactPreview />
            <div className="mt-3 grid grid-cols-2 items-center gap-2 sm:flex sm:flex-wrap">
              <Button size="sm" variant="outline" className="h-9 min-w-0 flex-1 rounded-xl bg-white px-3 text-xs sm:flex-none" render={<Link href={releaseHref} />}>{t("product.viewRelease")}</Button>
              {isAuthed ? (
                <AddToCollectionDialog product={product} defaultReleaseId={release.id}>
                  <Button size="sm" variant={owned ? "outline" : "default"} className="h-9 min-w-0 flex-1 gap-1.5 rounded-xl px-3 text-xs sm:flex-none">{owned ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}{owned ? t("product.addAnother") : t("product.addThis")}</Button>
                </AddToCollectionDialog>
              ) : (
                <Button size="sm" className="h-9 min-w-0 flex-1 gap-1.5 rounded-xl px-3 text-xs sm:flex-none" render={<Link href={collectionSignupHref} />}>
                  <Plus className="size-3.5" /> {locale === "it" ? "La possiedo" : "I own it"}
                </Button>
              )}
              {amazonUrl && (
                <AmazonPurchaseButton href={amazonUrl} itemNumber={release.itemNumber} it={locale === "it"} className="col-span-2 w-full sm:w-auto" />
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

function ProductionBadge({ release, locale, compact = false }: { release: ProductRelease; locale: string; compact?: boolean }) {
  if (release.productionStatus === "unknown") return null
  const it = locale === "it"
  if (release.productionStatus === "discontinued") {
    return <Badge variant="secondary" className={cn("rounded-full font-semibold", compact ? "px-1.5 py-0.5 text-[9px]" : "text-[10px]")}>{it ? "Fuori produzione" : "Discontinued"}</Badge>
  }
  if (release.productionStatus === "active") {
    return <Badge variant="outline" className={cn("rounded-full font-medium", compact ? "px-1.5 py-0.5 text-[9px]" : "text-[10px]")}>{it ? "In produzione" : "In production"}</Badge>
  }
  return <Badge variant="outline" className={cn("rounded-full font-medium", compact ? "px-1.5 py-0.5 text-[9px]" : "text-[10px]")}>{it ? "Annunciata" : "Announced"}</Badge>
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
