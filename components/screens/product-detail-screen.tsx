"use client"

import Link from "next/link"
import { ArrowLeft, Check, Heart, Info, Plus, RefreshCw } from "lucide-react"
import { primaryRelease } from "@/lib/data/products"
import { getReleaseEstimate } from "@/lib/data/market"
import { useStore } from "@/lib/store"
import { enrichCollection, itemsForProduct, releaseLabel } from "@/lib/analytics"
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

export function ProductDetailScreen({ product, related }: { product: Product; related: Product[] }) {
  const { collection, isInWishlist } = useStore()

  const primary = primaryRelease(product)
  const owned = enrichCollection(collection)
  const mine = itemsForProduct(owned, product.id)
  const wished = isInWishlist(product.id)

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" render={<Link href="/catalog" />} className="-ml-2 w-fit text-muted-foreground">
        <ArrowLeft data-icon="inline-start" />
        Back to catalog
      </Button>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        {/* Identity + primary art */}
        <div className="flex flex-col gap-4">
          <ProductImage product={product} release={primary} className="aspect-[4/3] w-full rounded-xl border" size="lg" />
          {product.releases.length > 1 && (
            <div className="grid grid-cols-3 gap-3">
              {product.releases.slice(0, 3).map((r) => (
                <ProductImage key={r.id} product={product} release={r} className="aspect-square rounded-lg border" size="sm" />
              ))}
            </div>
          )}
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
            <ReleaseRow key={r.id} product={product} release={r} owned={mine.some((m) => m.release.id === r.id)} />
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
                      {m.item.condition} · #{m.release.itemNumber} · acquired {formatDate(m.item.acquisitionDate)}
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

function ReleaseRow({ product, release, owned }: { product: Product; release: ProductRelease; owned: boolean }) {
  const estimate = getReleaseEstimate(product, release)
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-background p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <ProductImage product={product} release={release} className="size-14 shrink-0 rounded-md" size="sm" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="font-medium">{releaseLabel(release)}</p>
            {release.isOriginal ? (
              <Badge variant="outline">Original</Badge>
            ) : (
              <Badge variant="secondary" className="bg-brand/15 text-brand">
                Reissue
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            #{release.itemNumber} · {release.chassis} · {release.releaseYear}
            {release.notes ? ` · ${release.notes}` : ""}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] font-medium",
                RARITY_STYLE[release.rarity ?? product.rarity],
              )}
            >
              {release.rarity ?? product.rarity}
            </span>
            <ConfidenceBadge confidence={estimate.confidence} />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-center">
        <div className="text-right">
          <p className="font-semibold tabular-nums">{formatMoney(estimate.value)}</p>
          <TrendIndicator value={estimate.trend90d} className="justify-end text-xs" />
        </div>
        <AddToCollectionDialog product={product} defaultReleaseId={release.id}>
          <Button size="sm" variant={owned ? "outline" : "default"} className="gap-1.5">
            {owned ? <Check className="size-4" /> : <Plus className="size-4" />}
            {owned ? "Add another" : "Add this"}
          </Button>
        </AddToCollectionDialog>
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
