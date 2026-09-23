import assert from "node:assert/strict"
import {
  buildHotWheelsEbayQueries,
  classifyHotWheelsEbayListing,
  refineHotWheelsEbayListingWithItemDetails,
} from "../lib/market/automation/hotwheels-ebay-matcher.ts"

let passed = 0
function ok(name, fn) {
  fn()
  passed += 1
  console.log(`ok: ${name}`)
}

const mountain = {
  releaseId: "mountain-red",
  castingName: "LB-ER34 Super Silhouette Nissan Skyline",
  releaseYear: 2022,
  primaryIdentifier: "HCJ81",
  lineName: "Car Culture",
  subseries: "Mountain Drifters",
  seriesPosition: "4/5",
  commercialForm: "single",
  siblingIdentifiers: ["HCK01"],
}

const chase = {
  ...mountain,
  releaseId: "mountain-chase",
  primaryIdentifier: "HCK01",
  seriesPosition: "0/5",
  chaseType: "Chase",
  siblingIdentifiers: ["HCJ81"],
}

const teamTransport = {
  releaseId: "team-transport",
  castingName: "LB-ER34 Super Silhouette Nissan Skyline",
  releaseYear: 2022,
  primaryIdentifier: "HCN54",
  lineName: "Team Transport",
  collectorNumber: "44",
  commercialForm: "team_transport",
}

const twoPack = {
  releaseId: "two-pack",
  castingName: "LB-ER34 Super Silhouette Nissan Skyline",
  releaseYear: 2023,
  primaryIdentifier: "HKF49",
  lineName: "Car Culture 2-Pack",
  subseries: "Nissan Skylines",
  commercialForm: "two_pack",
}

const listing = (title, extra = {}) => ({
  title,
  condition: "New",
  conditionId: "1000",
  itemEndDate: null,
  ...extra,
})

ok("exact query leads with Hot Wheels and the exact Mattel identifier", () => {
  const [query] = buildHotWheelsEbayQueries(mountain)
  assert.equal(query.startsWith("Hot Wheels HCJ81"), true)
  assert.equal(query.includes("LB-ER34"), true)
})

ok("query builder also returns a context fallback for recall measurement", () => {
  const queries = buildHotWheelsEbayQueries(chase)
  assert.equal(queries.length, 2)
  assert.equal(queries[1].includes("Mountain Drifters"), true)
  assert.equal(queries[1].includes("Chase"), true)
})

ok("exact Mattel identifier plus casting is accepted", () => {
  const result = classifyHotWheelsEbayListing(
    listing("Hot Wheels Premium Car Culture Mountain Drifters LB-ER34 Nissan Skyline HCJ81"),
    mountain,
  )
  assert.equal(result.decision, "accepted")
  assert.deepEqual(result.reasonCodes, ["MATTEL_IDENTIFIER_EXACT"])
})

ok("same casting without exact identifier is review-only during pilot", () => {
  const result = classifyHotWheelsEbayListing(
    listing("Hot Wheels Premium Mountain Drifters LB-ER34 Super Silhouette Nissan Skyline red 4/5"),
    mountain,
  )
  assert.equal(result.decision, "needs_review")
  assert.equal(result.reasonCodes.includes("IDENTIFIER_NOT_IN_TITLE"), true)
})

ok("sibling Chase identifier is rejected from regular Mountain Drifters release", () => {
  const result = classifyHotWheelsEbayListing(
    listing("Hot Wheels LB-ER34 Super Silhouette Nissan Skyline HCK01 Chase 0/5"),
    mountain,
  )
  assert.equal(result.decision, "rejected")
  assert.equal(result.reasonCodes.includes("SIBLING_RELEASE_IDENTIFIER"), true)
})

ok("chase wording without exact code remains review-only for Chase target", () => {
  const result = classifyHotWheelsEbayListing(
    listing("Hot Wheels LB-ER34 Super Silhouette Nissan Skyline Mountain Drifters 0/5 Chase"),
    chase,
  )
  assert.equal(result.decision, "needs_review")
  assert.equal(result.reasonCodes.includes("CHASE_CONTEXT_MATCH"), true)
})

ok("regular target rejects Chase listing even if casting matches", () => {
  const result = classifyHotWheelsEbayListing(
    listing("Hot Wheels LB-ER34 Super Silhouette Nissan Skyline Mountain Drifters Chase 0/5"),
    mountain,
  )
  assert.equal(result.decision, "rejected")
  assert.equal(result.reasonCodes.includes("CHASE_MISMATCH"), true)
})

