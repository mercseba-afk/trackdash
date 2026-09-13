"use client"

import * as React from "react"
import { LifeBuoy, Lightbulb, PackageSearch, Wrench } from "lucide-react"
import {
  createSupportRequestAction,
  getMySupportRequestsAction,
  type SupportCategory,
  type SupportRequestView,
  type SupportStatus,
} from "@/lib/actions/support"
import { useI18n } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

const CATEGORY_VALUES: SupportCategory[] = ["problem", "feature_request", "model_release_request", "other"]

function categoryLabel(value: SupportCategory, it: boolean) {
  switch (value) {
    case "problem": return it ? "Problema" : "Problem"
    case "feature_request": return it ? "Suggerimento / Feature request" : "Suggestion / Feature request"
    case "model_release_request": return it ? "Richiesta modello o Release" : "Model or Release request"
    case "other": return it ? "Altro" : "Other"
  }
}

function categoryIcon(value: SupportCategory) {
  if (value === "problem") return Wrench
  if (value === "feature_request") return Lightbulb
  if (value === "model_release_request") return PackageSearch
  return LifeBuoy
}

function statusLabel(value: SupportStatus, it: boolean) {
  const labels: Record<SupportStatus, [string, string]> = {
    open: ["Aperta", "Open"],
    in_review: ["In verifica", "In review"],
    planned: ["Pianificata", "Planned"],
    resolved: ["Risolta", "Resolved"],
    closed: ["Chiusa", "Closed"],
  }
  return labels[value][it ? 0 : 1]
}

export function SupportScreen({
  initialCategory,
  initialQuery,
  initialRequestId,
}: {
  initialCategory?: string
  initialQuery?: string
  initialRequestId?: string
}) {
  const { locale } = useI18n()
  const it = locale === "it"
  const requestedCategory = CATEGORY_VALUES.includes(initialCategory as SupportCategory)
    ? initialCategory as SupportCategory
    : "problem"
  const contextualQuery = initialQuery?.trim() ?? ""
  const [category, setCategory] = React.useState<SupportCategory>(requestedCategory)
  const [subject, setSubject] = React.useState(
    requestedCategory === "model_release_request" && contextualQuery
      ? (it ? `Richiesta inserimento: ${contextualQuery}` : `Catalog request: ${contextualQuery}`)
      : "",
  )
  const [message, setMessage] = React.useState(
    requestedCategory === "model_release_request" && contextualQuery
      ? (it ? `Modello / item number cercato nel Catalogo: ${contextualQuery}` : `Model / item number searched in Catalog: ${contextualQuery}`)
      : "",
  )
  const [requests, setRequests] = React.useState<SupportRequestView[]>([])
  const [busy, setBusy] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    getMySupportRequestsAction()
      .then((rows) => { if (!cancelled) setRequests(rows) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  async function submit() {
    if (!subject.trim() || !message.trim()) {
      toast.error(it ? "Compila oggetto e messaggio." : "Enter a subject and message.")
      return
    }

    setBusy(true)
    try {
      const created = await createSupportRequestAction({
        category,
        subject,
        message,
        context: {
          source: contextualQuery ? "catalog_no_results" : "support_form",
          ...(contextualQuery ? { catalogQuery: contextualQuery } : {}),
        },
      })
      setRequests((current) => [created, ...current])
      setSubject("")
      setMessage("")
      toast.success(it ? "Richiesta inviata." : "Request sent.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (it ? "Invio non riuscito." : "Couldn't send request."))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{it ? "Assistenza e suggerimenti" : "Support & suggestions"}</h1>
        <p className="text-sm text-muted-foreground">
          {it ? "Segnala un problema, proponi una funzione o chiedi l'inserimento di una Release. Non è una chat: ogni richiesta resta strutturata e tracciabile." : "Report a problem, suggest a feature or request a Release. This is not a chat: every request stays structured and trackable."}
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">{it ? "Nuova richiesta" : "New request"}</CardTitle></CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel>{it ? "Categoria" : "Category"}</FieldLabel>
              <Select value={category} onValueChange={(value) => setCategory(value as SupportCategory)}>
                <SelectTrigger className="w-full"><SelectValue>{(value: SupportCategory) => categoryLabel(value, it)}</SelectValue></SelectTrigger>
                <SelectContent>
                  {CATEGORY_VALUES.map((value) => <SelectItem key={value} value={value}>{categoryLabel(value, it)}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="support-subject">{it ? "Oggetto" : "Subject"}</FieldLabel>
              <Input id="support-subject" maxLength={160} value={subject} onChange={(event) => setSubject(event.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="support-message">{it ? "Messaggio" : "Message"}</FieldLabel>
              <textarea
                id="support-message"
                maxLength={5000}
                rows={6}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20"
              />
              {contextualQuery ? <p className="text-xs text-muted-foreground">{it ? `Ricerca precompilata: ${contextualQuery}` : `Pre-filled search: ${contextualQuery}`}</p> : null}
            </Field>
            <div className="flex justify-end"><Button disabled={busy} onClick={() => void submit()}>{busy ? (it ? "Invio…" : "Sending…") : (it ? "Invia richiesta" : "Send request")}</Button></div>
          </FieldGroup>
        </CardContent>
      </Card>

      {requests.length > 0 ? (
        <Card>
          <CardHeader><CardTitle className="text-base">{it ? "Le tue richieste" : "Your requests"}</CardTitle></CardHeader>
          <CardContent className="grid gap-2">
            {requests.map((request) => {
              const Icon = categoryIcon(request.category)
              const highlighted = request.id === initialRequestId
              return (
                <div key={request.id} className={`flex items-start gap-3 rounded-lg border p-3 ${highlighted ? "border-brand/50 bg-brand/5" : ""}`}>
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted"><Icon className="size-4" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-medium">{request.subject}</p><Badge variant="secondary">{statusLabel(request.status, it)}</Badge></div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{categoryLabel(request.category, it)} · {new Date(request.createdAt).toLocaleDateString(it ? "it-IT" : "en-US")}</p>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
