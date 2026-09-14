-- Market Automation v1 pilot
--
-- Goals:
-- - make source diversification explicit and persistent;
-- - keep RCJAZ in every pilot Release scan even when the exact kit is sold out;
-- - keep eBay active vs Product Research in the same source family;
-- - require a non-eBay marketplace target (Mercari JP in v1);
-- - retain unavailable retail as context without letting it become current Market Value;
-- - provide a durable queue/locking layer for future automatic adapters.

create table if not exists public.market_source_policies (
  source_id uuid primary key references public.price_sources(id) on delete cascade,
  source_family text not null,
  scan_scope text not null,
  independent_key text not null,
  role text not null,
  include_by_default boolean not null default false,
  current_offer_capable boolean not null default false,
  completed_sale_capable boolean not null default false,
  unavailable_provides_context boolean not null default false,
  default_interval_hours integer not null,
  priority integer not null default 0,
  adapter_status text not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint market_source_policies_scope_check
    check (scan_scope in ('retail', 'active_marketplace', 'sold_research')),
  constraint market_source_policies_role_check
    check (role in ('structural_reference', 'primary_marketplace', 'secondary_marketplace', 'retail_reference', 'supporting_retail', 'internal_sales', 'other')),
  constraint market_source_policies_adapter_status_check
    check (adapter_status in ('ready', 'manual', 'planned', 'internal')),
  constraint market_source_policies_interval_check
    check (default_interval_hours >= 24)
);

create index if not exists idx_market_source_policies_scope_priority
  on public.market_source_policies(scan_scope, priority desc);

alter table public.market_source_policies enable row level security;

with policy_seed(
  slug, source_family, scan_scope, independent_key, role,
  include_by_default, current_offer_capable, completed_sale_capable,
  unavailable_provides_context, default_interval_hours, priority, adapter_status
) as (
  values
    ('rcjaz_public', 'retail:rcjaz_public', 'retail', 'retail:rcjaz_public', 'structural_reference', true, true, false, true, 168, 100, 'manual'),
    ('ebay_active_public', 'ebay', 'active_marketplace', 'marketplace:ebay', 'primary_marketplace', true, true, false, false, 72, 95, 'planned'),
    ('ebay_product_research', 'ebay', 'sold_research', 'marketplace:ebay', 'primary_marketplace', true, false, true, false, 336, 100, 'manual'),
    ('mercari_jp_public', 'mercari', 'active_marketplace', 'marketplace:mercari', 'secondary_marketplace', true, true, false, false, 72, 95, 'manual'),
    ('tamiya_shop_public', 'retail:tamiya_shop_public', 'retail', 'retail:tamiya_shop_public', 'retail_reference', true, true, false, true, 168, 90, 'manual'),
    ('joshin_public', 'retail:joshin_public', 'retail', 'retail:joshin_public', 'retail_reference', true, true, false, true, 168, 85, 'manual'),
    ('plamoya_public', 'retail:plamoya_public', 'retail', 'retail:plamoya_public', 'supporting_retail', true, true, false, true, 168, 75, 'manual'),
    ('pieroni_public', 'retail:pieroni_public', 'retail', 'retail:pieroni_public', 'supporting_retail', true, true, false, true, 168, 75, 'manual'),
    ('modellismo_gandolfi_public', 'retail:modellismo_gandolfi_public', 'retail', 'retail:modellismo_gandolfi_public', 'supporting_retail', false, true, false, true, 168, 60, 'manual'),
    ('briosi_public', 'retail:briosi_public', 'retail', 'retail:briosi_public', 'supporting_retail', false, true, false, true, 168, 60, 'manual'),
    ('akiba_hobby_public', 'retail:akiba_hobby_public', 'retail', 'retail:akiba_hobby_public', 'supporting_retail', false, true, false, true, 168, 60, 'manual'),
    ('manual_verified_sales', 'other:manual_verified_sales', 'sold_research', 'manual:verified_sales', 'other', false, false, true, false, 336, 50, 'manual'),
    ('trackdash_confirmed_sales', 'trackdash', 'sold_research', 'marketplace:trackdash', 'internal_sales', false, false, true, false, 24, 100, 'internal')
)
insert into public.market_source_policies (
  source_id, source_family, scan_scope, independent_key, role,
  include_by_default, current_offer_capable, completed_sale_capable,
  unavailable_provides_context, default_interval_hours, priority, adapter_status,
  updated_at
)
select
  ps.id, seed.source_family, seed.scan_scope, seed.independent_key, seed.role,
  seed.include_by_default, seed.current_offer_capable, seed.completed_sale_capable,
  seed.unavailable_provides_context, seed.default_interval_hours, seed.priority,
  seed.adapter_status, now()
