-- Step 5B: aligns this repository with the runtime-grant and function
-- hardening already applied directly to the live Supabase project during
-- production testing (fix_authenticated_runtime_grants,
-- harden_handle_new_user_function, harden_auto_rls_function). Nothing
-- here changes RLS policies, table structure, or the logic of
-- handle_new_user() -- see lib/db/schema/*.ts for RLS (unchanged) and
-- migration 0002 for that function's actual logic (unchanged).
--
-- This file was revised once already, before being applied anywhere: the
-- first version granted the desired minimal privilege set but never
-- revoked Supabase's own broader project-bootstrap defaults first, which
-- left `anon`/`authenticated` (and, through INHERIT, `trackdash_app`)
-- holding privileges well beyond SELECT/INSERT/UPDATE/DELETE -- verified
-- live: `authenticated` could TRUNCATE `public.profiles`, `anon` could
-- TRUNCATE `public.products`. RLS does NOT protect TRUNCATE (see the
-- dedicated comment below) -- a GRANT-level problem needs a GRANT-level
-- fix, the same lesson as the permission-denied bug this migration
-- already existed to fix. This revision closes that gap and additionally
-- versions `rls_auto_enable()` + the `ensure_rls` event trigger, which
-- turned out to be real, load-bearing production hardening, not
-- incidental live-only configuration.
--
-- WHAT WENT WRONG IN PRODUCTION, PART 1 (context for sections 2-4 below)
-- ------------------------------------------------------------------------
-- lib/db/rls.ts's withUserContext() runs `SET LOCAL ROLE authenticated`
-- inside every owner-scoped query, so RLS policies scoped `TO
-- authenticated` actually apply -- see that file for the full
-- explanation. SET ROLE switches which role's GRANTs are checked for the
-- rest of the transaction; migration 0004 granted broad CRUD to
-- `trackdash_app` directly but never granted anything to `authenticated`
-- itself, so the first production request through withUserContext()
-- failed with `permission denied for table profiles (42501)` -- a plain
-- GRANT problem, RLS policies were never even reached.
--
-- WHAT WENT WRONG IN PRODUCTION, PART 2 (this revision)
-- ------------------------------------------------------------------------
-- Fixing part 1 by GRANTing the desired privileges was necessary but not
-- sufficient: Supabase provisions every new project with its own default
-- privilege rules (set FOR the `postgres` role, the same role this
-- project's migrations run as via MIGRATION_DATABASE_URL) that
-- automatically hand `anon`/`authenticated` broad table privileges --
-- historically including TRUNCATE, REFERENCES, TRIGGER, and (on newer
-- Postgres) MAINTAIN -- on anything `postgres` creates. Every table this
-- repository's own migrations (0000-0004) created therefore already
-- carried those extra privileges before this migration ever ran. Adding
-- new GRANTs on top, without first REVOKing the inherited ones, left them
-- in place. `trackdash_app` (INHERIT, member of both roles) transitively
-- inherited whatever `anon`/`authenticated` held, including TRUNCATE --
-- so narrowing `trackdash_app`'s OWN direct grants (already done in the
-- first version of this migration) was not enough on its own either.
--
-- WHY RLS DOES NOT SAVE YOU HERE
-- ------------------------------------------------------------------------
-- PostgreSQL Row-Level Security policies apply to SELECT, INSERT, UPDATE,
-- and DELETE. They do NOT apply to TRUNCATE, which is a separate
-- privilege (and a separate, non-transactional-in-the-usual-sense,
-- whole-table operation) governed purely by the ordinary GRANT system.
-- A role with TRUNCATE on a table can empty it completely regardless of
-- how restrictive that table's RLS policies are -- RLS was never
-- consulted. The only fix is to never grant TRUNCATE (or REFERENCES /
-- TRIGGER / MAINTAIN, none of which this app's roles have any legitimate
-- use for) to `anon`/`authenticated` in the first place, and to make sure
-- future tables don't acquire it automatically either.
--
-- WHAT THIS MIGRATION DOES (full, current version)
-- ------------------------------------------------------------------------
-- 1. Schema USAGE for trackdash_app/anon/authenticated.
-- 2. REVOKEs every existing table/sequence privilege from anon and
--    authenticated (clearing whatever Supabase's project bootstrap
--    granted them), REVOKEs the default-privilege rule that would keep
--    handing those privileges to future tables too, then GRANTs back
--    only the specific SELECT/INSERT/UPDATE/DELETE privileges each role
--    actually needs, table by table. service_role is deliberately left
--    untouched throughout -- out of scope for this fix.
-- 3. Resets trackdash_app the same way (as in the first version of this
--    migration), which as a side effect also closes its inherited
--    TRUNCATE/REFERENCES/TRIGGER/MAINTAIN exposure -- once anon/
--    authenticated no longer hold those privileges, there is nothing
--    left for trackdash_app to inherit via its membership in them.
-- 4. Versions `public.rls_auto_enable()` (a SECURITY DEFINER event
--    trigger function) and the `ensure_rls` event trigger that calls it
--    on `ddl_command_end` -- both previously live-only, applied directly
--    against production outside of any migration in this repository.
--    Automatically enables RLS on every new table created in the
--    `public` schema (CREATE TABLE / CREATE TABLE AS / SELECT INTO only
--    -- never touches system schemas). This does NOT create any policy;
--    a table with RLS enabled and no policy denies all access by
--    default, which is the fail-closed behavior this project relies on
--    for anything created after this migration runs.
-- 5. Revokes EXECUTE on both SECURITY DEFINER functions
--    (public.handle_new_user, public.rls_auto_enable) from PUBLIC/anon/
--    authenticated -- neither should be callable directly by an ordinary
--    session, only via their intended trigger path. Neither function's
--    logic changes (handle_new_user's logic is untouched from migration
--    0002; rls_auto_enable is newly defined here to match verified
--    production behavior exactly).
--
-- Every statement below is safe to re-run: GRANT/REVOKE are idempotent by
-- nature, CREATE OR REPLACE FUNCTION updates in place, and the event
-- trigger is dropped-and-recreated rather than conditionally created.


-- =========================================================================
-- 1. SCHEMA USAGE
-- =========================================================================

grant usage on schema public to trackdash_app;
grant usage on schema public to anon;
grant usage on schema public to authenticated;


-- =========================================================================
-- 2. anon / authenticated -- clear whatever Supabase's project bootstrap
--    granted them (which, unrevoked, includes TRUNCATE/REFERENCES/
--    TRIGGER/MAINTAIN -- see the header comment), close the default-
--    privilege rule that would keep handing those to future tables too,
--    then grant back only what each role actually needs. service_role is
--    NOT touched anywhere in this migration.
-- =========================================================================

revoke all privileges on all tables in schema public from anon, authenticated;
revoke all privileges on all sequences in schema public from anon, authenticated;
alter default privileges in schema public revoke all privileges on tables from anon, authenticated;
alter default privileges in schema public revoke all privileges on sequences from anon, authenticated;

-- Fail-closed by design: a brand-new table created by a future migration
-- gets NO privileges for anon/authenticated automatically (on top of
-- getting RLS enabled with no policy, from ensure_rls in section 4 below
-- -- two independent fail-closed defaults, not one). Whichever migration
-- introduces a new table that anon and/or authenticated should read or
-- write must GRANT that explicitly itself; nothing here does it for
-- them implicitly.

-- anon: read-only, public catalog/market reference data. Matches the
-- `to [anon, authenticated] using true` RLS policies in
-- lib/db/schema/{taxonomy,catalog,market}.ts.
grant select on
  brands,
  categories,
  product_images,
  product_releases,
  products,
  release_images,
  market_estimates,
  price_sources
to anon;

-- authenticated: same public tables, plus the read/write surface its RLS
-- policies (`auth.uid() = user_id`, etc.) are meant to scope per-row.
-- Table-by-table, matching each table's actual mutation surface in
-- lib/actions/*.ts / lib/db/queries/*.ts.
grant select on
  brands,
  categories,
  product_images,
  product_releases,
  products,
  release_images,
  market_estimates,
  price_sources
to authenticated;

-- Read-only for authenticated: computed/aggregate data, not user-editable
-- through the app today.
grant select on price_points to authenticated;
grant select on collection_item_value_history to authenticated;

-- profiles: no delete -- a profile is removed only via auth.users
-- cascading (see lib/db/schema/profiles.ts's onDelete: "cascade"), never
-- directly by the owning user.
grant select, insert, update on profiles to authenticated;

-- Full CRUD: the app's own create/read/update/delete flows for these.
grant select, insert, update, delete on collection_items to authenticated;
grant select, insert, update, delete on collection_item_photos to authenticated;
grant select, insert, update, delete on wishlist_items to authenticated;

-- Neither anon nor authenticated currently needs any sequence privilege:
-- every table in this schema generates its id via gen_random_uuid()
-- (see lib/db/schema/*.ts's .defaultRandom() usage), not a serial/
-- identity column backed by a sequence. Nothing is granted here on
-- purpose -- add it explicitly, in the migration that needs it, if that
-- ever changes.


-- =========================================================================
-- 3. trackdash_app -- reset the blanket grants from 0004, then re-grant
--    the narrower, actually-needed set. Section 2 above already removed
--    anon/authenticated's TRUNCATE/REFERENCES/TRIGGER/MAINTAIN, which
--    means trackdash_app -- INHERIT, member of both -- has nothing left
--    to inherit there either; this section's own REVOKE ALL / re-GRANT
--    additionally ensures trackdash_app never held any of those directly
--    in the first place.
-- =========================================================================

revoke all privileges on all tables in schema public from trackdash_app;
revoke all privileges on all sequences in schema public from trackdash_app;
alter default privileges in schema public revoke all privileges on tables from trackdash_app;
alter default privileges in schema public revoke all privileges on sequences from trackdash_app;

-- Read-only: public catalog / market reference data.
grant select on
  brands,
  categories,
  product_images,
  product_releases,
  products,
  release_images,
  market_estimates,
  price_sources
to trackdash_app;

-- Read/write: application tables trackdash_app reads and writes directly
-- (both via withUserContext() and, for reads that don't need auth.uid(),
-- via the plain singleton -- see lib/db/rls.ts).
grant select, insert, update, delete on
  profiles,
  collection_items,
  collection_item_photos,
  collection_item_value_history,
  wishlist_items,
  price_points
to trackdash_app;

-- Default privileges for objects created by future migrations: SELECT
-- only, not the blanket CRUD 0004 originally set up. A new table that
-- needs trackdash_app to write to it must say so explicitly in the
-- migration that creates it -- this default is deliberately conservative.
alter default privileges in schema public grant select on tables to trackdash_app;
alter default privileges in schema public grant usage on sequences to trackdash_app;


-- =========================================================================
-- 4. rls_auto_enable() + ensure_rls -- versions the event trigger that
--    automatically enables RLS on every new table created in the public
--    schema, replicating verified production behavior. This is a
--    fail-closed backstop, not a substitute for writing policies: RLS
--    enabled with no policy denies ALL access by default (for every role
--    except the table owner and roles with BYPASSRLS -- trackdash_app is
--    neither, see migration 0004). A future migration that creates a
--    table still needs to define its own RLS policies (and, per section
--    2's comment above, its own explicit GRANTs) before anon/
--    authenticated can use it at all -- this trigger only guarantees
--    nobody can accidentally SHIP a public-schema table with RLS off.
-- =========================================================================

create or replace function public.rls_auto_enable()
returns event_trigger
language plpgsql
security definer
set search_path to 'pg_catalog'
as $$
declare
  obj record;
begin
  for obj in select * from pg_event_trigger_ddl_commands()
  loop
    if obj.object_type = 'table'
       and obj.schema_name = 'public'
       and obj.command_tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
    then
      execute format('alter table %s enable row level security', obj.object_identity);
    end if;
  end loop;
end;
$$;

drop event trigger if exists ensure_rls;

create event trigger ensure_rls
on ddl_command_end
execute function public.rls_auto_enable();

alter event trigger ensure_rls enable;


-- =========================================================================
-- 5. Function hardening: revoke EXECUTE from PUBLIC/anon/authenticated on
--    both SECURITY DEFINER functions -- neither should be callable
--    directly by an ordinary session, only via their intended trigger
--    path (handle_new_user: the on_auth_user_created trigger from
--    migration 0002; rls_auto_enable: the ensure_rls event trigger
--    above, created earlier in this same file). Logic unchanged for
--    both. No exception-handling wrapper needed here (unlike an earlier
--    draft of this migration): handle_new_user is created by migration
--    0002, which always runs before this one, and rls_auto_enable is
--    created a few statements above in this same file -- if either
--    CREATE had failed, this migration would already have aborted before
--    reaching these lines.
-- =========================================================================

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
