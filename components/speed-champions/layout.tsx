import { SpeedChampionsDisclaimer } from "@/components/speed-champions/disclaimer"
import { RacingCatalogNav } from "@/components/racing-studio/catalog-nav"
import { isRacingStudioEnabled, isRacingStudioPreview } from "@/lib/racing-studio"
import { speedChampionsCatalogIsVisible } from "@/lib/lego/catalog-visibility"
import type { PublicLocale } from "@/lib/seo/catalog-paths"
import { PublicShell } from "@/components/public-shell"
import { AppShell } from "@/components/app-shell"
import { canBrowseSpeedChampions } from "@/lib/server/speed-champions-messaging-access"
import { canAccessSpeedChampions } from "@/lib/server/speed-champions-gate"

export default async function SpeedChampionsLayout({ children, locale }: { children: React.ReactNode; locale: PublicLocale }) {
  const preview = isRacingStudioPreview()
  const hasPersonalLists = !preview && await canAccessSpeedChampions()
  if (preview || (!hasPersonalLists && !(await canBrowseSpeedChampions()))) {
    return speedChampionsCatalogIsVisible() ? <PublicShell websiteOnly><div className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-6">{isRacingStudioEnabled() && <RacingCatalogNav lego />}{children}</div></PublicShell> : children
  }

  return (
    <AppShell vertical="speedchampions" showSpeedChampionsPersonalLists={hasPersonalLists}>
      {children}
      <p className="mt-8 text-xs leading-relaxed text-muted-foreground">
        <SpeedChampionsDisclaimer locale={locale} />
      </p>
    </AppShell>
  )
}
