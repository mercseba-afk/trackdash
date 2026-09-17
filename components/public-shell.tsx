"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Boxes, LayoutDashboard, Menu, ScanLine, X } from "lucide-react"
import { BrandMark } from "@/components/brand-mark"
import { PwaInstallButton } from "@/components/pwa-install-menu-item"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

const PUBLIC_NAV = [
  { href: "/catalog", label: "Catalog" },
  { href: "/market", label: "Price Intelligence" },
]

export function PublicShell({ children }: { children: React.ReactNode }) {
  const { user } = useStore()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = React.useState(false)
  const currentPath = pathname || "/"
  const loginHref = `/login?next=${encodeURIComponent(currentPath)}`
  const scannerHref = user ? "/scanner" : "/login?next=%2Fscanner"
  const supportHref = user ? "/support" : "/login?next=%2Fsupport"

  return (
    <div className="min-h-svh bg-[#f7f9fc] text-[#081a3a]">
      <header className="sticky top-0 z-50 border-b border-[#dbe4ef] bg-[#f7f9fc]/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-6 px-4 md:px-6 lg:px-8">
          <Link href="/" aria-label="TrackDash home" className="shrink-0">
            <BrandMark />
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-[#41536d] md:flex">
            {PUBLIC_NAV.map((item) => (
              <Link key={item.href} href={item.href} className="transition-colors hover:text-[#0f4bb4]">
                {item.label}
              </Link>
            ))}
            <Link href={scannerHref} className="transition-colors hover:text-[#0f4bb4]">
              Scanner
            </Link>
            <Link href="/#how-it-works" className="transition-colors hover:text-[#0f4bb4]">
              How it works
            </Link>
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <PwaInstallButton />
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold text-[#123f8f] transition-colors hover:bg-[#e8f0fd]"
                >
                  <LayoutDashboard className="size-4" /> Dashboard
                </Link>
                <Link
                  href="/collection"
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-[#1558e8] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0e49c7]"
                >
                  <Boxes className="size-4" /> My collection
                </Link>
              </>
            ) : (
              <>
                <Link
                  href={loginHref}
                  className="rounded-md px-3 py-2 text-sm font-semibold text-[#123f8f] transition-colors hover:bg-[#e8f0fd]"
                >
                  Sign in
                </Link>
                <Link
                  href="/catalog"
                  className="inline-flex h-10 items-center rounded-md bg-[#1558e8] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0e49c7]"
                >
                  Explore catalog →
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-1 md:hidden">
            <PwaInstallButton />
            <button
              type="button"
              className="inline-flex size-10 items-center justify-center rounded-md border border-[#d4dfed] bg-white text-[#153d7d]"
              aria-label={menuOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((value) => !value)}
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        <div
          className={cn(
            "border-t border-[#dbe4ef] bg-white md:hidden",
            menuOpen ? "block" : "hidden",
          )}
        >
          <nav className="mx-auto flex max-w-7xl flex-col px-4 py-3 text-sm font-semibold text-[#24446f]">
            {PUBLIC_NAV.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-md px-2 py-3" onClick={() => setMenuOpen(false)}>
                {item.label}
              </Link>
            ))}
            <Link href={scannerHref} className="flex items-center gap-2 rounded-md px-2 py-3" onClick={() => setMenuOpen(false)}>
              <ScanLine className="size-4" /> Scanner
            </Link>
            <Link href="/#how-it-works" className="rounded-md px-2 py-3" onClick={() => setMenuOpen(false)}>
              How it works
            </Link>
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-[#e2e8f0] pt-3">
              <Link
                href={user ? "/dashboard" : loginHref}
                className="rounded-md border border-[#d4dfed] px-3 py-2.5 text-center"
                onClick={() => setMenuOpen(false)}
              >
                {user ? "Dashboard" : "Sign in"}
              </Link>
              <Link
                href={user ? "/collection" : "/catalog"}
                className="rounded-md bg-[#1558e8] px-3 py-2.5 text-center text-white"
                onClick={() => setMenuOpen(false)}
              >
                {user ? "Collection" : "Catalog"}
              </Link>
            </div>
          </nav>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-[#dbe4ef] bg-white">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 md:grid-cols-[1.2fr_2fr] md:px-6 lg:px-8">
          <div>
            <BrandMark />
            <p className="mt-3 max-w-sm text-sm leading-6 text-[#617087]">
              The digital home for Mini 4WD collectors: exact Releases, Collection, Scanner and honest market context.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6 text-sm sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7a899e]">Explore</span>
              <Link href="/catalog">Catalog</Link>
              <Link href="/market">Price Intelligence</Link>
              <Link href={scannerHref}>Scanner</Link>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7a899e]">Account</span>
              <Link href={user ? "/collection" : "/login?next=%2Fcollection"}>Collection</Link>
              <Link href={user ? "/wishlist" : "/login?next=%2Fwishlist"}>Wishlist</Link>
              <Link href={user ? "/messages" : "/login?next=%2Fmessages"}>Messages</Link>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7a899e]">TrackDash</span>
              <Link href="/#how-it-works">How it works</Link>
              <Link href={supportHref}>Support</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
