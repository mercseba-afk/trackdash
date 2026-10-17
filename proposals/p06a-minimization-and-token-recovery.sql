-- Review only. Append AFTER A1 proposals in the same approved transaction.
-- No keys, migration execution, schedule or active scanner change here.
create table trackdash_erasure.minimization_config(
 singleton boolean primary key default true check(singleton),enabled boolean not null default false,
 key_id text references trackdash_erasure.suppression_keys on delete restrict);
insert into trackdash_erasure.minimization_config default values;
alter table trackdash_erasure.minimization_config enable row level security;
revoke all on trackdash_erasure.minimization_config from public,anon,authenticated,service_role;
-- Pin the equality key. Rotating the wrapping key is safe; changing this pepper
-- changes seller partitions and requires a complete coordinated migration.
create function trackdash_erasure.minimization_config_guard() returns trigger
language plpgsql security definer set search_path=pg_catalog as $$
begin
 if not pg_try_advisory_xact_lock(70601601) then raise exception using errcode='PT409',message='EBAY_INGRESS_BUSY';end if;
 if tg_op<>'UPDATE' or (old.enabled and (not new.enabled or new.key_id is distinct from old.key_id)) then
 raise exception using errcode='PT409',message='EBAY_MINIMIZATION_DOWNGRADE_REJECTED';end if;
 if new.enabled then
  if new.key_id is null or not (trackdash_erasure.suppression_keyring() ? new.key_id)
   or not (select enabled from trackdash_erasure.suppression_config where singleton) then
   raise exception using errcode='PT503',message='EBAY_MINIMIZATION_NOT_READY';end if;
 end if;return new;
end $$;
create trigger ebay_minimization_config_guard before insert or update or delete on trackdash_erasure.minimization_config for each row execute function trackdash_erasure.minimization_config_guard();

-- Exact equality and normalized identity tokens are necessary: exact equality preserves existing case-sensitive
-- seller partitions; the normalized token preserves case-insensitive erasure.
-- A MAC prevents a writer from fabricating a well-formed opaque identifier.
create function trackdash_erasure.pseudonym_token(value text,ring jsonb) returns bytea[]
language plpgsql volatile security invoker set search_path=pg_catalog as $$
declare p text[];secret bytea;
begin
 p:=string_to_array(value,':');
 if cardinality(p)<>6 or p[1]<>'ebay' or p[2]<>'p1' or p[3] !~ '^[a-zA-Z0-9_-]{1,40}$'
 or p[4] !~ '^[0-9a-f]{64}$' or p[5] !~ '^[0-9a-f]{64}([.][0-9a-f]{64}){0,63}$' or p[6] !~ '^[0-9a-f]{64}$'
 or not(ring ? p[3]) then raise exception using errcode='PT503',message='EBAY_PSEUDONYM_REJECTED';end if;
 secret:=decode(ring->>p[3],'hex');
 if extensions.hmac(convert_to(array_to_string(p[1:5],':'),'UTF8'),secret,'sha256')<>decode(p[6],'hex') then
 raise exception using errcode='PT503',message='EBAY_PSEUDONYM_REJECTED';end if;
 return array(select decode(v,'hex') from unnest(string_to_array(p[5],'.')) x(v));
end $$;
create function trackdash_erasure.seller_pseudonym(value text) returns text
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare ring jsonb;k text;secret bytea;result text;tokens text;
begin
 if value is null then return null;end if;
 ring:=trackdash_erasure.suppression_keyring();
 if value like 'ebay:p1:%' then perform trackdash_erasure.pseudonym_token(value,ring);return value;end if;
 select key_id into k from trackdash_erasure.minimization_config where singleton and enabled;
 if k is null or not(ring ? k) then raise exception using errcode='PT503',message='EBAY_MINIMIZATION_NOT_READY';end if;
 secret:=decode(ring->>k,'hex');
 select string_agg(encode(extensions.hmac(convert_to('trackdash/ebay/suppression-v1:'||part,'UTF8'),secret,'sha256'),'hex'),'.' order by part) into tokens from unnest(trackdash_erasure.identity_parts(value)) p(part);
 if tokens is null or cardinality(string_to_array(tokens,'.'))>64 then raise exception using errcode='PT422',message='EBAY_IDENTITY_FORMAT_REJECTED';end if;
 result:='ebay:p1:'||k||':'||encode(extensions.hmac(convert_to('trackdash/ebay/seller-equality-v1:'||value,'UTF8'),secret,'sha256'),'hex')||':'||
 tokens;
 return result||':'||encode(extensions.hmac(convert_to(result,'UTF8'),secret,'sha256'),'hex');
