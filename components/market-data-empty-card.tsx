"use client"

import { useI18n } from "@/lib/i18n"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function MarketDataEmptyCard({
  title,
  msrp: _msrp,
}: {
  title?: string
  msrp?: number
}) {
  const { locale } = useI18n()
  const it = locale === "it"

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title ?? (it ? "Valore attuale stimato" : "Estimated current value")}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <p className="text-xl font-semibold">{it ? "Valore in elaborazione" : "Value being calculated"}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {it
            ? "Stiamo raccogliendo abbastanza dati reali per pubblicare valore e andamento di questa release."
            : "We are gathering enough real market data to publish this release's value and movement."}
        </p>
      </CardContent>
    </Card>
  )
}
