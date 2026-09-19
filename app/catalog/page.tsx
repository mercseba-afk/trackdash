import type { Metadata } from "next"
import { PublicShell } from "@/components/public-shell"
import { CatalogAreaNav } from "@/components/catalog-area-nav"
import { CatalogScreen } from "@/components/screens/catalog-screen"
import { fetchCatalogProducts } from "@/lib/actions/catalog"
import type { Product } from "@/lib/types"

export const revalidate = 45

const title = "Tamiya Mini 4WD Catalog — Models & Releases | TrackDash"
const description = "Explore Tamiya Mini 4WD models and exact Releases by Item Number, year, chassis and edition, with market values where data is available."

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "https://trackdash.it/catalog" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  openGraph: {
    type: "website",
    url: "https://trackdash.it/catalog",
    siteName: "TrackDash",
    title,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>
}) {
  const params = await searchParams
  const initialQuery = Array.isArray(params.q) ? params.q[0] ?? "" : params.q ?? ""
  let products: Product[] = []

  try {
    products = await fetchCatalogProducts()
  } catch (error) {
    console.error("Failed to load catalog data from the database:", error)
  }

  return (
    <PublicShell>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-8 md:px-6 lg:px-8">
        <CatalogAreaNav />
        <CatalogScreen products={products} initialQuery={initialQuery} />
      </div>
    </PublicShell>
  )
}
