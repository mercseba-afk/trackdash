"use client"

import * as React from "react"
import Link from "next/link"
import { Check, Heart, Target, Trash2 } from "lucide-react"
import { useStore } from "@/lib/store"
import { enrichWishlist, type EnrichedWishlistItem } from "@/lib/analytics"
import { formatMoney } from "@/lib/format"
import type { WishlistPriority } from "@/lib/types"
import { ProductArt } from "@/components/product-art"
import { RarityBadge, TrendIndicator } from "@/components/market-bits"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { toast } from "sonner"

const PRIORITY_META: Record<WishlistPriority, { label: string; className: string }> = {
  High: { label: "High", className: "bg-brand text-brand-foreground" },
  Medium: { label: "Medium", className: "bg-warning text-white" },
  Low: { label: "Low", className: "bg-muted text-muted-foreground" },
}

export function WishlistScreen() {
  const { wishlist, removeFromWishlist, moveWishlistToCollection } = useStore()
  const enriched = React.useMemo(() => enrichWishlist(wishlist), [wishlist])

  const sorted = React.useMemo(() => {
    const order: Record<WishlistPriority, number> = { High: 0, Medium: 1, Low: 2 }
    return [...enriched].sort((a, b) => order[a.item.priority] - order[b.item.priority])
  }, [enriched])

  const atTarget = enriched.filter((e) => e.belowTarget)
  const totalTarget = enriched.reduce((s, e) => s + (e.item.targetPrice ?? e.estimate.value), 0)

  if (wishlist.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader />
        <Empty className="rounded-lg border border-dashed border-border py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Heart />
            </EmptyMedia>
            <EmptyTitle>Your wishlist is empty</EmptyTitle>
            <EmptyDescription>
              Track models you want and set a target price. We&apos;ll flag them when the estimate hits your target.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button render={<Link href="/catalog" />}>Find models to want</Button>
          </EmptyContent>
        </Empty>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader />

      <div className="flex flex-wrap items-center gap-3">
        <Card className="flex-1 py-0">
          <CardContent className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-muted-foreground">Wishlist items</span>
            <span className="text-lg font-semibold tabular-nums">{enriched.length}</span>
          </CardContent>
        </Card>
        <Card className="flex-1 py-0">
          <CardContent className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-muted-foreground">Est. to complete</span>
            <span className="text-lg font-semibold tabular-nums">{formatMoney(totalTarget)}</span>
          </CardContent>
        </Card>
        <Card className="flex-1 py-0">
          <CardContent className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-muted-foreground">At target price</span>
            <span className="text-lg font-semibold tabular-nums text-success">{atTarget.length}</span>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3">
        {sorted.map((e) => (
          <WishlistRow
            key={e.item.id}
            entry={e}
            onRemove={async () => {
              try {
                await removeFromWishlist(e.item.id)
                toast.success(`Removed ${e.product.name} from wishlist`)
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Couldn't remove this item")
              }
            }}
            onAcquire={async () => {
              try {
                await moveWishlistToCollection(e.item.id, {
                  condition: "New / Opened",
                  acquisitionDate: new Date().toISOString(),
                  acquisitionPrice: e.item.targetPrice ?? e.estimate.value,
                  acquisitionCurrency: "EUR",
                })
                toast.success("Moved to collection", { description: e.product.name })
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Couldn't move this item to your collection")
              }
            }}
          />
        ))}
      </div>
    </div>
  )
}

function WishlistRow({
  entry: e,
  onRemove,
  onAcquire,
}: {
  entry: EnrichedWishlistItem
  onRemove: () => void
  onAcquire: () => void
}) {
  const meta = PRIORITY_META[e.item.priority]
  return (
    <Card className="overflow-hidden py-0">
      <div className="flex items-stretch gap-3 p-3 sm:gap-4">
        <Link href={`/catalog/${e.product.id}`} className="shrink-0">
          <ProductArt product={e.product} release={e.release} size="sm" className="h-20 w-28 sm:h-24 sm:w-36" />
        </Link>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link href={`/catalog/${e.product.id}`} className="truncate font-medium hover:text-brand">
                {e.product.name}
              </Link>
              <p className="truncate text-xs text-muted-foreground">
                {e.label ? `${e.label} · ` : "Any edition · "}
                {e.product.chassis}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge className={meta.className}>{meta.label}</Badge>
              <RarityBadge rarity={e.product.rarity} />
            </div>
          </div>
          <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              Market <span className="font-medium text-foreground">{formatMoney(e.estimate.value)}</span>
              <TrendIndicator value={e.estimate.trend90d} className="text-xs" />
            </span>
            {e.item.targetPrice != null && (
              <span className="inline-flex items-center gap-1">
                <Target className="size-3" /> Target{" "}
                <span className="font-medium text-foreground">{formatMoney(e.item.targetPrice)}</span>
              </span>
            )}
            {e.belowTarget && (
              <Badge className="bg-success text-white">
                <Check data-icon="inline-start" />
                At target
              </Badge>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end justify-between border-l border-border pl-3 sm:pl-4">
          <Button variant="outline" size="sm" onClick={onAcquire}>
            <Check data-icon="inline-start" />I got it
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-destructive"
            aria-label="Remove from wishlist"
            onClick={onRemove}
          >
            <Trash2 />
          </Button>
        </div>
      </div>
    </Card>
  )
}

function PageHeader() {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-semibold tracking-tight">Wishlist</h1>
      <p className="text-sm text-muted-foreground">
        Models you&apos;re hunting, with target prices and market watch.
      </p>
    </div>
  )
}
