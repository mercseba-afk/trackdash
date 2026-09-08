"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useI18n } from "@/lib/i18n"
import { BrandMark } from "@/components/brand-mark"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"

type SessionState = "checking" | "valid" | "invalid"

export function UpdatePasswordScreen() {
  const router = useRouter()
  const { locale } = useI18n()
  const it = locale === "it"
  const [sessionState, setSessionState] = React.useState<SessionState>("checking")
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [pending, setPending] = React.useState(false)
  const [success, setSuccess] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    async function checkSession() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (cancelled) return
      setSessionState(user ? "valid" : "invalid")
    }
    checkSession()
    return () => {
      cancelled = true
    }
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!password) {
      toast.error(it ? "Inserisci una nuova password" : "Enter a new password")
      return
    }
    if (!confirmPassword) {
      toast.error(it ? "Conferma la nuova password" : "Confirm your new password")
      return
    }
    if (password.length < 6) {
      toast.error(it ? "La password deve avere almeno 6 caratteri" : "Password must be at least 6 characters")
      return
    }
    if (password !== confirmPassword) {
      toast.error(it ? "Le password non coincidono" : "Passwords don't match")
      return
    }

    setPending(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setPending(false)

    if (error) {
      toast.error(error.message)
      return
    }

    setSuccess(true)
    toast.success(it ? "Password aggiornata" : "Password updated")
  }

  return (
    <div className="grid min-h-svh place-items-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <BrandMark />
        </div>

        {sessionState === "checking" && (
          <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
            <Spinner className="size-6" />
            <p className="text-sm">{it ? "Verifica del link di reset…" : "Checking your reset link…"}</p>
          </div>
        )}

        {sessionState === "invalid" && (
          <div className="flex flex-col gap-4 text-center">
            <div className="flex flex-col gap-1.5">
              <h1 className="text-2xl font-semibold tracking-tight">{it ? "Link non valido o scaduto" : "Link invalid or expired"}</h1>
              <p className="text-sm text-muted-foreground text-pretty">
                {it ? "Questo link per reimpostare la password non è più valido. Richiedine uno nuovo per continuare." : "This password reset link is no longer valid. Request a new one to continue."}
              </p>
            </div>
            <Button render={<Link href="/forgot-password" />}>{it ? "Richiedi un nuovo link" : "Request a new link"}</Button>
            <Link href="/login" className="text-sm font-medium text-brand hover:underline">
              {it ? "Torna all'accesso" : "Back to sign in"}
            </Link>
          </div>
        )}

        {sessionState === "valid" && success && (
          <div className="flex flex-col gap-4 text-center">
            <div className="flex flex-col gap-1.5">
              <h1 className="text-2xl font-semibold tracking-tight">{it ? "Password aggiornata" : "Password updated"}</h1>
              <p className="text-sm text-muted-foreground text-pretty">
                {it ? "La password è stata modificata. Ora sei autenticato con la nuova password." : "Your password has been changed. You're signed in with your new password."}
              </p>
            </div>
            <Button
              onClick={() => {
                router.push("/")
                router.refresh()
              }}
            >
              {it ? "Continua nel tuo garage" : "Continue to your garage"}
            </Button>
          </div>
        )}

        {sessionState === "valid" && !success && (
          <form onSubmit={submit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-1.5">
              <h1 className="text-2xl font-semibold tracking-tight">{it ? "Imposta una nuova password" : "Set a new password"}</h1>
              <p className="text-sm text-muted-foreground">{it ? "Scegli una nuova password per il tuo account." : "Choose a new password for your account."}</p>
            </div>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="new-password">{it ? "Nuova password" : "New password"}</FieldLabel>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <FieldDescription>{it ? "Almeno 6 caratteri." : "At least 6 characters."}</FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="confirm-password">{it ? "Conferma password" : "Confirm password"}</FieldLabel>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </Field>
            </FieldGroup>
            <Button type="submit" size="lg" disabled={pending}>
              {pending ? (it ? "Aggiornamento…" : "Updating…") : it ? "Aggiorna password" : "Update password"}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
