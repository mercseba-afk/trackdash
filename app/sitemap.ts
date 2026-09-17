import type { MetadataRoute } from "next"
import { fetchCatalogProducts } from "@/lib/actions/catalog"

const SITE_URL = "https://trackdash.it"

function latestVerifiedDate(dates: Array<string | undefined>) {
  const valid = dates.filter((value): value is string => Boolean(value))
  if (valid.length === 0) return undefined
  return valid.sort().at(-1)
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/catalog`, changeFrequency: "daily", priority: 0.95 },
    { url: `${SITE_URL}/market`, changeFrequency: "weekly", priority: 0.75 },
  ]

  const products = await fetchCatalogProducts().catch((error) => {
    console.error("Failed to build catalog sitemap:", error)
    return []
  })

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => {
    const lastModified = latestVerifiedDate(product.releases.map((release) => release.statusCheckedAt))
    return {
      url: `${SITE_URL}/catalog/${product.id}`,
      ...(lastModified ? { lastModified } : {}),
      changeFrequency: "weekly",
      priority: 0.8,
    }
  })

  const releaseRoutes: MetadataRoute.Sitemap = products.flatMap((product) =>
    product.releases.map((release) => ({
      url: `${SITE_URL}/catalog/${product.id}/releases/${release.id}`,
      ...(release.statusCheckedAt ? { lastModified: release.statusCheckedAt } : {}),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
  )

  return [...staticRoutes, ...productRoutes, ...releaseRoutes]
}
