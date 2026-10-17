-- A1 proposal only. Apply with the other two P06A proposals in ONE transaction.
-- No secret is generated here. A separately approved Vault binding is required.
create table trackdash_erasure.suppression_config(singleton boolean primary key default true check(singleton),enabled boolean not null default false);
insert into trackdash_erasure.suppression_config default values;
create table trackdash_erasure.suppression_keys(
 key_id text primary key check(key_id ~ '^[a-zA-Z0-9_-]{1,40}$'),vault_secret_id uuid not null unique,
 key_check bytea not null check(octet_length(key_check)=32),created_at timestamptz not null default now());
create table trackdash_erasure.suppressed_identities(
 key_id text not null references trackdash_erasure.suppression_keys on delete restrict,
 token bytea not null check(octet_length(token)=32),created_at timestamptz not null default now(),
 retention_reason text not null default 'prevent_historical_reintroduction' check(retention_reason='prevent_historical_reintroduction'),
 primary key(key_id,token));
create table trackdash_erasure.suppressed_candidates(candidate_id uuid primary key,created_at timestamptz not null default now());
create table trackdash_erasure.ebay_sources(source_id uuid primary key);
insert into trackdash_erasure.ebay_sources select source_id from public.market_source_policies where source_family='ebay'
 union select id from public.price_sources where slug like 'ebay\_%' escape '\';
alter table trackdash_erasure.suppression_config enable row level security;
alter table trackdash_erasure.suppression_keys enable row level security;
alter table trackdash_erasure.suppressed_identities enable row level security;
alter table trackdash_erasure.suppressed_candidates enable row level security;
alter table trackdash_erasure.ebay_sources enable row level security;
revoke all on trackdash_erasure.suppression_config,trackdash_erasure.suppression_keys,trackdash_erasure.suppressed_identities,trackdash_erasure.suppressed_candidates,trackdash_erasure.ebay_sources from public,anon,authenticated,service_role;

-- Same case-insensitive identity semantics as erasure, plus structured tokens
-- in composite evidence keys/URLs/text. Numbers/prices remain JSON numbers.
create function trackdash_erasure.url_decode(value text) returns text language plpgsql immutable security invoker set search_path=pg_catalog as $$
declare bytes bytea:=''::bytea;i integer:=1;ch text;
begin
 if value is null or strpos(value,'%')=0 then return value;end if;
 while i<=length(value) loop
  ch:=substr(value,i,1);
  if ch='%' and substr(value,i+1,2) ~ '^[0-9a-fA-F]{2}$' then bytes:=bytes||decode(substr(value,i+1,2),'hex');i:=i+3;
  else bytes:=bytes||convert_to(ch,'UTF8');i:=i+1;end if;
 end loop;return convert_from(bytes,'UTF8');
exception when others then raise exception using errcode='PT422',message='EBAY_IDENTITY_ENCODING_REJECTED';
end $$;
create function trackdash_erasure.identity_parts(value text) returns text[] language sql immutable security invoker set search_path=pg_catalog as $$
 with decoded as (select lower(btrim(value)) v union select lower(btrim(trackdash_erasure.url_decode(value))) where strpos(value,'%')>0)
 select coalesce(array_agg(distinct part) filter(where part<>''),'{}'::text[]) from decoded cross join lateral (
 select v part union select regexp_replace(v,'^ebay:','')
 union select regexp_replace(v,'^https?://[^/]+/(usr|str)/','') where v ~ '^https?://[^/]+/(usr|str)/'
 union select unnest(string_to_array(v,'|'))
 union select atom from regexp_split_to_table(v,'[^a-z0-9_.-]+') atom
 union select btrim(atom,'.-') from regexp_split_to_table(v,'[^a-z0-9_.-]+') atom
 ) p
$$;
create or replace function trackdash_erasure.matches(value text,identifiers text[]) returns boolean
language sql immutable security invoker set search_path=pg_catalog as $$
 select coalesce(trackdash_erasure.identity_parts(value) && array(select lower(btrim(i)) from unnest(identifiers) i where btrim(i)<>''),false)
