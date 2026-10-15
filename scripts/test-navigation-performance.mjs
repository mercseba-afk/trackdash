import assert from "node:assert/strict"
import { test } from "node:test"
import { readFileSync } from "node:fs"
import { resolve, dirname } from "node:path"
import vm from "node:vm"
import ts from "typescript"

const root = resolve(new URL("..", import.meta.url).pathname)
const read = (p) => readFileSync(resolve(root, p), "utf8")
const product = { id: "11111111-1111-4111-8111-111111111111", name: "Manta Ray Mk.II", catalogLaunchStatus: "available", images: [], description: "Verified copy", releases: [
  { id: "22222222-2222-4222-8222-222222222222", itemNumber: "95466", editionName: "Manta Ray Mk.II Black Special", releaseYear: 2009, releaseType: "Original", images: [] },
] }

// Compile real route modules and href expressions. No DB, auth or network.
function loader(mocks = {}) {
  const modules = new Map()
  function load(p) {
    p = resolve(root, p)
    if (!/\.tsx?$/.test(p)) p += ".ts"
    if (modules.has(p)) return modules.get(p)
    const exports = {}; modules.set(p, exports)
    const js = ts.transpileModule(readFileSync(p, "utf8"), { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
    } }).outputText
    vm.runInNewContext(js, { exports, URL, console: { error() {} }, fetch() { throw Error("NETWORK_FORBIDDEN") }, require(name) {
      if (Object.hasOwn(mocks, name)) return mocks[name]
      if (name === "react") return { cache: (fn) => fn }
      if (name === "react/jsx-runtime") return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) }
      if (name.startsWith("@/components/")) return new Proxy({}, { get: (_, key) => String(key) })
      if (name.startsWith("@/")) return load(name.slice(2))
      if (name.startsWith(".")) return load(resolve(dirname(p), name))
      throw Error("UNEXPECTED_IMPORT:" + name)
    } }, { filename: p })
    return exports
  }
  return load
}

function routes(locale = "it", overrides = {}) {
  const counters = { productReads: 0, localizedReads: 0, catalogReads: 0, offersReads: 0 }
  const load = loader({
    "next/headers": { cookies: async () => ({ get: () => ({ value: locale }) }) },
    "next/navigation": { notFound() { throw Error("NOT_FOUND") }, permanentRedirect(path) { throw Object.assign(Error("REDIRECT"), { path }) } },
    "@/lib/actions/catalog": {
      fetchCatalogProductByRouteKey: async () => { counters.productReads++; return product },
      fetchCatalogProducts: async () => { counters.catalogReads++; return [] },
      ...overrides.catalog,
    },
    "@/lib/db/queries/catalog-copy": { getCatalogLocalizedCopy: async () => { counters.localizedReads++; return null }, ...overrides.copy },
    "@/lib/db/queries/public-sharing": { getPublicOpenOffersForRelease: async () => { counters.offersReads++; return [] } },
    "@/lib/data/products": { getRelatedProducts: () => [] },
    "@/lib/images/resolve": { resolveReleaseImageUrl: () => null },
    "@/lib/i18n/catalog-labels": { releaseTypeLabel: () => "Original" },
  })
  return { load, counters }
}

const sources = ["components/screens/dashboard-screen.tsx", "components/screens/collection-screen.tsx", "components/screens/wishlist-screen.tsx"]
function detailExpressions(file) {
  const source = ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX), expressions = []
  function visit(node) {
    // Include the actual WishlistRow href variable, plus inline detail hrefs.
    if (ts.isJsxAttribute(node) && node.name.getText(source) === "href" && node.initializer && ts.isJsxExpression(node.initializer)) {
      const e = node.initializer.expression
      if (e?.getText(source).includes("entry.product")) expressions.push(e.getText(source))
    }
    if (file.endsWith("wishlist-screen.tsx") && ts.isVariableDeclaration(node) && node.name.getText(source) === "href") expressions.push(node.initializer.getText(source))
    ts.forEachChild(node, visit)
  }
  visit(source); return expressions
}

