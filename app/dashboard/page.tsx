import { AppPage } from "@/components/app-page"
import { DashboardScreen } from "@/components/screens/dashboard-screen"
import { fetchCatalogProducts } from "@/lib/actions/catalog"
import { getCurrentUser } from "@/lib/auth/current-user"
import { readLegoList } from "@/lib/server/lego-personal-lists"
import { loadLegoMarketSummaries } from "@/lib/server/lego-market"
import { speedChampionsSets } from "@/lib/lego/catalog"
import { getLegoObservedSales } from "@/lib/lego/market"
import type { LegoListItem } from "@/lib/lego/personal-list-types"
import type { LegoMarketSummary } from "@/lib/lego/market"
import type { DashboardCatalog } from "@/lib/actions/profile"
import type { Product } from "@/lib/types"

export default async function DashboardPage() {
  const user = await getCurrentUser()
  let catalogProducts: Product[] = []
  try {
    catalogProducts = await fetchCatalogProducts()
  } catch (error) {
    console.error("Failed to load canonical catalog for dashboard:", error)
  }

  let legoCollection: LegoListItem[] = []
  let legoWishlist: LegoListItem[] = []
  let legoMarketSummaries: Record<string, LegoMarketSummary> = {}
  let dashboardCatalog: DashboardCatalog = "mini4wd"
  if (user) {
    dashboardCatalog = user.user_metadata?.trackdash_dashboard_catalog === "lego" ? "lego" : "mini4wd"
    try {
      ;[legoCollection, legoWishlist] = await Promise.all([
        readLegoList(user.id, { kind: "collection" }),
        readLegoList(user.id, { kind: "wishlist" }),
      ])
      const setNumbers = [...new Set([...legoCollection, ...legoWishlist].map((item) => item.setNumber))]
      legoMarketSummaries = await loadLegoMarketSummaries(setNumbers, new Date().toISOString())
    } catch (error) {
      console.error("Failed to load LEGO dashboard data:", error)
    }
  }

  const asOf = new Date().toISOString()
  const legoItems = [...legoCollection, ...legoWishlist].flatMap((item) => {
    const set = speedChampionsSets.find((entry) => entry.setNumber === item.setNumber)
    if (!set) return []
    return [{
      item,
      set,
      market: legoMarketSummaries[item.setNumber] ?? null,
      observedSales: getLegoObservedSales(item.setNumber, asOf).length,
    }]
  })
  const legoCollectionItems = legoItems.filter(({ item }) => item.kind === "collection")
  const legoWishlistItems = legoItems.filter(({ item }) => item.kind === "wishlist")

  return (
    <AppPage>
      <DashboardScreen
        catalogProducts={catalogProducts}
        initialCatalog={dashboardCatalog}
        legoCollection={legoCollectionItems}
        legoWishlist={legoWishlistItems}
      />
    </AppPage>
  )
}
