import assert from "node:assert/strict"
import { test } from "node:test"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { resolve, dirname } from "node:path"
import { AsyncLocalStorage } from "node:async_hooks"
import vm from "node:vm"
import ts from "typescript"

const require = createRequire(import.meta.url)
globalThis.AsyncLocalStorage ??= AsyncLocalStorage
const { unstable_cache } = require("next/cache")
const { workAsyncStorage } = require("next/dist/server/app-render/work-async-storage.external.js")
const root = resolve(new URL("..", import.meta.url).pathname)
const DAY = 86_400_000
const BASE = Date.parse("2026-10-14T12:00:00Z")
const iso = (ms) => new Date(ms).toISOString()
const read = (file) => readFileSync(resolve(root, file), "utf8")

// Run actual source; unexpected package/network/DB imports fail immediately.
function loader(clock, mocks = {}) {
  const modules = new Map()
  class ClockDate extends Date {
    constructor(...args) { super(...(args.length ? args : [clock.now])) }
    static now() { return clock.now }
  }
  function load(file) {
    file = resolve(root, file)
    if (!/\.(ts|tsx)$/.test(file)) file += ".ts"
    if (modules.has(file)) return modules.get(file)
    const exports = {}
    modules.set(file, exports)
    const output = ts.transpileModule(readFileSync(file, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    }).outputText
    vm.runInNewContext(output, {
      exports, Date: ClockDate, console: { error: () => {} },
      fetch: () => { throw Error("NETWORK_FORBIDDEN") },
      require: (name) => {
        if (Object.hasOwn(mocks, name)) return mocks[name]
        if (name === "server-only") return {}
        if (name.startsWith("@/")) return load(name.slice(2))
        if (name.startsWith(".")) return load(resolve(dirname(file), name))
        throw Error("UNEXPECTED_IMPORT:" + name)
      },
      window: mocks.window, document: mocks.document,
    }, { filename: file })
    return exports
  }
  return load
}

const row = { marketValueEUR: "30", soldAnchorEUR: "25", soldUnits: 5, trendPercent: "10", trendBasis: "sold", startingOfferCandidateId: "a", computedAt: iso(BASE), marketRegime: "mixed_scarce" }
function offer(id, price, checkedAt = BASE - 15 * DAY + 500) {
  return { candidateId: id, releaseId: "r", sourceId: "source", channel: "marketplace", itemPriceEUR: String(price), shippingEUR: "2", effectiveCostEUR: String(price + 2), costBasis: "delivered", lastCheckedAt: iso(checkedAt), originCountry: "IT", sourceMarketRegion: "europe", listingKey: id, sellerFingerprint: id, acceptedExactKit: true }
}
function projection(clock) {
  const load = loader(clock, {
    "@/lib/db/queries/market": {},
    "@/lib/supabase/admin": { createAdminClient: () => { throw Error("DB_FORBIDDEN") } },
  })
  return { load, project: (offers, signal = row) => load("lib/market/public.ts").toPublicMarketSignalView(signal, null, offers) }
}

