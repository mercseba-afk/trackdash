"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Boxes, Heart, ScanLine, TrendingUp } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useI18n } from "@/lib/i18n"
import { BrandMark } from "@/components/brand-mark"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

const COUNTRIES = ["Japan", "United States", "Germany", "France", "United Kingdom", "Italy", "Spain", "Other"]

function countryLabel(country: string, it: boolean) {
  if (!it) return country
  const labels: Record<string, string> = {
    Japan: "Giappone",
    "United States": "Stati Uniti",
    Germany: "Germania",
    France: "Francia",
    "United Kingdom": "Regno Unito",
    Italy: "Italia",
    Spain: "Spagna",
    Other: "Altro",
  }
  return labels[country] ?? country
}

export function AuthScreen({ mode }: { mode: "login" | "signup" }) {
  const { locale, setLocale } = useI18n()
  const it = locale === "it"
  const highlights = [
    { icon: Boxes, label: it ? "Cataloga tutti i modelli che possiedi" : "Catalog every model you own" },
    { icon: TrendingUp, label: it ? "Tieni sotto controllo il valore di mercato" : "Track honest market value" },
    { icon: Heart, label: it ? "Crea una lista desideri con prezzi obiettivo" : "Build a wishlist with targets" },
    { icon: ScanLine, label: it ? "Identifica i modelli dalla scatola" : "Scan boxes to identify" },
  ]

  return (
    <div className="relative grid min-h-svh lg:grid-cols-2">
      <div className="absolute right-4 top-4 z-20 flex items-center gap-1 rounded-lg border bg-background/90 p-1 shadow-sm backdrop-blur">
        <Button size="sm" variant={locale === "en" ? "secondary" : "ghost"} onClick={() => setLocale("en")}>EN</Button>
        <Button size="sm" variant={locale === "it" ? "secondary" : "ghost"} onClick={() => setLocale("it")}>IT</Button>
      </div>

      <aside className="relative hidden flex-col justify-between overflow-hidden bg-foreground p-10 text-background lg:flex">
        <BrandMark tone="invert" />
        <div className="flex flex-col gap-6">
          <h2 className="max-w-sm text-3xl font-semibold leading-tight text-balance">
            {it ? "Il database per collezionisti di Tamiya Mini 4WD." : "The collector's database for Tamiya Mini 4WD."}
          </h2>
          <ul className="flex flex-col gap-3">
            {highlights.map((h) => (
              <li key={h.label} className="flex items-center gap-3 text-sm text-background/80">
                <span className="grid size-9 place-items-center rounded-lg bg-brand/15 text-brand">
                  <h.icon className="size-4" />
                </span>
                {h.label}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-background/50">
          {it ? "I valori di mercato mostrati sono stime demo indicative, non perizie." : "Market values shown are indicative demo estimates, not appraisals."}
        </p>
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-brand/20 blur-3xl"
        />
      </aside>

      <main className="flex flex-col items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <BrandMark />
          </div>
          {mode === "login" ? <LoginForm /> : <SignupForm />}
        </div>
      </main>
    </div>
  )
}

function LoginForm() {
  const router = useRouter()
  const { locale } = useI18n()
  const it = locale === "it"
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [pending, setPending] = React.useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.includes("@")) {
      toast.error(it ? "Inserisci un'email valida" : "Enter a valid email")
      return
    }
    setPending(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setPending(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success(it ? "Bentornato" : "Welcome back")
    router.push("/")
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">{it ? "Accedi" : "Sign in"}</h1>
        <p className="text-sm text-muted-foreground">{it ? "Continua nel tuo garage." : "Continue to your garage."}</p>
      </div>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Link href="/forgot-password" className="text-xs font-medium text-brand hover:underline">
              {it ? "Password dimenticata?" : "Forgot password?"}
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
      </FieldGroup>
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? (it ? "Accesso…" : "Signing in…") : it ? "Accedi" : "Sign in"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {it ? "Non hai ancora un account?" : "New here?"}{" "}
        <Link href="/signup" className="font-medium text-brand hover:underline">
          {it ? "Crea un account" : "Create an account"}
        </Link>
      </p>
    </form>
  )
}

function SignupForm() {
  const router = useRouter()
  const { locale } = useI18n()
  const it = locale === "it"
  const [email, setEmail] = React.useState("")
  const [username, setUsername] = React.useState("")
  const [country, setCountry] = React.useState("Japan")
  const [password, setPassword] = React.useState("")
  const [pending, setPending] = React.useState(false)
  const [confirmationSent, setConfirmationSent] = React.useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.includes("@")) return toast.error(it ? "Inserisci un'email valida" : "Enter a valid email")
    if (username.trim().length < 2) return toast.error(it ? "Scegli uno username" : "Choose a username")
    if (password.length < 6) return toast.error(it ? "La password deve avere almeno 6 caratteri" : "Password must be at least 6 characters")

    setPending(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username: username.trim(), country } },
    })
    setPending(false)

    if (error) {
      toast.error(error.message)
      return
    }

    if (data.session) {
      toast.success(it ? "Account creato" : "Account created")
      router.push("/onboarding")
      router.refresh()
      return
    }

    setConfirmationSent(true)
  }

  if (confirmationSent) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">{it ? "Controlla la tua email" : "Check your email"}</h1>
          <p className="text-sm text-muted-foreground text-pretty">
            {it ? "Abbiamo inviato un link di conferma a" : "We sent a confirmation link to"}{" "}
            <span className="font-medium text-foreground">{email}</span>. {it ? "Aprilo per completare la creazione dell'account, poi accedi." : "Follow it to finish creating your account, then sign in."}
          </p>
        </div>
        <Button variant="outline" render={<Link href="/login" />}>
          {it ? "Torna all'accesso" : "Back to sign in"}
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">{it ? "Crea il tuo account" : "Create your account"}</h1>
        <p className="text-sm text-muted-foreground">{it ? "Inizia a catalogare la tua collezione Mini 4WD." : "Start cataloguing your Mini 4WD collection."}</p>
      </div>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="username">Username</FieldLabel>
          <Input
            id="username"
            autoComplete="username"
            placeholder="speedstar"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="signup-email">Email</FieldLabel>
          <Input
            id="signup-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="country">{it ? "Paese" : "Country"}</FieldLabel>
          <Select value={country} onValueChange={(v) => setCountry(v as string)}>
            <SelectTrigger id="country" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {countryLabel(c, it)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="signup-password">Password</FieldLabel>
          <Input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <FieldDescription>{it ? "Almeno 6 caratteri." : "At least 6 characters."}</FieldDescription>
        </Field>
      </FieldGroup>
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? (it ? "Creazione account…" : "Creating account…") : it ? "Crea account" : "Create account"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {it ? "Hai già un account?" : "Already have an account?"}{" "}
        <Link href="/login" className="font-medium text-brand hover:underline">
          {it ? "Accedi" : "Sign in"}
        </Link>
      </p>
    </form>
  )
}
