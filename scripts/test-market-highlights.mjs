import assert from 'node:assert/strict'
import { test } from 'node:test'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { recentCollectorMarketTrend, verifiedAskingObservation, latestVerifiedAskingRows, highestVerifiedAskingRows } from '../lib/market/highlights.ts'
import { fixture } from './fixtures/market-ui-render.mjs'

const now = Date.parse('2026-10-29T10:00:00Z')
const day = 86400000
const iso = (age) => new Date(now - age * day).toISOString()
const trend = { valueEUR: 48.79, trendPercent: 25.11, trendBasis: 'sold', trendUpdatedAt: iso(48), computedAt: iso(0) }
const quote = { valueEUR: null, trendPercent: null, currentOfferCount: 1, representativeAskItemEUR: 164.07,
  representativeAskSellerCount: 1, representativeAskOrigin: 'extra_eu', representativeAskObservedAt: iso(0.1) }

test('a new recompute never renews a September collector trend', () => {
  assert.equal(recentCollectorMarketTrend(trend, now), null)
  assert.equal(trend.trendPercent, 25.11)
  assert.equal(trend.trendUpdatedAt, iso(48))
  assert.equal(recentCollectorMarketTrend({ ...trend, trendUpdatedAt: iso(30) }, now), 25.11)
  for (const date of [null, 'invalid', iso(-1), iso(30.001)]) {
    assert.equal(recentCollectorMarketTrend({ ...trend, trendUpdatedAt: date }, now), null)
  }
  assert.equal(recentCollectorMarketTrend({ ...trend, trendUpdatedAt: iso(1), trendBasis: null }, now), null)
  assert.equal(recentCollectorMarketTrend({ ...trend, trendUpdatedAt: iso(1), trendPercent: NaN }, now), null)
})

test('a current extra-EU quote is an ASK, never a growth event or a Market Value', () => {
  assert.equal(recentCollectorMarketTrend(quote, now), null)
  assert.deepEqual(verifiedAskingObservation(quote, now), {
    priceEUR: 164.07, observedAt: iso(0.1), origin: 'extra_eu', representative: true,
  })
  assert.equal(quote.valueEUR, null)
})

test('latest checks reject expired, future, malformed and historical-only asks', () => {
  for (const patch of [
    { representativeAskObservedAt: iso(16) }, { representativeAskObservedAt: iso(-1) },
    { representativeAskObservedAt: 'invalid' }, { representativeAskSellerCount: 0 },
    { representativeAskItemEUR: Infinity }, { offersValidUntil: iso(0.01) }, { offersValidUntil: 'bad' },
  ]) assert.equal(verifiedAskingObservation({ ...quote, ...patch }, now), null)
  assert.equal(verifiedAskingObservation({ historicalAskItemEUR: 99, historicalAskObservedAt: iso(1) }, now), null)
})

test('canonical retail and marketplace quotes keep their existing freshness windows', () => {
  const retail = { currentOfferCount: 1, startingItemPriceEUR: 15.90, observedPriceChannel: 'retail',
    observedPriceAt: iso(20), currentAskOrigin: 'eu' }
  assert.equal(verifiedAskingObservation(retail, now).priceEUR, 15.9)
  assert.equal(verifiedAskingObservation({ ...retail, observedPriceChannel: 'marketplace' }, now), null)
  assert.equal(verifiedAskingObservation({ ...retail, currentOfferCount: 0 }, now), null)
})

test('latest observations rank by evidence time, not computedAt, and keep distinct families', () => {
  const row = (id, family, age) => ({ release: { id }, product: { id: family },
    signal: { ...quote, representativeAskObservedAt: iso(age) } })
  const a = row('old', 'a', 2), b = row('new', 'a', 1), c = row('other', 'b', 1.5)
  assert.deepEqual(latestVerifiedAskingRows([a, c, b], 4, now).map(x => x.release.id), ['new', 'other'])
  assert.deepEqual(latestVerifiedAskingRows([a, b], 0, now), [])
  assert.deepEqual([a, c, b].map(x => x.release.id), ['old', 'other', 'new'])
})

