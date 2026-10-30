import type { Metadata } from "next"
import { PublicShell } from "@/components/public-shell"
import { ShopScreen } from "@/components/screens/shop-screen"
import { getShopCopies } from "@/lib/server/shop"

const title = "Mercatino Mini 4WD: annunci tra collezionisti | TrackDash"
const description = "Scopri le Mini 4WD in vendita tra collezionisti su TrackDash: release, foto, condizioni e prezzi richiesti. Crea un account gratuito per fare un’offerta."
export const metadata: Metadata = {
  title, description, alternates: { canonical: "https://trackdash.it/shop" },
  robots: { index: true, follow: true },
  openGraph: { type: "website", url: "https://trackdash.it/shop", siteName: "TrackDash", title, description, locale: "it_IT" },
  twitter: { card: "summary_large_image", title, description },
}
export const dynamic = "force-dynamic"
export default async function ShopPage() {
  const copies = await getShopCopies()
  return <PublicShell><div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 lg:px-8"><ShopScreen copies={copies} /></div></PublicShell>
}
