-- Catalog Foundation final guardrail metadata.
-- Earlier evidence-backed production_status values were missing the date on
-- which that status was checked. Keep repo/runtime and production DB aligned.

update public.product_releases
set status_checked_at = date '2026-09-07', updated_at = now()
where id in (
  'cafbb6ca-1aba-5732-946d-0045d054aa5c',
  '7f3f7461-0dee-5d6a-b99d-36e2d910f0ef',
  'df8815eb-fd68-54ba-a908-e4fecbe9b5cf',
  'c680423c-a5eb-564c-afa6-953a105e9310',
  '91bcff13-76b4-5a09-a83b-1cfb85400b40',
  '8c08137b-cfc6-5c1d-8d1b-a151d53afc01',
  'd0e6d2fc-3566-5004-a479-52f89253863b',
  'e96a1769-9b91-55b8-84c4-697799d0b441'
);
