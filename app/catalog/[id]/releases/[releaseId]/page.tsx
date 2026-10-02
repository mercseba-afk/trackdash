import type { Metadata } from "next"
import { notFound, permanentRedirect } from "next/navigation"
import { cookies } from "next/headers"
import { cache } from "react"
import { PublicShell } from "@/components/public-shell"
import { ReleaseFamilyLinks } from "@/components/release-family-links"
import { ReleaseDetailScreen } from "@/components/screens/release-detail-screen"
import { CatalogComingSoonScreen } from "@/components/screens/catalog-coming-soon-screen"
import { fetchCatalogProductByRouteKey } from "@/lib/actions/catalog"
import { getCatalogLocalizedCopy } from "@/lib/db/queries/catalog-copy"
import { getPublicOpenOffersForRelease } from "@/lib/db/queries/public-sharing"
import { resolveReleaseImageUrl } from "@/lib/images/resolve"
import {
  productPublicPath,
  publicLanguageAlternates,
  releasePublicPath,
  releasePublicSlug,
  type PublicLocale,
} from "@/lib/seo/catalog-paths"
import type { Product, ProductRelease } from "@/lib/types"

export const revalidate = 45

const SITE_URL = "https://trackdash.it"
const getProduct = cache(fetchCatalogProductByRouteKey)

type ReleasePageParams = Promise<{ id: string; releaseId: string }>

async function requestLocale(): Promise<PublicLocale> {
  const cookieStore = await cookies()
  return cookieStore.get("trackdash.locale")?.value === "en" ? "en" : "it"
}

function releaseIdentity(product: Product, release: ProductRelease) {
  const editionIncludesProduct = release.editionName.toLowerCase().includes(product.name.toLowerCase())
  const edition = editionIncludesProduct ? release.editionName : `${product.name} — ${release.editionName}`
  const yearText = release.releaseYear ? String(release.releaseYear) : null
  const editionIncludesYear = yearText ? edition.includes(yearText) : false
  const itemNumber = release.itemNumber ? ` ${release.itemNumber}` : ""
  const year = yearText && !editionIncludesYear ? ` ${yearText}` : ""

  return `Tamiya${itemNumber} ${edition}${year}`.replace(/\s+/g, " ").trim()
}

function releaseDescription(product: Product, release: ProductRelease, locale: PublicLocale) {
  const details = [
    release.releaseYear ? String(release.releaseYear) : null,
    release.chassis ? `${release.chassis} chassis` : null,
    release.releaseType,
  ].filter(Boolean)

  const detailText = details.length > 0 ? ` ${details.join(" · ")}.` : ""
  return locale === "it"
    ? `${releaseIdentity(product, release)} — Release Tamiya Mini 4WD esatta.${detailText} Market Value, vendite concluse, ASK attivi, disponibilità tra collezionisti e dettagli della Release su TrackDash.`
    : `${releaseIdentity(product, release)} — exact Tamiya Mini 4WD release.${detailText} Market Value, completed sales, active asking prices, collector availability and release details on TrackDash.`
}

function absoluteImage(url?: string) {
  if (!url) return undefined
  try {
    return new URL(url, SITE_URL).toString()
  } catch {
    return undefined
  }
}

function resolveRelease(product: Product, routeKey: string) {
  return product.releases.find((candidate) =>
    candidate.id === routeKey || releasePublicSlug(candidate) === routeKey,
  )
}

