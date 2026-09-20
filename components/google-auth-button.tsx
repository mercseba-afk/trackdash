"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useI18n } from "@/lib/i18n"
import { toast } from "sonner"

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4.5">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.23-.2-1.77H12v3.4h5.52a4.74 4.74 0 0 1-2.05 3.02l-.02.11 2.98 2.31.21.02c1.92-1.77 2.96-4.38 2.96-7.09Z" />
      <path fill="#34A853" d="M12 22c2.69 0 4.94-.89 6.59-2.42l-3.17-2.45c-.85.58-1.98.98-3.42.98-2.59 0-4.79-1.75-5.58-4.17l-.1.01-3.1 2.4-.04.1A9.96 9.96 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.42 13.94A6.16 6.16 0 0 1 6.08 12c0-.67.12-1.33.33-1.94l-.01-.13-3.14-2.44-.1.05A10 10 0 0 0 2 12c0 1.6.38 3.11 1.05 4.46l3.37-2.52Z" />
      <path fill="#EA4335" d="M12 5.89c1.86 0 3.11.8 3.83 1.46l2.82-2.75C16.92 2.99 14.69 2 12 2a9.96 9.96 0 0 0-8.83 5.54l3.25 2.52C7.21 7.64 9.41 5.89 12 5.89Z" />
    </svg>
  )
}

export function GoogleAuthButton({ nextPath }: { nextPath?: string }) {
  const { locale } = useI18n()
  const it = locale === "it"
  const [pending, setPending] = React.useState(false)

  async function continueWithGoogle() {
    if (pending) return
    setPending(true)

    try {
      const callbackUrl = new URL("/auth/callback", window.location.origin)
      callbackUrl.searchParams.set("flow", "google")
      callbackUrl.searchParams.set("next", nextPath ?? "/dashboard")

      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl.toString(),
        },
      })

      if (error) {
        setPending(false)
        toast.error(
          it
            ? "Non siamo riusciti ad avviare l'accesso con Google."
            : "We couldn't start Google sign-in.",
        )
      }
    } catch {
      setPending(false)
      toast.error(
        it
          ? "Non siamo riusciti ad avviare l'accesso con Google."
          : "We couldn't start Google sign-in.",
      )
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className="w-full rounded-xl bg-white"
      disabled={pending}
      onClick={() => void continueWithGoogle()}
    >
      <GoogleMark />
      {pending
        ? it ? "Apertura Google…" : "Opening Google…"
        : it ? "Continua con Google" : "Continue with Google"}
    </Button>
  )
}
