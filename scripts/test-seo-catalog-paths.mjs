import assert from "node:assert/strict"

const {
  localizePublicPath,
  productPublicPath,
  productPublicSlug,
  releasePublicPath,
  releasePublicSlug,
  slugifyPublicSegment,
  withCollectionIntent,
} = await import("../lib/seo/catalog-paths.ts")

assert.equal(slugifyPublicSegment("Avante Mk.III"), "avante-mk-iii")
assert.equal(slugifyPublicSegment("DASH-X1 Proto-Emperor"), "dash-x1-proto-emperor")
assert.equal(slugifyPublicSegment("Manta Ray Mk.II"), "manta-ray-mk-ii")

const avante = { name: "Avante Mk.III" }
const azure = {
  itemNumber: "18626",
  editionName: "Avante Mk.III Azure",
  releaseYear: 2008,
}

assert.equal(productPublicSlug(avante), "avante-mk-iii")
assert.equal(productPublicPath(avante), "/catalog/avante-mk-iii")
assert.equal(productPublicPath(avante, "en"), "/en/catalog/avante-mk-iii")
assert.equal(localizePublicPath("/", "en"), "/en")
assert.equal(localizePublicPath("/catalog", "en"), "/en/catalog")
assert.equal(localizePublicPath("/en/catalog", "it"), "/catalog")
assert.equal(releasePublicSlug(azure), "18626-avante-mk-iii-azure")
assert.equal(
  releasePublicPath(avante, azure),
  "/catalog/avante-mk-iii/releases/18626-avante-mk-iii-azure",
)
assert.equal(
  releasePublicPath(avante, azure, "en"),
  "/en/catalog/avante-mk-iii/releases/18626-avante-mk-iii-azure",
)
assert.equal(
  withCollectionIntent("/catalog/avante-mk-iii", "collection"),
  "/catalog/avante-mk-iii?intent=collection",
)
assert.equal(
  withCollectionIntent("/catalog/avante-mk-iii?ref=home", "wishlist"),
  "/catalog/avante-mk-iii?ref=home&intent=wishlist",
)

const noItem = {
  itemNumber: undefined,
  editionName: "Limited Anniversary",
  releaseYear: 2012,
}
assert.equal(releasePublicSlug(noItem), "limited-anniversary-2012")

console.log("SEO catalog path tests passed")
