import { PwaRootLaunchRedirect } from "@/components/pwa-root-launch-redirect"
import { PublicShell } from "@/components/public-shell"
import { PublicHomeScreen } from "@/components/screens/public-home-screen"
import { fetchCatalogProducts } from "@/lib/actions/catalog"
import type { Product } from "@/lib/types"

export const revalidate = 45

export default async function Page() {
  let products: Product[] = []

  try {
    products = await fetchCatalogProducts()
  } catch (error) {
    console.error("Failed to load catalog data for public home:", error)
  }

  return (
    <PublicShell>
      <PwaRootLaunchRedirect />
      <PublicHomeScreen products={products} />
    </PublicShell>
  )
}
