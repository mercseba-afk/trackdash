// Minimal ESM loader hook: when a relative import has no file extension
// and doesn't resolve as-is, retries it with `.ts` appended.
//
// Why this exists: Node's own module resolution (even with
// --experimental-strip-types, which only strips TypeScript syntax, not
// resolve extensionless specifiers) requires explicit extensions for
// relative imports. The app's source under lib/ intentionally omits them
// (the idiomatic style for this codebase's `moduleResolution: "bundler"`
// TypeScript config, which Next.js's own bundler resolves for us at build
// time) — this loader lets scripts import that same source directly with
// plain `node`, without needing esbuild/tsx as an extra dependency.
//
// Catalog-audit compatibility: check-catalog-invariants.mjs predates the
// evidence-backed correction overlay and still names the historical seed and
// base image file in its two dynamic imports. Because that checker registers
// this loader before making those imports, remap ONLY those two imports to the
// effective corrected catalog and canonical aggregate image manifest. This
// keeps every existing invariant intact while making it inspect exactly what
// runtime/seed tooling now consumes. Other callers are never remapped.
export async function resolve(specifier, context, nextResolve) {
  const fromCatalogChecker = context.parentURL?.endsWith("/scripts/check-catalog-invariants.mjs")

  if (fromCatalogChecker && specifier === "../lib/data/products.ts") {
    return nextResolve("../lib/data/corrected-products.ts", context)
  }
  if (fromCatalogChecker && specifier === "./data/tamiya-images.ts") {
    return nextResolve("./data/tamiya-image-manifest.ts", context)
  }

  try {
    return await nextResolve(specifier, context)
  } catch (err) {
    if (specifier.startsWith(".") && !/\.[a-zA-Z0-9]+$/.test(specifier)) {
      return nextResolve(`${specifier}.ts`, context)
    }
    throw err
  }
}
