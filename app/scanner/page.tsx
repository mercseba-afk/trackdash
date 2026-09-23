import { AppPage } from "@/components/app-page"
import { ScannerScreen } from "@/components/screens/scanner-screen"
import { fetchCatalogProducts } from "@/lib/actions/catalog"
import type { Product } from "@/lib/types"

export default async function ScannerPage() {
  let catalogProducts: Product[] = []
  try {
    catalogProducts = await fetchCatalogProducts()
  } catch (error) {
    console.error("Failed to load canonical catalog for scanner:", error)
  }

  return (
    <AppPage>
      <ScannerScreen products={catalogProducts} />
    </AppPage>
  )
}
