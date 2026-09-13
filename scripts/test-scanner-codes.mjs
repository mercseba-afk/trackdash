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
t("spaces and hyphens are normalized", tamiyaItemNumberFromJan("4950-3449 54674") === "95467")
t("invalid checksum fails closed", tamiyaItemNumberFromJan("4950344954675") === undefined)
t("unrelated EAN fails closed", tamiyaItemNumberFromJan("4006381333931") === undefined)

const direct = findByCode("95467")
t("direct item number resolves exact release", direct?.release?.itemNumber === "95467")

const jan = findByCode("4950344954674")
t("Tamiya JAN resolves the same exact release", jan?.release?.itemNumber === "95467")

console.log(`${pass} passed, ${fail} failed`)
if (fail > 0) process.exit(1)
console.log("SCANNER CODE TEST PASSED")