test('highest asks use the displayed fresh quote, update their order and keep distinct families', () => {
  const row = (id, family, price) => ({ release: { id }, product: { id: family }, signal: {
    ...quote, representativeAskItemEUR: price, startingItemPriceEUR: 10,
    observedPriceAt: iso(1), observedPriceChannel: 'marketplace', currentAskOrigin: 'eu',
  } })
  const a = row('a', 'family-a', 164.07), b = row('b', 'family-b', 181)
  const sibling = row('sibling', 'family-b', 179.65)
  const stale = row('stale', 'family-c', 999)
  stale.signal.offersValidUntil = iso(1)
  assert.deepEqual(highestVerifiedAskingRows([a, sibling, stale, b], 4, now).map(x => x.release.id), ['b', 'a'])
  a.signal.representativeAskItemEUR = 200
  assert.deepEqual(highestVerifiedAskingRows([a, sibling, stale, b], 4, now).map(x => x.release.id), ['a', 'b'])
  assert.equal(verifiedAskingObservation(a.signal, now).priceEUR, 200)
  assert.deepEqual(highestVerifiedAskingRows([a], 0, now), [])
})

for (const locale of ['it', 'en']) test(`dashboard ${locale}: old gains disappear while new quotes carry dates and origin`, () => {
  const { load, products, signals } = fixture(locale, { user: { id: 'qa' }, hydrated: true })
  const actualNow = Date.now()
  products[0].releases[0].editionName = 'September gain sentinel'
  signals.r0 = { ...signals.r0, ...trend, trendUpdatedAt: new Date(actualNow - 48 * day).toISOString() }
  products[0].releases[1].editionName = 'Latest quote sentinel'
  signals.r1 = { ...signals.r1, ...quote, representativeAskObservedAt: new Date(actualNow - 60000).toISOString() }
  const Component = load('components/dashboard-market-overview.tsx').DashboardMarketOverview
  const html = renderToStaticMarkup(React.createElement(Component, { products }))
  assert.match(html, /Latest quote sentinel/)
  assert.match(html, /164,07/)
  assert.match(html, /extra-UE|non-EU/)
  assert.match(html, /Verificato il|Checked on/)
  assert.match(html, /Spedizione esclusa|Shipping excluded/)
  assert.doesNotMatch(html, /September gain sentinel|>In crescita<|>Growing</)
  signals.r0.trendUpdatedAt = new Date(actualNow - day).toISOString()
  const recentHtml = renderToStaticMarkup(React.createElement(Component, { products }))
  assert.match(recentHtml, /September gain sentinel/)
  assert.match(recentHtml, /In crescita|Growing/)
  assert.equal((recentHtml.match(/Latest quote sentinel/g) ?? []).length, 2,
    'a family in Growth keeps its asking quote in the independent Highest asks block')
})

for (const locale of ['it', 'en']) test(`public home and market ${locale}: the same old trend cannot appear as current growth`, () => {
  const { load, products, signals } = fixture(locale, { user: { id: 'qa' }, hydrated: true })
  const actualNow = Date.now()
  products[0].releases[0].editionName = 'September gain sentinel'
  signals.r0 = { ...signals.r0, ...trend, trendUpdatedAt: new Date(actualNow - 48 * day).toISOString() }
  products[0].releases[1].editionName = 'Latest quote sentinel'
  signals.r1 = { ...signals.r1, ...quote, representativeAskObservedAt: new Date(actualNow - 60000).toISOString() }
  const home = renderToStaticMarkup(React.createElement(load('components/screens/public-home-screen.tsx').PublicHomeScreen, { products }))
  assert.match(home, /Latest quote sentinel/)
  assert.match(home, /164,07/)
  assert.match(home, /Verificato il|Checked on/)
  assert.doesNotMatch(home, /Trend \+25|\+25[,.]1%/)
  const market = renderToStaticMarkup(React.createElement(load('components/screens/market-screen.tsx').MarketScreen, { products }))
  assert.match(market, /Movimenti in osservazione|Tracking market movements/)
})
