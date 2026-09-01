import { notFound } from "next/navigation"
import { AppPage } from "@/components/app-page"
import { ProductDetailScreen } from "@/components/screens/product-detail-screen"
import { fetchCatalogProductById, fetchCatalogProducts } from "@/lib/actions/catalog"
import { getRelatedProducts } from "@/lib/data/products"

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const product = await fetchCatalogProductById(id).catch((error) => {
    console.error("Failed to load product from the database:", error)
    return null
  })
  if (!product) return notFound()

  // Related products still need the rest of the catalog to score against;
  // fetched once more here rather than threading it down from the list
  // page (there is no shared layout data-loading between the two routes).
  const allProducts = await fetchCatalogProducts().catch((error) => {
    console.error("Failed to load catalog for related products:", error)
    return []
  })
  const related = getRelatedProducts(product, 4, allProducts)

  return (
    <AppPage>
      <ProductDetailScreen product={product} related={related} />
    </AppPage>
  )
}
