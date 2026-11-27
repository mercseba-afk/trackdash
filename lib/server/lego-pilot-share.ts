import "server-only"

import { sql } from "drizzle-orm"
import { withUserContext } from "@/lib/db/rls"
import { getSpeedChampionsMessagingUser } from "@/lib/server/speed-champions-messaging-access"

export async function getLegoPilotShare(releaseId: string) {
  const user = await getSpeedChampionsMessagingUser()
  if (!user) return null

  const rows = await withUserContext(user.id, (tx) => tx.execute<{ id: string }>(sql`
    select s.id from public.collection_shares s
    join public.conversations c on c.release_id = s.release_id and c.owner_id = s.user_id
    where s.release_id = ${releaseId}::uuid and s.share_mode = 'open_to_offers'
      and c.requester_id = ${user.id}::uuid and c.request_message = 'Collaudo privato LEGO #75890'
      and c.collection_share_id is null
    limit 1
  `))
  return rows[0]?.id ?? null
}
