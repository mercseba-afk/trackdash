import { inboxIdentity, openInbox, sealInbox } from "./erasure-inbox"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { EbayDeletionNotification } from "./account-deletion"
import { MarketR3Repository } from "@/lib/market/pipeline/market-r3-repository"
import { recomputeReleaseMarketSignal } from "@/lib/market/pipeline/market-r3-service"
import { loadConfirmedTrackDashSales } from "@/lib/market/pipeline/trackdash-sales"
import type { MarketCondition } from "@/lib/market/pipeline/types"

import { bufferedPublication, type PublicationWrite } from "@/lib/market/pipeline/publication-buffer"
export { bufferedPublication } from "@/lib/market/pipeline/publication-buffer"
interface Claim { state: string; releaseId: string; condition: MarketCondition; generation: number; token: string }
export class EbayRecoveryError extends Error {
  constructor(readonly operation: string, readonly sqlCode = "UNKNOWN") {
    super("EBAY_ERASURE_RECOVERY_FAILED")
  }
}

export const notificationIdentity = inboxIdentity

export async function beforeDeadline<T>(work: Promise<T>, deadline: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([work, new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new EbayRecoveryError("deadline", "DEADLINE")), Math.max(0, deadline - Date.now()))
    })])
  } finally { clearTimeout(timer) }
}

export function deadlineFetch(deadline: number, fetchImpl: typeof fetch = fetch,
  report: (operation: string, code: string, elapsed: number) => void = () => {}): typeof fetch {
  return async (input, init) => {
    const started = Date.now()
    const remaining = Math.min(12_000, deadline - started)
    if (remaining <= 0) throw new EbayRecoveryError("http", "DEADLINE")
    // Never log URL query strings, request bodies, identifiers or error messages.
    const path = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url).pathname
    const operation = path.startsWith("/rest/v1/") ? "db_operation"
      : path.includes("oauth2") ? "ebay_oauth" : "ebay_public_key"
    report(operation, "START", 0)
    try {
      const response = await beforeDeadline(fetchImpl(input, { ...init, signal: AbortSignal.any([
        AbortSignal.timeout(remaining), ...(init?.signal ? [init.signal] : []),
      ]) }), started + remaining)
      let code = String(response.status)
      if (!response.ok && path.startsWith("/rest/v1/")) {
        const diagnostic = await response.clone().json().catch(() => null)
        if (/^(?:[A-Z0-9]{5}|PGRST[0-9]{3})$/.test(diagnostic?.code ?? "")) code = diagnostic.code
      }
      report(operation, code, Date.now() - started)
      return response
    } catch {
      report(operation, "TRANSPORT", Date.now() - started)
      throw new EbayRecoveryError(operation, "TRANSPORT")
    }
  }
}

export async function computeErasurePublication(client: SupabaseClient, claim: Claim): Promise<PublicationWrite[]> {
  const buffered = bufferedPublication(client)
  const repo = new MarketR3Repository(buffered.client)
  repo.beginPublication = async () => null
  await recomputeReleaseMarketSignal(claim.releaseId, claim.condition, new Date(),
    repo,
    (releaseId, condition) => loadConfirmedTrackDashSales(releaseId, condition, buffered.client))
  return buffered.writes
}

export async function eraseEbayUserData(
  client: SupabaseClient,
  message: EbayDeletionNotification,
  deadline: number,
  report: (operation: string, code: string, elapsed: number) => void,
  compute = computeErasurePublication,
): Promise<boolean> {
  const inbox = sealInbox(message)
  const { key, digest } = inbox
  const rpc = recoveryRpc(client, key, digest, deadline, report)
  let state = await rpc("register", { sealed: inbox.sealed, digests: inbox.digests })
  if (state.state === "completed") return true
  if (state.state === "received") {
    state = await rpc("erase", { identifiers: [message.identifiers.username,
      message.identifiers.userId, message.identifiers.eiasToken].filter(Boolean) })
  }
  if (state.state === "completed") return true
  return drainRecomputes(client, rpc, deadline, report, compute)
}

