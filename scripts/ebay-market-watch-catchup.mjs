import { readFileSync } from "node:fs"
import { pathToFileURL } from "node:url"
import { diagnoseScanResponse } from "./ebay-market-watch-diagnostics.mjs"

// Follow-ups are NEW queue claims, never retries. The DB claim RPC owns the
// atomic 24-attempt Rome-day allowance, including failures and abandoned claims.
export async function continueCatchup(initialBody, {
  token, url, maxCalls = 4, fetchImpl = fetch, now = Date.now,
  emit = (value) => console.log(JSON.stringify(value)),
} = {}) {
  const limit = Math.max(1, Math.min(4, Math.floor(Number(maxCalls) || 4)))
  let body = initialBody
  const deadline = now() + 180_000
  let calls = 1
  while (calls < limit) {
    const diagnostic = diagnoseScanResponse({ httpStatus: 200, body })
    if (!diagnostic.ok) throw new Error("CATCHUP_INVALID_INITIAL_RESULT")
    const payload = JSON.parse(body)
    if (payload.catchupVersion !== 1) throw new Error("CATCHUP_PROTOCOL_NOT_DEPLOYED")
    const attempted = payload.lanes?.ebayActive?.summary?.attempted ?? payload.result?.attempted
    if (!Number.isSafeInteger(attempted) || attempted < 0 || attempted > 1) throw new Error("CATCHUP_INVALID_EBAY_COUNT")
    if (attempted === 0 || deadline - now() < 75_000) break
    const target = new URL(url)
    if (target.origin !== "https://trackdash.it" || target.pathname !== "/api/cron/ebay-scan") throw new Error("CATCHUP_INVALID_TARGET")
    target.search = "?lane=ebay"
    let response
    try {
      response = await fetchImpl(target, {
        headers: { authorization: `Bearer ${token}`, accept: "application/json" },
        redirect: "error", signal: AbortSignal.timeout(75_000),
      })
      body = await response.text()
      if (body.length > 1_048_576) throw new Error("OVERSIZED_RESPONSE")
    } catch {
      emit({ ok: false, reason: "CATCHUP_TRANSPORT_ERROR", call: calls + 1 })
      throw new Error("CATCHUP_TRANSPORT_ERROR")
    }
    calls++
    const result = diagnoseScanResponse({ httpStatus: response.status, body })
    emit({ ...result, call: calls })
    if (!result.ok) throw new Error("CATCHUP_SCAN_FAILED")
  }
  return calls
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await continueCatchup(readFileSync(process.argv[2], "utf8"), {
      token: process.env.TRACKDASH_SCAN_TOKEN,
      url: process.env.SCAN_URL,
      maxCalls: process.env.TRACKDASH_SCAN_MAX_CALLS ?? 4,
    })
  } catch {
    // Never echo exceptions, response bodies, URLs, tokens or seller details.
    console.error("CATCHUP_STOPPED")
    process.exitCode = 1
  }
}
