import type { Metadata } from "next"
import Link from "next/link"
import { CollectibleVerticalSwitch } from "@/components/collectible-vertical-switch"
import { canAccessSpeedChampions } from "@/lib/server/speed-champions-gate"
import { BrandMark } from "@/components/brand-mark"

export const metadata: Metadata = {
  title: "LEGO Speed Champions | TrackDash",
  description: "Scopri i set LEGO Speed Champions: confezioni, codici, anni e stato nel catalogo ufficiale.",
  robots: { index: false, follow: false },
}

export default async function SpeedChampionsLayout({ children }: { children: React.ReactNode }) {
  const showSpeedChampions = await canAccessSpeedChampions()
  return (
    <div className="min-h-screen bg-[#f6f7f9] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <Link href="/speed-champions/catalog" aria-label="TrackDash Speed Champions">
            <BrandMark />
          </Link>
          <nav aria-label="Navigazione Speed Champions" className="flex items-center gap-5 text-sm font-medium">
            {showSpeedChampions && <CollectibleVerticalSwitch active="speedchampions" showSpeedChampions />}
            <Link href="/speed-champions/catalog" className="text-blue-700 hover:underline">
              Catalogo LEGO
            </Link>
            <a href="https://trackdash.it/catalog" className="text-slate-600 hover:underline">
              Mini 4WD
            </a>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-800">Anteprima</span>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8">{children}</main>
      <footer className="mx-auto max-w-7xl px-4 pb-8 text-xs leading-relaxed text-slate-500 sm:px-8">
        TrackDash è un progetto indipendente, non affiliato al Gruppo LEGO. LEGO e Speed Champions sono marchi dei
        rispettivi titolari.
      </footer>
    </div>
  )
}
