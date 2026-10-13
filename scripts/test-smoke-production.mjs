import assert from "node:assert/strict"
import { test } from "node:test"
import { checkPages, getVersion, waitForVersion } from "./smoke-production.mjs"

const origin = "https://trackdash.it"
const SHA = "3d510320240f1308105c901a8c0182e07bd48469"
const OLD = "479faf8ec43f5a462bef6358469e97c2ef044963"

function mockFetch({ version = SHA, failPath = "", redirects = {} } = {}) {
  return async (url) => {
    const path = new URL(url).pathname
    const isVersion = path === "/api/version"
    const text = isVersion ? JSON.stringify({ version }) : "TrackDash " + (path.includes("/95466-") ? "95466" : path.includes("/92280-") ? "92280" : "")
    const response = new Response(text, { status: path === failPath ? 404 : 200, headers: { "content-type": isVersion ? "application/json" : "text/html" } })
    Object.defineProperty(response, "url", { value: origin + (redirects[path] || path) })
    return response
  }
}

test("version endpoint returns exact version", async () => {
  assert.equal(await getVersion(origin, mockFetch()), SHA)
  await assert.rejects(() => waitForVersion({ origin, sha: "3d510", fetchImpl: mockFetch(), maxWaitMs: 0 }), /40-character/)
})

test("waits through old SHA and succeeds after publication", async () => {
  let count = 0
  let clock = 0
  const fetchImpl = async (url) => {
    const version = ++count === 1 ? OLD : SHA
    return mockFetch({ version })(url)
  }
  await waitForVersion({ origin, sha: SHA, fetchImpl, maxWaitMs: 5000, intervalMs: 1000, now: () => clock, sleepFn: async (ms) => { clock += ms }, log: () => {} })
  assert.equal(count, 2)
})

test("fails if deployment never becomes current", async () => {
  let clock = 0
  await assert.rejects(() => waitForVersion({ origin, sha: SHA, fetchImpl: mockFetch({ version: OLD }), maxWaitMs: 2000, intervalMs: 1000, now: () => clock, sleepFn: async (ms) => { clock += ms }, log: () => {} }), /did not reach expected commit/)
})

test("checks five public and two private pages without credentials", async () => {
  const results = await checkPages({ origin, fetchImpl: mockFetch() })
  assert.equal(results.length, 7)
  assert.ok(results.every((row) => row.result === "PASS"))
  assert.match(results.find((row) => row.path === "/wishlist").details, /not tested/)
})

test("fails on missing page or wrong public redirect", async () => {
  const bad = await checkPages({ origin, fetchImpl: mockFetch({ failPath: "/market" }) })
  assert.equal(bad.find((r) => r.path === "/market").result, "FAIL")
  const redirect = await checkPages({ origin, fetchImpl: mockFetch({ redirects: { "/catalog": "/login" } }) })
  assert.equal(redirect.find((r) => r.path === "/catalog").result, "FAIL")
})

test("accepts authentication redirect without claiming private content", async () => {
  const results = await checkPages({ origin, fetchImpl: mockFetch({ redirects: { "/collection": "/login", "/wishlist": "/mfa" } }) })
  assert.equal(results.find((r) => r.path === "/collection").result, "PASS")
  assert.match(results.find((r) => r.path === "/wishlist").details, /Auth redirect/)
})
