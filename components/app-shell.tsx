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
  MessageCircle,
  LogOut,
  User as UserIcon,
  Settings,
  LifeBuoy,
} from "lucide-react"
import { BrandMark } from "@/components/brand-mark"
import { LanguageSwitch } from "@/components/language-switch"
import { NotificationCenter } from "@/components/notification-center"
import { PwaInstallButton, PwaInstallMenuItem } from "@/components/pwa-install-menu-item"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getUnreadMessagingCountAction } from "@/lib/actions/messaging"
import { createClient } from "@/lib/supabase/client"
import { useStore } from "@/lib/store"
import { useI18n } from "@/lib/i18n"
import { initials } from "@/lib/format"
import { cn } from "@/lib/utils"

const DESKTOP_NAV = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/catalog", labelKey: "nav.catalog", icon: LibraryBig },
  { href: "/collection", labelKey: "nav.collection", icon: Boxes },
  { href: "/scanner", labelKey: "nav.scanner", icon: ScanLine },
  { href: "/messages", labelKey: "nav.messages", icon: MessageCircle },
]

const MOBILE_NAV = [
  { href: "/catalog", labelKey: "nav.catalog", icon: LibraryBig },
  { href: "/collection", labelKey: "nav.collection", icon: Boxes },
  { href: "/scanner", labelKey: "nav.scanner", icon: ScanLine },
  { href: "/messages", labelKey: "nav.messages", icon: MessageCircle },
  { href: "/profile", labelKey: "menu.profile", icon: UserIcon },
]

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard"
  if (href === "/catalog" && (pathname === "/market" || pathname.startsWith("/market/"))) return true
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
        compact ? "absolute -right-2 -top-2 min-w-4 h-4 px-1 text-[9px]" : "ml-1 min-w-5 h-5 px-1.5 text-[10px]",
      )}
    >
      {count > 9 ? "9+" : count}
    </span>
  )
}

const ACCOUNT_LINK_CLASS =
  "flex cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden select-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"

function UserMenu() {
  const { user, logout } = useStore()
  const { t, locale } = useI18n()
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
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex flex-col px-1.5 py-1 text-xs font-medium text-muted-foreground">
          <span className="truncate font-medium text-foreground">{user.username}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">{user.email}</span>
        </div>
        <DropdownMenuSeparator />
        <div className="flex flex-col gap-0.5" role="group">
          <Link href="/profile" className={ACCOUNT_LINK_CLASS} role="menuitem">
            <UserIcon />
            {t("menu.profile")}
          </Link>
          <Link href="/wishlist" className={ACCOUNT_LINK_CLASS} role="menuitem">
            <Heart />
            {t("nav.wishlist")}
          </Link>
          <Link href="/settings" className={ACCOUNT_LINK_CLASS} role="menuitem">
            <Settings />
            {t("menu.settings")}
          </Link>
          <Link href="/support" className={ACCOUNT_LINK_CLASS} role="menuitem">
            <LifeBuoy />
            {locale === "it" ? "Assistenza e suggerimenti" : "Support & suggestions"}
          </Link>
        </div>
        <DropdownMenuSeparator />
        <PwaInstallMenuItem />
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

type AppShellProps = {
  children: React.ReactNode
  contentMode?: "app" | "public"
}

export function AppShell({ children, contentMode = "app" }: AppShellProps) {
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
    <div className="min-h-svh bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 md:h-[72px] md:px-6 lg:px-8">
          <Link href="/dashboard" aria-label="TrackDash dashboard" className="shrink-0">
            <BrandMark />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {DESKTOP_NAV.map((item) => {
              const active = isActive(pathname, item.href)
              const isMessages = item.href === "/messages"
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors",
                    active ? "bg-brand-muted text-navy" : "text-muted-foreground hover:bg-white hover:text-navy",
                  )}
                >
                  <item.icon className="size-4" />
                  {t(item.labelKey)}
                  {isMessages ? <UnreadBadge count={unreadMessages} /> : null}
                  {active ? <span className="absolute inset-x-3 -bottom-[17px] h-0.5 bg-brand-red" /> : null}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-1.5">
            <LanguageSwitch className="hidden sm:inline-flex" />
            <LanguageSwitch compact className="sm:hidden" />
            <PwaInstallButton />
            <NotificationCenter />
            <UserMenu />
          </div>
        </div>
      </header>

      <main
        className={cn(
          contentMode === "app"
            ? "mx-auto w-full max-w-7xl px-4 pb-24 pt-6 md:px-6 md:pt-8 lg:px-8 lg:pb-12"
            : "w-full pb-24 lg:pb-12",
        )}
      >
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-border bg-white/96 pb-[max(env(safe-area-inset-bottom),0px)] backdrop-blur-md lg:hidden">
        {MOBILE_NAV.map((item) => {
          const active = isActive(pathname, item.href)
          const isMessages = item.href === "/messages"
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex min-h-16 flex-1 flex-col items-center justify-center gap-1 px-1 text-[10px] font-semibold transition-colors",
                active ? "text-brand" : "text-muted-foreground",
              )}
            >
              <span className="relative">
                <item.icon className="size-5" />
                {isMessages ? <UnreadBadge count={unreadMessages} compact /> : null}
              </span>
              <span className="max-w-[68px] truncate">{t(item.labelKey)}</span>
              {active ? <span className="absolute bottom-1.5 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-brand-red" /> : null}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
