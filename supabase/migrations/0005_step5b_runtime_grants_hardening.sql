-- Step 5B: aligns this repository with the runtime-grant and function
-- hardening already applied directly to the live Supabase project during
-- production testing (Vercel + real Supabase, not this repo's earlier
-- migrations). Nothing here changes RLS policies, table structure, or
-- function logic -- see lib/db/schema/*.ts for RLS (unchanged) and
-- migration 0002 for handle_new_user()'s actual logic (unchanged).
--
-- WHAT WENT WRONG IN PRODUCTION (context for why this migration exists)
-- ------------------------------------------------------------------------
-- lib/db/rls.ts's withUserContext() runs `SET LOCAL ROLE authenticated`
-- inside every owner-scoped query (collection_items, wishlist_items,
-- profiles, ...), so RLS policies scoped `TO authenticated` actually
-- apply -- see that file for the full explanation. What Step 5's design
-- didn't account for: SET ROLE only changes which role's PRIVILEGES are
-- active for the rest of the session/transaction -- it does nothing by
-- itself if `authenticated` was never granted any table privileges in
-- the first place. Migration 0004 granted broad CRUD to `trackdash_app`
-- directly, but never granted anything to `authenticated` itself. RLS
-- policies restrict which ROWS are visible; they are not a substitute
-- for the underlying GRANT that allows touching the table at all. Result
-- in production: `permission denied for table profiles (42501)` the
-- moment a real request ran through withUserContext(). Fixed live,
-- reproduced here as a proper migration.
--
-- WHAT THIS MIGRATION DOES
-- ------------------------------------------------------------------------
-- 1. Grants `authenticated` (and `anon`, for public reads) the table
--    privileges their RLS policies (lib/db/schema/*.ts) already assume.
-- 2. Narrows `trackdash_app` from 0004's "CRUD on every table" down to
--    what's actually needed: SELECT-only on the public catalog/market
--    tables, CRUD on the application tables it reads/writes directly.
--    0004 itself is NOT edited (already applied in production; this
--    migration's REVOKEs reset what it granted before re-granting the
--    narrower set).
-- 3. Revokes EXECUTE on two SECURITY DEFINER functions
--    (public.handle_new_user, public.rls_auto_enable) from PUBLIC/anon/
--    authenticated -- SECURITY DEFINER functions run with elevated
--    privileges, so nothing except their intended trigger/automation
--    caller should be able to invoke them directly as an ordinary
--    session. Neither function's logic changes.
--
-- REPOSITORY NOTE: public.rls_auto_enable() has no CREATE FUNCTION
-- statement anywhere in this repository's migrations -- it exists in the
-- live project from work done directly against production, outside of
-- this migration history. Step 3 below only revokes its EXECUTE
-- privilege (idempotently, tolerating its absence) and does not attempt
-- to define it; if this repo needs to fully own that function's
-- definition later, that's a separate, deliberate follow-up, not
-- something to reverse-engineer into this migration.
--
-- Every statement below is safe to re-run: GRANT/REVOKE are idempotent by
-- nature, and the two function REVOKEs are wrapped to tolerate a
-- not-yet-existing function rather than aborting the migration.


-- =========================================================================
-- 1. SCHEMA USAGE
-- =========================================================================

grant usage on schema public to trackdash_app;
grant usage on schema public to anon;
grant usage on schema public to authenticated;


-- =========================================================================
-- 2. trackdash_app -- reset the blanket grants from 0004, then re-grant
--    the narrower, actually-needed set.
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
-- 3. anon -- read-only access to public catalog/market tables. Matches
--    the `to [anon, authenticated] using true` RLS policies in
--    lib/db/schema/{taxonomy,catalog,market}.ts.
-- =========================================================================

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


-- =========================================================================
-- 4. authenticated -- read access to the same public tables, plus the
--    read/write surface its RLS policies (`auth.uid() = user_id`, etc.)
--    are meant to scope per-row. Table-by-table, matching each table's
--    actual mutation surface in lib/actions/*.ts / lib/db/queries/*.ts.
-- =========================================================================

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


-- =========================================================================
-- 5. Function hardening: revoke EXECUTE from PUBLIC/anon/authenticated on
--    SECURITY DEFINER functions that should only run via their intended
--    trigger/automation path, never as a direct call from an ordinary
--    session. Logic unchanged; idempotent (tolerates the function not
--    existing, so this migration doesn't hard-fail on an environment that
--    doesn't have public.rls_auto_enable() -- see the repository note
--    above).
-- =========================================================================

do $$
begin
  revoke execute on function public.handle_new_user() from public, anon, authenticated;
exception when undefined_function then
  raise notice 'public.handle_new_user() not found -- skipping (expected if migration 0002 has not run yet)';
end
$$;

do $$
begin
  revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
exception when undefined_function then
  raise notice 'public.rls_auto_enable() not found -- skipping (this function is not defined anywhere in this repository''s migrations; see the repository note above)';
end
$$;
