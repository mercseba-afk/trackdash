import type { PublicLocale } from "@/lib/seo/catalog-paths"

export function formatLegoPrice(cents: number, locale: PublicLocale = "it") {
  return new Intl.NumberFormat(locale === "it" ? "it-IT" : "en-IE", { style: "currency", currency: "EUR" }).format(cents / 100)
}
