import type { Metadata } from "next"
import SpeedChampionsLayout from "@/components/speed-champions/layout"

export const metadata: Metadata = {
  title: "LEGO Speed Champions | TrackDash",
  description: "Scopri i set LEGO Speed Champions: confezioni, codici, anni e stato nel catalogo ufficiale.",
  robots: { index: false, follow: false },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <SpeedChampionsLayout locale="it">{children}</SpeedChampionsLayout>
}
