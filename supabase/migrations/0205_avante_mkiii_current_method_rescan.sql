-- Avante Mk.III current-method re-scan — 2026-10-01
--
-- Existing genealogy remains canonical at 24 public Releases.
-- This pass adds exact identifier/source evidence, documents unresolved image
-- gaps without borrowing sibling assets, and refreshes all unique-ITEM market
-- jobs under the post-Sep30 EU-first / persistent-trend engine.

begin;

-- ---------------------------------------------------------------------------
-- 1. Exact identifiers recovered during the current audit.
-- ---------------------------------------------------------------------------

update public.product_releases
set barcode_jan='4950344922079',
    updated_at=now()
where id='ee0c66c6-0d58-5ee5-ae20-942966da8129'::uuid
  and barcode_jan is null;

update public.product_releases
set barcode_jan='4950344922192',
    updated_at=now()
where id='5fdf8efd-46c1-5cff-9a61-6b8ee2b2b2af'::uuid
  and barcode_jan is null;

update public.product_releases
set barcode_jan='4950344922215',
    updated_at=now()
where id='f308c6fb-af67-5f03-b87b-7c3b947d9dfb'::uuid
  and barcode_jan is null;

update public.product_releases
set barcode_jan='4950344924707',
    updated_at=now()
where id='1c89e3ac-33c5-5079-98e7-7d7165c982d9'::uuid
  and barcode_jan is null;

insert into public.release_identifiers(
  id,release_id,scheme,value,market,is_primary,verification_status,source_url,checked_at
)
values
(gen_random_uuid(),'ee0c66c6-0d58-5ee5-ae20-942966da8129'::uuid,'JAN','4950344922079',null,true,'verified','https://www.ebay.com/p/5019258109','2026-10-01'),
(gen_random_uuid(),'5fdf8efd-46c1-5cff-9a61-6b8ee2b2b2af'::uuid,'JAN','4950344922192','JP',true,'verified','https://www.1999.co.jp/10109019','2026-10-01'),
(gen_random_uuid(),'f308c6fb-af67-5f03-b87b-7c3b947d9dfb'::uuid,'JAN','4950344922215','JP',true,'verified','https://www.1999.co.jp/10109025','2026-10-01'),
(gen_random_uuid(),'1c89e3ac-33c5-5079-98e7-7d7165c982d9'::uuid,'JAN','4950344924707',null,true,'verified','https://www.rcjaz.com/tamiya-92470-avante-mkiii-nero-tkmc-2026-special-132-scale-ms-chassis-mini-4wd-kit-p-46313.html','2026-10-01')
on conflict (release_id,scheme,value,market) do update set
  is_primary=true,
  verification_status='verified',
  source_url=excluded.source_url,
  checked_at=excluded.checked_at;

-- ---------------------------------------------------------------------------
-- 2. Exact/current source evidence.
-- ---------------------------------------------------------------------------

