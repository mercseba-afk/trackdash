"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { HandCoins, Loader2 } from "lucide-react"
import { startMarketplaceOfferAction } from "@/lib/actions/direct-offer"
import { formatMoney } from "@/lib/format"
import type { Currency } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

type OfferTarget = {
  username: string
  shareId: string
  askingPrice: number | null
  askingCurrency: Currency | null
}

function roundMoney(value: number, currency: Currency) {
  if (currency === "JPY") return Math.round(value)
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function DirectOfferDialog({
  target,
  onOpenChange,
  locale,
}: {
  target: OfferTarget | null
  onOpenChange: (open: boolean) => void
  locale: "it" | "en"
}) {
  const router = useRouter()
  const it = locale === "it"
  const [amount, setAmount] = React.useState("")
  const [currency, setCurrency] = React.useState<Currency>("EUR")
  const [sending, setSending] = React.useState(false)

  React.useEffect(() => {
    if (!target) return
    setCurrency(target.askingCurrency ?? "EUR")
    setAmount(target.askingPrice != null ? String(target.askingPrice) : "")
  }, [target])

  const numericAmount = Number(amount)
  const validAmount = Number.isFinite(numericAmount) && numericAmount > 0
  const displayAmount = validAmount ? formatMoney(roundMoney(numericAmount, currency), currency) : null

  function usePreset(multiplier: number) {
    if (!target?.askingPrice || !target.askingCurrency) return
    setCurrency(target.askingCurrency)
    setAmount(String(roundMoney(target.askingPrice * multiplier, target.askingCurrency)))
  }

  async function submit() {
    if (!target || !validAmount || sending) return
    setSending(true)
    try {
      const result = await startMarketplaceOfferAction(target.shareId, numericAmount, currency)
      toast.success(it ? `Offerta inviata: ${displayAmount}` : `Offer sent: ${displayAmount}`)
      onOpenChange(false)
      router.push(`/messages?conversation=${result.conversationId}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : it ? "Impossibile inviare l'offerta" : "Couldn't send offer")
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={Boolean(target)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="mb-1 flex size-11 items-center justify-center rounded-full bg-brand/10 text-brand">
            <HandCoins className="size-5" />
          </div>
          <DialogTitle className="text-xl">
            {it ? `Fai un'offerta a ${target?.username ?? ""}` : `Make an offer to ${target?.username ?? ""}`}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            {it
              ? "La trattativa si apre subito: non serve inviare prima un messaggio. Il venditore potrà accettare, rifiutare o controproporre."
              : "The deal opens immediately: no preliminary message is required. The seller can accept, decline, or counter."}
          </DialogDescription>
        </DialogHeader>

        {target?.askingPrice != null && target.askingCurrency ? (
          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{it ? "Prezzo richiesto" : "Asking price"}</p>
            <p className="mt-1 text-2xl font-semibold text-brand">{formatMoney(target.askingPrice, target.askingCurrency)}</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Button type="button" size="sm" onClick={() => usePreset(1)}>{it ? "Prezzo pieno" : "Full price"}</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => usePreset(0.9)}>-10%</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => usePreset(0.8)}>-20%</Button>
            </div>
          </div>
        ) : null}

        <div className="grid gap-2 sm:grid-cols-[1fr_110px]">
          <label className="grid gap-1.5 text-sm font-medium">
            {it ? "La tua offerta" : "Your offer"}
            <Input
              autoFocus
              type="number"
              min="0"
              step={currency === "JPY" ? "1" : "0.01"}
              value={amount}
              placeholder={it ? "Importo" : "Amount"}
              onChange={(event) => setAmount(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && validAmount && !sending) {
                  event.preventDefault()
                  void submit()
                }
              }}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            {it ? "Valuta" : "Currency"}
            <select
              className="h-9 rounded-md border bg-background px-3 text-sm"
              value={currency}
              onChange={(event) => setCurrency(event.target.value as Currency)}
            >
              {(["EUR", "USD", "JPY", "GBP"] as Currency[]).map((code) => <option key={code}>{code}</option>)}
            </select>
          </label>
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          {it
            ? "L'offerta da sola non diventa un dato di mercato: entrerà nella Price Intelligence solo se la vendita sarà conclusa e confermata da entrambi."
            : "The offer alone is not market evidence. It enters Price Intelligence only after the sale is completed and confirmed by both collectors."}
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>{it ? "Annulla" : "Cancel"}</Button>
          <Button className="gap-2" disabled={sending || !validAmount} onClick={() => void submit()}>
            {sending ? <Loader2 className="size-4 animate-spin" /> : <HandCoins className="size-4" />}
            {displayAmount ? (it ? `Invia offerta · ${displayAmount}` : `Send offer · ${displayAmount}`) : (it ? "Invia offerta" : "Send offer")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
