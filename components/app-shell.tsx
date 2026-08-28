"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Boxes,
  Heart,
  Search,
  ScanLine,
  TrendingUp,
  Menu,
  Moon,
  Sun,
} from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useStore } from "@/lib/store"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { initials } from "@/lib/format"

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/collection", label: "My Collection", icon: Boxes },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/browse", label: "Catalog", icon: Search },
  { href: "/add", label: "Add / Scan", icon: ScanLine },
  { href: "/insights", label: "Insights", icon: TrendingUp },
]

function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span className="flex size-7 items-center justify-center rounded-md bg-brand font-mono text-sm font-bold text-brand-foreground">
        4
      </span>
      <span className="text-sm font-semibold leading-tight">
        Mini 4WD<span className="text-muted-foreground"> Collector</span>
      </span>
    </Link>
  )
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-brand/10 text-brand"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      {mounted && resolvedTheme === "dark" ? <Sun /> : <Moon />}
    </Button>
  )
}

function UserChip() {
  const { user } = useStore()
  if (!user) return null
  return (
    <Link
      href="/collection"
      className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-muted"
    >
      <Avatar className="size-7">
        <AvatarFallback className="bg-brand/15 text-xs text-brand">
          {initials(user.username)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 leading-tight">
        <p className="truncate text-xs font-medium">{user.username}</p>
        <p className="truncate text-[10px] text-muted-foreground">{user.country}</p>
      </div>
    </Link>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  return (
    <div className="flex min-h-svh flex-col lg:flex-row">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-r bg-sidebar px-3 py-4 lg:flex">
        <div className="px-2">
          <Wordmark />
        </div>
        <div className="mt-6 flex-1">
          <NavLinks />
        </div>
        <div className="flex items-center justify-between border-t pt-3">
          <UserChip />
          <ThemeToggle />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-background/80 px-4 py-3 backdrop-blur lg:hidden">
        <Wordmark />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Menu" />}>
              <Menu />
            </SheetTrigger>
            <SheetContent side="right" className="w-64 p-4">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="mb-6">
                <Wordmark />
              </div>
              <NavLinks onNavigate={() => setOpen(false)} />
              <div className="mt-6 border-t pt-3">
                <UserChip />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  )
}
