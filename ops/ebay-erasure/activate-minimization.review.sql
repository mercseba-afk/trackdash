-- REVIEW ONLY, never run by CI/app. Requires separate environment approval.
-- psql variable key_id is a NON-SECRET Vault binding version, not key material.
begin;
set local lock_timeout='1s';
set local statement_timeout='10s';
do $$begin
 if not pg_try_advisory_xact_lock(70601601) then raise exception 'INGRESS_NOT_DRAINED';end if;
 if not(select enabled from trackdash_erasure.suppression_config where singleton) or not(select guard_enabled from trackdash_erasure.fence where singleton) then raise exception 'GUARDS_NOT_READY';end if;
end $$;
update trackdash_erasure.minimization_config set key_id=:'key_id',enabled=true where singleton;
update public.market_candidates set updated_at=updated_at where trackdash_erasure.is_ebay(source_id);
update public.market_offer_states set updated_at=updated_at where trackdash_erasure.is_ebay(source_id);
update public.market_aggregate_observations set updated_at=updated_at where trackdash_erasure.is_ebay(source_id);
update public.market_monthly_source_stats set updated_at=updated_at where trackdash_erasure.is_ebay(source_id);
-- No point price, formula, source policy, Release or scanner queue update.
commit;
