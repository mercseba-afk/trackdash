import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PublicShell } from "@/components/public-shell"
import { ShopScreen } from "@/components/screens/shop-screen"
import { getShopCopies } from "@/lib/server/shop"

export const metadata: Metadata = { title: "Copia in vendita | TrackDash", robots: { index: false, follow: true } }
export const dynamic = "force-dynamic"
export default async function ShopCopyPage({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params
  const copies = await getShopCopies(shareId)
  if (!copies.length) notFound()
  return <PublicShell><div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 lg:px-8"><ShopScreen copies={copies} detail /></div></PublicShell>
}
