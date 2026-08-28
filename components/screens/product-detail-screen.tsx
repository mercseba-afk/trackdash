"use client"

import Link from "next/link"
import { notFound } from "next/navigation"
import { useState } from "react"
import { ArrowLeft, Check, Heart, Plus, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ProductArt } from "@/components/product-art"
import { RarityBadge, TrendIndicator, ConfidenceBadge } from "@/components/market-bits"
import { AddToCollectionDialog, AddToWishlistDialog } from "@/components/add-item-dialogs"
import { ProductCard } from "@/components/product-card"
import { getProductById, getRelatedProducts } from "@/lib/data/products"
import { getMarketEstimate } from "@/lib/data/market"
import { formatMoney } from "@/lib/format"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

export function ProductDetailScreen({ productId }: { productId: string }) {
  const product = getProductById(productId)
  const { isInCollection, isInWishlist } = useStore()

  if (!product) {
    notFound()
  }

  const [selectedVariantId, setSelectedVariantId] = useState(product.variants[0]?.id ?? "")
  const estimate = getMarketEstimate(product)
  const related = getRelatedProducts(product, 4)

  const owned = isInCollection(product.id)
  const wished = isInWishlist(product.id)

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" render={<Link href="/catalog" />} className="-ml-2 w-fit text-muted-foreground">
        <ArrowLeft data-icon="inline-start" />
        Back to catalog
      </Button>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        {/* Visual */}
        <div className="flex flex-col gap-4">
          <ProductArt product={product} className="aspect-[4/3] w-full rounded-xl border" />
          <div className="grid grid-cols-3 gap-3">
            <InfoTile label="Series" value={product.series} />
            <InfoTile label="Chassis" value={product.chassis} />
            <InfoTile label="Released" value={String(product.releaseYear)} />
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">#{product.tamiyaItemNumber}</Badge>
              <RarityBadge rarity={product.rarity} />
              {product.discontinued ? <Badge variant="outline">Discontinued</Badge> : null}
              {product.isLimitedEdition ? <Badge variant="outline">{product.limitedEditionType ?? "Limited"}</Badge> : null}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-balance md:text-3xl">{product.name}</h1>
            {product.japaneseName ? (
              <p className="-mt-1 text-sm text-muted-foreground">{product.japaneseName}</p>
            ) : null}
            <p className="leading-relaxed text-muted-foreground text-pretty">{product.description}</p>
          </div>

          {/* Variant selector */}
          {product.variants.length > 1 ? (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Edition / Variant</span>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => {
                  const active = v.id === selectedVariantId
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariantId(v.id)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                        active
                          ? "border-brand bg-brand/10 text-foreground"
                          : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                      )}
                      aria-pressed={active}
                    >
                      {active ? <Check className="size-3.5 text-brand" /> : null}
                      <span>{v.variantName}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}

          {/* Market card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-sm text-muted-foreground">Estimated market value</CardTitle>
              <ConfidenceBadge estimate={estimate} />
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-end justify-between gap-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-semibold tabular-nums">{formatMoney(estimate.value)}</span>
                  <TrendIndicator value={estimate.trend90d} className="text-sm" />
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <div>MSRP {formatMoney(product.msrpEUR)}</div>
                  <div className="tabular-nums">{estimate.sampleSize} data points</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 border-t pt-3 text-center">
                <RangeStat label="Low" value={formatMoney(estimate.low)} />
                <RangeStat label="Average" value={formatMoney(estimate.average)} accent />
                <RangeStat label="High" value={formatMoney(estimate.high)} />
              </div>
              {estimate.isDemo ? (
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Demo estimate derived from MSRP, rarity and age. Production values come from real sold listings.
                  Updated {estimate.lastUpdated}.
                </p>
              ) : null}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <AddToCollectionDialog product={product}>
              <Button className="flex-1">
                {owned ? <Check data-icon="inline-start" /> : <Plus data-icon="inline-start" />}
                {owned ? "Add another" : "Add to collection"}
              </Button>
            </AddToCollectionDialog>
            <AddToWishlistDialog product={product}>
              <Button variant="outline" className="flex-1">
                <Heart data-icon="inline-start" className={cn(wished && "fill-brand text-brand")} />
                {wished ? "On wishlist" : "Add to wishlist"}
              </Button>
            </AddToWishlistDialog>
            <Button variant="outline" size="icon" aria-label="Share">
              <Share2 />
            </Button>
          </div>

          <Separator />

          {/* Specs */}
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-medium">Specifications</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <SpecRow label="Item number" value={`#${product.tamiyaItemNumber}`} />
              <SpecRow label="Series" value={product.series} />
              <SpecRow label="Chassis" value={product.chassis} />
              <SpecRow label="Release year" value={String(product.releaseYear)} />
              <SpecRow label="JAN barcode" value={product.barcodeJAN} />
              <SpecRow label="Rarity" value={product.rarity} />
            </dl>
          </div>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 ? (
        <section className="flex flex-col gap-4 pt-2">
          <h2 className="text-lg font-semibold tracking-tight">Related machines</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border bg-card px-3 py-2">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="truncate text-sm font-medium">{value}</span>
    </div>
  )
}

function RangeStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-semibold tabular-nums", accent && "text-brand")}>{value}</span>
    </div>
  )
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  )
}
