import type { Metadata } from "next"
import { cookies } from "next/headers"
import { PublicShell } from "@/components/public-shell"
import { CatalogAreaNav } from "@/components/catalog-area-nav"
import { MarketScreen } from "@/components/screens/market-screen"
import { fetchCatalogProducts } from "@/lib/actions/catalog"
import type { Product } from "@/lib/types"
import { publicAbsoluteUrl, publicLanguageAlternates, type PublicLocale } from "@/lib/seo/catalog-paths"

async function requestLocale(): Promise<PublicLocale> {
  const cookieStore = await cookies()
  return cookieStore.get("trackdash.locale")?.value === "en" ? "en" : "it"
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await requestLocale()
  const it = locale === "it"
  const title = it
    ? "Valori di mercato Tamiya Mini 4WD e Price Intelligence | TrackDash"
    : "Tamiya Mini 4WD Price Intelligence & Market Value | TrackDash"
  const description = it
    ? "Esplora valori stimati per singola Release Tamiya Mini 4WD, con vendite concluse, prezzi negozio e ASK spiegati chiaramente da TrackDash."
    : "Explore estimated values for exact Tamiya Mini 4WD Releases, with completed sales, store prices and active ASK explained clearly by TrackDash."
  const canonical = publicAbsoluteUrl("/market", locale)

  return {
    title,
    description,
    alternates: { canonical, languages: publicLanguageAlternates("/market") },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
    },
    openGraph: { title, description, url: canonical, siteName: "TrackDash", type: "website" },
    twitter: { card: "summary_large_image", title, description },
  }
}

export default async function MarketPage() {
  let products: Product[] = []
  try {
    products = await fetchCatalogProducts()
  } catch (error) {
    console.error("Failed to load canonical catalog for market page:", error)
  }

  return (
    <PublicShell>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-8 md:px-6 lg:px-8">
        <CatalogAreaNav />
        <MarketScreen products={products} />
      </div>
    </PublicShell>
  )
}
