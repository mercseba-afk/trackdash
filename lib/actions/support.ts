"use server"

import { getCurrentUser } from "@/lib/auth/current-user"
import { createClient } from "@/lib/supabase/server"

export type SupportCategory = "problem" | "feature_request" | "model_release_request" | "other"
export type SupportStatus = "open" | "in_review" | "planned" | "resolved" | "closed"

export type SupportRequestView = {
  id: string
  category: SupportCategory
  subject: string
  message: string
  status: SupportStatus
  context: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

const CATEGORIES = new Set<SupportCategory>(["problem", "feature_request", "model_release_request", "other"])

export async function createSupportRequestAction(input: {
  category: SupportCategory
  subject: string
  message: string
  context?: Record<string, unknown>
}) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")
  if (!CATEGORIES.has(input.category)) throw new Error("Invalid support category")

  const subject = input.subject.trim()
  const message = input.message.trim()
  if (!subject || subject.length > 160) throw new Error("Subject must be between 1 and 160 characters")
  if (!message || message.length > 5000) throw new Error("Message must be between 1 and 5000 characters")

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("support_requests")
    .insert({
      user_id: user.id,
      category: input.category,
      subject,
      message,
      context: input.context ?? {},
    })
    .select("id,category,subject,message,status,context,created_at,updated_at")
    .single()

  if (error) throw new Error(error.message)
  return {
    id: data.id,
    category: data.category as SupportCategory,
    subject: data.subject,
    message: data.message,
    status: data.status as SupportStatus,
    context: (data.context ?? {}) as Record<string, unknown>,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  } satisfies SupportRequestView
}

export async function getMySupportRequestsAction(): Promise<SupportRequestView[]> {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("support_requests")
    .select("id,category,subject,message,status,context,created_at,updated_at")
    .order("created_at", { ascending: false })
    .limit(20)

  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => ({
    id: row.id,
    category: row.category as SupportCategory,
    subject: row.subject,
    message: row.message,
    status: row.status as SupportStatus,
    context: (row.context ?? {}) as Record<string, unknown>,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))
}