ok("wrong casting is rejected even when text contains the target code", () => {
  const result = classifyHotWheelsEbayListing(
    listing("Hot Wheels HCJ81 Porsche 911 Premium Car Culture"),
    mountain,
  )
  assert.equal(result.decision, "rejected")
  assert.equal(result.reasonCodes.includes("CASTING_NOT_CONFIRMED"), true)
})

ok("loose/custom/accessory listings are rejected", () => {
  for (const title of [
    "Hot Wheels HCJ81 LB-ER34 Nissan Skyline loose",
    "Hot Wheels HCJ81 LB-ER34 Nissan Skyline custom wheel swap",
    "Hot Wheels HCJ81 LB-ER34 Nissan Skyline card only",
  ]) {
    assert.equal(classifyHotWheelsEbayListing(listing(title), mountain).decision, "rejected")
  }
})

ok("opened or damaged packaging is rejected from the canonical new-carded market", () => {
  for (const title of [
    "Hot Wheels HCJ81 LB-ER34 Nissan Skyline opened blister",
    "Hot Wheels HCJ81 LB-ER34 Nissan Skyline damaged card",
    "Hot Wheels HCJ81 LB-ER34 Nissan Skyline cracked blister",
    "Hot Wheels HCJ81 LB-ER34 Nissan Skyline without card",
  ]) {
    const result = classifyHotWheelsEbayListing(listing(title), mountain)
    assert.equal(result.decision, "rejected")
    assert.equal(result.reasonCodes.includes("LOOSE_CUSTOM_OR_ACCESSORY"), true)
  }
})

ok("known packaging subvariants remain review-only even with the exact Mattel code", () => {
  for (const title of [
    "Hot Wheels JBC35 87 Audi quattro Super Treasure Hunt factory sealed set",
    "Hot Wheels HCJ81 LB-ER34 Nissan Skyline international card",
    "Hot Wheels HCJ81 LB-ER34 Nissan Skyline short card",
  ]) {
    const profile = title.includes("JBC35")
      ? {
          releaseId: "audi-sth",
          castingName: "87 Audi quattro",
          releaseYear: 2025,
          primaryIdentifier: "JBC35",
          lineName: "Mainline",
          subseries: "Factory Fresh",
          chaseType: "Super Treasure Hunt",
          commercialForm: "single",
        }
      : mountain
    const result = classifyHotWheelsEbayListing(listing(title), profile)
    assert.equal(result.decision, "needs_review")
    assert.equal(result.reasonCodes.includes("PACKAGE_SUBVARIANT_REVIEW"), true)
  }
})

ok("ordinary multi-item lot is rejected", () => {
  const result = classifyHotWheelsEbayListing(
    listing("Hot Wheels HCJ81 LB-ER34 Nissan Skyline lot bundle"),
    mountain,
  )
  assert.equal(result.decision, "rejected")
  assert.equal(result.reasonCodes.includes("MULTI_ITEM_LOT"), true)
})

ok("Team Transport commercial package is not rejected merely for multi-vehicle wording", () => {
  const result = classifyHotWheelsEbayListing(
    listing("Hot Wheels Team Transport HCN54 LB-ER34 Nissan Skyline & Fleet Street 2pcs"),
    teamTransport,
  )
  assert.equal(result.decision, "accepted")
})

ok("2-Pack commercial release is accepted by exact SKU", () => {
  const result = classifyHotWheelsEbayListing(
    listing("Hot Wheels Premium Car Culture 2-Pack Nissan Skylines HKF49 LB-ER34 Super Silhouette"),
    twoPack,
  )
  assert.equal(result.decision, "accepted")
})

ok("structured used condition is rejected regardless of title", () => {
  const result = classifyHotWheelsEbayListing(
    listing("Hot Wheels HCJ81 LB-ER34 Nissan Skyline", { conditionId: "3000" }),
    mountain,
  )
  assert.equal(result.decision, "rejected")
  assert.equal(result.reasonCodes.includes("NOT_NEW_CONDITION"), true)
})

ok("ended active listing is rejected", () => {
  const result = classifyHotWheelsEbayListing(
    listing("Hot Wheels HCJ81 LB-ER34 Nissan Skyline", { itemEndDate: "2026-01-01T00:00:00.000Z" }),
    mountain,
    new Date("2026-09-23T00:00:00Z"),
  )
  assert.equal(result.decision, "rejected")
  assert.equal(result.reasonCodes.includes("LISTING_ENDED"), true)
})


const detailFixture = (overrides = {}) => ({
  itemId: "v1|fixture|0",
  legacyItemId: "123456789012",
  title: "Hot Wheels LB-ER34 Super Silhouette Nissan Skyline",
  gtin: null,
  brand: "Hot Wheels",
  mpn: null,
  localizedAspects: [],
  ...overrides,
})

