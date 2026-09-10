-- Keep ambiguous Product Research evidence for item 95464 attached only to the
-- two actual 95464 occurrences (2018 + 2023). The 2010 Azure Clear release is
-- item 94741 and must not remain in the possible-release pool after catalog fix.

with ids as (
  select
    (select id from public.product_releases where item_number='94741' and release_year=2010) as rel_94741,
    (select id from public.product_releases where item_number='95464' and release_year=2018) as rel_2018,
    (select id from public.product_releases where item_number='95464' and release_year=2023) as rel_2023
)
update public.market_aggregate_observations mao
set possible_release_ids = array[ids.rel_2018, ids.rel_2023]::uuid[],
    updated_at = now(),
    raw_payload = coalesce(mao.raw_payload, '{}'::jsonb) || jsonb_build_object(
      'release_ref_fix','2026-09-10',
      'note','95464 item-pool evidence belongs to the 2018 and 2023 95464 occurrences; 94741/2010 is a different item code.'
    )
from ids
where mao.item_number='95464'
  and mao.attribution_status='item_pool'
  and ids.rel_94741 = any(mao.possible_release_ids);