from policy_seed seed
join public.price_sources ps on ps.slug = seed.slug
where ps.is_active
on conflict (source_id) do update set
  source_family = excluded.source_family,
  scan_scope = excluded.scan_scope,
  independent_key = excluded.independent_key,
  role = excluded.role,
  include_by_default = excluded.include_by_default,
  current_offer_capable = excluded.current_offer_capable,
  completed_sale_capable = excluded.completed_sale_capable,
  unavailable_provides_context = excluded.unavailable_provides_context,
  default_interval_hours = excluded.default_interval_hours,
  priority = excluded.priority,
  adapter_status = excluded.adapter_status,
  updated_at = now();

-- Pilot Releases deliberately cover liquid, sparse, old, reissue and same-item-number
-- special-edition cases. Business keys are used instead of generated UUID literals.
with pilot_releases as (
  select id
  from public.product_releases
  where
    (item_number = '95467' and release_year = 2019)
    or (item_number = '94717' and release_year = 2010)
    or (item_number = '95061' and release_year = 2015)
    or (item_number = '95525' and release_year = 2020)
    or (item_number = '18614' and release_year = 2006)
    or (item_number = '18074' and release_year in (2013, 2023))
    or (item_number = '95450' and release_year = 2019)
    or (item_number = '94708' and release_year = 2009)
    or (item_number = '18038' and release_year in (1992, 2007))
    or (item_number = '95335' and release_year = 2017)
), default_sources as (
  select source_id, default_interval_hours, priority, scan_scope
  from public.market_source_policies
  where include_by_default
    and role <> 'internal_sales'
)
insert into public.market_scan_targets (
  release_id, source_id, enabled, scan_interval_hours, priority,
  next_scan_at, consecutive_failures, updated_at
)
select
  pr.id, ds.source_id, true, ds.default_interval_hours, ds.priority,
  now(), 0, now()
from pilot_releases pr
cross join default_sources ds
on conflict (release_id, source_id) do update set
  enabled = true,
  scan_interval_hours = excluded.scan_interval_hours,
  priority = excluded.priority,
  updated_at = now();

with pilot_releases as (
  select id
  from public.product_releases
  where
    (item_number = '95467' and release_year = 2019)
    or (item_number = '94717' and release_year = 2010)
    or (item_number = '95061' and release_year = 2015)
    or (item_number = '95525' and release_year = 2020)
    or (item_number = '18614' and release_year = 2006)
    or (item_number = '18074' and release_year in (2013, 2023))
    or (item_number = '95450' and release_year = 2019)
    or (item_number = '94708' and release_year = 2009)
    or (item_number = '18038' and release_year in (1992, 2007))
    or (item_number = '95335' and release_year = 2017)
), default_sources as (
  select source_id, default_interval_hours, priority, scan_scope
  from public.market_source_policies
  where include_by_default
    and role <> 'internal_sales'
)
insert into public.market_scan_queue (
  release_id, source_id, scan_scope, enabled, activity_tier,
  scan_interval_hours, priority, next_scan_at, consecutive_failures, updated_at
)
select
  pr.id, ds.source_id, ds.scan_scope, true, 'normal',
  ds.default_interval_hours, ds.priority, now(), 0, now()
from pilot_releases pr
cross join default_sources ds
on conflict (release_id, source_id, scan_scope) do update set
  enabled = true,
  scan_interval_hours = excluded.scan_interval_hours,
  priority = excluded.priority,
  updated_at = now();