ok("item details MPN can promote a review-only listing", () => {
  const initial = classifyHotWheelsEbayListing(
    listing("Hot Wheels Premium Mountain Drifters LB-ER34 Nissan Skyline red 4/5"),
    mountain,
  )
  assert.equal(initial.decision, "needs_review")

  const refined = refineHotWheelsEbayListingWithItemDetails(
    initial,
    detailFixture({ mpn: "HCJ81" }),
    mountain,
  )
  assert.equal(refined.decision, "accepted")
  assert.deepEqual(refined.reasonCodes, ["MATTEL_IDENTIFIER_ITEM_DETAILS"])
})

ok("item details can match identifier embedded in a longer aspect value", () => {
  const initial = classifyHotWheelsEbayListing(
    listing("Hot Wheels Premium Mountain Drifters LB-ER34 Nissan Skyline red"),
    mountain,
  )
  const refined = refineHotWheelsEbayListingWithItemDetails(
    initial,
    detailFixture({
      localizedAspects: [{ name: "MPN", value: "HCJ81-A1" }],
    }),
    mountain,
  )
  assert.equal(refined.decision, "accepted")
})

ok("item details MPN can match the Mattel code inside a longer value", () => {
  const audi = {
    releaseId: "audi-sth",
    castingName: "87 Audi quattro",
    releaseYear: 2025,
    primaryIdentifier: "JBC35",
    lineName: "Mainline",
    subseries: "Factory Fresh",
    chaseType: "Super Treasure Hunt",
    commercialForm: "single",
  }
  const initial = classifyHotWheelsEbayListing(
    listing("2025 Hot Wheels 87 Audi quattro STH Super Treasure Hunt 16/250"),
    audi,
  )
  assert.equal(initial.decision, "needs_review")
  const refined = refineHotWheelsEbayListingWithItemDetails(
    initial,
    detailFixture({ mpn: "JBC35-N521" }),
    audi,
  )
  assert.equal(refined.decision, "accepted")
  assert.deepEqual(refined.reasonCodes, ["MATTEL_IDENTIFIER_ITEM_DETAILS"])
})

ok("item details never override a packaging-subvariant review", () => {
  const initial = classifyHotWheelsEbayListing(
    listing("Hot Wheels HCJ81 LB-ER34 Nissan Skyline international card"),
    mountain,
  )
  assert.equal(initial.decision, "needs_review")
  assert.deepEqual(initial.reasonCodes, ["PACKAGE_SUBVARIANT_REVIEW"])

  const refined = refineHotWheelsEbayListingWithItemDetails(
    initial,
    detailFixture({ mpn: "HCJ81" }),
    mountain,
  )
  assert.equal(refined.decision, "needs_review")
  assert.deepEqual(refined.reasonCodes, ["PACKAGE_SUBVARIANT_REVIEW"])
})

ok("item details sibling identifier rejects a review-only listing", () => {
  const initial = classifyHotWheelsEbayListing(
    listing("Hot Wheels Mountain Drifters LB-ER34 Nissan Skyline"),
    mountain,
  )
  const refined = refineHotWheelsEbayListingWithItemDetails(
    initial,
    detailFixture({ mpn: "HCK01" }),
    mountain,
  )
  assert.equal(refined.decision, "rejected")
  assert.deepEqual(refined.reasonCodes, ["SIBLING_RELEASE_IDENTIFIER_ITEM_DETAILS"])
})

ok("item details without target or sibling identifier stay review-only", () => {
  const initial = classifyHotWheelsEbayListing(
    listing("Hot Wheels Mountain Drifters LB-ER34 Nissan Skyline"),
    mountain,
  )
  const refined = refineHotWheelsEbayListingWithItemDetails(
    initial,
    detailFixture({
      mpn: "UNKNOWN",
      gtin: "1234567890123",
      localizedAspects: [{ name: "Series", value: "Mountain Drifters" }],
    }),
    mountain,
  )
  assert.equal(refined.decision, "needs_review")
  assert.deepEqual(refined.reasonCodes, initial.reasonCodes)
})

ok("item details can never upgrade an already rejected listing", () => {
  const initial = classifyHotWheelsEbayListing(
    listing("Hot Wheels HCJ81 Porsche 911 Premium Car Culture"),
    mountain,
  )
  assert.equal(initial.decision, "rejected")
  const refined = refineHotWheelsEbayListingWithItemDetails(
    initial,
    detailFixture({ mpn: "HCJ81" }),
    mountain,
  )
  assert.equal(refined.decision, "rejected")
  assert.deepEqual(refined.reasonCodes, initial.reasonCodes)
})

console.log(`${passed} passed, 0 failed`)
console.log("HOT WHEELS EBAY MATCHER TEST PASSED")
