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
