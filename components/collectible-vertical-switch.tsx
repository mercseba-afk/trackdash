"use client"

import { CatalogSelector } from "@/components/racing-studio/catalog-selector"

export type CollectibleUiVertical = "mini4wd" | "hotwheels" | "speedchampions"

export function CollectibleVerticalSwitch({ active: _active }: { active: CollectibleUiVertical }) {
  return <CatalogSelector className="app-catalog-selector" />
}