// Deterministic hook/event/timer harness around the real Provider TSX.
// It tests effects and races, not browser rendering or authentication UX.
function providerHarness(initialSignals, action, clock = { now: BASE }) {
  const slots = [], effects = [], timers = new Map(), listeners = new Map()
  let cursor = 0, dirty = false, snapshot, renders = 0, timerId = 0
  const equal = (a, b) => a?.length === b?.length && a.every((x, i) => x === b[i])
  const react = {
    createContext: () => ({ Provider: "provider" }), useContext: () => snapshot,
    useState: (initial) => {
      const i = cursor++
      slots[i] ??= { value: typeof initial === "function" ? initial() : initial }
      return [slots[i].value, (next) => {
        const value = typeof next === "function" ? next(slots[i].value) : next
        if (value !== slots[i].value) { slots[i].value = value; dirty = true }
      }]
    },
    useRef: (value) => { const i = cursor++; return slots[i] ??= { current: value } },
    useCallback: (fn, deps) => { const i = cursor++; if (!equal(slots[i]?.deps, deps)) slots[i] = { deps, fn }; return slots[i].fn },
    useEffect: (fn, deps) => {
      const i = cursor++
      if (!equal(slots[i]?.deps, deps)) effects.push(() => { slots[i]?.cleanup?.(); slots[i] = { deps, cleanup: fn() } })
    },
  }
  const add = (event, fn) => { const set = listeners.get(event) ?? new Set(); set.add(fn); listeners.set(event, set) }
  const remove = (event, fn) => listeners.get(event)?.delete(fn)
  const schedule = (fn, delay, repeat) => { const id = ++timerId; timers.set(id, { fn, at: clock.now + delay, repeat }); return id }
  const win = { addEventListener: add, removeEventListener: remove, setTimeout: (fn, delay) => schedule(fn, delay, 0), clearTimeout: (id) => timers.delete(id), setInterval: (fn, delay) => schedule(fn, delay, delay), clearInterval: (id) => timers.delete(id) }
  const doc = { hidden: false, addEventListener: add, removeEventListener: remove }
  const load = loader(clock, { react, "react/jsx-runtime": { jsx: (type, props) => ({ type, props }) }, "@/lib/actions/market": { getPublicMarketSignalsAction: action }, window: win, document: doc })
  const provider = load("lib/market/context.tsx")
  function flush() {
    let limit = 0
    do {
      dirty = false; cursor = 0; renders++
      snapshot = provider.MarketSignalsProvider({ initialSignals, children: null }).props.value
      for (const effect of effects.splice(0)) effect()
      assert.ok(++limit < 30, "no render loop")
    } while (dirty)
  }
  async function settle() { for (let i = 0; i < 8; i++) await Promise.resolve(); if (dirty) flush() }
  flush()
  return {
    doc, clock, get snapshot() { return snapshot }, get renders() { return renders }, settle,
    async event(name) { for (const fn of listeners.get(name) ?? []) fn(); await settle() },
    async advance(ms, intervals = true) {
      const target = clock.now + ms
      for (;;) {
        const next = [...timers].filter(([, t]) => t.at <= target && (intervals || !t.repeat)).sort((a, b) => a[1].at - b[1].at)[0]
        if (!next) break
        const [id, t] = next; clock.now = t.at
        if (t.repeat) t.at += t.repeat; else timers.delete(id)
        t.fn(); await settle()
      }
      clock.now = target; await settle()
    },
    unmount() { for (const slot of slots) slot?.cleanup?.() },
  }
}

test("projection deadlines preserve inclusive 15/31d TTL and representative ASK's existing 15d window", () => {
  const clock = { now: BASE }, { project } = projection(clock)
  assert.equal(project([offer("a", 10), offer("b", 20, BASE)]).offersValidUntil, iso(BASE + 500))
  clock.now += 500
  assert.equal(project([offer("a", 10), offer("b", 20, BASE)]).representativeAskItemEUR, 15)
  clock.now++
  const after = project([offer("a", 10), offer("b", 20, BASE)])
  assert.equal(after.representativeAskItemEUR, 20)
  assert.equal(after.currentOfferCount, 1)
  assert.equal(after.startingItemPriceEUR, null, "no replacement canonical shopping offer")
  const retail = { ...offer("a", 10, clock.now - 15 * DAY + 1000), channel: "retail" }
  assert.equal(project([retail]).offersValidUntil, iso(clock.now + 1000))
  clock.now += 1001
  assert.equal(project([retail]).representativeAskItemEUR, null)
  assert.equal(project([retail]).startingItemPriceEUR, 10)
  assert.equal(project([retail]).offersValidUntil, iso(Date.parse(retail.lastCheckedAt) + 31 * DAY))
})

test("immutable expiry preserves MV/SOLD/trend/history, excludes expired ASK from Collection and Wishlist", () => {
  const clock = { now: BASE }, { project, load } = projection(clock)
  const original = { r: project([offer("a", 10)]) }
  const { expirePublicMarketSignals } = load("lib/market/snapshot-expiry.ts")
  assert.equal(expirePublicMarketSignals(original, BASE + 500), original)
  const expired = expirePublicMarketSignals(original, BASE + 501)
  assert.equal(original.r.startingItemPriceEUR, 10)
  for (const field of ["valueEUR", "soldAnchorEUR", "soldUnits", "trendPercent", "trendBasis"]) assert.equal(expired.r[field], original.r[field])
  for (const field of ["startingItemPriceEUR", "startingEffectiveCostEUR", "representativeAskItemEUR", "activeAnchorEUR", "retailAnchorEUR"]) assert.equal(expired.r[field], null)
  assert.equal(expired.r.historicalAskItemEUR, 10)
  assert.equal(expired.r.historicalAskItemPlusShippingEUR, 12)
  const { sealedCollectionReference } = load("lib/market/collection-valuation.ts")
  const { observedMarketKnownPurchaseCost, observedMarketReferenceIsHistorical } = load("lib/market/presentation.ts")
  assert.equal(observedMarketKnownPurchaseCost(expired.r), null)
  assert.equal(observedMarketReferenceIsHistorical(expired.r), true)
  assert.equal(sealedCollectionReference(expired.r), null)
  assert.equal(sealedCollectionReference({ ...expired.r, valueEUR: null }), null)
  assert.equal(sealedCollectionReference({ ...expired.r, valueEUR: null, soldUnits: 0, soldAnchorEUR: null }), null)
  assert.equal(expirePublicMarketSignals(expired, Date.parse(original.r.observedPriceAt) + 180 * DAY + 1).r.historicalAskItemEUR, null)
})

