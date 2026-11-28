import { selectedRacingCatalog } from "@/components/racing-studio/section-nav"
import { isRacingStudioPreview } from "@/lib/racing-studio"
import type { Metadata } from "next"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import { PublicShell } from "@/components/public-shell"
import { ShopScreen } from "@/components/screens/shop-screen"
import { getShopCopies } from "@/lib/server/shop"

export async function generateMetadata(): Promise<Metadata> {
  const en = (await cookies()).get("trackdash.locale")?.value === "en"
  return { title: en ? "Collector Copy for Sale | TrackDash" : "Copia in vendita | TrackDash", robots: { index: false, follow: true } }
}
export const dynamic = "force-dynamic"
export default async function ShopCopyPage({ params, searchParams }: { params: Promise<{ shareId: string }>; searchParams?: Promise<{ catalog?: string | string[] }> }) {
  const { shareId } = await params
  const preview = isRacingStudioPreview()
  const lego = selectedRacingCatalog((await searchParams)?.catalog) === "lego"
  const copies = lego ? [] : await getShopCopies(shareId)
  if (!copies.length) notFound()
  return <PublicShell><div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 lg:px-8"><ShopScreen preview={preview} copies={copies} detail lego={lego} /></div></PublicShell>
}
