-- Additional recovery/fencing objects; proposal only, never auto-applied.
create table trackdash_erasure.fence(singleton boolean primary key default true check(singleton),epoch bigint not null default 0,guard_enabled boolean not null default false);
insert into trackdash_erasure.fence default values;
create table trackdash_erasure.alerts(
 id uuid primary key default gen_random_uuid(),notification_key text not null,
 kind text not null check(kind in ('overdue','exhausted','heartbeat')),
 created_at timestamptz not null default now(), delivered_at timestamptz,resolved_at timestamptz,
 claim_token uuid,locked_until timestamptz,attempts integer not null default 0,next_attempt_at timestamptz not null default now(),
 unique(notification_key,kind));
create table trackdash_erasure.heartbeat(singleton boolean primary key default true check(singleton),last_success timestamptz not null default now());
insert into trackdash_erasure.heartbeat default values;
create index erasure_due on trackdash_erasure.notifications(next_attempt_at) where state<>'completed';
create index erasure_alert_due on trackdash_erasure.alerts(next_attempt_at) where delivered_at is null and resolved_at is null;
alter table trackdash_erasure.fence enable row level security;
alter table trackdash_erasure.alerts enable row level security;
alter table trackdash_erasure.heartbeat enable row level security;
revoke all on trackdash_erasure.fence,trackdash_erasure.alerts,trackdash_erasure.heartbeat from public,anon,authenticated;
grant select,update on trackdash_erasure.fence,trackdash_erasure.heartbeat to service_role;
grant select,insert,update on trackdash_erasure.alerts to service_role;

create function trackdash_erasure.write_guard() returns trigger language plpgsql security invoker set search_path=pg_catalog as $$
begin
 if (select guard_enabled from trackdash_erasure.fence where singleton) and
 current_setting('trackdash_erasure.epoch',true) is distinct from (select epoch::text from trackdash_erasure.fence where singleton)
 then raise exception using errcode='PT409',message='MARKET_PUBLICATION_FENCE_REQUIRED'; end if;
 return null;
end $$;
create trigger ebay_erasure_publication_guard before insert or update on public.market_release_signals for each statement execute function trackdash_erasure.write_guard();
create trigger ebay_erasure_publication_guard before insert or update on public.market_release_monthly_signals for each statement execute function trackdash_erasure.write_guard();
create trigger ebay_erasure_publication_guard before insert or update on public.market_release_ask_snapshots for each statement execute function trackdash_erasure.write_guard();

create function trackdash_erasure.write_publication(p_epoch bigint,p_release uuid,p_condition text,p_writes jsonb) returns void
language plpgsql security invoker set search_path=pg_catalog set lock_timeout='250ms' as $$
declare w record;record jsonb;n integer;tbl text;target_keys text[];columns_sql text;values_sql text;updates_sql text;conflict_sql text;
begin
 if not pg_try_advisory_xact_lock(70601601) or p_epoch is distinct from coalesce((select generation from trackdash_erasure.recomputes where release_id=p_release and condition=p_condition),0) then
 raise exception using errcode='PT409',message='MARKET_PUBLICATION_STALE'; end if;
 perform set_config('trackdash_erasure.epoch',(select epoch::text from trackdash_erasure.fence where singleton),true);
  n:=0;
  for record in select v from jsonb_array_elements(p_writes) x(v) loop
   tbl:=record->>'table';
   target_keys:=case tbl when 'market_release_signals' then array['release_id','condition']
    when 'market_release_monthly_signals' then array['release_id','condition','month']
    when 'market_release_ask_snapshots' then array['release_id','condition','snapshot_date'] else null end;
   if target_keys is null or (record->'row'->>'release_id')::uuid is distinct from p_release or record->'row'->>'condition' is distinct from p_condition then raise exception 'EBAY_ERASURE_INVALID_PUBLICATION'; end if;
   select string_agg(format('%I',k),',' order by k),string_agg(format('x.%I',k),',' order by k),string_agg(format('%1$I=excluded.%1$I',k),',' order by k) filter(where not k=any(target_keys))
    into columns_sql,values_sql,updates_sql from jsonb_object_keys(record->'row') x(k);
   select string_agg(format('%I',k),',') into conflict_sql from unnest(target_keys) x(k);
   execute format('insert into public.%1$I(%2$s) select %3$s from jsonb_populate_record(null::public.%1$I,$1) x on conflict(%4$s) do update set %5$s',tbl,columns_sql,values_sql,conflict_sql,updates_sql) using record->'row';
   if tbl='market_release_signals' then n:=n+1; end if;
  end loop;
  if n<>1 then raise exception 'EBAY_ERASURE_INVALID_PUBLICATION'; end if;

