-- P0.6A REVIEW CANDIDATE ONLY. Not applied to any remote database.
-- No scheduler activation. Invoker privileges; encrypted inbox removed after erasure.
create schema trackdash_erasure;
revoke all on schema trackdash_erasure from public, anon, authenticated;
grant usage on schema trackdash_erasure to service_role;

create table trackdash_erasure.notifications (
  notification_key text primary key check (notification_key ~ '^[0-9a-f]{64}$'),
  payload_digest text not null check (payload_digest ~ '^[0-9a-f]{64}$'),
  state text not null default 'received' check (state in ('received','erased','completed')),
  result jsonb,
  sealed jsonb,
  key_id text not null,
  attempts integer not null default 0,
  progress integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  job_token uuid,
  job_locked_until timestamptz,
  last_code text,
  deliveries integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table trackdash_erasure.recomputes (
  release_id uuid not null references public.product_releases(id) on delete cascade,
  condition text not null check (condition in ('new_complete_unbuilt','built_complete','incomplete_parts_custom','unknown')),
  generation bigint not null default 1,
  completed_generation bigint not null default 0,
  claim_token uuid,
  locked_until timestamptz,
  primary key (release_id,condition)
);
create table trackdash_erasure.notification_work (
  notification_key text not null references trackdash_erasure.notifications on delete cascade,
  release_id uuid not null,
  condition text not null,
  required_generation bigint not null,
  primary key(notification_key,release_id,condition),
  foreign key(release_id,condition) references trackdash_erasure.recomputes on delete cascade
);
alter table trackdash_erasure.notifications enable row level security;
alter table trackdash_erasure.recomputes enable row level security;
alter table trackdash_erasure.notification_work enable row level security;
revoke all on trackdash_erasure.notifications,trackdash_erasure.recomputes,trackdash_erasure.notification_work from public, anon, authenticated;
grant select,insert,update on trackdash_erasure.notifications,trackdash_erasure.recomputes,trackdash_erasure.notification_work to service_role;

create function trackdash_erasure.matches(value text, identifiers text[]) returns boolean
language sql immutable security invoker set search_path=pg_catalog as $$
 select coalesce(exists(select 1 from unnest(identifiers) i where i <> '' and
 (lower(value)=lower(i) or lower(value)='ebay:'||lower(i)
 or strpos(lower(value),'|'||lower(i)||'|')>0
 or right(lower(value),length(i)+1)='|'||lower(i)
 or left(lower(value),length(i)+1)=lower(i)||'|')),false)
$$;
create function trackdash_erasure.redact(value jsonb, identifiers text[]) returns jsonb
language plpgsql immutable security invoker set search_path=pg_catalog as $$
declare result jsonb;
begin
 if value is null then return null; end if;
 case jsonb_typeof(value)
 when 'string' then
  if trackdash_erasure.matches(value#>>'{}',identifiers) then return 'null'::jsonb; end if;
 when 'object' then
  select coalesce(jsonb_object_agg(key,trackdash_erasure.redact(v,identifiers)),'{}'::jsonb)
  into result from jsonb_each(value) as x(key,v); return result;
 when 'array' then
  select coalesce(jsonb_agg(trackdash_erasure.redact(v,identifiers) order by ordinal),'[]'::jsonb)
  into result from jsonb_array_elements(value) with ordinality as x(v,ordinal); return result;
 else null;
 end case;
 return value;
end $$;
revoke all on function trackdash_erasure.matches(text,text[]), trackdash_erasure.redact(jsonb,text[]) from public,anon,authenticated;
grant execute on function trackdash_erasure.matches(text,text[]), trackdash_erasure.redact(jsonb,text[]) to service_role;

-- All erasure updates and outbox generations commit together or roll back together.
-- The same advisory lock fences canonical publication against concurrent erasures.
create function public.trackdash_ebay_erasure(p_action text,p_key text,p_digest text,p_data jsonb default '{}')
returns jsonb language plpgsql security invoker
set search_path=pg_catalog set statement_timeout='10s' set lock_timeout='250ms' as $$
declare
 phase text := 'register';
 j trackdash_erasure.notifications%rowtype;
 w trackdash_erasure.recomputes%rowtype;
 ids uuid[]; candidates uuid[]; identifiers text[];
 affected jsonb := '[]'; changed jsonb; record jsonb;
 n integer; c integer:=0; o integer:=0; pp integer:=0; a integer:=0; m integer:=0;
 tbl text; target_keys text[]; columns_sql text; values_sql text; updates_sql text; conflict_sql text;
begin
 if p_key is null or p_digest is null or p_key !~ '^[0-9a-f]{64}$' or p_digest !~ '^[0-9a-f]{64}$' then raise exception 'EBAY_ERASURE_INVALID'; end if;
 if p_action='register' then
  if jsonb_typeof(p_data->'sealed') is distinct from 'object' or coalesce(p_data->'sealed'->>'keyId','') !~ '^[a-zA-Z0-9_-]{1,40}$' then raise exception 'EBAY_INBOX_REQUIRED'; end if;
  insert into trackdash_erasure.notifications(notification_key,payload_digest,sealed,key_id)
  values(p_key,p_digest,p_data->'sealed',p_data->'sealed'->>'keyId')
  on conflict(notification_key) do update set deliveries=trackdash_erasure.notifications.deliveries+1,updated_at=now()
  where trackdash_erasure.notifications.payload_digest=coalesce(p_data->'digests'->>trackdash_erasure.notifications.key_id,p_digest);
  if not found then raise exception 'EBAY_ERASURE_CONFLICT'; end if;
 end if;
  phase:='notification_lock';
 select * into j from trackdash_erasure.notifications where notification_key=p_key for update;
 if not found then raise exception 'EBAY_ERASURE_NOT_REGISTERED'; end if;
 if p_action='register' then p_digest:=j.payload_digest; end if;
 if j.payload_digest<>p_digest then raise exception 'EBAY_ERASURE_CONFLICT'; end if;
 if p_action='erase' and j.state='received' then
  if not pg_try_advisory_xact_lock(70601601) then raise exception 'EBAY_ERASURE_BUSY'; end if;
  select array_agg(v) into identifiers from jsonb_array_elements_text(p_data->'identifiers') x(v) where v<>'';
  if coalesce(cardinality(identifiers),0)=0 then raise exception 'EBAY_ERASURE_INVALID'; end if;
  if not (select guard_enabled from trackdash_erasure.fence where singleton) then raise exception 'EBAY_GUARD_REQUIRED'; end if;
  update trackdash_erasure.fence set epoch=epoch+1 where singleton;
  phase:='suppression';
  perform trackdash_erasure.remember(identifiers);
  phase:='source_lookup';
  select array_agg(id) into ids from (
   select source_id as id from public.market_source_policies where source_family='ebay'
   union select id from public.price_sources where slug like 'ebay\_%' escape '\'
   union select source_id from trackdash_erasure.erasure_sources()) s;
  phase:='candidates';
  with examined as materialized (
   select id,resolved_release_id,condition,seller_fingerprint,evidence_group_key,raw_payload,
   trackdash_erasure.redact(raw_payload,identifiers) as redacted
   ,trackdash_erasure.has_personal(to_jsonb(mc),identifiers) as has_personal
   from public.market_candidates mc where source_id=any(ids) and trackdash_erasure.has_personal(to_jsonb(mc),identifiers)
  ), updated as (
   update public.market_candidates t set
    seller_fingerprint=case when trackdash_erasure.matches(t.seller_fingerprint,identifiers) then null else t.seller_fingerprint end,
    evidence_group_key=case when trackdash_erasure.matches(t.seller_fingerprint,identifiers) or trackdash_erasure.matches(t.evidence_group_key,identifiers) then null else t.evidence_group_key end,
    raw_payload=trackdash_erasure.redact(t.raw_payload,identifiers),updated_at=now()
   from examined x where t.id=x.id and (trackdash_erasure.matches(x.seller_fingerprint,identifiers)
    or trackdash_erasure.matches(x.evidence_group_key,identifiers) or x.raw_payload is distinct from x.redacted or x.has_personal)
   returning t.id,t.resolved_release_id as release_id,t.condition
  ) select count(*),array_agg(id),coalesce(jsonb_agg(jsonb_build_object('release_id',release_id,'condition',condition)) filter(where release_id is not null),'[]')
   into c,candidates,changed from updated;
  affected:=affected||changed;
  phase:='offers';
  with updated as (
   update public.market_offer_states set seller_fingerprint=null,updated_at=now()
   where source_id=any(ids) and trackdash_erasure.has_personal(to_jsonb(market_offer_states),identifiers)
   returning release_id,condition
  ) select count(*),coalesce(jsonb_agg(jsonb_build_object('release_id',release_id,'condition',condition)),'[]') into o,changed from updated;
  affected:=affected||changed;
  phase:='price_points';
  with updated as (
   update public.price_points set evidence_group_key=null,valuation_eligible=false,evidence_grade='indicative',
    quality_flags=case when 'seller_unknown'=any(quality_flags) then quality_flags else array_append(quality_flags,'seller_unknown') end,updated_at=now()
   where source_id=any(ids) and (candidate_id=any(candidates) or trackdash_erasure.has_personal(to_jsonb(price_points),identifiers))
   returning release_id,condition
  ) select count(*),coalesce(jsonb_agg(jsonb_build_object('release_id',release_id,'condition',condition)),'[]') into pp,changed from updated;
  affected:=affected||changed;
  phase:='aggregates';
  update public.market_aggregate_observations set raw_payload=trackdash_erasure.redact(raw_payload,identifiers),updated_at=now()
   where source_id=any(ids) and trackdash_erasure.has_personal(to_jsonb(market_aggregate_observations),identifiers);
  get diagnostics a=row_count;
  phase:='monthly';
  update public.market_monthly_source_stats set raw_payload=trackdash_erasure.redact(raw_payload,identifiers),updated_at=now()
   where source_id=any(ids) and trackdash_erasure.has_personal(to_jsonb(market_monthly_source_stats),identifiers);
  get diagnostics m=row_count;
  phase:='outbox';
  for record in select distinct v from jsonb_array_elements(affected) x(v) loop
   insert into trackdash_erasure.recomputes(release_id,condition) values((record->>'release_id')::uuid,record->>'condition')
   on conflict(release_id,condition) do update set generation=trackdash_erasure.recomputes.generation+1,claim_token=null,locked_until=null
   returning * into w;
   insert into trackdash_erasure.notification_work values(p_key,w.release_id,w.condition,w.generation);
  end loop;
  update trackdash_erasure.notifications set state='erased',sealed=null,result=jsonb_build_object('candidates',c,'offers',o,'price_points',pp,'aggregates',a,'monthly',m),updated_at=now() where notification_key=p_key;
 elsif p_action='claim' then
  phase:='claim';
  if j.state='received' then raise exception 'EBAY_ERASURE_NOT_ERASED'; end if;
  select r.* into w from trackdash_erasure.recomputes r
   join trackdash_erasure.notification_work nw using(release_id,condition)
   where nw.notification_key=p_key and r.completed_generation<nw.required_generation
   and (r.locked_until is null or r.locked_until<clock_timestamp())
   order by r.release_id,r.condition for update of r skip locked limit 1;
  if found then
   update trackdash_erasure.recomputes set claim_token=gen_random_uuid(),locked_until=clock_timestamp()+interval '90 seconds'
    where release_id=w.release_id and condition=w.condition returning * into w;
   return jsonb_build_object('state','claimed','releaseId',w.release_id,'condition',w.condition,'generation',w.generation,'token',w.claim_token);
  end if;
 elsif p_action='publish' then
  phase:='publish';
  if not pg_try_advisory_xact_lock(70601601) then raise exception 'EBAY_ERASURE_BUSY'; end if;
  select * into w from trackdash_erasure.recomputes where release_id=(p_data->>'releaseId')::uuid and condition=p_data->>'condition' for update;
  if not found or w.claim_token is null or w.locked_until is null or w.generation is distinct from (p_data->>'generation')::bigint or w.claim_token is distinct from (p_data->>'token')::uuid or w.generation<>(p_data->>'generation')::bigint or w.locked_until<clock_timestamp()
   then raise exception 'EBAY_ERASURE_STALE_CLAIM'; end if;
  if not exists(select 1 from trackdash_erasure.notification_work nw where nw.notification_key=p_key and nw.release_id=w.release_id and nw.condition=w.condition) then raise exception 'EBAY_ERASURE_INVALID'; end if;
  perform trackdash_erasure.write_publication(w.generation,w.release_id,w.condition,p_data->'writes');
  update trackdash_erasure.recomputes set completed_generation=w.generation,claim_token=null,locked_until=null where release_id=w.release_id and condition=w.condition;
 elsif p_action not in ('register','status','erase','claim','publish') then raise exception 'EBAY_ERASURE_INVALID';
 end if;
 update trackdash_erasure.notifications j2 set state='completed',updated_at=now()
 where notification_key=p_key and state='erased' and not exists(
  select 1 from trackdash_erasure.notification_work nw join trackdash_erasure.recomputes r using(release_id,condition)
  where nw.notification_key=p_key and r.completed_generation<nw.required_generation);
 select * into j from trackdash_erasure.notifications where notification_key=p_key;
 return jsonb_build_object('state',j.state,'result',j.result,'digest',j.payload_digest,'sealed',j.sealed);
exception when others then
 raise exception using errcode=sqlstate,message='EBAY_ERASURE_OPERATION_FAILED',detail=phase;
end $$;
revoke all on function public.trackdash_ebay_erasure(text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.trackdash_ebay_erasure(text,text,text,jsonb) to service_role;
