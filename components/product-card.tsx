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
  const chassis = Array.from(
    new Set(product.releases.map((release) => release.chassis).filter((value): value is NonNullable<typeof value> => Boolean(value))),
  )
  const specialCount = product.releases.filter((release) => COLLECTOR_RELEASE_TYPES.has(release.releaseType)).length

  const chassisLabel = chassis.length === 0
    ? (it ? "Chassis da verificare" : "Chassis pending")
    : chassis.length === 1
      ? `Chassis ${chassis[0]}`
      : `${chassis.length} chassis`

  const specialLabel = specialCount > 0
    ? `${specialCount} ${it ? (specialCount === 1 ? "speciale" : "speciali") : (specialCount === 1 ? "special" : "specials")}`
    : null

  return {
    debutLabel: `${it ? "Debutto" : "Debut"} ${product.originalReleaseYear ?? "—"}`,
    chassisLabel,
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
            <Check className="size-3" /> {it ? "Posseduto" : "Owned"}
          </span>
        )}
        {product.hasMultipleReleases && (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded bg-background/85 px-1.5 py-0.5 text-[10px] font-medium text-foreground backdrop-blur-sm">
            <RefreshCw className="size-3" /> {product.releases.length} release
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <Link href={`/catalog/${product.id}`} className="min-w-0">
          <p className="line-clamp-2 min-h-9 text-sm font-semibold leading-[1.15rem] hover:text-brand">
            {product.name}
          </p>
          <div className="mt-1 min-h-10 space-y-0.5 text-xs leading-4 text-muted-foreground">
            <p>{meta.debutLabel}</p>
            <p className="truncate">
              {meta.chassisLabel}{meta.specialLabel ? ` · ${meta.specialLabel}` : ""}
            </p>
          </div>
        </Link>

        <div className="mt-auto flex items-center justify-end gap-1 pt-1">
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
