import assert from "node:assert/strict"
import { generateKeyPairSync, sign } from "node:crypto"
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { createRequire } from "node:module"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { spawnSync } from "node:child_process"
import { test } from "node:test"
import vm from "node:vm"
import ts from "typescript"
import { summarizeCronCycle, summarizeCronWorker } from "../lib/market/automation/cron-outcome.ts"
import { diagnoseScanResponse } from "./ebay-market-watch-diagnostics.mjs"

const require = createRequire(import.meta.url)
const read = (file) => readFileSync(new URL("../" + file, import.meta.url), "utf8")
const counts = (attempted = 0, succeeded = attempted, failed = attempted - succeeded, extra = {}) => ({ attempted, succeeded, failed, ...extra })
const fulfilled = (value) => ({ status: "fulfilled", value })
const lane = (value) => summarizeCronWorker(fulfilled(value))

// Compile the real route body, replacing ONLY its imports. No worker/DB modules
// are ever loaded. Unexpected network access and imports fail immediately.
function compile(file, imports, extras = {}) {
  const output = ts.transpileModule(read(file), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const exports = {}
  vm.runInNewContext(output, {
    exports, Error, Buffer, AbortSignal, process: { env: { CRON_SECRET: "test-cron-secret" } },
    fetch: async () => { throw new Error("UNEXPECTED_NETWORK_ACCESS") },
    console: { error: () => {} },
    require: (name) => {
      if (Object.hasOwn(imports, name)) return imports[name]
      if (["next/server", "node:crypto"].includes(name)) return require(name)
      throw new Error("UNEXPECTED_IMPORT:" + name)
    },
    ...extras,
  }, { filename: file })
  return exports
}

function routes({ retail = counts(), ebay = counts(0, 0, 0, { configured: true }), recompute = counts(), env, fetchImpl } = {}) {
  const calls = []
  const logs = []
  const worker = (name, result) => async (limit) => {
    calls.push([name, limit])
    if (result instanceof Error) throw result
    return result
  }
  const imports = {
    "@/lib/market/automation/worker": { runExactPageMarketScanBatch: worker("retail", retail) },
    "@/lib/market/automation/ebay-worker": { runEbayActiveMarketScanBatch: worker("ebay", ebay) },
    "@/lib/market/automation/recompute-worker": { runMarketRecomputeBatch: worker("recompute", recompute) },
    "@/lib/market/automation/cron-outcome": { summarizeCronWorker, summarizeCronCycle },
  }
  const extras = {
    console: { error: (...args) => logs.push(args) },
    ...(env ? { process: { env } } : {}),
    ...(fetchImpl ? { fetch: fetchImpl } : {}),
  }
  return {
    daily: compile("app/api/cron/market-scan/route.ts", imports, extras),
    ebay: compile("app/api/cron/ebay-scan/route.ts", imports, extras), calls, logs,
  }
}

const request = (token = "test-cron-secret") => new Request("https://example.invalid/api/cron/market-scan", {
  headers: { authorization: `Bearer ${token}` },
})

for (const [status, value, http, ok, partial] of [
  ["not_configured", counts(0, 0, 0, { configured: false }), 503, false, false],
  ["no_work", counts(), 200, true, false],
  ["success", counts(2), 200, true, false],
  ["partial", counts(2, 1), 500, false, true],
  ["failed", counts(2, 0), 500, false, false],
]) {
  test(`worker and real eBay handler report ${status}`, async () => {
    const report = lane(value)
    assert.equal(report.status, status)
    assert.equal(report.ok, ok)
    const mocked = routes({ ebay: value })
    const response = await mocked.ebay.GET(request())
    const body = await response.json()
    assert.equal(response.status, http)
    assert.equal(body.status, status)
    assert.equal(body.ok, ok)
    assert.equal(body.partial, partial)
    assert.deepEqual(body.result, value)
    assert.deepEqual(mocked.calls, [["ebay", 1]])
  })
}

test("real cron exports remain 60 seconds and batch sizes remain 4/1/8", async () => {
  const mocked = routes({ retail: counts(4), ebay: counts(1), recompute: counts(8) })
  assert.equal(mocked.daily.maxDuration, 60)
  assert.equal(mocked.ebay.maxDuration, 60)
  const response = await mocked.daily.GET(request())
  assert.equal(response.status, 200)
  assert.equal((await response.json()).status, "success")
  assert.deepEqual(mocked.calls, [["retail", 4], ["ebay", 1], ["recompute", 8]])
})

test("daily cron distinguishes idle, configuration failure, full failure and partial success", async () => {
  for (const [inputs, status, http] of [
    [{}, "no_work", 200],
    [{ ebay: counts(0, 0, 0, { configured: false }) }, "not_configured", 503],
    [{ retail: counts(1, 0) }, "failed", 500],
    [{ retail: counts(1), ebay: counts(1, 0) }, "partial", 500],
    [{ recompute: counts(2, 1) }, "partial", 500],
    [{ retail: counts(1), ebay: counts(0, 0, 0, { configured: false }) }, "partial", 500],
  ]) {
    const mocked = routes(inputs)
    const response = await mocked.daily.GET(request())
    const body = await response.json()
    assert.equal(response.status, http)
    assert.equal(body.status, status)
    assert.equal(body.ok, http === 200)
    assert.equal(body.partial, status === "partial")
    if (inputs.ebay?.configured === false) assert.equal(body.ebayActive.status, "not_configured")
  }
})

test("rejected workers are isolated and arbitrary exception text never enters responses/logs", async () => {
  const secret = "Bearer confidential-token https://user:password@example.invalid private@example.invalid"
  const mocked = routes({ retail: counts(1), ebay: new Error(secret), recompute: new Error(secret) })
  const response = await mocked.daily.GET(request())
  const body = await response.json()
  assert.equal(response.status, 500)
  assert.equal(body.status, "partial")
  assert.equal(body.ebayActive.error, "WORKER_EXECUTION_FAILED")
  assert.equal(mocked.calls.length, 3)
  assert.doesNotMatch(JSON.stringify([body, mocked.logs]), /confidential-token|password|private@/)
  const ebay = routes({ ebay: new Error(secret) })
  assert.equal((await ebay.ebay.GET(request())).status, 500)
  assert.doesNotMatch(JSON.stringify(ebay.logs), /confidential-token|password|private@/)
  const configuration = routes({ ebay: new Error("EBAY_SCHEDULED_MARKET_WRITES_DISABLED") })
  assert.equal((await configuration.ebay.GET(request())).status, 503)
})

test("invalid worker counters never yield a successful response", async () => {
  for (const value of [null, {}, counts(-1), counts(1, 2, 0), counts(1.5), counts(1, 1, 0, { configured: false }), counts(0, 0, 0, { configured: "true" })]) {
    assert.equal(lane(value).ok, false)
    const mocked = routes({ ebay: value })
    assert.equal((await mocked.ebay.GET(request())).status, 500)
  }
})

test("cron secret authentication fails closed before any worker invocation", async () => {
  const mocked = routes()
  assert.equal((await mocked.daily.GET(request("wrong-secret"))).status, 401)
  assert.equal((await mocked.ebay.GET(request("wrong-secret"))).status, 401)
  assert.equal(mocked.calls.length, 0)
  const missing = routes({ env: {} })
  assert.equal((await missing.daily.GET(request())).status, 503)
  assert.equal((await missing.ebay.GET(request())).status, 401)
  assert.equal(missing.calls.length, 0)
})

test("GitHub OIDC keeps signature, repo, workflow, branch, event, audience and expiry gates", async () => {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 })
  const now = Math.floor(Date.now() / 1000)
  const header = Buffer.from(JSON.stringify({ alg: "RS256", kid: "test-key" })).toString("base64url")
  const claims = {
    iss: "https://token.actions.githubusercontent.com", aud: "trackdash-ebay-scan",
    repository_id: "1351337497", ref: "refs/heads/main",
    workflow_ref: "mercseba-afk/trackdash/.github/workflows/ebay-market-watch.yml@refs/heads/main",
    event_name: "schedule", iat: now, exp: now + 300,
  }
  const jwt = (extra = {}) => {
    const payload = Buffer.from(JSON.stringify({ ...claims, ...extra })).toString("base64url")
    const input = `${header}.${payload}`
    return `${input}.${sign("RSA-SHA256", Buffer.from(input), privateKey).toString("base64url")}`
  }
  let jwksCalls = 0
  const mocked = routes({ env: {}, fetchImpl: async (url) => {
    assert.equal(url, "https://token.actions.githubusercontent.com/.well-known/jwks")
    jwksCalls++
    return Response.json({ keys: [{ ...publicKey.export({ format: "jwk" }), kid: "test-key" }] })
  } })
  for (const event_name of ["schedule", "push"]) {
    assert.equal((await mocked.ebay.GET(request(jwt({ event_name })))).status, 200)
  }
  for (const invalid of [
    { iss: "https://evil.invalid" }, { aud: "other" }, { repository_id: "0" },
    { ref: "refs/heads/feature" }, { workflow_ref: "other" },
    { event_name: "pull_request" }, { exp: now - 120 }, { nbf: now + 120 },
    { iat: now + 120 }, { exp: now + 1000 },
  ]) assert.equal((await mocked.ebay.GET(request(jwt(invalid)))).status, 401)
  const forged = jwt().split("."); forged[2] = Buffer.alloc(256).toString("base64url")
  assert.equal((await mocked.ebay.GET(request(forged.join(".")))).status, 401)
  assert.equal(mocked.calls.length, 2)
  assert.equal(jwksCalls, 3)
})

