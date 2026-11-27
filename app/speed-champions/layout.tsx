import type { Metadata } from "next"
import { AppShell } from "@/components/app-shell"
import { canBrowseSpeedChampions } from "@/lib/server/speed-champions-messaging-access"
import { canAccessSpeedChampions } from "@/lib/server/speed-champions-gate"

export const metadata: Metadata = {
  title: "LEGO Speed Champions | TrackDash",
  description: "Scopri i set LEGO Speed Champions: confezioni, codici, anni e stato nel catalogo ufficiale.",
  robots: { index: false, follow: false },
}

export default async function SpeedChampionsLayout({ children }: { children: React.ReactNode }) {
  const hasPersonalLists = await canAccessSpeedChampions()
  if (!hasPersonalLists && !(await canBrowseSpeedChampions())) return children

  return (
    <AppShell vertical="speedchampions" showSpeedChampionsPersonalLists={hasPersonalLists}>
      {children}
      <p className="mt-8 text-xs leading-relaxed text-muted-foreground">
        TrackDash è un progetto indipendente. LEGO e Speed Champions sono marchi dei rispettivi titolari.
      </p>
    </AppShell>
  )
}
