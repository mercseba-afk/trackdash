import assert from "node:assert/strict"
import {
  assessHotWheelsSecondaryObservation,
  inferHotWheelsSecondaryPackaging,
} from "../lib/market/automation/hotwheels-secondary-source-policy.ts"

let passed = 0
function ok(name, fn) {
  fn()
  passed += 1
  console.log(`ok: ${name}`)
}

const base = {
  source: "mercari",
  sourceRecordKey: "fixture",
  title: "Hot Wheels Mountain Drifters LB-ER34 Super Silhouette Nissan Skyline",
  status: "sold",
  structuredCondition: "new",
  exactReleaseMatch: true,
  isLot: false,
  quantity: 1,
  price: 20,
  currency: "USD",
  shipping: 5,
  originCountry: "US",
  deliveryCountry: "IT",
  soldOn: "2026-09-01",
}

ok("structured New with no damage language is acceptable packaging", () => {
  assert.equal(inferHotWheelsSecondaryPackaging(base), "acceptable")
})

ok("explicit soft corners and bends override marketplace New condition", () => {
  const result = assessHotWheelsSecondaryObservation({
    ...base,
    sourceRecordKey: "mercari-soft-corners",
    price: 17,
    shipping: 5.29,
    soldOn: null,
    description: "NEW PACKAGE HAS SOFT CORNERS & SMALL BENDS",
  })

  assert.equal(result.packaging, "damaged")
  assert.equal(result.marketUse, "context_only")
  assert.equal(result.reasonCodes.includes("PACKAGING_DAMAGED"), true)
  assert.equal(result.reasonCodes.includes("SOLD_DATE_MISSING"), true)
  assert.equal(result.visibleAcquisitionSubtotal, 22.29)
})

ok("explicit cracked blister stays context-only even when marketplace condition is New", () => {
  const result = assessHotWheelsSecondaryObservation({
    ...base,
    sourceRecordKey: "mercari-cracked-blister",
    price: 13.5,
    shipping: 4.99,
    soldOn: null,
    description: "Cracked Blister. Ships in protector.",
  })

  assert.equal(result.packaging, "damaged")
  assert.equal(result.marketUse, "context_only")
  assert.equal(result.reasonCodes.includes("PACKAGING_DAMAGED"), true)
  assert.equal(result.visibleAcquisitionSubtotal, 18.49)
})

ok("Unavailable is never promoted to SOLD without transaction proof", () => {
  const result = assessHotWheelsSecondaryObservation({
    ...base,
    source: "whatnot",
    sourceRecordKey: "whatnot-unavailable-mint",
    status: "unavailable",
    price: 25,
    shipping: null,
    soldOn: null,
    description: "Mint. Comes with protector.",
  })

  assert.equal(result.packaging, "acceptable")
  assert.equal(result.marketUse, "context_only")
  assert.deepEqual(result.reasonCodes, ["UNAVAILABLE_NOT_PROVEN_SOLD"])
})

ok("clean completed sale with date can become an MV candidate", () => {
  const result = assessHotWheelsSecondaryObservation({
    ...base,
    sourceRecordKey: "clean-sold",
    description: "Brand new sealed, mint card.",
  })

  assert.equal(result.packaging, "acceptable")
  assert.equal(result.marketUse, "mv_candidate")
  assert.deepEqual(result.reasonCodes, [])
})

ok("active exact-release listing is ASK, not SOLD", () => {
  const result = assessHotWheelsSecondaryObservation({
    ...base,
    sourceRecordKey: "active-ask",
    status: "active",
    price: 28,
    soldOn: null,
  })

  assert.equal(result.marketUse, "ask")
})

ok("EU retail ASK with unknown Italy shipping cannot become Disponibile da", () => {
  const result = assessHotWheelsSecondaryObservation({
    ...base,
    source: "eu-retailer",
    sourceRecordKey: "eu-retail-shipping-unknown",
    status: "active",
    price: 9990,
    currency: "HUF",
    shipping: null,
    originCountry: "HU",
    deliveryCountry: "IT",
    soldOn: null,
  })

  assert.equal(result.marketUse, "ask")
  assert.equal(result.deliveredCost, null)
  assert.equal(result.costBasis, "shipping_unknown")
})

ok("EU retail ASK with quoted Italy shipping gets a delivered cost", () => {
  const result = assessHotWheelsSecondaryObservation({
    ...base,
    source: "eu-retailer",
    sourceRecordKey: "eu-retail-delivered",
    status: "active",
    price: 25,
    currency: "EUR",
    shipping: 8,
    originCountry: "HU",
    deliveryCountry: "IT",
    soldOn: null,
  })

  assert.equal(result.marketUse, "ask")
  assert.equal(result.deliveredCost, 33)
  assert.equal(result.costBasis, "delivered_eu")
})

ok("extra-EU item plus visible shipping stays non-delivered while import is unknown", () => {
  const result = assessHotWheelsSecondaryObservation({
    ...base,
    sourceRecordKey: "us-ask",
    status: "active",
    price: 20,
    shipping: 6,
    originCountry: "US",
    deliveryCountry: "IT",
    soldOn: null,
  })

  assert.equal(result.marketUse, "ask")
  assert.equal(result.visibleAcquisitionSubtotal, 26)
  assert.equal(result.deliveredCost, null)
  assert.equal(result.costBasis, "extra_eu_import_unknown")
})

ok("lot observations are rejected from single-release valuation", () => {
  const result = assessHotWheelsSecondaryObservation({
    ...base,
    sourceRecordKey: "multi-item",
    isLot: true,
    quantity: 3,
  })

  assert.equal(result.marketUse, "rejected")
  assert.deepEqual(result.reasonCodes, ["MULTI_ITEM_NOT_COMPARABLE"])
})

ok("unconfirmed release identity is rejected before market use", () => {
  const result = assessHotWheelsSecondaryObservation({
    ...base,
    sourceRecordKey: "wrong-release",
    exactReleaseMatch: false,
  })

  assert.equal(result.marketUse, "rejected")
  assert.deepEqual(result.reasonCodes, ["RELEASE_NOT_CONFIRMED"])
})

console.log(`${passed} passed, 0 failed`)
console.log("HOT WHEELS SECONDARY SOURCE POLICY TEST PASSED")
