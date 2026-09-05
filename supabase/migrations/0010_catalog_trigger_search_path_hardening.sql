-- Catalog trigger search_path hardening. Reflects exactly the security
-- hardening already applied to the live Supabase database during the
-- Catalog Model V2 deploy (5 September 2026).
--
-- Pins `search_path = public, pg_temp` on the three canonical-release
-- trigger functions defined in 0006_catalog_model_v2, resolving the
-- Supabase security advisor `function_search_path_mutable` warning. A
-- mutable search_path on a function lets a caller's session search_path
-- influence which objects the function resolves; fixing it to a known
-- value removes that ambiguity.
--
-- Behavior of the triggers is unchanged -- this only fixes name
-- resolution.

alter function public.trg_products_canonical_release_ownership()
  set search_path = public, pg_temp;

alter function public.trg_products_sync_from_canonical()
  set search_path = public, pg_temp;

alter function public.trg_releases_sync_canonical_product()
  set search_path = public, pg_temp;
