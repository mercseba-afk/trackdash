"use client"

import { RacingSectionNav } from "./section-nav"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LibraryBig, TrendingUp } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { localizePublicPath } from "@/lib/seo/catalog-paths"

export function RacingCatalogNav({ lego = false }: { lego?: boolean }) {
  const { locale } = useI18n()
  const pathname = usePathname()
  const it = locale === "it"
  const prefix = lego ? "/speed-champions" : ""
  const links = [
    { path: `${prefix}/catalog`, icon: LibraryBig, label: it ? "Catalogo" : "Catalog" },
    { path: `${prefix}/market`, icon: TrendingUp, label: it ? "Valori di mercato" : "Market values" },
  ]
  const isMarket = pathname === localizePublicPath(`${prefix}/market`, locale)
  const otherPrefix = lego ? "" : "/speed-champions"
  const otherCatalog = localizePublicPath(`${otherPrefix}/${isMarket ? "market" : "catalog"}`, locale)
  if (isMarket) return (
    <div className="racing-market-nav">
      <RacingSectionNav path="/market" legoPath="/speed-champions/market" selected={lego ? "lego" : "mini4wd"} locale={locale} label={it ? "Catalogo dei valori di mercato" : "Market value catalog"} />
    </div>
  )
  return (
    <nav className="racing-area-nav" aria-label={lego ? "LEGO Speed Champions" : "Tamiya Mini 4WD"}>
      <strong><span data-lego={lego} />{lego ? "LEGO Speed Champions" : "Tamiya Mini 4WD"}</strong>
      <div>{links.map(({ path, icon: Icon, label }) => {
        const href = localizePublicPath(path, locale)
        const active = pathname === href || pathname.startsWith(`${href}/`)
        return <Link key={path} href={href} aria-current={active ? "page" : undefined}><Icon size={16} aria-hidden="true" />{label}</Link>
      })}</div>
      <Link className="racing-area-other" href={otherCatalog}>{it ? "Passa a" : "Switch to"} {lego ? "Mini 4WD" : "LEGO Speed Champions"} →</Link>
    </nav>
  )
}
