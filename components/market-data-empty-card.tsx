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
        <p className="text-xl font-semibold">{it ? "Mercato raro" : "Thin market"}</p>
        <p className="text-sm text-muted-foreground">{it ? "Valore di mercato stimato non ancora disponibile" : "Estimated market value not available yet"}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {it
            ? "Ne possiedi una? Puoi metterla in vendita dalla tua collezione."
            : "Own one? You can list it for sale from your collection."}
        </p>
      </CardContent>
    </Card>
  )
}