test("HTTP diagnostics handle hosting suspension, outages, auth, HTML and malformed payloads safely", () => {
  const secret = "confidential-token user@example.invalid"
  for (const http of [401, 403, 402, 429, 500, 502, 503, 504]) {
    for (const body of [`<html>${secret}</html>`, JSON.stringify({ error: { message: secret } })]) {
      const diagnostic = diagnoseScanResponse({ httpStatus: http, body })
      assert.equal(diagnostic.ok, false)
      assert.equal(diagnostic.httpStatus, http)
      assert.doesNotMatch(JSON.stringify(diagnostic), /confidential-token|user@/)
      if (http === 402) assert.equal(diagnostic.reason, "HOSTING_UNAVAILABLE_OR_PAUSED")
    }
  }
  for (const body of ["", "not JSON", "null", "[]", "{}", '{"ok":true}', JSON.stringify({ ok: true, result: counts(1, 0) }), JSON.stringify({ ok: true, result: counts(0, 0, 0, { configured: false }) })]) {
    assert.equal(diagnoseScanResponse({ httpStatus: 200, body }).ok, false)
  }
  for (const status of ["success", "no_work"]) {
    const result = status === "success" ? counts(1) : counts()
    const body = JSON.stringify({ ok: true, status, partial: false, result: { ...result, raw_payload: secret, selectedListings: [secret] } })
    const diagnostic = diagnoseScanResponse({ httpStatus: 200, body })
    assert.equal(diagnostic.ok, true)
    assert.equal(diagnostic.applicationStatus, status)
    assert.doesNotMatch(JSON.stringify(diagnostic), /raw_payload|selectedListings|confidential-token|user@/)
    assert.equal(diagnoseScanResponse({ httpStatus: 503, body }).ok, false)
  }
  assert.equal(diagnoseScanResponse({ httpStatus: 200, body: JSON.stringify({ ok: true, result: counts(1) }) }).ok, true, "legacy Production protocol")
  assert.equal(diagnoseScanResponse({ httpStatus: 0, curlExit: 28 }).reason, "TRANSPORT_TIMEOUT")
  assert.equal(diagnoseScanResponse({ httpStatus: 0, curlExit: 7 }).reason, "TRANSPORT_ERROR")
  assert.equal(diagnoseScanResponse({ httpStatus: 0 }).ok, false)
})

