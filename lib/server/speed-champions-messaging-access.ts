import "server-only"

import { cache } from "react"
import { sql } from "drizzle-orm"
import { getCurrentUser } from "@/lib/auth/current-user"
import { withUserContext } from "@/lib/db/rls"
import { speedChampionsSets } from "@/lib/lego/catalog"
import { getSpeedChampionsOwner } from "@/lib/server/speed-champions-gate"

export const getSpeedChampionsMessagingUser = cache(async () => {
  const owner = await getSpeedChampionsOwner()
  if (owner) return owner

  const user = await getCurrentUser()
  const pilot = speedChampionsSets.find((set) => set.setNumber === "75890")
  if (!user || !pilot) return null

  const isPilotParticipant = await withUserContext(user.id, async (tx) => {
    const rows = await tx.execute<{ allowed: boolean }>(sql`
      select exists (
        select 1 from public.conversations c
        where c.release_id = ${pilot.releaseId}::uuid
          and c.product_id = ${pilot.productId}::uuid
          and c.collection_share_id is null
          and c.requester_id = ${user.id}::uuid
          and c.request_message = 'Collaudo privato LEGO #75890'
      ) as allowed
    `)
    return rows[0]?.allowed === true
  })
  return isPilotParticipant ? user : null
})
