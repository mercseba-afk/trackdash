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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { toast } from "sonner"

type Conversation = Awaited<ReturnType<typeof getMyConversationsAction>>[number]
type ChatMessage = Awaited<ReturnType<typeof getConversationMessagesAction>>[number]

function statusBadge(status: Conversation["status"]) {
  if (status === "accepted") return <Badge className="bg-brand/15 text-brand">Accepted</Badge>
  if (status === "declined") return <Badge variant="outline">Declined</Badge>
  return <Badge variant="secondary">Pending</Badge>
}

export function MessagesScreen() {
  const { user } = useStore()
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
    const rows = await getMyConversationsAction()
    setConversations(rows)
    setSelectedId((current) => {
      if (requestedConversationId && rows.some((row) => row.id === requestedConversationId)) return requestedConversationId
      if (current && rows.some((row) => row.id === current)) return current
      return rows[0]?.id ?? null
    })
  }, [requestedConversationId])

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    getMyConversationsAction()
      .then((rows) => {
        if (cancelled) return
        setConversations(rows)
        const initial = requestedConversationId && rows.some((row) => row.id === requestedConversationId)
          ? requestedConversationId
          : rows[0]?.id ?? null
        setSelectedId(initial)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [requestedConversationId])

  const refreshMessages = React.useCallback(async (conversationId: string) => {
    setLoadingMessages(true)
    try {
      setMessages(await getConversationMessagesAction(conversationId))
    } finally {
      setLoadingMessages(false)
    }
  }, [])

  const markRead = React.useCallback(async (conversationId: string) => {
    try {
      await markConversationReadAction(conversationId)
      // AppShell owns the global badge. Tell it to recalculate immediately
      // instead of waiting for focus or another database event.
      window.dispatchEvent(new Event("trackdash:messaging-read"))
    } catch {
      // Reading a conversation should never be blocked by a cosmetic badge
      // update. The next focus/realtime event will retry the count.
    }
  }, [])

  React.useEffect(() => {
    if (!selectedId || document.visibilityState !== "visible") return
    void markRead(selectedId)
  }, [markRead, selectedId])

  React.useEffect(() => {
    const refreshOnReturn = () => {
      if (document.visibilityState !== "visible") return

      void refreshConversations().catch(() => {
        // Keep the current inbox state if a background refresh fails.
      })
      if (selectedId) {
        void markRead(selectedId)
      }
      if (selectedId && selected?.status === "accepted") {
        void refreshMessages(selectedId).catch(() => {
          // Realtime will keep listening even if this catch-up refresh fails.
        })
      }
    }

    window.addEventListener("focus", refreshOnReturn)
    document.addEventListener("visibilitychange", refreshOnReturn)
    return () => {
      window.removeEventListener("focus", refreshOnReturn)
      document.removeEventListener("visibilitychange", refreshOnReturn)
    }
  }, [markRead, refreshConversations, refreshMessages, selectedId, selected?.status])

  React.useEffect(() => {
    if (!selectedId || selected?.status !== "accepted") {
      setMessages([])
      return
    }

    void refreshMessages(selectedId)
    const supabase = createClient()
    const refreshVisibleConversation = async () => {
      await refreshMessages(selectedId)
      if (document.visibilityState === "visible") await markRead(selectedId)
    }

    const channel = supabase
      .channel(`conversation:${selectedId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${selectedId}` },
        () => void refreshVisibleConversation(),
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          void refreshVisibleConversation()
        }
      })

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [selectedId, selected?.status, selected?.blockedByMe, selected?.blockedByThem, refreshMessages, markRead])

  function selectConversation(id: string) {
    setSelectedId(id)
    setDraft("")
    router.replace(`/messages?conversation=${id}`)
  }

  const submitMessage = React.useCallback(async () => {
    if (!selected || !draft.trim() || busy) return

    setBusy(true)
    try {
      const result = await sendMessageAction(selected.id, draft)
      if (!result.ok) {
        setDraft("")
        await refreshConversations()
        toast.error(
          result.reason === "blocked"
            ? "Messaging is disabled because one collector has blocked the other."
            : "This conversation is not open for messages.",
        )
        return
      }

      setDraft("")
      await refreshMessages(selected.id)
      await markRead(selected.id)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't send message")
    } finally {
      setBusy(false)
    }
  }, [busy, draft, markRead, refreshConversations, refreshMessages, selected])

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading messages…
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
          <p className="text-sm text-muted-foreground">Requests and conversations about items marked Open to offers.</p>
        </div>
        <Empty className="rounded-lg border border-dashed border-border py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon"><MessageCircle /></EmptyMedia>
            <EmptyTitle>No conversations yet</EmptyTitle>
            <EmptyDescription>
              When you contact a collector about an Open to offers item, or someone contacts you, the request will appear here.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
        <p className="text-sm text-muted-foreground">A chat opens only after the owner accepts the request.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="h-fit">
          <CardHeader><CardTitle className="text-base">Conversations</CardTitle></CardHeader>
          <CardContent className="grid gap-2">
            {conversations.map((conversation) => (
              <button
                type="button"
                key={conversation.id}
                onClick={() => selectConversation(conversation.id)}
                className={`rounded-lg border p-3 text-left transition-colors ${selectedId === conversation.id ? "border-brand bg-brand/5" : "hover:bg-muted/40"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="truncate text-sm font-medium">{conversation.otherUsername}</span>
                  {statusBadge(conversation.status)}
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">{conversation.release.editionName}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{conversation.requestMessage}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        {selected ? (
          <Card>
            <CardHeader className="gap-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-lg">{selected.otherUsername}</CardTitle>
                  <Link
                    href={`/catalog/${selected.product.id}/releases/${selected.release.id}`}
                    className="text-sm text-muted-foreground hover:text-brand"
                  >
                    {selected.product.name} · {selected.release.editionName}
                    {selected.release.itemNumber ? ` · #${selected.release.itemNumber}` : ""}
                  </Link>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {statusBadge(selected.status)}
                  {selected.blockedByMe ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      disabled={busy}
                      onClick={async () => {
                        setBusy(true)
                        try {
                          await unblockCollectorAction(selected.otherUserId)
                          await refreshConversations()
                          toast.success(`${selected.otherUsername} unblocked`)
                        } catch (error) {
                          toast.error(error instanceof Error ? error.message : "Couldn't unblock collector")
                        } finally {
                          setBusy(false)
                        }
                      }}
                    >
                      <Unlock className="size-3.5" /> Unblock
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1 text-muted-foreground hover:text-destructive"
                      disabled={busy}
                      onClick={async () => {
                        if (!window.confirm(`Block ${selected.otherUsername}? They will no longer be able to message you.`)) return
                        setBusy(true)
                        try {
                          await blockCollectorAction(selected.otherUserId)
                          await refreshConversations()
                          toast.success(`${selected.otherUsername} blocked`)
                        } catch (error) {
                          toast.error(error instanceof Error ? error.message : "Couldn't block collector")
                        } finally {
                          setBusy(false)
                        }
                      }}
                    >
                      <Ban className="size-3.5" /> Block
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Initial request</p>
                <p className="text-sm">{selected.requestMessage}</p>
              </div>

              {selected.status === "pending" ? (
                selected.isOwner ? (
                  <div className="flex flex-col gap-2">
                    {!selected.offerStillOpen ? (
                      <p className="text-sm text-muted-foreground">
                        This item is no longer Open to offers, so this pending request cannot be accepted. You can still decline it.
                      </p>
                    ) : selected.blockedByMe || selected.blockedByThem ? (
                      <p className="text-sm text-muted-foreground">
                        This request cannot be accepted while messaging is blocked between these collectors.
                      </p>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        className="gap-1"
                        disabled={busy || !selected.canAccept}
                        onClick={async () => {
                          setBusy(true)
                          try {
                            await respondConversationAction(selected.id, "accepted")
                            await refreshConversations()
                            toast.success("Request accepted — the chat is now open")
                          } catch (error) {
                            toast.error(error instanceof Error ? error.message : "Couldn't accept request")
                          } finally {
                            setBusy(false)
                          }
                        }}
                      >
                        <Check className="size-4" /> Accept
                      </Button>
                      <Button
                        variant="outline"
                        className="gap-1"
                        disabled={busy}
                        onClick={async () => {
                          setBusy(true)
                          try {
                            await respondConversationAction(selected.id, "declined")
                            await refreshConversations()
                            toast.success("Request declined")
                          } catch (error) {
                            toast.error(error instanceof Error ? error.message : "Couldn't decline request")
                          } finally {
                            setBusy(false)
                          }
                        }}
                      >
                        <X className="size-4" /> Decline
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Waiting for the owner to accept or decline your request.</p>
                )
              ) : null}

              {selected.status === "declined" ? (
                <p className="text-sm text-muted-foreground">This request was declined. No chat was opened.</p>
              ) : null}

              {selected.status === "accepted" ? (
                <>
                  <Separator />
                  <div className="flex min-h-64 max-h-[55vh] flex-col gap-2 overflow-y-auto rounded-lg border p-3">
                    {loadingMessages ? (
                      <div className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="size-4 animate-spin" /> Loading conversation…
                      </div>
                    ) : messages.length === 0 ? (
                      <p className="m-auto text-sm text-muted-foreground">Request accepted. Start the conversation.</p>
                    ) : (
                      messages.map((message) => {
                        const mine = message.senderId === user?.id
                        return (
                          <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${mine ? "bg-brand text-brand-foreground" : "bg-muted"}`}>
                              <p className="whitespace-pre-wrap break-words">{message.body}</p>
                              <p className={`mt-1 text-[10px] ${mine ? "text-brand-foreground/70" : "text-muted-foreground"}`}>
                                {new Date(message.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>

                  {selected.blockedByMe || selected.blockedByThem ? (
                    <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                      Messaging is disabled because one collector has blocked the other. Existing conversation history remains visible.
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        value={draft}
                        maxLength={2000}
                        placeholder="Write a message…"
                        onChange={(event) => setDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && !event.shiftKey && draft.trim() && !busy) {
                            event.preventDefault()
                            void submitMessage()
                          }
                        }}
                      />
                      <Button
                        size="icon"
                        aria-label="Send message"
                        disabled={busy || !draft.trim()}
                        onClick={() => void submitMessage()}
                      >
                        {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                      </Button>
                    </div>
                  )}
                </>
              ) : null}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
