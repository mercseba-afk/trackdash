// Minimal ESM loader hook: when a relative import has no file extension
// and doesn't resolve as-is, retries it with `.ts` appended.
//
// Why this exists: Node's own module resolution (even with
// --experimental-strip-types, which only strips TypeScript syntax, not
// resolve extensionless specifiers) requires explicit extensions for
// relative imports. The app's source under lib/ intentionally omits them
// (the idiomatic style for this codebase's `moduleResolution: "bundler"`
// TypeScript config, which Next.js's own bundler resolves for us at build
// time) — this loader lets scripts/generate-catalog-seed.mjs import that
// same source directly with plain `node`, without needing esbuild/tsx as
// an extra dependency just for this one script.
export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context)
  } catch (err) {
    if (specifier.startsWith(".") && !/\.[a-zA-Z0-9]+$/.test(specifier)) {
      return nextResolve(`${specifier}.ts`, context)
    }
    throw err
  }
}
