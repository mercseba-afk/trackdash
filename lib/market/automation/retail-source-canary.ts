import { isAutoPublishableSnapshot, parseExactRetailPage } from "./exact-page-adapter"

// Read-only preflight for an existing, independently verified exact endpoint.
// No caller-controlled URL, credentials, database writes, retries or promotion.
export const BRIOSI_CANARY_URL = "https://www.briosigiocattoli.it/product/6058/Mini-4wd-Dash1-Emperor-superII-18069"
export const RETAIL_CANARY_TARGETS = {
  briosi_public: { url: BRIOSI_CANARY_URL, itemNumber: "18069", maxBytes: 250_000 },
  plaza_japan_public: { url: "https://www.plazajapan.com/4950344063871/", itemNumber: "18069", maxBytes: 750_000 },
} as const
export type RetailCanarySource = keyof typeof RETAIL_CANARY_TARGETS

export function retailCanarySource(value: string | undefined, now = Date.now()): RetailCanarySource | null {
  const match = /^(briosi_public|plaza_japan_public)@(\d{13})$/.exec(value ?? "")
  if (!match) return null
  const expiresAt = Number(match[2])
  return expiresAt > now && expiresAt - now <= 15 * 60 * 1000 ? match[1] as RetailCanarySource : null
}

export function briosiCanaryEnabled(value: string | undefined, now = Date.now()): boolean {
  return retailCanarySource(value, now) === "briosi_public"
}

export async function probeBriosiRetailSource(fetchPage: typeof fetch = fetch) {
  return probeRetailSource("briosi_public", fetchPage)
}

export async function probeRetailSource(source: RetailCanarySource, fetchPage: typeof fetch = fetch) {
  const target = RETAIL_CANARY_TARGETS[source]
  if (!target) return { ok: false, error: "UNKNOWN_SOURCE" }

  try {
    const response = await fetchPage(target.url, {
      redirect: "error",
      cache: "no-store",
      headers: { Accept: "text/html", "User-Agent": "TrackDashMarketBot/1.0 (+https://trackdash.it)" },
      signal: AbortSignal.timeout(12_000),
    })
    if (!response.ok) return { ok: false, source, error: `HTTP_${response.status}` }
    if (!response.headers.get("content-type")?.toLowerCase().includes("text/html")) {
      return { ok: false, source, error: "EXPECTED_HTML" }
    }
    if (!response.body) return { ok: false, source, error: "EMPTY_BODY" }
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let bytes = 0
    let html = ""
    try {
      while (true) {
        const chunk = await reader.read()
        if (chunk.done) break
        bytes += chunk.value.byteLength
        if (bytes > target.maxBytes) {
          await reader.cancel()
          return { ok: false, source, error: "HTML_TOO_LARGE" }
        }
        html += decoder.decode(chunk.value, { stream: true })
      }
      html += decoder.decode()
    } finally {
      reader.releaseLock()
    }
    const snapshot = parseExactRetailPage(html, { itemNumber: target.itemNumber, pageUrl: target.url })
    return {
      ok: isAutoPublishableSnapshot(snapshot),
      source,
      itemNumber: target.itemNumber,
      price: snapshot.price,
      currency: snapshot.currency,
      availability: snapshot.availability,
      warnings: snapshot.warnings,
    }
  } catch {
    // Never expose arbitrary network errors, response bodies or request headers.
    return { ok: false, source, error: "SOURCE_FETCH_FAILED" }
  }
}
