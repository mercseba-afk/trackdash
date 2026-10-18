import assert from "node:assert/strict"
import { createHash, createSign, generateKeyPairSync } from "node:crypto"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import vm from "node:vm"
import ts from "typescript"

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
function plannedClient(store) {
  return { rpc: (name, args) => ({ abortSignal: async () => {
    if (name === "trackdash_plan_ebay_erasure") return { data: Object.fromEntries(
      Object.entries(store).filter(([table]) => !["market_source_policies", "price_sources"].includes(table))
        .map(([table, rows]) => [table, structuredClone(rows.map(row => ({ ...row, version: "1" })))])
    ), error: null }
    assert.equal(name, "trackdash_apply_ebay_erasure")
    for (const change of args.p_changes) {
      Object.assign(store[change.table].find(row => row.id === change.id), structuredClone(change.patch))
    }
    const counters = {market_candidates:"candidatesUpdated",market_offer_states:"offersUpdated",price_points:"pricePointsUpdated",market_aggregate_observations:"aggregatePayloadsUpdated",market_monthly_source_stats:"monthlyPayloadsUpdated"}
    const result = Object.fromEntries(Object.values(counters).map(k => [k, 0]))
    for(const c of args.p_changes) result[counters[c.table]]++
    return { data: {...result, affectedReleaseConditions:[{releaseId:"release-1",condition:"new_complete_unbuilt"}]}, error: null }
  } }) }
}
const fakeClient = plannedClient(store)
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

const noOpStore = structuredClone(store)
const noOpClient = plannedClient(noOpStore)
const noOpResult = await eraseEbayUserData(noOpClient, {
  username: "synthetic-no-match",
  userId: "synthetic-user-id",
})
assert.deepEqual(noOpResult, {
  candidatesUpdated: 0,
  offersUpdated: 0,
  pricePointsUpdated: 0,
  aggregatePayloadsUpdated: 0,
  monthlyPayloadsUpdated: 0,
  affectedReleaseConditions: [],
})

console.log("eBay account-deletion compliance tests passed")

// Execute the real Next route with isolated dependencies. Crypto still uses
// the real synthetic signature above; no live eBay, Supabase or scanner calls.
const require = createRequire(import.meta.url)
const routeSource = ts.transpileModule(readFileSync(new URL("../app/api/ebay/marketplace-account-deletion/route.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText
function webhook({ erasure = noOpResult, recomputeError = false, ackError = false, signatureValid = true } = {}) {
  const exports = {}, logs = [], calls = []
  const imports = {
    "next/server": require("next/server"),
    "@/lib/supabase/admin": { createAdminClient: () => { calls.push("client"); return {rpc:async (name,args)=>{assert.equal(name,"trackdash_finish_market_recompute_job");assert.equal(args.p_claimed_dirty_at,"2026-10-17T12:00:00Z");calls.push("finish");return {error:ackError?{}:null}}} } },
    "@/lib/market/pipeline/market-r3-repository": { MarketR3Repository: class {} },
    "@/lib/market/pipeline/market-r3-service": { recomputeReleaseMarketSignal: async () => {
      calls.push("recompute"); if (recomputeError) throw Error("Seller_Name token-1 test-secret")
    } },
    "@/lib/ebay/account-deletion-diagnostics": { formatEbayDeletionFailure },
    "@/lib/ebay/account-deletion": {
      generateEbayDeletionChallenge, parseEbayDeletionNotification,
      verifyEbayNotificationSignature: async (...args) => signatureValid && verifyEbayNotificationSignature(args[0],args[1],fetchMock,args[3]),
      eraseEbayUserData: async () => { calls.push("erase"); if(erasure instanceof Error)throw erasure;return erasure },
    },
  }
  vm.runInNewContext(routeSource, {
    exports, Error, Date, fetch: fetchMock,
    console: Object.fromEntries(["info","warn","error"].map(k => [k, value => logs.push(String(value))])),
    require: name => { if (!Object.hasOwn(imports,name)) throw Error("UNEXPECTED_IMPORT"); return imports[name] },
  })
  const request = { text: async () => JSON.stringify(message), headers: new Headers({"x-ebay-signature":signatureHeader}) }
  return { run: () => exports.POST(request), logs, calls }
}
const idleRoute = webhook()
assert.equal((await idleRoute.run()).status,204)
assert.deepEqual(idleRoute.calls,["client","erase"])
assert.equal(idleRoute.logs.length,1)
assert.match(idleRoute.logs[0],/stage=recompute_completed/)
const rejectedRoute = webhook({signatureValid:false})
assert.equal((await rejectedRoute.run()).status,412)
assert.equal(rejectedRoute.calls.length,0)
for(const erasure of [new Error("EBAY_USER_ERASURE_FAILED:plan_erasure"),new Error("EBAY_USER_ERASURE_FAILED:apply_erasure"),new Error("Seller_Name test-secret token-1")]) {
  const r=webhook({erasure});assert.equal((await r.run()).status,500)
  for(const s of ["Seller_Name","test-secret","token-1"])assert(!r.logs.join(" ").includes(s))
}
const failedRecompute = webhook({erasure:eraseResult,recomputeError:true})
assert.equal((await failedRecompute.run()).status,500)
assert.match(failedRecompute.logs.join(" "),/stage=erasure_completed code=EBAY_RECOMPUTE_FAILED/)
const matchedRoute = webhook({erasure:eraseResult})
assert.equal((await matchedRoute.run()).status,204)
assert.equal(matchedRoute.logs.length,1)
assert(matchedRoute.calls.includes("recompute"))
console.log("P0.8 real webhook route: signed success/no-match, reject, safe errors, recompute failure and one completion log passed")

const withDirty = { ...eraseResult, affectedReleaseConditions: [{releaseId:"release-1",condition:"new_complete_unbuilt",recomputeDirtyAt:"2026-10-17T12:00:00Z"}] }
const finishedInline=webhook({erasure:withDirty})
assert.equal((await finishedInline.run()).status,204)
assert(!finishedInline.calls.includes("finish"))
const failedAck=webhook({erasure:withDirty,ackError:true})
assert.equal((await failedAck.run()).status,204)
assert(!failedAck.calls.includes("finish"))
console.log("P0.8 inline recompute preserves the durable dirty job against older publishers")
