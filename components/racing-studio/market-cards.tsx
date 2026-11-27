"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import type { PublicLocale } from "@/lib/seo/catalog-paths"
import { localizePublicPath } from "@/lib/seo/catalog-paths"

export type RacingMarketItem = {
  href: string
  image?: string | null
  name: string
  code?: string
  summary: string
}

export function RacingMarketCards({ locale, mini, lego }: { locale: PublicLocale; mini: RacingMarketItem[]; lego: RacingMarketItem[] }) {
  const [selected, setSelected] = useState<"mini" | "lego">("mini")
  const it = locale === "it"
  const entries = selected === "mini" ? mini : lego
  return (
    <section className="racing-wrap racing-section" id="mercato">
      <div className="racing-market-heading">
        <div><p className="racing-kicker">{it ? "Dal mercato" : "From the market"}</p><h2>{it ? "Modelli da tenere d’occhio." : "Models worth watching."}</h2></div>
        <div className="racing-segmented" role="group" aria-label={it ? "Catalogo del mercato" : "Market catalog"}>
          <button type="button" aria-pressed={selected === "mini"} onClick={() => setSelected("mini")}>Tamiya Mini 4WD</button>
          <button type="button" aria-pressed={selected === "lego"} onClick={() => setSelected("lego")}>LEGO Speed Champions</button>
        </div>
      </div>
      <div className="racing-market-grid">
        {entries.map((item) => (
          <Link className="racing-market-card" href={item.href} key={item.href}>
            <div className="racing-market-image">{item.image && <Image src={item.image} alt="" fill unoptimized sizes="(max-width: 640px) 45vw, (max-width: 1024px) 40vw, 23vw" />}</div>
            <div><span className="racing-item-code">{item.code}</span><h3>{item.name}</h3><p>{item.summary}</p></div>
          </Link>
        ))}
      </div>
      <Link className="racing-text-link" href={localizePublicPath(selected === "mini" ? "/market" : "/speed-champions/market", locale)}>{it ? "Vai ai valori di mercato" : "View market values"} →</Link>
    </section>
  )
}
