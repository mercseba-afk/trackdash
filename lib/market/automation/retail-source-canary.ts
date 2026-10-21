import { isAutoPublishableSnapshot, parseExactRetailPage } from "./exact-page-adapter"

// Read-only preflight for an existing, independently verified exact endpoint.
// No caller-controlled URL, credentials, database writes, retries or promotion.
export const BRIOSI_CANARY_URL = "https://www.briosigiocattoli.it/product/6058/Mini-4wd-Dash1-Emperor-superII-18069"
const MAX_BYTES = 250_000

export async function probeBriosiRetailSource(fetchPage: typeof fetch = fetch) {
  try {
    const response = await fetchPage(BRIOSI_CANARY_URL, {
      redirect: "error",
      cache: "no-store",
      headers: { Accept: "text/html", "User-Agent": "TrackDashMarketBot/1.0 (+https://trackdash.it)" },
      signal: AbortSignal.timeout(12_000),
    })
    if (!response.ok) return { ok: false, source: "briosi_public", error: `HTTP_${response.status}` }
    if (!response.headers.get("content-type")?.toLowerCase().includes("text/html")) {
      return { ok: false, source: "briosi_public", error: "EXPECTED_HTML" }
    }
    if (!response.body) return { ok: false, source: "briosi_public", error: "EMPTY_BODY" }
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let bytes = 0
    let html = ""
    try {
      while (true) {
        const chunk = await reader.read()
        if (chunk.done) break
        bytes += chunk.value.byteLength
        if (bytes > MAX_BYTES) {
          await reader.cancel()
          return { ok: false, source: "briosi_public", error: "HTML_TOO_LARGE" }
        }
        html += decoder.decode(chunk.value, { stream: true })
      }
      html += decoder.decode()
    } finally {
      reader.releaseLock()
    }
    const snapshot = parseExactRetailPage(html, { itemNumber: "18069", pageUrl: BRIOSI_CANARY_URL })
    return {
      ok: isAutoPublishableSnapshot(snapshot),
      source: "briosi_public",
      itemNumber: "18069",
      price: snapshot.price,
      currency: snapshot.currency,
      availability: snapshot.availability,
      warnings: snapshot.warnings,
    }
  } catch {
    // Never expose arbitrary network errors, response bodies or request headers.
    return { ok: false, source: "briosi_public", error: "SOURCE_FETCH_FAILED" }
  }
}
