import type { Metadata } from "next"
import { notFound, permanentRedirect } from "next/navigation"
import { cookies } from "next/headers"
import { cache } from "react"
import { PublicShell } from "@/components/public-shell"
import { ProductDetailScreen } from "@/components/screens/product-detail-screen"
import { CatalogComingSoonScreen } from "@/components/screens/catalog-coming-soon-screen"
import { fetchCatalogProductByRouteKey, fetchCatalogProducts } from "@/lib/actions/catalog"
import { getRelatedProducts } from "@/lib/data/products"
import { getCatalogLocalizedCopy } from "@/lib/db/queries/catalog-copy"
import { productPublicPath, publicLanguageAlternates, releasePublicPath, type PublicLocale } from "@/lib/seo/catalog-paths"

export const revalidate = 45

const SITE_URL = "https://trackdash.it"
const getProduct = cache(fetchCatalogProductByRouteKey)
type ProductPageParams = Promise<{ id: string }>

async function requestLocale(): Promise<PublicLocale> {
  const cookieStore = await cookies()
  return cookieStore.get("trackdash.locale")?.value === "en" ? "en" : "it"
}

function absoluteImage(url?: string) {
  if (!url) return undefined
  try {
    return new URL(url, SITE_URL).toString()
  } catch {
    return undefined
  }
}

export async function generateMetadata({ params }: { params: ProductPageParams }): Promise<Metadata> {
  const { id } = await params
  const locale = await requestLocale()
  const it = locale === "it"
  const product = await getProduct(id).catch(() => null)

  if (!product) {
    return {
      title: it ? "Modello non trovato | TrackDash" : "Model not found | TrackDash",
      robots: { index: false, follow: false },
    }
  }

  const canonicalPath = productPublicPath(product, locale)
  const canonicalUrl = `${SITE_URL}${canonicalPath}`
  const basePath = productPublicPath(product, "it")

  if (product.catalogLaunchStatus === "coming_soon") {
    return {
      title: it
        ? `Tamiya ${product.name} Mini 4WD — In arrivo | TrackDash`
        : `Tamiya ${product.name} Mini 4WD — Coming Soon | TrackDash`,
      description: it
        ? `${product.name} è in fase di verifica per il catalogo Mini 4WD TrackDash. Release, immagini e dati di mercato saranno pubblicati appena verificati.`
        : `${product.name} is being verified for the TrackDash Mini 4WD catalog. Releases, images and market data are coming soon.`,
      alternates: { canonical: canonicalUrl, languages: publicLanguageAlternates(basePath) },
      robots: { index: false, follow: true },
    }
  }

  const title = it
    ? `Tamiya ${product.name} Mini 4WD — Release, varianti e valore di mercato | TrackDash`
    : `Tamiya ${product.name} Mini 4WD — Releases, Variants & Market Value | TrackDash`
  const description = it
    ? `Esplora le Release e varianti Tamiya ${product.name} Mini 4WD verificate per Item Number, anno, chassis ed edizione, con Market Value, vendite concluse e ASK quando disponibili.`
    : `Explore verified Tamiya ${product.name} Mini 4WD releases and variants by Item Number, year, chassis and edition, with Market Value, sold and asking data where available.`
  const image = absoluteImage(product.images?.[0])

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl, languages: publicLanguageAlternates(basePath) },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type: "website",
      url: canonicalUrl,
      siteName: "TrackDash",
      title,
      description,
      images: image ? [{ url: image, alt: `${product.name} — Tamiya Mini 4WD` }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  }
}

export default async function ProductPage({ params }: { params: ProductPageParams }) {
  const { id } = await params
  const locale = await requestLocale()
  const it = locale === "it"
  const product = await getProduct(id).catch((error) => {
    console.error("Failed to load product from the database:", error)
    return null
  })
  if (!product) return notFound()

  const canonicalPath = productPublicPath(product, locale)
  const requestedPath = locale === "en" ? `/en/catalog/${id}` : `/catalog/${id}`
  if (requestedPath !== canonicalPath) permanentRedirect(canonicalPath)

  const localizedCopy = await getCatalogLocalizedCopy(product.id).catch((error) => {
    console.error("Failed to load localized catalog copy:", error)
    return null
  })

  if (product.catalogLaunchStatus === "coming_soon") {
    return (
      <PublicShell>
        <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 lg:px-8">
          <CatalogComingSoonScreen product={product} />
        </div>
      </PublicShell>
    )
  }

  const allProducts = await fetchCatalogProducts().catch((error) => {
    console.error("Failed to load catalog for related products:", error)
    return []
  })
  const related = getRelatedProducts(product, 4, allProducts)
  const canonicalUrl = `${SITE_URL}${canonicalPath}`
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${canonicalUrl}#webpage`,
        url: canonicalUrl,
        name: `Tamiya ${product.name} Mini 4WD`,
        description: it
          ? `Pagina del modello Tamiya ${product.name} Mini 4WD con Release verificate, Item Number, anni, chassis, varianti e dati di mercato.`
          : `Tamiya ${product.name} Mini 4WD model page with verified Releases, Item Numbers, years, chassis, variants and market data.`,
        about: {
          "@type": "Thing",
          name: `Tamiya ${product.name} Mini 4WD`,
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${canonicalUrl}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "TrackDash", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: it ? "Catalogo" : "Catalog", item: `${SITE_URL}${locale === "en" ? "/en/catalog" : "/catalog"}` },
          { "@type": "ListItem", position: 3, name: product.name, item: canonicalUrl },
        ],
      },
      {
        "@type": "ItemList",
        "@id": `${canonicalUrl}#releases`,
        name: `${product.name} Mini 4WD releases`,
        numberOfItems: product.releases.length,
        itemListElement: product.releases.map((release, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: release.editionName,
          url: `${SITE_URL}${releasePublicPath(product, release, locale)}`,
        })),
      },
    ],
  }

  return (
    <PublicShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
      <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <ProductDetailScreen
          product={product}
          related={related}
          descriptionIt={localizedCopy?.productDescriptionIt}
        />
      </div>
    </PublicShell>
  )
}
