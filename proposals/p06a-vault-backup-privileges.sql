-- A2/A3 REVIEW PROPOSAL ONLY. Never auto-applied. No key/config provisioning.
-- Execute revocations as the object owner/provider-authorized administrator:
-- managed postgres is NOT superuser and is not a member of supabase_admin.
-- Audit existing consumers first; verify effective grants after the transaction.
begin;
revoke select,delete on vault.secrets,vault.decrypted_secrets from service_role;
revoke execute on function vault.create_secret(text,text,text,uuid),
 vault.update_secret(uuid,text,text,text,uuid),
 vault._crypto_aead_det_decrypt(bytea,bytea,bigint,bytea,bytea) from service_role;
-- Keep schema USAGE unchanged; no general grants or RLS changes.

-- Dedicated non-login export capability. No runtime memberships are assigned.
create role trackdash_erasure_backup nologin noinherit nobypassrls;
grant usage on schema trackdash_erasure to trackdash_erasure_backup;
create function trackdash_erasure.recovery_checkpoint() returns jsonb
language sql stable security definer set search_path=pg_catalog as $$
 select jsonb_build_object('notifications',coalesce((select jsonb_agg(to_jsonb(t) order by notification_key) from trackdash_erasure.notifications t),'[]'),
 'recomputes',coalesce((select jsonb_agg(to_jsonb(t) order by release_id,condition) from trackdash_erasure.recomputes t),'[]'),
 'notification_work',coalesce((select jsonb_agg(to_jsonb(t) order by notification_key,release_id,condition) from trackdash_erasure.notification_work t),'[]'),
 'fence',coalesce((select jsonb_agg(to_jsonb(t)) from trackdash_erasure.fence t),'[]'),
 'alerts',coalesce((select jsonb_agg(to_jsonb(t) order by id) from trackdash_erasure.alerts t),'[]'),
 'heartbeat',coalesce((select jsonb_agg(to_jsonb(t)) from trackdash_erasure.heartbeat t),'[]'),
 'suppression_config',coalesce((select jsonb_agg(to_jsonb(t)) from trackdash_erasure.suppression_config t),'[]'),
 'suppression_keys',coalesce((select jsonb_agg(to_jsonb(t) order by key_id) from trackdash_erasure.suppression_keys t),'[]'),
 'suppressed_identities',coalesce((select jsonb_agg(to_jsonb(t) order by key_id,token) from trackdash_erasure.suppressed_identities t),'[]'),
 'suppressed_candidates',coalesce((select jsonb_agg(to_jsonb(t) order by candidate_id) from trackdash_erasure.suppressed_candidates t),'[]'),
 'ebay_sources',coalesce((select jsonb_agg(to_jsonb(t) order by source_id) from trackdash_erasure.ebay_sources t),'[]'))
$$;
revoke all on function trackdash_erasure.recovery_checkpoint() from public,anon,authenticated,service_role,trackdash_app;
grant execute on function trackdash_erasure.recovery_checkpoint() to trackdash_erasure_backup;
-- This explicit private DEFINER projection reads encrypted inbox/pseudonyms,
-- never Vault, plaintext seller fields, keys or market raw payloads. One STABLE
-- SELECT gives all tables the same snapshot. No restore/write/purge grant.

commit;
