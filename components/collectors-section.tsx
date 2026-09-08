"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Handshake, Loader2, MessageCircle, Users } from "lucide-react"
import { getReleaseCollectorsAction } from "@/lib/actions/sharing"
import { createConversationRequestAction } from "@/lib/actions/messaging"
import { useStore } from "@/lib/store"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

type CollectorRow = Awaited<ReturnType<typeof getReleaseCollectorsAction>>[number]

export function CollectorsSection({ releaseId }: { releaseId: string }) {
  const { user } = useStore()
  const router = useRouter()
  const [rows, setRows] = React.useState<CollectorRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [requestTarget, setRequestTarget] = React.useState<{ username: string; shareId: string } | null>(null)
  const [requestText, setRequestText] = React.useState("")
  const [sending, setSending] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)

    getReleaseCollectorsAction(releaseId)
      .then((result) => {
        if (!cancelled) setRows(result)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [releaseId])

  const collectors = React.useMemo(() => {
    const grouped = new Map<
      string,
      CollectorRow & { copies: number; conditions: Set<string>; openToOffers: boolean; openShareId?: string }
    >()

    for (const row of rows) {
      const existing = grouped.get(row.userId)
      if (existing) {
        existing.copies += 1
        existing.conditions.add(row.condition)
        existing.openToOffers ||= row.shareMode === "open_to_offers"
        if (!existing.openShareId && row.shareMode === "open_to_offers") existing.openShareId = row.id
      } else {
        grouped.set(row.userId, {
          ...row,
          copies: 1,
          conditions: new Set([row.condition]),
          openToOffers: row.shareMode === "open_to_offers",
          openShareId: row.shareMode === "open_to_offers" ? row.id : undefined,
        })
      }
    }

    return [...grouped.values()].sort((a, b) => Number(b.openToOffers) - Number(a.openToOffers))
  }, [rows])

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="size-4 text-muted-foreground" />
            Collectors
            {!loading ? <Badge variant="secondary">{collectors.length}</Badge> : null}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading shared collectors…
            </div>
          ) : !user ? (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              Sign in to see collectors who shared this release and contact owners who are open to offers.
            </div>
          ) : collectors.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              No collector has shared this release yet. Collection items stay private unless their owner explicitly shares them.
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {collectors.map((collector) => (
                <div
                  key={collector.userId}
                  className="flex items-center gap-2 rounded-lg border bg-background p-3 transition-colors hover:border-brand/40 hover:bg-muted/30"
                >
                  <Link
                    href={`/collectors/${encodeURIComponent(collector.username)}`}
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted font-semibold uppercase">
                      {collector.username.slice(0, 1)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="truncate text-sm font-medium">
                          {collector.username}{collector.userId === user.id ? " (you)" : ""}
                        </span>
                        {collector.openToOffers ? (
                          <Badge variant="secondary" className="gap-1 bg-brand/15 text-brand">
                            <Handshake className="size-3" /> Open to offers
                          </Badge>
                        ) : null}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {[...collector.conditions].join(" / ")}
                        {collector.copies > 1 ? ` · ${collector.copies} shared copies` : ""}
                        {collector.country ? ` · ${collector.country}` : ""}
                      </p>
                    </div>
                  </Link>
                  {collector.userId !== user.id && collector.openShareId ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 gap-1"
                      onClick={() => {
                        setRequestTarget({ username: collector.username, shareId: collector.openShareId! })
                        setRequestText("")
                      }}
                    >
                      <MessageCircle className="size-3.5" /> Message
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(requestTarget)} onOpenChange={(open) => !open && setRequestTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact {requestTarget?.username}</DialogTitle>
            <DialogDescription>
              Send an initial request about this exact release. The collector must accept before a chat opens.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={requestText}
            maxLength={1000}
            placeholder="Hi, I saw you're open to offers for this release…"
            onChange={(event) => setRequestText(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">{requestText.trim().length}/1000</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestTarget(null)} disabled={sending}>Cancel</Button>
            <Button
              disabled={sending || !requestText.trim() || !requestTarget}
              onClick={async () => {
                if (!requestTarget) return
                setSending(true)
                try {
                  const conversation = await createConversationRequestAction(requestTarget.shareId, requestText)
                  toast.success("Request sent")
                  setRequestTarget(null)
                  router.push(`/messages?conversation=${conversation.id}`)
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Couldn't send request")
                } finally {
                  setSending(false)
                }
              }}
            >
              {sending ? <Loader2 className="size-4 animate-spin" /> : <MessageCircle className="size-4" />}
              Send request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
