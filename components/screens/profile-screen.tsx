"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { CalendarDays, Globe, LogOut, Trophy } from "lucide-react"
import { useStore } from "@/lib/store"
import { enrichCollection, portfolioSummary } from "@/lib/analytics"
import { formatMoney, collectorLevel } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { CURRENCIES } from "@/lib/types"

export function ProfileScreen() {
  const { user, collection, wishlist, updateUser, logout } = useStore()
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  const enriched = React.useMemo(() => enrichCollection(collection), [collection])
  const summary = React.useMemo(() => portfolioSummary(enriched), [enriched])
  const level = collectorLevel(summary.uniqueProducts)

  const [username, setUsername] = React.useState(user?.username ?? "")
  const [country, setCountry] = React.useState(user?.country ?? "")
  const [currency, setCurrency] = React.useState("EUR")
  const [priceAlerts, setPriceAlerts] = React.useState(true)
  const [wishlistAlerts, setWishlistAlerts] = React.useState(true)

  React.useEffect(() => {
    setUsername(user?.username ?? "")
    setCountry(user?.country ?? "")
  }, [user])

  function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    updateUser({ username: username.trim() || user?.username, country })
    toast.success("Profile updated")
  }

  function handleLogout() {
    logout()
    router.push("/login")
  }

  const joined = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })
    : "—"

  return (
    <div className="flex flex-col gap-6">
      {/* Identity header */}
      <Card>
        <CardContent className="flex flex-col gap-5 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              <AvatarImage src={user?.avatarUrl} alt="" />
              <AvatarFallback className="bg-brand/10 text-lg font-semibold text-brand">
                {(user?.username ?? "MG").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold">{user?.username ?? "Collector"}</h1>
                <Badge variant="secondary" className="gap-1">
                  <Trophy className="size-3" />
                  {level.level}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Globe className="size-3" />
                  {user?.country || "Unknown"}
                </span>
                <span className="flex items-center gap-1">
                  <CalendarDays className="size-3" />
                  Joined {joined}
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center sm:gap-6">
            <Stat label="Models" value={String(summary.uniqueProducts)} />
            <Stat label="Items" value={String(summary.count)} />
            <Stat label="Value" value={formatMoney(summary.marketValue, "EUR")} />
          </div>
        </CardContent>
      </Card>

      {/* Collector level progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Collector level</CardTitle>
          <CardDescription>
            {level.level} · {summary.uniqueProducts} unique models catalogued
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Progress value={level.progress} />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{level.level}</span>
            {level.next ? (
              <span>
                {level.toNext} more to {level.next}
              </span>
            ) : (
              <span>Top level reached</span>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
            <CardDescription>How you appear in the app.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveProfile} className="flex flex-col gap-5">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="p-username">Username</FieldLabel>
                  <Input id="p-username" value={username} onChange={(e) => setUsername(e.target.value)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="p-country">Country</FieldLabel>
                  <Input id="p-country" value={country} onChange={(e) => setCountry(e.target.value)} />
                </Field>
              </FieldGroup>
              <div>
                <Button type="submit">Save changes</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preferences</CardTitle>
            <CardDescription>Display and notification settings.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            <SettingRow label="Theme" description="Light or dark appearance">
              <Select value={theme ?? "system"} onValueChange={(v) => setTheme(v as string)}>
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
            <Separator />
            <SettingRow label="Display currency" description="For values and targets">
              <Select value={currency} onValueChange={(v) => setCurrency(v as string)}>
                <SelectTrigger className="w-32">
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
            <Separator />
            <SettingRow label="Price movement alerts" description="Notify on big market swings">
              <Switch checked={priceAlerts} onCheckedChange={setPriceAlerts} />
            </SettingRow>
            <Separator />
            <SettingRow label="Wishlist target alerts" description="Notify when items hit target">
              <Switch checked={wishlistAlerts} onCheckedChange={setWishlistAlerts} />
            </SettingRow>
          </CardContent>
        </Card>
      </div>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
          <CardDescription>
            {collection.length} collection entries · {wishlist.length} wishlist entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut data-icon="inline-start" />
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-lg font-semibold tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
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
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
      {children}
    </div>
  )
}
