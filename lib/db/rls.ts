import "server-only"

import { sql } from "drizzle-orm"
import { db } from "./index"

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
// visible regardless of the policies, silently. The community-standard
// fix (used by most Drizzle+Supabase+RLS setups) is to provision a
// dedicated, less-privileged Postgres role — e.g. granted membership in
// `anon`/`authenticated` only — and point DATABASE_URL at that role
// instead of the default `postgres` user.
//
// That role doesn't exist yet: there is no live Supabase project to
// create it against. This is flagged here as a concrete follow-up for
// whichever step first connects to a real project, not something that can
// be faked against a placeholder DATABASE_URL. Until then, the query
// layer in lib/db/queries/* does NOT rely on this helper for correctness —
// every query filters by userId explicitly, which is safe regardless of
// which Postgres role executes it. Use this helper once that dedicated
// role exists, as an additional (not sole) layer of defense.
export async function withUserContext<T>(userId: string, run: (tx: typeof db) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    const claims = JSON.stringify({ sub: userId, role: "authenticated" })
    await tx.execute(sql`select set_config('request.jwt.claims', ${claims}, true)`)
    await tx.execute(sql`select set_config('request.jwt.claim.sub', ${userId}, true)`)
    await tx.execute(sql`set local role authenticated`)
    // Structurally compatible with `db` for the query builder methods our
    // lib/db/queries/* functions use (select/insert/update/delete/query).
    return run(tx as unknown as typeof db)
  })
}
