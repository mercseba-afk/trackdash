-- Conservative production-status correction for Dash-1 Emperor.
-- A surviving product page or TAMIYA TOKYO handling note does not by itself
-- prove that the exact historical release is still in production.
-- Keep 95110 and 95622 unknown until an explicit current production/sale
-- signal comparable to 18069 / 18625 / 18025 (2026) is verified.

update public.product_releases
set production_status = 'unknown',
    status_checked_at = null,
    updated_at = now()
where id in (
  'b7eeb76a-e117-59ae-b31c-b099368421af', -- 95110 (2018)
  '2b202422-17d3-5800-9c10-e33541d67e10'  -- 95622 (2021)
);

update public.release_sources
set verified_fields = array_remove(verified_fields, 'productionStatus')
where release_id in (
  'b7eeb76a-e117-59ae-b31c-b099368421af',
  '2b202422-17d3-5800-9c10-e33541d67e10'
)
  and checked_at = date '2026-09-09';
