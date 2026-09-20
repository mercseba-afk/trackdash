"use client"

import * as React from "react"
import { CreditCard } from "lucide-react"
import { getMySubscriptionAction } from "@/lib/actions/account"
import { useI18n } from "@/lib/i18n"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type Subscription = Awaited<ReturnType<typeof getMySubscriptionAction>>

export function AccountPlanPanel() {
  const { locale } = useI18n()
  const it = locale === "it"
  const [subscription, setSubscription] = React.useState<Subscription>(null)

  React.useEffect(() => {
    let cancelled = false
    getMySubscriptionAction().then((value) => {
      if (!cancelled) setSubscription(value)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [])

  const plan = subscription?.plan ?? "free"
  const pro = plan === "pro"

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CreditCard className="size-4 text-muted-foreground" />
          {it ? "Piano TrackDash" : "TrackDash plan"}
        </CardTitle>
        <CardDescription>
          {it ? "La gestione Free/Pro è già collegata al tuo account; il checkout verrà attivato quando il piano Pro sarà disponibile." : "Free/Pro is already linked to your account; checkout will be enabled when Pro launches."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-lg font-semibold">{pro ? "TrackDash Pro" : "TrackDash Free"}</p>
            <Badge variant={pro ? "default" : "secondary"}>{pro ? subscription?.subscription_status ?? "active" : "Free"}</Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {pro
              ? (it ? "Il tuo stato di pagamento e rinnovo sarà gestito qui." : "Payment and renewal status will be managed here.")
              : (it ? "Fino a 50 Release nella Collection. Nessun addebito attivo." : "Up to 50 Releases in Collection. No billing is active.")}
          </p>
        </div>
        <Button disabled>
          {pro ? (it ? "Gestisci piano" : "Manage plan") : (it ? "Passa a Pro · in arrivo" : "Upgrade to Pro · coming soon")}
        </Button>
      </CardContent>
    </Card>
  )
}
