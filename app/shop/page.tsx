import type { Metadata } from "next"
import { AppPage } from "@/components/app-page"
import { ShopScreen } from "@/components/screens/shop-screen"
import { getShopCopies } from "@/lib/server/shop"

export const metadata: Metadata = { title: "In vendita | TrackDash", robots: { index: false, follow: false } }
export const dynamic = "force-dynamic"
export default async function ShopPage() {
  const copies = await getShopCopies()
  return <AppPage><ShopScreen copies={copies} /></AppPage>
}
