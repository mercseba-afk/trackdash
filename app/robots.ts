import { isRacingStudioPreview } from "@/lib/racing-studio"
import type { MetadataRoute } from "next"

const SITE_URL = "https://trackdash.it"

export default function robots(): MetadataRoute.Robots {
  if (isRacingStudioPreview()) return { rules: { userAgent: "*", disallow: "/" } }
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/catalog", "/catalog/", "/market", "/shop", "/en/shop"],
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
