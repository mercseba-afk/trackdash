import type { MetadataRoute } from "next"
import { fetchCatalogProducts } from "@/lib/actions/catalog"

const SITE_URL = "https://trackdash.it"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/catalog`, lastModified: now, changeFrequency: "daily", priority: 0.95 },
    { url: `${SITE_URL}/price-intelligence`, lastModified: now, changeFrequency: "weekly", priority: 0.75 },
  ]

  const products = await fetchCatalogProducts().catch((error) => {
    console.error("Failed to build catalog sitemap:", error)
    return []
  })

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${SITE_URL}/catalog/${product.id}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }))

  const releaseRoutes: MetadataRoute.Sitemap = products.flatMap((product) =>
    product.releases.map((release) => ({
      url: `${SITE_URL}/catalog/${product.id}/releases/${release.id}`,
      lastModified: release.statusCheckedAt ? new Date(release.statusCheckedAt) : now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
  )

  return [...staticRoutes, ...productRoutes, ...releaseRoutes]
}
