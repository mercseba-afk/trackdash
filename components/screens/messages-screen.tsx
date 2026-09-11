"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Ban, Check, Loader2, MessageCircle, Send, Unlock, X } from "lucide-react"
import {
  blockCollectorAction,
  getConversationMessagesAction,
  getMyConversationsAction,
  markConversationReadAction,
  respondConversationAction,
  sendMessageAction,
  unblockCollectorAction,
} from "@/lib/actions/messaging"
import { createClient } from "@/lib/supabase/client"
import { useStore } from "@/lib/store"
import { useI18n } from "@/lib/i18n"
import { DealPanel } from "@/components/messaging/deal-panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { toast } from "sonner"

type Conversation = Awaited<ReturnType<typeof getMyConversationsAction>>[number]
type ChatMessage = Awaited<ReturnType<typeof getConversationMessagesAction>>[number]

function statusBadge(status: Conversation["status"], it: boolean) {
  if (status === "accepted") return <Badge className="bg-brand/15 text-brand">{it ? "Chat aperta" : "Chat open"}</Badge>
  if (status === "declined") return <Badge variant="outline">{it ? "Rifiutata" : "Declined"}</Badge>
  return <Badge variant="secondary">{it ? "In attesa" : "Pending"}</Badge>
}

export function MessagesScreen() {
  const { user } = useStore()
  const { locale, t } = useI18n(); const it = locale === "it"
  const router = useRouter()
  const searchParams = useSearchParams()
  const requestedConversationId = searchParams.get("conversation")
  const [conversations, setConversations] = React.useState<Conversation[]>([])
  const [selectedId, setSelectedId] = React.useState<string | null>(requestedConversationId)
  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [loading, setLoading] = React.useState(true)
  const [loadingMessages, setLoadingMessages] = React.useState(false)
  const [draft, setDraft] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const selected = conversations.find((conversation) => conversation.id === selectedId) ?? null

  const refreshConversations = React.useCallback(async () => {
    const rows = await getMyConversationsAction(); setConversations(rows)
    setSelectedId((current) => { if (requestedConversationId && rows.some((row) => row.id === requestedConversationId)) return requestedConversationId; if (current && rows.some((row) => row.id === current)) return current; return rows[0]?.id ?? null })
  }, [requestedConversationId])

  React.useEffect(() => { let cancelled = false; setLoading(true); getMyConversationsAction().then((rows) => { if (cancelled) return; setConversations(rows); setSelectedId(requestedConversationId && rows.some((row) => row.id === requestedConversationId) ? requestedConversationId : rows[0]?.id ?? null) }).finally(() => { if (!cancelled) setLoading(false) }); return () => { cancelled = true } }, [requestedConversationId])

  const refreshMessages = React.useCallback(async (conversationId: string) => { setLoadingMessages(true); try { setMessages(await getConversationMessagesAction(conversationId)) } finally { setLoadingMessages(false) } }, [])
  const markRead = React.useCallback(async (conversationId: string) => { try { await markConversationReadAction(conversationId); window.dispatchEvent(new Event("trackdash:messaging-read")) } catch {} }, [])

  React.useEffect(() => { if (!selectedId || document.visibilityState !== "visible") return; void markRead(selectedId) }, [markRead, selectedId])
  React.useEffect(() => {
    const refreshOnReturn = () => { if (document.visibilityState !== "visible") return; void refreshConversations().catch(() => {}); if (selectedId) void markRead(selectedId); if (selectedId && selected?.status === "accepted") void refreshMessages(selectedId).catch(() => {}) }
    window.addEventListener("focus", refreshOnReturn); document.addEventListener("visibilitychange", refreshOnReturn)
    return () => { window.removeEventListener("focus", refreshOnReturn); document.removeEventListener("visibilitychange", refreshOnReturn) }
  }, [markRead, refreshConversations, refreshMessages, selectedId, selected?.status])

  React.useEffect(() => {
    if (!selectedId || selected?.status !== "accepted") { setMessages([]); return }
    void refreshMessages(selectedId)
    const supabase = createClient()
    const refreshVisibleConversation = async () => { await refreshMessages(selectedId); if (document.visibilityState === "visible") await markRead(selectedId) }
    const channel = supabase.channel(`conversation:${selectedId}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${selectedId}` }, () => void refreshVisibleConversation()).subscribe((status) => { if (status === "SUBSCRIBED") void refreshVisibleConversation() })
    return () => { void supabase.removeChannel(channel) }
  }, [selectedId, selected?.status, selected?.blockedByMe, selected?.blockedByThem, refreshMessages, markRead])

  function selectConversation(id: string) { setSelectedId(id); setDraft(""); router.replace(`/messages?conversation=${id}`) }

  const submitMessage = React.useCallback(async () => {
    if (!selected || !draft.trim() || busy) return
    setBusy(true)
    try {
      const result = await sendMessageAction(selected.id, draft)
      if (!result.ok) {
        setDraft(""); await refreshConversations()
        toast.error(result.reason === "blocked" ? (it ? "I messaggi sono disattivati perché uno dei due collezionisti ha bloccato l'altro." : "Messaging is disabled because one collector has blocked the other.") : (it ? "Questa conversazione non è aperta ai messaggi." : "This conversation is not open for messages."))
        return
      }
      setDraft(""); await refreshMessages(selected.id); await markRead(selected.id)
    } catch (error) { toast.error(error instanceof Error ? error.message : it ? "Impossibile inviare il messaggio" : "Couldn't send message") }
    finally { setBusy(false) }
  }, [busy, draft, it, markRead, refreshConversations, refreshMessages, selected])

  if (loading) return <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> {it ? "Caricamento messaggi…" : "Loading messages…"}</div>

  if (conversations.length === 0) {
    return <div className="flex flex-col gap-6"><div><h1 className="text-2xl font-semibold tracking-tight">{t("messages.title")}</h1><p className="text-sm text-muted-foreground">{it ? "Richieste e conversazioni relative ai modelli aperti a offerte." : "Requests and conversations about items marked Open to offers."}</p></div><Empty className="rounded-lg border border-dashed border-border py-16"><EmptyHeader><EmptyMedia variant="icon"><MessageCircle /></EmptyMedia><EmptyTitle>{it ? "Nessuna conversazione" : "No conversations yet"}</EmptyTitle><EmptyDescription>{it ? "Quando contatti un collezionista per un modello aperto a offerte, o qualcuno contatta te, la richiesta apparirà qui." : "When you contact a collector about an Open to offers item, or someone contacts you, the request will appear here."}</EmptyDescription></EmptyHeader></Empty></div>
  }

  return (
    <div className="flex flex-col gap-6">
      <div><h1 className="text-2xl font-semibold tracking-tight">{t("messages.title")}</h1><p className="text-sm text-muted-foreground">{it ? "Chat, offerte e conferme delle compravendite tra collezionisti." : "Chat, offers and sale confirmations between collectors."}</p></div>
      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="h-fit"><CardHeader><CardTitle className="text-base">{it ? "Conversazioni" : "Conversations"}</CardTitle></CardHeader><CardContent className="grid gap-2">{conversations.map((conversation) => <button type="button" key={conversation.id} onClick={() => selectConversation(conversation.id)} className={`rounded-lg border p-3 text-left transition-colors ${selectedId === conversation.id ? "border-brand bg-brand/5" : "hover:bg-muted/40"}`}><div className="flex items-start justify-between gap-2"><span className="truncate text-sm font-medium">{conversation.otherUsername}</span>{statusBadge(conversation.status, it)}</div><p className="mt-1 truncate text-xs text-muted-foreground">{conversation.release.editionName}</p><p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{conversation.requestMessage}</p></button>)}</CardContent></Card>

        {selected ? <Card><CardHeader className="gap-3"><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle className="text-lg">{selected.otherUsername}</CardTitle><Link href={`/catalog/${selected.product.id}/releases/${selected.release.id}`} className="text-sm text-muted-foreground hover:text-brand">{selected.product.name} · {selected.release.editionName}{selected.release.itemNumber ? ` · #${selected.release.itemNumber}` : ""}</Link></div><div className="flex flex-wrap items-center gap-2">{statusBadge(selected.status, it)}{selected.blockedByMe ? <Button size="sm" variant="outline" className="gap-1" disabled={busy} onClick={async () => { setBusy(true); try { await unblockCollectorAction(selected.otherUserId); await refreshConversations(); toast.success(it ? `${selected.otherUsername} sbloccato` : `${selected.otherUsername} unblocked`) } catch (error) { toast.error(error instanceof Error ? error.message : it ? "Impossibile sbloccare il collezionista" : "Couldn't unblock collector") } finally { setBusy(false) } }}><Unlock className="size-3.5" /> {it ? "Sblocca" : "Unblock"}</Button> : <Button size="sm" variant="ghost" className="gap-1 text-muted-foreground hover:text-destructive" disabled={busy} onClick={async () => { if (!window.confirm(it ? `Bloccare ${selected.otherUsername}? Non potrà più inviarti messaggi.` : `Block ${selected.otherUsername}? They will no longer be able to message you.`)) return; setBusy(true); try { await blockCollectorAction(selected.otherUserId); await refreshConversations(); toast.success(it ? `${selected.otherUsername} bloccato` : `${selected.otherUsername} blocked`) } catch (error) { toast.error(error instanceof Error ? error.message : it ? "Impossibile bloccare il collezionista" : "Couldn't block collector") } finally { setBusy(false) } }}><Ban className="size-3.5" /> {it ? "Blocca" : "Block"}</Button>}</div></div></CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="rounded-lg border bg-muted/30 p-4"><p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{it ? "Richiesta iniziale" : "Initial request"}</p><p className="text-sm">{selected.requestMessage}</p></div>
            {selected.status === "pending" ? selected.isOwner ? <div className="flex flex-col gap-2">{!selected.offerStillOpen ? <p className="text-sm text-muted-foreground">{it ? "Questo modello non è più aperto a offerte, quindi la richiesta non può essere accettata. Puoi comunque rifiutarla." : "This item is no longer Open to offers, so this pending request cannot be accepted. You can still decline it."}</p> : selected.blockedByMe || selected.blockedByThem ? <p className="text-sm text-muted-foreground">{it ? "La richiesta non può essere accettata finché i messaggi tra questi collezionisti sono bloccati." : "This request cannot be accepted while messaging is blocked between these collectors."}</p> : null}<div className="flex flex-wrap gap-2"><Button className="gap-1" disabled={busy || !selected.canAccept} onClick={async () => { setBusy(true); try { await respondConversationAction(selected.id, "accepted"); await refreshConversations(); toast.success(it ? "Richiesta accettata — la chat è ora aperta" : "Request accepted — the chat is now open") } catch (error) { toast.error(error instanceof Error ? error.message : it ? "Impossibile accettare la richiesta" : "Couldn't accept request") } finally { setBusy(false) } }}><Check className="size-4" /> {it ? "Accetta richiesta" : "Accept request"}</Button><Button variant="outline" className="gap-1" disabled={busy} onClick={async () => { setBusy(true); try { await respondConversationAction(selected.id, "declined"); await refreshConversations(); toast.success(it ? "Richiesta rifiutata" : "Request declined") } catch (error) { toast.error(error instanceof Error ? error.message : it ? "Impossibile rifiutare la richiesta" : "Couldn't decline request") } finally { setBusy(false) } }}><X className="size-4" /> {it ? "Rifiuta" : "Decline"}</Button></div></div> : <p className="text-sm text-muted-foreground">{it ? "In attesa che il proprietario accetti o rifiuti la richiesta." : "Waiting for the owner to accept or decline your request."}</p> : null}
            {selected.status === "declined" ? <p className="text-sm text-muted-foreground">{it ? "La richiesta è stata rifiutata. Nessuna chat è stata aperta." : "This request was declined. No chat was opened."}</p> : null}
            {selected.status === "accepted" ? <><DealPanel conversation={selected} locale={it ? "it" : "en"} onActivity={refreshConversations} /><Separator /><div className="flex min-h-64 max-h-[55vh] flex-col gap-2 overflow-y-auto rounded-lg border p-3">{loadingMessages ? <div className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> {it ? "Caricamento conversazione…" : "Loading conversation…"}</div> : messages.length === 0 ? <p className="m-auto text-sm text-muted-foreground">{it ? "Richiesta accettata. Inizia la conversazione." : "Request accepted. Start the conversation."}</p> : messages.map((message) => { const mine = message.senderId === user?.id; return <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}><div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${mine ? "bg-brand text-brand-foreground" : "bg-muted"}`}><p className="whitespace-pre-wrap break-words">{message.body}</p><p className={`mt-1 text-[10px] ${mine ? "text-brand-foreground/70" : "text-muted-foreground"}`}>{new Date(message.createdAt).toLocaleString(it ? "it-IT" : "en-GB")}</p></div></div> })}</div>{selected.blockedByMe || selected.blockedByThem ? <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">{it ? "I messaggi sono disattivati perché uno dei collezionisti ha bloccato l'altro. La cronologia resta visibile." : "Messaging is disabled because one collector has blocked the other. Existing conversation history remains visible."}</div> : <div className="flex gap-2"><Input value={draft} maxLength={2000} placeholder={it ? "Scrivi un messaggio…" : "Write a message…"} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && draft.trim() && !busy) { event.preventDefault(); void submitMessage() } }} /><Button size="icon" aria-label={it ? "Invia messaggio" : "Send message"} disabled={busy || !draft.trim()} onClick={() => void submitMessage()}>{busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}</Button></div>}</> : null}
          </CardContent></Card> : null}
      </div>
    </div>
  )
}
