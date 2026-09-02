import { sql } from "drizzle-orm"
import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/current-user"
import { db } from "@/lib/db"
import { createClient } from "@/lib/supabase/server"

// Development-only diagnostic endpoint: GET /api/dev/health.
//
// Answers "is this environment actually wired up to a real Supabase
// project" without requiring the person to open a debugger or read logs —
// meant for exactly the situation this app is in during Step 5: no live
// project connected yet, and a fast way to tell what's missing once one
// is. Reports booleans and small counts only.
//
// NEVER returns: connection strings, passwords, tokens, API keys (public
// or secret), or full error stack traces — only whether each env var is
// SET (not its value) and a short, generic error message on failure.
//
// Returns 404 outside development so this never ships reachable in a
// production deployment, regardless of whether the route file itself gets
// deployed.
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available outside development" }, { status: 404 })
  }

  const checks: Record<string, unknown> = {}

  checks.env = {
    NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    DATABASE_URL: Boolean(process.env.DATABASE_URL),
    MIGRATION_DATABASE_URL: Boolean(process.env.MIGRATION_DATABASE_URL),
  }

  try {
    await db.execute(sql`select 1`)
    checks.database = { connected: true }
  } catch (error) {
    checks.database = { connected: false, error: shortMessage(error) }
  }

  try {
    const rows = await db.execute<{ count: number }>(sql`select count(*)::int as count from products`)
    checks.catalog = { accessible: true, productCount: rows[0]?.count ?? null }
  } catch (error) {
    checks.catalog = { accessible: false, error: shortMessage(error) }
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getSession()
    checks.supabaseAuth = { reachable: !error, hasSession: Boolean(data.session) }
  } catch (error) {
    checks.supabaseAuth = { reachable: false, error: shortMessage(error) }
  }

  try {
    const user = await getCurrentUser()
    checks.currentUser = user ? { id: user.id, email: user.email } : null
  } catch (error) {
    checks.currentUser = { error: shortMessage(error) }
  }

  return NextResponse.json({ timestamp: new Date().toISOString(), checks })
}

function shortMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message.length > 200 ? `${message.slice(0, 200)}…` : message
}
