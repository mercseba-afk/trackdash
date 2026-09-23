-- HCJ81 verified secondary identifier.
--
-- Mattel's 2022 Hot Wheels catalog prints the UPC-A as:
--   1 94735 01163 6
-- normalized here as:
--   194735011636
--
-- This is the same commercial Release as Mattel toy number HCJ81.
-- It is NOT a new Release and NOT a Subvariant.

insert into public.release_identifiers (
  release_id,
  scheme,
  value,
  market,
  is_primary,
  verification_status,
  source_url,
  checked_at
) values (
  'f16ed92f-34fb-5fd6-bd8b-c26ff3e831ee',
  'upc_a',
  '194735011636',
  null,
  false,
  'verified',
  'https://mattel.co.jp/wp-content/uploads/2022/08/%E3%83%9B%E3%83%83%E3%83%88%E3%82%A6%E3%82%A3%E3%83%BC%E3%83%AB_22fall.pdf',
  '2026-09-23'
)
on conflict (release_id, scheme, value, market)
do update set
  is_primary = excluded.is_primary,
  verification_status = excluded.verification_status,
  source_url = excluded.source_url,
  checked_at = excluded.checked_at;
