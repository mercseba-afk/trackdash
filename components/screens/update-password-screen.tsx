"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { BrandMark } from "@/components/brand-mark"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"

type SessionState = "checking" | "valid" | "invalid"

// Same shell pattern as AuthScreen / ForgotPasswordScreen -- see that
// file's comment for why this isn't folded into AuthScreen itself.
export function UpdatePasswordScreen() {
  const router = useRouter()
  const [sessionState, setSessionState] = React.useState<SessionState>("checking")
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [pending, setPending] = React.useState(false)
  const [success, setSuccess] = React.useState(false)

  React.useEffect(() => {
    // The auth callback route (app/auth/callback/route.ts) exchanges the
    // recovery link's code for a session server-side (setting the auth
    // cookies) before ever redirecting here. This checks that a session
    // actually landed -- covering: a valid recovery link (session
    // present), an invalid/expired/already-used link (the callback route
    // itself already redirected here after a failed exchange, so no
    // session exists), and someone opening /update-password directly
    // with no recovery flow at all (also no session). All three collapse
    // to the same "invalid" state below rather than trying to
    // distinguish them -- there's nothing actionable a user can do
    // differently for any of them except request a new link.
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
      toast.error("Enter a new password")
      return
    }
    if (!confirmPassword) {
      toast.error("Confirm your new password")
      return
    }
    // Same minimum as signup (components/screens/auth-screen.tsx) -- not
    // introducing a stricter rule than the one already adopted elsewhere
    // in the app.
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }
    if (password !== confirmPassword) {
      toast.error("Passwords don't match")
      return
    }

    setPending(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setPending(false)

    if (error) {
      // Supabase's own error message (e.g. "New password should be
      // different from the old password") is safe to show as-is -- it's
      // a validation message, not an internal/stack-trace detail.
      toast.error(error.message)
      return
    }

    setSuccess(true)
    toast.success("Password updated")
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
            <p className="text-sm">Checking your reset link…</p>
          </div>
        )}

        {sessionState === "invalid" && (
          <div className="flex flex-col gap-4 text-center">
            <div className="flex flex-col gap-1.5">
              <h1 className="text-2xl font-semibold tracking-tight">Link invalid or expired</h1>
              <p className="text-sm text-muted-foreground text-pretty">
                This password reset link is no longer valid. Request a new one to continue.
              </p>
            </div>
            <Button render={<Link href="/forgot-password" />}>Request a new link</Button>
            <Link href="/login" className="text-sm font-medium text-brand hover:underline">
              Back to sign in
            </Link>
          </div>
        )}

        {sessionState === "valid" && success && (
          <div className="flex flex-col gap-4 text-center">
            <div className="flex flex-col gap-1.5">
              <h1 className="text-2xl font-semibold tracking-tight">Password updated</h1>
              <p className="text-sm text-muted-foreground text-pretty">
                Your password has been changed. You&apos;re signed in with your new password.
              </p>
            </div>
            <Button
              onClick={() => {
                router.push("/")
                router.refresh()
              }}
            >
              Continue to your garage
            </Button>
          </div>
        )}

        {sessionState === "valid" && !success && (
          <form onSubmit={submit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-1.5">
              <h1 className="text-2xl font-semibold tracking-tight">Set a new password</h1>
              <p className="text-sm text-muted-foreground">Choose a new password for your account.</p>
            </div>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="new-password">New password</FieldLabel>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <FieldDescription>At least 6 characters.</FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="confirm-password">Confirm password</FieldLabel>
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
              {pending ? "Updating…" : "Update password"}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
