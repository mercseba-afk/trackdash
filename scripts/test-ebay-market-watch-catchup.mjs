import assert from 'node:assert/strict'
import { test } from 'node:test'
import { continueCatchup } from './ebay-market-watch-catchup.mjs'
const payload = (attempted = 1, extra = {}) => JSON.stringify({ ok: true, status: attempted ? 'success' : 'no_work', partial: false, catchupVersion: 1, result: { attempted, succeeded: attempted, failed: 0 }, ...extra })
const initial = () => payload(3, { lanes: { ebayActive: { summary: { attempted: 1 } } } })
function runner(responses, options = {}) {
  const calls = [], logs = []
  return { calls, logs, run: () => continueCatchup(initial(), { token: 'secret-test-token', url: 'https://trackdash.it/api/cron/ebay-scan', emit: x => logs.push(x), fetchImpl: async (url, init) => {
    calls.push({ url: String(url), init })
    const result = responses.shift()
    if (result instanceof Error) throw result
    return result ?? new Response(payload())
  }, ...options }) }
}
test('at most four claims; follow-ups are sequential and eBay only', async () => {
  const r = runner([])
  assert.equal(await r.run(), 4)
  assert.equal(r.calls.length, 3)
  for (const c of r.calls) { assert.equal(c.url, 'https://trackdash.it/api/cron/ebay-scan?lane=ebay'); assert.equal(c.init.redirect, 'error'); assert.equal(c.init.headers.authorization, 'Bearer secret-test-token') }
  assert.doesNotMatch(JSON.stringify(r.logs), /secret-test-token/)
})
test('retail-only progress does not start extra eBay calls', async () => {
  let called = false
  assert.equal(await continueCatchup(payload(2, { lanes: { ebayActive: { summary: { attempted: 0 } } } }), { fetchImpl: () => { called = true } }), 1)
  assert.equal(called, false)
})
test('empty queue or exhausted daily allowance stops follow-ups', async () => {
  const r = runner([new Response(payload(0))])
  assert.equal(await r.run(), 2); assert.equal(r.calls.length, 1)
})
for (const [name, response] of [['HTTP failure', new Response('private-body', { status: 503 })], ['bad JSON', new Response('private-body')], ['partial failure', new Response(JSON.stringify({ ok: false, status: 'partial', partial: true, result: { attempted: 1, succeeded: 0, failed: 1 } }), { status: 500 })], ['timeout', new Error('secret-test-token private-body')]]) {
  test(`${name} is never retried and is redacted`, async () => { const r = runner([response]); await assert.rejects(r.run()); assert.equal(r.calls.length, 1); assert.doesNotMatch(JSON.stringify(r.logs), /private-body|secret-test-token/) })
}
test('stop before another full HTTP timeout could exceed the run deadline', async () => {
  let n = 0
  const r = runner([], { now: () => n++ ? 106_000 : 0 })
  assert.equal(await r.run(), 1); assert.equal(r.calls.length, 0)
})
test('old Production cannot silently run full cycles as eBay-only follow-ups', async () => {
  const r = runner([], { maxCalls: 4 })
  await assert.rejects(continueCatchup(payload(1, { catchupVersion: undefined }), { fetchImpl: () => { throw Error('unexpected') } }), /PROTOCOL/)
  assert.equal(r.calls.length, 0)
})
test('caller cannot raise the four-call bound', async () => { const r = runner([], { maxCalls: 999 }); assert.equal(await r.run(), 4) })
test('token cannot be sent to another host', async () => { const r = runner([], { url: 'https://other.invalid/api/cron/ebay-scan' }); await assert.rejects(r.run(), /INVALID_TARGET/); assert.equal(r.calls.length, 0) })
