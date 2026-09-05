"use client"

import * as React from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { BrandMark } from "@/components/brand-mark"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { toast } from "sonner"

// Same shell pattern as AuthScreen (components/screens/auth-screen.tsx) for
// visual consistency, kept as a separate small component rather than
// extending AuthScreen itself -- this page's flow (email-only, single
// generic outcome) doesn't fit AuthScreen's login/signup mode switch, and
// duplicating this much markup is cheaper and safer than reshaping a
// component the existing login/signup flows depend on.
export function ForgotPasswordScreen() {
  const [email, setEmail] = React.useState("")
  const [pending, setPending] = React.useState(false)
  const [submitted, setSubmitted] = React.useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.includes("@")) {
      toast.error("Enter a valid email")
      return
    }
    setPending(true)
    const supabase = createClient()
    // Errors here (rate limiting, network issues, etc.) are intentionally
    // NOT surfaced differently based on whether the email exists --
    // Supabase's own resetPasswordForEmail already avoids revealing
    // account existence, and the UI shows the same generic message
    // regardless of the result, so no account-enumeration signal leaks
    // through timing, error text, or otherwise.
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
    })
    setPending(false)
    setSubmitted(true)
  }

  return (
    <div className="grid min-h-svh place-items-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <BrandMark />
        </div>
        {submitted ? (
          <div className="flex flex-col gap-4 text-center">
            <div className="flex flex-col gap-1.5">
              <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
              <p className="text-sm text-muted-foreground text-pretty">
                If an account exists for <span className="font-medium text-foreground">{email}</span>, you&apos;ll
                receive a password reset link shortly.
              </p>
            </div>
            <Button variant="outline" render={<Link href="/login" />}>
              Back to sign in
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-1.5">
              <h1 className="text-2xl font-semibold tracking-tight">Forgot password?</h1>
              <p className="text-sm text-muted-foreground">Enter your email and we&apos;ll send you a reset link.</p>
            </div>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <FieldDescription>We&apos;ll never reveal whether an account exists for an email.</FieldDescription>
              </Field>
            </FieldGroup>
            <Button type="submit" size="lg" disabled={pending}>
              {pending ? "Sending…" : "Send reset link"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Remembered it?{" "}
              <Link href="/login" className="font-medium text-brand hover:underline">
                Back to sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
