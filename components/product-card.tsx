"use client"

import Link from "next/link"
import { ArrowRight, Check, Heart } from "lucide-react"
import { AddToWishlistDialog } from "@/components/add-item-dialogs"
import { ProductImage } from "@/components/catalog/product-image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { primaryRelease } from "@/lib/data/products"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import type { Product, ReleaseType } from "@/lib/types"
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
    chassisLabel: original.chassis ?? (it ? "Da verificare" : "Pending"),
    specialCount,
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
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#d8e3f0] bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#b8cbea] hover:shadow-md">
      <Link href={href} className="relative block overflow-hidden bg-[#f6f8fb] p-2">
        <ProductImage
          product={product}
          release={release}
          className="aspect-[4/3] w-full rounded-xl transition-transform duration-300 group-hover:scale-[1.02]"
        />
        {owned ? (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#138a5b] px-2 py-1 text-[10px] font-semibold text-white shadow-sm">
            <Check className="size-3" /> {it ? "In collezione" : "In collection"}
          </span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link href={href} className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#0f4bb4]">{product.series}</p>
          <h3 className="mt-1 line-clamp-2 text-[16px] font-semibold leading-5 tracking-tight text-[#081a3a] transition-colors group-hover:text-[#0f4bb4]">
            {product.name}
          </h3>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="border-[#d4deea] bg-[#fbfcfe] text-[10px] font-medium text-[#607089]">
              {it ? "Prima uscita" : "First release"} {meta.year}
            </Badge>
            <Badge variant="outline" className="border-[#d4deea] bg-[#fbfcfe] text-[10px] font-medium text-[#607089]">
              {meta.chassisLabel}
            </Badge>
          </div>
        </Link>

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#e5ebf2] pt-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#1b2f4d]">
              {product.releases.length} {it ? (product.releases.length === 1 ? "Release" : "Release") : (product.releases.length === 1 ? "Release" : "Releases")}
            </p>
            {meta.specialCount > 0 ? (
              <p className="mt-0.5 truncate text-[10px] text-[#7a8aa0]">
                {meta.specialCount} {it ? (meta.specialCount === 1 ? "edizione speciale" : "edizioni speciali") : (meta.specialCount === 1 ? "special edition" : "special editions")}
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {user ? (
              <AddToWishlistDialog product={product}>
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label={it ? "Aggiungi alla Wishlist" : "Add to Wishlist"}
                  className={cn("rounded-xl border-[#d4deea]", wished && "border-[#1558e8] text-[#1558e8]")}
                >
                  <Heart className={cn(wished && "fill-current")} />
                </Button>
              </AddToWishlistDialog>
            ) : (
              <Button
                variant="outline"
                size="icon-sm"
                render={<Link href={loginHref} />}
                aria-label={it ? "Accedi per usare la Wishlist" : "Sign in to use Wishlist"}
                className="rounded-xl border-[#d4deea]"
              >
                <Heart />
              </Button>
            )}
            <Button size="icon-sm" render={<Link href={href} />} aria-label={it ? "Vedi modello" : "View model"} className="rounded-xl">
              <ArrowRight />
            </Button>
          </div>
        </div>
      </div>
    </article>
  )
}