end $$;
-- Raw semantics below are exactly A1. The new branch is required because A1's
-- plaintext prefilter cannot recognize an authenticated pseudonym.
create or replace function trackdash_erasure.matches_cached(value text,ring jsonb) returns boolean
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare tok bytea[];
begin
 if value like 'ebay:p1:%' then
  tok:=trackdash_erasure.pseudonym_token(value,ring);
  return exists(select 1 from trackdash_erasure.suppressed_identities where key_id=split_part(value,':',3) and token=any(tok));
 end if;
 return exists(select 1 from jsonb_each_text(ring) k(key_id,secret) cross join unnest(trackdash_erasure.identity_parts(value)) p(part)
 join trackdash_erasure.suppressed_identities s on s.key_id=k.key_id and s.token=extensions.hmac(convert_to('trackdash/ebay/suppression-v1:'||p.part,'UTF8'),decode(k.secret,'hex'),'sha256'));
end $$;
create or replace function trackdash_erasure.matches(value text,identifiers text[]) returns boolean
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare ring jsonb;tok bytea[];
begin
 if value like 'ebay:p1:%' then
  ring:=trackdash_erasure.suppression_keyring();tok:=trackdash_erasure.pseudonym_token(value,ring);
  return exists(select 1 from unnest(identifiers) i where extensions.hmac(convert_to('trackdash/ebay/suppression-v1:'||lower(btrim(i)),'UTF8'),decode(ring->>split_part(value,':',3),'hex'),'sha256')=any(tok));
 end if;
 return coalesce(trackdash_erasure.identity_parts(value) && array(select lower(btrim(i)) from unnest(identifiers) i where btrim(i)<>''),false);
end $$;
alter function trackdash_erasure.redact(jsonb,text[]) volatile;
create or replace function trackdash_erasure.has_personal(value jsonb,identifiers text[]) returns boolean
language plpgsql volatile security invoker set search_path=pg_catalog as $$
begin
 if strpos(value::text,'ebay:p1:')=0 and not exists(select 1 from unnest(identifiers) i where
 (strpos(lower(value::text),lower(btrim(i)))>0 or strpos(lower(value::text),lower(trim(both '"' from to_jsonb(btrim(i))::text)))>0 or strpos(value::text,'%')>0)) then return false;end if;
 return exists(select 1 from jsonb_each(value) x(k,v) where trackdash_erasure.redact(v,identifiers) is distinct from v);
end $$;

