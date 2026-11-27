import { speedChampionsCatalogIsPublic } from "@/lib/lego/catalog-visibility"
import type { PublicLocale } from "@/lib/seo/catalog-paths"
import { PublicShell } from "@/components/public-shell"
import { AppShell } from "@/components/app-shell"
import { canBrowseSpeedChampions } from "@/lib/server/speed-champions-messaging-access"
import { canAccessSpeedChampions } from "@/lib/server/speed-champions-gate"

export default async function SpeedChampionsLayout({ children, locale }: { children: React.ReactNode; locale: PublicLocale }) {
  const hasPersonalLists = await canAccessSpeedChampions()
  if (!hasPersonalLists && !(await canBrowseSpeedChampions())) {
    return speedChampionsCatalogIsPublic ? <PublicShell websiteOnly><div className="mx-auto max-w-7xl px-4 py-8 md:px-6">{children}</div></PublicShell> : children
  }

  return (
    <AppShell vertical="speedchampions" showSpeedChampionsPersonalLists={hasPersonalLists}>
      {children}
      <p className="mt-8 text-xs leading-relaxed text-muted-foreground">
        {locale === "it"
          ? "TrackDash è un progetto indipendente. LEGO e Speed Champions sono marchi dei rispettivi titolari."
          : "TrackDash is an independent project. LEGO and Speed Champions are trademarks of their respective owners."}
      </p>
    </AppShell>
  )
}
