import assert from "node:assert/strict"
import { createHash, createSign, generateKeyPairSync } from "node:crypto"

process.env.EBAY_ENV = "production"
process.env.EBAY_CLIENT_ID = "test-client"
process.env.EBAY_CLIENT_SECRET = "test-secret"
process.env.EBAY_MARKETPLACE_DELETION_ENDPOINT = "https://trackdash.example/api/ebay/marketplace-account-deletion"
process.env.EBAY_MARKETPLACE_DELETION_TOKEN = "abcdefghijklmnopqrstuvwxyz_1234567890"

const {
  containsEbayIdentifier,
  eraseEbayUserData,
  generateEbayDeletionChallenge,
  parseEbayDeletionNotification,
  redactEbayIdentifiers,
  verifyEbayNotificationSignature,
} = await import("../lib/ebay/account-deletion.ts")

const challenge = "challenge-123"
const expectedChallenge = createHash("sha256")
  .update(challenge)
  .update(process.env.EBAY_MARKETPLACE_DELETION_TOKEN)
  .update(process.env.EBAY_MARKETPLACE_DELETION_ENDPOINT)
  .digest("hex")
assert.equal(generateEbayDeletionChallenge(challenge), expectedChallenge)

const message = {
  metadata: { topic: "MARKETPLACE_ACCOUNT_DELETION", schemaVersion: "1.0", deprecated: false },
  notification: {
    notificationId: "notification-1",
    data: { username: "Seller_Name", userId: "immutable-1", eiasToken: "token-1" },
  },
}
assert.deepEqual(parseEbayDeletionNotification(message), {
  notificationId: "notification-1",
  identifiers: { username: "Seller_Name", userId: "immutable-1", eiasToken: "token-1" },
})
assert.throws(
  () => parseEbayDeletionNotification({ ...message, metadata: { topic: "OTHER" } }),
  /EBAY_NOTIFICATION_TOPIC_INVALID/,
)

const identifiers = { username: "Seller_Name", userId: "immutable-1", eiasToken: "token-1" }
assert.equal(containsEbayIdentifier("ebay:seller_name", identifiers), true)
assert.equal(containsEbayIdentifier("release|seller_name|2026-01-01", identifiers), true)
assert.equal(containsEbayIdentifier("another-seller", identifiers), false)
assert.deepEqual(
  redactEbayIdentifiers({ seller: "Seller_Name", nested: ["immutable-1", "safe"], title: "Seller_Name model" }, identifiers),
  { seller: null, nested: [null, "safe"], title: "Seller_Name model" },
)

