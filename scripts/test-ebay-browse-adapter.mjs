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
