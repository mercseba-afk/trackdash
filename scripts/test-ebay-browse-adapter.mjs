import assert from "node:assert/strict"
import {
  buildEbayBrowseQuery,
  classifyEbayActiveListing,
  dedupeEbayListings,
} from "../lib/market/automation/ebay-browse-adapter.ts"
import { ebaySourceRecordKey, planMissingEbayOffers } from "../lib/market/automation/ebay-lifecycle.ts"

let passed = 0
function ok(name, fn) {
  fn()
  passed += 1
  console.log(`ok: ${name}`)
}

const unique = {
  itemNumber: "95467",
  editionName: "Dyna-Hawk GX Super XX Special (2019 Reissue)",
  releaseYear: 2019,
  itemNumberIsShared: false,
}

ok("query leads with Tamiya and exact item number", () => {
  const query = buildEbayBrowseQuery(unique)
  assert.equal(query.startsWith("Tamiya 95467"), true)
})

ok("localized New display text is accepted when conditionId is 1000", () => {
  const result = classifyEbayActiveListing({
    title: "Tamiya 95467 Dyna-Hawk GX Super XX Special Mini 4WD",
    condition: "Neuf",
    conditionId: "1000",
    itemEndDate: "2027-01-01T00:00:00.000Z",
  }, unique, new Date("2026-09-14T00:00:00Z"))
  assert.equal(result.decision, "accepted")
})

ok("structured non-new condition is rejected regardless of display text", () => {
  const result = classifyEbayActiveListing({
    title: "Tamiya 95467 Dyna-Hawk GX Super XX Special Mini 4WD",
    condition: "New",
    conditionId: "3000",
    itemEndDate: null,
  }, unique)
  assert.equal(result.decision, "rejected")
  assert.equal(result.reasonCodes.includes("NOT_NEW_CONDITION"), true)
})

ok("parts and body-only listings are rejected", () => {
  const result = classifyEbayActiveListing({
    title: "Tamiya 95467 Dyna-Hawk GX clear body only",
    condition: "Neuf",
    conditionId: "1000",
    itemEndDate: null,
  }, unique)
  assert.equal(result.decision, "rejected")
  assert.equal(result.reasonCodes.includes("PART_OR_BODY_ONLY"), true)
})

ok("item number absent from title is rejected", () => {
  const result = classifyEbayActiveListing({
    title: "Tamiya Dyna-Hawk GX Super XX Special",
    condition: "Neuf",
    conditionId: "1000",
    itemEndDate: null,
  }, unique)
  assert.equal(result.decision, "rejected")
})

ok("shared item number stays quarantined even with an exact number", () => {
  const result = classifyEbayActiveListing({
    title: "Tamiya 18074 Proto Emperor Premium Sanfrecce Hiroshima Special",
    condition: "Neuf",
    conditionId: "1000",
    itemEndDate: null,
  }, {
    itemNumber: "18074",
    editionName: "Sanfrecce Hiroshima Special Edition",
    releaseYear: 2023,
    itemNumberIsShared: true,
  })
  assert.equal(result.decision, "needs_review")
  assert.equal(result.reasonCodes.includes("SHARED_ITEM_NUMBER_REQUIRES_RELEASE_REVIEW"), true)
})

ok("ended listing is rejected from active asks", () => {
  const result = classifyEbayActiveListing({
    title: "Tamiya 95467 Dyna-Hawk GX Super XX Special",
    condition: "Neuf",
    conditionId: "1000",
    itemEndDate: "2026-01-01T00:00:00.000Z",
  }, unique, new Date("2026-09-14T00:00:00Z"))
  assert.equal(result.decision, "rejected")
  assert.equal(result.reasonCodes.includes("LISTING_ENDED"), true)
})