const { privateKey, publicKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" })
const signer = createSign("ssl3-sha1")
signer.update(JSON.stringify(message))
signer.end()
const signature = signer.sign(privateKey, "base64")
const signatureHeader = Buffer.from(JSON.stringify({ kid: "key-1", signature }), "ascii").toString("base64")
const calls = []
const fetchMock = async (url, options = {}) => {
  calls.push({ url: String(url), authorization: options.headers?.Authorization })
  if (String(url).includes("/oauth2/token")) {
    return new Response(JSON.stringify({ access_token: "test-access-token" }), { status: 200 })
  }
  return new Response(JSON.stringify({
    key: publicKey.export({ type: "spki", format: "pem" }).toString().replaceAll("\n", ""),
  }), { status: 200 })
}

assert.equal(await verifyEbayNotificationSignature(JSON.stringify(message), signatureHeader, fetchMock), true)
assert.equal(calls.length, 2)
assert.equal(calls[0].authorization.startsWith("Basic "), true)
assert.equal(calls[1].authorization, "Bearer test-access-token")

const tampered = { ...message, notification: { ...message.notification, notificationId: "changed" } }
assert.equal(await verifyEbayNotificationSignature(JSON.stringify(tampered), signatureHeader, fetchMock), false)

class Query {
  constructor(store, table) {
    this.store = store
    this.table = table
    this.operation = "select"
    this.filters = []
    this.start = 0
    this.end = Number.MAX_SAFE_INTEGER
  }
  select() { return this }
  update(payload) { this.operation = "update"; this.payload = payload; return this }
  eq(field, value) { this.filters.push((row) => row[field] === value); return this }
  in(field, values) { this.filters.push((row) => values.includes(row[field])); return this }
  like(field, pattern) {
    const prefix = pattern.endsWith("%") ? pattern.slice(0, -1) : pattern
    this.filters.push((row) => String(row[field] ?? "").startsWith(prefix))
    return this
  }
  order() { return this }
  range(start, end) { this.start = start; this.end = end; return this }
  then(resolve, reject) {
    try {
      const rows = this.store[this.table]
      const matches = rows.filter((row) => this.filters.every((filter) => filter(row)))
      if (this.operation === "update") {
        for (const row of matches) Object.assign(row, structuredClone(this.payload))
        resolve({ data: matches, error: null })
      } else {
        resolve({ data: structuredClone(matches.slice(this.start, this.end + 1)), error: null })
      }
    } catch (error) {
      reject(error)
    }
  }
}

const store = {
  market_source_policies: [{ source_id: "ebay-active", source_family: "ebay" }],
  price_sources: [
    { id: "ebay-active", slug: "ebay_active_public" },
    { id: "ebay-legacy", slug: "ebay_legacy_disabled" },
    { id: "retail", slug: "rcjaz_public" },
  ],
  market_candidates: [{
    id: "candidate-1",
    source_id: "ebay-legacy",
    resolved_release_id: "release-1",
    condition: "new_complete_unbuilt",
    seller_fingerprint: "ebay:Seller_Name",
    evidence_group_key: "release-1|Seller_Name",
    raw_payload: { seller: "Seller_Name", listing: "safe" },
  }],
  market_offer_states: [{
    id: "offer-1",
    source_id: "ebay-active",
    release_id: "release-1",
    condition: "new_complete_unbuilt",
    seller_fingerprint: "Seller_Name",
  }],
  price_points: [{
    id: "point-1",
    source_id: "ebay-legacy",
    candidate_id: "candidate-1",
    release_id: "release-1",
    condition: "new_complete_unbuilt",
    evidence_group_key: "release-1|Seller_Name",
    quality_flags: [],
    valuation_eligible: true,
    evidence_grade: "verified",
  }],
  market_aggregate_observations: [{
    id: "aggregate-1",
    source_id: "ebay-legacy",
    raw_payload: { records: [{ seller: "Seller_Name" }, { seller: "someone-else" }] },
  }],
  market_monthly_source_stats: [{
    id: "monthly-1",
    source_id: "ebay-active",
    raw_payload: { seller: "someone-else" },
  }],
}
const fakeClient = { from: (table) => new Query(store, table) }
const eraseResult = await eraseEbayUserData(fakeClient, identifiers)
assert.equal(eraseResult.candidatesUpdated, 1)
assert.equal(eraseResult.offersUpdated, 1)
assert.equal(eraseResult.pricePointsUpdated, 1)
assert.equal(eraseResult.aggregatePayloadsUpdated, 1)
assert.equal(eraseResult.monthlyPayloadsUpdated, 0)
assert.deepEqual(eraseResult.affectedReleaseConditions, [
  { releaseId: "release-1", condition: "new_complete_unbuilt" },
])
assert.equal(store.market_candidates[0].seller_fingerprint, null)
assert.equal(store.market_candidates[0].evidence_group_key, null)
assert.equal(store.market_candidates[0].raw_payload.seller, null)
assert.equal(store.market_offer_states[0].seller_fingerprint, null)
assert.equal(store.price_points[0].valuation_eligible, false)
assert.equal(store.price_points[0].evidence_group_key, null)
assert.deepEqual(store.price_points[0].quality_flags, ["seller_unknown"])
assert.equal(store.market_aggregate_observations[0].raw_payload.records[0].seller, null)
assert.equal(store.market_aggregate_observations[0].raw_payload.records[1].seller, "someone-else")

console.log("eBay account-deletion compliance tests passed")
