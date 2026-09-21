import { AppPage } from "@/components/app-page"
import { CollectionScreen } from "@/components/screens/collection-screen"
import { getMyCollectionAction } from "@/lib/actions/collection"
import { fetchCatalogProductsByIds } from "@/lib/actions/catalog"

export default async function CollectionPage() {
  const collection = await getMyCollectionAction()
  const productIds = [...new Set(collection.map((item) => item.productId))]
  const catalogProducts = await fetchCatalogProductsByIds(productIds)

  return (
    <AppPage>
      <CollectionScreen catalogProducts={catalogProducts} />
    </AppPage>
  )
}
