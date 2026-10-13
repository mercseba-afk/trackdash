// Read-only, credential-free Production HTTP smoke. GET only; no scans or data writes.
import { appendFile } from "node:fs/promises"
import { pathToFileURL } from "node:url"

export const PUBLIC_PAGES = [
  { path: "/", marker: "TrackDash" },
  { path: "/catalog", marker: "TrackDash" },
  { path: "/market", marker: "TrackDash" },
  { path: "/catalog/manta-ray-mk-ii/releases/95466-manta-ray-mk-ii-black-special", marker: "95466" },
  { path: "/catalog/neo-tridagger-zmc/releases/92280-neo-tridagger-zmc-next-smoke", marker: "92280" },
]
export const PRIVATE_PAGES = ["/collection", "/wishlist"]
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function request(origin, path, fetchImpl) {
  const url = new URL(path, origin)
  const response = await fetchImpl(url, {
    method: "GET", cache: "no-store", redirect: "follow",
    headers: { accept: path === "/api/version" ? "application/json" : "text/html" },
    signal: AbortSignal.timeout(12000),
  })
  const final = new URL(response.url || url)
  if (final.origin !== url.origin) throw new Error(path + ": redirected to another origin")
  return { response, finalPath: final.pathname }
}

export async function getVersion(origin, fetchImpl = fetch) {
  const { response } = await request(origin, "/api/version", fetchImpl)
  if (response.status !== 200) throw new Error("/api/version HTTP " + response.status)
  const data = await response.json()
  if (typeof data?.version !== "string") throw new Error("/api/version missing version field")
  return data.version
}

export async function waitForVersion({ origin, sha, fetchImpl = fetch, maxWaitMs = 720000, intervalMs = 20000, now = Date.now, sleepFn = wait, log = console.log }) {
  if (!/^[0-9a-f]{40}$/i.test(sha)) throw new Error("EXPECTED_SHA must be a full 40-character Git SHA")
  const deadline = now() + maxWaitMs
  let last = "no response"
  do {
    try {
      const current = await getVersion(origin, fetchImpl)
      if (current === sha) {
        log("Verified live Production SHA: " + sha)
        return
      }
      last = "current=" + current + " expected=" + sha
    } catch (error) {
      last = error.message
    }
    if (now() >= deadline) break
    log("Waiting for Production deployment: " + last)
    await sleepFn(Math.min(intervalMs, Math.max(0, deadline - now())))
  } while (now() <= deadline)
  throw new Error("Production did not reach expected commit: " + last)
}

export async function checkPages({ origin, fetchImpl = fetch }) {
  const rows = []
  for (const { path, marker } of PUBLIC_PAGES) {
    try {
      const { response, finalPath } = await request(origin, path, fetchImpl)
      const html = (response.headers.get("content-type") || "").includes("text/html")
      const body = await response.text()
      const markerPresent = body.toLowerCase().includes(marker.toLowerCase())
      const ok = response.status === 200 && html && finalPath === path && markerPresent
      rows.push({ path, http: response.status, result: ok ? "PASS" : "FAIL", details: ok ? "HTTP 200, HTML and page marker" : "final=" + finalPath + " html=" + html + " marker=" + markerPresent })
    } catch (error) {
      rows.push({ path, http: "-", result: "FAIL", details: error.message })
    }
  }
  for (const path of PRIVATE_PAGES) {
    try {
      const { response, finalPath } = await request(origin, path, fetchImpl)
      const html = (response.headers.get("content-type") || "").includes("text/html")
      const authGate = ["/login", "/mfa"].includes(finalPath)
      const ok = response.status === 200 && html && (finalPath === path || authGate)
      rows.push({ path, http: response.status, result: ok ? "PASS" : "FAIL", details: ok ? (authGate ? "Auth redirect reachable; private content not tested" : "Route reachable; private content not tested") : "final=" + finalPath + " html=" + html })
    } catch (error) {
      rows.push({ path, http: "-", result: "FAIL", details: error.message })
    }
  }
  return rows
}

export async function main({ origin = "https://trackdash.it", sha = process.env.EXPECTED_SHA, fetchImpl = fetch } = {}) {
  const endpoint = new URL(origin)
  if (endpoint.protocol !== "https:" || endpoint.pathname !== "/" || endpoint.username || endpoint.password || endpoint.search || endpoint.hash) throw new Error("Invalid Production origin")
  await waitForVersion({ origin: endpoint.origin, sha, fetchImpl })
  const results = await checkPages({ origin: endpoint.origin, fetchImpl })
  const passed = results.every((row) => row.result === "PASS")
  console.table(results)
  if (process.env.GITHUB_STEP_SUMMARY) {
    const lines = [
      "### TrackDash Production smoke", "",
      "Expected SHA: " + sha, "",
      "Result: **" + (passed ? "PASS" : "FAIL") + "** (" + results.filter((r) => r.result === "PASS").length + "/" + results.length + " HTML pages, plus exact /api/version)", "",
      "Collection and Wishlist are unauthenticated route checks, not authenticated content tests.", "",
      "| Route | HTTP | Result | Details |", "|---|---:|---|---|",
      ...results.map((r) => "| " + r.path + " | " + r.http + " | " + r.result + " | " + r.details.replaceAll("|", "/") + " |"),
      ""
    ]
    await appendFile(process.env.GITHUB_STEP_SUMMARY, lines.join("\n") + "\n")
  }
  if (!passed) throw new Error("Production HTTP smoke: some routes failed")
  console.log("Production smoke PASS: commit aligned and all 8 checks successful.")
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => { console.error("Production smoke FAILED: " + error.message); process.exitCode = 1 })
}
