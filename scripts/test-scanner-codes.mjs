#!/usr/bin/env node
import { register } from "node:module"

register("./ts-extension-loader.mjs", import.meta.url)

const { PRODUCTS, findByCode, findByCodeInProducts, tamiyaItemNumberFromJan } = await import("../lib/data/corrected-products.ts")

let pass = 0
let fail = 0
const t = (name, condition) => {
  if (condition) {
    pass++
    console.log("ok:", name)
  } else {
    fail++
    console.error("FAIL:", name)
  }
}

t("95467 JAN derives exact item number", tamiyaItemNumberFromJan("4950344954674") === "95467")
t("18614 JAN derives exact item number", tamiyaItemNumberFromJan("4950344186143") === "18614")
t("95335 JAN derives exact item number", tamiyaItemNumberFromJan("4950344953356") === "95335")
t("spaces and hyphens are normalized", tamiyaItemNumberFromJan("4950-3449 54674") === "95467")
t("invalid checksum fails closed", tamiyaItemNumberFromJan("4950344954675") === undefined)
t("unrelated EAN fails closed", tamiyaItemNumberFromJan("4006381333931") === undefined)

const direct = findByCode("95467")
t("direct item number resolves exact release", direct?.release?.itemNumber === "95467")

const jan = findByCode("4950344954674")
t("Tamiya JAN resolves the same exact release", jan?.release?.itemNumber === "95467")


const avanteMkII = PRODUCTS.find((product) => product.name === "Avante Mk.II")
const avanteBase18614 = avanteMkII?.releases.find((release) => release.itemNumber === "18614")
if (avanteMkII && avanteBase18614) {
  const canonicalWithShared18614 = PRODUCTS.map((product) =>
    product.id === avanteMkII.id
      ? {
          ...product,
          releases: [
            ...product.releases,
            {
              ...avanteBase18614,
              id: "scanner-test-avante-mkii-gamba-2023",
              editionName: "Avante Mk.II Gamba Osaka Special Edition",
              releaseYear: 2023,
              barcodeJAN: undefined,
            },
            {
              ...avanteBase18614,
              id: "scanner-test-avante-mkii-cerezo-2023",
              editionName: "Avante Mk.II Cerezo Osaka Special Edition",
              releaseYear: 2023,
              barcodeJAN: undefined,
            },
          ],
        }
      : product,
  )
  const shared18614 = findByCodeInProducts(canonicalWithShared18614, "18614")
  t(
    "canonical reused item 18614 resolves Avante Mk.II model but never an arbitrary Release",
    shared18614?.product?.name === "Avante Mk.II" && shared18614.release === undefined,
  )
} else {
  t("canonical reused item 18614 test fixture exists", false)
}

const reused18038 = findByCode("18038")
t("reused item 18038 resolves the model but not an arbitrary release", reused18038?.product?.name === "Proto Emperor ZX" && reused18038.release === undefined)

const magnumSaber = PRODUCTS.find((product) => product.name === "Magnum Saber")
const magnumOriginal19401 = magnumSaber?.releases.find((release) => release.itemNumber === "19401")
if (magnumSaber && magnumOriginal19401) {
  const canonicalWith19401Reissue = PRODUCTS.map((product) =>
    product.id === magnumSaber.id
      ? {
          ...product,
          releases: [
            ...product.releases.map((release) =>
              release.id === magnumOriginal19401.id
                ? { ...release, barcodeJAN: "4950344194018" }
                : release,
            ),
            {
              ...magnumOriginal19401,
              id: "scanner-test-magnum-saber-19401-reissue-2015",
              editionName: "Magnum Saber (2015 Reissue)",
              releaseType: "Reissue",
              releaseYear: 2015,
              barcodeJAN: "4950344061310",
              isOriginal: false,
            },
          ],
        }
      : product,
  )

  const reused19401 = findByCodeInProducts(canonicalWith19401Reissue, "19401")
  t(
    "reused Magnum Saber item 19401 resolves the model but never an arbitrary Release",
    reused19401?.product?.name === "Magnum Saber" && reused19401.release === undefined,
  )

  const original19401Jan = findByCodeInProducts(canonicalWith19401Reissue, "4950344194018")
  t(
    "Magnum Saber original JAN resolves the 1994 Release",
    original19401Jan?.product?.name === "Magnum Saber" &&
      original19401Jan.release?.releaseYear === 1994 &&
      original19401Jan.release?.editionName === "Magnum Saber",
  )

  const reissue19401Jan = findByCodeInProducts(canonicalWith19401Reissue, "4950344061310")
  t(
    "Magnum Saber reissue JAN resolves the 2015 Release",
    reissue19401Jan?.product?.name === "Magnum Saber" &&
      reissue19401Jan.release?.releaseYear === 2015 &&
      reissue19401Jan.release?.editionName === "Magnum Saber (2015 Reissue)",
  )
} else {
  t("Magnum Saber scanner fixture exists", false)
}