for (const locale of ["it", "en"]) {
  test(`legacy UUID detail redirects, canonical path renders without another route pass (${locale})`, async () => {
    const { load, counters } = routes(locale)
    const seo = load("lib/seo/catalog-paths.ts"), page = load("app/catalog/[id]/releases/[releaseId]/page.tsx").default
    const target = seo.releasePublicPath(product, product.releases[0], locale)
    await assert.rejects(page({ params: Promise.resolve({ id: product.id, releaseId: product.releases[0].id }) }), (error) => error.path === target)
    assert.equal(counters.localizedReads, 0, "redirect exits before detail data reads")
    await page({ params: Promise.resolve({ id: seo.productPublicSlug(product), releaseId: seo.releasePublicSlug(product.releases[0]) }) })
    assert.equal(counters.productReads, 2, "two route passes when entering through UUID")
    assert.equal(counters.localizedReads, 1)
    const direct = routes(locale)
    await direct.load("app/catalog/[id]/releases/[releaseId]/page.tsx").default({ params: Promise.resolve({ id: seo.productPublicSlug(product), releaseId: seo.releasePublicSlug(product.releases[0]) }) })
    assert.equal(direct.counters.productReads, 1, "canonical navigation requires only the final route pass")
  })

  test(`all Dashboard/Collection/Wishlist detail links already target canonical locale paths (${locale})`, () => {
    const seo = loader()("lib/seo/catalog-paths.ts"), entry = { product, release: product.releases[0] }
    let sites = 0
    for (const file of sources) for (const expression of detailExpressions(file)) {
      const href = vm.runInNewContext(expression, { entry, locale, ...seo })
      assert.equal(href, seo.releasePublicPath(product, entry.release, locale), file)
      if (expression.includes("entry.release ?")) {
        const family = vm.runInNewContext(expression, { entry: { product }, locale, ...seo })
        assert.equal(family, seo.productPublicPath(product, locale), "any-edition Wishlist targets canonical family")
      }
      sites++
    }
    assert.equal(sites, 7, "all current detail-link construction sites covered")
  })
}

for (const locale of ["it", "en"]) {
test(`family detail starts independent copy and related-catalog reads before either resolves (${locale})`, async () => {
  let finishCopy, finishCatalog, copyStarted = false, catalogStarted = false
  const { load } = routes(locale, {
    copy: { getCatalogLocalizedCopy: () => { copyStarted = true; return new Promise(resolve => { finishCopy = resolve }) } },
    catalog: { fetchCatalogProducts: () => { catalogStarted = true; return new Promise(resolve => { finishCatalog = resolve }) } },
  })
  const page = load("app/catalog/[id]/page.tsx").default
  const pending = page({ params: Promise.resolve({ id: "manta-ray-mk-ii" }) })
  for (let i = 0; i < 20; i++) await Promise.resolve()
  const concurrent = copyStarted && catalogStarted
  finishCopy(null)
  for (let i = 0; i < 20; i++) await Promise.resolve()
  finishCatalog([]); await pending
  assert.equal(concurrent, true, "no dependency between the two reads")
})

test(`coming-soon and redirected family routes never query the related catalog (${locale})`, async () => {
  const { load, counters } = routes(locale, { catalog: { fetchCatalogProductByRouteKey: async () => ({ ...product, catalogLaunchStatus: "coming_soon" }) } })
  const page = load("app/catalog/[id]/page.tsx").default
  await assert.rejects(page({ params: Promise.resolve({ id: product.id }) }), /REDIRECT/)
  assert.equal(counters.localizedReads, 0)
  await page({ params: Promise.resolve({ id: "manta-ray-mk-ii" }) })
  assert.equal(counters.localizedReads, 0, "coming-soon does not use editorial or related-product data")
  assert.equal(counters.catalogReads, 0)
})

test(`independent query failures keep existing family fallback rendering (${locale})`, async () => {
  for (const broken of ["copy", "catalog", "both"]) {
    const { load } = routes(locale, {
      copy: { getCatalogLocalizedCopy: async () => { if (broken !== "catalog") throw Error("SIMULATED_COPY_FAILURE"); return null } },
      catalog: { fetchCatalogProducts: async () => { if (broken !== "copy") throw Error("SIMULATED_CATALOG_FAILURE"); return [] } },
    })
    const tree = await load("app/catalog/[id]/page.tsx").default({ params: Promise.resolve({ id: "manta-ray-mk-ii" }) })
    assert.ok(tree)
  }
})

test(`missing family stops before copy or related-catalog queries (${locale})`, async () => {
  const { load, counters } = routes(locale, { catalog: { fetchCatalogProductByRouteKey: async () => null } })
  await assert.rejects(load("app/catalog/[id]/page.tsx").default({ params: Promise.resolve({ id: "missing-family" }) }), /NOT_FOUND/)
  assert.equal(counters.localizedReads, 0)
  assert.equal(counters.catalogReads, 0)
})

test(`missing Release stops before editorial or collector-offer queries (${locale})`, async () => {
  const { load, counters } = routes(locale)
  await assert.rejects(load("app/catalog/[id]/releases/[releaseId]/page.tsx").default({ params: Promise.resolve({ id: "manta-ray-mk-ii", releaseId: "missing-release" }) }), /NOT_FOUND/)
  assert.equal(counters.localizedReads, 0)
  assert.equal(counters.offersReads, 0)
})

}
