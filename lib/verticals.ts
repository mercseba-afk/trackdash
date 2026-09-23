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
    brandId: "382feca9-48e9-5144-a92d-41f77fb7e438",
    categoryId: "cd755fcb-2bc5-5975-8ec0-f45e7df891cc",
    basePath: "",
    publicEnabled: true,
  },
  hotwheels: {
    slug: "hotwheels",
    label: "Hot Wheels",
    brandSlug: "mattel",
    brandId: "6f100164-74bd-56bd-9dd1-221ea269ed8a",
    categoryId: "cdaaff01-f4f9-52ff-951a-ddbbba542d5c",
    basePath: "/hotwheels",
    publicEnabled: false,
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
