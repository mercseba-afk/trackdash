"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft, Check, Handshake, Heart, Info, Plus, RefreshCw, UsersRound } from "lucide-react"
import { primaryRelease } from "@/lib/data/products"
import { getReleaseEstimate } from "@/lib/data/market"
import { getReleaseCommunityCountsAction } from "@/lib/actions/sharing"
import { useStore } from "@/lib/store"
import { enrichCollection, itemsForProduct } from "@/lib/analytics"
import { formatMoney, formatDate, RARITY_STYLE } from "@/lib/format"
import type { Product, ProductRelease } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProductImage } from "@/components/catalog/product-image"
import { ProductCard } from "@/components/product-card"
import { MarketEstimateCard, RarityBadge, TrendIndicator, ConfidenceBadge } from "@/components/market-bits"
import { AddToCollectionDialog, AddToWishlistDialog } from "@/components/add-item-dialogs"
import { cn } from "@/lib/utils"

type CommunityCount = { collectors: number; openToOffers: number }

export function ProductDetailScreen({ product, related }: { product: Product; related: Product[] }) {
  const { collection, isInWishlist } = useStore()
  const [communityByRelease, setCommunityByRelease] = React.useState<Map<string, CommunityCount>>(new Map())

  const primary = primaryRelease(product)
  const owned = enrichCollection(collection)
  const mine = itemsForProduct(owned, product.id)
  const wished = isInWishlist(product.id)

  React.useEffect(() => {
    let cancelled = false
    getReleaseCommunityCountsAction(product.id)
      .then((rows) => {
        if (cancelled) return
        setCommunityByRelease(
          new Map(rows.map((row) => [row.releaseId, { collectors: row.collectors, openToOffers: row.openToOffers }])),
        )
      })
      .catch(() => {
        // Community activity is supplemental; the product page remains usable
        // if this lightweight aggregate cannot be loaded.
      })
    return () => {
      cancelled = true
    }
  }, [product.id])

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" render={<Link href="/catalog" />} className="-ml-2 w-fit text-muted-foreground">
        <ArrowLeft data-icon="inline-start" />
        Back to catalog
      </Button>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        {/* Identity + primary art */}
        <div className="flex flex-col gap-4">
          {/* Product-level hero — generic to the model, never tied to a
              specific release (no `release` prop passed to ProductImage). */}
          <ProductImage product={product} className="aspect-[4/3] w-full rounded-xl border" size="lg" />
        </div>

        {/* Header + actions */}
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{product.series}</Badge>
              <RarityBadge rarity={product.rarity} />
              {product.hasMultipleReleases && (
                <Badge variant="outline" className="gap-1">
                  <RefreshCw className="size-3" /> {product.releases.length} releases
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-balance md:text-3xl">{product.name}</h1>
            {product.japaneseName && <p className="-mt-1 text-sm text-muted-foreground">{product.japaneseName}</p>}
            <p className="leading-relaxed text-muted-foreground text-pretty">{product.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-lg border bg-card p-4 text-sm">
            <Spec label="First released" value={product.originalReleaseYear ? String(product.originalReleaseYear) : "—"} />
            <Spec label="Chassis (original)" value={product.chassis ?? "—"} />
            <Spec label="Item no. (original)" value={primary.itemNumber ? `#${primary.itemNumber}` : "—"} />
            <Spec label="Series" value={product.series} />
          </div>

          <div className="flex flex-wrap gap-2">
            <AddToCollectionDialog product={product}>
              <Button className="gap-1.5">
                <Plus className="size-4" /> Add to collection
              </Button>
            </AddToCollectionDialog>
            <AddToWishlistDialog product={product}>
              <Button variant="outline" className={cn("gap-1.5", wished && "border-brand text-brand")}>
                <Heart className={cn("size-4", wished && "fill-brand")} /> {wished ? "On wishlist" : "Wishlist"}
              </Button>
            </AddToWishlistDialog>
          </div>

          {mine.length > 0 && (
            <div className="rounded-lg border border-success/40 bg-success/5 px-3 py-2 text-sm text-success">
              <Check className="mr-1 inline size-4" />
              You own {mine.length} {mine.length === 1 ? "copy" : "copies"} of this model.
            </div>
          )}
        </div>
      </div>

      {/* Releases & editions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            Releases &amp; editions
            <Badge variant="secondary">{product.releases.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-xs text-muted-foreground">
            The same model is often re-released over the years — each edition has its own item number, box art and
            market value. Add the exact one you own.
          </p>
          {product.releases.map((r) => (
            <ReleaseRow
              key={r.id}
              product={product}
              release={r}
              owned={mine.some((m) => m.release.id === r.id)}
              community={communityByRelease.get(r.id)}
            />
          ))}
        </CardContent>
      </Card>

      {/* Your copies */}
      {mine.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your collection</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {mine.map((m) => (
              <div
                key={m.item.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-3">
                  <ProductImage product={m.product} release={m.release} className="size-10 rounded-md" size="sm" />
                  <div>
                    <p className="font-medium">{m.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.item.condition} · {m.release.itemNumber ? `#${m.release.itemNumber}` : "—"} · acquired {formatDate(m.item.acquisitionDate)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold tabular-nums">{formatMoney(m.estimate.value)}</p>
                  <TrendIndicator value={m.estimate.trend90d} className="justify-end text-xs" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Market — headline (primary release) */}
      <div className="grid gap-4 lg:grid-cols-2">
        <MarketEstimateCard
          estimate={getReleaseEstimate(product, primary)}
          title="Market value — original release"
          msrp={product.msrpEUR}
        />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Info className="size-4 text-muted-foreground" /> How we value this
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
            <p>
              Estimates are computed per release and per condition — a sealed 1990 original is worth very differently
              from a 2026 reissue, even though it&apos;s the same model.
            </p>
            <p>
              These are indicative demo figures derived from each edition&apos;s rarity, age and reference pricing.
              They are not appraisals.
            </p>
          </CardContent>
        </Card>
      </div>

      {related.length > 0 && (
        <section className="flex flex-col gap-4 pt-2">
          <h2 className="text-lg font-semibold tracking-tight">Related models</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function ReleaseRow({
  product,
  release,
  owned,
  community,
}: {
  product: Product
  release: ProductRelease
  owned: boolean
  community?: CommunityCount
}) {
  const estimate = getReleaseEstimate(product, release)
  const releaseHref = `/catalog/${product.id}/releases/${release.id}`

  return (
    <div className="rounded-xl border border-border bg-background p-3 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link href={releaseHref} className="block shrink-0">
          <ProductImage
            product={product}
            release={release}
            className="h-40 w-full rounded-lg sm:h-24 sm:w-32"
            size="md"
          />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Link href={releaseHref} className="font-medium leading-snug hover:text-brand hover:underline">
              {release.editionName}
            </Link>
            {release.isOriginal ? (
              <Badge variant="outline">Original</Badge>
            ) : (
              <Badge variant="secondary" className="bg-brand/15 text-brand">
                Reissue
              </Badge>
            )}
          </div>

          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {release.itemNumber ? `#${release.itemNumber}` : "—"} · {release.chassis ?? "—"} · {release.releaseYear ?? "—"}
            {release.notes ? ` · ${release.notes}` : ""}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] font-medium",
                RARITY_STYLE[release.rarity ?? product.rarity],
              )}
            >
              {release.rarity ?? product.rarity}
            </span>
            <ConfidenceBadge confidence={estimate.confidence} />

            {community && community.collectors > 0 ? (
              <span
                title={`${community.collectors} collector${community.collectors === 1 ? "" : "s"} sharing this release`}
                aria-label={`${community.collectors} collector${community.collectors === 1 ? "" : "s"} sharing this release`}
                className="inline-flex h-5 items-center gap-1 rounded-full border border-border px-1.5 text-[10px] font-medium text-muted-foreground"
              >
                <UsersRound className="size-3" />
                {community.collectors}
              </span>
            ) : null}

            {community && community.openToOffers > 0 ? (
              <span
                title={`${community.openToOffers} open to offers`}
                aria-label={`${community.openToOffers} collector${community.openToOffers === 1 ? "" : "s"} open to offers`}
                className="inline-flex h-5 items-center gap-1 rounded-full bg-brand/10 px-1.5 text-[10px] font-medium text-brand"
              >
                <Handshake className="size-3" />
                {community.openToOffers}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border pt-3 sm:ml-auto sm:flex-col sm:items-end sm:justify-center sm:border-0 sm:pt-0">
          <div className="text-left sm:text-right">
            <p className="font-semibold tabular-nums">{formatMoney(estimate.value)}</p>
            <TrendIndicator value={estimate.trend90d} className="text-xs sm:justify-end" />
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" render={<Link href={releaseHref} />}>
              Details
            </Button>
            <AddToCollectionDialog product={product} defaultReleaseId={release.id}>
              <Button size="sm" variant={owned ? "outline" : "default"} className="gap-1.5">
                {owned ? <Check className="size-4" /> : <Plus className="size-4" />}
                {owned ? "Add another" : "Add this"}
              </Button>
            </AddToCollectionDialog>
          </div>
        </div>
      </div>
    </div>
  )
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
