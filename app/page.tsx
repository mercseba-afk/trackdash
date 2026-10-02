import type { Metadata } from "next"
import { cookies } from "next/headers"
import { PwaRootLaunchRedirect } from "@/components/pwa-root-launch-redirect"
import { PublicShell } from "@/components/public-shell"
import { PublicHomeScreen } from "@/components/screens/public-home-screen"
import { fetchCatalogProducts } from "@/lib/actions/catalog"
import type { Product } from "@/lib/types"
import { publicAbsoluteUrl, publicLanguageAlternates, type PublicLocale } from "@/lib/seo/catalog-paths"

export const revalidate = 45

async function requestLocale(): Promise<PublicLocale> {
  const cookieStore = await cookies()
  return cookieStore.get("trackdash.locale")?.value === "en" ? "en" : "it"
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await requestLocale()
  const it = locale === "it"
  const title = it
    ? "TrackDash — Collezione Tamiya Mini 4WD, valori di mercato e scambi"
    : "TrackDash — Tamiya Mini 4WD Collection, Market Value & Trading"
  const description = it
    ? "Identifica le Release Tamiya Mini 4WD esatte, scopri il valore di mercato, costruisci la tua collezione e segui annunci e vendite tra collezionisti."
    : "Identify exact Tamiya Mini 4WD Releases, discover market value, build your collection, watch the market and buy or sell with other collectors on TrackDash."
  const canonical = publicAbsoluteUrl("/", locale)

  return {
    title,
    description,
    alternates: { canonical, languages: publicLanguageAlternates("/") },
    openGraph: { type: "website", url: canonical, siteName: "TrackDash", title, description },
    twitter: { card: "summary_large_image", title, description },
  }
}

export default async function Page() {
  let products: Product[] = []

  try {
    products = await fetchCatalogProducts()
  } catch (error) {
    console.error("Failed to load catalog data for public home:", error)
  }

  return (
    <PublicShell>
      <PwaRootLaunchRedirect />
      <PublicHomeScreen products={products} />
    </PublicShell>
  )
}
