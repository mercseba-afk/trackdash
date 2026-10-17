// Reference reconciliation for the network-isolated synthetic lab only.
// Not an operational Production restore command or runtime integration.
import {recoveryTables,validateCheckpoint} from './p06-recovery-capsule.mjs'
const q=v=>"'"+JSON.stringify(v).replaceAll("'","''")+"'::jsonb"
export function reconcileInLab(d,state){
 validateCheckpoint(state)
 if(!/^p06r_[0-9a-f]{12}$/.test(d.db))throw Error('RESTORE_TARGET_REJECTED')
 const rows=t=>`jsonb_populate_recordset(null::trackdash_erasure.${t},${q(state[t])})`
 const insert=(t,conflict)=>`insert into trackdash_erasure.${t} select * from ${rows(t)} ${conflict};`
 const sql=`begin;set local lock_timeout='250ms';set local statement_timeout='10s';
 do $$begin if not pg_try_advisory_xact_lock(70601601) then raise exception 'RESTORE_BUSY';end if;end$$;
 do $$begin if exists(select 1 from ${rows('suppression_keys')} x join trackdash_erasure.suppression_keys k using(key_id) where k.key_check<>x.key_check or k.vault_secret_id<>x.vault_secret_id) then raise exception 'RESTORE_KEY_BINDING_CONFLICT';end if;end$$;
 ${insert('suppression_keys','on conflict(key_id) do nothing')}
 do $$begin perform trackdash_erasure.suppression_keyring();end$$;
 ${insert('ebay_sources','on conflict do nothing')}
 ${insert('suppressed_identities','on conflict do nothing')}
 ${insert('suppressed_candidates','on conflict do nothing')}
 do $$begin if exists(select 1 from ${rows('notifications')} x join trackdash_erasure.notifications n using(notification_key) where n.payload_digest<>x.payload_digest or n.key_id<>x.key_id) then raise exception 'RESTORE_NOTIFICATION_CONFLICT';end if;end$$;
 ${insert('notifications',`on conflict(notification_key) do update set
 state=case when trackdash_erasure.notifications.state='received' or excluded.state='received' then 'received' else 'erased' end,
 sealed=coalesce(trackdash_erasure.notifications.sealed,excluded.sealed),
 job_token=null,job_locked_until=null,next_attempt_at=now(),attempts=0`)}
 ${insert('recomputes',`on conflict(release_id,condition) do update set generation=greatest(trackdash_erasure.recomputes.generation,excluded.generation)+1,completed_generation=0,claim_token=null,locked_until=null`)}
 update trackdash_erasure.recomputes set generation=generation+1,completed_generation=0,claim_token=null,locked_until=null;
 ${insert('notification_work',`on conflict(notification_key,release_id,condition) do update set required_generation=excluded.required_generation`)}
 update trackdash_erasure.notification_work nw set required_generation=r.generation from trackdash_erasure.recomputes r where nw.release_id=r.release_id and nw.condition=r.condition;
 update trackdash_erasure.notifications set state=case when state='received' then state when exists(select 1 from trackdash_erasure.notification_work w where w.notification_key=notifications.notification_key) then 'erased' else state end,job_token=null,job_locked_until=null,next_attempt_at=now(),attempts=0;
 ${insert('alerts',`on conflict(notification_key,kind) do nothing`)}
 update trackdash_erasure.alerts set delivered_at=null,resolved_at=null,claim_token=null,locked_until=null,attempts=0,next_attempt_at=now() where resolved_at is null;
 update trackdash_erasure.fence set epoch=greatest(epoch,${Number(state.fence[0].epoch)})+1,guard_enabled=true;
 update trackdash_erasure.suppression_config set enabled=true;
 -- Re-scrub the RESTORED market through A1 unchanged, using restored HMAC
 -- tokens and independently recovered keys, not plaintext completed payloads.
 ${['market_candidates','market_offer_states','price_points','market_aggregate_observations','market_monthly_source_stats'].map(t=>`update public.${t} set updated_at=updated_at where trackdash_erasure.is_ebay(source_id);`).join('\n')}
 -- Queue all restored market outputs as well: a historical backup may contain
 -- evidence/Release dependencies absent from the newer notification manifest.
 select public.trackdash_enqueue_market_recompute(release_id,condition) from (
 select release_id,condition from public.market_release_signals union select release_id,condition from public.price_points
 union select resolved_release_id,condition from public.market_candidates where resolved_release_id is not null
 union select release_id,condition from public.market_aggregate_observations where release_id is not null) x;
 commit;`
 try{d.sql(sql)}catch{throw Error('RESTORE_RECONCILIATION_REJECTED')}
}
export function labGate(d,{witnessVerified=false}={}){
 const counts=d.json(`select jsonb_build_object('notifications',(select count(*) from trackdash_erasure.notifications where state<>'completed'),
 'recomputes',(select count(*) from trackdash_erasure.recomputes where completed_generation<generation),
 'canonical',(select count(*) from market_recompute_queue),
 'guard',(select enabled from trackdash_erasure.suppression_config where singleton),
 'unhealthyAlerts',(select count(*) from trackdash_erasure.alerts where resolved_at is null and delivered_at is null));`)
 return {...counts,mayLeaveSyntheticQuarantine:witnessVerified&&counts.guard===true&&!counts.notifications&&!counts.recomputes&&!counts.canonical&&!counts.unhealthyAlerts}
}