test("installed Next cache: shared cold/hit, 60s stale revalidation failure, expiry and recovery", async () => {
  const clock = { now: BASE }, { project } = projection(clock)
  let value = { r: project([offer("a", 10), offer("b", 20, BASE)]) }
  let entry, writtenAt = 0, reads = 0, fail = false
  const incrementalCache = {
    generateSimpleCacheKey: async (key) => key,
    get: async () => entry ? { value: entry, isStale: clock.now - writtenAt > 60_000 } : null,
    set: async (_, next) => { entry = next; writtenAt = clock.now },
  }
  const load = loader(clock, { "next/cache": { unstable_cache }, "./public": { getPublicMarketSignalMap: async () => { reads++; if (fail) throw Error("simulated outage"); return structuredClone(value) } } })
  const cached = load("lib/market/public-cached.ts").getCachedPublicMarketSignalMap
  async function request() {
    const store = { incrementalCache, nextFetchId: 1, isStaticGeneration: false }
    const result = await workAsyncStorage.run(store, cached)
    await Promise.all(Object.values(store.pendingRevalidates ?? {}))
    return result
  }
  await request(); await request(); assert.equal(reads, 1)
  clock.now += 501
  value = { r: project([offer("a", 10), offer("b", 20, BASE)]) }
  assert.equal((await request()).r.representativeAskItemEUR, 20, "surviving seller, canonical re-projection")
  fail = true
  assert.equal((await request()).r.representativeAskItemEUR, 20, "reuse already verified, still-valid recovery within 60s")
  clock.now += 60_000
  const originalError = console.error; console.error = () => {}
  try { assert.equal((await request()).r.representativeAskItemEUR, null) } finally { console.error = originalError }
  fail = false
  assert.equal((await request()).r.representativeAskItemEUR, null, "failed recovery is throttled while SWR recovers")
  assert.equal((await request()).r.representativeAskItemEUR, 20)
  const recovered = reads
  assert.equal((await request()).r.representativeAskItemEUR, 20)
  assert.equal(reads, recovered)
})

test("provider expires without HTTP, skips hidden polls and protects suspended PWA resume", async () => {
  const clock = { now: BASE }, { project } = projection(clock)
  const initial = { r: project([offer("a", 10)]) }
  let calls = 0
  const host = providerHarness(initial, async () => { calls++; throw Error("offline") }, clock)
  host.doc.hidden = true
  await host.advance(501)
  assert.equal(host.snapshot.r.startingItemPriceEUR, null)
  await host.advance(240_000); assert.equal(calls, 0)
  host.doc.hidden = false
  await host.event("visibilitychange"); await host.event("focus")
  assert.equal(calls, 1)
  assert.equal(host.snapshot.r.valueEUR, 30)
  host.unmount()
  const suspended = providerHarness(initial, () => new Promise(() => {}), { now: BASE })
  suspended.clock.now += 1000
  await suspended.event("visibilitychange")
  assert.equal(suspended.snapshot.r.startingItemPriceEUR, null, "expiry before HTTP throttle allows a request")
  suspended.unmount()
})

