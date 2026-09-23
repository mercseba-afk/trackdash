// TrackDash collectible vertical registry.
//
// Keep this layer deliberately small: it identifies the independent catalog
// universes TrackDash can host while the underlying Product / Release /
// Collection / Wishlist / Market engines remain shared.
//
// Adding a vertical here does NOT make it public by itself. Routing, catalog
// data and onboarding are enabled separately so an experimental vertical can
// be prepared without changing the existing Mini 4WD experience.

export const COLLECTIBLE_VERTICALS = {
  mini4wd: {
    slug: "mini4wd",
    label: "Mini 4WD",
    brandSlug: "tamiya",
  },
  hotwheels: {
    slug: "hotwheels",
    label: "Hot Wheels",
    brandSlug: "mattel",
  },
} as const

export type CollectibleVertical = keyof typeof COLLECTIBLE_VERTICALS

export function isCollectibleVertical(value: string): value is CollectibleVertical {
  return value in COLLECTIBLE_VERTICALS
}

export function requireCollectibleVertical(value: string | null | undefined): CollectibleVertical {
  if (!value || !isCollectibleVertical(value)) {
    throw new Error(`Unsupported TrackDash collectible vertical: ${value ?? "missing"}`)
  }
  return value
}
