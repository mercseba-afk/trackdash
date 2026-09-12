"use server"

import { getCurrentUser } from "@/lib/auth/current-user"
import { createClient } from "@/lib/supabase/server"

export type AppNotification = {
  id: string
  type: string
  title: string | null
  body: string | null
  href: string | null
  entityType: string | null
  entityId: string | null
  metadata: Record<string, unknown>
  availableAt: string
  readAt: string | null
  createdAt: string
}

type NotificationRow = {
  id: string
  type: string
  title: string | null
  body: string | null
  href: string | null
  entity_type: string | null
  entity_id: string | null
  metadata: Record<string, unknown> | null
  available_at: string
  read_at: string | null
  created_at: string
}

function mapNotification(row: NotificationRow): AppNotification {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    href: row.href,
    entityType: row.entity_type,
    entityId: row.entity_id,
    metadata: row.metadata ?? {},
    availableAt: row.available_at,
    readAt: row.read_at,
    createdAt: row.created_at,
  }
}

export async function getNotificationsAction(limit = 30): Promise<AppNotification[]> {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = await createClient()
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 50)
  const { data, error } = await supabase
    .from("notifications")
    .select("id,type,title,body,href,entity_type,entity_id,metadata,available_at,read_at,created_at")
    .lte("available_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(safeLimit)

  if (error) throw new Error(error.message)
  return ((data ?? []) as NotificationRow[]).map(mapNotification)
}

export async function getUnreadNotificationCountAction(): Promise<number> {
  const user = await getCurrentUser()
  if (!user) return 0

  const supabase = await createClient()
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null)
    .lte("available_at", new Date().toISOString())

  if (error) throw new Error(error.message)
  return count ?? 0
}

export async function markNotificationReadAction(id: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")

  const supabase = await createClient()
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .is("read_at", null)

  if (error) throw new Error(error.message)
}

export async function markAllNotificationsReadAction() {
  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")

  const supabase = await createClient()
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null)
    .lte("available_at", new Date().toISOString())

  if (error) throw new Error(error.message)
}
