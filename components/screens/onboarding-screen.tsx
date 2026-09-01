"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Check, ChevronRight, Boxes } from "lucide-react"
import { useStore } from "@/lib/store"
import { PRODUCTS, primaryRelease } from "@/lib/data/products"
import { BrandMark } from "@/components/brand-mark"
import { ProductArt } from "@/components/product-art"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const FOCUS_OPTIONS = [
  { id: "vintage", label: "Vintage & rare", desc: "Chase grails and out-of-production kits" },
  { id: "racing", label: "Active racing", desc: "Build, tune and run on the track" },
  { id: "display", label: "Display & sealed", desc: "Keep boxes pristine and shelved" },
  { id: "complete", label: "Series completionist", desc: "Finish whole lineups end to end" },
]

// A curated set of popular kits new collectors are likely to own. Prefer the
// well-known Fully Cowled / Let's & Go heroes, then fall back to fill six tiles.
const STARTER_PICKS = (() => {
  const preferred = PRODUCTS.filter((p) => p.series === "Fully Cowled" || p.series === "Let's & Go")
  const rest = PRODUCTS.filter((p) => !preferred.includes(p))
  return [...preferred, ...rest].slice(0, 6)
})()

export function OnboardingScreen() {
  const router = useRouter()
  const { addToCollection, user } = useStore()
  const [step, setStep] = React.useState(0)
  const [focus, setFocus] = React.useState<string[]>([])
  const [picks, setPicks] = React.useState<string[]>([])
  const [finishing, setFinishing] = React.useState(false)

  const steps = ["Welcome", "Your focus", "Starter kits"]
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
            acquisitionPrice: product.msrpEUR,
            acquisitionCurrency: "EUR",
            notes: "",
          })
        }),
      )
      toast.success(
        picks.length ? `Added ${picks.length} kit${picks.length > 1 ? "s" : ""} to your garage` : "You're all set",
      )
      router.push("/")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't save your starter kits")
      setFinishing(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-2xl flex-col px-5 py-8">
      <div className="flex items-center justify-between">
        <BrandMark />
        <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
          Skip
        </Button>
      </div>

      <div className="mt-8 flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{steps[step]}</span>
          <span className="text-muted-foreground">
            Step {step + 1} of {steps.length}
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
                Welcome{user?.username ? `, ${user.username}` : ""}.
              </h1>
              <p className="max-w-md text-muted-foreground leading-relaxed">
                This is your personal database for Tamiya Mini 4WD. Catalog what you own, track honest
                market value, and build a wishlist with price targets. Let&apos;s set up your garage in two quick
                steps.
              </p>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1.5">
              <h1 className="text-2xl font-semibold tracking-tight">What&apos;s your focus?</h1>
              <p className="text-muted-foreground">Pick any that fit. This just personalises your experience.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {FOCUS_OPTIONS.map((o) => {
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
              <h1 className="text-2xl font-semibold tracking-tight">Add your first kits</h1>
              <p className="text-muted-foreground">
                Select any you already own. You can catalog everything else later.
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
                    <ProductArt product={p} className="aspect-4/3 w-full rounded-lg" />
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
          Back
        </Button>
        {step < steps.length - 1 ? (
          <Button onClick={() => setStep((s) => s + 1)}>
            Continue
            <ChevronRight data-icon="inline-end" />
          </Button>
        ) : (
          <Button onClick={finish} disabled={finishing}>
            {finishing ? "Saving…" : picks.length ? `Add ${picks.length} & finish` : "Finish"}
          </Button>
        )}
      </div>
    </div>
  )
}
