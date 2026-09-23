"use client"

import { useI18n } from "@/lib/i18n"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

function normalizeMarketValueTitle(title: string | undefined, it: boolean): string {
  if (!title) return it ? "Valore di mercato stimato" : "Estimated market value"
  if (title === "Valore attuale stimato") return "Valore di mercato stimato"
  if (title === "Estimated current value") return "Estimated market value"
  return title
}

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
          {normalizeMarketValueTitle(title, it)}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <p className="text-xl font-semibold">{it ? "Dati di mercato in verifica" : "Market data under review"}</p>
        <p className="text-sm text-muted-foreground">{it ? "Non c'è ancora un riferimento di prezzo abbastanza chiaro da pubblicare." : "There is not yet a sufficiently clear price reference to publish."}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {it
            ? "TrackDash continuerà ad aggiornare questa Release quando arriveranno nuovi dati."
            : "TrackDash will keep updating this Release as new data arrives."}
        </p>
      </CardContent>
    </Card>
  )
}
