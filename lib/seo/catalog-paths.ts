import type { Product, ProductRelease } from "@/lib/types"

export type CollectionIntent = "collection" | "wishlist"

export function slugifyPublicSegment(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-")
}

export function productPublicSlug(product: Pick<Product, "name">): string {
  return slugifyPublicSegment(product.name)
}

export function releasePublicSlug(
  release: Pick<ProductRelease, "itemNumber" | "editionName" | "releaseYear">,
): string {
  const item = release.itemNumber?.trim()
  const edition = slugifyPublicSegment(release.editionName)

  if (item) return slugifyPublicSegment(`${item}-${edition}`)
  if (release.releaseYear) return slugifyPublicSegment(`${edition}-${release.releaseYear}`)
  return edition
}

export function productPublicPath(product: Pick<Product, "name">): string {
  return `/catalog/${productPublicSlug(product)}`
}

export function releasePublicPath(
  product: Pick<Product, "name">,
  release: Pick<ProductRelease, "itemNumber" | "editionName" | "releaseYear">,
): string {
  return `${productPublicPath(product)}/releases/${releasePublicSlug(release)}`
}

export function withCollectionIntent(path: string, intent: CollectionIntent): string {
  const separator = path.includes("?") ? "&" : "?"
  return `${path}${separator}intent=${intent}`
}
