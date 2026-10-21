import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import vm from "node:vm"
import ts from "typescript"
import { parseExactRetailPage, isAutoPublishableSnapshot } from "../lib/market/automation/exact-page-adapter.ts"

const source = readFileSync(new URL("../lib/market/automation/retail-source-canary.ts", import.meta.url), "utf8")
const exports = {}
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
  exports, AbortSignal, TextDecoder,
  require: (name) => {
    assert.equal(name, "./exact-page-adapter")
    return { parseExactRetailPage, isAutoPublishableSnapshot }
  },
})
const { probeBriosiRetailSource, BRIOSI_CANARY_URL, briosiCanaryEnabled } = exports
const now = 1792590000000
assert.equal(briosiCanaryEnabled(`briosi_public@${now + 600000}`, now), true)
assert.equal(briosiCanaryEnabled(`briosi_public@${now}`, now), false)
assert.equal(briosiCanaryEnabled(`briosi_public@${now + 3600000}`, now), false)
assert.equal(briosiCanaryEnabled("briosi_public", now), false)
assert.equal(briosiCanaryEnabled(undefined, now), false)
const html = (item = "18069") => `<h1>Tamiya ${item}</h1><script type="application/ld+json">${JSON.stringify({ "@type": "Product", name: `Tamiya ${item}`, sku: item, offers: { "@type": "Offer", price: "17.70", priceCurrency: "EUR", availability: "https://schema.org/InStock" } })}</script>`
let calls = 0
const good = await probeBriosiRetailSource(async (url, options) => {
  calls++
  assert.equal(url, BRIOSI_CANARY_URL)
  assert.equal(options.redirect, "error")
  assert.equal(options.cache, "no-store")
  assert.ok(options.signal)
  return new Response(html(), { headers: { "content-type": "text/html" } })
})
assert.equal(good.ok, true)
assert.equal(good.price, 17.7)
assert.equal(good.currency, "EUR")
assert.equal(good.availability, "in_stock")
assert.equal(calls, 1)
assert.equal((await probeBriosiRetailSource(async () => new Response(html("99999"), { headers: { "content-type": "text/html" } }))).ok, false)
calls = 0
const forbidden = await probeBriosiRetailSource(async () => { calls++; return new Response("blocked", { status: 403 }) })
assert.equal(forbidden.error, "HTTP_403")
assert.equal(calls, 1)
assert.equal((await probeBriosiRetailSource(async () => new Response("{}", { headers: { "content-type": "application/json" } }))).error, "EXPECTED_HTML")
assert.equal((await probeBriosiRetailSource(async () => new Response("x".repeat(250001), { headers: { "content-type": "text/html" } }))).error, "HTML_TOO_LARGE")
const redacted = await probeBriosiRetailSource(async () => { throw new Error("PRIVATE_TOKEN_MUST_NOT_LEAK") })
assert.equal(redacted.error, "SOURCE_FETCH_FAILED")
assert.ok(!JSON.stringify(redacted).includes("PRIVATE_TOKEN"))
console.log("6 source-canary checks passed: exact match, bounds, no redirects/retries, redacted failures")

const { retailCanarySource, probeRetailSource, RETAIL_CANARY_TARGETS } = exports
assert.equal(retailCanarySource(`plaza_japan_public@${now + 600000}`, now), "plaza_japan_public")
assert.equal(retailCanarySource(`unknown@${now + 600000}`, now), null)
assert.equal(retailCanarySource(`plaza_japan_public@${now}`, now), null)
assert.equal(retailCanarySource(`plaza_japan_public@${now + 3600000}`, now), null)
const plaza = await probeRetailSource("plaza_japan_public", async (url) => {
  assert.equal(url, RETAIL_CANARY_TARGETS.plaza_japan_public.url)
  return new Response(html() + " ".repeat(300000), { headers: { "content-type": "text/html" } })
})
assert.equal(plaza.ok, true)
const unavailable = await probeRetailSource("plaza_japan_public", async () => new Response(html().replace("schema.org/InStock", "schema.org/OutOfStock"), { headers: { "content-type": "text/html" } }))
assert.equal(unavailable.availability, "out_of_stock")
assert.equal((await probeRetailSource("plaza_japan_public", async () => new Response("x".repeat(750001), { headers: { "content-type": "text/html" } }))).error, "HTML_TOO_LARGE")
assert.equal((await probeRetailSource("https://untrusted.invalid", async () => { throw Error("must not fetch") })).error, "UNKNOWN_SOURCE")
console.log("Plaza canary checks passed: fixed allowlist, deadline, real-size page bound, unavailable preserved")
