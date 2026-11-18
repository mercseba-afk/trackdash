import assert from 'node:assert/strict'
import { withRecentRetailReserve } from '../lib/market/recent-retail-reserve.ts'
import { observedMarketReferencePrice, recentRetailReserveCaption } from '../lib/market/presentation.ts'
import { expirePublicMarketSignals, nextPublicMarketExpiry } from '../lib/market/snapshot-expiry.ts'
import { sealedCollectionReference } from '../lib/market/collection-valuation.ts'
import { verifiedAskingObservation } from '../lib/market/highlights.ts'
const now=Date.parse('2026-11-18T12:00:00Z'), DAY=86400000
const base={valueEUR:40,soldAnchorEUR:39,soldUnits:7,trendPercent:4,askTrendPercent:5,currentOfferCount:0,activeOfferCount:0,retailSourceCount:0,startingItemPriceEUR:null,representativeAskItemEUR:null,historicalAskItemEUR:null}
const quote={releaseId:'r',releaseDate:'2026-11-07',itemPriceEUR:9.05,checkedAt:new Date(now).toISOString(),origin:'extra_eu',acceptedExactKit:true,availability:'out_of_stock',channel:'retail'}
const reserved=withRecentRetailReserve(base,[quote],now)
assert.equal(observedMarketReferencePrice(reserved),9.05)
assert.equal(sealedCollectionReference(reserved).valueEUR,9.05)
assert.equal(reserved.collectionAskValidUntil,'2026-12-07T00:00:00.000Z')
for(const key of Object.keys(base).filter(k=>k!=='historicalAskItemEUR')) assert.equal(reserved[key],base[key],key)
assert.equal(verifiedAskingObservation(reserved,now),null,'Shop reserve cannot enter current market highlights')
assert.match(recentRetailReserveCaption(reserved,true),/esaurito/)
assert.match(recentRetailReserveCaption(reserved,false),/out of stock/)
for(const signal of [{...base,representativeAskItemEUR:33.60},{...base,startingItemPriceEUR:21.99},{...base,historicalAskItemEUR:27.37}]) assert.equal(withRecentRetailReserve(signal,[quote],now),signal,'Every existing quote is preserved exactly')
for(const change of [{channel:'marketplace'},{availability:'preorder'},{availability:'unknown'},{acceptedExactKit:false},{releaseDate:'2026'},{releaseDate:'2026-10-01'},{releaseDate:'2026-12-01'},{checkedAt:'2026-12-01'},{checkedAt:'2026-10-01'},{itemPriceEUR:0},{itemPriceEUR:NaN}]) assert.equal(withRecentRetailReserve(base,[{...quote,...change}],now),base,JSON.stringify(change))
assert.equal(withRecentRetailReserve(base,[quote,{...quote,itemPriceEUR:1,checkedAt:'2026-11-17'}],now).historicalAskItemEUR,9.05,'Latest actual shop quote, not cheapest stale shop')
const replacement=withRecentRetailReserve({...base,representativeAskItemEUR:25,representativeAskSellerCount:1},[quote],now)
assert.equal(observedMarketReferencePrice(replacement),25,'Later current quote automatically takes precedence')
assert.equal(replacement.historicalAskKind,undefined)
assert.equal(nextPublicMarketExpiry({r:reserved}),Date.parse(reserved.historicalAskValidUntil))
assert.equal(observedMarketReferencePrice(expirePublicMarketSignals({r:reserved},Date.parse(reserved.historicalAskValidUntil)).r),9.05)
const expired=expirePublicMarketSignals({r:reserved},Date.parse(reserved.historicalAskValidUntil)+1).r
assert.equal(observedMarketReferencePrice(expired),null)
assert.equal(sealedCollectionReference(expired),null)
assert.equal(expired.valueEUR,40)
assert.equal(expired.soldAnchorEUR,39)
const old={...base,historicalAskItemEUR:10,historicalAskObservedAt:'2026-10-01T00:00:00Z'}
assert.equal(observedMarketReferencePrice(expirePublicMarketSignals({r:old},now).r),10,'Existing 180-day history unchanged')
console.log('Recent retail reserve: existing prices preserved; current replacement; IT/EN stock label; strict release/quote age; offline expiry; no MV/SOLD/trend/highlight changes; collection parity')
