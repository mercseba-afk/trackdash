"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Check, ChevronRight, Boxes } from "lucide-react"
import { useStore } from "@/lib/store"
import { useI18n } from "@/lib/i18n"
import { PRODUCTS, primaryRelease } from "@/lib/data/products"
import { BrandMark } from "@/components/brand-mark"
import { ProductImage } from "@/components/catalog/product-image"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const STARTER_PICKS = (() => {
  const preferred = PRODUCTS.filter((p) => p.series === "Fully Cowled" || p.series === "Let's & Go")
  const rest = PRODUCTS.filter((p) => !preferred.includes(p))
  return [...preferred, ...rest].slice(0, 6)
})()

export function OnboardingScreen() {
  const router = useRouter()
  const { addToCollection, user } = useStore()
  const { locale } = useI18n()
  const it = locale === "it"
  const [step, setStep] = React.useState(0)
  const [focus, setFocus] = React.useState<string[]>([])
  const [picks, setPicks] = React.useState<string[]>([])
  const [finishing, setFinishing] = React.useState(false)

  const focusOptions = [
    { id: "vintage", label: it ? "Vintage e rari" : "Vintage & rare", desc: it ? "Cerca grail e kit fuori produzione" : "Chase grails and out-of-production kits" },
    { id: "racing", label: it ? "Gare attive" : "Active racing", desc: it ? "Monta, prepara e porta i modelli in pista" : "Build, tune and run on the track" },
    { id: "display", label: it ? "Display e sigillati" : "Display & sealed", desc: it ? "Conserva scatole e kit in condizioni perfette" : "Keep boxes pristine and shelved" },
    { id: "complete", label: it ? "Completista di serie" : "Series completionist", desc: it ? "Completa intere linee e serie" : "Finish whole lineups end to end" },
  ]
  const steps = it ? ["Benvenuto", "I tuoi interessi", "Kit iniziali"] : ["Welcome", "Your focus", "Starter kits"]
  const progress = ((step + 1) / steps.length) * 100

  function toggleFocus(id: string) {
    setFocus((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]))
  }
  function togglePick(id: string) {
    setPicks((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  }

  async function finish() {
    setFinishing(true)
    try {
      await Promise.all(
        picks.map((productId) => {
          const product = PRODUCTS.find((p) => p.id === productId)
          if (!product) return Promise.resolve()
          const release = primaryRelease(product)
          return addToCollection({
            productId,
            releaseId: release.id,
            condition: "New / Opened",
            acquisitionDate: new Date().toISOString(),
            acquisitionPrice: product.msrpEUR ?? product.estimatedMsrpEUR ?? 0,
            acquisitionCurrency: "EUR",
            notes: "",
          })
        }),
      )
      toast.success(
        picks.length
          ? it
            ? `Aggiunti ${picks.length} kit al tuo garage`
            : `Added ${picks.length} kit${picks.length > 1 ? "s" : ""} to your garage`
          : it
            ? "Configurazione completata"
            : "You're all set",
      )
      router.push("/")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : it ? "Impossibile salvare i kit iniziali" : "Couldn't save your starter kits")
      setFinishing(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-2xl flex-col px-5 py-8">
      <div className="flex items-center justify-between">
        <BrandMark />
        <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
          {it ? "Salta" : "Skip"}
        </Button>
      </div>

      <div className="mt-8 flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{steps[step]}</span>
          <span className="text-muted-foreground">
            {it ? "Passaggio" : "Step"} {step + 1} {it ? "di" : "of"} {steps.length}
          </span>
        </div>
        <Progress value={progress} />
      </div>

      <div className="mt-10 flex-1">
        {step === 0 && (
          <div className="flex flex-col gap-6">
            <div className="grid size-14 place-items-center rounded-2xl bg-brand/10 text-brand">
              <Boxes className="size-7" />
            </div>
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-semibold tracking-tight text-balance">
                {it ? "Benvenuto" : "Welcome"}{user?.username ? `, ${user.username}` : ""}.
              </h1>
              <p className="max-w-md text-muted-foreground leading-relaxed">
                {it
                  ? "Questo è il tuo database personale per Tamiya Mini 4WD. Cataloga ciò che possiedi, monitora il valore di mercato e crea una lista desideri con prezzi obiettivo. Configuriamo il tuo garage in due passaggi veloci."
                  : "This is your personal database for Tamiya Mini 4WD. Catalog what you own, track honest market value, and build a wishlist with price targets. Let's set up your garage in two quick steps."}
              </p>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1.5">
              <h1 className="text-2xl font-semibold tracking-tight">{it ? "Qual è il tuo interesse principale?" : "What's your focus?"}</h1>
              <p className="text-muted-foreground">{it ? "Seleziona tutte le opzioni che ti rappresentano. Servono solo a personalizzare l'esperienza." : "Pick any that fit. This just personalises your experience."}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {focusOptions.map((o) => {
                const active = focus.includes(o.id)
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => toggleFocus(o.id)}
                    className={cn(
                      "flex flex-col gap-1 rounded-xl border p-4 text-left transition-colors",
                      active ? "border-brand bg-brand/5" : "border-border hover:border-foreground/20",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{o.label}</span>
                      <span
                        className={cn(
                          "grid size-5 place-items-center rounded-full border",
                          active ? "border-brand bg-brand text-brand-foreground" : "border-muted-foreground/40",
                        )}
                      >
                        {active && <Check className="size-3" />}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">{o.desc}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1.5">
              <h1 className="text-2xl font-semibold tracking-tight">{it ? "Aggiungi i tuoi primi kit" : "Add your first kits"}</h1>
              <p className="text-muted-foreground">
                {it ? "Seleziona quelli che possiedi già. Potrai catalogare tutti gli altri in seguito." : "Select any you already own. You can catalog everything else later."}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {STARTER_PICKS.map((p) => {
                const active = picks.includes(p.id)
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePick(p.id)}
                    className={cn(
                      "relative flex flex-col gap-2 rounded-xl border p-2 text-left transition-colors",
                      active ? "border-brand bg-brand/5" : "border-border hover:border-foreground/20",
                    )}
                  >
                    <ProductImage product={p} className="aspect-4/3 w-full rounded-lg" />
                    <span className="line-clamp-1 px-1 text-xs font-medium">{p.name}</span>
                    {active && (
                      <span className="absolute right-3 top-3 grid size-5 place-items-center rounded-full bg-brand text-brand-foreground">
                        <Check className="size-3" />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between border-t pt-6">
        <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          {it ? "Indietro" : "Back"}
        </Button>
        {step < steps.length - 1 ? (
          <Button onClick={() => setStep((s) => s + 1)}>
            {it ? "Continua" : "Continue"}
            <ChevronRight data-icon="inline-end" />
          </Button>
        ) : (
          <Button onClick={finish} disabled={finishing}>
            {finishing
              ? it ? "Salvataggio…" : "Saving…"
              : picks.length
                ? it ? `Aggiungi ${picks.length} e termina` : `Add ${picks.length} & finish`
                : it ? "Fine" : "Finish"}
          </Button>
        )}
      </div>
    </div>
  )
}
