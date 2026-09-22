import assert from "node:assert/strict"
import {
  isAutoPublishableSnapshot,
  parseExactRetailPage,
  parseRcjazRetailPage,
} from "../lib/market/automation/exact-page-adapter.ts"
import { guardAutomatedPrice } from "../lib/market/automation/price-guard.ts"

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

ok("RCJAZ exact product page parses current stock without generic JSON-LD", () => {
  const html = `<html><head><title>Tamiya 95467 Dyna-Hawk GX Super XX Special Mini 4WD Kit</title></head>
    <body>
      <h1>Tamiya 95467 Dyna-Hawk GX Super XX Special Mini 4WD Kit [95467]</h1>
      <div>Price: USD$25.30</div>
      <div>Brand: Tamiya</div>
      <div>Model: 95467</div>
      <div>GTIN: 4950344954674</div>
      <div>Condition: Brand New</div>
      <button>Add to Cart</button>
      <div>Available in shop</div>
    </body></html>`
  const snapshot = parseRcjazRetailPage(html, {
    itemNumber: "95467",
    pageUrl: "https://www.rcjaz.com/tamiya-95467-example-p-12156.html",
  })
  assert.equal(snapshot.itemNumberSeen, true)
  assert.equal(snapshot.price, 25.3)
  assert.equal(snapshot.currency, "USD")
  assert.equal(snapshot.availability, "in_stock")
  assert.equal(snapshot.confidence, "source_specific")
  assert.equal(isAutoPublishableSnapshot(snapshot), true)
})

ok("RCJAZ exact product page preserves sold-out price as unavailable context", () => {
  const html = `<html><head><title>Tamiya 94777 Avante III Azure Clear Blue</title></head>
    <body>
      <h1>Tamiya 94777 - 1/32 Avante III Azure Clear Blue Model Kit [94777]</h1>
      <div>Price: USD$14.42</div>
      <div>Model: 94777</div>
      <div>Not Available</div>
      <div>Please input your email and we will inform you once restocked.</div>
    </body></html>`
  const snapshot = parseRcjazRetailPage(html, {
    itemNumber: "94777",
    pageUrl: "https://www.rcjaz.com/tamiya-94777-example-p-90022364.html",
  })
  assert.equal(snapshot.itemNumberSeen, true)
  assert.equal(snapshot.price, 14.42)
  assert.equal(snapshot.currency, "USD")
  assert.equal(snapshot.availability, "out_of_stock")
  assert.equal(snapshot.confidence, "source_specific")
  assert.equal(isAutoPublishableSnapshot(snapshot), true)
})

ok("RCJAZ Cloudflare challenge fails closed", () => {
  const html = `<html><head><title>Just a moment...</title></head>
    <body><div id="cf-chl-widget">Cloudflare security check</div></body></html>`
  const snapshot = parseRcjazRetailPage(html, {
    itemNumber: "95467",
    pageUrl: "https://www.rcjaz.com/tamiya-95467-example.html",
  })
  assert.equal(snapshot.itemNumberSeen, false)
  assert.equal(snapshot.price, null)
  assert.equal(snapshot.availability, "unknown")
  assert.equal(snapshot.confidence, "none")
  assert.equal(snapshot.warnings.includes("RCJAZ_CHALLENGE_PAGE"), true)
  assert.equal(isAutoPublishableSnapshot(snapshot), false)
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

ok("wild current low price is quarantined against independent evidence", () => {
  const guard = guardAutomatedPrice({
    priceEUR: 5,
    availability: "in_stock",
    independentReferenceEUR: [18, 20, 22],
    previousSameSourceEUR: 19,
    headlineConfidence: "medium",
  })
  assert.equal(guard.decision, "review")
  assert.equal(guard.reasonCodes.includes("AUTOMATION_SOURCE_PRICE_JUMP"), true)
  assert.equal(guard.reasonCodes.includes("AUTOMATION_CROSS_SOURCE_OUTLIER"), true)
})

ok("marketplace ASK far above sold reference remains accepted market evidence", () => {
  const guard = guardAutomatedPrice({
    lane: "marketplace_ask",
    priceEUR: 46.36,
    availability: "in_stock",
    independentReferenceEUR: [14.92],
    previousSameSourceEUR: null,
    headlineConfidence: "low",
  })
  assert.equal(guard.decision, "accept")
  assert.equal(guard.reasonCodes.includes("ASK_FAR_FROM_REFERENCE"), true)
})

ok("marketplace ASK divergence stays non-blocking even with several sold/retail references", () => {
  const guard = guardAutomatedPrice({
    lane: "marketplace_ask",
    priceEUR: 46.36,
    availability: "in_stock",
    independentReferenceEUR: [14.5, 14.92, 15.4],
    previousSameSourceEUR: 45,
    headlineConfidence: "high",
  })
  assert.equal(guard.decision, "accept")
  assert.equal(guard.reasonCodes.includes("ASK_FAR_FROM_REFERENCE"), true)
  assert.equal(guard.reasonCodes.includes("AUTOMATION_CROSS_SOURCE_OUTLIER"), false)
})

ok("sold-out odd price remains context instead of being blocked as current valuation", () => {
  const guard = guardAutomatedPrice({
    priceEUR: 2,
    availability: "out_of_stock",
    independentReferenceEUR: [20, 22],
    previousSameSourceEUR: 20,
    headlineConfidence: "high",
  })
  assert.equal(guard.decision, "accept")
})

ok("reasonable current price passes the guard", () => {
  const guard = guardAutomatedPrice({
    priceEUR: 18,
    availability: "in_stock",
    independentReferenceEUR: [17, 19, 20],
    previousSameSourceEUR: 18.5,
    headlineConfidence: "medium",
  })
  assert.equal(guard.decision, "accept")
})

console.log(`${passed} passed, 0 failed`)
console.log("EXACT RETAIL PAGE ADAPTER TEST PASSED")
