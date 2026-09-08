"use client"

import * as React from "react"
import Link from "next/link"
import { Bell, ChevronRight, Globe2, LogOut, MonitorCog, UserRound, WalletCards } from "lucide-react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { getMyProfileAction, updateMyProfileAction } from "@/lib/actions/profile"
import { useStore } from "@/lib/store"
import { useI18n, type AppLocale } from "@/lib/i18n"
import { CURRENCIES, type Currency } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

export function SettingsScreen() {
  const { user, logout } = useStore()
  const { locale, setLocale, t } = useI18n()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [currency, setCurrency] = React.useState<Currency>("EUR")
  const [loadingProfile, setLoadingProfile] = React.useState(true)
  const [savingCurrency, setSavingCurrency] = React.useState(false)
  const [savingLocale, setSavingLocale] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    getMyProfileAction()
      .then((profile) => {
        if (cancelled || !profile) return
        if (CURRENCIES.includes(profile.preferredCurrency as Currency)) {
          setCurrency(profile.preferredCurrency as Currency)
        }
      })
      .catch(() => {})
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
      toast.success(t("settings.currencySaved"))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("settings.currencyError"))
    } finally {
      setSavingCurrency(false)
    }
  }

  async function saveLocale(next: AppLocale) {
    const previous = locale
    setLocale(next)
    setSavingLocale(true)
    try {
      await updateMyProfileAction({ preferredLocale: next })
      toast.success(t("settings.languageSaved"))
    } catch (error) {
      setLocale(previous)
      toast.error(error instanceof Error ? error.message : t("settings.languageError"))
    } finally {
      setSavingLocale(false)
    }
  }

  async function handleLogout() {
    await logout()
    router.push("/login")
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("settings.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("settings.subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MonitorCog className="size-4 text-muted-foreground" /> {t("settings.appearance")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col">
          <SettingRow label={t("settings.theme")} description={t("settings.themeDesc")}>
            <Select value={theme ?? "system"} onValueChange={(v) => v && setTheme(v as string)}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="light">{t("settings.light")}</SelectItem>
                <SelectItem value="dark">{t("settings.dark")}</SelectItem>
                <SelectItem value="system">{t("settings.system")}</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe2 className="size-4 text-muted-foreground" /> {t("settings.languageRegion")}
          </CardTitle>
          <CardDescription>{t("settings.languageRegionDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col">
          <SettingRow label={t("settings.language")} description={t("settings.languageDesc")}>
            <Select value={locale} disabled={savingLocale} onValueChange={(v) => v && void saveLocale(v as AppLocale)}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">🇬🇧 {t("settings.english")}</SelectItem>
                <SelectItem value="it">🇮🇹 {t("settings.italian")}</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
          <Separator />
          <SettingRow label={t("settings.currency")} description={t("settings.currencyDesc")}>
            <Select value={currency} disabled={loadingProfile || savingCurrency} onValueChange={(v) => v && void saveCurrency(v as Currency)}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </SettingRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="size-4 text-muted-foreground" /> {t("settings.notifications")}
          </CardTitle>
          <CardDescription>{t("settings.notificationsDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col">
          <ComingSoonRow label={t("settings.priceAlerts")} description={t("settings.priceAlertsDesc")} text={t("settings.comingSoon")} />
          <Separator />
          <ComingSoonRow label={t("settings.wishlistAlerts")} description={t("settings.wishlistAlertsDesc")} text={t("settings.comingSoon")} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserRound className="size-4 text-muted-foreground" /> {t("settings.account")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          <Link href="/profile" className="flex items-center justify-between gap-4 rounded-lg px-1 py-3 text-sm hover:bg-muted/50">
            <div>
              <p className="font-medium">{t("settings.profile")}</p>
              <p className="text-xs text-muted-foreground">{t("settings.profileDesc")}</p>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
          <Separator />
          <div className="flex items-center justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">{t("settings.email")}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.email || "—"}</p>
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4 py-3">
            <div>
              <p className="text-sm font-medium">{t("menu.signOut")}</p>
              <p className="text-xs text-muted-foreground">{t("settings.signOutDesc")}</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut data-icon="inline-start" /> {t("menu.signOut")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="flex items-start gap-3 py-4 text-sm text-muted-foreground">
          <WalletCards className="mt-0.5 size-4 shrink-0" />
          <p>{t("settings.demoNotice")}</p>
        </CardContent>
      </Card>
    </div>
  )
}

function SettingRow({ label, description, children }: { label: string; description: string; children: React.ReactNode }) {
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

function ComingSoonRow({ label, description, text }: { label: string; description: string; text: string }) {
  return <SettingRow label={label} description={description}><Badge variant="secondary">{text}</Badge></SettingRow>
}