end $$;
create function public.trackdash_market_fence(p_action text,p_data jsonb default '{}') returns jsonb
language plpgsql security invoker set search_path=pg_catalog set statement_timeout='10s' as $$
begin
 if p_action='snapshot' then return jsonb_build_object('epoch',coalesce((select generation from trackdash_erasure.recomputes where release_id=(p_data->>'releaseId')::uuid and condition=p_data->>'condition'),0)); end if;
 if p_action<>'publish' then raise exception 'INVALID_FENCE_ACTION'; end if;
 perform trackdash_erasure.write_publication((p_data->>'epoch')::bigint,(p_data->>'releaseId')::uuid,p_data->>'condition',p_data->'writes');
 return '{"state":"published"}';
end $$;

create function public.trackdash_ebay_recovery(p_action text,p_data jsonb default '{}') returns jsonb
language plpgsql security invoker set search_path=pg_catalog set statement_timeout='10s' set lock_timeout='250ms' as $$
declare j trackdash_erasure.notifications%rowtype;a trackdash_erasure.alerts%rowtype;done integer;safe_code text;job jsonb;alarm jsonb;
begin
 if p_action='poll' then
  perform public.trackdash_ebay_recovery('sweep');
  if not coalesce((p_data->>'monitorOnly')::boolean,false) then
   perform public.trackdash_ebay_recovery('heartbeat');
   job:=public.trackdash_ebay_recovery('take');
  end if;
  alarm:=public.trackdash_ebay_recovery('alarm_take');
  return jsonb_build_object('job',job,'alarm',alarm,'health',public.trackdash_ebay_recovery('health'));
 elsif p_action='take' then
  select * into j from trackdash_erasure.notifications where state<>'completed' and attempts<8 and next_attempt_at<=clock_timestamp()
   and (job_locked_until is null or job_locked_until<clock_timestamp()) order by next_attempt_at,created_at for update skip locked limit 1;
  if not found then return null; end if;
  update trackdash_erasure.notifications set attempts=attempts+1,job_token=gen_random_uuid(),job_locked_until=clock_timestamp()+interval '90 seconds',
   next_attempt_at=clock_timestamp()+make_interval(secs=>least(21600,30*power(3,attempts)::integer)) where notification_key=j.notification_key returning * into j;
  return jsonb_build_object('key',j.notification_key,'digest',j.payload_digest,'token',j.job_token,'state',j.state,'sealed',j.sealed);
 elsif p_action='settle' then
  select * into j from trackdash_erasure.notifications where notification_key=p_data->>'key' for update;
  if not found or j.job_token is distinct from (p_data->>'token')::uuid or j.job_locked_until<clock_timestamp() then raise exception 'STALE_RECOVERY_LEASE'; end if;
  select count(*) into done from trackdash_erasure.notification_work nw join trackdash_erasure.recomputes r using(release_id,condition)
   where nw.notification_key=j.notification_key and r.completed_generation>=nw.required_generation;
  safe_code:=case when coalesce(p_data->>'code','') ~ '^(?:[A-Z0-9]{5}|PGRST[0-9]{3}|UNKNOWN|PROGRESS)$' then p_data->>'code' else 'UNKNOWN' end;
  update trackdash_erasure.notifications set job_token=null,job_locked_until=null,last_code=safe_code,
   attempts=case when done>progress then 0 else attempts end,progress=done,
   next_attempt_at=case when done>progress then clock_timestamp()+interval '30 seconds' else next_attempt_at end where notification_key=j.notification_key;
 elsif p_action='sweep' then
  update trackdash_erasure.alerts pending_alert set resolved_at=clock_timestamp() where resolved_at is null and
   ((kind<>'heartbeat' and exists(select 1 from trackdash_erasure.notifications n where n.notification_key=pending_alert.notification_key and n.state='completed'))
   or (kind='heartbeat' and created_at<=(select last_success from trackdash_erasure.heartbeat where singleton)));
  insert into trackdash_erasure.alerts(notification_key,kind)
   select notification_key,case when attempts>=8 then 'exhausted' else 'overdue' end from trackdash_erasure.notifications
   where state<>'completed' and ((attempts>=8 and (job_locked_until is null or job_locked_until<clock_timestamp())) or created_at<clock_timestamp()-interval '15 minutes') on conflict do nothing;
  if (select last_success<clock_timestamp()-interval '15 minutes' from trackdash_erasure.heartbeat where singleton) then
   insert into trackdash_erasure.alerts(notification_key,kind) values('worker:'||(select extract(epoch from last_success)::text from trackdash_erasure.heartbeat where singleton),'heartbeat') on conflict do nothing;
  end if;
 elsif p_action='health' then
  return jsonb_build_object('exhausted',(select count(*) from trackdash_erasure.notifications where state<>'completed' and attempts>=8),
   'overdue',(select count(*) from trackdash_erasure.notifications where state<>'completed' and created_at<clock_timestamp()-interval '15 minutes'),
   'undelivered',(select count(*) from trackdash_erasure.alerts where delivered_at is null and resolved_at is null),
   'heartbeatStale',(select last_success<clock_timestamp()-interval '15 minutes' from trackdash_erasure.heartbeat where singleton));
 elsif p_action='heartbeat' then
  update trackdash_erasure.heartbeat set last_success=clock_timestamp() where singleton;
 elsif p_action='alarm_take' then
  select * into a from trackdash_erasure.alerts where attempts<12 and delivered_at is null and resolved_at is null and next_attempt_at<=clock_timestamp() and
   (locked_until is null or locked_until<clock_timestamp()) order by created_at for update skip locked limit 1;
  if not found then return null; end if;
  update trackdash_erasure.alerts set claim_token=gen_random_uuid(),locked_until=clock_timestamp()+interval '90 seconds',attempts=attempts+1,
   next_attempt_at=clock_timestamp()+interval '5 minutes' where id=a.id returning * into a;
  return jsonb_build_object('id',a.id,'token',a.claim_token,'kind',a.kind);
 elsif p_action='alarm_ack' then
  update trackdash_erasure.alerts set delivered_at=clock_timestamp(),claim_token=null,locked_until=null
   where id=(p_data->>'id')::uuid and claim_token=(p_data->>'token')::uuid and locked_until>clock_timestamp();
  if not found then raise exception 'STALE_ALERT_LEASE'; end if;
 else raise exception 'INVALID_RECOVERY_ACTION'; end if;
 return '{"state":"ok"}';
end $$;
revoke all on function trackdash_erasure.write_guard(),trackdash_erasure.write_publication(bigint,uuid,text,jsonb),public.trackdash_market_fence(text,jsonb),public.trackdash_ebay_recovery(text,jsonb) from public,anon,authenticated;
grant execute on function trackdash_erasure.write_guard(),trackdash_erasure.write_publication(bigint,uuid,text,jsonb),public.trackdash_market_fence(text,jsonb),public.trackdash_ebay_recovery(text,jsonb) to service_role;
