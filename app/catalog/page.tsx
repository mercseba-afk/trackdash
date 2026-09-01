import { AppPage } from "@/components/app-page"
import { CatalogScreen } from "@/components/screens/catalog-screen"
import { fetchCatalogProducts } from "@/lib/actions/catalog"
import type { Product } from "@/lib/types"

export default async function CatalogPage() {
  // The DB read happens here, server-side, once per request — not in the
  // (client) CatalogScreen itself, which just renders whatever it's given.
  // Wrapped defensively: a DB outage should render the screen's existing
  // empty state, not crash the whole page with an unhandled error.
  let products: Product[] = []
  try {
    products = await fetchCatalogProducts()
  } catch (error) {
    console.error("Failed to load catalog from the database:", error)
  }

  return (
    <AppPage>
      <CatalogScreen products={products} />
    </AppPage>
  )
}
