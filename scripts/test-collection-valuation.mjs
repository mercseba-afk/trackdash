import assert from "node:assert/strict"
import { sealedCollectionReference } from "../lib/market/collection-valuation.ts"

// Test intentionally uses only the public, client-safe market-signal projection.
function signal(overrides = {}) {
  return {
    valueEUR: null,
    soldAnchorEUR: null,
    soldUnits: 0,
    startingItemPriceEUR: null,
    startingEffectiveCostEUR: null,
    startingCostBasis: null,
    observedShippingEUR: null,
    currentAskOrigin: "unknown",
    historicalAskItemEUR: null,
    historicalAskObservedAt: null,
    ...overrides,
  }
}

// Verified current production evidence for the user's four sealed Mini 4WDs.
const manta = sealedCollectionReference(signal({
  soldAnchorEUR: 16.13, soldUnits: 1,
  startingItemPriceEUR: null, currentAskOrigin: "extra_eu",
  historicalAskItemEUR: 13.39, historicalAskObservedAt: "2026-10-11T19:43:11Z",
}))
assert.deepEqual(manta, { valueEUR: 16.13, kind: "sold" })

const avante = sealedCollectionReference(signal({
  startingItemPriceEUR: 16.05, startingEffectiveCostEUR: 27.36,
  startingCostBasis: "delivered", observedShippingEUR: 11.31,
  currentAskOrigin: "unknown",
}))
assert.deepEqual(avante, { valueEUR: 16.05, kind: "observed" })

const proto = sealedCollectionReference(signal({
  valueEUR: 12.72, soldAnchorEUR: 12.72, soldUnits: 7,
  startingItemPriceEUR: 73.20, currentAskOrigin: "eu",
}))
assert.deepEqual(proto, { valueEUR: 12.72, kind: "estimated" })

const dyna = sealedCollectionReference(signal({
  valueEUR: 14.92, soldAnchorEUR: 14.92, soldUnits: 5,
  historicalAskItemEUR: 46.36,
}))
assert.deepEqual(dyna, { valueEUR: 14.92, kind: "estimated" })

const total = [manta, avante, proto, dyna].reduce((sum, row) => sum + (row?.valueEUR ?? 0), 0)
assert.equal(Math.round(total * 100), 5982, "The current four sealed copies should total an honest €59.82 reference")

// A 13.39€ Japanese item-only quote with unknown shipping cannot
// displace a completed sale or become the price of a European-owned copy.
assert.equal(sealedCollectionReference(signal({
  startingItemPriceEUR: 13.39,
  currentAskOrigin: "extra_eu",
})), null)

// The same fail-closed rule holds when origin is entirely unknown.
assert.equal(sealedCollectionReference(signal({
  startingItemPriceEUR: 33.33,
  currentAskOrigin: "unknown",
})), null)
assert.equal(sealedCollectionReference(signal({
  historicalAskItemEUR: 140, historicalAskObservedAt: "2026-10-01T00:00:00Z",
})), null, "Historical ASK is display-only, never a portfolio estimate")

// Current, documented European asks may stand in when MV/SOLD are unavailable.
assert.deepEqual(sealedCollectionReference(signal({
  startingItemPriceEUR: 30, currentAskOrigin: "eu",
})), { valueEUR: 30, kind: "observed" })

// A known extra-EU source with import costs not included is not a
// European valuation, even if the listing reports basic shipping.
assert.equal(sealedCollectionReference(signal({
  startingItemPriceEUR: 9, startingEffectiveCostEUR: 20,
  observedShippingEUR: 11, startingCostBasis: "delivered",
  currentAskOrigin: "extra_eu",
})), null)

assert.equal(sealedCollectionReference(signal({
  startingItemPriceEUR: 90, startingEffectiveCostEUR: 100,
  observedShippingEUR: 1, startingCostBasis: "delivered",
  currentAskOrigin: "unknown",
})), null, "Quoted item + shipping must reconcile")
assert.equal(sealedCollectionReference(null), null)

console.log("Collection sealed reference: 10 source-sensitive scenarios passed; €59.82 audited, no fabricated MV")
