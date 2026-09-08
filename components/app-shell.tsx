"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  LibraryBig,
  Boxes,
  Heart,
  ScanLine,
  TrendingUp,
  MessageCircle,
  Moon,
  Sun,
  LogOut,
  User as UserIcon,
  Settings,
} from "lucide-react"
import { useTheme } from "next-themes"
import { BrandMark } from "@/components/brand-mark"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getUnreadMessagingCountAction } from "@/lib/actions/messaging"
import { createClient } from "@/lib/supabase/client"
import { useStore } from "@/lib/store"
import { useI18n } from "@/lib/i18n"
import { initials } from "@/lib/format"
import { cn } from "@/lib/utils"

const NAV = [
  { href: "/", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/catalog", labelKey: "nav.catalog", icon: LibraryBig },
  { href: "/collection", labelKey: "nav.collection", icon: Boxes },
  { href: "/wishlist", labelKey: "nav.wishlist", icon: Heart },
  { href: "/messages", labelKey: "nav.messages", icon: MessageCircle },
  { href: "/scanner", labelKey: "nav.scanner", icon: ScanLine },
  { href: "/market", labelKey: "nav.market", icon: TrendingUp },
]

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(href + "/")
}

function UnreadBadge({ count, compact = false }: { count: number; compact?: boolean }) {
  const { locale } = useI18n()
  if (count <= 0) return null
  return (
    <span
      aria-label={locale === "it" ? `${count} messaggi non letti` : `${count} unread message${count === 1 ? "" : "s"}`}
      className={cn(
        "flex items-center justify-center rounded-full bg-destructive font-semibold leading-none text-white shadow-sm",
        compact ? "absolute -right-2 -top-2 min-w-4 h-4 px-1 text-[9px]" : "ml-auto min-w-5 h-5 px-1.5 text-[10px]",
      )}
    >
      {count > 9 ? "9+" : count}
    </span>
  )
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const { locale } = useI18n()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  const dark = resolvedTheme === "dark"
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={locale === "it" ? "Cambia tema" : "Toggle theme"}
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      {mounted && dark ? <Sun /> : <Moon />}
    </Button>
  )
}

function UserMenu() {
  const { user, logout } = useStore()
  const { t } = useI18n()
  const router = useRouter()
  if (!user) {
    return (
      <Button size="sm" onClick={() => router.push("/login")}>
        {t("menu.signIn")}
      </Button>
    )
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar className="size-8">
              <AvatarFallback className="bg-brand text-brand-foreground text-xs">
                {initials(user.username)}
              </AvatarFallback>
            </Avatar>
          </button>
        }
      />
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="flex flex-col">
          <span className="truncate font-medium">{user.username}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {/* Native anchors intentionally bypass Next.js client routing so these
              account destinations always perform a fresh document request. */}
          <DropdownMenuItem render={<a href="/profile" />}>
            <UserIcon />
            {t("menu.profile")}
          </DropdownMenuItem>
          <DropdownMenuItem render={<a href="/settings" />}>
            <Settings />
            {t("menu.settings")}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={async () => {
            await logout()
            router.push("/login")
          }}
        >
          <LogOut />
          {t("menu.signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user } = useStore()
  const { t } = useI18n()
  const [unreadMessages, setUnreadMessages] = React.useState(0)

  const refreshUnread = React.useCallback(async () => {
    if (!user) {
      setUnreadMessages(0)
      return
    }
    try {
      setUnreadMessages(await getUnreadMessagingCountAction())
    } catch {
      // A notification badge should never make the app shell fail.
    }
  }, [user])

  React.useEffect(() => {
    if (!user) {
      setUnreadMessages(0)
      return
    }

    void refreshUnread()
    const supabase = createClient()
    const channel = supabase
      .channel(`messaging-badge:${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => void refreshUnread())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "conversations" }, () => void refreshUnread())
      .subscribe()

    const refreshOnFocus = () => void refreshUnread()
    const refreshOnRead = () => void refreshUnread()
    window.addEventListener("focus", refreshOnFocus)
    window.addEventListener("trackdash:messaging-read", refreshOnRead)

    return () => {
      window.removeEventListener("focus", refreshOnFocus)
      window.removeEventListener("trackdash:messaging-read", refreshOnRead)
      void supabase.removeChannel(channel)
    }
  }, [refreshUnread, user])

  return (
    <div className="min-h-svh bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-sidebar lg:flex">
        <div className="flex h-16 items-center px-5">
          <Link href="/" aria-label="Mini 4WD Collector home">
            <BrandMark />
          </Link>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href)
            const isMessages = item.href === "/messages"
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-brand/10 text-brand" : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <item.icon className="size-4" />
                {t(item.labelKey)}
                {isMessages ? <UnreadBadge count={unreadMessages} /> : null}
              </Link>
            )
          })}
        </nav>
        <div className="border-t border-border p-3 text-[10px] leading-relaxed text-muted-foreground">
          {t("shell.demoNotice")}
        </div>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/80 px-4 backdrop-blur md:px-6">
          <Link href="/" className="lg:hidden" aria-label="Mini 4WD Collector home">
            <BrandMark showText={false} />
          </Link>
          <div className="hidden text-sm text-muted-foreground lg:block">
            {(() => {
              const active = NAV.find((n) => isActive(pathname, n.href))
              return active ? t(active.labelKey) : ""
            })()}
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <UserMenu />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 md:px-6 lg:pb-10">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-stretch justify-around border-t border-border bg-background/95 backdrop-blur lg:hidden">
        {NAV.map((item) => {
          const active = isActive(pathname, item.href)
          const isMessages = item.href === "/messages"
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors",
                active ? "text-brand" : "text-muted-foreground",
              )}
            >
              <span className="relative">
                <item.icon className="size-5" />
                {isMessages ? <UnreadBadge count={unreadMessages} compact /> : null}
              </span>
              {t(item.labelKey)}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
