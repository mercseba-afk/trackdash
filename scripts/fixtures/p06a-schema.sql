DO $$ begin
 if not exists(select 1 from pg_roles where rolname='service_role') then create role service_role nologin bypassrls; end if;
 if not exists(select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
 if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
end $$;
grant usage on schema public to service_role,anon,authenticated;
create table public.product_releases(id uuid primary key);
create table public.price_sources(id uuid primary key,slug text,is_active boolean);
create table public.market_source_policies(source_id uuid primary key,source_family text);
create table public.market_candidates(id uuid primary key,source_id uuid,resolved_release_id uuid,condition text,seller_fingerprint text,evidence_group_key text,raw_payload jsonb,updated_at timestamptz);
create table public.market_offer_states(id uuid primary key,source_id uuid,release_id uuid,condition text,seller_fingerprint text,updated_at timestamptz);
create table public.price_points(id uuid primary key,source_id uuid,candidate_id uuid,release_id uuid,condition text,evidence_group_key text,quality_flags text[] not null default '{}',valuation_eligible boolean,evidence_grade text,updated_at timestamptz);
create table public.market_aggregate_observations(id uuid primary key,source_id uuid,raw_payload jsonb,updated_at timestamptz);
create table public.market_monthly_source_stats(id uuid primary key,source_id uuid,raw_payload jsonb,updated_at timestamptz);
create table public.market_release_signals(release_id uuid,condition text,market_value_eur numeric,primary key(release_id,condition));
create table public.market_release_monthly_signals(release_id uuid,condition text,month date,market_value_eur numeric,primary key(release_id,condition,month));
create table public.market_release_ask_snapshots(release_id uuid,condition text,snapshot_date date,typical_eur numeric,primary key(release_id,condition,snapshot_date));
grant select,insert,update on all tables in schema public to service_role;
