import type { MetadataRoute } from "next"

const SITE_URL = "https://trackdash.it"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/catalog", "/catalog/", "/market"],
      disallow: [
        "/api/",
        "/auth/",
        "/login",
        "/signup",
        "/forgot-password",
        "/update-password",
        "/onboarding",
        "/collection",
        "/wishlist",
        "/messages",
        "/account",
        "/profile",
        "/settings",
        "/support",
        "/dashboard",
        "/scanner",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
