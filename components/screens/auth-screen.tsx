"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Boxes, Eye, EyeOff, MessageCircle, ScanLine, ShieldCheck, TrendingUp } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useI18n } from "@/lib/i18n"
import { BrandMark } from "@/components/brand-mark"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

const COUNTRIES = ["Japan", "United States", "Germany", "France", "United Kingdom", "Italy", "Spain", "Other"]

function countryLabel(country: string, it: boolean) {
  if (!it) return country
  const labels: Record<string, string> = { Japan: "Giappone", "United States": "Stati Uniti", Germany: "Germania", France: "Francia", "United Kingdom": "Regno Unito", Italy: "Italia", Spain: "Spagna", Other: "Altro" }
  return labels[country] ?? country
}

function withNext(path: string, nextPath?: string) {
  return nextPath ? `${path}?next=${encodeURIComponent(nextPath)}` : path
}

export function AuthScreen({ mode, nextPath }: { mode: "login" | "signup"; nextPath?: string }) {
  const { locale, setLocale } = useI18n()
  const it = locale === "it"
  const highlights = [
    { icon: ShieldCheck, label: it ? "Scopri quanto vale la Release esatta" : "Discover what the exact Release is worth" },
    { icon: Boxes, label: it ? "Registra e organizza la tua collezione" : "Build and organise your collection" },
    { icon: TrendingUp, label: it ? "Controlla mercato, vendite, ASK e trend" : "Watch market sales, ASK and trends" },
    { icon: MessageCircle, label: it ? "Compra e vendi con altri collezionisti" : "Buy and sell with other collectors" },
    { icon: ScanLine, label: it ? "Trova più velocemente la Release con lo Scanner" : "Find the right Release faster with Scanner" },
  ]

  return (
    <div className="relative min-h-svh bg-background lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(440px,.95fr)]">
      <div className="absolute right-4 top-4 z-30 flex items-center rounded-full border border-border/70 bg-white/90 p-1 shadow-sm backdrop-blur">
        <Button size="sm" className="h-7 rounded-full px-3 text-xs" variant={locale === "en" ? "secondary" : "ghost"} onClick={() => setLocale("en")}>EN</Button>
        <Button size="sm" className="h-7 rounded-full px-3 text-xs" variant={locale === "it" ? "secondary" : "ghost"} onClick={() => setLocale("it")}>IT</Button>
      </div>

      <aside className="relative hidden min-h-svh overflow-hidden border-r border-border/10 bg-[#0b3275] px-10 py-9 text-white lg:flex lg:flex-col lg:justify-between xl:px-14 xl:py-12">
        <div className="relative z-10"><BrandMark tone="invert" /></div>
        <div className="relative z-10 max-w-xl py-10">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60">{it ? "Il tuo Mini 4WD, insieme" : "Your Mini 4WD, together"}</p>
          <h1 className="max-w-lg text-4xl font-semibold leading-[1.02] tracking-[-0.04em] xl:text-5xl">
            {it ? <>Entra nel tuo <span className="text-[#8fb5ff]">TrackDash.</span></> : <>Enter your <span className="text-[#8fb5ff]">TrackDash.</span></>}
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-white/65">
            {it ? "Scopri quanto vale la Release, registrala nella tua Collection, controlla il mercato e compra o vendi con altri collezionisti: tutto parte dalla versione esatta." : "Discover what a Release is worth, add it to your Collection, watch the market and buy or sell with other collectors: everything starts from the exact version."}
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {highlights.map((h) => (
              <div key={h.label} className="flex min-h-20 items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/10 text-[#9fc0ff]"><h.icon className="size-4" /></span>
                <span className="text-sm leading-relaxed text-white/75">{h.label}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="relative z-10 max-w-lg text-xs leading-relaxed text-white/45">
          {it ? "I valori di mercato sono stime indicative basate sui dati disponibili e non costituiscono perizie." : "Market values are indicative estimates based on available data and are not appraisals."}
        </p>
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-16 size-80 rounded-full border border-white/10" />
        <div aria-hidden className="pointer-events-none absolute -right-8 top-20 size-56 rounded-full border border-white/10" />
        <div aria-hidden className="pointer-events-none absolute bottom-[-180px] left-[-60px] size-[420px] rounded-full bg-[#1558e8]/25 blur-3xl" />
      </aside>

      <main className="flex min-h-svh items-center justify-center px-5 py-16 sm:px-8 lg:min-h-0 lg:px-12">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden"><BrandMark /></div>
          <div className="rounded-3xl border border-border/70 bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,0.07)] sm:p-8">
            {mode === "login" ? <LoginForm nextPath={nextPath} /> : <SignupForm nextPath={nextPath} />}
          </div>
          <Link href="/catalog" className="mx-auto mt-5 flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
            {it ? "Continua a esplorare il catalogo" : "Continue browsing the catalog"}<ArrowRight className="size-3.5" />
          </Link>
        </div>
      </main>
    </div>
  )
}

function LoginForm({ nextPath }: { nextPath?: string }) {
  const router = useRouter()
  const { locale } = useI18n()
  const it = locale === "it"
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [pending, setPending] = React.useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.includes("@")) return toast.error(it ? "Inserisci un'email valida" : "Enter a valid email")
    setPending(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    setPending(false)
    if (error) return toast.error(error.message)
    toast.success(it ? "Bentornato" : "Welcome back")

    const needsOnboarding = data.user?.user_metadata?.onboarding_completed === false
    const destination = needsOnboarding ? withNext("/onboarding", nextPath) : nextPath ?? "/dashboard"
    const aal = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    const adminAccount = data.user?.email?.toLowerCase() === "merc.seba@gmail.com"
    const needsMfa = adminAccount || (aal.data?.nextLevel === "aal2" && aal.data.currentLevel !== "aal2")

    router.push(needsMfa ? `/mfa?next=${encodeURIComponent(destination)}` : destination)
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.17em] text-brand">{it ? "Bentornato" : "Welcome back"}</p>
        <h1 className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">{it ? "Accedi a TrackDash." : "Sign in to TrackDash."}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{nextPath ? (it ? "Dopo l'accesso tornerai esattamente dove eri." : "After signing in, you'll return exactly where you were.") : (it ? "Continua nella tua Collection e nei tuoi strumenti personali." : "Continue to your Collection and personal tools.")}</p>
      </div>
      <FieldGroup>
        <Field><FieldLabel htmlFor="email">Email</FieldLabel><Input id="email" className="h-11 rounded-xl" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field>
          <div className="flex items-center justify-between"><FieldLabel htmlFor="password">Password</FieldLabel><Link href="/forgot-password" className="text-xs font-medium text-brand hover:underline">{it ? "Password dimenticata?" : "Forgot password?"}</Link></div>
          <div className="relative">
            <Input id="password" className="h-11 rounded-xl pr-11" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? (it ? "Nascondi password" : "Hide password") : (it ? "Mostra password" : "Show password")} title={showPassword ? (it ? "Nascondi password" : "Hide password") : (it ? "Mostra password" : "Show password")}>
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>
      </FieldGroup>
      <Button type="submit" size="lg" className="rounded-xl" disabled={pending}>{pending ? (it ? "Accesso…" : "Signing in…") : it ? "Accedi" : "Sign in"}<ArrowRight /></Button>
      <p className="text-center text-sm text-muted-foreground">{it ? "Non hai ancora un account?" : "New here?"} <Link href={withNext("/signup", nextPath)} className="font-medium text-brand hover:underline">{it ? "Crea un account" : "Create an account"}</Link></p>
    </form>
  )
}

