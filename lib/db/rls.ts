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
// IMPORTANT CAVEAT — read before relying on this for security
// --------------------------------------------------------------
// Switching role with `SET LOCAL ROLE` only has a real security effect if
// the Postgres role in DATABASE_URL is NOT allowed to bypass RLS. Supabase
// connection strings default to a broadly-privileged `postgres` role,
// which (depending on how the project is configured) may have BYPASSRLS —
// in which case this helper still runs correctly, but every row is
// visible regardless of the policies, silently.
//
// Step 5 addresses this directly: migration 0004 provisions a dedicated,
// restricted `trackdash_app` role (LOGIN, INHERIT, member of
// `authenticated` and `anon`, no BYPASSRLS) — see that migration's
// comments and docs/SUPABASE_SETUP.md for the full explanation and setup
// steps. DATABASE_URL should connect as `trackdash_app` for the app's
// normal runtime once that role exists; MIGRATION_DATABASE_URL
// (drizzle.config.ts only) stays on the privileged role, since
// DDL/role management needs it.
//
// What actually protects owner-scoped tables (collection_items,
// wishlist_items, profiles, ...) is NOT the role switch below — it's that
// their RLS policies check `auth.uid() = user_id`, and `auth.uid()` reads
// a session variable that's null by default. The `set_config(...)` calls
// here are what make it non-null for the duration of this transaction;
// skip them (i.e. query through the plain `db` singleton instead of this
// function) and those policies correctly return zero rows rather than
// leaking data — RLS fails closed even if application code forgets to
// wrap a call. `SET LOCAL ROLE authenticated` is kept alongside that for
// consistency with Supabase's own `auth.role()` semantics and the
// community-standard pattern this follows, not because role membership
// alone would let `trackdash_app` through those particular policies.
// Public catalog reads (lib/db/queries/catalog.ts) don't need any of
// this: `trackdash_app`'s INHERIT + role membership already satisfies
// their `to [anon, authenticated] using true` policies with no JWT
// context required, so those queries use the plain singleton directly.
export async function withUserContext<T>(userId: string, run: (tx: Database) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    const claims = JSON.stringify({ sub: userId, role: "authenticated" })
    await tx.execute(sql`select set_config('request.jwt.claims', ${claims}, true)`)
    await tx.execute(sql`select set_config('request.jwt.claim.sub', ${userId}, true)`)
    await tx.execute(sql`set local role authenticated`)
    return run(tx)
  })
}
