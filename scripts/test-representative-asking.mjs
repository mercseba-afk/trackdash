import assert from "node:assert/strict"
import { normalizeMarketListingKey, representativeAskingMedian } from "../lib/market/representative-asking.ts"
import {
  observedMarketPrice,
  observedMarketReferencePrice,
  observedMarketReferenceIsHistorical,
  representativeAskingCaption,
} from "../lib/market/presentation.ts"

const now = new Date("2026-10-12T14:00:00Z")
const build = (seller, amount, id = seller, origin = "extra_eu", extras = {}) => ({
  listingKey: `ebay:${id}`,
  sellerFingerprint: `ebay:${seller}`,
  itemPriceEUR: amount,
  origin,
  deliveredToItaly: false,
  checkedAt: "2026-10-11T19:43:11Z",
  acceptedExactKit: true,
  ...extras,
})

// Manta #95466, accepted exact edition / new unbuilt listing records,
// excluding the multiple independent listings by the SAME sellers.
const mantaOffers = [
  build("inamori", 13.39, "166299557532"),
  build("inamori", 17.84, "167947430516"),
  build("nippontrain", 21.96),
  build("ataraxia", 26.13),
  build("nodavica", 30.49),
  build("storefuji", 32.67),
  build("lucky", 32.68),
  build("pineroses", 36.59),
  build("pineroses", 46.39, "158095195216"),
  build("jsmarket", 69.27),
  build("astatine", 71.88),
]
// Real exact-Release eBay IDs persisted for #95466 on 2026-10-11.
// Regress the Production incident: an uncaptured regex group once normalized
// all eleven distinct IDs to "ebay:undefined", dropping eight sellers.
const mantaListingIds = [
  "166299557532", "167947430516", "375234252635",
  "117453957818", "366439416661", "205188159186",
  "267629243198", "158060247623", "158095195216",
  "204924066265", "255130570752",
]
assert.equal(mantaListingIds.length, mantaOffers.length)
const keys = mantaListingIds.map((id) => normalizeMarketListingKey(`v1|${id}|0`))
assert.equal(new Set(keys).size, 11, "Every persisted real eBay ID must remain distinct")
assert.ok(keys.every((key) => key && key !== "ebay:undefined"))
assert.equal(normalizeMarketListingKey(`ebay:v1|166299557532|0`), "ebay:166299557532")
assert.equal(normalizeMarketListingKey("166299557532"), "ebay:166299557532")
assert.equal(normalizeMarketListingKey("v1|166299557532|0"), "ebay:166299557532")
assert.equal(normalizeMarketListingKey(""), null)
assert.equal(normalizeMarketListingKey(null), null)
const mantaActualIds = representativeAskingMedian(mantaOffers.map((offer, i) => ({
  ...offer, listingKey: keys[i],
})), now)
assert.equal(mantaActualIds?.sellerCount, 9, "Correctly captured IDs must retain nine independently identified sellers")
assert.equal(mantaActualIds?.itemPriceEUR, 32.67, "Manta #95466 must not silently fall back to a single €21.96 listing")

const manta = representativeAskingMedian(mantaOffers, now)
assert.equal(manta?.itemPriceEUR, 32.67)
assert.equal(manta?.sellerCount, 9)
assert.equal(manta?.origin, "extra_eu")

// An extreme fraudulent-looking ask or repeated cross-marketplace listing
// must not have disproportionate weight or boost number of independent sellers.
assert.equal(representativeAskingMedian([...mantaOffers,
  build("inamori", 13.39, "166299557532"), build("inflated", 10000)], now)?.itemPriceEUR, 32.68)
assert.equal(representativeAskingMedian([...mantaOffers,
  build("inamori", 13.39, "166299557532")], now)?.sellerCount, 9)
assert.equal(representativeAskingMedian([...mantaOffers,
  build("invalid", 1, "bad", "eu", { acceptedExactKit: false })], now)?.origin, "extra_eu")

