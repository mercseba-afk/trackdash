import type { Metadata } from "next"
import { cookies } from "next/headers"
import { publicAbsoluteUrl, publicLanguageAlternates } from "@/lib/seo/catalog-paths"
import { PublicShell } from "@/components/public-shell"
import { ShopScreen } from "@/components/screens/shop-screen"
import { getShopCopies } from "@/lib/server/shop"

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await cookies()).get("trackdash.locale")?.value === "en" ? "en" : "it"
  const it = locale === "it"
  const title = it ? "Mercatino Mini 4WD: annunci tra collezionisti | TrackDash" : "Mini 4WD Marketplace: Buy & Sell with Collectors | TrackDash"
  const description = it
    ? "Scopri le Mini 4WD in vendita tra collezionisti su TrackDash: release, foto, condizioni e prezzi richiesti. Crea un account gratuito per fare un’offerta."
    : "Explore Mini 4WD for sale by collectors on TrackDash. Browse releases, photos, condition and asking prices. Create a free account to make an offer."
  const canonical = publicAbsoluteUrl("/shop", locale)
  return {
    title, description, alternates: { canonical, languages: publicLanguageAlternates("/shop") },
    robots: { index: true, follow: true },
    openGraph: { type: "website", url: canonical, siteName: "TrackDash", title, description, locale: it ? "it_IT" : "en_GB" },
    twitter: { card: "summary_large_image", title, description },
  }
}
export const dynamic = "force-dynamic"
export default async function ShopPage() {
  const copies = await getShopCopies()
  return <PublicShell><div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 lg:px-8"><ShopScreen copies={copies} /></div></PublicShell>
}
