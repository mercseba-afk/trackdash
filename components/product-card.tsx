"use client"

import Link from "next/link"
import { Check, Heart, Plus } from "lucide-react"
import type { Product } from "@/lib/types"
import { useStore } from "@/lib/store"
import { getMarketEstimate } from "@/lib/data/market"
import { formatMoney } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { ProductArt } from "@/components/product-art"
import { RarityBadge, TrendIndicator } from "@/components/market-bits"
import { AddToCollectionDialog, AddToWishlistDialog } from "@/components/add-item-dialogs"
import { cn } from "@/lib/utils"

export function ProductCard({ product }: { product: Product }) {
  const { isInCollection, isInWishlist } = useStore()
  const estimate = getMarketEstimate(product)
  const owned = isInCollection(product.id)
  const wished = isInWishlist(product.id)

  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md">
      <Link href={`/catalog/${product.id}`} className="relative block">
        <ProductArt product={product} className="aspect-[4/3] w-full" />
        {owned && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded bg-success px-1.5 py-0.5 text-[10px] font-semibold text-white">
            <Check className="size-3" /> Owned
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/catalog/${product.id}`} className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight hover:text-brand">{product.name}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {product.chassis} · {product.releaseYear}
            </p>
          </Link>
          <RarityBadge rarity={product.rarity} />
        </div>
        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <div>
            <p className="text-sm font-semibold tabular-nums">{formatMoney(estimate.value)}</p>
            <TrendIndicator value={estimate.trend90d} className="text-xs" />
          </div>
          <div className="flex items-center gap-1">
            <AddToWishlistDialog product={product}>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Add to wishlist"
                className={cn(wished && "border-brand text-brand")}
              >
                <Heart className={cn(wished && "fill-brand")} />
              </Button>
            </AddToWishlistDialog>
            <AddToCollectionDialog product={product}>
              <Button size="icon-sm" aria-label="Add to collection">
                <Plus />
              </Button>
            </AddToCollectionDialog>
          </div>
        </div>
      </div>
    </div>
  )
}
