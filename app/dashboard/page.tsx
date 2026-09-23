import { AppPage } from "@/components/app-page"
import { DashboardScreen } from "@/components/screens/dashboard-screen"
import { fetchCatalogProducts } from "@/lib/actions/catalog"
import type { Product } from "@/lib/types"

export default async function DashboardPage() {
  let catalogProducts: Product[] = []
  try {
    catalogProducts = await fetchCatalogProducts()
  } catch (error) {
    console.error("Failed to load canonical catalog for dashboard:", error)
  }

  return (
    <AppPage>
      <DashboardScreen catalogProducts={catalogProducts} />
    </AppPage>
  )
}
