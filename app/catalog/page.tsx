import { AppPage } from "@/components/app-page"
import { CatalogScreen } from "@/components/screens/catalog-screen"
import { fetchCatalogProducts } from "@/lib/actions/catalog"
import type { Product } from "@/lib/types"

// Root cause (confirmed via a real production build, not assumed): with no
// route segment config, Next.js prerenders this page STATICALLY at build
// time — confirmed by the build's own route classification, "○ /catalog"
// (Static). The DB query in fetchCatalogProducts() runs once during that
// build and its result is frozen into the static HTML from then on; new
// catalog images (or any other DB change) never appear until the next
// Vercel deploy, no matter how quickly the migration inserting them is
// applied.
//
// Fix: `revalidate` turns this into ISR instead of fully static. Next
// still serves the cached HTML for most requests (same performance as
// before), but treats it as stale after this many seconds and
// regenerates it (re-running this Server Component, including the DB
// query) on the next request past that point — no rebuild/redeploy
// required. 45s is comfortably inside the requested ~30–60s window: fast
// enough that newly-added catalog images or market estimates are visible
// well within a minute, long enough that the catalog page isn't hitting
// the database on every single request.
export const revalidate = 45

export default async function CatalogPage() {
  let products: Product[] = []

  try {
    products = await fetchCatalogProducts()
  } catch (error) {
    console.error("Failed to load catalog data from the database:", error)
  }

  return (
    <AppPage>
      <CatalogScreen products={products} />
    </AppPage>
  )
}
