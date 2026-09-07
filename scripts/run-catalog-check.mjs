#!/usr/bin/env node
// Explicit entry point for the effective catalog invariant check.
// The query marker is intentional: ts-extension-loader.mjs uses it to map the
// legacy checker imports to corrected-products + the aggregate image manifest.
// If this runner or checker path is renamed without updating the import below,
// Node fails loudly instead of silently validating the stale historical seed.
import { register } from "node:module"

register("./ts-extension-loader.mjs", import.meta.url)

await import("./check-catalog-invariants.mjs?effectiveCatalog=1")
