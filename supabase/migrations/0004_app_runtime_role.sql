-- Provisions a dedicated, restricted Postgres role for TrackDash's
-- application runtime to connect as (DATABASE_URL, lib/db/index.ts),
-- instead of Supabase's default privileged `postgres` role.
--
-- WHY THIS MATTERS (see lib/db/rls.ts for the full explanation)
-- ----------------------------------------------------------------
-- Every RLS policy in this project (lib/db/schema/*.ts) is real and
-- correctly defined -- but RLS is enforced per POSTGRES ROLE, and a
-- direct Postgres connection (Drizzle, via DATABASE_URL) has no
-- automatic notion of "who is logged in" the way Supabase's own
-- PostgREST API does. If DATABASE_URL connects as the default `postgres`
-- role, every policy in this project is silently a no-op: that role is
-- the owner of every table it created via migrations, and Postgres table
-- owners bypass RLS by default.
--
-- `trackdash_app` fixes this at the connection level:
--   - LOGIN: it's an actual role the app can connect as.
--   - INHERIT (the Postgres default -- kept explicit here) + member of
--     `authenticated` and `anon` (Supabase's own predefined roles): this
--     is what lets `to authenticated` / `to [anon, authenticated]`
--     policies apply to it immediately, with no `SET ROLE` needed, which
--     is what makes the PUBLIC catalog tables (products, product_releases,
--     ...) readable via a plain connection. An earlier draft of this
--     migration used NOINHERIT on the theory that it would force
--     everything through an explicit role switch -- that turned out to be
--     wrong: NOINHERIT would have silently broken the public catalog
--     policies too (Postgres requires an explicit SET ROLE to use a
--     NOINHERIT membership's privileges, including for RLS role
--     matching), not just the owner-scoped ones. Caught before this ran
--     against any real database; INHERIT is correct.
--   - Explicitly NOT granted BYPASSRLS, and not the owner of any table.
--
-- The actual protection for OWNER-SCOPED tables (collection_items,
-- wishlist_items, profiles, ...) doesn't come from role-switching at all
-- -- it comes from their policies checking `auth.uid() = user_id`, and
-- `auth.uid()` reading a session variable (`request.jwt.claim.sub`) that
-- is NULL by default. A query run as `trackdash_app` without going
-- through lib/db/rls.ts's `withUserContext()` (which sets that variable)
-- correctly sees ZERO rows on those tables -- not because of which role
-- it's running as, but because `auth.uid()` is null and the USING clause
-- can never match. That's the actual fail-closed property this project
-- relies on: a query that forgets to call withUserContext() fails safe.
--
-- Password: intentionally NOT set here -- never hardcode a credential in
-- a checked-in migration. Set one after this runs:
--   alter role trackdash_app with password '<a freshly generated secret>';
-- See docs/SUPABASE_SETUP.md for the full setup procedure, including how
-- this role fits into DATABASE_URL vs MIGRATION_DATABASE_URL.
do $$
begin
  if not exists (select from pg_catalog.pg_roles where rolname = 'trackdash_app') then
    create role trackdash_app with login inherit;
  end if;
end
$$;

grant authenticated to trackdash_app;
grant anon to trackdash_app;

-- Base privileges. RLS policies (already defined per-table via
-- .enableRLS()/pgPolicy() in lib/db/schema/*.ts) further restrict which
-- ROWS are visible/writable on top of these; a GRANT alone does not
-- bypass a table's RLS policies.
grant usage on schema public to trackdash_app;
grant select, insert, update, delete on all tables in schema public to trackdash_app;
grant usage, select on all sequences in schema public to trackdash_app;

-- So future migrations' new tables/sequences are covered automatically,
-- without needing a follow-up grant migration every time the schema grows.
alter default privileges in schema public grant select, insert, update, delete on tables to trackdash_app;
alter default privileges in schema public grant usage, select on sequences to trackdash_app;