const reissueBarcode = findByCode("4950344997107")
t("Proto Emperor ZX 2007 barcode resolves the 2007 reissue", reissueBarcode?.release?.releaseYear === 2007 && reissueBarcode.release?.itemNumber === "18038")

const premiumBarcode = findByCode("4950344953356")
t("Proto Emperor ZX Premium barcode resolves release 95335", premiumBarcode?.release?.itemNumber === "95335" && premiumBarcode.release?.releaseYear === 2017)

const mantaNumbered = [
  ["18615", "4950344186150", 2006],
  ["94593", null, 2007],
  ["94665", "4950344946655", 2008],
  ["94709", "4950344947096", 2009],
  ["95462", "4950344954629", 2019],
  ["95466", "4950344954667", 2019],
  ["95690", "4950344956906", 2025],
]

for (const [itemNumber, barcode, year] of mantaNumbered) {
  const byItem = findByCode(itemNumber)
  t(
    `Manta Ray Mk.II ${itemNumber} resolves exact release`,
    byItem?.product?.name === "Manta Ray Mk.II" &&
      byItem.release?.itemNumber === itemNumber &&
      byItem.release?.releaseYear === year,
  )

  if (barcode) {
    const byBarcode = findByCode(barcode)
    t(
      `Manta Ray Mk.II ${itemNumber} JAN resolves exact release`,
      byBarcode?.product?.name === "Manta Ray Mk.II" &&
        byBarcode.release?.itemNumber === itemNumber,
    )
  }
}

const aeroMantaNumbered = [
  ["18703", "4950344064502", 2013],
  ["94972", "4950344949724", 2013],
  ["94989", "4950344963195", 2013],
  ["94991", "4950344963218", 2013],
  ["95031", "4950344950317", 2014],
  ["95295", "4950344952953", 2017],
  ["95419", "4950344954193", 2018],
]

for (const [itemNumber, barcode, year] of aeroMantaNumbered) {
  const byItem = findByCode(itemNumber)
  t(
    `Aero Manta Ray ${itemNumber} resolves exact release`,
    byItem?.product?.name === "Aero Manta Ray" &&
      byItem.release?.itemNumber === itemNumber &&
      byItem.release?.releaseYear === year,
  )

  const byBarcode = findByCode(barcode)
  t(
    `Aero Manta Ray ${itemNumber} JAN resolves exact release`,
    byBarcode?.product?.name === "Aero Manta Ray" &&
      byBarcode.release?.itemNumber === itemNumber,
  )
}

const aeroMantaInternational = findByCode("4950344187034")
t(
  "Aero Manta Ray international GTIN derives ITEM 18703",
  aeroMantaInternational?.product?.name === "Aero Manta Ray" &&
    aeroMantaInternational.release?.itemNumber === "18703",
)


const avanteRed2009 = findByCode("94692")
t("Avante Mk.III 94692 resolves the original 2009 Red Special",
  avanteRed2009?.product?.name === "Avante Mk.III" &&
  avanteRed2009.release?.itemNumber === "94692" &&
  avanteRed2009.release?.releaseYear === 2009)

const avanteRed2018 = findByCode("95425")
t("Avante Mk.III 95425 resolves the distinct 2018 Red Special re-release",
  avanteRed2018?.product?.name === "Avante Mk.III" &&
  avanteRed2018.release?.itemNumber === "95425" &&
  avanteRed2018.release?.releaseYear === 2018)

const avanteKorea2026 = findByCode("92470")
t("Avante Mk.III 92470 resolves the Korea Mini 4WD Cup 2026 release",
  avanteKorea2026?.product?.name === "Avante Mk.III" &&
  avanteKorea2026.release?.itemNumber === "92470" &&
  avanteKorea2026.release?.releaseYear === 2026)

console.log(`${pass} passed, ${fail} failed`)
if (fail > 0) process.exit(1)
console.log("SCANNER CODE TEST PASSED")