create function trackdash_erasure.safe_market_number(value jsonb) returns jsonb
language sql immutable security invoker set search_path=pg_catalog as $$
 select case when jsonb_typeof(value)='number' or (jsonb_typeof(value)='string' and length(value#>>'{}')<=100 and btrim(value#>>'{}') ~ '^[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)([eE][+-]?[0-9]+)?$') then value else 'null'::jsonb end
$$;
create function trackdash_erasure.minimize_row() returns trigger
language plpgsql security definer set search_path=pg_catalog as $$
declare doc jsonb;raw jsonb;safe jsonb:='{}';k text;v jsonb;
begin
 if not (select enabled from trackdash_erasure.minimization_config where singleton) then return new;end if;
 if not trackdash_erasure.is_ebay(new.source_id) then if tg_op<>'UPDATE' then return new;elsif not trackdash_erasure.is_ebay(old.source_id) then return new;end if;end if;
 doc:=to_jsonb(new);
 if doc ? 'review_notes' then doc:=jsonb_set(doc,'{review_notes}','null');end if;
 if doc ? 'seller_fingerprint' then doc:=jsonb_set(doc,'{seller_fingerprint}',coalesce(to_jsonb(trackdash_erasure.seller_pseudonym(doc->>'seller_fingerprint')),'null'));end if;
 -- Free-form payloads are not required by the market formulas. Keep only the
 -- validated numeric trend provenance and country/market enums used by readers.
 if doc ? 'raw_payload' then
  raw:=doc->'raw_payload';
  for k,v in select * from jsonb_each(case when jsonb_typeof(raw)='object' then raw else '{}' end) loop
   if k in ('itemLocationCountry','shippingEstimateCountry') and upper(btrim(v#>>'{}')) ~ '^[A-Z]{2}$' then safe:=safe||jsonb_build_object(k,upper(btrim(v#>>'{}')));
   elsif k='marketplace' and upper(v#>>'{}') ~ '^EBAY_[A-Z]{2,5}$' then safe:=safe||jsonb_build_object(k,v);
   elsif k='trend_evidence' and jsonb_typeof(v)='object' then
    safe:=safe||jsonb_build_object(k,jsonb_build_object(
     'trend_percent',case when jsonb_typeof(v->'trend_percent')='number' then v->'trend_percent' else 'null' end,
     'trend_window_months',case when jsonb_typeof(v->'trend_window_months')='number' then v->'trend_window_months' else 'null' end,
     'previous_window',jsonb_build_object('average_eur',trackdash_erasure.safe_market_number(v->'previous_window'->'average_eur'),'sales_count',trackdash_erasure.safe_market_number(v->'previous_window'->'sales_count')),
     'recent_window',jsonb_build_object('average_eur',trackdash_erasure.safe_market_number(v->'recent_window'->'average_eur'),'sales_count',trackdash_erasure.safe_market_number(v->'recent_window'->'sales_count'))));
   end if;
  end loop;doc:=jsonb_set(doc,'{raw_payload}',safe);
 end if;
 new:=jsonb_populate_record(new,doc);return new;
exception when others then raise exception using errcode=sqlstate,message='EBAY_MINIMIZATION_REJECTED';
end $$;
do $$declare tbl text;begin
 foreach tbl in array array['market_candidates','market_offer_states','market_aggregate_observations','market_monthly_source_stats'] loop
 execute format('create trigger zz_ebay_minimize before insert or update on public.%I for each row execute function trackdash_erasure.minimize_row()',tbl);end loop;
end $$;

create function public.trackdash_ebay_prepare_tokens(p_identifiers text[]) returns jsonb
language plpgsql security definer set search_path=pg_catalog set statement_timeout='3s' as $$
begin
 if coalesce(cardinality(p_identifiers),0) not between 1 and 3 or exists(select 1 from unnest(p_identifiers) i where i is null or length(i) not between 1 and 1000) then raise exception 'EBAY_IDENTIFIERS_INVALID';end if;
 if not (select enabled from trackdash_erasure.suppression_config where singleton) then raise exception 'EBAY_GUARD_REQUIRED';end if;
 return jsonb_build_object('tokens',(select jsonb_agg(distinct jsonb_build_object('keyId',t.key_id,'token',encode(t.token,'hex'))) from unnest(p_identifiers) i cross join lateral trackdash_erasure.suppression_tokens(i) t),
 'sourceIds',(select coalesce(jsonb_agg(source_id),'[]') from trackdash_erasure.ebay_sources));
exception when others then raise exception using errcode=sqlstate,message='EBAY_TOKEN_PREPARATION_FAILED';
end $$;

create function trackdash_erasure.needs_token_scrub(doc jsonb) returns boolean
language plpgsql volatile security definer set search_path=pg_catalog as $$
begin
 if trackdash_erasure.redact_row_cached(doc,trackdash_erasure.suppression_keyring()) is distinct from doc then return true;end if;
 if exists(select 1 from trackdash_erasure.suppressed_candidates where candidate_id=(doc->>'candidate_id')::uuid) then
  return (doc ? 'seller_fingerprint' and doc->>'seller_fingerprint' is not null)
   or (doc ? 'valuation_eligible' and (coalesce((doc->>'valuation_eligible')::boolean,false) or doc->>'evidence_group_key' is not null or doc->>'evidence_grade' is distinct from 'indicative'));
 end if;return false;
end $$;
create function public.trackdash_ebay_apply_tokens(p_key text,p_digest text) returns jsonb
language plpgsql security definer set search_path=pg_catalog set statement_timeout='10s' set lock_timeout='250ms' as $$
declare j trackdash_erasure.notifications%rowtype;phase text:='token_validation';t jsonb;ring jsonb;tbl text;changed jsonb;r jsonb;affected jsonb:='[]';w trackdash_erasure.recomputes%rowtype;
begin
 select * into j from trackdash_erasure.notifications where notification_key=p_key and payload_digest=p_digest for update;
 if not found then raise exception 'EBAY_NOTIFICATION_NOT_REGISTERED';end if;
 if j.state<>'received' then return jsonb_build_object('state',j.state);end if;
 if j.sealed->>'kind' is distinct from 'tokens-v1' or jsonb_typeof(j.sealed->'tokens') is distinct from 'array' or coalesce(jsonb_array_length(j.sealed->'tokens'),0) not between 1 and 48 or jsonb_typeof(j.sealed->'sourceIds') is distinct from 'array' then raise exception 'EBAY_TOKEN_RECEIPT_INVALID';end if;
 if not pg_try_advisory_xact_lock(70601601) then raise exception using errcode='PT409',message='EBAY_INGRESS_BUSY';end if;
 if not (select enabled from trackdash_erasure.suppression_config where singleton) or not (select guard_enabled from trackdash_erasure.fence where singleton) then raise exception 'EBAY_GUARD_REQUIRED';end if;
 phase:='suppression';ring:=trackdash_erasure.suppression_keyring();
 for t in select * from jsonb_array_elements(j.sealed->'tokens') loop
  if not (ring ? (t->>'keyId')) or t->>'token' !~ '^[0-9a-f]{64}$' then raise exception 'EBAY_TOKEN_KEY_UNAVAILABLE';end if;
  insert into trackdash_erasure.suppressed_identities(key_id,token) values(t->>'keyId',decode(t->>'token','hex')) on conflict do nothing;
 end loop;
 insert into trackdash_erasure.ebay_sources select v::uuid from jsonb_array_elements_text(j.sealed->'sourceIds') x(v) on conflict do nothing;
 update trackdash_erasure.fence set epoch=epoch+1 where singleton;
 -- Candidate markers, relational point scrubbing and all-field redaction are
 -- still performed by A1 triggers. Dependencies are captured atomically here.
 foreach tbl in array array['market_candidates','market_offer_states','price_points','market_aggregate_observations','market_monthly_source_stats'] loop
  phase:=tbl;execute format('with updated as (update public.%I set updated_at=updated_at where trackdash_erasure.is_ebay(source_id) and trackdash_erasure.needs_token_scrub(to_jsonb(%I)) returning to_jsonb(%I) as d) select coalesce(jsonb_agg(jsonb_build_object(''release_id'',coalesce(d->>''resolved_release_id'',d->>''release_id''),''condition'',d->>''condition'')) filter(where coalesce(d->>''resolved_release_id'',d->>''release_id'') is not null),''[]'') from updated',tbl,tbl,tbl) into changed;
  affected:=affected||changed;
 end loop;
 phase:='outbox';
 for r in select distinct v from jsonb_array_elements(affected) x(v) loop
  insert into trackdash_erasure.recomputes(release_id,condition) values((r->>'release_id')::uuid,r->>'condition')
  on conflict(release_id,condition) do update set generation=trackdash_erasure.recomputes.generation+1,claim_token=null,locked_until=null returning * into w;
  insert into trackdash_erasure.notification_work values(p_key,w.release_id,w.condition,w.generation) on conflict(notification_key,release_id,condition) do update set required_generation=excluded.required_generation;
 end loop;
 update trackdash_erasure.notifications set state='erased',sealed=null,updated_at=now() where notification_key=p_key;
 return jsonb_build_object('state','erased');
exception when others then raise exception using errcode=sqlstate,message='EBAY_TOKEN_ERASURE_FAILED',detail=phase;
end $$;

-- A single primary-database inbox: survives process interruption, not loss of
-- committed database history. No external journal, counters or restore claims.
create function public.trackdash_ebay_accept_tokens(p_key text,p_digest text,p_digests jsonb,p_key_id text,p_identifiers text[]) returns jsonb
language plpgsql security definer set search_path=pg_catalog set statement_timeout='5s' set lock_timeout='250ms' as $$
declare prepared jsonb;result jsonb;
begin
 if not(select guard_enabled from trackdash_erasure.fence where singleton) then raise exception 'EBAY_GUARD_REQUIRED';end if;
 perform set_config('synchronous_commit','on',true);
 prepared:=public.trackdash_ebay_prepare_tokens(p_identifiers);
 result:=public.trackdash_ebay_erasure('register',p_key,p_digest,jsonb_build_object('digests',p_digests,
  'sealed',jsonb_build_object('kind','tokens-v1','keyId',p_key_id,'tokens',prepared->'tokens','sourceIds',prepared->'sourceIds')));
 -- Registration COMMIT is the durability boundary. Stale worker returns 503
 -- in the application AFTER persisting work, preserving autonomous recovery.
 return jsonb_build_object('state',result->>'state','workerFresh',(select last_success>clock_timestamp()-interval '15 minutes' from trackdash_erasure.heartbeat where singleton));
exception when others then raise exception using errcode=sqlstate,message='EBAY_ACCEPTANCE_FAILED';
end $$;
-- Existing bootstrap timestamp must not masquerade as a successful worker.
update trackdash_erasure.heartbeat set last_success='-infinity';

create role trackdash_erasure_monitor nologin noinherit nobypassrls;
create function public.trackdash_ebay_erasure_health() returns jsonb
language sql security definer set search_path=pg_catalog set statement_timeout='3s' as $$
 select jsonb_build_object('pending',(select count(*) from trackdash_erasure.notifications where state<>'completed'),
 'oldestPendingSeconds',(select coalesce(extract(epoch from now()-min(created_at)),0) from trackdash_erasure.notifications where state<>'completed'),
 'exhausted',(select count(*) from trackdash_erasure.notifications where state<>'completed' and attempts>=8),
 'heartbeatSeconds',(select case when isfinite(last_success) then greatest(0,extract(epoch from now()-last_success)) else 1e9 end from trackdash_erasure.heartbeat where singleton),
 'undelivered',(select count(*) from trackdash_erasure.alerts where resolved_at is null and delivered_at is null),
 'guard',(select enabled from trackdash_erasure.suppression_config where singleton)
  and (select guard_enabled from trackdash_erasure.fence where singleton))
$$;
revoke all on function public.trackdash_ebay_erasure_health() from public,anon,authenticated,service_role,trackdash_app;
grant execute on function public.trackdash_ebay_erasure_health() to trackdash_erasure_monitor;
revoke all on function public.trackdash_ebay_prepare_tokens(text[]),public.trackdash_ebay_apply_tokens(text,text),public.trackdash_ebay_accept_tokens(text,text,jsonb,text,text[]) from public,anon,authenticated,trackdash_app;
grant execute on function public.trackdash_ebay_prepare_tokens(text[]),public.trackdash_ebay_apply_tokens(text,text),public.trackdash_ebay_accept_tokens(text,text,jsonb,text,text[]) to service_role;
revoke all on function trackdash_erasure.safe_market_number(jsonb),trackdash_erasure.needs_token_scrub(jsonb),trackdash_erasure.minimization_config_guard(),trackdash_erasure.pseudonym_token(text,jsonb),trackdash_erasure.seller_pseudonym(text),trackdash_erasure.minimize_row() from public,anon,authenticated,service_role;

-- Object grants, not new RLS policies. Existing private tables require bypass;
-- the worker gets no Vault, profile, Collection or scanner-queue privileges.
create role trackdash_erasure_worker nologin noinherit bypassrls;
grant usage on schema public,trackdash_erasure to trackdash_erasure_worker;
grant select,insert,update on trackdash_erasure.notifications,trackdash_erasure.recomputes,trackdash_erasure.notification_work,trackdash_erasure.alerts to trackdash_erasure_worker;
grant select,update on trackdash_erasure.heartbeat,trackdash_erasure.fence to trackdash_erasure_worker;
grant select,update on public.market_candidates,public.market_offer_states,public.price_points,public.market_aggregate_observations,public.market_monthly_source_stats to trackdash_erasure_worker;
grant select,insert,update on public.market_release_signals,public.market_release_monthly_signals,public.market_release_ask_snapshots to trackdash_erasure_worker;
grant select(id,slug,market_region,merchant_key) on public.price_sources to trackdash_erasure_worker;
grant select(source_id,source_family) on public.market_source_policies to trackdash_erasure_worker;
grant select(id,seller_id,buyer_id,condition,item_price_eur,sale_date,release_id,status) on public.marketplace_sales to trackdash_erasure_worker;
grant execute on function public.trackdash_ebay_erasure(text,text,text,jsonb),public.trackdash_ebay_apply_tokens(text,text),public.trackdash_ebay_recovery(text,jsonb) to trackdash_erasure_worker;
grant execute on function trackdash_erasure.write_publication(bigint,uuid,text,jsonb),trackdash_erasure.write_guard(),trackdash_erasure.remember(text[]),trackdash_erasure.erasure_sources(),trackdash_erasure.identity_parts(text),trackdash_erasure.matches(text,text[]),trackdash_erasure.redact(jsonb,text[]),trackdash_erasure.has_personal(jsonb,text[]) to trackdash_erasure_worker;
grant trackdash_erasure_worker,trackdash_erasure_monitor to authenticator;
create role trackdash_erasure_ingress nologin noinherit nobypassrls;
grant usage on schema public to trackdash_erasure_ingress;
grant execute on function public.trackdash_ebay_accept_tokens(text,text,jsonb,text,text[]) to trackdash_erasure_ingress;
grant trackdash_erasure_ingress to authenticator;
