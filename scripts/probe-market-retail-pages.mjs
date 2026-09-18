import { parseExactRetailPage, isAutoPublishableSnapshot } from "../lib/market/automation/exact-page-adapter.ts"

const raw = process.env.MARKET_RETAIL_PROBE_TARGETS
if (!raw) throw new Error("MARKET_RETAIL_PROBE_TARGETS is required")

const targets = JSON.parse(raw)
if (!Array.isArray(targets) || !targets.length) throw new Error("No retail probe targets")

const UA = "TrackDashMarketBot/1.0 (+https://trackdash.it)"
const timeoutMs = 15000

for (const target of targets) {
  const started = Date.now()
  const result = {
    slug: target.slug,
    url: target.url,
    itemNumber: target.itemNumber,
    ok: false,
    httpStatus: null,
    finalUrl: null,
    contentType: null,
    bytes: null,
    elapsedMs: null,
    snapshot: null,
    autoPublishable: false,
    error: null,
  }

  try {
    const response = await fetch(target.url, {
      redirect: "follow",
      cache: "no-store",
      headers: {
        "User-Agent": UA,
        "Accept": "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.8,it;q=0.6",
      },
      signal: AbortSignal.timeout(timeoutMs),
    })
    const body = await response.text()
    result.httpStatus = response.status
    result.finalUrl = response.url
    result.contentType = response.headers.get("content-type")
    result.bytes = Buffer.byteLength(body)
    result.elapsedMs = Date.now() - started

    if (!response.ok) throw new Error(`HTTP_${response.status}`)
    if (!(result.contentType || "").toLowerCase().includes("text/html")) {
      throw new Error(`UNEXPECTED_CONTENT_TYPE:${result.contentType || "unknown"}`)
    }

    const snapshot = parseExactRetailPage(body, {
      itemNumber: String(target.itemNumber),
      pageUrl: response.url,
    })
    result.snapshot = snapshot
    result.autoPublishable = isAutoPublishableSnapshot(snapshot)
    result.ok = true
  } catch (error) {
    result.elapsedMs = Date.now() - started
    result.error = error instanceof Error ? error.message : String(error)
  }

  console.log(JSON.stringify(result))
}