const cardSignal = {
  representativeAskItemEUR: manta?.itemPriceEUR,
  representativeAskSellerCount: manta?.sellerCount,
  representativeAskOrigin: manta?.origin,
  representativeAskObservedAt: manta?.observedAt,
  startingItemPriceEUR: null,
  historicalAskItemEUR: 13.39,
  currentAskOrigin: "unknown",
  historicalAskOrigin: "extra_eu",
}
assert.equal(observedMarketReferencePrice(cardSignal), 32.67)
assert.equal(observedMarketReferenceIsHistorical(cardSignal), false)
assert.match(representativeAskingCaption(cardSignal, true) ?? "", /9 venditori.*extra-UE/)
// Wishlist and purchase/portfolio canonical selected ASK remain UNCHANGED.
assert.equal(observedMarketPrice(cardSignal), null)

const europe = representativeAskingMedian([
  build("shop1", 19.42, "a", "eu"),
  build("shop2", 16.05, "b", "unknown", { deliveredToItaly: true }),
  build("shop3", 30, "c", "extra_eu"),
  build("shop4", 18.5, "d", "eu"),
], now)
assert.equal(europe?.itemPriceEUR, 18.96)
assert.equal(europe?.sellerCount, 4)
assert.equal(europe?.origin, "unknown", "Mixed EU/extra-EU/unknown offers must not be labelled European")
assert.match(representativeAskingCaption({
  representativeAskItemEUR: europe?.itemPriceEUR,
  representativeAskSellerCount: europe?.sellerCount,
  representativeAskOrigin: europe?.origin,
}, true) ?? "", /Mediana di 4 venditori.*annunci internazionali/)

const internationalWithEU = representativeAskingMedian([
  build("shop1", 10, "x", "eu"),
  build("foreign1", 20), build("foreign2", 30), build("foreign3", 40),
], now)
assert.equal(internationalWithEU?.itemPriceEUR, 25, "Seller ASK includes international offers, no geographic exclusion")
assert.equal(internationalWithEU?.sellerCount, 4)
assert.equal(internationalWithEU?.origin, "unknown", "A mixed global sample cannot claim EU or exclusively extra-EU origin")
assert.equal(representativeAskingMedian([
  build("old1", 10, "a", "eu", { checkedAt: "2026-09-01T00:00:00Z" }),
  build("old2", 20, "b", "eu", { checkedAt: "2026-09-01T00:00:00Z" }),
  build("old3", 30, "c", "eu", { checkedAt: "2026-09-01T00:00:00Z" }),
], now), null, "Expired listings must not appear current")
const oneSeller = representativeAskingMedian([
  build("one", 10), build("one", 20, "other"), build("one", 30, "third"),
], now)
assert.equal(oneSeller?.itemPriceEUR, 10, "One verified seller contributes their actual lowest asking price")
assert.equal(oneSeller?.sellerCount, 1, "Multiple offers from one seller are not a multi-seller median")
assert.match(representativeAskingCaption({
  representativeAskItemEUR: oneSeller?.itemPriceEUR,
  representativeAskSellerCount: oneSeller?.sellerCount,
  representativeAskOrigin: oneSeller?.origin,
}, true) ?? "", /Prezzo di 1 venditore.*extra-UE/)

const twoSellers = representativeAskingMedian([build("one", 18), build("two", 25)], now)
assert.equal(twoSellers?.itemPriceEUR, 21.5, "With 2 sellers the median is their arithmetic midpoint")
assert.equal(twoSellers?.sellerCount, 2)
assert.match(representativeAskingCaption({
  representativeAskItemEUR: twoSellers?.itemPriceEUR,
  representativeAskSellerCount: twoSellers?.sellerCount,
  representativeAskOrigin: twoSellers?.origin,
}, true) ?? "", /Mediana di 2 venditori/)
const twoAccepted = representativeAskingMedian([
  build("a", 1, "a", "eu", { acceptedExactKit: false }),
  build("b", 2, "b", "eu"), build("c", 3, "c", "eu"),
], now)
assert.equal(twoAccepted?.itemPriceEUR, 2.5, "Only the two accepted listings may enter the median")
assert.equal(twoAccepted?.sellerCount, 2)

const none = representativeAskingMedian([
  build("wrong", 1, "bad", "eu", { acceptedExactKit: false }),
  build("expired", 50, "old", "eu", { checkedAt: "2026-09-01T00:00:00Z" }),
], now)
assert.equal(none, null, "Zero current verified sellers yields no representative asking price")
assert.equal(representativeAskingMedian([], now), null)

console.log("ASK projection: all 11 real Manta listing IDs -> 9 sellers -> €32.67, 0/1/2+/global sellers, MV/Wishlist isolation — PASS")
