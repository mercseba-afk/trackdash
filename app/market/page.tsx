import { PublicShell } from "@/components/public-shell"
import { CatalogAreaNav } from "@/components/catalog-area-nav"
import { MarketScreen } from "@/components/screens/market-screen"

export default function MarketPage() {
  return (
    <PublicShell>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-8 md:px-6 lg:px-8">
        <CatalogAreaNav />
        <MarketScreen />
      </div>
    </PublicShell>
  )
}
