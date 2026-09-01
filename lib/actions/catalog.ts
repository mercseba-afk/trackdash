import "server-only"

import { getProductById as getProductByIdQuery, listProducts as listProductsQuery } from "@/lib/db/queries/catalog"
import { mapProductRow } from "./mappers"

// Not "use server" — these are read-only fetchers called from Server
// Components (app/catalog/page.tsx, app/catalog/[id]/page.tsx), not
// client-invoked mutations, so a plain server-only async function is the
// right shape (no serialization boundary needed).

export async function fetchCatalogProducts() {
  const rows = await listProductsQuery(500)
  return rows.map(mapProductRow)
}

export async function fetchCatalogProductById(id: string) {
  const row = await getProductByIdQuery(id)
  if (!row) return null
  return mapProductRow(row)
}