test("60-second revalidation is SWR, not a hard bound; failure retains valid evidence and later recovery converges", async () => {
  const clock = { now: BASE }, { project } = projection(clock)
  let value = { r: project([offer("a", 10, BASE)]) }, entry, writtenAt = 0, fail = false
  const cache = {
    generateSimpleCacheKey: async (key) => key,
    get: async () => entry ? { value: entry, isStale: clock.now - writtenAt > 60_000 } : null,
    set: async (_, next) => { entry = next; writtenAt = clock.now },
  }
  const load = loader(clock, { "next/cache": { unstable_cache }, "./public": { getPublicMarketSignalMap: async () => { if (fail) throw Error("simulated outage"); return structuredClone(value) } } })
  const cached = load("lib/market/public-cached.ts").getCachedPublicMarketSignalMap
  async function request() {
    const store = { incrementalCache: cache, nextFetchId: 1, isStaticGeneration: false }
    const result = await workAsyncStorage.run(store, cached)
    await Promise.all(Object.values(store.pendingRevalidates ?? {}))
    return result
  }
  assert.equal((await request()).r.valueEUR, 30)
  clock.now += 60_001; fail = true
  const originalError = console.error; console.error = () => {}
  try { assert.equal((await request()).r.valueEUR, 30) } finally { console.error = originalError }
  fail = false; value = { r: { ...value.r, valueEUR: 40 } }
  assert.equal((await request()).r.valueEUR, 30, "SWR returns old snapshot while revalidating")
  assert.equal((await request()).r.valueEUR, 40)
})

test("concurrent expiry reads share one in-flight canonical read; a cold cache error is not a fabricated snapshot", async () => {
  const clock = { now: BASE }, { project } = projection(clock)
  const expired = { r: project([offer("a", 10)]) }
  clock.now += 501
  let calls = 0, finish
  const load = loader(clock, {
    "next/cache": { unstable_cache: () => async () => structuredClone(expired) },
    "./public": { getPublicMarketSignalMap: () => { calls++; return new Promise((resolve) => { finish = resolve }) } },
  })
  const cached = load("lib/market/public-cached.ts").getCachedPublicMarketSignalMap
  const first = cached(), second = cached()
  for (let i = 0; i < 6; i++) await Promise.resolve()
  assert.equal(calls, 1)
  finish({ r: project([offer("b", 20, BASE)]) })
  const results = await Promise.all([first, second])
  assert.equal(results[0].r.representativeAskItemEUR, 20)
  assert.equal(results[1].r.representativeAskItemEUR, 20)
  const cold = loader(clock, { "next/cache": { unstable_cache: () => async () => { throw Error("cold cache unavailable") } }, "./public": {} })
  await assert.rejects(cold("lib/market/public-cached.ts").getCachedPublicMarketSignalMap(), /cold cache unavailable/)
})

test("sequential requests for the same expired cache entry do not repeat recovery reads", async () => {
  const clock = { now: BASE }, { project } = projection(clock)
  const expired = { r: project([offer("a", 10)]) }
  clock.now += 501
  let calls = 0, fail = false
  const load = loader(clock, {
    "next/cache": { unstable_cache: () => async () => structuredClone(expired) },
    "./public": { getPublicMarketSignalMap: async () => {
      calls++
      if (fail) throw Error("simulated outage")
      return { r: project([offer("b", 20, BASE)]) }
    } },
  })
  const cached = load("lib/market/public-cached.ts").getCachedPublicMarketSignalMap
  for (let i = 0; i < 5; i++) assert.equal((await cached()).r.representativeAskItemEUR, 20)
  assert.equal(calls, 1, "sequential requests share a bounded recovery result")
  clock.now += 60_001; fail = true
  for (let i = 0; i < 5; i++) {
    const safe = await cached()
    assert.equal(safe.r.startingItemPriceEUR, null)
    assert.equal(safe.r.valueEUR, 30)
    assert.equal(safe.r.soldAnchorEUR, 25)
  }
  assert.equal(calls, 2, "failed recovery is also bounded")
  clock.now += 60_001; fail = false
  assert.equal((await cached()).r.representativeAskItemEUR, 20)
  assert.equal(calls, 3, "recovery resumes after the existing cache interval")
})

test("historical-only expiry does not bypass the shared data cache", async () => {
  const clock = { now: BASE }
  const snapshot = { r: { valueEUR: 30, historicalAskItemEUR: 10, historicalAskObservedAt: iso(BASE - 181 * DAY) } }
  let calls = 0
  const load = loader(clock, {
    "next/cache": { unstable_cache: () => async () => structuredClone(snapshot) },
    "./public": { getPublicMarketSignalMap: async () => { calls++; return snapshot } },
  })
  const safe = await load("lib/market/public-cached.ts").getCachedPublicMarketSignalMap()
  assert.equal(safe.r.historicalAskItemEUR, null)
  assert.equal(safe.r.valueEUR, 30)
  assert.equal(calls, 0)
})

