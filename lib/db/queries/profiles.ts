import "server-only"

import { eq } from "drizzle-orm"
import type { InferSelectModel } from "drizzle-orm"
import { db } from "../index"
import { profiles } from "../schema"

export type Profile = InferSelectModel<typeof profiles>

export async function getProfileById(userId: string) {
  return db.query.profiles.findFirst({ where: eq(profiles.id, userId) })
}
