import { register } from "node:module"
register("./ts-extension-loader.mjs", import.meta.url)

import assert from "node:assert/strict"
const {
  ECB_FX_SOURCE,
  getHistoricalRateToEUR,
  parseEcbDailyCsv,
  resolveHistoricalEurBasis,
  resolveMarketEurBasis,
  supportsEcbMarketCurrency,
  enrichMarketObservationFx,
} = await import("../lib/fx/ecb.ts")

const sampleCsv = `KEY,FREQ,CURRENCY,CURRENCY_DENOM,EXR_TYPE,EXR_SUFFIX,TIME_PERIOD,OBS_VALUE\nEXR.D.JPY.EUR.SP00.A,D,JPY,EUR,SP00,A,2024-05-09,167.12\nEXR.D.JPY.EUR.SP00.A,D,JPY,EUR,SP00,A,2024-05-10,167.50\n`

const parsed = parseEcbDailyCsv(sampleCsv, "JPY", "2024-05-12")
assert.ok(parsed)
assert.equal(parsed.rateDate, "2024-05-10")
assert.equal(parsed.unitsPerEUR, 167.5)
assert.equal(parsed.source, ECB_FX_SOURCE)
assert.equal(parsed.rateToEUR, 0.00597015)
console.log("ok: weekend purchase uses latest ECB rate and DB-safe 8-decimal multiplier")

let fetchCalls = 0
const fakeFetch = async (url) => {
  fetchCalls += 1
  const target = String(url)
  assert.match(target, /D\.JPY\.EUR\.SP00\.A/)
  assert.match(target, /startPeriod=2024-05-02/)
  assert.match(target, /endPeriod=2024-05-12/)
  return new Response(sampleCsv, { status: 200, headers: { "content-type": "text/csv" } })
}

const rate = await getHistoricalRateToEUR("JPY", "2024-05-12", fakeFetch)
assert.ok(rate)
assert.equal(fetchCalls, 1)
console.log("ok: ECB data API query uses a bounded historical lookback")

const basis = await resolveHistoricalEurBasis(3200, "JPY", "2024-05-12", fakeFetch)
assert.equal(basis.amountEUR, 19.1)
assert.equal(basis.fxRateToEUR, 0.00597015)
assert.equal(basis.fxRateDate, "2024-05-10")
assert.equal(basis.fxSource, ECB_FX_SOURCE)
console.log("ok: foreign purchase is converted with the exact persisted historical multiplier")

const eurBasis = await resolveHistoricalEurBasis(20, "EUR", null, fakeFetch)
assert.deepEqual(eurBasis, {
  amountEUR: 20,
  fxRateToEUR: null,
  fxRateDate: null,
  fxSource: null,
})
console.log("ok: native EUR basis never invents FX provenance")

const myrCsv = `KEY,FREQ,CURRENCY,CURRENCY_DENOM,EXR_TYPE,EXR_SUFFIX,TIME_PERIOD,OBS_VALUE
EXR.D.MYR.EUR.SP00.A,D,MYR,EUR,SP00,A,2026-09-21,4.8621
`
const myrFetch = async (url) => {
  const target = String(url)
  assert.match(target, /D\.MYR\.EUR\.SP00\.A/)
  return new Response(myrCsv, { status: 200, headers: { "content-type": "text/csv" } })
}
assert.equal(supportsEcbMarketCurrency("MYR"), true)
const myrBasis = await resolveMarketEurBasis(450, "MYR", "2026-09-22", myrFetch)
assert.equal(myrBasis.fxRateDate, "2026-09-21")
assert.equal(myrBasis.fxSource, ECB_FX_SOURCE)
assert.ok(myrBasis.amountEUR > 92 && myrBasis.amountEUR < 93)
console.log("ok: regional marketplace currencies can use ECB FX without expanding user currency settings")

assert.equal(supportsEcbMarketCurrency("TWD"), false)
const unsupportedMarketFx = await resolveMarketEurBasis(1000, "TWD", "2026-09-22", myrFetch)
assert.equal(unsupportedMarketFx.amountEUR, null)
console.log("ok: market FX still fails closed for currencies outside the ECB reference set")


const missingDate = await resolveHistoricalEurBasis(50, "USD", null, fakeFetch)
assert.equal(missingDate.amountEUR, null)
assert.equal(missingDate.fxRateToEUR, null)
console.log("ok: foreign purchase without a date fails closed")

const enriched = await enrichMarketObservationFx({
  price: 3200,
  currency: "JPY",
  soldOn: "2024-05-12",
  fxRateToEUR: null,
  fxRateDate: null,
}, fakeFetch)
assert.equal(enriched.fxRateToEUR, 0.00597015)
assert.equal(enriched.fxRateDate, "2024-05-10")
console.log("ok: market observations can acquire FX provenance automatically")

const existing = {
  price: 100,
  currency: "USD",
  soldOn: "2024-05-12",
  fxRateToEUR: 0.91,
  fxRateDate: "2024-05-10",
}
assert.deepEqual(await enrichMarketObservationFx(existing, fakeFetch), existing)
console.log("ok: supplied FX provenance is preserved")

console.log("HISTORICAL FX TEST PASSED")
