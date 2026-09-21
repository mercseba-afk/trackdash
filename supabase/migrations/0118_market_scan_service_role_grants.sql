-- Restore the service-role capabilities required by the scheduled market workers.
-- The claim functions are SECURITY DEFINER and remain unavailable to anon/authenticated.
grant execute on function public.trackdash_claim_market_scan_jobs_v2(integer, integer) to service_role;
grant execute on function public.trackdash_claim_ebay_active_jobs(integer, integer) to service_role;

-- Exact-page scans update endpoint telemetry after a successful claim.
grant select, update on table public.market_scan_endpoints to service_role;
