"use client"

import * as React from "react"
import Link from "next/link"
import { Bell, ChevronRight, Globe2, LogOut, MonitorCog, UserRound, WalletCards } from "lucide-react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { getMyProfileAction, updateMyProfileAction } from "@/lib/actions/profile"
import { useStore } from "@/lib/store"
import { CURRENCIES, type Currency } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

export function SettingsScreen() {
  const { user, logout } = useStore()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [currency, setCurrency] = React.useState<Currency>("EUR")
  const [loadingProfile, setLoadingProfile] = React.useState(true)
  const [savingCurrency, setSavingCurrency] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    getMyProfileAction()
      .then((profile) => {
        if (cancelled || !profile) return
        if (CURRENCIES.includes(profile.preferredCurrency as Currency)) {
          setCurrency(profile.preferredCurrency as Currency)
        }
      })
      .catch(() => {
        // Settings should remain usable even if the optional profile preference
        // cannot be loaded; EUR is the safe display default in the current app.
      })
      .finally(() => {
        if (!cancelled) setLoadingProfile(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  async function saveCurrency(next: Currency) {
    setCurrency(next)
    setSavingCurrency(true)
    try {
      await updateMyProfileAction({ preferredCurrency: next })
      toast.success("Preferred currency saved")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't save your currency")
    } finally {
      setSavingCurrency(false)
    }
  }

  async function handleLogout() {
    await logout()
    router.push("/login")
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Appearance, preferences and account settings.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MonitorCog className="size-4 text-muted-foreground" /> Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col">
          <SettingRow label="Theme" description="Choose light, dark or follow your device.">
            <Select value={theme ?? "system"} onValueChange={(v) => v && setTheme(v as string)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe2 className="size-4 text-muted-foreground" /> Language &amp; region
          </CardTitle>
          <CardDescription>Regional preferences for your TrackDash experience.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col">
          <SettingRow label="Language" description="English is active now. Italian is the next implementation step.">
            <div className="flex items-center gap-2">
              <Badge variant="outline">English</Badge>
              <Badge variant="secondary">Italiano next</Badge>
            </div>
          </SettingRow>
          <Separator />
          <SettingRow
            label="Preferred currency"
            description="Saved to your account. Market calculations currently remain EUR-based until conversion is enabled."
          >
            <Select
              value={currency}
              disabled={loadingProfile || savingCurrency}
              onValueChange={(v) => v && void saveCurrency(v as Currency)}
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="size-4 text-muted-foreground" /> Notifications
          </CardTitle>
          <CardDescription>Only settings backed by a real notification flow should be presented as active.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col">
          <ComingSoonRow label="Price movement alerts" description="Alert when a tracked release moves significantly." />
          <Separator />
          <ComingSoonRow label="Wishlist target alerts" description="Alert when real market data reaches your target price." />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserRound className="size-4 text-muted-foreground" /> Account
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          <Link
            href="/profile"
            className="flex items-center justify-between gap-4 rounded-lg px-1 py-3 text-sm hover:bg-muted/50"
          >
            <div>
              <p className="font-medium">Profile</p>
              <p className="text-xs text-muted-foreground">Edit username, country and view collector activity.</p>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
          <Separator />
          <div className="flex items-center justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">Email</p>
              <p className="truncate text-xs text-muted-foreground">{user?.email || "—"}</p>
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4 py-3">
            <div>
              <p className="text-sm font-medium">Sign out</p>
              <p className="text-xs text-muted-foreground">End this TrackDash session on this device.</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut data-icon="inline-start" /> Sign out
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="flex items-start gap-3 py-4 text-sm text-muted-foreground">
          <WalletCards className="mt-0.5 size-4 shrink-0" />
          <p>
            TrackDash currently uses indicative demo market values. Currency conversion, real price alerts and marketplace
            transactions will only be activated when backed by real market data.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm font-medium">{label}</span>
        <span className="max-w-2xl text-xs text-muted-foreground">{description}</span>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function ComingSoonRow({ label, description }: { label: string; description: string }) {
  return (
    <SettingRow label={label} description={description}>
      <Badge variant="secondary">Coming soon</Badge>
    </SettingRow>
  )
}
