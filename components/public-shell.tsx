"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Menu, ScanLine, X } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { BrandMark } from "@/components/brand-mark"
import { LanguageSwitch } from "@/components/language-switch"
import { PwaInstallButton } from "@/components/pwa-install-menu-item"
import { Spinner } from "@/components/ui/spinner"
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
  const router = useRouter()
  const [menuOpen, setMenuOpen] = React.useState(false)
  const currentPath = pathname || "/"
  const loginHref = `/login?next=${encodeURIComponent(currentPath)}`
  const scannerHref = user ? "/scanner" : "/login?next=%2Fscanner"
  const supportHref = user ? "/support" : "/login?next=%2Fsupport"

  React.useEffect(() => {
    if (user && currentPath === "/") router.replace("/dashboard")
  }, [currentPath, router, user])

  if (user && currentPath === "/") {
    return (
      <div className="grid min-h-svh place-items-center bg-background">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    )
  }

  if (user) {
    return <AppShell contentMode="public">{children}</AppShell>
  }

  const copy = locale === "it"
    ? {
        catalog: "Catalogo",
        price: "Valori di mercato",
        scanner: "Scanner",
        how: "Come funziona",
        dashboard: "Dashboard",
        myCollection: "La mia collezione",
        collection: "Collezione",
        signIn: "Accedi",
        exploreCatalog: "Esplora catalogo",
        footerTagline: "Catalogo per Release, collezione personale, scanner e valori di mercato per collezionisti Mini 4WD.",
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
        price: "Market values",
        scanner: "Scanner",
        how: "How it works",
        dashboard: "Dashboard",
        myCollection: "My collection",
        collection: "Collection",
        signIn: "Sign in",
        exploreCatalog: "Explore catalog",
        footerTagline: "Release-level catalog, personal collection, scanner and market values for Mini 4WD collectors.",
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
                href={loginHref}
                className="rounded-md border border-border px-3 py-2.5 text-center text-navy"
                onClick={() => setMenuOpen(false)}
              >
                {copy.signIn}
              </Link>
              <Link
                href="/catalog"
                className="rounded-md bg-brand px-3 py-2.5 text-center text-white"
                onClick={() => setMenuOpen(false)}
              >
                {copy.catalog}
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
              <Link href="/login?next=%2Fcollection" className={FOOTER_LINK_CLASS}>{copy.collection}</Link>
              <Link href="/login?next=%2Fwishlist" className={FOOTER_LINK_CLASS}>{copy.wishlist}</Link>
              <Link href="/login?next=%2Fmessages" className={FOOTER_LINK_CLASS}>{copy.messages}</Link>
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
