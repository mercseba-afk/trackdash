import "server-only"

import { sql } from "drizzle-orm"
import { db } from "./index"
import type { Database } from "./types"

// Makes the RLS policies defined across lib/db/schema/*.ts (auth.uid() =
// ...) actually apply to queries run through Drizzle's direct Postgres
// connection — which otherwise has no notion of "who is logged in".
//
// WHY THIS EXISTS
// ----------------
// Supabase enforces RLS automatically for requests that go through its own
// PostgREST/Data API, because it sets the Postgres role and JWT claims for
// you based on the caller's key. This app instead connects straight to
// Postgres via DATABASE_URL (lib/db/index.ts) for typed Drizzle queries,
// which bypasses that automatic wiring entirely — the RLS policies are
// real and correctly defined in the database, but nothing sets
// `auth.uid()` unless a request explicitly does so.
//
// This helper reproduces that wiring by hand, inside a transaction: it
// sets the same session variables Supabase's own `auth.uid()` /
// `auth.jwt()` functions read from, and switches the Postgres role to
// `authenticated`, so the policies evaluate exactly as they would through
// Supabase's API.
//
// TWO SEPARATE THINGS HAVE TO BE TRUE — LEARNED THE HARD WAY IN PRODUCTION
// --------------------------------------------------------------------------
// 1. The active role must hold an ordinary PostgreSQL GRANT (SELECT/
//    INSERT/UPDATE/DELETE) on the table at all — this is checked BEFORE
//    RLS ever runs, and has nothing to do with policies.
// 2. RLS policies then further restrict which ROWS are visible/writable
//    within whatever the GRANT allows.
//
// `SET LOCAL ROLE authenticated` below doesn't just help satisfy each
// policy's `TO authenticated` clause — it SWITCHES which role's grants
// apply for the rest of the transaction. Once set, `trackdash_app`'s own
// direct grants stop being what's checked; `authenticated`'s own grants
// are. Step 5 originally missed this and only granted privileges to
// `trackdash_app` (migration 0004) — which worked for ungated queries
// (see below) but meant `authenticated` itself owned no privileges at
// all, so the very first production request that went through
// withUserContext() failed with `permission denied for table profiles
// (42501)` — a plain GRANT problem, not an RLS one; the policies never
// even got evaluated. Migration 0005 (Step 5B) fixed this by granting
// `authenticated` its own explicit, table-by-table privileges matching
// its actual read/write surface, and narrowed `trackdash_app`'s own
// grants down from 0004's blanket CRUD to just what queries that DON'T
// go through this function need (see that migration's comments for the
// full table-by-table breakdown of both roles).
//
// IMPORTANT CAVEAT — read before relying on this for security
// --------------------------------------------------------------
// Switching role with `SET LOCAL ROLE` only has a real security effect if
// the Postgres role in DATABASE_URL is NOT allowed to bypass RLS. Supabase
// connection strings default to a broadly-privileged `postgres` role,
// which (depending on how the project is configured) may have BYPASSRLS —
// in which case this helper still runs correctly, but every row is
// visible regardless of the policies, silently.
//
// migration 0004 provisions a dedicated, restricted `trackdash_app` role
// (LOGIN, INHERIT, member of `authenticated` and `anon`, no BYPASSRLS) —
// see that migration's comments, migration 0005's grant breakdown, and
// docs/SUPABASE_SETUP.md for the full explanation and setup steps.
// DATABASE_URL should connect as `trackdash_app` for the app's normal
// runtime; MIGRATION_DATABASE_URL (drizzle.config.ts only) stays on the
// privileged role, since DDL/role management needs it.
//
// What actually protects owner-scoped tables (collection_items,
// wishlist_items, profiles, ...) at the ROW level is that their RLS
// policies check `auth.uid() = user_id`, and `auth.uid()` reads a session
// variable that's null by default. The `set_config(...)` calls here are
// what make it non-null for the duration of this transaction; skip them
// (i.e. query through the plain `db` singleton instead of this function)
// and — assuming the GRANT in point 1 above is even satisfied for
// whichever role is active — those policies correctly return zero rows
// rather than leaking data. RLS fails closed even if application code
// forgets to wrap a call, which remains true after the 0005 grant fix:
// narrowing `trackdash_app`'s own grants didn't touch any policy.
// Public catalog reads (lib/db/queries/catalog.ts) don't need any of
// this: `trackdash_app`'s own direct SELECT grant on those tables
// (migration 0005) plus their `to [anon, authenticated] using true`
// policies are satisfied without any JWT context, so those queries use
// the plain singleton directly.
export async function withUserContext<T>(userId: string, run: (tx: Database) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    const claims = JSON.stringify({ sub: userId, role: "authenticated" })
    await tx.execute(sql`select set_config('request.jwt.claims', ${claims}, true)`)
    await tx.execute(sql`select set_config('request.jwt.claim.sub', ${userId}, true)`)
    await tx.execute(sql`set local role authenticated`)
    return run(tx)
  })
}