$$;
-- Do not retain a personal identifier used as a JSON object key either.
create or replace function trackdash_erasure.redact(value jsonb,identifiers text[]) returns jsonb
language plpgsql immutable security invoker set search_path=pg_catalog as $$
declare result jsonb;
begin
 case jsonb_typeof(value)
 when 'string' then if trackdash_erasure.matches(value#>>'{}',identifiers) then return 'null'::jsonb; end if;
 when 'object' then select coalesce(jsonb_object_agg(k,trackdash_erasure.redact(v,identifiers)),'{}') into result
  from jsonb_each(value) x(k,v) where not trackdash_erasure.matches(k,identifiers);return result;
 when 'array' then select coalesce(jsonb_agg(trackdash_erasure.redact(v,identifiers) order by n),'[]') into result
  from jsonb_array_elements(value) with ordinality x(v,n);return result;
 else null;
 end case;return value;
end $$;

-- Narrow private DEFINER helpers are necessary: scanners cannot read Vault,
-- keys or the suppression index. No public RPC or table privilege is added.
-- Vault contains a dedicated 32-byte pepper encoded as 64 lowercase hex chars.
create function trackdash_erasure.suppression_tokens(value text) returns table(key_id text,token bytea)
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare k record;secret text;part text;
begin
 if not exists(select 1 from trackdash_erasure.suppression_keys) then raise exception using errcode='PT503',message='EBAY_SUPPRESSION_KEY_UNAVAILABLE'; end if;
 for k in select x.key as key_id,x.value as secret from jsonb_each_text(trackdash_erasure.suppression_keyring()) x order by x.key loop
  secret:=k.secret;
  if secret is null or secret !~ '^[0-9a-f]{64}$' then raise exception using errcode='PT503',message='EBAY_SUPPRESSION_KEY_UNAVAILABLE'; end if;
  foreach part in array array[lower(btrim(value))] loop
   key_id:=k.key_id;
   token:=extensions.hmac(convert_to('trackdash/ebay/suppression-v1:'||part,'UTF8'),decode(secret,'hex'),'sha256');return next;
  end loop;
 end loop;
end $$;
create function trackdash_erasure.is_suppressed(value text) returns boolean
language sql volatile security definer set search_path=pg_catalog as $$
 select exists(select 1 from trackdash_erasure.suppression_tokens(value) t
 join trackdash_erasure.suppressed_identities s using(key_id,token))
$$;
-- Key material is loaded once per row, kept only in backend-local variables.
-- No GUC/session cache: writers cannot spoof or read a cached key.
create function trackdash_erasure.suppression_keyring() returns jsonb language plpgsql volatile security definer set search_path=pg_catalog as $$
declare result jsonb;valid boolean;
begin
 select jsonb_object_agg(k.key_id,v.decrypted_secret),bool_and(case when v.decrypted_secret ~ '^[0-9a-f]{64}$' then
 extensions.hmac(convert_to('trackdash/ebay/suppression-key-check-v1','UTF8'),decode(v.decrypted_secret,'hex'),'sha256')=k.key_check else false end)
 into result,valid from trackdash_erasure.suppression_keys k
 left join vault.decrypted_secrets v on v.id=k.vault_secret_id;
 if result is null or valid is distinct from true then
 raise exception using errcode='PT503',message='EBAY_SUPPRESSION_KEY_UNAVAILABLE';end if;
 return result;
end $$;
create function trackdash_erasure.matches_cached(value text,ring jsonb) returns boolean language sql volatile security definer set search_path=pg_catalog as $$
 select exists(select 1 from jsonb_each_text(ring) k(key_id,secret) cross join unnest(trackdash_erasure.identity_parts(value)) p(part)
 join trackdash_erasure.suppressed_identities s on s.key_id=k.key_id and s.token=extensions.hmac(convert_to('trackdash/ebay/suppression-v1:'||p.part,'UTF8'),decode(k.secret,'hex'),'sha256'))
$$;
create function trackdash_erasure.redact_cached(value jsonb,ring jsonb) returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare result jsonb;
begin
 case jsonb_typeof(value)
 when 'string' then if trackdash_erasure.matches_cached(value#>>'{}',ring) then return 'null'::jsonb;end if;
 when 'object' then select coalesce(jsonb_object_agg(k,trackdash_erasure.redact_cached(v,ring)),'{}') into result
  from jsonb_each(value) x(k,v) where not trackdash_erasure.matches_cached(k,ring);return result;
 when 'array' then select coalesce(jsonb_agg(trackdash_erasure.redact_cached(v,ring) order by n),'[]') into result
  from jsonb_array_elements(value) with ordinality x(v,n);return result;
 else null;end case;return value;
end $$;
-- Top-level keys here are fixed SQL column names, not identity-bearing JSON
-- keys. Preserve them so jsonb_populate_record cannot retain an omitted value.
create function trackdash_erasure.redact_row_cached(value jsonb,ring jsonb) returns jsonb language sql volatile security definer set search_path=pg_catalog as $$
 select jsonb_object_agg(k,trackdash_erasure.redact_cached(v,ring)) from jsonb_each(value) x(k,v)
$$;
create function trackdash_erasure.suppression_redact(value jsonb) returns jsonb language plpgsql volatile security definer set search_path=pg_catalog as $$
begin return trackdash_erasure.redact_cached(value,trackdash_erasure.suppression_keyring());end $$;
create function trackdash_erasure.has_personal(value jsonb,identifiers text[]) returns boolean language plpgsql immutable security invoker set search_path=pg_catalog as $$
begin
 if not exists(select 1 from unnest(identifiers) i where (strpos(lower(value::text),lower(btrim(i)))>0 or strpos(lower(value::text),lower(trim(both '"' from to_jsonb(btrim(i))::text)))>0 or strpos(value::text,'%')>0)) then return false;end if;
 return exists(select 1 from jsonb_each(value) x(k,v) where trackdash_erasure.redact(v,identifiers) is distinct from v);
end $$;
create function trackdash_erasure.is_ebay(source uuid) returns boolean language sql volatile security definer set search_path=pg_catalog as $$
 select exists(select 1 from trackdash_erasure.ebay_sources where source_id=source)
 or exists(select 1 from public.market_source_policies where source_id=source and source_family='ebay')
 or exists(select 1 from public.price_sources where id=source and slug like 'ebay\_%' escape '\')
$$;
create function trackdash_erasure.remember(identifiers text[]) returns void
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare value text;
begin
 if not (select enabled from trackdash_erasure.suppression_config where singleton) then raise exception using errcode='PT503',message='EBAY_INGRESS_GUARD_REQUIRED'; end if;
 -- Erasure already owns the exclusive transaction lock; do not allow a caller
 -- to insert tombstones outside that same serialization boundary.
 if not pg_try_advisory_xact_lock(70601601) then raise exception using errcode='PT409',message='EBAY_INGRESS_BUSY'; end if;
 foreach value in array identifiers loop
  insert into trackdash_erasure.suppressed_identities(key_id,token)
   select key_id,token from trackdash_erasure.suppression_tokens(value) on conflict do nothing;
 end loop;
end $$;
create function trackdash_erasure.ingress_lock() returns trigger language plpgsql security definer set search_path=pg_catalog as $$
begin
 -- Even while the switch is off, hold the shared lock so activation cannot
 -- race a transaction whose statement began before activation.
 if current_setting('transaction_isolation')<>'read committed' or not pg_try_advisory_xact_lock_shared(70601601) then
  raise exception using errcode='PT409',message='EBAY_INGRESS_BUSY';end if;
 return null;
end $$;
create function trackdash_erasure.ingress_row() returns trigger language plpgsql security definer set search_path=pg_catalog as $$
declare doc jsonb;clean jsonb;source uuid;candidate uuid;blocked boolean:=false;is_ebay boolean;ring jsonb;
begin
 if not (select enabled from trackdash_erasure.suppression_config where singleton) then return new; end if;
 doc:=to_jsonb(new);source:=(doc->>'source_id')::uuid;
 if tg_table_name='market_candidates' then candidate:=(doc->>'id')::uuid;else candidate:=(doc->>'candidate_id')::uuid;end if;
 blocked:=exists(select 1 from trackdash_erasure.suppressed_candidates where candidate_id=candidate);
 is_ebay:=blocked or trackdash_erasure.is_ebay(source);
 if tg_op='UPDATE' then is_ebay:=is_ebay or trackdash_erasure.is_ebay((to_jsonb(old)->>'source_id')::uuid);end if;
 if not is_ebay then return new;end if;
 -- Registers aliases/sources permanently even if a policy is later disabled.
 if trackdash_erasure.is_ebay(source) then insert into trackdash_erasure.ebay_sources values(source) on conflict do nothing;end if;
 ring:=trackdash_erasure.suppression_keyring();
 if not exists(select 1 from trackdash_erasure.suppressed_identities) then return new;end if;
 clean:=trackdash_erasure.redact_row_cached(doc,ring);
 if tg_op='UPDATE' then blocked:=blocked or trackdash_erasure.redact_row_cached(to_jsonb(old),ring) is distinct from to_jsonb(old);end if;
 if candidate is not null and (blocked or clean is distinct from doc) then
  insert into trackdash_erasure.suppressed_candidates values(candidate,now()) on conflict do nothing;
 end if;
 if tg_table_name='market_candidates' then
  blocked:=blocked or clean is distinct from doc;
  if blocked then
   insert into trackdash_erasure.suppressed_candidates values(candidate,now()) on conflict do nothing;
   clean:=jsonb_set(jsonb_set(clean,'{seller_fingerprint}','null'),'{evidence_group_key}','null');
  end if;
 elsif tg_table_name='market_offer_states' and (blocked or clean is distinct from doc) then
  clean:=jsonb_set(clean,'{seller_fingerprint}','null');
 elsif tg_table_name='price_points' and (blocked or clean is distinct from doc) then
  clean:=clean||jsonb_build_object('evidence_group_key',null,'valuation_eligible',false,'evidence_grade','indicative',
   'quality_flags',(select jsonb_agg(distinct v) from jsonb_array_elements(coalesce(doc->'quality_flags','[]')||'["seller_unknown"]') x(v)));
 end if;
 new:=jsonb_populate_record(new,clean);return new;
exception when others then
 -- No original row, parameter, Vault error or untrusted string in the error.
 raise exception using errcode=sqlstate,message='EBAY_INGRESS_REJECTED';
end $$;
-- Remember historical source attribution across policy/slug edits and deletes.
create function trackdash_erasure.capture_ebay_source() returns trigger language plpgsql security definer set search_path=pg_catalog as $$
declare doc jsonb;source uuid;
begin
 if tg_op<>'INSERT' then
  doc:=to_jsonb(old);source:=coalesce(doc->>'source_id',doc->>'id')::uuid;
  if doc->>'source_family'='ebay' or doc->>'slug' like 'ebay\_%' escape '\' then insert into trackdash_erasure.ebay_sources values(source) on conflict do nothing;end if;
 end if;
 if tg_op<>'DELETE' then
  doc:=to_jsonb(new);source:=coalesce(doc->>'source_id',doc->>'id')::uuid;
  if doc->>'source_family'='ebay' or doc->>'slug' like 'ebay\_%' escape '\' then insert into trackdash_erasure.ebay_sources values(source) on conflict do nothing;end if;
 end if;return null;
end $$;
create trigger ebay_erasure_source_history after insert or update or delete on public.price_sources for each row execute function trackdash_erasure.capture_ebay_source();
create trigger ebay_erasure_source_history after insert or update or delete on public.market_source_policies for each row execute function trackdash_erasure.capture_ebay_source();
do $$declare tbl text;begin
 foreach tbl in array array['market_candidates','market_offer_states','price_points','market_aggregate_observations','market_monthly_source_stats'] loop
  execute format('create trigger ebay_erasure_ingress_lock before insert or update or delete on public.%I for each statement execute function trackdash_erasure.ingress_lock()',tbl);
  execute format('create trigger ebay_erasure_ingress_row before insert or update on public.%I for each row execute function trackdash_erasure.ingress_row()',tbl);
 end loop;
end $$;
revoke all on function trackdash_erasure.identity_parts(text),trackdash_erasure.suppression_tokens(text),trackdash_erasure.is_suppressed(text),trackdash_erasure.suppression_redact(jsonb),trackdash_erasure.is_ebay(uuid),trackdash_erasure.remember(text[]),trackdash_erasure.ingress_lock(),trackdash_erasure.ingress_row(),trackdash_erasure.capture_ebay_source() from public,anon,authenticated,service_role;
-- Only the erasure RPC needs this helper. Other helpers execute through private
-- DEFINER triggers; token and secret tables stay inaccessible to scanner role.
grant execute on function trackdash_erasure.remember(text[]),trackdash_erasure.identity_parts(text) to service_role;

create function trackdash_erasure.erasure_sources() returns table(source_id uuid) language sql volatile security definer set search_path=pg_catalog as $$select source_id from trackdash_erasure.ebay_sources$$;
revoke all on function trackdash_erasure.erasure_sources() from public,anon,authenticated;
grant execute on function trackdash_erasure.erasure_sources() to service_role;

revoke all on function trackdash_erasure.suppression_keyring(),trackdash_erasure.matches_cached(text,jsonb),trackdash_erasure.redact_cached(jsonb,jsonb),trackdash_erasure.has_personal(jsonb,text[]) from public,anon,authenticated,service_role;
grant execute on function trackdash_erasure.has_personal(jsonb,text[]) to service_role;
create trigger ebay_erasure_source_lock before insert or update or delete on public.price_sources for each statement execute function trackdash_erasure.ingress_lock();
create trigger ebay_erasure_source_lock before insert or update or delete on public.market_source_policies for each statement execute function trackdash_erasure.ingress_lock();

revoke all on function trackdash_erasure.url_decode(text) from public,anon,authenticated;
grant execute on function trackdash_erasure.url_decode(text) to service_role;

revoke all on function trackdash_erasure.redact_row_cached(jsonb,jsonb) from public,anon,authenticated,service_role;

create function trackdash_erasure.suppression_activation_guard() returns trigger language plpgsql security definer set search_path=pg_catalog as $$
begin
 if not pg_try_advisory_xact_lock(70601601) then raise exception using errcode='PT409',message='EBAY_INGRESS_BUSY';end if;
 if new.enabled then perform trackdash_erasure.suppression_keyring();
 elsif old.enabled and exists(select 1 from trackdash_erasure.suppressed_identities) then
 raise exception using errcode='PT409',message='EBAY_SUPPRESSION_RETENTION_REQUIRED';end if;
 return new;
end $$;
revoke all on function trackdash_erasure.suppression_activation_guard() from public,anon,authenticated,service_role;
create trigger suppression_activation_guard before update on trackdash_erasure.suppression_config for each row execute function trackdash_erasure.suppression_activation_guard();
