import assert from "node:assert/strict"
import { observedMarketReferencePrice } from "../lib/market/presentation.ts"
import { sealedCollectionReference, withCatalogAskingReference, collectionReferenceCaption } from "../lib/market/collection-valuation.ts"
import { expirePublicMarketSignals } from "../lib/market/snapshot-expiry.ts"
const now=Date.parse("2026-10-30T08:00:00Z")
const base={valueEUR:999,soldAnchorEUR:100,soldUnits:50,startingItemPriceEUR:null,historicalAskItemEUR:null,representativeAskItemEUR:null}
const samples=[
 {...base,representativeAskItemEUR:34.65,representativeAskSellerCount:10,representativeAskOrigin:"extra_eu",representativeAskObservedAt:new Date(now).toISOString(),offersValidUntil:"2026-11-14T08:00:00Z"},
 {...base,representativeAskItemEUR:46.36,representativeAskSellerCount:1,representativeAskOrigin:"extra_eu"},
 {...base,startingItemPriceEUR:20,currentAskOrigin:"eu"},
 {...base,historicalAskItemEUR:25,historicalAskObservedAt:"2026-09-30T08:00:00Z",historicalAskOrigin:"extra_eu"},
 base,
]
for(const original of samples){
 const signal=withCatalogAskingReference(original)
 const catalog=observedMarketReferencePrice(signal)
 assert.equal(sealedCollectionReference(signal)?.valueEUR??null,catalog)
 assert.equal(signal.collectionAskItemEUR,catalog)
 assert.equal(withCatalogAskingReference(signal),signal,"Stable projection preserves identity")
 assert.equal(sealedCollectionReference({...signal,collectionAskItemEUR:777})?.valueEUR??null,catalog,"Legacy collection fields cannot diverge from catalog")
}
assert.equal(sealedCollectionReference(base),null,"SOLD never becomes an asking-price contribution")
assert.match(collectionReferenceCaption(samples[1],true),/1 venditore/)
const input=withCatalogAskingReference({...samples[0],startingItemPriceEUR:21.96,observedPriceAt:new Date(now).toISOString(),currentAskOrigin:"extra_eu"})
const expired=expirePublicMarketSignals({r:input},Date.parse(input.offersValidUntil)+1)
assert.equal(observedMarketReferencePrice(expired.r),21.96)
assert.equal(sealedCollectionReference(expired.r).valueEUR,21.96,"Expiry keeps catalog and collection identical")
assert.equal(expired.r.collectionAskItemEUR,21.96)
const old=expirePublicMarketSignals(expired,now+181*86400000)
assert.equal(sealedCollectionReference(old.r),null)
console.log("Catalog/collection exact parity passed: international median, single quote, current/historical fallback, stale compatibility fields, expiry and no SOLD mixing")
