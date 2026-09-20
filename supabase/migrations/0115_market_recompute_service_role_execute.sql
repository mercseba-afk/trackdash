-- The protected Vercel market cron runs through the server-side Supabase
-- admin client, which authenticates to PostgREST as service_role. The recompute
-- queue RPCs were intentionally restricted but omitted service_role, causing
-- the scheduled worker to fail before consuming queued recomputations.
--
-- Keep the RPCs closed to anon/authenticated; only trusted backend roles may
-- execute them.

grant execute on function public.trackdash_claim_market_recompute_jobs(integer, integer)
  to service_role;

grant execute on function public.trackdash_finish_market_recompute_job(uuid, text, timestamptz, boolean, text)
  to service_role;
