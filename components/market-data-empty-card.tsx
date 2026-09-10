"use client"

import { useI18n } from "@/lib/i18n"
import { formatMoney } from "@/lib/format"
import { ConfidenceBadge } from "@/components/market-bits"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function MarketDataEmptyCard({
  title,
  msrp,
}: {
  title?: string
  msrp?: number
}) {
  const { locale } = useI18n()
  const it = locale === "it"

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm text-muted-foreground">
          {title ?? (it ? "Valore di mercato" : "Market value")}
        </CardTitle>
        <ConfidenceBadge confidence="Insufficient" />
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <p className="text-lg font-semibold">{it ? "Dati mercato in arrivo" : "Market data coming soon"}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {it
            ? "Qui vengono pubblicati solo dati R3 supportati da evidenze reali della release. Nessun prezzo o trend sintetico viene mostrato."
            : "Only R3 data backed by real release evidence is published here. No synthetic price or trend is shown."}
        </p>
        {msrp != null ? <p className="text-xs text-muted-foreground">MSRP {formatMoney(msrp)}</p> : null}
      </CardContent>
    </Card>
  )
}