function SignupForm({ nextPath }: { nextPath?: string }) {
  const router = useRouter()
  const { locale } = useI18n()
  const it = locale === "it"
  const [email, setEmail] = React.useState("")
  const [username, setUsername] = React.useState("")
  const [country, setCountry] = React.useState("Japan")
  const [password, setPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [confirmationSent, setConfirmationSent] = React.useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.includes("@")) return toast.error(it ? "Inserisci un'email valida" : "Enter a valid email")
    if (username.trim().length < 2) return toast.error(it ? "Scegli uno username" : "Choose a username")
    if (password.length < 10) return toast.error(it ? "La password deve avere almeno 10 caratteri" : "Password must be at least 10 characters")

    setPending(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username: username.trim(), country, onboarding_completed: false } },
    })
    setPending(false)
    if (error) return toast.error(error.message)

    if (data.session) {
      toast.success(it ? "Account creato" : "Account created")
      router.push(withNext("/onboarding", nextPath))
      router.refresh()
      return
    }
    setConfirmationSent(true)
  }

  if (confirmationSent) {
    return (
      <div className="flex flex-col gap-5">
        <div><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.17em] text-brand">{it ? "Quasi fatto" : "Almost there"}</p><h1 className="text-2xl font-semibold tracking-tight">{it ? "Controlla la tua email" : "Check your email"}</h1><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{it ? "Abbiamo inviato un link di conferma a" : "We sent a confirmation link to"} <span className="font-medium text-foreground">{email}</span>. {it ? "Aprilo per completare la creazione dell'account, poi accedi: prima di entrare in TrackDash completerai il breve onboarding." : "Follow it to finish creating your account, then sign in: you'll complete the short onboarding before entering TrackDash."}</p></div>
        <Button variant="outline" className="rounded-xl" render={<Link href={withNext("/login", nextPath)} />}>{it ? "Torna all'accesso" : "Back to sign in"}</Button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <div><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.17em] text-brand">{it ? "Account gratuito" : "Free account"}</p><h1 className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">{it ? "Inizia la tua Collection." : "Start your Collection."}</h1><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{nextPath ? (it ? "Crea l'account, completa il breve onboarding e poi torna alla Release da cui sei partito." : "Create your account, complete the short onboarding, then return to the Release you started from.") : (it ? "Registra la tua collezione, segui il valore delle Release, controlla il mercato e compra o vendi con altri collezionisti." : "Build your collection, track Release values, watch the market and buy or sell with other collectors.")}</p></div>
      <FieldGroup>
        <Field><FieldLabel htmlFor="username">Username</FieldLabel><Input id="username" className="h-11 rounded-xl" autoComplete="username" placeholder="speedstar" value={username} onChange={(e) => setUsername(e.target.value)} /></Field>
        <Field><FieldLabel htmlFor="signup-email">Email</FieldLabel><Input id="signup-email" className="h-11 rounded-xl" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field><FieldLabel htmlFor="country">{it ? "Paese" : "Country"}</FieldLabel><Select value={country} onValueChange={(v) => setCountry(v as string)}><SelectTrigger id="country" className="h-11 w-full rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{COUNTRIES.map((c) => <SelectItem key={c} value={c}>{countryLabel(c, it)}</SelectItem>)}</SelectContent></Select></Field>
        <Field>
          <FieldLabel htmlFor="signup-password">Password</FieldLabel>
          <div className="relative">
            <Input id="signup-password" className="h-11 rounded-xl pr-11" type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? (it ? "Nascondi password" : "Hide password") : (it ? "Mostra password" : "Show password")} title={showPassword ? (it ? "Nascondi password" : "Hide password") : (it ? "Mostra password" : "Show password")}>
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <FieldDescription>{it ? "Almeno 10 caratteri. Ti consigliamo una password unica generata da un password manager." : "At least 10 characters. We recommend a unique password generated by a password manager."}</FieldDescription>
        </Field>
      </FieldGroup>
      <Button type="submit" size="lg" className="rounded-xl" disabled={pending}>{pending ? (it ? "Creazione account…" : "Creating account…") : it ? "Crea account" : "Create account"}<ArrowRight /></Button>
      <p className="text-center text-sm text-muted-foreground">{it ? "Hai già un account?" : "Already have an account?"} <Link href={withNext("/login", nextPath)} className="font-medium text-brand hover:underline">{it ? "Accedi" : "Sign in"}</Link></p>
    </form>
  )
}
