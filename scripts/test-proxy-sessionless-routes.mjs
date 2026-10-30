import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import vm from "node:vm"
import ts from "typescript"
import { isCatalogPreviewRequest } from "../lib/catalog-preview.ts"

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8")
const SESSIONLESS = ["/api/ebay/marketplace-account-deletion", "/api/cron/market-scan", "/api/cron/ebay-scan"]
const LOOKALIKES = [
  "/api/ebay/marketplace-account-deletion-extra",
  "/api/ebay/marketplace-account-deletion/invented",
  "/api/cron/market-scan-not-real",
  "/api/cron/market-scan/invented",
  "/api/cron/ebay-scan-extra",
  "/api/cron/invented",
  "/api/dev/test",
  "/api/telemetry/page-view",
]

function nextResponse(request) {
  const cookieWrites = []
  return {
    kind: "next",
    request,
    cookieWrites,
    cookies: { set: (...args) => cookieWrites.push(args) },
  }
}

function createProxy({ user = null, aal = null, catalogPreview = false } = {}) {
  const exports = {}
  const sessionCalls = []
  const transpiled = ts.transpileModule(read("proxy.ts"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  vm.runInNewContext(
    transpiled,
    {
      exports,
      URL,
      require(name) {
        if (name === "next/server") {
          return {
            NextResponse: class {
              constructor(body, options) {
                this.body = body
                this.status = options.status
              }
              static next({ request } = {}) {
                return nextResponse(request)
              }
              static redirect(url) {
                return { kind: "redirect", location: String(url) }
              }
            },
          }
        }
        if (name === "@/lib/catalog-preview") {
          return { isCatalogOnlyPreview: () => catalogPreview, isCatalogPreviewRequest }
        }
        if (name === "@/lib/supabase/proxy") {
          return {
            updateSession: async (request) => {
              sessionCalls.push(request.nextUrl.pathname)
              return { response: nextResponse(request), user, aal }
            },
          }
        }
        throw new Error("Unexpected dependency in Proxy: " + name)
      },
    },
    { filename: "proxy.ts" },
  )
  return { proxy: exports.proxy, matcher: exports.config.matcher[0], sessionCalls }
}

function request(pathname) {
  const nextUrl = new URL("https://trackdash.it" + pathname)
  nextUrl.clone = () => new URL(nextUrl.href)
  const cookieWrites = []
  return {
    url: nextUrl.href,
    method: "GET",
    nextUrl,
    cookies: {
      set: (...args) => cookieWrites.push(args),
    },
    cookieWrites,
  }
}

test("catalog-only preview serves only editorial GET/HEAD routes and never refreshes auth", async () => {
  const app = createProxy({ catalogPreview: true })
  for (const path of ["/speed-champions", "/speed-champions/catalog", "/speed-champions/catalog/76934"]) {
    assert.equal((await app.proxy(request(path))).kind, "next")
    assert.equal((await app.proxy({ ...request(path), method: "HEAD" })).kind, "next")
    assert.equal((await app.proxy({ ...request(path), method: "POST" })).status, 404)
  }
  for (const path of [
    ...SESSIONLESS,
    ...LOOKALIKES,
    "/login",
    "/collection",
    "/market",
    "/catalog",
    "/speed-champions/catalog/76934/extra",
  ]) {
    assert.equal((await app.proxy(request(path))).status, 404, path)
  }
  assert.equal((await app.proxy(request("/"))).location, "https://trackdash.it/speed-champions/catalog")
  assert.equal((await app.proxy({...request("/"), method: "POST"})).status, 404)
  assert.deepEqual(app.sessionCalls, [])
})

test("real Next.js matcher skips only exact independently authenticated routes", () => {
  const { matcher } = createProxy()
  const pattern = new RegExp("^" + matcher + "$")
  for (const path of SESSIONLESS) {
    assert.equal(pattern.test(path), false, path)
    assert.equal(pattern.test(path + "/"), false, path + "/")
  }
  for (const path of [...LOOKALIKES, "/", "/login", "/dashboard", "/mfa", "/en/catalog", "/catalog", "/market"]) {
    assert.equal(pattern.test(path), true, path)
  }
})

test("defense-in-depth Proxy early return never fetches browser session for three exact handlers", async () => {
  const app = createProxy()
  for (const path of SESSIONLESS) {
    const resp = await app.proxy(request(path))
    assert.equal(resp.kind, "next")
  }
  assert.deepEqual(app.sessionCalls, [])
})

test("lookalikes and all existing ungated prefixes are not given the new bypass", async () => {
  const app = createProxy()
  for (const path of LOOKALIKES) {
    const resp = await app.proxy(request(path))
    assert.equal(resp.kind, "next", path)
  }
  assert.equal(app.sessionCalls.length, LOOKALIKES.length)
})

test("normal browser pages still refresh session and preserve public locale cookies", async () => {
  const app = createProxy()
  for (const path of ["/", "/catalog", "/en/catalog/18038", "/dashboard"]) {
    const req = request(path)
    const result = await app.proxy(req)
    if (path === "/dashboard") {
      assert.equal(result.kind, "redirect")
      assert.match(result.location, /\/login\?next=%2Fdashboard/)
    } else {
      assert.equal(result.kind, "next")
      const expected = path.startsWith("/en/") ? "en" : "it"
      assert.ok(req.cookieWrites.some(([key, value]) => key === "trackdash.locale" && value === expected))
      assert.ok(result.cookieWrites.some(([key, value]) => key === "trackdash.locale" && value === expected))
    }
  }
  assert.equal(app.sessionCalls.length, 4)
})

test("signed-in sessions, auth redirects and MFA checks remain active", async () => {
  const signedIn = createProxy({ user: { id: "fixture" } })
  assert.equal((await signedIn.proxy(request("/dashboard"))).kind, "next")
  const login = await signedIn.proxy(request("/login"))
  assert.equal(login.kind, "redirect")
  assert.match(login.location, /\/dashboard$/)
  assert.equal(signedIn.sessionCalls.length, 2)

  const mfa = createProxy({
    user: { id: "fixture" },
    aal: { currentLevel: "aal1", nextLevel: "aal2" },
  })
  const result = await mfa.proxy(request("/collection"))
  assert.equal(result.kind, "redirect")
  assert.match(result.location, /\/mfa\?next=%2Fcollection/)
  assert.equal(mfa.sessionCalls.length, 1)
})

test("each excluded route authenticates independently before touching data", () => {
  const deletion = read("app/api/ebay/marketplace-account-deletion/route.ts")
  const daily = read("app/api/cron/market-scan/route.ts")
  const ebay = read("app/api/cron/ebay-scan/route.ts")
  assert.ok(deletion.includes("verifyEbayNotificationSignature(rawBody, signature"))
  assert.ok(deletion.indexOf("verifyEbayNotificationSignature(rawBody") < deletion.indexOf("eraseEbayUserData(client"))
  assert.ok(daily.includes('request.headers.get("authorization") !== `Bearer ${secret}`'))
  assert.ok(ebay.includes("isCronSecret(token) || await isTrustedGithubAction(token)"))
})


test("public mercatino and copy details are accessible while offers and messages remain protected", async () => {
  const app = createProxy()
  for (const path of ["/shop", "/shop/11111111-1111-4111-8111-111111111111"]) {
    assert.equal((await app.proxy(request(path))).kind, "next")
  }
  for (const path of ["/messages", "/collection", "/shop-lookalike"]) {
    assert.equal((await app.proxy(request(path))).kind, "redirect")
  }
})

test("English mercatino public routes pin English locale without admitting lookalikes", async () => {
 const app=createProxy()
 for(const path of ['/en/shop','/en/shop/11111111-1111-4111-8111-111111111111']) {
  const req=request(path);const response=await app.proxy(req)
  assert.equal(response.kind,'next')
  assert.ok(req.cookieWrites.some(([key,value])=>key==='trackdash.locale'&&value==='en'))
 }
 assert.equal((await app.proxy(request('/en/shop-lookalike'))).kind,'redirect')
})
