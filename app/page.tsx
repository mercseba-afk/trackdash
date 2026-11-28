import { isRacingStudioEnabled, isRacingStudioPreview } from "@/lib/racing-studio"
import { RacingHome } from "@/components/racing-studio/home"
import { getShopCopies } from "@/lib/server/shop"
import type { Metadata } from "next"
import { cookies } from "next/headers"
import { PwaRootLaunchRedirect } from "@/components/pwa-root-launch-redirect"
import { PublicShell } from "@/components/public-shell"
import { PublicHomeScreen } from "@/components/screens/public-home-screen"
import { fetchCatalogProducts } from "@/lib/actions/catalog"
import type { Product } from "@/lib/types"
import { publicAbsoluteUrl, publicLanguageAlternates, type PublicLocale } from "@/lib/seo/catalog-paths"

export const revalidate = 45

async function requestLocale(): Promise<PublicLocale> {
  const cookieStore = await cookies()
  return cookieStore.get("trackdash.locale")?.value === "en" ? "en" : "it"
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await requestLocale()
  const it = locale === "it"
  if (isRacingStudioEnabled()) {
    const title = it
      ? "TrackDash | Collezionismo Mini 4WD e LEGO Speed Champions"
      : "TrackDash | Mini 4WD & LEGO Speed Champions Collecting"
    const description = it
      ? "Esplora i cataloghi Tamiya Mini 4WD e LEGO Speed Champions. Scopri release e set, confronta i dati di mercato e organizza la tua collezione."
      : "Explore Tamiya Mini 4WD and LEGO Speed Champions catalogs. Discover models and sets, compare market data and organize your collection."
    const canonical = publicAbsoluteUrl("/", locale)
    return {
      title,
      description,
      alternates: { canonical, languages: publicLanguageAlternates("/") },
      openGraph: { type: "website", url: canonical, siteName: "TrackDash", title, description },
      twitter: { card: "summary_large_image", title, description },
    }
  }
  const title = it
    ? "TrackDash — Collezione Mini 4WD e valori di mercato"
    : "TrackDash — Mini 4WD Collection & Market Values"
  const description = it
    ? "Identifica la Release Mini 4WD esatta, consulta valori di mercato e vendite concluse, organizza la collezione e scopri modelli, varianti e disponibilità."
    : "Identify the exact Mini 4WD Release, check market values and completed sales, organize your collection and discover models, variants and availability."
  const canonical = publicAbsoluteUrl("/", locale)

  return {
    title,
    description,
    alternates: { canonical, languages: publicLanguageAlternates("/") },
    openGraph: { type: "website", url: canonical, siteName: "TrackDash", title, description },
    twitter: { card: "summary_large_image", title, description },
  }
}

export default async function Page() {
  let products: Product[] = []

  try {
    products = await fetchCatalogProducts()
  } catch (error) {
    console.error("Failed to load catalog data for public home:", error)
  }

  if (isRacingStudioEnabled()) {
    return <PublicShell>{!isRacingStudioPreview() && <PwaRootLaunchRedirect />}<RacingHome products={products} locale={await requestLocale()} /></PublicShell>
  }

  const copies = await getShopCopies().catch(() => [])
  return (
    <PublicShell>
      <PwaRootLaunchRedirect />
      <PublicHomeScreen products={products} copies={copies} />
    </PublicShell>
  )
}
