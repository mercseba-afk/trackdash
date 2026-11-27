import Link from "next/link"
import { localizePublicPath, type PublicLocale } from "@/lib/seo/catalog-paths"

export type RacingCatalog = "mini4wd" | "lego"

export function selectedRacingCatalog(value: string | string[] | undefined): RacingCatalog {
  return value === "lego" ? "lego" : "mini4wd"
}

export function RacingSectionNav({ path, legoPath = `${path}?catalog=lego`, selected, locale, label }: {
  path: string
  legoPath?: string
  selected: RacingCatalog
  locale: PublicLocale
  label: string
}) {
  return (
    <nav className="racing-section-nav" aria-label={label}>
      <div className="racing-segmented">
        <Link href={localizePublicPath(path, locale)} aria-current={selected === "mini4wd" ? "page" : undefined}>Mini 4WD</Link>
        <Link href={localizePublicPath(legoPath, locale)} aria-current={selected === "lego" ? "page" : undefined}>LEGO Speed Champions</Link>
      </div>
    </nav>
  )
}
