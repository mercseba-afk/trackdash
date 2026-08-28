"use client"

import * as React from "react"
import Link from "next/link"
import { Check, Heart, Plus } from "lucide-react"
import type { Product } from "@/lib/types"
import { getMarketEstimate } from "@/lib/data/market"
import { useStore } from "@/lib/store"
import { RARITY_STYLE } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MarketValue } from "@/components/market-value"
import { ProductPlate } from "@/components/product-plate"
import { AddToCollectionDialog } from "@/components/add-to-collection-dialog"
import { AddToWishlistDialog } from "@/components/add-to-wishlist-dialog"

export function ProductCard({ product }: { product: Product }) {
  const estimate = React.useMemo(() => getMarketEstimate(product), [product])
  const { isInCollection, isInWishlist } = useStore()
  const owned = isInCollection(product.id)
  const wished = isInWishlist(product.id)
  const [collectOpen, setCollectOpen] = React.useState(false)
  const [wishOpen, setWishOpen] = React.useState(false)

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 transition-shadow hover:ring-foreground/20">
      <Link href={`/product/${product.id}`} className="relative block">
        <ProductPlate product={product} />
        <div className="absolute right-2 top-2 flex gap-1">
          {product.isLimitedEdition && (
            <Badge className="bg-warning/90 text-[10px] text-background">Limited</Badge>
          )}
          {owned && (
            <Badge className="gap-0.5 bg-success/90 text-[10px] text-background">
              <Check className="size-3" /> Owned
            </Badge>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/product/${product.id}`}
              className="block truncate text-sm font-medium hover:text-brand"
            >
              {product.name}
            </Link>
            <p className="truncate text-xs text-muted-foreground">
              {product.chassis} · {product.releaseYear}
            </p>
          </div>
          <Badge variant="secondary" className={cn("shrink-0", RARITY_STYLE[product.rarity])}>
            {product.rarity}
          </Badge>
        </div>

        <div className="mt-auto flex items-end justify-between gap-2">
          <MarketValue estimate={estimate} size="sm" />
          <div className="flex gap-1">
            <Button
              size="icon-sm"
              variant={wished ? "secondary" : "outline"}
              aria-label="Add to wishlist"
              onClick={() => setWishOpen(true)}
            >
              <Heart className={cn(wished && "fill-brand text-brand")} />
            </Button>
            <Button size="icon-sm" aria-label="Add to collection" onClick={() => setCollectOpen(true)}>
              <Plus />
            </Button>
          </div>
        </div>
      </div>

      <AddToCollectionDialog product={product} open={collectOpen} onOpenChange={setCollectOpen} />
      <AddToWishlistDialog product={product} open={wishOpen} onOpenChange={setWishOpen} />
    </div>
  )
}
