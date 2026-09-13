"use client"

import Link from "next/link"
import { ArrowRight, Check, Heart, RefreshCw } from "lucide-react"
import type { Product, ReleaseType } from "@/lib/types"
import { useStore } from "@/lib/store"
import { useI18n } from "@/lib/i18n"
import { primaryRelease } from "@/lib/data/products"
import { Button } from "@/components/ui/button"
import { ProductImage } from "@/components/catalog/product-image"
import { AddToWishlistDialog } from "@/components/add-item-dialogs"
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

  return {
    year: product.originalReleaseYear ?? "—",
    itemLabel: original.itemNumber ? `#${original.itemNumber}` : "—",
    chassisLabel: original.chassis
      ? original.chassis
      : (it ? "Da verificare" : "Pending"),
    specialLabel: specialCount > 0
      ? `${specialCount} ${it ? (specialCount === 1 ? "edizione speciale" : "edizioni speciali") : (specialCount === 1 ? "special edition" : "special editions")}`
      : null,
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
  const href = `/catalog/${product.id}`

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-lg">
      <Link href={href} className="relative block overflow-hidden bg-muted/20">
        <ProductImage
          product={product}
          release={release}
          className="aspect-[4/3] w-full transition-transform duration-300 group-hover:scale-[1.025]"
        />
        {owned && (
          <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-success px-2 py-1 text-[10px] font-semibold text-white shadow-sm">
            <Check className="size-3" /> {it ? "In collezione" : "In collection"}
          </span>
        )}
        {product.hasMultipleReleases && (
          <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/90 px-2 py-1 text-[10px] font-semibold text-foreground shadow-sm backdrop-blur-sm">
            <RefreshCw className="size-3" /> {product.releases.length} release
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-3.5">
        <Link href={href} className="min-w-0">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-brand/80">{product.series}</p>
          <p className="line-clamp-2 text-[15px] font-semibold leading-[1.2rem] tracking-tight text-foreground transition-colors group-hover:text-brand">
            {product.name}
          </p>

          <div className="mt-2.5 grid grid-cols-2 gap-2 rounded-xl border border-border/60 bg-muted/25 p-2.5">
            <div className="min-w-0">
              <p className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">{it ? "Prima uscita" : "First release"}</p>
              <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">{meta.year}</p>
            </div>
            <div className="min-w-0 border-l border-border/60 pl-2">
              <p className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">{it ? "Codice originale" : "Original item"}</p>
              <p className="mt-0.5 truncate font-mono text-sm font-semibold text-foreground">{meta.itemLabel}</p>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">
              Chassis {meta.chassisLabel}
            </span>
            {meta.specialLabel ? (
              <span className="rounded-full bg-brand/10 px-2 py-1 text-[10px] font-semibold text-brand">
                {meta.specialLabel}
              </span>
            ) : null}
          </div>
        </Link>

        <div className="mt-auto flex items-center gap-2 pt-3">
          <AddToWishlistDialog product={product}>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={it ? "Aggiungi ai desideri" : "Add to wishlist"}
              className={cn("shrink-0 rounded-xl", wished && "border-brand text-brand")}
            >
              <Heart className={cn(wished && "fill-brand")} />
            </Button>
          </AddToWishlistDialog>
          <Button size="sm" className="flex-1 rounded-xl" render={<Link href={href} />}>
            {it ? "Vedi modello" : "View model"}
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