insert into public.release_sources(
  id,release_id,source_type,source_url,verified_fields,checked_at,notes
)
select gen_random_uuid(),v.release_id,v.source_type,v.source_url,v.verified_fields,'2026-10-01',v.notes
from (values
  ('ee0c66c6-0d58-5ee5-ae20-942966da8129'::uuid,'trusted_secondary','https://www.ebay.com/p/5019258109',
    array['itemNumber','barcodeJAN','editionName','releaseYear']::text[],
    'Exact eBay product identity maps ITEM 92207 to GTIN/JAN 4950344922079; used for identity only, not as SOLD/ASK valuation evidence.'),
  ('0a386324-1815-5d3e-addb-7e583d3489d6'::uuid,'trusted_secondary','https://www.tea-league.com/mt/tea/archives/2010/03/mkiii_special_ver.html',
    array['itemNumber','editionName','chassis','imageIdentity']::text[],
    'Contemporary exact-product coverage for the Evangelion Awakening release. Existing canonical release-date attribution is preserved while source-date differences remain documented.'),
  ('5fdf8efd-46c1-5cff-9a61-6b8ee2b2b2af'::uuid,'trusted_secondary','https://www.1999.co.jp/10109019',
    array['itemNumber','barcodeJAN','editionName','releaseYear','imageIdentity']::text[],
    'Exact HobbySearch product page confirms ITEM 92219, JAN 4950344922192, Tamiya manufacture and exact product imagery.'),
  ('f308c6fb-af67-5f03-b87b-7c3b947d9dfb'::uuid,'trusted_secondary','https://www.1999.co.jp/10109025',
    array['itemNumber','barcodeJAN','editionName','releaseYear','imageIdentity']::text[],
    'Exact HobbySearch product page confirms ITEM 92221, JAN 4950344922215, Tamiya manufacture and exact product imagery.'),
  ('805c2619-0c0c-5aa1-adc5-df25cafe5c8f'::uuid,'trusted_secondary','https://www.asiatees.com/display?id=104128',
    array['itemNumber','editionName','chassis','imageIdentity']::text[],
    'Exact AsiaTees ITEM 92284 page confirms the STARGEK 10th Anniversary Special, MA chassis and exact product imagery.'),
  ('805c2619-0c0c-5aa1-adc5-df25cafe5c8f'::uuid,'trusted_secondary','https://www.tea-league.com/mt/tea/archives/2014/11/mkiii_stargek10th_anniversary.html',
    array['itemNumber','editionName','chassis','color','imageIdentity']::text[],
    'Contemporary owner/report page documents ITEM 92284, STARGEK packaging, smoke body and MA chassis.'),
  ('1c89e3ac-33c5-5079-98e7-7d7165c982d9'::uuid,'official_manufacturer','https://pf.kakao.com/_xbXxcxkj/113813574',
    array['itemNumber','releaseDate','releaseYear','editionName','chassis','productionStatus']::text[],
    'Official Tamiya Korea announcement confirms ITEM 92470, nationwide release 2026-07-04, Korea-exclusive identity and active/current launch.'),
  ('1c89e3ac-33c5-5079-98e7-7d7165c982d9'::uuid,'trusted_secondary','https://www.rcjaz.com/tamiya-92470-avante-mkiii-nero-tkmc-2026-special-132-scale-ms-chassis-mini-4wd-kit-p-46313.html',
    array['itemNumber','barcodeJAN','editionName','chassis','imageIdentity','marketAvailability']::text[],
    'Exact retailer page confirms ITEM 92470, GTIN/JAN 4950344924707, MS chassis, exact imagery and current stock context.')
) as v(release_id,source_type,source_url,verified_fields,notes)
where not exists (
  select 1 from public.release_sources s
  where s.release_id=v.release_id and s.source_url=v.source_url
);

update public.release_sources s
set checked_at='2026-10-01'
where s.release_id in (
  select id from public.product_releases
  where product_id='de719716-e50a-5811-b99d-18bbb153b166'::uuid
)
and s.source_url in (
  'https://www.tamiya.com/japan/products/18626/index.html',
  'https://www.tamiya.com/japan/products/18627/index.html',
  'https://www.tamiya.com/japan/products/95087/index.html',
  'https://www.tamiya.com/japan/products/95425/index.html',
  'https://www.tamiya.com/japan/products/95464/index.html',
  'https://www.tamiya.com/japan/products/95469/index.html',
  'https://www.tamiya.com/japan/products/18662/index.html',
  'https://pf.kakao.com/_xbXxcxkj/113813574'
);

-- ---------------------------------------------------------------------------
-- 3. Status / production-wave / image-gap audit notes.
-- ---------------------------------------------------------------------------

update public.product_releases
set status_checked_at=now(),
    updated_at=now()
where product_id='de719716-e50a-5811-b99d-18bbb153b166'::uuid;

update public.product_releases
set notes=case
  when coalesce(notes,'') like '%TrackDash current-method re-scan 2026-10-01: ITEM 95464%' then notes
  else concat_ws(' ',nullif(notes,''),
    'TrackDash current-method re-scan 2026-10-01: ITEM 95464 remains one collector Release. Official Tamiya current handling documents a later 2023-11-11 production/on-sale wave under the same ITEM/specification; no physical discriminator supports creating another Release.')
  end,
  updated_at=now()
