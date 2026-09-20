"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { KeyRound, LockKeyhole, Mail, ShieldCheck, Trash2 } from "lucide-react"
import { deleteMyAccountAction, updateMyEmailAction, updateMyPasswordAction } from "@/lib/actions/account"
import { createClient } from "@/lib/supabase/client"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

type Enrollment = { factorId: string; qrCode: string; secret: string }

export function AccountSecurityPanel() {
  const { user } = useStore()
  const { locale } = useI18n()
  const router = useRouter()
  const it = locale === "it"
  const isAdmin = user?.email?.toLowerCase() === "merc.seba@gmail.com"

  const [email, setEmail] = React.useState(user?.email ?? "")
  const [newPassword, setNewPassword] = React.useState("")
  const [factorsLoading, setFactorsLoading] = React.useState(true)
  const [verifiedFactorId, setVerifiedFactorId] = React.useState<string | null>(null)
  const [enrollment, setEnrollment] = React.useState<Enrollment | null>(null)
  const [mfaCode, setMfaCode] = React.useState("")
  const [pending, setPending] = React.useState<string | null>(null)
  const [deleteText, setDeleteText] = React.useState("")

  React.useEffect(() => setEmail(user?.email ?? ""), [user?.email])

  const reloadFactors = React.useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase.auth.mfa.listFactors()
    if (error) {
      toast.error(error.message)
      setFactorsLoading(false)
      return
    }
    const verified = data.totp.find((factor) => factor.status === "verified")
    setVerifiedFactorId(verified?.id ?? null)
    setFactorsLoading(false)
  }, [])

  React.useEffect(() => {
    void reloadFactors()
  }, [reloadFactors])

  async function updateEmail() {
    const nextEmail = email.trim().toLowerCase()
    if (!nextEmail.includes("@")) return toast.error(it ? "Email non valida" : "Invalid email")
    if (isAdmin && nextEmail !== user?.email?.toLowerCase()) {
      return toast.error(it ? "L'email dell'account Admin è protetta" : "The Admin account email is protected")
    }

    setPending("email")
    try {
      await updateMyEmailAction(nextEmail)
      toast.success(it ? "Controlla la tua email per confermare la modifica" : "Check your email to confirm the change")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (it ? "Modifica email non riuscita" : "Email change failed"))
    } finally {
      setPending(null)
    }
  }

  async function updatePassword() {
    if (newPassword.length < 10) {
      return toast.error(it ? "Usa una password di almeno 10 caratteri" : "Use a password of at least 10 characters")
    }
    setPending("password")
    try {
      await updateMyPasswordAction(newPassword)
      setNewPassword("")
      toast.success(it ? "Password aggiornata" : "Password updated")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (it ? "Modifica password non riuscita" : "Password change failed"))
    } finally {
      setPending(null)
    }
  }

  async function beginMfaEnrollment() {
    setPending("mfa-enroll")
    const supabase = createClient()
    const existing = await supabase.auth.mfa.listFactors()
    if (existing.error) {
      setPending(null)
      return toast.error(existing.error.message)
    }
    for (const factor of existing.data.totp.filter((item) => item.status === "unverified")) {
      await supabase.auth.mfa.unenroll({ factorId: factor.id })
    }
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "TrackDash",
    })
    setPending(null)
    if (error) return toast.error(error.message)
    const totp = data.totp
    if (!totp) return toast.error(it ? "Configurazione 2FA non disponibile" : "2FA setup is unavailable")
    setEnrollment({ factorId: data.id, qrCode: totp.qr_code, secret: totp.secret })
    setMfaCode("")
  }

  async function verifyMfaEnrollment() {
    if (!enrollment || !/^\d{6}$/.test(mfaCode)) return
    setPending("mfa-verify")
    const supabase = createClient()
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId: enrollment.factorId,
      code: mfaCode,
    })
    setPending(null)
    if (error) return toast.error(error.message)
    setEnrollment(null)
    setMfaCode("")
    await reloadFactors()
    toast.success(it ? "2FA attivata" : "2FA enabled")
    router.refresh()
  }

  async function disableMfa() {
    if (!verifiedFactorId || isAdmin) return
    if (!window.confirm(it ? "Disattivare la 2FA per questo account?" : "Disable 2FA for this account?")) return
    setPending("mfa-disable")
    const supabase = createClient()
    const { error } = await supabase.auth.mfa.unenroll({ factorId: verifiedFactorId })
    setPending(null)
    if (error) return toast.error(error.message)
    setVerifiedFactorId(null)
    toast.success(it ? "2FA disattivata" : "2FA disabled")
  }

  async function deleteAccount() {
    if (isAdmin) return
    if (deleteText.trim().toUpperCase() !== "ELIMINA") {
      return toast.error(it ? "Scrivi ELIMINA per confermare" : "Type ELIMINA to confirm")
    }
    if (!window.confirm(it ? "Questa operazione è definitiva. Eliminare davvero l'account?" : "This is permanent. Delete the account?")) return

    setPending("delete")
    try {
      await deleteMyAccountAction(deleteText)
      const supabase = createClient()
      await supabase.auth.signOut({ scope: "local" }).catch(() => {})
      window.location.assign("/")
    } catch (error) {
      setPending(null)
      toast.error(error instanceof Error ? error.message : (it ? "Eliminazione non riuscita" : "Deletion failed"))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="size-4 text-muted-foreground" />
          {it ? "Sicurezza account" : "Account security"}
        </CardTitle>
        <CardDescription>
          {it ? "Credenziali, autenticazione a due fattori e cancellazione dell'account." : "Credentials, two-factor authentication, and account deletion."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col">
        <div className="grid gap-3 py-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <label className="grid gap-1.5 text-sm font-medium">
            <span className="flex items-center gap-1.5"><Mail className="size-3.5" /> Email</span>
            <Input type="email" value={email} disabled={isAdmin} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <Button variant="outline" disabled={isAdmin || pending === "email" || email.trim().toLowerCase() === user?.email?.toLowerCase()} onClick={updateEmail}>
            {pending === "email" ? (it ? "Invio…" : "Sending…") : (it ? "Modifica email" : "Change email")}
          </Button>
        </div>

        <Separator />

        <div className="grid gap-3 py-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <label className="grid gap-1.5 text-sm font-medium">
            <span className="flex items-center gap-1.5"><LockKeyhole className="size-3.5" /> {it ? "Nuova password" : "New password"}</span>
            <Input type="password" autoComplete="new-password" minLength={10} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder={it ? "Almeno 10 caratteri" : "At least 10 characters"} />
          </label>
          <Button variant="outline" disabled={pending === "password" || newPassword.length < 10} onClick={updatePassword}>
            {pending === "password" ? (it ? "Salvataggio…" : "Saving…") : (it ? "Aggiorna password" : "Update password")}
          </Button>
        </div>

        <Separator />

        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{it ? "Autenticazione a due fattori (2FA)" : "Two-factor authentication (2FA)"}</p>
                {!factorsLoading ? <Badge variant={verifiedFactorId ? "default" : "secondary"}>{verifiedFactorId ? (it ? "Attiva" : "Enabled") : (it ? "Non attiva" : "Disabled")}</Badge> : null}
                {isAdmin ? <Badge variant="secondary">{it ? "Obbligatoria Admin" : "Required for Admin"}</Badge> : null}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {it ? "Usa un'app Authenticator: il codice cambia ogni 30 secondi e protegge l'accesso anche se la password viene rubata." : "Use an Authenticator app: the rotating code protects sign-in even if your password is stolen."}
              </p>
            </div>
            {!verifiedFactorId && !enrollment ? (
              <Button onClick={beginMfaEnrollment} disabled={factorsLoading || pending === "mfa-enroll"}>
                <KeyRound data-icon="inline-start" />
                {it ? "Attiva 2FA" : "Enable 2FA"}
              </Button>
            ) : verifiedFactorId && !isAdmin ? (
              <Button variant="outline" onClick={disableMfa} disabled={pending === "mfa-disable"}>
                {it ? "Disattiva 2FA" : "Disable 2FA"}
              </Button>
            ) : null}
          </div>

          {enrollment ? (
            <div className="grid gap-4 rounded-xl border bg-muted/20 p-4 md:grid-cols-[auto_1fr]">
              <div className="rounded-xl border bg-white p-2">
                <img src={enrollment.qrCode} alt="2FA QR code" className="size-44" />
              </div>
              <div className="flex min-w-0 flex-col gap-3">
                <p className="text-sm text-muted-foreground">
                  {it ? "Scansiona il QR, poi inserisci il codice a 6 cifre generato dall'app." : "Scan the QR code, then enter the 6-digit code generated by the app."}
                </p>
                <div className="rounded-lg border bg-background p-2">
                  <p className="text-[11px] text-muted-foreground">{it ? "Chiave manuale" : "Manual key"}</p>
                  <code className="block break-all text-xs">{enrollment.secret}</code>
                </div>
                <div className="flex gap-2">
                  <Input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={mfaCode} onChange={(event) => setMfaCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="123456" />
                  <Button onClick={verifyMfaEnrollment} disabled={mfaCode.length !== 6 || pending === "mfa-verify"}>{it ? "Verifica" : "Verify"}</Button>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <Separator />

        <div className="flex flex-col gap-3 py-4">
          <div>
            <p className="text-sm font-medium text-destructive">{it ? "Elimina account" : "Delete account"}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {isAdmin
                ? (it ? "L'account amministratore è protetto e non può essere eliminato da qui." : "The administrator account is protected and cannot be deleted here.")
                : (it ? "Elimina definitivamente account, profilo e dati collegati. Scrivi ELIMINA per confermare." : "Permanently delete your account, profile and linked data. Type ELIMINA to confirm.")}
            </p>
          </div>
          {!isAdmin ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input value={deleteText} onChange={(event) => setDeleteText(event.target.value)} placeholder="ELIMINA" className="sm:max-w-xs" />
              <Button variant="destructive" onClick={deleteAccount} disabled={deleteText.trim().toUpperCase() !== "ELIMINA" || pending === "delete"}>
                <Trash2 data-icon="inline-start" />
                {pending === "delete" ? (it ? "Eliminazione…" : "Deleting…") : (it ? "Elimina definitivamente" : "Delete permanently")}
              </Button>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
