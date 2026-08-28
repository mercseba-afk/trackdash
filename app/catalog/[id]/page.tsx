import { AppPage } from "@/components/app-page"
import { ProductDetailScreen } from "@/components/screens/product-detail-screen"

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <AppPage>
      <ProductDetailScreen productId={id} />
    </AppPage>
  )
}
