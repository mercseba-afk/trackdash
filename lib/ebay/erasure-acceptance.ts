import type { SupabaseClient } from "@supabase/supabase-js"
import type { EbayDeletionNotification } from "./account-deletion"
import { inboxIdentity } from "./erasure-inbox"
import { beforeDeadline, EbayRecoveryError } from "./account-deletion-recovery"

// The signature is checked by the route before calling this function. No
// plaintext identity is retained by the token-only database inbox.
export async function acceptEbayErasure(client: SupabaseClient,
  message: EbayDeletionNotification, deadline: number) {
  const identity=inboxIdentity(message)
  const {data,error}=await beforeDeadline(client.rpc("trackdash_ebay_accept_tokens",{
    p_key:identity.key,p_digest:identity.digest,p_digests:identity.digests,p_key_id:identity.keyId,p_identifiers:
    [message.identifiers.username,message.identifiers.userId,message.identifiers.eiasToken].filter(Boolean)})
    .retry(false).abortSignal(AbortSignal.timeout(Math.max(1,Math.min(5000,deadline-Date.now())))) as unknown as Promise<{data:any;error:any}>,deadline)
  if(error)throw new EbayRecoveryError("accept_tokens",/^(?:[A-Z0-9]{5}|PGRST[0-9]{3})$/.test(error.code??"")?error.code:"UNKNOWN")
  // A stale/misconfigured worker never earns a successful ACK, but the saved
  // obligation remains recoverable even if eBay never delivers it again.
  if(!data||!["received","erased","completed"].includes(data.state))throw new EbayRecoveryError("accept_tokens","INVALID")
  if(data.state!=="completed"&&(data.workerFresh!==true||process.env.EBAY_ERASURE_WORKER_ENABLED!=="true"))throw new EbayRecoveryError("accept_tokens","WORKER_STALE")
  return identity.key
}
