"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { LanguageSwitch } from "@/components/language-switch"
import { CatalogSelector, racingCatalogs } from "@/components/racing-studio/catalog-selector"
import { SpeedChampionsDisclaimer } from "@/components/speed-champions/disclaimer"
import { SocialFollow } from "@/components/facebook-link"
import { useI18n } from "@/lib/i18n"
import { localizePublicPath } from "@/lib/seo/catalog-paths"
import { useStore } from "@/lib/store"
import { useRacingStudio } from "./context"

export function RacingShell({ children }: { children: React.ReactNode }) {
  const { locale } = useI18n()
  const { user } = useStore()
  const { preview } = useRacingStudio()
  const pathname = usePathname()
  const it = locale === "it"
  const href = (path: string) => localizePublicPath(path, locale)
  const lego = /^\/(?:en\/)?speed-champions(?:\/|$)/.test(pathname)
  const [navOpen, setNavOpen] = useState(false)
  const navTrigger = useRef<HTMLButtonElement>(null)
  const navItems = [
    [lego ? "/speed-champions/market" : "/market", it ? "Valori di mercato" : "Market values"],
    ["/guide", it ? "Guide" : "Guides"],
    ["/find", "Scanner"],
    ["/how-it-works", it ? "Come funziona" : "How it works"],
    ["/shop", it ? "Mercatino" : "Marketplace"],
  ]

  useEffect(() => {
    setNavOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!navOpen) return
    function escape(event: KeyboardEvent) {
      if (event.key !== "Escape") return
      setNavOpen(false)
      navTrigger.current?.focus()
    }
    document.addEventListener("keydown", escape)
    return () => {
      document.removeEventListener("keydown", escape)
    }
  }, [navOpen])

  return (
    <div className="racing-site">
      <a href="#racing-content" className="sr-only focus:not-sr-only">{it ? "Vai al contenuto" : "Skip to content"}</a>
      {preview && <div className="racing-test-label">{it ? "ANTEPRIMA PRIVATA · DATI DI TEST" : "PRIVATE PREVIEW · TEST DATA"}</div>}
      <header className="racing-header">
        <div className="racing-wrap racing-header-row">
          <Link href={href("/")} aria-label="TrackDash">
            <Image className="racing-logo" src="/racing-studio/logo.webp" width={170} height={45} alt="TrackDash" priority />
          </Link>
          <CatalogSelector onOpen={() => setNavOpen(false)} />
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
          <button ref={navTrigger} type="button" className="racing-nav-toggle racing-chip" aria-label={it ? "Apri navigazione" : "Open navigation"} aria-expanded={navOpen} aria-controls="racing-navigation" onClick={() => setNavOpen(!navOpen)}><Menu size={20} aria-hidden="true" /></button>
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
          {racingCatalogs.map((gallery) => <div key={gallery.catalog}><strong>{gallery.title}</strong><Link href={href(gallery.catalog)}>{it ? "Catalogo" : "Catalog"}</Link><Link href={href(gallery.market)}>{it ? "Valori di mercato" : "Market values"}</Link></div>)}
          <div><strong>TrackDash</strong>{navItems.slice(1).map(([path, label]) => <Link key={path} href={href(path)}>{label}</Link>)}</div>
          <div><strong>{it ? "Account e informazioni" : "Account and information"}</strong><Link href={user ? "/dashboard" : "/login"}>{user ? (it ? "Il tuo account" : "Your account") : (it ? "Accedi" : "Sign in")}</Link><Link href={href("/privacy")}>Privacy</Link><Link href={href("/terms")}>{it ? "Condizioni d’uso" : "Terms of use"}</Link></div>
        </div>
        <p className="racing-wrap racing-footer-note">{it ? "In qualità di Affiliato Amazon io ricevo un guadagno dagli acquisti idonei." : "As an Amazon Associate I earn from qualifying purchases."}</p>
        <p className="racing-wrap racing-footer-note"><SpeedChampionsDisclaimer locale={locale} /></p>
      </footer>
    </div>
  )
}
