-- Europe-first market refresh policy.
-- Mini 4WD is generally a low-turnover market: the daily cron remains a
-- dispatcher, while each Release/source is refreshed only when actually due.

update public.market_source_policies
set default_interval_hours = case
  when scan_scope = 'active_marketplace' then 168
  when scan_scope = 'retail' then 336
  when scan_scope = 'sold_research' and role <> 'internal_sales' then 720
  else default_interval_hours
end
where scan_scope in ('active_marketplace','retail','sold_research');

update public.market_scan_queue
set scan_interval_hours = case
  when scan_scope = 'active_marketplace' and activity_tier = 'hot' then 72
  when scan_scope = 'active_marketplace' and activity_tier = 'normal' then 168
  when scan_scope = 'active_marketplace' and activity_tier = 'cold' then 336
  when scan_scope = 'retail' and activity_tier = 'hot' then 168
  when scan_scope = 'retail' and activity_tier = 'normal' then 336
  when scan_scope = 'retail' and activity_tier = 'cold' then 720
  when scan_scope = 'sold_research' and activity_tier = 'hot' then 336
  when scan_scope = 'sold_research' and activity_tier = 'normal' then 720
  when scan_scope = 'sold_research' and activity_tier = 'cold' then 1440
  else scan_interval_hours
end,
updated_at = now();

update public.market_scan_targets t
set scan_interval_hours = p.default_interval_hours,
    updated_at = now()
from public.market_source_policies p
where p.source_id = t.source_id
  and p.role <> 'internal_sales';

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
  v_scope text;
  v_current_tier text;
  v_new_tier text;
  v_stable_since timestamptz;
  v_interval_hours integer;
begin
  select scan_scope, activity_tier, stable_since
    into v_scope, v_current_tier, v_stable_since
  from public.market_scan_queue
  where id = p_job_id;

  if not found then
    return;
  end if;

  if coalesce(p_success, false) then
    if coalesce(p_material_change, false) then
      v_new_tier := 'hot';
      v_stable_since := v_now;
    else
      v_stable_since := coalesce(v_stable_since, v_now);
      if v_stable_since <= v_now - interval '60 days' then
        v_new_tier := 'cold';
      elsif v_current_tier = 'hot'
        and v_stable_since <= v_now - interval '14 days' then
        v_new_tier := 'normal';
      else
        v_new_tier := coalesce(v_current_tier, 'normal');
      end if;
    end if;

    v_interval_hours := case
      when v_scope = 'active_marketplace' and v_new_tier = 'hot' then 72
      when v_scope = 'active_marketplace' and v_new_tier = 'normal' then 168
      when v_scope = 'active_marketplace' and v_new_tier = 'cold' then 336
      when v_scope = 'retail' and v_new_tier = 'hot' then 168
      when v_scope = 'retail' and v_new_tier = 'normal' then 336
      when v_scope = 'retail' and v_new_tier = 'cold' then 720
      when v_scope = 'sold_research' and v_new_tier = 'hot' then 336
      when v_scope = 'sold_research' and v_new_tier = 'normal' then 720
      when v_scope = 'sold_research' and v_new_tier = 'cold' then 1440
      else 336
    end;

    update public.market_scan_queue
    set last_success_at = v_now,
        last_material_change_at = case when coalesce(p_material_change, false) then v_now else last_material_change_at end,
        stable_since = v_stable_since,
        activity_tier = v_new_tier,
        scan_interval_hours = v_interval_hours,
        consecutive_failures = 0,
        last_error = null,
        locked_until = null,
        next_scan_at = v_now + make_interval(hours => v_interval_hours),
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

revoke all on function public.trackdash_finish_market_scan_job(uuid, boolean, boolean, text) from public;
grant execute on function public.trackdash_finish_market_scan_job(uuid, boolean, boolean, text) to service_role;
