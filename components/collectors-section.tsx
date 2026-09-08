"use client"

import * as React from "react"
import Link from "next/link"
import { Handshake, Loader2, Users } from "lucide-react"
import { getReleaseCollectorsAction } from "@/lib/actions/sharing"
import { useStore } from "@/lib/store"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type CollectorRow = Awaited<ReturnType<typeof getReleaseCollectorsAction>>[number]

export function CollectorsSection({ releaseId }: { releaseId: string }) {
  const { user } = useStore()
  const [rows, setRows] = React.useState<CollectorRow[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false

    if (!user) {
      setRows([])
      setLoading(false)
      return () => {
        cancelled = true
      }
    }

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
  }, [releaseId, user])

  const collectors = React.useMemo(() => {
    const grouped = new Map<
      string,
      CollectorRow & { copies: number; conditions: Set<string>; openToOffers: boolean }
    >()

    for (const row of rows) {
      const existing = grouped.get(row.userId)
      if (existing) {
        existing.copies += 1
        existing.conditions.add(row.condition)
        existing.openToOffers ||= row.shareMode === "open_to_offers"
      } else {
        grouped.set(row.userId, {
          ...row,
          copies: 1,
          conditions: new Set([row.condition]),
          openToOffers: row.shareMode === "open_to_offers",
        })
      }
    }

    return [...grouped.values()].sort((a, b) => Number(b.openToOffers) - Number(a.openToOffers))
  }, [rows])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="size-4 text-muted-foreground" />
          Collectors
          {!loading && user ? <Badge variant="secondary">{collectors.length}</Badge> : null}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!user ? (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Sign in to see collectors who have shared this release.
          </div>
        ) : loading ? (
          <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading shared collectors…
          </div>
        ) : collectors.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            No collector has shared this release yet. Collection items stay private unless their owner explicitly shares them.
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {collectors.map((collector) => (
              <Link
                key={collector.userId}
                href={`/collectors/${encodeURIComponent(collector.username)}`}
                className="flex items-center gap-3 rounded-lg border bg-background p-3 transition-colors hover:border-brand/40 hover:bg-muted/30"
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
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
