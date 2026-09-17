"use client"

import Link from "next/link"
import { ArrowRight, Check, Heart, LockKeyhole } from "lucide-react"
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
  const releaseCount = product.releases.length

  return {
    year: product.originalReleaseYear ?? "—",
    chassisLabel: original.chassis
      ? original.chassis
      : (it ? "Da verificare" : "Pending"),
    releaseLabel: `${releaseCount} ${it ? (releaseCount === 1 ? "release" : "release") : (releaseCount === 1 ? "release" : "releases")}`,
    specialLabel: specialCount > 0
      ? `${specialCount} ${it ? (specialCount === 1 ? "edizione speciale" : "edizioni speciali") : (specialCount === 1 ? "special edition" : "special editions")}`
      : null,
  }
}

export function ProductCard({ product }: { product: Product }) {
  const { isInCollection, isInWishlist, user } = useStore()
  const { locale } = useI18n()
  const it = locale === "it"
  const owned = isInCollection(product.id)
  const wished = isInWishlist(product.id)
  const release = primaryRelease(product)
  const meta = getCatalogProductMeta(product, it)
  const href = `/catalog/${product.id}`
  const loginHref = `/login?next=${encodeURIComponent(href)}`

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_8px_26px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-[0_14px_34px_rgba(15,23,42,0.08)]">
      <Link href={href} className="relative block overflow-hidden border-b border-border/50 bg-gradient-to-br from-white via-muted/10 to-brand/5">
        <ProductImage
          product={product}
          release={release}
          className="aspect-[4/3] w-full transition-transform duration-300 group-hover:scale-[1.025]"
        />
        <span className="absolute right-2.5 top-2.5 inline-flex items-center rounded-full border border-white/80 bg-white/90 px-2 py-1 text-[10px] font-semibold text-foreground shadow-sm backdrop-blur-sm">
          {meta.releaseLabel}
        </span>
        {owned && (
          <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-success px-2 py-1 text-[10px] font-semibold text-white shadow-sm">
            <Check className="size-3" /> {it ? "In collezione" : "In collection"}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <Link href={href} className="min-w-0">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand/80">{product.series}</p>
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-[1.2rem] tracking-tight text-foreground transition-colors group-hover:text-brand sm:text-base sm:leading-5">
            {product.name}
          </h3>

          <div className="mt-3 grid grid-cols-2 gap-1.5">
            <span className="flex min-w-0 flex-col rounded-xl border border-border/60 bg-muted/20 px-2.5 py-2">
              <span className="text-[9px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{it ? "Prima uscita" : "First release"}</span>
              <strong className="mt-0.5 text-xs font-semibold tabular-nums text-foreground">{meta.year}</strong>
            </span>
            <span className="flex min-w-0 flex-col rounded-xl border border-border/60 bg-muted/20 px-2.5 py-2">
              <span className="text-[9px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Chassis</span>
              <strong className="mt-0.5 truncate text-xs font-semibold text-foreground">{meta.chassisLabel}</strong>
            </span>
          </div>

          {meta.specialLabel ? (
            <div className="mt-2">
              <span className="inline-flex rounded-full bg-brand/10 px-2.5 py-1 text-[10px] font-semibold text-brand">
                {meta.specialLabel}
              </span>
            </div>
          ) : null}
        </Link>

        <div className="mt-auto flex items-center gap-2 pt-3">
          {user ? (
            <AddToWishlistDialog product={product}>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label={it ? "Aggiungi ai desideri" : "Add to wishlist"}
                className={cn("shrink-0 rounded-xl bg-white", wished && "border-brand text-brand")}
              >
                <Heart className={cn(wished && "fill-brand")} />
              </Button>
            </AddToWishlistDialog>
          ) : (
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={it ? "Accedi per aggiungere ai desideri" : "Sign in to add to wishlist"}
              className="shrink-0 rounded-xl bg-white"
              render={<Link href={loginHref} />}
            >
              <LockKeyhole />
            </Button>
          )}
          <Button size="sm" className="flex-1 rounded-xl" render={<Link href={href} />}>
            {it ? "Vedi modello" : "View model"}
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </article>
  )
}