test("actual workflow shell reports failures without retrying scans or printing response bodies", () => {
  const subprocessEnv = { ...process.env }
  delete subprocessEnv.NODE_TEST_CONTEXT
  const workflow = read(".github/workflows/ebay-market-watch.yml")
  const shell = workflow.split("        run: |\n")[1].split("\n").map((line) => line.slice(10)).join("\n")
  assert.match(workflow, /cron: '41 \* \* \* \*'/)
  assert.match(workflow, /cancel-in-progress: false/)
  assert.match(workflow, /id-token: write/)
  const temporary = mkdtempSync(join(tmpdir(), "trackdash-cron-test-"))
  const bin = join(temporary, "bin")
  mkdirSync(bin)
  // Fake curl handles BOTH OIDC and scan requests. No real network is possible.
  writeFileSync(join(bin, "curl"), `#!/usr/bin/env bash
set -eu
if [[ "$*" == *"audience=trackdash-ebay-scan"* ]]; then
  if [[ "\${MOCK_OIDC_FAIL:-0}" == 1 ]]; then exit 22; fi
  echo '{"value":"test-oidc-token"}'
else
  echo scan >> "$MOCK_CALLS"
  for arg in "$@"; do [[ "$arg" != --retry ]] || exit 99; done
  printf '%s' "$MOCK_BODY" > result.json
  printf '%s' "$MOCK_HTTP"
  exit "$MOCK_CURL_EXIT"
fi
`, { mode: 0o755 })
  try {
    const successful = JSON.stringify({ ok: true, status: "success", partial: false, result: counts(1) })
    for (const [http, body, curlExit, success] of [
      ["200", successful, "0", true],
      ["200", JSON.stringify({ ok: true, status: "no_work", partial: false, result: counts() }), "0", true],
      ["500", JSON.stringify({ ok: false, status: "partial", partial: true, result: counts(2, 1) }), "0", false],
      ["503", JSON.stringify({ ok: false, status: "not_configured", partial: false, result: counts(0, 0, 0, { configured: false }) }), "0", false],
      ["402", '<html>secret-body user@example.invalid</html>', "0", false],
      ["503", '{"error":{"message":"secret-body"}}', "0", false],
      ["504", "gateway unavailable", "0", false],
      ["200", "not JSON secret-body", "0", false],
      ["000", "", "28", false],
    ]) {
      const callsFile = join(temporary, "calls")
      writeFileSync(callsFile, "")
      const run = spawnSync("bash", ["-c", shell], { cwd: new URL("../", import.meta.url), encoding: "utf8", env: {
        ...subprocessEnv, PATH: `${bin}:${process.env.PATH}`, ACTIONS_ID_TOKEN_REQUEST_TOKEN: "fake-request-token",
        ACTIONS_ID_TOKEN_REQUEST_URL: "https://oidc.invalid?request=1", SCAN_URL: "https://scan.invalid",
        MOCK_BODY: body, MOCK_HTTP: http, MOCK_CURL_EXIT: curlExit, MOCK_CALLS: callsFile,
      } })
      assert.equal(run.status === 0, success, run.stdout + run.stderr)
      assert.equal(readFileSync(callsFile, "utf8"), "scan\n", "exactly one scan request")
      const safeOutput = run.stdout.replace(/^::add-mask::.*\n/m, "") + run.stderr
      assert.doesNotMatch(safeOutput, /test-oidc-token|fake-request-token|secret-body|user@/)
      const diagnosticLine = safeOutput.split("\n").find((line) => line.startsWith("{"))
      assert.ok(diagnosticLine, run.stdout + run.stderr)
      const diagnostic = JSON.parse(diagnosticLine)
      assert.equal(diagnostic.httpStatus, Number(http))
      assert.equal(diagnostic.curlExit, Number(curlExit))
      assert.equal(diagnostic.ok, success)
    }
    const noToken = spawnSync("bash", ["-c", shell], { cwd: new URL("../", import.meta.url), encoding: "utf8", env: {
      ...subprocessEnv, PATH: `${bin}:${process.env.PATH}`, ACTIONS_ID_TOKEN_REQUEST_TOKEN: "fake",
      ACTIONS_ID_TOKEN_REQUEST_URL: "https://oidc.invalid?request=1", MOCK_OIDC_FAIL: "1",
    } })
    assert.equal(noToken.status, 1)
    assert.match(noToken.stdout, /OIDC_TOKEN_REQUEST_FAILED/)
  } finally {
    rmSync(temporary, { recursive: true, force: true })
  }
})
