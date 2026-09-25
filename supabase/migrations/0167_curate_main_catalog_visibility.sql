-- Curate the main Mini 4WD catalog without deleting archived families.
-- 2026-09-25
--
-- The main catalog should focus on historically recognizable collector families.
-- These modern Racing Mini 4WD families remain fully preserved in the database
-- and reachable by direct URL, but are temporarily removed from the main catalog
-- listing until they receive a dedicated TrackDash identity/market audit.

begin;

update public.products
set metadata = coalesce(metadata,'{}'::jsonb) || jsonb_build_object(
  'catalog_visibility','archived',
  'catalog_visibility_reason','deprioritized_modern_racing_2026-09-25',
  'catalog_visibility_updated_at','2026-09-25'
),
updated_at=now()
where id in (
  '51deac9c-f8a7-5eff-984f-968d6ad88659'::uuid, -- Festa Jaune
  'b972592b-ce68-5f39-b3a1-cdc8984d3817'::uuid, -- Trigale
  'c7a440cc-dc07-5ecc-bae3-c2770dc8b66e'::uuid, -- Raikiri
  'd341ec22-c1f9-5a03-906d-444f8eee5401'::uuid, -- DCR-01
  '68acb096-f01b-55b2-949b-a959279a2fa5'::uuid, -- Geo Glider
  '5b415a05-bc7c-589c-8b9c-3b3806479f6b'::uuid, -- Mach-Bullet
  'e2f47ba4-03f1-5adb-8252-471c76729292'::uuid, -- Copperfang
  '6d6174e7-4040-5035-a3a4-cede97265d38'::uuid  -- Dyipne
);

-- Correct family-level official series labels discovered during the curation audit.
update public.products
set series = case name
  when 'Festa Jaune' then 'Mini 4WD PRO'
  when 'Trigale' then 'Mini 4WD PRO'
  when 'Raikiri' then 'Mini 4WD PRO'
  when 'DCR-01' then 'Mini 4WD PRO'
  when 'Geo Glider' then 'Mini 4WD REV'
  when 'Copperfang' then 'Mini 4WD REV'
  when 'Dyipne' then 'Mini 4WD REV'
  when 'Mach-Bullet' then 'Racing Mini 4WD'
  else series
end,
updated_at=now()
where name in (
  'Festa Jaune','Trigale','Raikiri','DCR-01',
  'Geo Glider','Copperfang','Dyipne','Mach-Bullet'
);

commit;
