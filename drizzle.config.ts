// Configuration for drizzle-kit (schema diffing / migration generation).
//
// schemaFilter: ["public"] is deliberate — Supabase owns and migrates the
// `auth` schema itself. Restricting drizzle-kit to `public` means our
// `profiles.id -> auth.users.id` foreign key (see lib/db/schema/profiles.ts)
// is understood as a reference to an existing table, without drizzle-kit
// ever trying to generate a CREATE TABLE for auth.users.
//
// entities.roles.provider: "supabase" (Step 3) tells drizzle-kit that
// anon/authenticated/service_role (used by the RLS policies across
// lib/db/schema/*.ts) are Supabase-managed roles that already exist —
// without this, drizzle-kit would try to generate CREATE ROLE statements
// for them, which would fail against a real Supabase project.
//
// Migrations are generated (not pushed) in this step — `drizzle-kit
// generate` only diffs the TypeScript schema against the last migration
// snapshot, it does not need a live database connection. Applying them
// (`drizzle-kit migrate` / `push`) against a real Supabase project happens
// in a later step, once a project actually exists.

import { defineConfig } from "drizzle-kit"

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema/index.ts",
  out: "./supabase/migrations",
  schemaFilter: ["public"],
  entities: {
    roles: {
      provider: "supabase",
    },
  },
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