where id='cc1fb7fa-67db-5303-9514-80b9705fe732'::uuid;

update public.product_releases
set notes=case
  when coalesce(notes,'') like '%Image challenge 2026-10-01:%' then notes
  else concat_ws(' ',nullif(notes,''),
    'Image challenge 2026-10-01: exact product imagery was located on release-specific source pages, but no stable direct asset URL has yet been persisted. Keep the honest placeholder rather than storing a webpage URL or borrowing a sibling image.')
  end,
  updated_at=now()
where id in (
  'ee0c66c6-0d58-5ee5-ae20-942966da8129'::uuid,
  '0a386324-1815-5d3e-addb-7e583d3489d6'::uuid,
  '5fdf8efd-46c1-5cff-9a61-6b8ee2b2b2af'::uuid,
  'f308c6fb-af67-5f03-b87b-7c3b947d9dfb'::uuid,
  '805c2619-0c0c-5aa1-adc5-df25cafe5c8f'::uuid,
  '1c89e3ac-33c5-5079-98e7-7d7165c982d9'::uuid
);

update public.product_releases
set notes=case
  when coalesce(notes,'') like '%Market challenge 2026-10-01: exact ITEM 92219 + 92221%' then notes
  else concat_ws(' ',nullif(notes,''),
    'Market challenge 2026-10-01: exact ITEM 92219 + 92221 two-car Mercari evidence is a multi-Release lot. It proves market/identity context but its total JPY 22,000 price must never be split into invented single-Release values.')
  end,
  updated_at=now()
where id in (
  '5fdf8efd-46c1-5cff-9a61-6b8ee2b2b2af'::uuid,
  'f308c6fb-af67-5f03-b87b-7c3b947d9dfb'::uuid
);

update public.product_releases
set notes=case
  when coalesce(notes,'') like '%Market challenge 2026-10-01: exact ITEM 92284%' then notes
  else concat_ws(' ',nullif(notes,''),
    'Market challenge 2026-10-01: exact ITEM 92284 Mercari SOLD-state evidence exists, but the completed date is not exposed; it remains identity/market context and is not promoted to a dated SOLD valuation point.')
  end,
  updated_at=now()
where id='805c2619-0c0c-5aa1-adc5-df25cafe5c8f'::uuid;

-- ---------------------------------------------------------------------------
-- 4. Current-method queue refresh.
-- ---------------------------------------------------------------------------

select public.trackdash_enroll_release_market_scans(r.id)
from public.product_releases r
where r.product_id='de719716-e50a-5811-b99d-18bbb153b166'::uuid;

select public.trackdash_enqueue_market_recompute(r.id,'new_complete_unbuilt')
from public.product_releases r
where r.product_id='de719716-e50a-5811-b99d-18bbb153b166'::uuid;

update public.market_recompute_queue q
set dirty_at='2000-01-08 00:00:00+00',
    available_at='2000-01-08 00:00:00+00',
    locked_until=null,
    attempts=0,
    last_error=null,
    updated_at=now()
where q.release_id in (
  select id from public.product_releases
  where product_id='de719716-e50a-5811-b99d-18bbb153b166'::uuid
)
and q.condition='new_complete_unbuilt';

-- Every Avante Mk.III Item Number is globally unique in the current catalog,
-- so all 24 exact-item eBay jobs are safe to refresh unattended.
update public.market_scan_queue q
set enabled=true,
    priority=180,
    next_scan_at='2000-01-08 00:00:00+00',
    locked_until=null,
    consecutive_failures=0,
    last_error=null,
    updated_at=now()
where q.release_id in (
  select id from public.product_releases
  where product_id='de719716-e50a-5811-b99d-18bbb153b166'::uuid
)
and q.source_id=(select id from public.price_sources where slug='ebay_active_public')
and q.scan_scope='active_marketplace';

commit;
