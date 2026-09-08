import "server-only"

import { eq } from "drizzle-orm"
import type { InferSelectModel } from "drizzle-orm"
import { db as defaultDb } from "../index"
import { profiles } from "../schema"
import type { Database } from "../types"

export type Profile = InferSelectModel<typeof profiles>

export async function getProfileById(userId: string, dbClient: Database = defaultDb) {
  return dbClient.query.profiles.findFirst({ where: eq(profiles.id, userId) })
}

export async function updateProfile(
  userId: string,
  patch: Partial<{
    username: string
    country: string | null
    preferredCurrency: string
    preferredLocale: string
  }>,
  dbClient: Database = defaultDb,
) {
  const [row] = await dbClient
    .update(profiles)
    .set({
      ...(patch.username !== undefined ? { username: patch.username } : {}),
      ...(patch.country !== undefined ? { country: patch.country } : {}),
      ...(patch.preferredCurrency !== undefined ? { preferredCurrency: patch.preferredCurrency } : {}),
      ...(patch.preferredLocale !== undefined ? { preferredLocale: patch.preferredLocale } : {}),
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, userId))
    .returning()

  return row
}
