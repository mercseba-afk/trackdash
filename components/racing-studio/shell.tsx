"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { ChevronDown, Menu } from "lucide-react"
import { LanguageSwitch } from "@/components/language-switch"
import { SocialFollow } from "@/components/facebook-link"
import { useI18n } from "@/lib/i18n"
import { localizePublicPath } from "@/lib/seo/catalog-paths"
import { useStore } from "@/lib/store"
import { useRacingStudio } from "./context"

const galleries = [
  { title: "Tamiya Mini 4WD", catalog: "/catalog", market: "/market", image: "emperor" },
  { title: "LEGO Speed Champions", catalog: "/speed-champions/catalog", market: "/speed-champions/market", image: "f40" },
] as const

export function RacingShell({ children }: { children: React.ReactNode }) {
  const { locale } = useI18n()
  const { user } = useStore()
  const { preview } = useRacingStudio()
  const pathname = usePathname()
  const it = locale === "it"
  const href = (path: string) => localizePublicPath(path, locale)
  const lego = /^\/(?:en\/)?speed-champions(?:\/|$)/.test(pathname)
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const catalogRef = useRef<HTMLDivElement>(null)
  const catalogTrigger = useRef<HTMLButtonElement>(null)
  const navTrigger = useRef<HTMLButtonElement>(null)
  const navItems = [
    [lego ? "/speed-champions/market" : "/market", it ? "Valori di mercato" : "Market values"],
    ["/guide", it ? "Guide" : "Guides"],
    ["/find", "Scanner"],
    ["/how-it-works", it ? "Come funziona" : "How it works"],
    ["/shop", it ? "Mercatino" : "Marketplace"],
  ]

  useEffect(() => {
    setCatalogOpen(false)
    setNavOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!catalogOpen && !navOpen) return
    function outside(event: PointerEvent) {
      if (event.target instanceof Node && !catalogRef.current?.contains(event.target)) setCatalogOpen(false)
    }
    function escape(event: KeyboardEvent) {
      if (event.key !== "Escape") return
      if (catalogOpen) catalogTrigger.current?.focus()
      else if (navOpen) navTrigger.current?.focus()
      setCatalogOpen(false)
      setNavOpen(false)
    }
    document.addEventListener("pointerdown", outside)
    document.addEventListener("keydown", escape)
    return () => {
      document.removeEventListener("pointerdown", outside)
      document.removeEventListener("keydown", escape)
    }
  }, [catalogOpen, navOpen])

  return (
    <div className="racing-site">
      <a href="#racing-content" className="sr-only focus:not-sr-only">{it ? "Vai al contenuto" : "Skip to content"}</a>
      {preview && <div className="racing-test-label">{it ? "ANTEPRIMA PRIVATA · DATI DI TEST" : "PRIVATE PREVIEW · TEST DATA"}</div>}
      <header className="racing-header">
        <div className="racing-wrap racing-header-row">
          <Link href={href("/")} aria-label="TrackDash">
            <Image className="racing-logo" src="/racing-studio/logo.webp" width={170} height={45} alt="TrackDash" priority />
          </Link>
          <div className="racing-catalog-menu" ref={catalogRef}>
            <button ref={catalogTrigger} type="button" className="racing-chip" aria-expanded={catalogOpen} aria-controls="racing-catalog-options" onClick={() => { setCatalogOpen(!catalogOpen); setNavOpen(false) }}>
              <span className="racing-dots" aria-hidden="true" />
              <span>{it ? "Scegli un catalogo" : "Choose a catalog"}</span>
              <ChevronDown size={15} aria-hidden="true" />
            </button>
            {catalogOpen && (
              <div id="racing-catalog-options" className="racing-dropdown">
                {galleries.map((gallery) => (
                  <Link key={gallery.catalog} href={href(gallery.catalog)} onClick={() => setCatalogOpen(false)}>
                    <Image src={`/racing-studio/${gallery.image}.webp`} alt="" width={250} height={142} sizes="240px" />
                    <strong>{gallery.title}</strong>
                    <span>{it ? "Apri il catalogo" : "Open catalog"} →</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
          <nav id="racing-navigation" aria-label={it ? "Navigazione principale" : "Main navigation"} className={navOpen ? "racing-nav racing-nav-open" : "racing-nav"}>
            {navItems.map(([path, label]) => <Link key={path} href={href(path)} aria-current={pathname === href(path) ? "page" : undefined} onClick={() => setNavOpen(false)}>{label}</Link>)}
            <div className="racing-mobile-account">
              <LanguageSwitch />
              <Link href={user ? "/dashboard" : "/login"}>{user ? (it ? "Il tuo account" : "Your account") : (it ? "Accedi" : "Sign in")}</Link>
            </div>
          </nav>
          <div className="racing-account">
            <LanguageSwitch />
            <Link href={user ? "/dashboard" : "/login"}>{user ? (it ? "Il tuo account" : "Your account") : (it ? "Accedi" : "Sign in")}</Link>
            {!user && <Link className="racing-button racing-button-small" href="/signup">{it ? "Registrati" : "Sign up"}</Link>}
          </div>
          <button ref={navTrigger} type="button" className="racing-nav-toggle racing-chip" aria-label={it ? "Apri navigazione" : "Open navigation"} aria-expanded={navOpen} aria-controls="racing-navigation" onClick={() => { setNavOpen(!navOpen); setCatalogOpen(false) }}><Menu size={20} aria-hidden="true" /></button>
        </div>
      </header>
      <main id="racing-content" className="racing-content">{children}</main>
      <footer className="racing-footer">
        <div className="racing-wrap racing-footer-grid">
          <div>
            <Link href={href("/")}><Image className="racing-logo" src="/racing-studio/logo.webp" alt="TrackDash" width={170} height={45} /></Link>
            <p>{it ? "Scopri, colleziona e segui il valore dei tuoi modelli." : "Discover, collect and follow the value of your models."}</p>
            <SocialFollow />
          </div>
          {galleries.map((gallery) => <div key={gallery.catalog}><strong>{gallery.title}</strong><Link href={href(gallery.catalog)}>{it ? "Catalogo" : "Catalog"}</Link><Link href={href(gallery.market)}>{it ? "Valori di mercato" : "Market values"}</Link></div>)}
          <div><strong>TrackDash</strong>{navItems.slice(1).map(([path, label]) => <Link key={path} href={href(path)}>{label}</Link>)}</div>
          <div><strong>{it ? "Account e informazioni" : "Account and information"}</strong><Link href={user ? "/dashboard" : "/login"}>{user ? (it ? "Il tuo account" : "Your account") : (it ? "Accedi" : "Sign in")}</Link><Link href={href("/privacy")}>Privacy</Link><Link href={href("/terms")}>{it ? "Condizioni d’uso" : "Terms of use"}</Link></div>
        </div>
        <p className="racing-wrap racing-footer-note">{it ? "In qualità di Affiliato Amazon io ricevo un guadagno dagli acquisti idonei." : "As an Amazon Associate I earn from qualifying purchases."}</p>
      </footer>
    </div>
  )
}
