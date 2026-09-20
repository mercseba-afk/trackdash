"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { KeyRound, ShieldCheck } from "lucide-react"
import { BrandMark } from "@/components/brand-mark"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { useI18n } from "@/lib/i18n"
import { toast } from "sonner"

type Enrollment = {
  factorId: string
  qrCode: string
  secret: string
}

export function MfaScreen({ nextPath = "/dashboard" }: { nextPath?: string }) {
  const router = useRouter()
  const { locale } = useI18n()
  const it = locale === "it"
  const [loading, setLoading] = React.useState(true)
  const [verifiedFactorId, setVerifiedFactorId] = React.useState<string | null>(null)
  const [enrollment, setEnrollment] = React.useState<Enrollment | null>(null)
  const [code, setCode] = React.useState("")
  const [pending, setPending] = React.useState(false)

  const load = React.useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const factors = await supabase.auth.mfa.listFactors()
    if (factors.error) {
      setLoading(false)
      toast.error(factors.error.message)
      return
    }

    const verified = factors.data.totp.find((factor) => factor.status === "verified")
    if (verified) {
      setVerifiedFactorId(verified.id)
      setEnrollment(null)
      setLoading(false)
      return
    }

    const existingUnverified = factors.data.totp.find((factor) => factor.status === "unverified")
    if (existingUnverified) {
      await supabase.auth.mfa.unenroll({ factorId: existingUnverified.id })
    }

    const enrolled = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "TrackDash",
    })
    if (enrolled.error) {
      setLoading(false)
      toast.error(enrolled.error.message)
      return
    }

    setEnrollment({
      factorId: enrolled.data.id,
      qrCode: enrolled.data.totp.qr_code,
      secret: enrolled.data.totp.secret,
    })
    setVerifiedFactorId(null)
    setLoading(false)
  }, [])

  React.useEffect(() => {
    void load()
  }, [load])

  async function verify() {
    const cleanCode = code.replace(/\s+/g, "")
    if (!/^\d{6}$/.test(cleanCode)) {
      toast.error(it ? "Inserisci il codice a 6 cifre" : "Enter the 6-digit code")
      return
    }

    const factorId = verifiedFactorId ?? enrollment?.factorId
    if (!factorId) return

    setPending(true)
    const supabase = createClient()
    const result = await supabase.auth.mfa.challengeAndVerify({ factorId, code: cleanCode })
    setPending(false)

    if (result.error) {
      toast.error(result.error.message)
      return
    }

    toast.success(
      verifiedFactorId
        ? (it ? "Verifica completata" : "Verification complete")
        : (it ? "Autenticazione a due fattori attivata" : "Two-factor authentication enabled"),
    )
    router.replace(nextPath)
    router.refresh()
  }

  return (
    <div className="min-h-svh bg-background px-5 py-10 sm:px-8">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
        <BrandMark />
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="mb-2 grid size-11 place-items-center rounded-xl bg-brand/10 text-brand">
              <ShieldCheck className="size-5" />
            </div>
            <CardTitle>{it ? "Proteggi il tuo account" : "Secure your account"}</CardTitle>
            <CardDescription>
              {verifiedFactorId
                ? (it
                    ? "Apri la tua app Authenticator e inserisci il codice temporaneo."
                    : "Open your Authenticator app and enter the temporary code.")
                : (it
                    ? "Configura la verifica in due passaggi con Google Authenticator, Microsoft Authenticator, 1Password o un'app TOTP compatibile."
                    : "Set up two-step verification with Google Authenticator, Microsoft Authenticator, 1Password, or another TOTP app.")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {loading ? (
              <p className="text-sm text-muted-foreground">{it ? "Caricamento…" : "Loading…"}</p>
            ) : enrollment ? (
              <>
                <div className="mx-auto rounded-2xl border bg-white p-3">
                  <img src={enrollment.qrCode} alt={it ? "QR code per l'autenticazione a due fattori" : "Two-factor authentication QR code"} className="size-56" />
                </div>
                <div className="rounded-xl border bg-muted/30 p-3">
                  <p className="text-xs font-medium">{it ? "Codice manuale" : "Manual setup key"}</p>
                  <code className="mt-1 block break-all text-xs text-muted-foreground">{enrollment.secret}</code>
                </div>
              </>
            ) : null}

            {!loading ? (
              <div className="flex flex-col gap-3">
                <label className="text-sm font-medium" htmlFor="mfa-code">
                  {it ? "Codice Authenticator" : "Authenticator code"}
                </label>
                <Input
                  id="mfa-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="123456"
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void verify()
                  }}
                />
                <Button onClick={verify} disabled={pending || code.length !== 6}>
                  <KeyRound data-icon="inline-start" />
                  {pending ? (it ? "Verifica…" : "Verifying…") : verifiedFactorId ? (it ? "Verifica accesso" : "Verify sign in") : (it ? "Attiva 2FA" : "Enable 2FA")}
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
