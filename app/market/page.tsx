import type { Metadata } from "next"
import { PublicShell } from "@/components/public-shell"
import { CatalogAreaNav } from "@/components/catalog-area-nav"
import { MarketScreen } from "@/components/screens/market-screen"
import { fetchCatalogProducts } from "@/lib/actions/catalog"
import type { Product } from "@/lib/types"

const title = "Tamiya Mini 4WD Price Intelligence & Market Value | TrackDash"
const description = "Explore estimated values for exact Tamiya Mini 4WD Releases, with completed sales, store prices and active ASK explained clearly by TrackDash."

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "https://trackdash.it/market" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  openGraph: {
    title,
    description,
    url: "https://trackdash.it/market",
    siteName: "TrackDash",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
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
