import { AppPage } from "@/components/app-page"
import { CollectionItemDetailScreen } from "@/components/screens/collection-item-detail-screen"
import { getMyCollectionAction } from "@/lib/actions/collection"
import { fetchCatalogProductById } from "@/lib/actions/catalog"

export default async function CollectionItemPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const collection = await getMyCollectionAction()
  const item = collection.find((candidate) => candidate.id === id)
  const catalogProduct = item
    ? await fetchCatalogProductById(item.productId).catch((error) => {
        console.error("Failed to load canonical catalog product for collection item:", error)
        return null
      })
    : null

  return (
    <AppPage>
      <CollectionItemDetailScreen collectionItemId={id} catalogProduct={catalogProduct} />
    </AppPage>
  )
}