// A future approved worker can recover already-erased jobs using only ledger
// hashes. No signed payload, personal identifiers or new erasure is needed.
export async function resumeEbayErasureJob(
  client: SupabaseClient,
  identity: { key: string; digest: string },
  deadline: number,
  report: (operation: string, code: string, elapsed: number) => void,
  compute = computeErasurePublication,
): Promise<boolean> {
  const rpc = recoveryRpc(client, identity.key, identity.digest, deadline, report)
  const state = await rpc("status")
  if (state.state === "completed") return true
  if (state.state === "received") {
    if (!state.sealed) throw new EbayRecoveryError("inbox", "EMPTY")
    if (state.sealed.kind === "tokens-v1") {
      const { error } = await beforeDeadline(client.rpc("trackdash_ebay_apply_tokens", {p_key:identity.key,p_digest:identity.digest})
        .retry(false).abortSignal(AbortSignal.timeout(Math.max(1,Math.min(12_000,deadline-Date.now())))) as unknown as Promise<{error:any}>,deadline)
      if (error) {
        const phases=new Set(["token_validation","suppression","market_candidates","market_offer_states","price_points","market_aggregate_observations","market_monthly_source_stats","outbox"])
        throw new EbayRecoveryError(phases.has(error.details)?error.details:"apply_tokens",/^(?:[A-Z0-9]{5}|PGRST[0-9]{3})$/.test(error.code??"")?error.code:"UNKNOWN")
      }
    } else await rpc("erase", { identifiers: openInbox(identity.key, state.sealed) })
  }
  return drainRecomputes(client, rpc, deadline, report, compute)
}

function recoveryRpc(client: SupabaseClient, key: string, digest: string, deadline: number,
  report: (operation: string, code: string, elapsed: number) => void) {
  return async (operation: string, data: object = {}) => {
    const started = Date.now()
    if (started >= deadline) throw new EbayRecoveryError(operation, "DEADLINE")
    report(operation, "START", 0)
    try {
      const result = await client.rpc("trackdash_ebay_erasure", {
        p_action: operation, p_key: key, p_digest: digest, p_data: data,
      }).retry(false).abortSignal(AbortSignal.timeout(Math.max(1, Math.min(12_000, deadline - started))))
      if (result.error) {
        const sqlCode = /^(?:[A-Z0-9]{5}|PGRST[0-9]{3})$/.test(result.error.code ?? "") ? result.error.code : "UNKNOWN"
        const phases = new Set(["register", "notification_lock", "suppression", "source_lookup", "candidates", "offers", "price_points", "aggregates", "monthly", "outbox", "claim", "publish"])
        const phase = phases.has(result.error.details ?? "") ? result.error.details : operation
        throw new EbayRecoveryError(phase, sqlCode)
      }
      if (operation === "register" && result.data?.digest) digest = result.data.digest
      report(operation, "OK", Date.now() - started)
      return result.data
    } catch (error) {
      const safe = error instanceof EbayRecoveryError ? error : new EbayRecoveryError(operation, "TRANSPORT")
      report(safe.operation, safe.sqlCode, Date.now() - started)
      throw safe
    }
  }
}

async function drainRecomputes(client: SupabaseClient, rpc: ReturnType<typeof recoveryRpc>, deadline: number,
  report: (operation: string, code: string, elapsed: number) => void, compute: typeof computeErasurePublication) {
  let state
  // Bound work per delivery; this is unrelated to scanner cadence/batch sizes.
  for (let processed = 0; processed < 4 && Date.now() < deadline - 12_000; processed++) {
    const claim = await rpc("claim") as Claim
    if (claim.state === "completed") return true
    if (claim.state !== "claimed") return false
    const started = Date.now()
    report("recompute", "START", 0)
    let writes: PublicationWrite[]
    try {
      writes = await beforeDeadline(compute(client, claim), deadline)
      if (Date.now() >= deadline) throw new EbayRecoveryError("recompute", "DEADLINE")
      report("recompute", "OK", Date.now() - started)
    } catch (error) {
      const code = error instanceof EbayRecoveryError ? error.sqlCode : "UNKNOWN"
      report("recompute", code, Date.now() - started)
      throw new EbayRecoveryError("recompute", code)
    }
    state = await rpc("publish", { ...claim, writes })
    if (state.state === "completed") return true
  }
  return false
}
