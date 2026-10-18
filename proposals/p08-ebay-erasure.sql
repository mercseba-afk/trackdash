-- P0.8 REVIEW ONLY. Do not apply to Production without release approval.
-- No scanner, price formula, source-policy, RLS or scheduler changes.
-- Three release phases: helpers, concurrent indexes, then RPCs. Review each
-- phase before running; the application must remain on the old code until done.
begin;
set local lock_timeout='2s';
create schema if not exists private;

-- Conservative search projection, NOT an anonymization boundary. Hashes prevent
-- duplicating clear-text identities in index entries, but are not secret HMACs.
-- JS remains the authoritative matcher. Non-ASCII/large/high-delimiter strings
-- add a fallback marker; they are always fetched for exact JS evaluation.
create function private.p08_ebay_erasure_terms(p_value jsonb, p_depth integer default 0)
returns text[] language plpgsql immutable parallel safe
set search_path = pg_catalog
as $$
declare
  v jsonb; s text; parts text[]; terms text[] := '{}'; i integer; j integer;
begin
  if p_depth>32 then return array['!fallback!']; end if;
  case jsonb_typeof(p_value)
  when 'object' then
    for v in select value from jsonb_each(p_value) loop
      terms := terms || private.p08_ebay_erasure_terms(v,p_depth+1);
      if cardinality(terms)>512 then return array['!fallback!']; end if;
    end loop;
  when 'array' then
    for v in select value from jsonb_array_elements(p_value) loop
      terms := terms || private.p08_ebay_erasure_terms(v,p_depth+1);
      if cardinality(terms)>512 then return array['!fallback!']; end if;
    end loop;
  when 'string' then
    s := p_value #>> '{}';
    if octet_length(s) <> length(s) or length(s)>4096
       or length(s)-length(replace(s,'|',''))>16 then
      return array['!fallback!'];
    end if;
    s := translate(s,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz');
    terms := array[encode(sha256(convert_to(s,'UTF8')),'hex')];
    if starts_with(s,'ebay:') then
      terms := terms || encode(sha256(convert_to(substr(s,6),'UTF8')),'hex');
    end if;
    parts := string_to_array(s,'|');
    -- Every contiguous pipe-delimited interval, including IDs containing pipes.
    for i in 1..coalesce(array_length(parts,1),0) loop
      for j in i..array_length(parts,1) loop
        terms := terms || encode(sha256(convert_to(array_to_string(parts[i:j],'|'),'UTF8')),'hex');
      end loop;
    end loop;
  else null;
  end case;
  return array(select distinct x from unnest(terms) x);
end;
$$;
revoke all on function private.p08_ebay_erasure_terms(jsonb,integer) from public, anon, authenticated;

-- Fixed jsonb/text argument types make this wrapper immutable (unlike the
-- polymorphic jsonb_build_array catalog declaration).
create function private.p08_ebay_erasure_row_terms(p_payload jsonb, p_seller text, p_group text)
returns text[] language sql immutable parallel safe security definer set search_path = pg_catalog
as $$ select array['!all!'] || private.p08_ebay_erasure_terms(jsonb_build_array(p_payload,p_seller,p_group)) $$;
revoke all on function private.p08_ebay_erasure_row_terms(jsonb,text,text) from public, anon, authenticated;
grant execute on function private.p08_ebay_erasure_row_terms(jsonb,text,text) to service_role, trackdash_app;

commit;

create index concurrently p08_market_candidates_erasure_terms on public.market_candidates using gin
  (private.p08_ebay_erasure_row_terms(raw_payload,seller_fingerprint,evidence_group_key));
create index concurrently p08_market_offer_states_erasure_terms on public.market_offer_states using gin
  (private.p08_ebay_erasure_row_terms(null::jsonb,seller_fingerprint,null::text));
create index concurrently p08_price_points_erasure_terms on public.price_points using gin
  (private.p08_ebay_erasure_row_terms(null::jsonb,null::text,evidence_group_key));
create index concurrently p08_market_aggregate_observations_erasure_terms on public.market_aggregate_observations using gin
  (private.p08_ebay_erasure_row_terms(raw_payload,null::text,null::text));
create index concurrently p08_market_monthly_source_stats_erasure_terms on public.market_monthly_source_stats using gin
  (private.p08_ebay_erasure_row_terms(raw_payload,null::text,null::text));

begin;
set local lock_timeout='2s';

-- One statement snapshot; returns JSON arrays so PostgREST's row cap cannot
-- silently truncate the plan. Only indexed matches/fallback rows leave Postgres.
create function public.trackdash_plan_ebay_erasure(p_identifiers text[])
returns jsonb language plpgsql stable security definer
set search_path = pg_catalog set lock_timeout = '2s'
as $$
declare
  sources uuid[]; terms text[]; full_scan boolean; candidates uuid[];
  answer jsonb := '{}'; rows jsonb;
begin
  if p_identifiers is null or cardinality(p_identifiers) not between 1 and 3
     or exists(select 1 from unnest(p_identifiers) x where x is null or length(x) not between 1 and 1000) then
    raise exception 'EBAY_ERASURE_ARGUMENTS';
  end if;
  full_scan := exists(select 1 from unnest(p_identifiers) x where octet_length(x) <> length(x));
  terms := array(select encode(sha256(convert_to(translate(x,
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'UTF8')),'hex') from unnest(p_identifiers) x)
    || array['!fallback!'];
  -- Every row has !all!, allowing the rare non-ASCII request to include all
  -- data without an OR parameter that prevents a generic indexed plan.
  if full_scan then terms := array['!all!']; end if;
  select coalesce(array_agg(id),'{}') into sources from (
    select source_id id from public.market_source_policies where source_family='ebay'
    union select id from public.price_sources where slug like 'ebay_%'
  ) s;
  select coalesce(jsonb_agg(jsonb_build_object('id',t.id,'resolved_release_id',t.resolved_release_id,'condition',t.condition,'seller_fingerprint',t.seller_fingerprint,'evidence_group_key',t.evidence_group_key,'raw_payload',t.raw_payload,'version',t.xmin::text)),'[]')
  into rows from public.market_candidates t
  where t.source_id=any(sources) and (private.p08_ebay_erasure_row_terms(t.raw_payload,t.seller_fingerprint,t.evidence_group_key) && terms);
  answer := answer || jsonb_build_object('market_candidates',rows);
  select coalesce(array_agg((x->>'id')::uuid),'{}') into candidates from jsonb_array_elements(rows) x;
  select coalesce(jsonb_agg(jsonb_build_object('id',t.id,'release_id',t.release_id,'condition',t.condition,'seller_fingerprint',t.seller_fingerprint,'version',t.xmin::text)),'[]')
  into rows from public.market_offer_states t
  where t.source_id=any(sources) and (private.p08_ebay_erasure_row_terms(null::jsonb,t.seller_fingerprint,null::text) && terms);
  answer := answer || jsonb_build_object('market_offer_states',rows);
  select coalesce(jsonb_agg(jsonb_build_object('id',t.id,'candidate_id',t.candidate_id,'release_id',t.release_id,'condition',t.condition,'evidence_group_key',t.evidence_group_key,'quality_flags',t.quality_flags,'version',t.xmin::text)),'[]')
  into rows from public.price_points t
  where t.source_id=any(sources) and (private.p08_ebay_erasure_row_terms(null::jsonb,null::text,t.evidence_group_key) && terms or t.candidate_id=any(candidates));
  answer := answer || jsonb_build_object('price_points',rows);
  select coalesce(jsonb_agg(jsonb_build_object('id',t.id,'release_id',t.release_id,'condition',t.condition,'raw_payload',t.raw_payload,'version',t.xmin::text)),'[]')
  into rows from public.market_aggregate_observations t
  where t.source_id=any(sources) and (private.p08_ebay_erasure_row_terms(t.raw_payload,null::text,null::text) && terms);
  answer := answer || jsonb_build_object('market_aggregate_observations',rows);
  select coalesce(jsonb_agg(jsonb_build_object('id',t.id,'release_id',t.release_id,'condition',t.condition,'raw_payload',t.raw_payload,'version',t.xmin::text)),'[]')
  into rows from public.market_monthly_source_stats t
  where t.source_id=any(sources) and (private.p08_ebay_erasure_row_terms(t.raw_payload,null::text,null::text) && terms);
  answer := answer || jsonb_build_object('market_monthly_source_stats',rows);
  return answer;
end;
$$;
revoke all on function public.trackdash_plan_ebay_erasure(text[]) from public, anon, authenticated;
grant execute on function public.trackdash_plan_ebay_erasure(text[]) to service_role;

-- Atomic application of JS's exact redactions. All affected rows lock in a
-- deterministic order. An intervening writer causes a retriable rollback; never
-- overwrite a newer payload using a stale read. Duplicate already-applied
-- patches are harmless. Existing canonical recompute queue commits atomically.
create function public.trackdash_apply_ebay_erasure(p_changes jsonb)
returns jsonb language plpgsql security definer
set search_path = pg_catalog set lock_timeout = '2s'
as $$
declare
  item jsonb; current_row jsonb; current_version text; patch jsonb;
  tab text; allowed text[]; release_id uuid; cond text; assignment text;
  counts jsonb := '{"market_candidates":0,"market_offer_states":0,"price_points":0,"market_aggregate_observations":0,"market_monthly_source_stats":0}';
  affected jsonb := '{}';
begin
  if jsonb_typeof(p_changes) is distinct from 'array' then raise exception 'EBAY_ERASURE_ARGUMENTS'; end if;
  for item in select value from jsonb_array_elements(p_changes) order by value->>'table',value->>'id' loop
    tab := item->>'table'; patch := item->'patch';
    allowed := case tab
      when 'market_candidates' then array['seller_fingerprint','evidence_group_key','raw_payload']
      when 'market_offer_states' then array['seller_fingerprint']
      when 'price_points' then array['evidence_group_key','valuation_eligible','evidence_grade','quality_flags']
      when 'market_aggregate_observations' then array['raw_payload']
      when 'market_monthly_source_stats' then array['raw_payload']
    end;
    if allowed is null or jsonb_typeof(patch) is distinct from 'object'
       or exists(select 1 from jsonb_object_keys(patch) k where not(k=any(allowed))) then
      raise exception 'EBAY_ERASURE_ARGUMENTS';
    end if;
    execute format('select to_jsonb(t), t.xmin::text from public.%I t where id=$1 for update',tab)
      into current_row,current_version using (item->>'id')::uuid;
    if current_row is null then raise exception using errcode='PT409', message='EBAY_ERASURE_CONFLICT'; end if;
    if not exists(select 1 from jsonb_each(patch) e where current_row->e.key is distinct from e.value) then
      continue;
    end if;
    if current_version is distinct from item->>'version' then
      raise exception using errcode='PT409', message='EBAY_ERASURE_CONFLICT';
    end if;
    -- A point committed after planning must not escape because its parent is
    -- about to lose the only identifier. Parent FOR UPDATE fences FK inserts
    -- while this check and mutation run. A fresh retry replans all children.
    if tab='market_candidates' and exists(
      select 1 from public.price_points p where p.candidate_id=(item->>'id')::uuid
      and not exists(select 1 from jsonb_array_elements(p_changes) x
                     where x->>'table'='price_points' and x->>'id'=p.id::text)
    ) then
      raise exception using errcode='PT409',message='EBAY_ERASURE_CONFLICT';
    end if;
    -- Every row must still belong to eBay, including inactive/historical sources.
    if not exists(select 1 from public.market_source_policies where source_id=(current_row->>'source_id')::uuid and source_family='ebay')
       and not exists(select 1 from public.price_sources where id=(current_row->>'source_id')::uuid and slug like 'ebay_%') then
      raise exception 'EBAY_ERASURE_SOURCE_CHANGED';
    end if;
    select string_agg(format('%I=r.%I',k,k),',') into assignment from jsonb_object_keys(patch) k;
    if assignment is null then raise exception 'EBAY_ERASURE_ARGUMENTS'; end if;
    execute format('update public.%I t set %s,updated_at=clock_timestamp() from jsonb_populate_record(null::public.%I,$1) r where t.id=$2',tab,assignment,tab)
      using patch,(item->>'id')::uuid;
    counts := jsonb_set(counts,array[tab],to_jsonb((counts->>tab)::integer+1));
    release_id := coalesce(current_row->>'resolved_release_id',current_row->>'release_id')::uuid;
    cond := current_row->>'condition';
    if release_id is not null then
      perform public.trackdash_enqueue_market_recompute(release_id,cond);
      affected := affected || jsonb_build_object(release_id::text||'|'||cond,
                    jsonb_build_object('releaseId',release_id,'condition',cond,'recomputeDirtyAt',
                      (select q.dirty_at from public.market_recompute_queue q
                       where q.release_id=coalesce(current_row->>'resolved_release_id',current_row->>'release_id')::uuid
                         and q.condition=current_row->>'condition')));
    end if;
  end loop;
  return jsonb_build_object(
    'candidatesUpdated',counts->'market_candidates',
    'offersUpdated',counts->'market_offer_states',
    'pricePointsUpdated',counts->'price_points',
    'aggregatePayloadsUpdated',counts->'market_aggregate_observations',
    'monthlyPayloadsUpdated',counts->'market_monthly_source_stats',
    'affectedReleaseConditions',coalesce((select jsonb_agg(value) from jsonb_each(affected)),'[]'::jsonb));
exception when serialization_failure or deadlock_detected then
  -- PostgREST may automatically retry SQLSTATE 40001 inside the same HTTP
  -- request. A stale optimistic plan needs a NEW plan, never an internal loop.
  raise exception using errcode='PT409',message='EBAY_ERASURE_RETRY';
when others then
  -- No row DETAIL, original payload, parameters or provider error in app logs.
  raise exception using errcode=sqlstate,message='EBAY_ERASURE_FAILED';
end;
$$;
revoke all on function public.trackdash_apply_ebay_erasure(jsonb) from public, anon, authenticated;
grant execute on function public.trackdash_apply_ebay_erasure(jsonb) to service_role;
notify pgrst,'reload schema';
commit;
