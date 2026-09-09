import "server-only"

import { sql } from "drizzle-orm"
import { db } from "../index"

export type CatalogLocalizedCopy = {
  productDescriptionIt: string | null
  releases: Record<string, { en: string | null; it: string | null }>
}

type CatalogCopyRow = {
  product_description_it: string | null
  release_id: string | null
  release_description: string | null
  release_description_it: string | null
}

/**
 * Localized editorial copy is intentionally queried separately from the
 * catalog identity mapper. `products.description` remains the English
 * compatibility field, while these newer columns let the public UI choose
 * the correct language without reusing provenance/audit notes as copy.
 * Missing localized copy stays NULL so the UI can fall back explicitly;
 * this query never fabricates or machine-translates catalog facts at runtime.
 */
export async function getCatalogLocalizedCopy(productId: string): Promise<CatalogLocalizedCopy> {
  const result = await db.execute(sql`
    select
      p.description_it as product_description_it,
      r.id::text as release_id,
      r.description as release_description,
      r.description_it as release_description_it
    from products p
    left join product_releases r on r.product_id = p.id
    where p.id = ${productId}::uuid
    order by r.release_year nulls last, r.release_date nulls last, r.item_number nulls last
  `)

  const rows = result as unknown as CatalogCopyRow[]
  const releases: CatalogLocalizedCopy["releases"] = {}

  for (const row of rows) {
    if (!row.release_id) continue
    releases[row.release_id] = {
      en: row.release_description,
      it: row.release_description_it,
    }
  }

  return {
    productDescriptionIt: rows[0]?.product_description_it ?? null,
    releases,
  }
}
