import "server-only"

import { and, eq } from "drizzle-orm"
import { db } from "../index"
import { collectionShares } from "../schema"
import type { Condition, Currency } from "@/lib/types"

export type PublicReleaseOffer = {
  id: string
  username: string
  condition: Condition
  askingPrice: number | null
  askingCurrency: Currency | null
  updatedAt: string
}

// Public release pages may surface only copies whose owner explicitly opted
// into "open_to_offers". Keep the projection deliberately narrow: no private
// collection row, acquisition data, user id, email, notes or storage paths.
export async function getPublicOpenOffersForRelease(releaseId: string): Promise<PublicReleaseOffer[]> {
  const rows = await db.query.collectionShares.findMany({
    where: and(
      eq(collectionShares.releaseId, releaseId),
      eq(collectionShares.shareMode, "open_to_offers"),
    ),
    columns: {
      id: true,
      condition: true,
      askingPrice: true,
      askingCurrency: true,
      updatedAt: true,
    },
    with: {
      collector: {
        columns: {
          username: true,
        },
      },
    },
    orderBy: (fields, { desc }) => [desc(fields.updatedAt)],
  })

  return rows.map((row) => ({
    id: row.id,
    username: row.collector.username,
    condition: row.condition as Condition,
    askingPrice: row.askingPrice ? Number(row.askingPrice) : null,
    askingCurrency: (row.askingCurrency as Currency | null) ?? null,
    updatedAt: row.updatedAt.toISOString(),
  }))
}
