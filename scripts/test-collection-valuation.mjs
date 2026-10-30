import assert from "node:assert/strict"
import { collectionAskingMedian } from "../lib/market/representative-asking.ts"
import { sealedCollectionReference } from "../lib/market/collection-valuation.ts"
import { expirePublicMarketSignals } from "../lib/market/snapshot-expiry.ts"
const now = new Date("2026-10-30T08:00:00Z")
const offer = (seller, price, patch = {}) => ({
  listingKey: `listing:${seller}`, sellerFingerprint: seller, itemPriceEUR: price,
  origin: "eu", originCountry: "IT", sourceSlug: "ebay_active_public", sourceMarketRegion: "global",
  deliveredToItaly: false, acceptedExactKit: true, checkedAt: now.toISOString(), ...patch,
})
const median = (offers) => collectionAskingMedian(offers, now)
assert.equal(median([offer("a", 30)]), null, "A single seller cannot value a collection")
assert.equal(median([offer("a", 30), offer("a", 100, { listingKey: "another" })]), null)
assert.equal(median([offer("a", 20), offer("b", 30), offer("c", 500)]).itemPriceEUR, 30)
assert.equal(median([offer("a", 20), offer("a", 500, { listingKey: "another" }), offer("b", 30)]).itemPriceEUR, 25)
assert.equal(median([offer("a", 20), offer("b", 30), offer("c", 1, { origin: "extra_eu", originCountry: "HK" })]).itemPriceEUR, 25)
assert.equal(median([offer("a", 20), offer("b", 1, { origin: "extra_eu", originCountry: "HK", deliveredToItaly: true })]), null)
assert.equal(median([offer("a", 20), offer("b", 30, { origin: "unknown" })]), null)
assert.equal(median([offer("a", 20), offer("b", 30, { sourceSlug: "trackdash_collector_offers" })]), null)
assert.equal(median([offer("a", 20), offer("b", 30, { sourceMarketRegion: "internal" })]), null)
assert.equal(median([offer("a", 20), offer("b", 30, { acceptedExactKit: false })]), null)
assert.equal(median([offer("a", 20), offer("b", 30, { sellerFingerprint: null })]), null)
assert.equal(median([offer("a", 20), offer("b", 30, { checkedAt: "2026-10-14T08:00:00Z" })]), null)
assert.equal(median([offer("a", 20), offer("b", 30, { checkedAt: "2026-10-31T08:00:00Z" })]), null)
assert.equal(median([offer("a", 20), offer("b", 30, { itemPriceEUR: NaN })]), null)
assert.equal(median([offer("a", 20), offer("b", 30), offer("c", 1, { originCountry: "DE" })]).itemPriceEUR, 25, "Prefer two Italian sellers")
assert.equal(median([offer("a", 20), offer("b", 30, { originCountry: "DE" })]).itemPriceEUR, 25, "Use wider EU when Italy is insufficient")
assert.equal(median([offer("a", 20), offer("b", 30), offer("a", 1, { origin: "extra_eu", originCountry: "HK", checkedAt: "2026-10-30T08:00:01Z" })]).itemPriceEUR, 25, "Ignore future revisions")
assert.equal(median([offer("a", 20, { checkedAt: "2026-10-29T08:00:00Z" }), offer("b", 30), offer("a", 1, { origin: "extra_eu", originCountry: "HK" })]), null, "Latest revision supersedes older EU identity")
const signal = { collectionAskItemEUR: 25, collectionAskSellerCount: 2, collectionAskObservedAt: now.toISOString(), offersValidUntil: "2026-11-14T08:00:00Z", valueEUR: 999, soldAnchorEUR: 100, soldUnits: 50 }
assert.deepEqual(sealedCollectionReference(signal, +now), { valueEUR: 25, kind: "observed" })
assert.equal(sealedCollectionReference({ valueEUR: 14.92, soldAnchorEUR: 16.13, soldUnits: 5 }, +now), null, "No SOLD/MV fallback, including the audited old €31.05 case")
assert.equal(sealedCollectionReference({ ...signal, collectionAskSellerCount: 1 }, +now), null)
assert.equal(sealedCollectionReference({ ...signal, offersValidUntil: "invalid" }, +now), null)
assert.equal(sealedCollectionReference({ ...signal, offersValidUntil: "2026-10-29T08:00:00Z" }, +now), null)
assert.equal(sealedCollectionReference({ ...signal, collectionAskObservedAt: "2026-10-14T08:00:00Z" }, +now), null)
const expired = expirePublicMarketSignals({ r: signal }, Date.parse(signal.offersValidUntil) + 1)
assert.equal(expired.r.collectionAskItemEUR, null)
assert.equal(sealedCollectionReference(expired.r, +now), null)
assert.equal(expired.r.valueEUR, 999, "SOLD/MV context remains separate")
console.log("Collection ASK-only: independent EU sellers, Italy preference, source/condition/TTL guards, one basis, no SOLD/MV fallback and expiry passed")
