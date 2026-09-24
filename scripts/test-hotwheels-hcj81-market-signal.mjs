import assert from "node:assert/strict"
import { simulateHotWheelsMarketSignal } from "../lib/market/automation/hotwheels-market-simulator.ts"

const observations = [
  { source:"eBay DE", sourceFamily:"ebay", kind:"ask", itemPriceEUR:37.95, deliveredCostEUR:43.14, active:true },
  { source:"eBay US 1", sourceFamily:"ebay", kind:"ask", itemPriceEUR:21.95, deliveredCostEUR:null, active:true },
  { source:"eBay US 2", sourceFamily:"ebay", kind:"ask", itemPriceEUR:23.69, deliveredCostEUR:null, active:true },
  { source:"eBay US 3", sourceFamily:"ebay", kind:"ask", itemPriceEUR:26.34, deliveredCostEUR:null, active:true },
  { source:"eBay US 4", sourceFamily:"ebay", kind:"ask", itemPriceEUR:26.33, deliveredCostEUR:null, active:true },
  { source:"Retail HU", sourceFamily:"retail", kind:"ask", itemPriceEUR:27.30, deliveredCostEUR:null, active:true },

  { source:"eBay AT sold x2", sourceFamily:"ebay", kind:"sold", itemPriceEUR:85, valuationWeight:1, canonicalEligible:true },
  { source:"Mercari soft corners", sourceFamily:"mercari", kind:"sold", itemPriceEUR:14.92, valuationWeight:0, canonicalEligible:false },
  { source:"Mercari cracked blister", sourceFamily:"mercari", kind:"sold", itemPriceEUR:11.85, valuationWeight:0, canonicalEligible:false },
  { source:"Toys-shop historical sold-out", sourceFamily:"retail", kind:"sold", itemPriceEUR:7.99, valuationWeight:0, canonicalEligible:false },
]

const signal = simulateHotWheelsMarketSignal(observations)

assert.equal(signal.marketStatus, "observing")
assert.equal(signal.marketValueEUR, null)
assert.equal(signal.soldAnchorEUR, null)
assert.equal(signal.askAnchorEUR, 26.34)
assert.equal(signal.startingEffectiveCostEUR, 43.14)
assert.equal(signal.askMinEUR, 21.95)
assert.equal(signal.askMaxEUR, 37.95)
assert.equal(signal.soldSourceFamilies, 0)
assert.deepEqual(signal.guardedSold, [
  { source:"eBay AT sold x2", itemPriceEUR:85, reason:"OUTLIER_VS_ASK_CENTER" },
])

console.log(JSON.stringify(signal, null, 2))
console.log("HCJ81 MARKET SIGNAL SIMULATION PASSED")
