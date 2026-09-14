import assert from "node:assert/strict"
import {
  isAutoPublishableSnapshot,
  parseExactRetailPage,
} from "../lib/market/automation/exact-page-adapter.ts"

let passed = 0
function ok(name, fn) {
  fn()
  passed += 1
  console.log(`ok: ${name}`)
}

ok("direct JSON-LD Offer with exact item number is publishable", () => {
  const html = `
    <html><head><title>Tamiya 95467 Dyna-Hawk GX</title>
    <script type="application/ld+json">{
      "@context":"https://schema.org",
      "@type":"Product",
      "name":"Tamiya 95467 Dyna-Hawk GX Super XX Special",
      "offers":{"@type":"Offer","price":"25.30","priceCurrency":"USD","availability":"https://schema.org/InStock"}
    }</script></head><body>Tamiya item 95467</body></html>`
  const snapshot = parseExactRetailPage(html, { itemNumber: "95467", pageUrl: "https://example.test/95467" })
  assert.equal(snapshot.price, 25.3)
  assert.equal(snapshot.currency, "USD")
  assert.equal(snapshot.availability, "in_stock")
  assert.equal(snapshot.confidence, "structured")
  assert.equal(snapshot.itemNumberSeen, true)
  assert.equal(isAutoPublishableSnapshot(snapshot), true)
})

ok("sold-out structured retailer price stays parseable but unavailable", () => {
  const html = `<html><body>18074<script type="application/ld+json">{
    "@type":"Product","name":"Tamiya 18074 Proto Emperor Premium",
    "offers":{"@type":"Offer","price":11.8,"priceCurrency":"USD","availability":"https://schema.org/OutOfStock"}
  }</script></body></html>`
  const snapshot = parseExactRetailPage(html, { itemNumber: "18074", pageUrl: "https://example.test/18074" })
  assert.equal(snapshot.price, 11.8)
  assert.equal(snapshot.availability, "out_of_stock")
  assert.equal(isAutoPublishableSnapshot(snapshot), true)
})

ok("aggregate low price never auto-publishes", () => {
  const html = `<html><body>95335<script type="application/ld+json">{
    "@type":"Product","name":"Tamiya 95335 Proto Emperor ZX Premium",
    "offers":{"@type":"AggregateOffer","lowPrice":"1.99","highPrice":"40.00","priceCurrency":"EUR","offerCount":12}
  }</script></body></html>`
  const snapshot = parseExactRetailPage(html, { itemNumber: "95335", pageUrl: "https://example.test/95335" })
  assert.equal(snapshot.price, null)
  assert.equal(snapshot.warnings.includes("AGGREGATE_OFFER_ONLY"), true)
  assert.equal(isAutoPublishableSnapshot(snapshot), false)
})

ok("meta price fallback works only with explicit currency", () => {
  const html = `<html><head>
    <meta property="og:title" content="Tamiya 94717 Dyna Hawk">
    <meta property="product:price:amount" content="36,40">
    <meta property="product:price:currency" content="EUR">
    <meta property="product:availability" content="out of stock">
  </head><body>94717</body></html>`
  const snapshot = parseExactRetailPage(html, { itemNumber: "94717", pageUrl: "https://example.test/94717" })
  assert.equal(snapshot.price, 36.4)
  assert.equal(snapshot.currency, "EUR")
  assert.equal(snapshot.availability, "out_of_stock")
  assert.equal(snapshot.confidence, "meta")
  assert.equal(isAutoPublishableSnapshot(snapshot), true)
})

ok("missing exact item number quarantines otherwise valid price", () => {
  const html = `<html><body><script type="application/ld+json">{
    "@type":"Product","name":"Dyna-Hawk special",
    "offers":{"@type":"Offer","price":"9.99","priceCurrency":"EUR","availability":"https://schema.org/InStock"}
  }</script></body></html>`
  const snapshot = parseExactRetailPage(html, { itemNumber: "95467", pageUrl: "https://example.test/wrong" })
  assert.equal(snapshot.itemNumberSeen, false)
  assert.equal(snapshot.warnings.includes("ITEM_NUMBER_NOT_FOUND_ON_PAGE"), true)
  assert.equal(isAutoPublishableSnapshot(snapshot), false)
})

ok("random textual currency is not scraped as a price", () => {
  const html = `<html><head><title>Tamiya 18038</title></head><body>
    Item 18038. Recommended related parts from EUR 2.50 to EUR 120.00.
  </body></html>`
  const snapshot = parseExactRetailPage(html, { itemNumber: "18038", pageUrl: "https://example.test/18038" })
  assert.equal(snapshot.price, null)
  assert.equal(snapshot.confidence, "none")
  assert.equal(isAutoPublishableSnapshot(snapshot), false)
})

console.log(`${passed} passed, 0 failed`)
console.log("EXACT RETAIL PAGE ADAPTER TEST PASSED")
