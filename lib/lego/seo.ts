import { racingStudioIsLive } from "@/lib/racing-studio"
import type { Metadata, MetadataRoute } from "next"
import { speedChampionsCatalogIsPublic } from "./catalog-visibility"
import { publicAbsoluteUrl, publicLanguageAlternates, type PublicLocale } from "@/lib/seo/catalog-paths"
import { setImagePath, speedChampionsCatalogPath, speedChampionsPath, speedChampionsSetName, speedChampionsSets } from "./catalog"

export function speedChampionsMetadata(locale: PublicLocale, setNumber?: string): Metadata {
  const set = speedChampionsSets.find((entry) => entry.setNumber === setNumber)
  if (setNumber && !set) return {}

  const path = set ? speedChampionsPath(set.setNumber) : speedChampionsCatalogPath
  const setName = set ? speedChampionsSetName(set, locale) : undefined
  const title = set ? `${setName} ${set.setNumber} · LEGO Speed Champions` : "LEGO Speed Champions"
  const description = set
    ? locale === "it"
      ? `LEGO Speed Champions ${set.setNumber} ${setName}, ${set.pieces} pezzi, uscito nel ${set.year}. Foto, stato nel catalogo LEGO e dati di mercato su TrackDash.`
      : `LEGO Speed Champions ${set.setNumber} ${setName}, a ${set.pieces}-piece set released in ${set.year}. See photos, LEGO catalogue status and market data on TrackDash.`
    : locale === "it"
      ? "Esplora il catalogo LEGO Speed Champions per codice, marchio e anno. Scopri foto, stato ufficiale e prezzi negli annunci."
      : "Browse the LEGO Speed Champions catalogue by set number, car brand and year. See photos, official LEGO status and asking prices."
  const canonical = publicAbsoluteUrl(path, locale)

  return {
    title: `${title} | TrackDash`,
    description,
    alternates: { canonical, languages: publicLanguageAlternates(path) },
    robots: { index: speedChampionsCatalogIsPublic, follow: speedChampionsCatalogIsPublic },
    openGraph: {
      title, description, url: canonical, locale: locale === "it" ? "it_IT" : "en_GB",
      ...(set ? { images: [{ url: publicAbsoluteUrl(setImagePath(set.setNumber, "box"), "it"), alt: setName }] } : {}),
    },
  }
}

export function speedChampionsSitemap(): MetadataRoute.Sitemap {
  if (!speedChampionsCatalogIsPublic) return []
  const paths = [speedChampionsCatalogPath, ...(racingStudioIsLive ? ["/speed-champions/market"] : []), ...speedChampionsSets.map((set) => speedChampionsPath(set.setNumber))]
  return paths.flatMap((path) =>
    (["it", "en"] as const).map((locale) => ({
      url: publicAbsoluteUrl(path, locale),
      alternates: { languages: publicLanguageAlternates(path) },
    })),
  )
}
