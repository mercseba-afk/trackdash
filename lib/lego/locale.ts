import { legoConditions, type LegoCondition } from "./personal-list-types"
import type { PublicLocale } from "@/lib/seo/catalog-paths"
import { legoStatusDescriptions, legoStatusLabels, type LegoStatus } from "./catalog"

const statusLabelsEn: Record<LegoStatus, string> = {
  available: "In the LEGO catalogue",
  retiring_soon: "Retiring soon",
  retired: "Retired by LEGO",
  unknown: "Status unverified",
}

const statusDescriptionsEn: Record<LegoStatus, string> = {
  available: "This set was in the official LEGO catalogue when we last checked.",
  retiring_soon: "LEGO has marked this set as retiring soon. The exact date may be unknown.",
  retired: "LEGO has retired this set. Shops and collectors may still have it.",
  unknown: "The status in the official LEGO catalogue still needs verification.",
}

export function localizedLegoStatusLabels(locale: PublicLocale) {
  return locale === "it" ? legoStatusLabels : statusLabelsEn
}

export function localizedLegoStatusDescriptions(locale: PublicLocale) {
  return locale === "it" ? legoStatusDescriptions : statusDescriptionsEn
}

export function localizedLegoCondition(condition: string | null, locale: PublicLocale) {
  if (locale === "it" || condition === null) return condition
  return condition === "Sigillato" ? "Sealed" : "Listed as new"
}

const conditionsEn = {
  sealed: "Sealed",
  opened_complete: "Opened, complete",
  incomplete: "Incomplete",
} satisfies Record<LegoCondition, string>

export function localizedLegoListConditions(locale: PublicLocale) {
  return locale === "it" ? legoConditions : conditionsEn
}