export async function generateMetadata({ params }: { params: ReleasePageParams }): Promise<Metadata> {
  const { id, releaseId } = await params
  const locale = await requestLocale()
  const it = locale === "it"
  const product = await getProduct(id).catch(() => null)

  if (!product) {
    return {
      title: it ? "Release non trovata | TrackDash" : "Release not found | TrackDash",
      robots: { index: false, follow: false },
    }
  }

  if (product.catalogLaunchStatus === "coming_soon") {
    return {
      title: it
        ? `Tamiya ${product.name} Mini 4WD — In arrivo | TrackDash`
        : `Tamiya ${product.name} Mini 4WD — Coming Soon | TrackDash`,
      description: it
        ? `${product.name} è in fase di verifica per il catalogo TrackDash. I dettagli delle Release saranno pubblicati appena verificati.`
        : `${product.name} is being verified for the TrackDash catalog. Exact release details are coming soon.`,
      alternates: {
        canonical: `${SITE_URL}${productPublicPath(product, locale)}`,
        languages: publicLanguageAlternates(productPublicPath(product, "it")),
      },
      robots: { index: false, follow: true },
    }
  }

  const release = resolveRelease(product, releaseId)
  if (!release) {
    return {
      title: it ? "Release non trovata | TrackDash" : "Release not found | TrackDash",
      robots: { index: false, follow: false },
    }
  }

  const canonicalPath = releasePublicPath(product, release, locale)
  const canonicalUrl = `${SITE_URL}${canonicalPath}`
  const basePath = releasePublicPath(product, release, "it")
  const title = it
    ? `${releaseIdentity(product, release)} | Release Mini 4WD | TrackDash`
    : `${releaseIdentity(product, release)} | Mini 4WD Release | TrackDash`
  const description = releaseDescription(product, release, locale)
  const image = absoluteImage(resolveReleaseImageUrl(release, product) ?? undefined)

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
  const locale = await requestLocale()
  const it = locale === "it"

  const product = await getProduct(id).catch((error) => {
    console.error("Failed to load product for release detail:", error)
    return null
  })
  if (!product) return notFound()

  if (product.catalogLaunchStatus === "coming_soon") {
    const canonicalFamilyPath = productPublicPath(product, locale)
    const requestedFamilyPath = locale === "en" ? `/en/catalog/${id}` : `/catalog/${id}`
    if (requestedFamilyPath !== canonicalFamilyPath) permanentRedirect(canonicalFamilyPath)

    return (
      <PublicShell>
        <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 lg:px-8">
          <CatalogComingSoonScreen product={product} />
        </div>
      </PublicShell>
    )
  }

  const release = resolveRelease(product, releaseId)
  if (!release) return notFound()

  const canonicalPath = releasePublicPath(product, release, locale)
  const requestedPath = locale === "en"
    ? `/en/catalog/${id}/releases/${releaseId}`
    : `/catalog/${id}/releases/${releaseId}`
  if (requestedPath !== canonicalPath) permanentRedirect(canonicalPath)

  const [localizedCopy, collectorOffers] = await Promise.all([
    getCatalogLocalizedCopy(product.id).catch((error) => {
      console.error("Failed to load localized release copy:", error)
      return null
    }),
    getPublicOpenOffersForRelease(release.id).catch((error) => {
      console.error("Failed to load public collector offers for release detail:", error)
      return []
    }),
  ])

  const siblingReleases = product.releases
    .filter((candidate) => candidate.id !== release.id)
    .sort((a, b) => (a.releaseYear ?? Number.MAX_SAFE_INTEGER) - (b.releaseYear ?? Number.MAX_SAFE_INTEGER))

  const canonicalUrl = `${SITE_URL}${canonicalPath}`
  const image = absoluteImage(resolveReleaseImageUrl(release, product) ?? undefined)
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "@id": `${canonicalUrl}#product`,
        name: release.editionName,
        description: releaseDescription(product, release, locale),
        url: canonicalUrl,
        ...(image ? { image: [image] } : {}),
        brand: { "@type": "Brand", name: "Tamiya" },
        category: "Tamiya Mini 4WD",
        ...(release.itemNumber ? { sku: release.itemNumber, mpn: release.itemNumber } : {}),
        model: product.name,
        additionalProperty: [
          ...(release.releaseYear ? [{ "@type": "PropertyValue", name: it ? "Anno di uscita" : "Release year", value: String(release.releaseYear) }] : []),
          ...(release.chassis ? [{ "@type": "PropertyValue", name: "Chassis", value: release.chassis }] : []),
          { "@type": "PropertyValue", name: it ? "Tipo di Release" : "Release type", value: release.releaseType },
          { "@type": "PropertyValue", name: it ? "Edizione" : "Edition", value: release.editionName },
        ],
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${canonicalUrl}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "TrackDash", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: it ? "Catalogo" : "Catalog", item: `${SITE_URL}${locale === "en" ? "/en/catalog" : "/catalog"}` },
          { "@type": "ListItem", position: 3, name: product.name, item: `${SITE_URL}${productPublicPath(product, locale)}` },
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
          localizedDescription={localizedCopy?.releases[release.id]}
          collectorOffers={collectorOffers}
        />
        <ReleaseFamilyLinks
          product={product}
          releases={siblingReleases}
        />
      </div>
    </PublicShell>
  )
}
