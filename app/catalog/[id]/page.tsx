import { notFound } from "next/navigation"
import { PublicShell } from "@/components/public-shell"
import { ProductDetailScreen } from "@/components/screens/product-detail-screen"
import { fetchCatalogProductById, fetchCatalogProducts } from "@/lib/actions/catalog"
import { getRelatedProducts } from "@/lib/data/products"
import { getCatalogLocalizedCopy } from "@/lib/db/queries/catalog-copy"
import { getReleaseCommunityCounts } from "@/lib/db/queries/sharing"

export const revalidate = 45

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [product, localizedCopy, communityCounts] = await Promise.all([
    fetchCatalogProductById(id).catch((error) => {
      console.error("Failed to load product from the database:", error)
      return null
    }),
    getCatalogLocalizedCopy(id).catch((error) => {
      console.error("Failed to load localized catalog copy:", error)
      return null
    }),
    getReleaseCommunityCounts(id).catch((error) => {
      console.error("Failed to load public Release community counts:", error)
      return []
    }),
  ])
  if (!product) return notFound()

  const allProducts = await fetchCatalogProducts().catch((error) => {
    console.error("Failed to load catalog for related products:", error)
    return []
  })
  const related = getRelatedProducts(product, 4, allProducts)

  return (
    <PublicShell>
      <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <ProductDetailScreen
          product={product}
          related={related}
          descriptionIt={localizedCopy?.productDescriptionIt}
          communityCounts={communityCounts}
        />
      </div>
    </PublicShell>
  )
}