create or replace view public.market_scan_coverage_v1 as
select
  q.release_id,
  count(*) filter (where q.enabled) as enabled_target_count,
  count(distinct p.independent_key) filter (where q.enabled) as independent_source_count,
  bool_or(ps.slug = 'rcjaz_public' and q.enabled) as has_rcjaz,
  bool_or(ps.slug = 'ebay_active_public' and q.enabled) as has_ebay_active,
  bool_or(ps.slug = 'ebay_product_research' and q.enabled) as has_ebay_sold,
  bool_or(ps.slug = 'mercari_jp_public' and q.enabled) as has_non_ebay_marketplace,
  count(*) filter (where q.enabled and p.scan_scope = 'retail') as retail_target_count,
  count(*) filter (where q.enabled and p.completed_sale_capable) as completed_sale_target_count,
  case
    when
      bool_or(ps.slug = 'rcjaz_public' and q.enabled)
      and bool_or(ps.slug = 'ebay_active_public' and q.enabled)
      and bool_or(ps.slug = 'ebay_product_research' and q.enabled)
      and bool_or(ps.slug = 'mercari_jp_public' and q.enabled)
      and count(distinct p.independent_key) filter (where q.enabled) >= 4
      and count(*) filter (where q.enabled and p.scan_scope = 'retail') >= 2
    then 'strategic_coverage_ready'
    else 'needs_source_coverage'
  end as coverage_status
from public.market_scan_queue q
join public.market_source_policies p on p.source_id = q.source_id
join public.price_sources ps on ps.id = q.source_id
group by q.release_id;

-- Automatic workers claim only sources whose adapter is explicitly READY.
-- Manual/planned sources remain visible in the same queue but cannot accidentally
-- be executed as if an integration existed.
create or replace function public.trackdash_claim_market_scan_jobs(
  p_limit integer default 18,
  p_lock_minutes integer default 10
)
returns table (
  job_id uuid,
  release_id uuid,
  source_id uuid,
  source_slug text,
  scan_scope text,
  activity_tier text,
  priority integer,
  adapter_status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
begin
  return query
  with picked as (
    select q.id
    from public.market_scan_queue q
    join public.market_source_policies p on p.source_id = q.source_id
    where q.enabled
      and p.adapter_status = 'ready'
      and q.next_scan_at <= v_now
      and (q.locked_until is null or q.locked_until <= v_now)
    order by q.next_scan_at asc, q.priority desc, q.id
    limit greatest(1, least(coalesce(p_limit, 18), 50))
    for update of q skip locked
  ), locked as (
    update public.market_scan_queue q
    set locked_until = v_now + make_interval(mins => greatest(1, least(coalesce(p_lock_minutes, 10), 60))),
        last_attempt_at = v_now,
        updated_at = v_now
    from picked
    where q.id = picked.id
    returning q.*
  )
  select
    l.id,
    l.release_id,
    l.source_id,
    ps.slug,
    l.scan_scope,
    l.activity_tier,
    l.priority,
    p.adapter_status
  from locked l
  join public.price_sources ps on ps.id = l.source_id
  join public.market_source_policies p on p.source_id = l.source_id
  order by l.priority desc, l.next_scan_at asc;
end;
$$;

create or replace function public.trackdash_finish_market_scan_job(
  p_job_id uuid,
  p_success boolean,
  p_material_change boolean default false,
  p_error text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
begin
  if coalesce(p_success, false) then
    update public.market_scan_queue
    set last_success_at = v_now,
        last_material_change_at = case when coalesce(p_material_change, false) then v_now else last_material_change_at end,
        stable_since = case
          when coalesce(p_material_change, false) then v_now
          else coalesce(stable_since, v_now)
        end,
        activity_tier = case when coalesce(p_material_change, false) then 'hot' else activity_tier end,
        consecutive_failures = 0,
        last_error = null,
        locked_until = null,
        next_scan_at = v_now + make_interval(hours => scan_interval_hours),
        updated_at = v_now
    where id = p_job_id;
  else
    update public.market_scan_queue
    set consecutive_failures = consecutive_failures + 1,
        last_error = nullif(left(coalesce(p_error, 'scan failed'), 1000), ''),
        locked_until = null,
        next_scan_at = v_now + make_interval(
          hours => greatest(24, least(scan_interval_hours, (24 * power(2, least(consecutive_failures + 1, 3)))::integer))
        ),
        updated_at = v_now
    where id = p_job_id;
  end if;
end;
$$;

revoke all on function public.trackdash_claim_market_scan_jobs(integer, integer) from public;
revoke all on function public.trackdash_finish_market_scan_job(uuid, boolean, boolean, text) from public;

-- The restricted app role may invoke the safe queue functions, but it does not
-- get direct table writes. Internal workers can therefore claim/finish jobs
-- without exposing scanner tables to authenticated collectors.
grant execute on function public.trackdash_claim_market_scan_jobs(integer, integer) to trackdash_app;
grant execute on function public.trackdash_finish_market_scan_job(uuid, boolean, boolean, text) to trackdash_app;
