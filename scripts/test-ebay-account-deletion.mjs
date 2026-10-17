import assert from "node:assert/strict"
import { createHash, createSign, generateKeyPairSync } from "node:crypto"

process.env.EBAY_ENV = "production"
process.env.EBAY_CLIENT_ID = "test-client"
process.env.EBAY_CLIENT_SECRET = "test-secret"
process.env.EBAY_MARKETPLACE_DELETION_ENDPOINT = "https://trackdash.example/api/ebay/marketplace-account-deletion"
process.env.EBAY_MARKETPLACE_DELETION_TOKEN = "abcdefghijklmnopqrstuvwxyz_1234567890"

const {
  containsEbayIdentifier,
  generateEbayDeletionChallenge,
  parseEbayDeletionNotification,
  redactEbayIdentifiers,
  verifyEbayNotificationSignature,
} = await import("../lib/ebay/account-deletion.ts")
const {
  formatEbayDeletionFailure,
  safeEbayDeletionErrorCode,
} = await import("../lib/ebay/account-deletion-diagnostics.ts")

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

const verificationStages = []
assert.equal(
  await verifyEbayNotificationSignature(
    JSON.stringify(message),
    signatureHeader,
    fetchMock,
    (stage) => verificationStages.push(stage),
  ),
  true,
)
assert.deepEqual(verificationStages, [
  "signature_header_parsed",
  "oauth_token_ok",
  "public_key_ok",
  "signature_verified",
])
assert.equal(calls.length, 2)
assert.equal(calls[0].authorization.startsWith("Basic "), true)
assert.equal(calls[1].authorization, "Bearer test-access-token")

const tampered = { ...message, notification: { ...message.notification, notificationId: "changed" } }
assert.equal(await verifyEbayNotificationSignature(JSON.stringify(tampered), signatureHeader, fetchMock), false)

assert.equal(safeEbayDeletionErrorCode(new Error("EBAY_PUBLIC_KEY_FETCH_FAILED")), "EBAY_PUBLIC_KEY_FETCH_FAILED")
assert.equal(
  safeEbayDeletionErrorCode(new Error("EBAY_USER_ERASURE_FAILED:load_market_candidates")),
  "EBAY_USER_ERASURE_FAILED:load_market_candidates",
)
assert.equal(safeEbayDeletionErrorCode(new Error("Seller_Name token-1 test-secret")), "UNKNOWN")
const safeFailure = formatEbayDeletionFailure(
  "public_key_ok",
  new Error("Seller_Name immutable-1 token-1 test-secret"),
)
assert.equal(safeFailure, "[ebay-account-deletion] failed stage=public_key_ok code=UNKNOWN")
for (const sensitive of ["Seller_Name", "immutable-1", "token-1", "test-secret"]) {
  assert.equal(safeFailure.includes(sensitive), false)
}

console.log("eBay signature, parsing, redaction and safe diagnostics tests passed")
