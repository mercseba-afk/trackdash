#!/usr/bin/env node
// Image resolver / fallback test (Images Phase 1, point 5). Exercises the
// real lib/images/resolve.ts against the four cases the policy defines,
// and hard-tests the critical rule: a release with NO image of its own
// must NEVER be given a sibling release's image.
//
//   node --experimental-strip-types scripts/test-image-resolver.mjs
//   (or: pnpm images:test)
//
// Policy (docs/IMAGES_MVP.md):
//   specific release: exact release image -> product image -> placeholder
//   generic product:  product image -> suitable release image -> placeholder
//   NEVER release A -> release B for a specifically-selected release.
import { register } from "node:module"

register("./ts-extension-loader.mjs", import.meta.url)

const { resolveReleaseImageUrl, resolveProductImageUrl, resolveDisplayImageUrl } = await import("../lib/images/resolve.ts")

let pass = 0
let fail = 0
const t = (name, cond) => {
  if (cond) {
    pass++
    console.log("ok:", name)
  } else {
    fail++
    console.log("FAIL:", name)
  }
}

// Minimal fixtures (only the fields the resolver reads: images[] on
// product and on each release).
const RELEASE_IMG = "https://example.com/release.jpg"
const SIBLING_IMG = "https://example.com/sibling.jpg"
const PRODUCT_IMG = "https://example.com/product.jpg"

function makeProduct({ productImages = [], releases = [] }) {
  return { images: productImages, releases }
}

// --- Case A: product WITH a product image, viewed generically ---
{
  const p = makeProduct({ productImages: [PRODUCT_IMG], releases: [{ images: [] }] })
  t("A: generic product view uses product image", resolveProductImageUrl(p) === PRODUCT_IMG)
  t("A: resolveDisplayImageUrl (no release) uses product image", resolveDisplayImageUrl(p) === PRODUCT_IMG)
}

// --- Case B: release WITH its own exact image ---
{
  const rel = { images: [RELEASE_IMG] }
  const p = makeProduct({ productImages: [PRODUCT_IMG], releases: [rel] })
  t("B: specific release uses its OWN image (not the product image)", resolveReleaseImageUrl(rel, p) === RELEASE_IMG)
  t("B: resolveDisplayImageUrl(release) uses the release's own image", resolveDisplayImageUrl(p, rel) === RELEASE_IMG)
}

// --- Case C: release with NO exact image, but product HAS one ---
{
  const rel = { images: [] }
  const p = makeProduct({ productImages: [PRODUCT_IMG], releases: [rel] })
  t("C: imageless release falls back to the PRODUCT image", resolveReleaseImageUrl(rel, p) === PRODUCT_IMG)
}

// --- Case D: no image anywhere -> null (placeholder) ---
{
  const rel = { images: [] }
  const p = makeProduct({ productImages: [], releases: [rel] })
  t("D: no image anywhere -> null (release view)", resolveReleaseImageUrl(rel, p) === null)
  t("D: no image anywhere -> null (product view)", resolveProductImageUrl(p) === null)
  t("D: resolveDisplayImageUrl -> null when nothing exists", resolveDisplayImageUrl(p, rel) === null)
}

// --- HARD TEST: an imageless release must NOT get a SIBLING's image ---
{
  const withImage = { images: [SIBLING_IMG] } // a sibling that HAS an image
  const withoutImage = { images: [] } // the release we're viewing
  // Product has NO product image, only the sibling has one.
  const p = makeProduct({ productImages: [], releases: [withImage, withoutImage] })

  const resolved = resolveReleaseImageUrl(withoutImage, p)
  t("HARD: imageless release does NOT receive its sibling's image", resolved !== SIBLING_IMG)
  t("HARD: imageless release with no product image -> null (placeholder), not sibling", resolved === null)

  // And confirm the sibling fallback DOES apply for the generic product view
  // (this is the one place it's allowed).
  t("product view MAY use a sibling release image (allowed there only)", resolveProductImageUrl(p) === SIBLING_IMG)
}

// --- Extra: release image wins even when a product image also exists ---
{
  const rel = { images: [RELEASE_IMG] }
  const p = makeProduct({ productImages: [PRODUCT_IMG], releases: [rel, { images: [SIBLING_IMG] }] })
  t("release image takes priority over product image", resolveReleaseImageUrl(rel, p) === RELEASE_IMG)
}

console.log(`\n${pass} passed, ${fail} failed`)
if (fail === 0) {
  console.log("IMAGE RESOLVER TEST PASSED")
  process.exit(0)
} else {
  console.log("IMAGE RESOLVER TEST FAILED")
  process.exit(1)
}
