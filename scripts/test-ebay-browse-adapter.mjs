import assert from "node:assert/strict"
import {
  buildEbayBrowseQuery,
  classifyEbayActiveListing,
  dedupeEbayListings,
} from "../lib/market/automation/ebay-browse-adapter.ts"

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

ok("unique exact new complete-looking listing is accepted", () => {
  const result = classifyEbayActiveListing({
    title: "Tamiya 95467 Dyna-Hawk GX Super XX Special Mini 4WD New",
    condition: "New",
    itemEndDate: "2027-01-01T00:00:00.000Z",
  }, unique, new Date("2026-09-14T00:00:00Z"))
  assert.equal(result.decision, "accepted")
})

ok("parts and body-only listings are rejected", () => {
  const result = classifyEbayActiveListing({
    title: "Tamiya 95467 Dyna-Hawk GX clear body only",
    condition: "New",
    itemEndDate: null,
  }, unique)
  assert.equal(result.decision, "rejected")
  assert.equal(result.reasonCodes.includes("PART_OR_BODY_ONLY"), true)
})

ok("item number absent from title is rejected", () => {
  const result = classifyEbayActiveListing({
    title: "Tamiya Dyna-Hawk GX Super XX Special",
    condition: "New",
    itemEndDate: null,
  }, unique)
  assert.equal(result.decision, "rejected")
})

ok("shared item number stays quarantined even with an exact number", () => {
  const result = classifyEbayActiveListing({
    title: "Tamiya 18074 Proto Emperor Premium Sanfrecce Hiroshima Special",
    condition: "New",
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
    condition: "New",
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
    condition: "New",
    seller: "seller-a",
    itemEndDate: null,
  }
  const rows = dedupeEbayListings([
    { ...base, marketplace: "EBAY_IT" },
    { ...base, marketplace: "EBAY_DE" },
  ])
  assert.equal(rows.length, 1)
})

console.log(`${passed} passed, 0 failed`)
console.log("EBAY BROWSE ADAPTER TEST PASSED")

// Network is mocked: these are transport and isolation tests, never market data.
const { searchEbayActiveListings, ebayEnvironment, ebayMarketWritesAllowed } = await import('../lib/market/automation/ebay-browse-adapter.ts')
const originalFetch = globalThis.fetch
const savedEnv = Object.fromEntries(['EBAY_ENV', 'EBAY_CLIENT_ID', 'EBAY_CLIENT_SECRET', 'EBAY_MARKET_WRITES_ENABLED'].map(key => [key, process.env[key]]))
const calls = []
try {
  delete process.env.EBAY_ENV
  delete process.env.EBAY_MARKET_WRITES_ENABLED
  assert.equal(ebayEnvironment(), 'sandbox')
  assert.equal(ebayMarketWritesAllowed(), false)
  process.env.EBAY_CLIENT_ID = 'fixture-SBX-client'
  process.env.EBAY_CLIENT_SECRET = 'fixture-only'
  const sample = { itemId: 'v1|fixture|0', title: 'Tamiya 95467 kit', price: { value: '20', currency: 'EUR' }, condition: 'New', seller: { username: 'fixture-seller' }, itemWebUrl: 'https://example.com/item' }
  globalThis.fetch = async (url, options) => {
    calls.push({ url: new URL(url), options })
    assert.equal(options.cache, 'no-store')
    assert.equal(options.redirect, 'error')
    if (String(url).includes('/identity/')) {
      assert.equal(options.body.get('grant_type'), 'client_credentials')
      assert.equal(options.body.get('scope'), 'https://api.ebay.com/oauth/api_scope')
      return Response.json({ access_token: 'fixture-token', expires_in: 7200 })
    }
    assert.equal(new URL(url).searchParams.get('filter'), 'conditions:{NEW}')
    return Response.json({ itemSummaries: [
      { ...sample, shippingOptions: [{ shippingCost: { value: '0', currency: 'EUR' } }] },
      { ...sample, itemId: 'paid', shippingOptions: [{ shippingCost: { value: '4.50', currency: 'EUR' } }] },
      { ...sample, itemId: 'unknown' },
      { ...sample, itemId: 'different-currency', shippingOptions: [{ shippingCost: { value: '5', currency: 'USD' } }] },
    ] })
  }
  const rows = await searchEbayActiveListings(unique, 'EBAY_IT', 5)
  assert.deepEqual(rows.map(row => row.shipping), [0, 4.5, null, null])
  assert.equal(rows[0].seller, 'fixture-seller')
  assert.equal(rows[0].itemWebUrl, sample.itemWebUrl)
  assert.equal(rows[0].marketplace, 'EBAY_IT')
  for (const marketplace of ['EBAY_DE', 'EBAY_GB', 'EBAY_US']) {
    await searchEbayActiveListings(unique, marketplace, 5)
    assert.equal(calls.at(-1).options.headers['X-EBAY-C-MARKETPLACE-ID'], marketplace)
  }
  assert.equal(calls.filter(call => call.url.pathname.includes('/identity/')).length, 1)
  assert.equal(calls.every(call => call.url.host === 'api.sandbox.ebay.com'), true)
  console.log('ok: Sandbox routing, OAuth, four marketplaces, token reuse and shipping semantics')

  process.env.EBAY_ENV = 'production'
  assert.equal(ebayMarketWritesAllowed(), false)
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
      if (name === './ebay-browse-adapter') return { ebayBrowseConfigured: () => true, ebayMarketWritesAllowed }
      return new Proxy({}, { get: () => forbidden })
    },
  })
  process.env.EBAY_ENV = 'sandbox'
  delete process.env.EBAY_MARKET_WRITES_ENABLED
  await assert.rejects(() => workerModule.exports.runEbayActiveMarketScanBatch(1), /EBAY_SANDBOX_MARKET_WRITES_DISABLED/)
  assert.equal(dbTouches, 0)
  console.log('ok: Sandbox worker cannot create clients, claim jobs, write prices or recompute R3')

  process.env.EBAY_ENV = 'production'
  process.env.EBAY_CLIENT_ID = 'fixture-PRD-client'
  process.env.EBAY_CLIENT_SECRET = 'fixture-only'
  delete process.env.EBAY_MARKET_WRITES_ENABLED
  await assert.rejects(() => workerModule.exports.runEbayActiveMarketScanBatch(1), /EBAY_SANDBOX_MARKET_WRITES_DISABLED/)
  assert.equal(dbTouches, 0)
  console.log('ok: Production worker remains blocked before DB access until writes are explicitly armed')
} finally {
  globalThis.fetch = originalFetch
  for (const [key, value] of Object.entries(savedEnv)) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
}
console.log('EBAY TRANSPORT AND SANDBOX ISOLATION TESTS PASSED')
