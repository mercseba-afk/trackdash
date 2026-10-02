import assert from "node:assert/strict"

const {
  colorLabel,
  conditionLabel,
  countryMarketLabel,
  productDescriptionForLocale,
  rarityLabel,
  releaseDescriptionForLocale,
  releaseTypeLabel,
} = await import("../lib/i18n/catalog-labels.ts")

assert.equal(releaseTypeLabel("Finished Model", true), "Modello assemblato")
assert.equal(releaseTypeLabel("Spot Reissue", true), "Ristampa spot")
assert.equal(releaseTypeLabel("Prize Limited", true), "Edizione premio limitata")
assert.equal(releaseTypeLabel("Original", false), "Original")

assert.equal(rarityLabel("Very Rare", true), "Molto rara")
assert.equal(rarityLabel("Rare", false), "Rare")
assert.equal(conditionLabel("New / Opened", true), "Nuovo / Aperto")
assert.equal(countryMarketLabel("Japan / Germany", true), "Giappone / Germania")
assert.equal(countryMarketLabel("Taiwan / Asia Challenge", true), "Taiwan / Asia Challenge")

assert.equal(
  colorLabel("Black body / red Super XX chassis / red tires", true),
  "Carrozzeria nera / Chassis Super XX · rosso / Pneumatici rossi",
)
assert.equal(
  colorLabel("Clear polycarbonate body / black reinforced VS chassis / black V-spoke wheels / red hard barrel tires", true),
  "Carrozzeria in policarbonato trasparente / Chassis VS · nero rinforzato / Cerchi neri V-spoke / Pneumatici rossi hard barrel",
)

const product = {
  name: "Dyna-Hawk GX",
  originalReleaseYear: 1998,
  chassis: "Super X",
  description: "English family description that must not leak into Italian.",
  releases: [{}, {}, {}, {}],
}

assert.match(
  productDescriptionForLocale(product, null, true),
  /^Dyna-Hawk GX è una famiglia Tamiya Mini 4WD/,
)
assert.doesNotMatch(
  productDescriptionForLocale(product, null, true),
  /English family description/,
)
assert.equal(
  productDescriptionForLocale(product, null, false),
  "English family description that must not leak into Italian.",
)

const release = {
  editionName: "Dyna-Hawk GX Super XX Special",
  itemNumber: "94717",
  releaseYear: 2010,
  chassis: "Super XX",
  releaseType: "Color Special",
}

const generatedIt = releaseDescriptionForLocale(
  product,
  release,
  { en: null, it: null },
  true,
)
assert.match(generatedIt, /ITEM 94717/)
assert.match(generatedIt, /uscita nel 2010/)
assert.match(generatedIt, /edizione colore speciale/)
assert.doesNotMatch(generatedIt, /English family description/)

const normalizedIt = releaseDescriptionForLocale(
  product,
  release,
  {
    en: "English release description",
    it: "Release premio amusement con carrozzeria Red e una wave produttiva.",
  },
  true,
)
assert.match(normalizedIt, /premio arcade/)
assert.match(normalizedIt, /carrozzeria rossa/)
assert.match(normalizedIt, /serie produttiva/)
assert.doesNotMatch(normalizedIt, /English release description/)

console.log("Public localization tests passed")
