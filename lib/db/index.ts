// Typed Drizzle client, built on the `postgres` (postgres.js) driver.
//
// NOTE (Step 2 — schema/migrations only): nothing in the app imports this
// yet. It's prepared here so future server actions/route handlers have a
// single, correctly-typed `db` to import once the UI is wired up to real
// persistence in a later step.
//
// Requires DATABASE_URL — the direct/session Postgres connection string
// from Supabase (Project Settings > Database), NOT the same value as
// NEXT_PUBLIC_SUPABASE_URL used by lib/supabase/*. That one talks to the
// Supabase API; this one is a raw Postgres connection for Drizzle.

import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and fill in your Supabase connection string.")
}

// A single shared connection is fine for Next.js server runtime; `prepare:
// false` is required when connecting through Supabase's transaction-mode
// pooler, which doesn't support prepared statements.
const client = postgres(connectionString, { prepare: false })

export const db = drizzle(client, { schema })