ok("same eBay item surfaced in multiple marketplaces is counted once", () => {
  const base = {
    itemId: "v1|123|0",
    title: "Tamiya 95467 Dyna-Hawk GX",
    itemWebUrl: null,
    price: 20,
    currency: "EUR",
    shipping: null,
    condition: "Neuf",
    conditionId: "1000",
    seller: "seller-a",
    itemEndDate: null,
  }
  const rows = dedupeEbayListings([
    { ...base, marketplace: "EBAY_IT" },
    { ...base, marketplace: "EBAY_DE" },
  ])
  assert.equal(rows.length, 1)
  assert.equal(ebaySourceRecordKey(rows[0].itemId), "ebay:v1|123|0")
  assert.equal(new Set(rows.map((row) => ebaySourceRecordKey(row.itemId))).size, 1)
})

ok("legacy numeric and REST item IDs dedupe to one known listing", () => {
  const base = {
    title: "Tamiya 92284 Avante Mk.III Nero STARGEK",
    itemWebUrl: null,
    price: 450,
    currency: "MYR",
    shipping: 120,
    condition: "New",
    conditionId: "1000",
    seller: "seller-a",
    itemEndDate: null,
    marketplace: "EBAY_IT",
  }
  const rows = dedupeEbayListings([
    { ...base, itemId: "204435589176" },
    { ...base, itemId: "v1|204435589176|0" },
  ])
  assert.equal(rows.length, 1)
  assert.equal(rows[0].itemId, "204435589176")
})

const targetReleaseId = "target-release"
const knownOffer = {
  candidateId: "candidate-1",
  releaseId: targetReleaseId,
  itemId: "v1|123|0",
  originalMarketplace: "EBAY_IT",
  availability: "in_stock",
}
const fetchState = (marketplace, { succeeded = true, complete = true, itemIds = [] } = {}) => ({
  marketplace,
  succeeded,
  complete,
  itemIds: new Set(itemIds),
})

ok("lifecycle keeps an offer that remains present", () => {
  assert.deepEqual(planMissingEbayOffers(targetReleaseId, [knownOffer], [
    fetchState("EBAY_IT", { itemIds: [knownOffer.itemId] }),
  ]), [])
})

ok("lifecycle neutralizes absence only after a complete successful origin fetch", () => {
  assert.deepEqual(planMissingEbayOffers(targetReleaseId, [knownOffer], [fetchState("EBAY_IT")]), [knownOffer.candidateId])
})

ok("lifecycle preserves an offer when its origin fetch fails or is truncated", () => {
  assert.deepEqual(planMissingEbayOffers(targetReleaseId, [knownOffer], [
    fetchState("EBAY_IT", { succeeded: false, complete: false }),
  ]), [])
  assert.deepEqual(planMissingEbayOffers(targetReleaseId, [knownOffer], [
    fetchState("EBAY_IT", { complete: false }),
  ]), [])
})

ok("lifecycle never touches a listing owned by another Release", () => {
  assert.deepEqual(planMissingEbayOffers(targetReleaseId, [{ ...knownOffer, releaseId: "other-release" }], [
    fetchState("EBAY_IT"),
  ]), [])
})

console.log(`${passed} passed, 0 failed`)
console.log("EBAY BROWSE ADAPTER TEST PASSED")

