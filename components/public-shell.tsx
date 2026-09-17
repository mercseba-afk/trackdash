"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Boxes, LayoutDashboard, Menu, ScanLine, X } from "lucide-react"
import { BrandMark } from "@/components/brand-mark"
import { LanguageSwitch } from "@/components/language-switch"
import { PwaInstallButton } from "@/components/pwa-install-menu-item"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

const PUBLIC_NAV = [
  { href: "/catalog", key: "catalog" as const },
  { href: "/market", key: "price" as const },
]

const BRAND_HOME_LINK_CLASS =
  "-m-1 inline-flex shrink-0 rounded-md p-1 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"

const FOOTER_LINK_CLASS =
  "-mx-2 inline-flex min-h-10 items-center rounded-md px-2 text-foreground transition-colors hover:bg-brand-muted hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"

export function PublicShell({ children }: { children: React.ReactNode }) {
  const { user } = useStore()
  const { locale } = useI18n()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = React.useState(false)
  const currentPath = pathname || "/"
  const loginHref = `/login?next=${encodeURIComponent(currentPath)}`
  const scannerHref = user ? "/scanner" : "/login?next=%2Fscanner"
  const supportHref = user ? "/support" : "/login?next=%2Fsupport"

  const copy = locale === "it"
    ? {
        catalog: "Catalogo",
        price: "Price Intelligence",
        scanner: "Scanner",
        how: "Come funziona",
        dashboard: "Dashboard",
        myCollection: "La mia collezione",
        collection: "Collezione",
        signIn: "Accedi",
        exploreCatalog: "Esplora catalogo",
        footerTagline: "La casa digitale dei collezionisti Mini 4WD: Release esatte, Collezione, Scanner e contesto di mercato trasparente.",
        explore: "Esplora",
        account: "Account",
        wishlist: "Desideri",
        messages: "Messaggi",
        support: "Assistenza",
        openNav: "Apri navigazione",
        closeNav: "Chiudi navigazione",
      }
    : {
        catalog: "Catalog",
        price: "Price Intelligence",
        scanner: "Scanner",
        how: "How it works",
        dashboard: "Dashboard",
        myCollection: "My collection",
        collection: "Collection",
        signIn: "Sign in",
        exploreCatalog: "Explore catalog",
        footerTagline: "The digital home for Mini 4WD collectors: exact Releases, Collection, Scanner and honest market context.",
        explore: "Explore",
        account: "Account",
        wishlist: "Wishlist",
        messages: "Messages",
        support: "Support",
        openNav: "Open navigation",
        closeNav: "Close navigation",
      }

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-5 px-4 md:h-[72px] md:px-6 lg:px-8">
          <Link href="/" aria-label="TrackDash home" className={BRAND_HOME_LINK_CLASS}>
            <BrandMark />
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
            {PUBLIC_NAV.map((item) => {
              const active = currentPath === item.href || currentPath.startsWith(`${item.href}/`)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative py-2 transition-colors hover:text-navy",
                    active && "text-navy after:absolute after:inset-x-0 after:-bottom-[22px] after:h-0.5 after:bg-brand-red",
                  )}
                >
                  {copy[item.key]}
                </Link>
              )
            })}
            <Link href={scannerHref} className="py-2 transition-colors hover:text-navy">
              {copy.scanner}
            </Link>
            <Link href="/#how-it-works" className="py-2 transition-colors hover:text-navy">
              {copy.how}
            </Link>
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <LanguageSwitch />
            <PwaInstallButton />
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold text-navy transition-colors hover:bg-brand-muted"
                >
                  <LayoutDashboard className="size-4" /> {copy.dashboard}
                </Link>
                <Link
                  href="/collection"
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-brand px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0e49c7]"
                >
                  <Boxes className="size-4" /> {copy.myCollection}
                </Link>
              </>
            ) : (
              <>
                <Link
                  href={loginHref}
                  className="rounded-md px-3 py-2 text-sm font-semibold text-navy transition-colors hover:bg-brand-muted"
                >
                  {copy.signIn}
                </Link>
                <Link
                  href="/catalog"
                  className="inline-flex h-10 items-center rounded-md bg-brand px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0e49c7]"
                >
                  {copy.exploreCatalog} →
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5 md:hidden">
            <LanguageSwitch compact />
            <PwaInstallButton />
            <button
              type="button"
              className="inline-flex size-10 items-center justify-center rounded-md border border-border bg-white text-navy transition-colors hover:bg-brand-muted"
              aria-label={menuOpen ? copy.closeNav : copy.openNav}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((value) => !value)}
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        <div className={cn("border-t border-border bg-white md:hidden", menuOpen ? "block" : "hidden")}>
          <nav className="mx-auto flex max-w-7xl flex-col px-4 py-3 text-sm font-semibold text-[#24446f]">
            {PUBLIC_NAV.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-md px-2 py-3" onClick={() => setMenuOpen(false)}>
                {copy[item.key]}
              </Link>
            ))}
            <Link href={scannerHref} className="flex items-center gap-2 rounded-md px-2 py-3" onClick={() => setMenuOpen(false)}>
              <ScanLine className="size-4" /> {copy.scanner}
            </Link>
            <Link href="/#how-it-works" className="rounded-md px-2 py-3" onClick={() => setMenuOpen(false)}>
              {copy.how}
            </Link>
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-border pt-3">
              <Link
                href={user ? "/dashboard" : loginHref}
                className="rounded-md border border-border px-3 py-2.5 text-center text-navy"
                onClick={() => setMenuOpen(false)}
              >
                {user ? copy.dashboard : copy.signIn}
              </Link>
              <Link
                href={user ? "/collection" : "/catalog"}
                className="rounded-md bg-brand px-3 py-2.5 text-center text-white"
                onClick={() => setMenuOpen(false)}
              >
                {user ? copy.collection : copy.catalog}
              </Link>
            </div>
          </nav>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-border bg-white">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 md:grid-cols-[1.2fr_2fr] md:px-6 lg:px-8">
          <div>
            <Link href="/" aria-label="TrackDash home" className={BRAND_HOME_LINK_CLASS}>
              <BrandMark />
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">{copy.footerTagline}</p>
          </div>
          <div className="grid grid-cols-2 gap-6 text-sm sm:grid-cols-3">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{copy.explore}</span>
              <Link href="/catalog" className={FOOTER_LINK_CLASS}>{copy.catalog}</Link>
              <Link href="/market" className={FOOTER_LINK_CLASS}>{copy.price}</Link>
              <Link href={scannerHref} className={FOOTER_LINK_CLASS}>{copy.scanner}</Link>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{copy.account}</span>
              <Link href={user ? "/collection" : "/login?next=%2Fcollection"} className={FOOTER_LINK_CLASS}>{copy.collection}</Link>
              <Link href={user ? "/wishlist" : "/login?next=%2Fwishlist"} className={FOOTER_LINK_CLASS}>{copy.wishlist}</Link>
              <Link href={user ? "/messages" : "/login?next=%2Fmessages"} className={FOOTER_LINK_CLASS}>{copy.messages}</Link>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">TrackDash</span>
              <Link href="/#how-it-works" className={FOOTER_LINK_CLASS}>{copy.how}</Link>
              <Link href={supportHref} className={FOOTER_LINK_CLASS}>{copy.support}</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
