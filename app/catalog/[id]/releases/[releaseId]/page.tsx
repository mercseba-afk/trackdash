import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { cache } from "react"
import { PublicShell } from "@/components/public-shell"
import { ReleaseFamilyLinks } from "@/components/release-family-links"
import { ReleaseDetailScreen } from "@/components/screens/release-detail-screen"
import { fetchCatalogProductById } from "@/lib/actions/catalog"
import { getCatalogLocalizedCopy } from "@/lib/db/queries/catalog-copy"
import { getPublicOpenOffersForRelease } from "@/lib/db/queries/public-sharing"
import { getPublicMarketSignalForRelease } from "@/lib/market/public"
import type { Product, ProductRelease } from "@/lib/types"

export const revalidate = 45

const SITE_URL = "https://trackdash.it"
const getProduct = cache(fetchCatalogProductById)

type ReleasePageParams = Promise<{ id: string; releaseId: string }>

function releaseIdentity(product: Product, release: ProductRelease) {
  const editionIncludesProduct = release.editionName.toLowerCase().includes(product.name.toLowerCase())
  const edition = editionIncludesProduct ? release.editionName : `${product.name} — ${release.editionName}`
  const yearText = release.releaseYear ? String(release.releaseYear) : null
  const editionIncludesYear = yearText ? edition.includes(yearText) : false
  const itemNumber = release.itemNumber ? ` ${release.itemNumber}` : ""
  const year = yearText && !editionIncludesYear ? ` ${yearText}` : ""

  return `Tamiya${itemNumber} ${edition}${year}`.replace(/\s+/g, " ").trim()
}

function releaseDescription(product: Product, release: ProductRelease) {
  const details = [
    release.releaseYear ? String(release.releaseYear) : null,
    release.chassis ? `${release.chassis} chassis` : null,
    release.releaseType,
  ].filter(Boolean)

  const detailText = details.length > 0 ? ` ${details.join(" · ")}.` : ""
  return `${releaseIdentity(product, release)} — exact Tamiya Mini 4WD release.${detailText} Market Value, sold and asking signals, collector availability and release details on TrackDash.`
}

function absoluteImage(url?: string) {
  if (!url) return undefined
  try {
    return new URL(url, SITE_URL).toString()
  } catch {
    return undefined
  }
}

export async function generateMetadata({ params }: { params: ReleasePageParams }): Promise<Metadata> {
  const { id, releaseId } = await params
  const product = await getProduct(id).catch(() => null)
  const release = product?.releases.find((candidate) => candidate.id === releaseId)

  if (!product || !release) {
    return {
      title: "Release not found | TrackDash",
      robots: { index: false, follow: false },
    }
  }

  const canonicalPath = `/catalog/${product.id}/releases/${release.id}`
  const canonicalUrl = `${SITE_URL}${canonicalPath}`
  const title = `${releaseIdentity(product, release)} | Mini 4WD Release | TrackDash`
  const description = releaseDescription(product, release)
  const image = absoluteImage(release.images?.[0] ?? product.images?.[0])

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
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
      images: image ? [{ url: image, alt: `${release.editionName} — Tamiya Mini 4WD` }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  }
}

export default async function ReleasePage({ params }: { params: ReleasePageParams }) {
  const { id, releaseId } = await params

  const [product, marketSignal, localizedCopy, collectorOffers] = await Promise.all([
    getProduct(id).catch((error) => {
      console.error("Failed to load product for release detail:", error)
      return null
    }),
    getPublicMarketSignalForRelease(releaseId).catch((error) => {
      console.error("Failed to load R3 market signal for release detail:", error)
      return null
    }),
    getCatalogLocalizedCopy(id).catch((error) => {
      console.error("Failed to load localized release copy:", error)
      return null
    }),
    getPublicOpenOffersForRelease(releaseId).catch((error) => {
      console.error("Failed to load public collector offers for release detail:", error)
      return []
    }),
  ])

  if (!product) return notFound()

  const release = product.releases.find((candidate) => candidate.id === releaseId)
  if (!release) return notFound()

  const siblingReleases = product.releases
    .filter((candidate) => candidate.id !== release.id)
    .sort((a, b) => (a.releaseYear ?? Number.MAX_SAFE_INTEGER) - (b.releaseYear ?? Number.MAX_SAFE_INTEGER))

  const canonicalUrl = `${SITE_URL}/catalog/${product.id}/releases/${release.id}`
  const image = absoluteImage(release.images?.[0] ?? product.images?.[0])
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "@id": `${canonicalUrl}#product`,
        name: release.editionName,
        description: releaseDescription(product, release),
        url: canonicalUrl,
        ...(image ? { image: [image] } : {}),
        brand: { "@type": "Brand", name: "Tamiya" },
        category: "Tamiya Mini 4WD",
        ...(release.itemNumber ? { sku: release.itemNumber, mpn: release.itemNumber } : {}),
        model: product.name,
        additionalProperty: [
          ...(release.releaseYear ? [{ "@type": "PropertyValue", name: "Release year", value: String(release.releaseYear) }] : []),
          ...(release.chassis ? [{ "@type": "PropertyValue", name: "Chassis", value: release.chassis }] : []),
          { "@type": "PropertyValue", name: "Release type", value: release.releaseType },
          { "@type": "PropertyValue", name: "Edition", value: release.editionName },
        ],
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${canonicalUrl}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "TrackDash", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Catalog", item: `${SITE_URL}/catalog` },
          { "@type": "ListItem", position: 3, name: product.name, item: `${SITE_URL}/catalog/${product.id}` },
          { "@type": "ListItem", position: 4, name: release.editionName, item: canonicalUrl },
        ],
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
        <ReleaseDetailScreen
          product={product}
          release={release}
          localizedDescription={localizedCopy?.releases[releaseId]}
          marketSignal={marketSignal}
          collectorOffers={collectorOffers}
        />
        <ReleaseFamilyLinks
          productId={product.id}
          productName={product.name}
          releases={siblingReleases}
        />
      </div>
    </PublicShell>
  )
}
