-- REVIEW CANDIDATE ONLY — RCJAZ legacy trigger permission (P0.6A compatibility).
-- The original Production ACL must remain captured in the frozen fixture.
-- Never auto-apply this file to managed Supabase or merge it with P0.6A erasure SQL.
-- Requires separate authorization and Production rollout review.
-- Validated on managed isolated staging with BEGIN/ROLLBACK (2026-10-17).
GRANT INSERT (release_id, source_id, endpoint_url, parser_kind,
              exact_release_verified, enabled, updated_at)
ON public.market_scan_endpoints TO service_role;
