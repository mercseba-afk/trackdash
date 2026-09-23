import { AppPage } from "@/components/app-page"
import { WishlistScreen } from "@/components/screens/wishlist-screen"
import { getMyWishlistAction } from "@/lib/actions/wishlist"
import { fetchCatalogProductsByIds } from "@/lib/actions/catalog"

export default async function WishlistPage() {
  const wishlist = await getMyWishlistAction()
  const productIds = [...new Set(wishlist.map((item) => item.productId))]
  const catalogProducts = await fetchCatalogProductsByIds(productIds)

  return (
    <AppPage>
      <WishlistScreen catalogProducts={catalogProducts} />
    </AppPage>
  )
}
