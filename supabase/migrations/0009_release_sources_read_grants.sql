-- Release-sources read grants. Reflects exactly the fix already applied to
-- the live Supabase database during the Catalog Model V2 deploy
-- (5 September 2026).
--
-- The `release_sources` table (added in 0006_catalog_model_v2) has a
-- public-read RLS policy, but the table-level SELECT privilege for the
-- anon/authenticated roles was missing, so reads were blocked before the
-- policy was even evaluated. This grants only SELECT.
--
-- RLS stays enabled. NO insert/update/delete is granted to anon or
-- authenticated -- catalog mutation remains privileged/admin-controlled
-- (see docs/CATALOG_MODEL_V2.md's user-submitted-corrections note).

grant select on table public.release_sources to anon, authenticated;
