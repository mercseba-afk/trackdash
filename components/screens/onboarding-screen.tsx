"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Boxes, Check, ChevronLeft, ChevronRight, Heart, ScanLine, Sparkles, TrendingUp } from "lucide-react"
import { useStore } from "@/lib/store"
import { useI18n } from "@/lib/i18n"
import { PRODUCTS, primaryRelease } from "@/lib/data/products"
import { createClient } from "@/lib/supabase/client"
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

export function OnboardingScreen({ nextPath }: { nextPath?: string }) {
  const router = useRouter()
  const { addToCollection, user } = useStore()
  const { locale } = useI18n()
  const it = locale === "it"
  const [step, setStep] = React.useState(0)
  const [focus, setFocus] = React.useState<string[]>([])
  const [picks, setPicks] = React.useState<string[]>([])
  const [finishing, setFinishing] = React.useState(false)

  const focusOptions = [
    { id: "vintage", icon: Sparkles, label: it ? "Vintage e rari" : "Vintage & rare", desc: it ? "Release storiche, speciali e kit fuori produzione" : "Historic releases, special editions and discontinued kits" },
    { id: "racing", icon: ScanLine, label: it ? "Gare e montaggio" : "Racing & building", desc: it ? "Modelli da montare, preparare e portare in pista" : "Kits to build, tune and take to the track" },
    { id: "display", icon: Boxes, label: it ? "Display e sigillati" : "Display & sealed", desc: it ? "Scatole e kit da conservare nella Collection" : "Boxes and kits to preserve in your Collection" },
    { id: "complete", icon: Heart, label: it ? "Completare serie" : "Complete series", desc: it ? "Seguire famiglie, edizioni e Release mancanti" : "Track families, editions and missing Releases" },
  ]
  const steps = it ? ["Benvenuto", "I tuoi interessi", "Primi kit"] : ["Welcome", "Your focus", "First kits"]
  const progress = ((step + 1) / steps.length) * 100
  const destination = nextPath ?? "/dashboard"

  function toggleFocus(id: string) {
    setFocus((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]))
  }

  function togglePick(id: string) {
    setPicks((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]))
  }

  async function markCompleted() {
    const supabase = createClient()
    const { data, error: getUserError } = await supabase.auth.getUser()
    if (getUserError) throw getUserError
    if (!data.user) throw new Error(it ? "Sessione non disponibile" : "No active session")

    const { error } = await supabase.auth.updateUser({
      data: {
        ...data.user.user_metadata,
        onboarding_completed: true,
        collector_focus: focus,
      },
    })
    if (error) throw error
  }

  async function skip() {
    if (finishing) return
    setFinishing(true)
    try {
      await markCompleted()
      router.push(destination)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : it ? "Impossibile completare la configurazione" : "Couldn't complete setup")
      setFinishing(false)
    }
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
      await markCompleted()
      toast.success(
        picks.length
          ? it
            ? `Aggiunti ${picks.length} kit alla tua Collection`
            : `Added ${picks.length} kit${picks.length > 1 ? "s" : ""} to your Collection`
          : it
            ? "TrackDash è pronto"
            : "TrackDash is ready",
      )
      router.push(destination)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : it ? "Impossibile completare la configurazione" : "Couldn't complete setup")
      setFinishing(false)
    }
  }

  return (
    <div className="min-h-svh bg-[#f8fafc] px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="mx-auto grid min-h-[calc(100svh-2rem)] w-full max-w-6xl overflow-hidden rounded-[28px] border border-border/70 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:min-h-[calc(100svh-3rem)] lg:grid-cols-[minmax(300px,.78fr)_minmax(0,1.22fr)]">
        <aside className="relative overflow-hidden bg-[#0b3275] px-6 py-7 text-white sm:px-8 lg:flex lg:flex-col lg:justify-between lg:px-9 lg:py-9">
          <div className="relative z-10 flex items-center justify-between gap-4">
            <BrandMark tone="invert" />
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70">
              {it ? "Account gratuito" : "Free account"}
            </span>
          </div>

          <div className="relative z-10 mt-10 max-w-md lg:my-12">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9fc0ff]">{it ? "INIZIA DA QUI" : "START HERE"}</p>
            <h1 className="mt-3 text-3xl font-semibold leading-[1.04] tracking-[-0.045em] sm:text-4xl">
              {it ? <>Il tuo spazio per <span className="text-[#9fc0ff]">collezionare meglio.</span></> : <>Your place to <span className="text-[#9fc0ff]">collect better.</span></>}
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-white/65">
              {it
                ? "Tre passaggi veloci per preparare Collection, preferenze e primi modelli. Poi TrackDash resta tutto tuo."
                : "Three quick steps to set up your Collection, preferences and first models. Then TrackDash is yours."}
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {[
                { icon: Boxes, title: it ? "Collection" : "Collection", text: it ? "Fino a 50 Release con il piano Free" : "Up to 50 Releases on Free" },
                { icon: ScanLine, title: "Scanner", text: it ? "Identifica la Release giusta" : "Identify the right Release" },
                { icon: TrendingUp, title: "Market Value", text: it ? "Valore separato da ASK e SOLD" : "Value kept separate from ASK and SOLD" },
              ].map((item) => (
                <div key={item.title} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3.5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/10 text-[#9fc0ff]"><item.icon className="size-4" /></span>
                  <span><strong className="block text-sm font-medium">{item.title}</strong><small className="mt-0.5 block text-xs leading-relaxed text-white/55">{item.text}</small></span>
                </div>
              ))}
            </div>
          </div>

          <p className="relative z-10 mt-8 text-xs leading-relaxed text-white/45 lg:mt-0">
            {it ? "Potrai modificare Collection, Wishlist e preferenze in qualsiasi momento." : "You can change your Collection, Wishlist and preferences at any time."}
          </p>

          <div aria-hidden className="pointer-events-none absolute -right-24 -top-20 size-80 rounded-full border border-white/10" />
          <div aria-hidden className="pointer-events-none absolute -right-6 top-20 size-56 rounded-full border border-white/10" />
          <div aria-hidden className="pointer-events-none absolute bottom-[-170px] left-[-80px] size-[410px] rounded-full bg-[#1558e8]/30 blur-3xl" />
        </aside>

        <main className="flex min-h-[620px] flex-col px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-9">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-medium text-foreground">{steps[step]}</span>
                <span className="text-muted-foreground">{step + 1} / {steps.length}</span>
              </div>
              <Progress value={progress} className="mt-2 h-1.5" />
            </div>
            <Button variant="ghost" size="sm" className="shrink-0 rounded-xl text-muted-foreground" onClick={skip} disabled={finishing}>
              {it ? "Salta" : "Skip"}
            </Button>
          </div>

          <div className="flex flex-1 items-center py-8 sm:py-10">
            <div className="w-full">
              {step === 0 && (
                <div className="max-w-2xl">
                  <span className="grid size-14 place-items-center rounded-2xl bg-brand/10 text-brand"><Sparkles className="size-6" /></span>
                  <p className="mt-7 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand">{it ? "BENVENUTO IN TRACKDASH" : "WELCOME TO TRACKDASH"}</p>
                  <h2 className="mt-2 text-3xl font-semibold leading-[1.05] tracking-[-0.045em] text-balance sm:text-4xl">
                    {it ? <>Ciao{user?.username ? ` ${user.username}` : ""}, costruiamo la tua <span className="text-brand">Collection.</span></> : <>Hi{user?.username ? ` ${user.username}` : ""}, let's build your <span className="text-brand">Collection.</span></>}
                  </h2>
                  <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
                    {it
                      ? "TrackDash ruota attorno alla Release esatta: puoi organizzare ciò che possiedi, identificare i modelli con lo Scanner e capire il Market Value senza confondere prezzi richiesti e vendite reali."
                      : "TrackDash is built around the exact Release: organise what you own, identify models with the Scanner and understand Market Value without mixing asking prices with completed sales."}
                  </p>
                  {nextPath && (
                    <div className="mt-6 rounded-2xl border border-brand/15 bg-brand/[0.04] p-4 text-sm leading-relaxed text-foreground/80">
                      <strong className="font-semibold text-brand">{it ? "Non perderai ciò che stavi facendo." : "You won't lose what you were doing."}</strong>{" "}
                      {it ? "Alla fine tornerai esattamente alla pagina da cui sei partito." : "When you're done, you'll return exactly to the page you came from."}
                    </div>
                  )}
                </div>
              )}

              {step === 1 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand">{it ? "IL TUO MODO DI COLLEZIONARE" : "HOW YOU COLLECT"}</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">{it ? "Cosa ti interessa di più?" : "What matters most to you?"}</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{it ? "Puoi scegliere più opzioni. Le salviamo come preferenze iniziali del tuo account e potrai cambiarle in seguito." : "Choose as many as you like. We'll save them as your initial account preferences and you can change them later."}</p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {focusOptions.map((option) => {
                      const active = focus.includes(option.id)
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => toggleFocus(option.id)}
                          className={cn(
                            "group flex min-h-28 items-start gap-3 rounded-2xl border p-4 text-left transition-all",
                            active ? "border-brand bg-brand/[0.045] shadow-[0_10px_30px_rgba(21,88,232,0.07)]" : "border-border/80 bg-white hover:border-brand/30 hover:bg-muted/25",
                          )}
                        >
                          <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl transition-colors", active ? "bg-brand text-white" : "bg-muted text-muted-foreground group-hover:text-brand")}><option.icon className="size-4.5" /></span>
                          <span className="min-w-0 flex-1"><strong className="block text-sm font-semibold">{option.label}</strong><small className="mt-1 block text-xs leading-relaxed text-muted-foreground">{option.desc}</small></span>
                          <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border", active ? "border-brand bg-brand text-white" : "border-border bg-white")}>{active && <Check className="size-3" />}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand">{it ? "PARTI DAI TUOI MODELLI" : "START WITH YOUR MODELS"}</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">{it ? "Ne possiedi già qualcuno?" : "Own any of these already?"}</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{it ? "Seleziona solo quelli che riconosci. Questo passaggio è facoltativo: potrai aggiungere qualsiasi Release dal Catalogo o dallo Scanner." : "Select only the ones you recognise. This step is optional: you can add any Release later from the Catalog or Scanner."}</p>
                  <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {STARTER_PICKS.map((product) => {
                      const active = picks.includes(product.id)
                      return (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => togglePick(product.id)}
                          className={cn(
                            "relative overflow-hidden rounded-2xl border bg-white p-2.5 text-left transition-all",
                            active ? "border-brand shadow-[0_10px_30px_rgba(21,88,232,0.08)]" : "border-border/80 hover:border-brand/30",
                          )}
                        >
                          <ProductImage product={product} className="aspect-4/3 w-full rounded-xl" />
                          <span className="mt-2.5 block line-clamp-1 px-1 text-xs font-semibold">{product.name}</span>
                          <span className="mt-0.5 block px-1 font-mono text-[10px] text-muted-foreground">{primaryRelease(product).itemNumber}</span>
                          {active && <span className="absolute right-3 top-3 grid size-6 place-items-center rounded-full bg-brand text-white shadow-sm"><Check className="size-3.5" /></span>}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-5">
            <Button variant="ghost" className="rounded-xl" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0 || finishing}>
              <ChevronLeft />{it ? "Indietro" : "Back"}
            </Button>
            {step < steps.length - 1 ? (
              <Button className="rounded-xl px-5" onClick={() => setStep((current) => current + 1)} disabled={finishing}>
                {it ? "Continua" : "Continue"}<ChevronRight />
              </Button>
            ) : (
              <Button className="rounded-xl px-5" onClick={finish} disabled={finishing}>
                {finishing
                  ? it ? "Salvataggio…" : "Saving…"
                  : picks.length
                    ? it ? `Aggiungi ${picks.length} e termina` : `Add ${picks.length} & finish`
                    : it ? "Entra in TrackDash" : "Enter TrackDash"}
                {!finishing && <ChevronRight />}
              </Button>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
