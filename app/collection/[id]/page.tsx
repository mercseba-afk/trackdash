import { AppPage } from "@/components/app-page"
import { CollectionItemDetailScreen } from "@/components/screens/collection-item-detail-screen"

export default async function CollectionItemPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <AppPage>
      <CollectionItemDetailScreen collectionItemId={id} />
    </AppPage>
  )
}
