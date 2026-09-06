import { notFound } from "next/navigation"
import { AppPage } from "@/components/app-page"
import { ProductDetailScreen } from "@/components/screens/product-detail-screen"
import { fetchCatalogProductById, fetchCatalogProducts } from "@/lib/actions/catalog"
import { getRelatedProducts } from "@/lib/data/products"

// This route has no generateStaticParams(), so Next classifies it as fully
// dynamic ("ƒ /catalog/[id]") by default — it already re-runs (including
// its DB queries) on every request, so it was never affected by the
// static-freeze bug app/catalog/page.tsx had. Setting the SAME revalidate
// window here anyway (see that file's comment for the full reasoning)
// applies a coherent policy across both catalog routes and lets Next
// serve a cached response for repeat requests within the window instead
// of querying the database every single time — a real performance win,
// with staleness still bounded to the same ~45s a visitor could already
// see on the list page.
export const revalidate = 45

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
