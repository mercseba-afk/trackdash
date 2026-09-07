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
// Catalog-audit compatibility: the historical invariant checker still names
// products.ts + tamiya-images.ts internally. `pnpm catalog:check` now enters
// through run-catalog-check.mjs, which imports the checker with an explicit
// `?effectiveCatalog=1` marker. That marker — not the checker filename — is the
// authoritative signal to remap those two legacy imports to the effective
// corrected catalog and aggregate image manifest. The old filename match is
// retained only so invoking the legacy checker directly keeps the same behavior.
export async function resolve(specifier, context, nextResolve) {
  let effectiveCatalogCheck = false

  if (context.parentURL) {
    try {
      const parent = new URL(context.parentURL)
      effectiveCatalogCheck = parent.searchParams.get("effectiveCatalog") === "1"

      // Backward compatibility for direct manual invocation of the legacy file.
      if (!effectiveCatalogCheck) {
        effectiveCatalogCheck = parent.pathname.endsWith("/scripts/check-catalog-invariants.mjs")
      }
    } catch {
      // Fall through to normal resolution below.
    }
  }

  if (effectiveCatalogCheck && specifier === "../lib/data/products.ts") {
    return nextResolve("../lib/data/corrected-products.ts", context)
  }
  if (effectiveCatalogCheck && specifier === "./data/tamiya-images.ts") {
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
