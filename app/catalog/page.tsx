import { PublicShell } from "@/components/public-shell"
import { CatalogAreaNav } from "@/components/catalog-area-nav"
import { CatalogScreen } from "@/components/screens/catalog-screen"
import { fetchCatalogProducts } from "@/lib/actions/catalog"
import type { Product } from "@/lib/types"

export const revalidate = 45

export default async function CatalogPage() {
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
        <CatalogScreen products={products} />
      </div>
    </PublicShell>
  )
}
