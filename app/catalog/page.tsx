import type { Metadata } from "next"
import { cookies } from "next/headers"
import { PublicShell } from "@/components/public-shell"
import { CatalogAreaNav } from "@/components/catalog-area-nav"
import { CatalogScreen } from "@/components/screens/catalog-screen"
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
    ? "Catalogo Tamiya Mini 4WD — Modelli e Release | TrackDash"
    : "Tamiya Mini 4WD Catalog — Models & Releases | TrackDash"
  const description = it
    ? "Esplora modelli Tamiya Mini 4WD e Release esatte per Item Number, anno, chassis ed edizione, con valori di mercato quando disponibili."
    : "Explore Tamiya Mini 4WD models and exact Releases by Item Number, year, chassis and edition, with market values where data is available."
  const canonical = publicAbsoluteUrl("/catalog", locale)

  return {
    title,
    description,
    alternates: { canonical, languages: publicLanguageAlternates("/catalog") },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
    },
    openGraph: { type: "website", url: canonical, siteName: "TrackDash", title, description },
    twitter: { card: "summary_large_image", title, description },
  }
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
