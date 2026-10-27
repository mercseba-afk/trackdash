import assert from "node:assert/strict"
import { mkdtemp, rm, stat } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { build } from "esbuild"
import { stableUuid } from "../lib/data/stable-id.ts"

const directory = await mkdtemp(path.join(tmpdir(), "speed-champions-test-"))
try {
  const outfile = path.join(directory, "catalog.mjs")
  await build({ entryPoints: ["lib/lego/catalog.ts"], bundle: true, platform: "node", format: "esm", outfile })
  const {
    speedChampionsSets: sets,
    filterSpeedChampions: filter,
    speedChampionsPath,
    setImagePath,
  } = await import(pathToFileURL(outfile))
  assert.equal(sets.length, 19)
  for (const field of ["setNumber", "productId", "releaseId"])
    assert.equal(new Set(sets.map((s) => s[field])).size, sets.length)
  for (const set of sets) {
    assert.match(set.setNumber, /^\d{5}$/)
    assert.equal(set.productId, stableUuid(`product:lego-speed-champions:${set.setNumber}`))
    assert.equal(set.releaseId, stableUuid(`release:lego-speed-champions:${set.setNumber}:1`))
    assert.notEqual(set.productId, stableUuid(`product:${set.setNumber}`), "Never reuse Mini4WD identities")
    assert.ok(set.sourceUrl.endsWith(set.setNumber))
    assert.ok(set.pieces > 0)
    assert.ok([1, 2].includes(set.carCount))
    for (const src of [set.boxImage, set.modelImage]) {
      assert.ok(src.includes(set.setNumber), "Image must identify the exact set")
    }
    for (const view of ["box", "model"]) {
      const file = await stat(`public${setImagePath(set.setNumber, view)}`)
      assert.ok(file.size > 1000, "Both exact-set images must be bundled")
    }
  }
  assert.deepEqual(
    filter(sets, { query: "76934" }).map((s) => s.setNumber),
    ["76934"],
  )
  assert.deepEqual(
    filter(sets, { query: "  FERRARI  76934  " }).map((s) => s.setNumber),
    ["76934"],
  )
  assert.equal(filter(sets, { query: "ferrari", brand: "Honda" }).length, 0)
  assert.equal(filter(sets, { format: "2" }).length, 4, "Two-car packs are one collectible set")
  assert.ok(filter(sets, { status: "retired", year: "2020" }).every((s) => s.status === "retired" && s.year === 2020))
  assert.equal(filter(sets, { sort: "oldest" })[0].year, 2019)
  assert.equal(filter(sets, {})[0].year, 2025)
  assert.equal(speedChampionsPath("76934"), "/speed-champions/catalog/76934")

  // Test the real server gate with only the auth dependency substituted.
  const gateFile = path.join(directory, "gate.mjs")
  await build({
    entryPoints: ["lib/server/speed-champions-gate.ts"],
    bundle: true,
    platform: "node",
    format: "esm",
    outfile: gateFile,
    plugins: [
      {
        name: "auth-fixture",
        setup(b) {
          b.onResolve({ filter: /^server-only$/ }, () => ({ path: "server-only", namespace: "test" }))
          b.onResolve({ filter: /^@\/lib\/admin\/access$/ }, () => ({ path: "auth", namespace: "test" }))
          b.onLoad({ filter: /.*/, namespace: "test" }, (args) => ({
            contents:
              args.path === "auth"
                ? "export async function getCurrentAdmin() { return globalThis.testAdmin ?? null }"
                : "",
          }))
        },
      },
    ],
  })
  const { canAccessSpeedChampions } = await import(pathToFileURL(gateFile))
  process.env.NODE_ENV = "production"
  process.env.VERCEL_ENV = "production"
  assert.equal(await canAccessSpeedChampions(), false, "Production visitor must not see the pilot")
  globalThis.testAdmin = { id: "admin-fixture" }
  assert.equal(await canAccessSpeedChampions(), true)
  globalThis.testAdmin = null
  process.env.VERCEL_ENV = "preview"
  assert.equal(await canAccessSpeedChampions(), true)
  delete process.env.VERCEL_ENV
  process.env.NODE_ENV = "development"
  assert.equal(await canAccessSpeedChampions(), true)
  const databaseFile = path.join(directory, "database.mjs")
  await build({
    entryPoints: ["lib/db/index.ts"],
    bundle: true,
    platform: "node",
    format: "esm",
    outfile: databaseFile,
    plugins: [
      {
        name: "database-isolation-fixture",
        setup(b) {
          b.onResolve({ filter: /^(server-only|postgres|drizzle-orm\/postgres-js|\.\/schema)$/ }, (args) => ({
            path: args.path,
            namespace: "db-fixture",
          }))
          b.onLoad({ filter: /.*/, namespace: "db-fixture" }, (args) => ({
            contents:
              args.path === "postgres"
                ? "export default function postgres(url) { globalThis.dbConnectionAttempts.push(url); return {} }"
                : args.path === "drizzle-orm/postgres-js"
                  ? "export function drizzle() { return {query: 'normal-runtime'} }"
                  : "",
          }))
        },
      },
    ],
  })
  globalThis.dbConnectionAttempts = []
  process.env.TRACKDASH_CATALOG_ONLY_PREVIEW = "1"
  process.env.VERCEL_ENV = "preview"
  delete process.env.DATABASE_URL
  const isolated = await import(pathToFileURL(databaseFile).href + "?without-secret")
  assert.throws(() => isolated.db.query, /Database access is disabled/)
  process.env.DATABASE_URL = "must-never-connect"
  const withSecret = await import(pathToFileURL(databaseFile).href + "?accidental-secret")
  assert.throws(() => withSecret.db.query, /Database access is disabled/)
  assert.deepEqual(globalThis.dbConnectionAttempts, [])
  process.env.VERCEL_ENV = "production"
  delete process.env.DATABASE_URL
  await assert.rejects(
    import(pathToFileURL(databaseFile).href + "?production-missing-secret"),
    /DATABASE_URL is not set/,
  )
  process.env.DATABASE_URL = "runtime-fixture"
  const normal = await import(pathToFileURL(databaseFile).href + "?production-runtime")
  assert.equal(normal.db.query, "normal-runtime")
  assert.deepEqual(globalThis.dbConnectionAttempts, ["runtime-fixture"])
  console.log(
    "Catalog-only preview: no database connection, even with accidental secrets; production contract preserved",
  )
  console.log("Speed Champions: catalog identity, filters, multi-car packs, images and access gates passed")
} finally {
  await rm(directory, { recursive: true, force: true })
}