// Network is mocked: these are transport and isolation tests, never market data.
const { searchEbayActiveListings, searchEbayActiveListingsByQuery, fetchEbayActiveListingByLegacyId, fetchEbayActiveItemDetails, ebayEnvironment, ebayMarketWritesAllowed, ebayScheduledMarketWritesAllowed } = await import('../lib/market/automation/ebay-browse-adapter.ts')
const originalFetch = globalThis.fetch
const savedEnv = Object.fromEntries(['EBAY_ENV', 'EBAY_CLIENT_ID', 'EBAY_CLIENT_SECRET', 'EBAY_MARKET_WRITES_ENABLED'].map(key => [key, process.env[key]]))
const calls = []
try {
  delete process.env.EBAY_ENV
  delete process.env.EBAY_MARKET_WRITES_ENABLED
  assert.equal(ebayEnvironment(), 'sandbox')
  assert.equal(ebayMarketWritesAllowed(), false)
  assert.equal(ebayScheduledMarketWritesAllowed(), false)
  process.env.EBAY_CLIENT_ID = 'fixture-SBX-client'
  process.env.EBAY_CLIENT_SECRET = 'fixture-only'
  const sample = {
    itemId: 'v1|fixture|0',
    title: 'Tamiya 95467 kit',
    price: { value: '20', currency: 'EUR' },
    condition: 'Neuf',
    conditionId: '1000',
    seller: { username: 'fixture-seller' },
    itemWebUrl: 'https://example.com/item',
    itemLocation: { country: 'DE' },
  }
  globalThis.fetch = async (url, options) => {
    calls.push({ url: new URL(url), options })
    assert.equal(options.cache, 'no-store')
    assert.equal(options.redirect, 'error')
    if (String(url).includes('/identity/')) {
      assert.equal(options.body.get('grant_type'), 'client_credentials')
      assert.equal(options.body.get('scope'), 'https://api.ebay.com/oauth/api_scope')
      return Response.json({ access_token: 'fixture-token', expires_in: 7200 })
    }
    if (new URL(url).pathname.endsWith('/item/get_item_by_legacy_id')) {
      assert.equal(new URL(url).searchParams.get('legacy_item_id'), '204435589176')
      return Response.json({
        ...sample,
        itemId: 'v1|204435589176|0',
        title: 'Tamiya 92284 Avante Mk.III Nero STARGEK',
        price: { value: '450', currency: 'MYR' },
        shippingOptions: [{ shippingCost: { value: '120', currency: 'MYR' } }],
      })
    }
    if (new URL(url).pathname.includes('/buy/browse/v1/item/')) {
      return Response.json({
        itemId: 'v1|325123456789|0',
        legacyItemId: '325123456789',
        title: "2025 Hot Wheels '87 Audi quattro STH Super Treasure Hunt",
        mpn: 'JBC35-N521',
        gtin: '0194735288888',
        brand: 'Hot Wheels',
        localizedAspects: [
          { name: 'MPN', value: 'JBC35-N521' },
          { name: 'Series', value: 'Factory Fresh' },
        ],
      })
    }
    const filter = new URL(url).searchParams.get('filter')
    assert.equal(filter?.includes('conditionIds:{1000}'), true)
    return Response.json({ itemSummaries: [
      { ...sample, shippingOptions: [{ shippingCost: { value: '0', currency: 'EUR' }, shipToLocationUsedForEstimate: { country: 'IT' } }] },
      { ...sample, itemId: 'paid', shippingOptions: [{ shippingCost: { value: '4.50', currency: 'EUR' }, shipToLocationUsedForEstimate: { country: 'IT' } }] },
      { ...sample, itemId: 'unknown' },
      { ...sample, itemId: 'different-currency', shippingOptions: [{ shippingCost: { value: '5', currency: 'USD' } }] },
    ] })
  }
  const rows = await searchEbayActiveListings(unique, 'EBAY_IT', 5)
  assert.deepEqual(rows.map(row => row.shipping), [0, 4.5, null, null])
  assert.equal(rows[0].seller, 'fixture-seller')
  assert.equal(rows[0].itemWebUrl, sample.itemWebUrl)
  assert.equal(rows[0].marketplace, 'EBAY_IT')
  assert.equal(rows[0].condition, 'Neuf')
  assert.equal(rows[0].conditionId, '1000')
  assert.equal(rows[0].itemLocationCountry, 'DE')
  assert.equal(rows[0].shippingEstimateCountry, 'IT')
  const defaultFilter = calls.at(-1).url.searchParams.get('filter')
  assert.equal(defaultFilter, 'conditionIds:{1000}')

  await searchEbayActiveListingsByQuery('Hot Wheels HCJ81 LB-ER34', 'EBAY_DE', 5, { deliveryCountry: 'IT' })
  assert.equal(calls.at(-1).url.searchParams.get('filter'), 'conditionIds:{1000},deliveryCountry:IT')
  assert.equal(calls.at(-1).options.headers['X-EBAY-C-ENDUSERCTX'], undefined)
  console.log('ok: deliveryCountry filter is opt-in and does not change legacy Mini 4WD search semantics')

  for (const marketplace of ['EBAY_DE', 'EBAY_GB', 'EBAY_US']) {
    await searchEbayActiveListings(unique, marketplace, 5)
    assert.equal(calls.at(-1).options.headers['X-EBAY-C-MARKETPLACE-ID'], marketplace)
  }
  const legacy = await fetchEbayActiveListingByLegacyId('204435589176', 'EBAY_IT')
  assert.equal(legacy.itemId, '204435589176')
  assert.equal(legacy.price, 450)
  assert.equal(legacy.currency, 'MYR')
  assert.equal(legacy.shipping, 120)
  assert.equal(legacy.marketplace, 'EBAY_IT')
  assert.equal(calls.at(-1).url.pathname, '/buy/browse/v1/item/get_item_by_legacy_id')

  const details = await fetchEbayActiveItemDetails('v1|325123456789|0', 'EBAY_IT')
  assert.equal(details.itemId, 'v1|325123456789|0')
  assert.equal(details.legacyItemId, '325123456789')
  assert.equal(details.mpn, 'JBC35-N521')
  assert.equal(details.gtin, '0194735288888')
  assert.equal(details.brand, 'Hot Wheels')
  assert.deepEqual(details.localizedAspects, [
    { name: 'MPN', value: 'JBC35-N521' },
    { name: 'Series', value: 'Factory Fresh' },
  ])
  assert.equal(calls.at(-1).url.pathname, '/buy/browse/v1/item/v1%7C325123456789%7C0')

  assert.equal(calls.filter(call => call.url.pathname.includes('/identity/')).length, 1)
  assert.equal(calls.every(call => call.url.host === 'api.sandbox.ebay.com'), true)
  console.log('ok: Sandbox routing, OAuth, four search marketplaces, direct legacy-ID refresh, token reuse, condition ID and shipping semantics')

  process.env.EBAY_ENV = 'production'
  assert.equal(ebayMarketWritesAllowed(), false)
  assert.equal(ebayScheduledMarketWritesAllowed(), true)
  process.env.EBAY_MARKET_WRITES_ENABLED = 'false'
  assert.equal(ebayMarketWritesAllowed(), false)
  process.env.EBAY_MARKET_WRITES_ENABLED = 'true'
  assert.equal(ebayMarketWritesAllowed(), true)
  delete process.env.EBAY_MARKET_WRITES_ENABLED
  assert.equal(ebayMarketWritesAllowed(), false)
  console.log('ok: Production credentials cannot arm market writes without explicit true switch')

  const beforeMismatch = calls.length
  await assert.rejects(() => searchEbayActiveListings(unique, 'EBAY_IT'), /EBAY_CREDENTIAL_ENV_MISMATCH/)
  assert.equal(calls.length, beforeMismatch)
  process.env.EBAY_CLIENT_ID = 'fixture-PRD-client'
  await searchEbayActiveListings(unique, 'EBAY_US', 5)
  assert.equal(calls.at(-2).url.host, 'api.ebay.com')
  assert.equal(calls.at(-2).url.pathname, '/identity/v1/oauth2/token')
  assert.equal(calls.at(-1).url.host, 'api.ebay.com')
  process.env.EBAY_CLIENT_SECRET = 'fixture-rotated'
  await searchEbayActiveListings(unique, 'EBAY_US', 5)
  assert.equal(calls.at(-2).url.pathname, '/identity/v1/oauth2/token')
  process.env.EBAY_ENV = 'invalid'
  await assert.rejects(() => searchEbayActiveListings(unique, 'EBAY_IT'), /EBAY_ENV_INVALID/)
  process.env.EBAY_ENV = 'sandbox'
  await assert.rejects(() => searchEbayActiveListings(unique, 'EBAY_IT'), /EBAY_CREDENTIAL_ENV_MISMATCH/)
  console.log('ok: environment switches, credential rotation and fail-closed configuration')
  process.env.EBAY_CLIENT_ID = 'fixture-SBX-errors'
  globalThis.fetch = async () => { throw new Error('PRIVATE RESPONSE MUST NOT ESCAPE') }
  await assert.rejects(() => searchEbayActiveListings(unique, 'EBAY_IT'), { message: 'EBAY_OAUTH_NETWORK_ERROR' })
  globalThis.fetch = async () => new Response('PRIVATE RESPONSE MUST NOT ESCAPE', { status: 401 })
  await assert.rejects(() => searchEbayActiveListings(unique, 'EBAY_IT'), { message: 'EBAY_OAUTH_HTTP_401' })
  globalThis.fetch = async (url) => String(url).includes('/identity/')
    ? Response.json({ access_token: 'fixture-token', expires_in: 7200 })
    : new Response('PRIVATE RESPONSE MUST NOT ESCAPE', { status: 403 })
  await assert.rejects(() => searchEbayActiveListings(unique, 'EBAY_IT'), { message: 'EBAY_BROWSE_HTTP_403' })
  console.log('ok: OAuth and Browse errors contain no response bodies or secrets')

  // Execute the actual worker with database dependencies that fail on any use.
  const { readFileSync } = await import('node:fs')
  const { default: ts } = await import('typescript')
  const { runInNewContext } = await import('node:vm')
  let dbTouches = 0
  const forbidden = () => { dbTouches++; throw new Error('Unexpected database access') }
  const workerSource = readFileSync(new URL('../lib/market/automation/ebay-worker.ts', import.meta.url), 'utf8')
  const workerModule = { exports: {} }
  runInNewContext(ts.transpileModule(workerSource, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
    exports: workerModule.exports,
    require(name) {
      if (name === './ebay-browse-adapter') return { ebayBrowseConfigured: () => true, ebayMarketWritesAllowed, ebayScheduledMarketWritesAllowed, fetchEbayActiveListingByLegacyId }
      return new Proxy({}, { get: () => forbidden })
    },
  })
  process.env.EBAY_ENV = 'sandbox'
  delete process.env.EBAY_MARKET_WRITES_ENABLED
  await assert.rejects(() => workerModule.exports.runEbayActiveMarketScanBatch(1), /EBAY_SCHEDULED_MARKET_WRITES_DISABLED/)
  assert.equal(dbTouches, 0)
  console.log('ok: Sandbox scheduled worker cannot create clients, claim jobs, write prices or recompute market signals')

  process.env.EBAY_ENV = 'production'
  process.env.EBAY_CLIENT_ID = 'fixture-PRD-client'
  process.env.EBAY_CLIENT_SECRET = 'fixture-only'
  delete process.env.EBAY_MARKET_WRITES_ENABLED
  assert.equal(ebayScheduledMarketWritesAllowed(), true)
  console.log('ok: Production scheduled path is released while targeted/manual execution keeps its explicit write gate')
  await assert.rejects(() => workerModule.exports.runEbayActiveMarketScanForRelease({
    jobId: 'fixture-job',
    releaseId: 'fixture-release',
    mode: 'execute',
    expectedItemId: 'fixture-item',
  }), /EBAY_MARKET_WRITES_DISABLED/)
  assert.equal(dbTouches, 0)
  console.log('ok: Targeted Production execution remains blocked before DB access until writes are explicitly armed')
} finally {
  globalThis.fetch = originalFetch
  for (const [key, value] of Object.entries(savedEnv)) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
}
console.log('EBAY TRANSPORT AND SANDBOX ISOLATION TESTS PASSED')
