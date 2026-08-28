"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Boxes, Heart, ScanLine, TrendingUp } from "lucide-react"
import { useStore } from "@/lib/store"
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

const HIGHLIGHTS = [
  { icon: Boxes, label: "Catalog every model you own" },
  { icon: TrendingUp, label: "Track honest market value" },
  { icon: Heart, label: "Build a wishlist with targets" },
  { icon: ScanLine, label: "Scan boxes to identify" },
]

export function AuthScreen({ mode }: { mode: "login" | "signup" }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Brand / marketing panel */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-foreground p-10 text-background lg:flex">
        <BrandMark tone="invert" />
        <div className="flex flex-col gap-6">
          <h2 className="max-w-sm text-3xl font-semibold leading-tight text-balance">
            The collector&apos;s database for Tamiya Mini 4WD.
          </h2>
          <ul className="flex flex-col gap-3">
            {HIGHLIGHTS.map((h) => (
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
          Market values shown are indicative demo estimates, not appraisals.
        </p>
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-brand/20 blur-3xl"
        />
      </aside>

      {/* Form panel */}
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
  const { login } = useStore()
  const router = useRouter()
  const [email, setEmail] = React.useState("collector@mini4wd.app")
  const [password, setPassword] = React.useState("demo1234")

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.includes("@")) {
      toast.error("Enter a valid email")
      return
    }
    login(email)
    toast.success("Welcome back")
    router.push("/")
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          Continue to your garage. Demo credentials are prefilled.
        </p>
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
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <FieldDescription>This demo does not verify passwords.</FieldDescription>
        </Field>
      </FieldGroup>
      <Button type="submit" size="lg">
        Sign in
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/signup" className="font-medium text-brand hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  )
}

function SignupForm() {
  const { signup } = useStore()
  const router = useRouter()
  const [email, setEmail] = React.useState("")
  const [username, setUsername] = React.useState("")
  const [country, setCountry] = React.useState("Japan")
  const [password, setPassword] = React.useState("")

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.includes("@")) return toast.error("Enter a valid email")
    if (username.trim().length < 2) return toast.error("Choose a username")
    if (password.length < 6) return toast.error("Password must be at least 6 characters")
    signup({ email, username: username.trim(), country })
    toast.success("Account created")
    router.push("/onboarding")
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="text-sm text-muted-foreground">Start cataloguing your Mini 4WD collection.</p>
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
          <FieldLabel htmlFor="country">Country</FieldLabel>
          <Select value={country} onValueChange={(v) => setCountry(v as string)}>
            <SelectTrigger id="country" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
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
          <FieldDescription>At least 6 characters.</FieldDescription>
        </Field>
      </FieldGroup>
      <Button type="submit" size="lg">
        Create account
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  )
}
