"use client"

import * as React from "react"
import Image from "next/image"
import type { Product, ProductRelease } from "@/lib/types"
import { resolveDisplayImageUrl } from "@/lib/images/resolve"
import { ProductArt } from "@/components/product-art"
import { cn } from "@/lib/utils"

// Drop-in replacement for <ProductArt>: identical prop shape, so every
// existing call site (components/product-card.tsx,
// components/screens/*.tsx, components/add-item-dialogs.tsx, ...) swaps
// over with a pure import/rename change, no layout changes. See
// docs/IMAGES_MVP.md for why <ProductArt> stays in the codebase rather
// than being deleted — it's now this component's fallback/placeholder,
// used whenever there's no resolved URL (see lib/images/resolve.ts) or
// the real image fails to load.
//
// This component never lets a broken-image icon reach the screen: no URL
// resolves -> ProductArt renders directly, no <img>/<Image> attempted at
// all. A URL resolves but fails to load (404, dead host, ...) -> the
// error handler below swaps to ProductArt instead of leaving next/image's
// default broken state.
export function ProductImage({
  product,
  release,
  className,
  size = "md",
}: {
  product: Product
  release?: ProductRelease
  className?: string
  size?: "sm" | "md" | "lg"
}) {
  const url = resolveDisplayImageUrl(product, release)
  const [failed, setFailed] = React.useState(false)

  // Reset the "did this URL fail" flag whenever the resolved URL itself
  // changes (e.g. product-detail-screen.tsx switching which release is
  // selected) — without this, a failure recorded against a previous URL
  // would incorrectly keep showing the placeholder for a new, working one.
  React.useEffect(() => {
    setFailed(false)
  }, [url])

  if (!url || failed) {
    return <ProductArt product={product} release={release} className={className} size={size} />
  }

  const alt = release ? `${product.name} — ${release.editionName}` : product.name

  return (
    <div className={cn("relative overflow-hidden rounded-md bg-muted", className)}>
      <Image
        src={url}
        alt={alt}
        fill
        sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
        className="object-contain"
        onError={() => setFailed(true)}
      />
    </div>
  )
}
