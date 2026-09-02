// Typed Drizzle client, built on the `postgres` (postgres.js) driver.
//
// This is the APPLICATION RUNTIME connection — every Server Action in
// lib/actions/*.ts and every query in lib/db/queries/*.ts goes through
// this. As of Step 5, DATABASE_URL should point at the restricted
// `trackdash_app` role (migration 0004_app_runtime_role.sql), not
// Supabase's privileged default `postgres` role — see lib/db/rls.ts and
// docs/SUPABASE_SETUP.md for why that split exists and how to set it up.
// Migrations use a separate, privileged connection (MIGRATION_DATABASE_URL,
// drizzle.config.ts only) — this file is never imported by drizzle-kit.

import "server-only"

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
