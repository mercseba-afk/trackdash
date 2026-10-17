import type { SupabaseClient } from "@supabase/supabase-js"
import type { EbayDeletionNotification } from "./account-deletion"
import { inboxIdentity } from "./erasure-inbox"
import { beforeDeadline, EbayRecoveryError } from "./account-deletion-recovery"
import { validateReceipt, type ErasureJournal } from "./erasure-journal"

// The signature is checked by the route before calling this function. No
// ciphertext/plaintext identity is retained by the independent journal.
export async function acceptEbayErasure(client: SupabaseClient, journal: ErasureJournal,
  message: EbayDeletionNotification, deadline: number) {
  const identity=inboxIdentity(message)
  const {data,error}=await beforeDeadline(client.rpc("trackdash_ebay_prepare_tokens",{p_identifiers:
    [message.identifiers.username,message.identifiers.userId,message.identifiers.eiasToken].filter(Boolean)})
    .retry(false).abortSignal(AbortSignal.timeout(Math.max(1,Math.min(5000,deadline-Date.now())))) as unknown as Promise<{data:any;error:any}>,deadline)
  if(error)throw new EbayRecoveryError("prepare_tokens",/^(?:[A-Z0-9]{5}|PGRST[0-9]{3})$/.test(error.code??"")?error.code:"UNKNOWN")
  const receipt=validateReceipt({version:1,key:identity.key,digest:identity.digest,keyId:identity.keyId,tokens:data.tokens,sourceIds:data.sourceIds})
  await beforeDeadline(journal.put(receipt,identity.digests,deadline),deadline)
  // The independent journal is authoritative. A failed/absent primary registration cannot lose an
  // accepted job; the independent worker imports missing receipts after restore.
  return receipt.key
}
