"use client"

import Link from "next/link"
import { Check, Heart, Plus, RefreshCw } from "lucide-react"
import type { Product, ReleaseType } from "@/lib/types"
import { useStore } from "@/lib/store"
import { useI18n } from "@/lib/i18n"
import { primaryRelease } from "@/lib/data/products"
import { Button } from "@/components/ui/button"
import { ProductImage } from "@/components/catalog/product-image"
import { AddToCollectionDialog, AddToWishlistDialog } from "@/components/add-item-dialogs"
import { cn } from "@/lib/utils"

const COLLECTOR_RELEASE_TYPES = new Set<ReleaseType>([
  "Special Edition",
  "Limited Edition",
  "Anniversary Edition",
  "Japan Cup Edition",
  "Color Special",
  "Clear Body",
  "Premium",
])

export function getCatalogProductMeta(product: Product, it: boolean) {
  const original = primaryRelease(product)
  const specialCount = product.releases.filter((release) => COLLECTOR_RELEASE_TYPES.has(release.releaseType)).length

  const chassisLabel = original.chassis
    ? `${it ? "Chassis orig." : "Orig. chassis"} ${original.chassis}`
    : (it ? "Chassis da verificare" : "Chassis pending")

  const specialLabel = specialCount > 0
    ? `${specialCount} ${it ? (specialCount === 1 ? "speciale" : "speciali") : (specialCount === 1 ? "special" : "specials")}`
    : null

  return {
    debutLabel: `${it ? "Prima uscita" : "First release"} ${product.originalReleaseYear ?? "—"}`,
    chassisLabel,
    itemLabel: original.itemNumber ? `#${original.itemNumber}` : null,
    specialLabel,
  }
}

export function ProductCard({ product }: { product: Product }) {
  const { isInCollection, isInWishlist } = useStore()
  const { locale } = useI18n()
  const it = locale === "it"
  const owned = isInCollection(product.id)
  const wished = isInWishlist(product.id)
  const release = primaryRelease(product)
  const meta = getCatalogProductMeta(product, it)

  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md">
      <Link href={`/catalog/${product.id}`} className="relative block">
        <ProductImage product={product} release={release} className="aspect-[4/3] w-full" />
        {owned && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded bg-success px-1.5 py-0.5 text-[10px] font-semibold text-white">
            <Check className="size-3" /> {it ? "In collezione" : "In collection"}
          </span>
        )}
        {product.hasMultipleReleases && (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded bg-background/85 px-1.5 py-0.5 text-[10px] font-medium text-foreground backdrop-blur-sm">
            <RefreshCw className="size-3" /> {product.releases.length} release
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <Link href={`/catalog/${product.id}`} className="min-w-0">
          <p className="line-clamp-2 text-sm font-semibold leading-[1.15rem] hover:text-brand">
            {product.name}
          </p>
          <div className="mt-1.5 rounded-md bg-muted/35 px-2.5 py-2">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] leading-4">
              <span className="font-semibold text-foreground">{meta.debutLabel}</span>
              {meta.itemLabel ? <span className="font-mono text-muted-foreground">{meta.itemLabel}</span> : null}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className="rounded bg-background/70 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {meta.chassisLabel}
              </span>
              {meta.specialLabel ? (
                <span className="rounded bg-brand/10 px-1.5 py-0.5 text-[10px] font-semibold text-brand">
                  {meta.specialLabel}
                </span>
              ) : null}
            </div>
          </div>
        </Link>

        <div className="mt-auto flex items-center justify-end gap-1 pt-1.5">
          <AddToWishlistDialog product={product}>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={it ? "Aggiungi ai desideri" : "Add to wishlist"}
              className={cn(wished && "border-brand text-brand")}
            >
              <Heart className={cn(wished && "fill-brand")} />
            </Button>
          </AddToWishlistDialog>
          <AddToCollectionDialog product={product}>
            <Button size="icon-sm" aria-label={it ? "Aggiungi alla collezione" : "Add to collection"}>
              <Plus />
            </Button>
          </AddToCollectionDialog>
        </div>
      </div>
    </div>
  )
}
