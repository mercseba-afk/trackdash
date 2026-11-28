"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronDown } from "lucide-react"
import { usePathname } from "next/navigation"
import { useI18n } from "@/lib/i18n"
import { localizePublicPath } from "@/lib/seo/catalog-paths"

export const racingCatalogs = [
  { title: "Tamiya Mini 4WD", catalog: "/catalog", market: "/market", image: "/catalog/dash-1-emperor-18012-1988-original-confezione.jpeg" },
  { title: "LEGO Speed Champions", catalog: "/speed-champions/catalog", market: "/speed-champions/market", image: "/speed-champions/images/76934-box.jpg" },
] as const

export function CatalogSelector({ onOpen, className = "" }: { onOpen?: () => void; className?: string } = {}) {
  const { locale } = useI18n()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    if (!open) return
    function outside(event: PointerEvent) {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) setOpen(false)
    }
    function escape(event: KeyboardEvent) {
      if (event.key !== "Escape") return
      setOpen(false)
      triggerRef.current?.focus()
    }
    document.addEventListener("pointerdown", outside)
    document.addEventListener("keydown", escape)
    return () => {
      document.removeEventListener("pointerdown", outside)
      document.removeEventListener("keydown", escape)
    }
  }, [open])

  return (
    <div className={`racing-catalog-menu ${className}`} ref={menuRef}>
      <button
        ref={triggerRef}
        type="button"
        className="racing-chip"
        aria-expanded={open}
        aria-controls="racing-catalog-options"
        onClick={() => {
          setOpen((current) => !current)
          onOpen?.()
        }}
      >
        <span className="racing-dots" aria-hidden="true" />
        <span>{locale === "it" ? "Scegli un catalogo" : "Choose a catalog"}</span>
        <ChevronDown size={15} aria-hidden="true" />
      </button>
      {open && (
        <div id="racing-catalog-options" className="racing-dropdown">
          {racingCatalogs.map((catalog) => (
            <Link key={catalog.catalog} href={localizePublicPath(catalog.catalog, locale)} onClick={() => setOpen(false)}>
              <Image src={catalog.image} alt="" width={250} height={142} sizes="240px" />
              <strong>{catalog.title}</strong>
              <span>{locale === "it" ? "Apri il catalogo" : "Open catalog"} →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
