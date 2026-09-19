-- Backfill Market Method v4 metadata and current ASK intelligence for the
-- Releases already analysed during the first Price Intelligence rollout.
--
-- Sold-based Market Values are preserved: they were already valid under the
-- v4 publication policy (95450/95467 were explicitly recalculated when v4
-- shipped). This migration refreshes the current offer representatives,
-- starting offer, ASK typical/range/count and initial ASK snapshot so all of
-- these Releases continue from one coherent v4 baseline.

with target_releases as (
  select id
  from public.product_releases
  where item_number in (
    '18038','18069','18074','18614','94708','94717',
    '95061','95335','95450','95467','95525'
  )
),
current_base as (
  select
    mos.release_id,
    mos.source_id,
    mos.channel,
    mos.candidate_id,
    mos.item_price_eur::numeric as item_price_eur,
    mos.shipping_eur::numeric as shipping_eur,
    coalesce(ps.market_region, 'global') as market_region,
    case
      when mos.channel = 'retail'
        then coalesce(nullif(ps.merchant_key,''), 'source:' || mos.source_id::text)
      else mos.source_id::text || '|' ||
        coalesce(nullif(mos.seller_fingerprint,''), 'candidate:' || mos.candidate_id::text)
    end as economic_key,
    bool_or(mos.shipping_eur is not null) over (
      partition by mos.release_id, mos.channel,
      case
        when mos.channel = 'retail'
          then coalesce(nullif(ps.merchant_key,''), 'source:' || mos.source_id::text)
        else mos.source_id::text || '|' ||
          coalesce(nullif(mos.seller_fingerprint,''), 'candidate:' || mos.candidate_id::text)
      end
    ) as group_has_delivered
  from public.market_offer_states mos
  join public.market_candidates mc on mc.id = mos.candidate_id
  join public.price_sources ps on ps.id = mos.source_id
  where mos.release_id in (select id from target_releases)
    and mos.condition = 'new_complete_unbuilt'
    and mos.availability in ('in_stock','low_stock')
    and mc.decision = 'accepted'
    and mos.item_price_eur > 0
),
ranked as (
  select *,
    row_number() over (
      partition by release_id, channel, economic_key
      order by
        case
          when group_has_delivered then
            case
              when shipping_eur is not null then item_price_eur + shipping_eur
              else 999999999::numeric
            end
          else item_price_eur
        end asc,
        candidate_id
    ) as rn
  from current_base
),
reps as (
  select
    release_id, source_id, channel, candidate_id,
    item_price_eur, shipping_eur, market_region
  from ranked
  where rn = 1
),
retail_region as (
  select
    release_id,
    market_region,
    percentile_cont(0.5) within group (order by item_price_eur)::numeric as region_anchor
  from reps
  where channel = 'retail'
  group by release_id, market_region
),
retail_stats as (
  select
    release_id,
    count(*)::int as region_count,
    round(percentile_cont(0.5) within group (order by region_anchor)::numeric, 2) as retail_anchor,
    case
      when count(*) >= 2 and min(region_anchor) > 0
        then round((max(region_anchor) / min(region_anchor))::numeric, 2)
      else null
    end as regional_spread_ratio
  from retail_region
  group by release_id
),
active_reps as (
  select release_id, item_price_eur
  from reps
  where channel = 'marketplace'
),
active_raw_stats as (
  select
    release_id,
    count(*)::int as rep_count,
    percentile_cont(0.25) within group (order by item_price_eur)::numeric as q1,
    percentile_cont(0.5) within group (order by item_price_eur)::numeric as med,
    percentile_cont(0.75) within group (order by item_price_eur)::numeric as q3
  from active_reps
  group by release_id
),
active_marked as (
  select
    r.release_id,
    r.item_price_eur,
    s.rep_count, s.q1, s.med, s.q3,
    case
      when s.rep_count = 3
        then r.item_price_eur between s.med * 0.5 and s.med * 2
      when s.rep_count >= 4 and s.q3 > s.q1
        then r.item_price_eur between
          greatest(0, s.q1 - 1.5 * (s.q3 - s.q1))
          and s.q3 + 1.5 * (s.q3 - s.q1)
      else true
    end as in_bound
  from active_reps r
  join active_raw_stats s using (release_id)
),
active_bound_counts as (
  select release_id, count(*) filter (where in_bound)::int as bounded_count
  from active_marked
  group by release_id
),
active_stats as (
  select
    m.release_id,
    max(m.rep_count)::int as offer_count,
    round(percentile_cont(0.5) within group (order by m.item_price_eur)::numeric, 2) as typical_eur,
    round(min(m.item_price_eur), 2) as low_eur,
    round(max(m.item_price_eur), 2) as high_eur
  from active_marked m
  join active_bound_counts b using (release_id)
  where case when b.bounded_count >= 2 then m.in_bound else true end
  group by m.release_id
),
offer_counts as (
  select
    release_id,
    count(*)::int as current_offer_count,
    count(*) filter (where channel = 'retail')::int as retail_source_count,
    count(*) filter (where shipping_eur is not null)::int as shipping_known_count
  from reps
  group by release_id
),
starting_ranked as (
  select
    r.*,
    row_number() over (
      partition by release_id
      order by
        item_price_eur asc,
        coalesce(item_price_eur + shipping_eur, 999999999::numeric) asc,
        candidate_id
    ) as rn
  from reps r
),
starting as (
  select
    release_id,
    candidate_id,
    item_price_eur,
    shipping_eur,
    case when shipping_eur is null then null else item_price_eur + shipping_eur end as effective_cost_eur,
    case when shipping_eur is null then 'item_only' else 'delivered' end as cost_basis
  from starting_ranked
  where rn = 1
),
all_target as (
  select tr.id as release_id
  from target_releases tr
)
update public.market_release_signals s
set
  retail_anchor_eur = rs.retail_anchor,
  active_anchor_eur = ast.typical_eur,
  active_low_eur = ast.low_eur,
  active_high_eur = ast.high_eur,
  starting_offer_candidate_id = st.candidate_id,
  starting_item_price_eur = st.item_price_eur,
  starting_shipping_eur = st.shipping_eur,
  starting_effective_cost_eur = st.effective_cost_eur,
  starting_cost_basis = st.cost_basis,
  retail_source_count = coalesce(oc.retail_source_count, 0),
  active_offer_count = coalesce(ast.offer_count, 0),
  current_offer_count = coalesce(oc.current_offer_count, 0),
  retail_region_count = coalesce(rs.region_count, 0),
  retail_regional_spread_ratio = rs.regional_spread_ratio,
  shipping_known_ratio = case
    when coalesce(oc.current_offer_count, 0) > 0
      then round((coalesce(oc.shipping_known_count,0)::numeric / oc.current_offer_count::numeric), 4)
    else 0
  end,
  market_regime = case
    when coalesce(oc.retail_source_count, 0) >= 2 then 'retail_driven'
    when coalesce(oc.retail_source_count, 0) = 1 then
      case
        when ast.typical_eur is not null or s.sold_anchor_eur is not null then 'mixed_scarce'
        else 'retail_driven'
      end
    when ast.typical_eur is not null or s.sold_anchor_eur is not null then 'secondary_market_driven'
    else 'insufficient'
  end,
  market_method_version = 'v4',
  ask_trend_percent = null,
  ask_trend_window_days = null,
  computed_at = now()
from all_target t
left join retail_stats rs on rs.release_id = t.release_id
left join active_stats ast on ast.release_id = t.release_id
left join offer_counts oc on oc.release_id = t.release_id
left join starting st on st.release_id = t.release_id
where s.release_id = t.release_id
  and s.condition = 'new_complete_unbuilt';

insert into public.market_release_ask_snapshots (
  release_id, condition, snapshot_date,
  typical_eur, low_eur, high_eur, offer_count, computed_at
)
select
  s.release_id,
  s.condition,
  current_date,
  s.active_anchor_eur,
  s.active_low_eur,
  s.active_high_eur,
  s.active_offer_count,
  now()
from public.market_release_signals s
where s.release_id in (select id from target_releases)
  and s.condition = 'new_complete_unbuilt'
  and s.active_anchor_eur is not null
  and s.active_offer_count > 0
on conflict (release_id, condition, snapshot_date)
do update set
  typical_eur = excluded.typical_eur,
  low_eur = excluded.low_eur,
  high_eur = excluded.high_eur,
  offer_count = excluded.offer_count,
  computed_at = excluded.computed_at;
