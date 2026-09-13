import { AppPage } from "@/components/app-page"
import { CatalogAreaNav } from "@/components/catalog-area-nav"
import { MarketScreen } from "@/components/screens/market-screen"

export default function MarketPage() {
  return (
    <AppPage>
      <div className="flex flex-col gap-5">
        <CatalogAreaNav />
        <MarketScreen />
      </div>
    </AppPage>
  )
}
