import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { AppPage } from "@/components/app-page"
import { ShopScreen } from "@/components/screens/shop-screen"
import { getShopCopies } from "@/lib/server/shop"

export const metadata: Metadata = { title: "Copia in vendita | TrackDash", robots: { index: false, follow: false } }
export const dynamic = "force-dynamic"
export default async function ShopCopyPage({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params
  const copies = await getShopCopies(shareId)
  if (!copies.length) notFound()
  return <AppPage><ShopScreen copies={copies} detail /></AppPage>
}
