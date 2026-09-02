import "server-only"

import type { db } from "./index"

// Query functions in lib/db/queries/*.ts that touch owner-scoped tables
// (collection_items, wishlist_items, profiles, and their child tables)
// accept this type for their optional trailing `dbClient` parameter, so
// they can run either as the plain singleton `db` (fine for public,
// unscoped reads — see lib/db/queries/catalog.ts) or inside the
// RLS-scoped transaction from lib/db/rls.ts's withUserContext(), which is
// what actually makes `auth.uid()`-based policies apply.
//
// Derived structurally from `db.transaction`'s own callback parameter
// type rather than hand-declared, so it can never drift from whatever
// drizzle-orm/postgres-js actually hands a transaction callback.
export type Database = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0]
