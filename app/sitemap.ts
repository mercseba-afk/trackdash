import type { MetadataRoute } from "next"
import { fetchCatalogProducts } from "@/lib/actions/catalog"
import { getPublicMarketSignalMap } from "@/lib/market/public"

const SITE_URL = "https://trackdash.it"

function latestDate(dates: Array<string | undefined | null>) {
  const valid = dates
    .filter((value): value is string => Boolean(value))
    .filter((value) => Number.isFinite(Date.parse(value)))

  if (valid.length === 0) return undefined
  return valid.sort((a, b) => Date.parse(a) - Date.parse(b)).at(-1)
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, marketSignals] = await Promise.all([
    fetchCatalogProducts().catch((error) => {
      console.error("Failed to build catalog sitemap:", error)
      return []
    }),
    getPublicMarketSignalMap().catch((error) => {
      console.error("Failed to load market freshness for sitemap:", error)
      return {}
    }),
  ])

  const releaseLastModified = (release: (typeof products)[number]["releases"][number]) =>
    latestDate([
      release.updatedAt,
      release.statusCheckedAt,
      release.catalogVisibilityUpdatedAt,
      ...release.sources.map((source) => source.checkedAt),
      marketSignals[release.id]?.computedAt,
    ])

  const productLastModified = (product: (typeof products)[number]) =>
    latestDate([
      product.updatedAt,
      ...product.releases.map((release) => releaseLastModified(release)),
    ])

  const catalogLastModified = latestDate(products.map((product) => productLastModified(product)))
  const marketLastModified = latestDate(Object.values(marketSignals).map((signal) => signal.computedAt))

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    {
      url: `${SITE_URL}/catalog`,
      ...(catalogLastModified ? { lastModified: catalogLastModified } : {}),
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${SITE_URL}/market`,
      ...(marketLastModified ? { lastModified: marketLastModified } : {}),
      changeFrequency: "weekly",
      priority: 0.75,
    },
  ]

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => {
    const lastModified = productLastModified(product)
    return {
      url: `${SITE_URL}/catalog/${product.id}`,
      ...(lastModified ? { lastModified } : {}),
      changeFrequency: "weekly",
      priority: 0.8,
    }
  })

  const releaseRoutes: MetadataRoute.Sitemap = products.flatMap((product) =>
    product.releases.map((release) => {
      const lastModified = releaseLastModified(release)
      return {
        url: `${SITE_URL}/catalog/${product.id}/releases/${release.id}`,
        ...(lastModified ? { lastModified } : {}),
        changeFrequency: "weekly" as const,
        priority: 0.9,
      }
    }),
  )

  return [...staticRoutes, ...productRoutes, ...releaseRoutes]
}
