import type { MetadataRoute } from "next"
import { fetchCatalogProducts } from "@/lib/actions/catalog"
import { listMarketSignals } from "@/lib/db/queries/market"
import { productPublicPath, releasePublicPath, type PublicLocale } from "@/lib/seo/catalog-paths"

const SITE_URL = "https://trackdash.it"
const PUBLIC_LOCALES: PublicLocale[] = ["it", "en"]

function latestDate(dates: Array<string | undefined | null>) {
  const valid = dates
    .filter((value): value is string => Boolean(value))
    .filter((value) => Number.isFinite(Date.parse(value)))

  if (valid.length === 0) return undefined
  return valid.sort((a, b) => Date.parse(a) - Date.parse(b)).at(-1)
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, marketSignalRows] = await Promise.all([
    fetchCatalogProducts().catch((error) => {
      console.error("Failed to build catalog sitemap:", error)
      return []
    }),
    listMarketSignals().catch((error) => {
      console.error("Failed to load market freshness for sitemap:", error)
      return []
    }),
  ])

  const marketComputedAtByRelease = new Map(
    marketSignalRows.map((signal) => [
      signal.releaseId,
      signal.computedAt instanceof Date ? signal.computedAt.toISOString() : String(signal.computedAt),
    ]),
  )

  const releaseLastModified = (release: (typeof products)[number]["releases"][number]) =>
    latestDate([
      release.updatedAt,
      release.statusCheckedAt,
      release.catalogVisibilityUpdatedAt,
      ...release.sources.map((source) => source.checkedAt),
      marketComputedAtByRelease.get(release.id),
    ])

  const productLastModified = (product: (typeof products)[number]) =>
    latestDate([
      product.updatedAt,
      ...product.releases.map((release) => releaseLastModified(release)),
    ])

  const catalogLastModified = latestDate(products.map((product) => productLastModified(product)))
  const marketLastModified = latestDate([...marketComputedAtByRelease.values()])

  const staticRoutes: MetadataRoute.Sitemap = PUBLIC_LOCALES.flatMap((locale) => [
    { url: `${SITE_URL}${locale === "en" ? "/en" : ""}`, changeFrequency: "weekly" as const, priority: 1 },
    {
      url: `${SITE_URL}${locale === "en" ? "/en/catalog" : "/catalog"}`,
      ...(catalogLastModified ? { lastModified: catalogLastModified } : {}),
      changeFrequency: "daily" as const,
      priority: 0.95,
    },
    {
      url: `${SITE_URL}${locale === "en" ? "/en/market" : "/market"}`,
      ...(marketLastModified ? { lastModified: marketLastModified } : {}),
      changeFrequency: "weekly" as const,
      priority: 0.75,
    },
  ])

  const availableProducts = products.filter((product) => product.catalogLaunchStatus !== "coming_soon")

  const productRoutes: MetadataRoute.Sitemap = availableProducts.flatMap((product) => {
    const lastModified = productLastModified(product)
    return PUBLIC_LOCALES.map((locale) => ({
      url: `${SITE_URL}${productPublicPath(product, locale)}`,
      ...(lastModified ? { lastModified } : {}),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }))
  })

  const releaseRoutes: MetadataRoute.Sitemap = availableProducts.flatMap((product) =>
    product.releases.flatMap((release) => {
      const lastModified = releaseLastModified(release)
      return PUBLIC_LOCALES.map((locale) => ({
        url: `${SITE_URL}${releasePublicPath(product, release, locale)}`,
        ...(lastModified ? { lastModified } : {}),
        changeFrequency: "weekly" as const,
        priority: 0.9,
      }))
    }),
  )

  return [...staticRoutes, ...productRoutes, ...releaseRoutes]
}
