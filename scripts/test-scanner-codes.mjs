#!/usr/bin/env node
import { register } from "node:module"

register("./ts-extension-loader.mjs", import.meta.url)

const { findByCode, tamiyaItemNumberFromJan } = await import("../lib/data/corrected-products.ts")

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

const reused18038 = findByCode("18038")
t("reused item 18038 resolves the model but not an arbitrary release", reused18038?.product?.name === "Proto Emperor ZX" && reused18038.release === undefined)

const reissueBarcode = findByCode("4950344997107")
t("Proto Emperor ZX 2007 barcode resolves the 2007 reissue", reissueBarcode?.release?.releaseYear === 2007 && reissueBarcode.release?.itemNumber === "18038")

const premiumBarcode = findByCode("4950344953356")
t("Proto Emperor ZX Premium barcode resolves release 95335", premiumBarcode?.release?.itemNumber === "95335" && premiumBarcode.release?.releaseYear === 2017)

console.log(`${pass} passed, ${fail} failed`)
if (fail > 0) process.exit(1)
console.log("SCANNER CODE TEST PASSED")