test("bounded recovery expires its own ASK and never overrides a changed cache snapshot", async () => {
  const clock = { now: BASE }, { project } = projection(clock)
  let snapshot = { r: project([offer("a", 10)]) }, calls = 0
  clock.now += 501
  const load = loader(clock, {
    "next/cache": { unstable_cache: () => async () => structuredClone(snapshot) },
    "./public": { getPublicMarketSignalMap: async () => {
      calls++
      return { r: project([offer("b", 20, BASE - 15 * DAY + 1000)]) }
    } },
  })
  const cached = load("lib/market/public-cached.ts").getCachedPublicMarketSignalMap
  assert.equal((await cached()).r.representativeAskItemEUR, 20)
  clock.now += 500
  const expired = await cached()
  assert.equal(expired.r.startingItemPriceEUR, null)
  assert.equal(expired.r.representativeAskItemEUR, null)
  assert.equal(expired.r.valueEUR, 30)
  assert.equal(expired.r.soldAnchorEUR, 25)
  assert.equal(calls, 1)
  snapshot = { r: { ...project([offer("c", 40, BASE)]), valueEUR: 45 } }
  assert.equal((await cached()).r.valueEUR, 45, "new shared data takes precedence")
  assert.equal((await cached()).r.representativeAskItemEUR, 40)
  snapshot = { r: { ...snapshot.r, offersValidUntil: iso(BASE) } }
  await cached()
  assert.equal(calls, 2, "changed expired cache entry is not masked by old recovery")
})

test("provider: 120s polling, focus coalescing, unchanged snapshots, out-of-order responses, unmount", async () => {
  const initial = { r: { valueEUR: 30 } }, pending = []
  const host = providerHarness(initial, () => new Promise((resolve) => pending.push(resolve)))
  await host.event("focus"); assert.equal(pending.length, 0)
  await host.advance(60_000); await host.event("focus"); await host.event("visibilitychange")
  assert.equal(pending.length, 1)
  pending[0](structuredClone(initial)); await host.settle()
  const renders = host.renders
  await host.advance(60_000); assert.equal(pending.length, 2)
  pending[1](structuredClone(initial)); await host.settle(); assert.equal(host.renders, renders)
  await host.advance(120_000); await host.advance(120_000)
  pending[3]({ r: { valueEUR: 40 } }); await host.settle()
  pending[2]({ r: { valueEUR: 35 } }); await host.settle(); assert.equal(host.snapshot.r.valueEUR, 40)
  await host.advance(120_000); host.unmount()
  pending[4]({ r: { valueEUR: 10 } }); await host.settle(); assert.equal(host.snapshot.r.valueEUR, 40)
})

test("browser timeout cap rearms and delayed expired responses never revive ASK", async () => {
  const clock = { now: BASE }, { project } = projection(clock)
  const initial = { r: project([{ ...offer("a", 10, BASE), channel: "retail" }]) }
  initial.r.representativeAskItemEUR = null; initial.r.offersValidUntil = iso(BASE + 31 * DAY)
  const host = providerHarness(initial, () => new Promise(() => {}), clock)
  await host.advance(31 * DAY + 1, false)
  assert.equal(host.snapshot.r.startingItemPriceEUR, null); host.unmount()
  const pending = [], delayed = providerHarness({ r: { valueEUR: 30 } }, () => new Promise((resolve) => pending.push(resolve)))
  await delayed.advance(120_000)
  pending[0]({ r: { ...initial.r, offersValidUntil: iso(BASE + 1) } }); await delayed.settle()
  assert.equal(delayed.snapshot.r.startingItemPriceEUR, null); delayed.unmount()
})

