import assert from "node:assert/strict"
import { collectionAskingMedian } from "../lib/market/representative-asking.ts"
import { sealedCollectionReference, collectionReferenceCaption } from "../lib/market/collection-valuation.ts"
import { expirePublicMarketSignals } from "../lib/market/snapshot-expiry.ts"
const now = new Date("2026-10-30T08:00:00Z")
const offer = (seller, price, patch = {}) => ({
  listingKey:`listing:${seller}`,sellerFingerprint:seller,itemPriceEUR:price,
  origin:"eu",originCountry:"DE",sourceSlug:"ebay_active_public",sourceMarketRegion:"global",
  deliveredToItaly:false,acceptedExactKit:true,checkedAt:now.toISOString(),...patch,
})
const median = offers => collectionAskingMedian(offers,now)
assert.equal(median([offer("a",30)]).itemPriceEUR,30)
assert.equal(median([offer("a",30),offer("a",100,{listingKey:"another"})]).sellerCount,1)
assert.equal(median([offer("a",20),offer("b",30),offer("c",500)]).itemPriceEUR,30)
assert.equal(median([offer("a",20),offer("a",500,{listingKey:"another"}),offer("b",30)]).itemPriceEUR,25)
assert.equal(median([offer("a",20),offer("b",30),offer("c",1,{origin:"extra_eu",originCountry:"HK"})]).itemPriceEUR,25)
assert.equal(median([offer("jp",32,{origin:"extra_eu",originCountry:"JP"}),offer("hk",28,{origin:"extra_eu",originCountry:"HK"})]).itemPriceEUR,30)
assert.equal(median([offer("a",46.36,{origin:"extra_eu",originCountry:"JP"})]).itemPriceEUR,46.36,"Dyna quote remains usable")
assert.equal(median([offer("a",20,{originCountry:"IT"}),offer("b",30)]).itemPriceEUR,20,"Prefer Italian evidence, even a single quote")
assert.equal(median([offer("a",20,{origin:"unknown"})]).itemPriceEUR,20)
for(const patch of [{sourceSlug:"trackdash_offers"},{sourceMarketRegion:"internal"},{acceptedExactKit:false},{sellerFingerprint:null},{checkedAt:"2026-01-01T00:00:00Z"},{checkedAt:"2026-10-31T08:00:00Z"},{itemPriceEUR:NaN}])assert.equal(median([offer("a",20,patch)]),null)
const historic=median([offer("old",25,{checkedAt:"2026-09-30T08:00:00Z"})])
assert.equal(historic.itemPriceEUR,25);assert.equal(historic.isHistorical,true)
assert.equal(median([offer("old",10,{checkedAt:"2026-09-30T08:00:00Z",originCountry:"IT"}),offer("new",30,{origin:"extra_eu",originCountry:"JP"})]).itemPriceEUR,30,"Current evidence precedes old domestic quotes")
const signal={collectionAskItemEUR:25,collectionAskSellerCount:1,collectionAskOrigin:"extra_eu",collectionAskObservedAt:now.toISOString(),collectionAskValidUntil:"2027-04-28T08:00:00Z",offersValidUntil:"2026-11-14T08:00:00Z",valueEUR:999,soldAnchorEUR:100,soldUnits:50}
assert.deepEqual(sealedCollectionReference(signal,+now),{valueEUR:25,kind:"observed"})
assert.equal(sealedCollectionReference({valueEUR:14.92,soldAnchorEUR:16.13,soldUnits:5},+now),null,"No mixing with SOLD")
assert.equal(sealedCollectionReference({...signal,collectionAskSellerCount:0},+now),null)
assert.equal(sealedCollectionReference({...signal,collectionAskValidUntil:"invalid"},+now),null)
assert.equal(sealedCollectionReference({...signal,collectionAskObservedAt:"2026-01-01T00:00:00Z"},+now),null)
const dated=expirePublicMarketSignals({r:signal},Date.parse(signal.offersValidUntil)+1)
assert.equal(dated.r.collectionAskItemEUR,25);assert.equal(dated.r.collectionAskIsHistorical,true)
assert.match(collectionReferenceCaption(dated.r,true),/1 quotazione.*Extra UE.*30\/10\/2026/)
const expired=expirePublicMarketSignals(dated,Date.parse(signal.collectionAskValidUntil)+1)
assert.equal(expired.r.collectionAskItemEUR,null);assert.equal(expired.r.valueEUR,999)
console.log("Flexible ASK collection passed: local priority, international/single quotes, seller dedup, dated references, expiry and no SOLD mixing")
