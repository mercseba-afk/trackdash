import "server-only"

import { getProductById as getProductByIdQuery, listProductsForVertical as listProductsForVerticalQuery, listProductsByIds as listProductsByIdsQuery } from "@/lib/db/queries/catalog"
import type { CollectibleVertical } from "@/lib/verticals"
import { mapProductRow } from "./mappers"

// Not "use server" — these are read-only fetchers called from Server
// Components (app/catalog/page.tsx, app/catalog/[id]/page.tsx), not
// client-invoked mutations, so a plain server-only async function is the
// right shape (no serialization boundary needed).

function isCatalogVisible(row: { metadata: unknown }) {
  const metadata = row.metadata
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return true
  return (metadata as Record<string, unknown>).catalog_visibility !== "archived"
}

export async function fetchCatalogProductsForVertical(vertical: CollectibleVertical) {
  const rows = await listProductsForVerticalQuery(vertical, 500)
  return rows.filter(isCatalogVisible).map(mapProductRow)
}

export async function fetchCatalogProducts() {
  return fetchCatalogProductsForVertical("mini4wd")
}

export async function fetchCatalogProductsByIds(ids: string[]) {
  const rows = await listProductsByIdsQuery(ids)
  return rows.map(mapProductRow)
}

export async function fetchCatalogProductById(id: string) {
  const row = await getProductByIdQuery(id)
  if (!row) return null
  return mapProductRow(row)
}
