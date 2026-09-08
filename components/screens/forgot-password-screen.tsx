"use client"

import * as React from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useI18n } from "@/lib/i18n"
import { BrandMark } from "@/components/brand-mark"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { toast } from "sonner"

export function ForgotPasswordScreen() {
  const { locale } = useI18n()
  const it = locale === "it"
  const [email, setEmail] = React.useState("")
  const [pending, setPending] = React.useState(false)
  const [submitted, setSubmitted] = React.useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.includes("@")) {
      toast.error(it ? "Inserisci un'email valida" : "Enter a valid email")
      return
    }
    setPending(true)
    const supabase = createClient()
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
              <h1 className="text-2xl font-semibold tracking-tight">{it ? "Controlla la tua email" : "Check your email"}</h1>
              <p className="text-sm text-muted-foreground text-pretty">
                {it ? "Se esiste un account associato a" : "If an account exists for"}{" "}
                <span className="font-medium text-foreground">{email}</span>, {it ? "riceverai a breve un link per reimpostare la password." : "you'll receive a password reset link shortly."}
              </p>
            </div>
            <Button variant="outline" render={<Link href="/login" />}>
              {it ? "Torna all'accesso" : "Back to sign in"}
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-1.5">
              <h1 className="text-2xl font-semibold tracking-tight">{it ? "Password dimenticata?" : "Forgot password?"}</h1>
              <p className="text-sm text-muted-foreground">{it ? "Inserisci la tua email e ti invieremo un link per reimpostarla." : "Enter your email and we'll send you a reset link."}</p>
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
                <FieldDescription>{it ? "Non confermeremo mai se esiste o meno un account associato a un indirizzo email." : "We'll never reveal whether an account exists for an email."}</FieldDescription>
              </Field>
            </FieldGroup>
            <Button type="submit" size="lg" disabled={pending}>
              {pending ? (it ? "Invio…" : "Sending…") : it ? "Invia link di reset" : "Send reset link"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {it ? "Ti sei ricordato la password?" : "Remembered it?"}{" "}
              <Link href="/login" className="font-medium text-brand hover:underline">
                {it ? "Torna all'accesso" : "Back to sign in"}
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
