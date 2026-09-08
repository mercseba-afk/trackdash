"use client"

import * as React from "react"
import Link from "next/link"
import { Boxes, CalendarDays, ExternalLink, Globe, Handshake, Heart, Settings, Trophy } from "lucide-react"
import { useStore } from "@/lib/store"
import { useI18n } from "@/lib/i18n"
import { enrichCollection, portfolioSummary } from "@/lib/analytics"
import { collectorLevel, formatMoney } from "@/lib/format"
import { getMyCollectionSharesAction } from "@/lib/actions/sharing"
import { updateMyProfileAction } from "@/lib/actions/profile"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"

type MyShare = Awaited<ReturnType<typeof getMyCollectionSharesAction>>[number]

export function ProfileScreen() {
  const { user, collection, wishlist, updateUser } = useStore()
  const { locale, t } = useI18n()
  const enriched = React.useMemo(() => enrichCollection(collection), [collection])
  const summary = React.useMemo(() => portfolioSummary(enriched), [enriched])
  const level = collectorLevel(summary.uniqueProducts)

  const [shares, setShares] = React.useState<MyShare[]>([])
  const [username, setUsername] = React.useState(user?.username ?? "")
  const [country, setCountry] = React.useState(user?.country ?? "")
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    setUsername(user?.username ?? "")
    setCountry(user?.country ?? "")
  }, [user])

  React.useEffect(() => {
    let cancelled = false
    getMyCollectionSharesAction()
      .then((rows) => {
        if (!cancelled) setShares(rows)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const offers = shares.filter((share) => share.shareMode === "open_to_offers").length
  const joined = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(locale === "it" ? "it-IT" : "en-GB", { month: "long", year: "numeric" })
    : "—"

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await updateMyProfileAction({ username, country })
      if (!updated) throw new Error("Collector profile not found")
      updateUser({
        username: updated.username,
        country: updated.country ?? "",
        avatarUrl: updated.avatarUrl ?? undefined,
      })
      setUsername(updated.username)
      setCountry(updated.country ?? "")
      toast.success(t("profile.updated"))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("profile.updateError"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-5 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar className="size-16 shrink-0">
              <AvatarImage src={user?.avatarUrl} alt="" />
              <AvatarFallback className="bg-brand/10 text-lg font-semibold text-brand">
                {(user?.username ?? "MG").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-2xl font-semibold tracking-tight">{user?.username ?? "Collector"}</h1>
                <Badge variant="secondary" className="gap-1"><Trophy className="size-3" /> {level.level}</Badge>
              </div>
              <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Globe className="size-3" /> {user?.country || t("profile.countryUnset")}</span>
                <span className="flex items-center gap-1"><CalendarDays className="size-3" /> {t("profile.joined", { date: joined })}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {shares.length > 0 && user?.username ? (
              <Button variant="outline" render={<Link href={`/collectors/${encodeURIComponent(user.username)}`} />}>
                <ExternalLink data-icon="inline-start" /> {t("profile.viewPublic")}
              </Button>
            ) : (
              <Button variant="outline" render={<Link href="/collection" />}>
                <Boxes data-icon="inline-start" /> {t("profile.shareItem")}
              </Button>
            )}
            <Button variant="outline" render={<Link href="/settings" />}>
              <Settings data-icon="inline-start" /> {t("menu.settings")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <ProfileStat label={t("profile.models")} value={String(summary.uniqueProducts)} icon={Boxes} />
        <ProfileStat label={t("profile.items")} value={String(summary.count)} icon={Boxes} />
        <ProfileStat label={t("profile.shared")} value={String(shares.length)} icon={Globe} />
        <ProfileStat label={t("profile.offers")} value={String(offers)} icon={Handshake} />
        <ProfileStat label={t("profile.wishlist")} value={String(wishlist.length)} icon={Heart} />
        <ProfileStat label={t("profile.value")} value={formatMoney(summary.marketValue)} icon={Trophy} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("profile.editTitle")}</CardTitle>
            <CardDescription>{t("profile.editDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveProfile} className="flex flex-col gap-5">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="p-username">{t("profile.username")}</FieldLabel>
                  <Input id="p-username" value={username} onChange={(e) => setUsername(e.target.value)} minLength={3} maxLength={30} autoComplete="username" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="p-country">{t("profile.country")}</FieldLabel>
                  <Input id="p-country" value={country} onChange={(e) => setCountry(e.target.value)} maxLength={80} placeholder={t("profile.countryPlaceholder")} />
                </Field>
              </FieldGroup>
              <div><Button type="submit" disabled={saving}>{saving ? t("common.saving") : t("common.save")}</Button></div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("profile.level")}</CardTitle>
            <CardDescription>{t("profile.uniqueModels", { level: level.level, count: summary.uniqueProducts })}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Progress value={level.progress} />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{level.level}</span>
              {level.next ? <span>{t("profile.moreTo", { count: level.toNext, level: level.next })}</span> : <span>{t("profile.topLevel")}</span>}
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
              {shares.length > 0
                ? t("profile.publicSummary", {
                    shared: shares.length,
                    offers,
                    itemWord: locale === "it" ? (shares.length === 1 ? "modello" : "modelli") : (shares.length === 1 ? "item" : "items"),
                  })
                : t("profile.privateSummary")}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ProfileStat({ label, value, icon: Icon }: { label: string; value: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Card className="py-0">
      <CardContent className="flex items-center gap-3 px-3 py-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground"><Icon className="size-4" /></span>
        <div className="min-w-0"><p className="truncate text-xs text-muted-foreground">{label}</p><p className="truncate font-semibold tabular-nums">{value}</p></div>
      </CardContent>
    </Card>
  )
}