test("public projection/cache excludes raw audit, candidate, seller and user payload", () => {
  const clock = { now: BASE }, { project } = projection(clock), canary = "PRIVATE_IDENTITY_CANARY"
  const result = project([{ ...offer("a", 10), raw_payload: canary, sellerFingerprint: canary, candidateId: canary }], { ...row, startingOfferCandidateId: canary, user_id: canary, collection: canary })
  assert.doesNotMatch(JSON.stringify(result), /PRIVATE_IDENTITY_CANARY|raw_payload|sellerFingerprint|candidateId|user_id|"collection":/)
  assert.doesNotMatch(read("lib/market/public-cached.ts"), /cookies\(|headers\(|withUserContext|collection_items|wishlist_items|marketplace_sales/)
  assert.match(read("public/sw.js"), /event.request.method !== "GET" \|\| event.request.mode !== "navigate"/)
})

test("real analytics use ASK-only totals and rankings while Wishlist keeps separate market context", () => {
  const clock = { now: BASE }, { project } = projection(clock)
  const load = loader(clock, { "@/lib/data/corrected-products": {
    getProductById: () => { throw Error("UNEXPECTED_CATALOG_FALLBACK") },
    resolveRelease: () => { throw Error("UNEXPECTED_RELEASE_FALLBACK") },
  } })
  const { enrichCollection, portfolioSummary, topValued, enrichWishlist } = load("lib/analytics.ts")
  const { expirePublicMarketSignals } = load("lib/market/snapshot-expiry.ts")
  const current = project([offer("a", 10), {...offer("b", 20), sourceSlug:"ebay_active_public"}])
  const signals = {
    mv: { ...current, collectionAskItemEUR:30, collectionAskSellerCount:2, collectionAskObservedAt:iso(BASE), offersValidUntil:iso(BASE+500) },
    sold: { ...current, collectionAskItemEUR:25, collectionAskSellerCount:2, collectionAskObservedAt:iso(BASE), offersValidUntil:iso(BASE+500), valueEUR: null, soldAnchorEUR: 25 },
    ask: { ...current, collectionAskItemEUR:10, collectionAskSellerCount:2, collectionAskObservedAt:iso(BASE), offersValidUntil:iso(BASE+500), valueEUR: null, soldAnchorEUR: null, soldUnits: 0 },
  }
  const catalog = [{ id: "p", releases: Object.keys(signals).map((id) => ({ id })) }]
  const owned = ["mv", "sold", "ask"].map((releaseId, i) => ({ id: String(i), productId: "p", releaseId, condition: "Sealed", acquisitionPriceEUR: 20 }))
  owned.push({ ...owned[0], id: "built", condition: "Built" }, { ...owned[0], id: "opened", condition: "New / Opened" })
  const unchanged = JSON.stringify(owned)
  const enriched = enrichCollection(owned, signals, catalog)
  const summary = portfolioSummary(enriched)
  assert.equal(summary.marketReferenceValue, 65)
  assert.equal(summary.marketReferenceCount, 3)
  assert.equal(summary.gainCount, 3)
  assert.equal(summary.gain, 5)
  assert.equal(topValued(enriched, 5).map((entry) => entry.release.id).join(","), "mv,sold,ask")
  const wishlist = [{ productId: "p", releaseId: "ask", targetPrice: 12 }]
  assert.equal(enrichWishlist(wishlist, signals, catalog)[0].belowTarget, true)
  const expired = expirePublicMarketSignals(signals, BASE + 501)
  const after = portfolioSummary(enrichCollection(owned, expired, catalog))
  assert.equal(after.marketReferenceValue, 0)
  assert.equal(after.marketReferenceCount, 0)
  assert.equal(after.gainCount, 0)
  assert.equal(enrichWishlist(wishlist, expired, catalog)[0].belowTarget, false)
  assert.equal(JSON.stringify(owned), unchanged, "never mutate copy identities/conditions/acquisition data")
})

test("collection projection uses an independent EU median and preserves the separate international ASK", () => {
  const { project } = projection({now:BASE})
  const external = (id, price, country) => ({...offer(id,price,BASE),sourceSlug:"ebay_active_public",originCountry:country})
  const result = project([external("it-a",30,"IT"),external("it-b",40,"IT"),external("jp",1,"JP")])
  assert.equal(result.collectionAskItemEUR,35)
  assert.equal(result.collectionAskSellerCount,2)
  assert.equal(result.representativeAskItemEUR,30)
  assert.equal(result.valueEUR,30)
  const sparse = project([external("it-a",30,"IT"),external("jp",1,"JP")])
  assert.equal(sparse.collectionAskItemEUR,null)
  const changed = project([external("it-a",30,"IT"),external("it-b",50,"IT")])
  assert.equal(changed.collectionAskItemEUR,40)
})
