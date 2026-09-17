import type { MetadataRoute } from "next"

const SITE_URL = "https://trackdash.it"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/catalog/", "/market"],
      disallow: [
        "/api/",
        "/auth/",
        "/login",
        "/collection",
        "/wishlist",
        "/messages",
        "/account",
        "/dashboard",
        "/scanner",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
