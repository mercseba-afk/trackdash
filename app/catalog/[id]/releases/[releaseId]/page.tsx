import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { cache } from "react"
import { PublicShell } from "@/components/public-shell"
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
  const itemNumber = release.itemNumber ? ` ${release.itemNumber}` : ""
  const year = release.releaseYear ? ` ${release.releaseYear}` : ""
  return `Tamiya${itemNumber} ${release.editionName}${year}`.replace(/\s+/g, " ").trim()
}

function releaseDescription(product: Product, release: ProductRelease) {
  const details = [
    release.itemNumber ? `Item Number ${release.itemNumber}` : null,
    release.releaseYear ? `release ${release.releaseYear}` : null,
    release.chassis ? `${release.chassis} chassis` : null,
    release.releaseType,
  ].filter(Boolean)

  return `${releaseIdentity(product, release)}: scheda della specifica release Tamiya Mini 4WD con ${details.join(", ")}. Market Value, dati di mercato, disponibilità e dettagli per collezionisti su TrackDash.`
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

        {siblingReleases.length > 0 ? (
          <section className="mt-2 rounded-3xl border border-border/70 bg-card p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] md:p-6" aria-labelledby="related-releases-title">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand">Release family</p>
            <div className="mt-1 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 id="related-releases-title" className="text-xl font-semibold tracking-tight text-foreground">
                  Altre release di {product.name}
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Confronta originali, reissue ed edizioni speciali senza mescolare anni o Item Number diversi.
                </p>
              </div>
              <Link href={`/catalog/${product.id}`} className="text-sm font-semibold text-brand hover:underline">
                Vedi il modello {product.name} →
              </Link>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {siblingReleases.map((candidate) => (
                <Link
                  key={candidate.id}
                  href={`/catalog/${product.id}/releases/${candidate.id}`}
                  className="group rounded-2xl border border-border/70 bg-muted/15 p-3.5 transition-colors hover:border-brand/30 hover:bg-brand/5"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-brand/80">
                    {candidate.itemNumber ? `Tamiya ${candidate.itemNumber}` : "Tamiya Mini 4WD"}
                  </p>
                  <h3 className="mt-1 text-sm font-semibold leading-snug text-foreground group-hover:text-brand">
                    {candidate.editionName}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {[candidate.releaseYear, candidate.chassis, candidate.releaseType].filter(Boolean).join(" · ")}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </PublicShell>
  )
}
