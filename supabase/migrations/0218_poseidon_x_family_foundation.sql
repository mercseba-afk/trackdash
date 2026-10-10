-- Poseidon-X historical family foundation — 2026-10-10
-- Stage ONLY. Never set launch_status='available' in this migration.
-- Complete Mini 4WD kits: ITEM 94584 Black Special 1993 original and 2006 reissue.
-- Distinct accessories excluded from product_releases:
-- 94076 original body parts (1993), 94817 silver plated body (2011),
-- 94804 Super II reinforcement/body component set (2011).
-- 94583 is a multi-kit Memorial Box, not a standalone Poseidon-X kit.
-- No fabricated market candidates, SOLD, ASK, Market Value or image URL.
-- Stable RFC4122 UUIDv5(URL) keys:
--   product:poseidon-x-94584
--   release:poseidon-x-94584:black-special-1993
--   release:poseidon-x-94584:black-special-2006

begin;

insert into public.products (
  id, category_id, brand_id, slug, name, japanese_name, series,
  description, description_it, metadata
) values (
  'e8a13fb8-4af2-5f5f-936e-8871d9567289',
  'cd755fcb-2bc5-5975-8ec0-f45e7df891cc',
  '382feca9-48e9-5144-a92d-41f77fb7e438',
  'poseidon-x-94584',
  'Poseidon-X','ポセイドンX','Super Mini 4WD',
  'Poseidon-X originated as a body-parts-only event item in 1993. The complete Super-1 Mini 4WD kit was the Black Special, originally released in 1993 and reissued in 2006.',
  'Poseidon-X nasce nel 1993 come set di carrozzeria distribuito agli eventi. Il kit Mini 4WD completo è la Black Special su Super 1, proposta nel 1993 e ristampata nel 2006.',
  jsonb_build_object(
    'launch_status','coming_soon',
    'launch_status_updated_at','2026-10-10',
    'launch_strategy','progressive_public_catalog_v1',
    'family_audit',jsonb_build_object(
      'checked_at','2026-10-10',
      'status','staged_not_complete',
      'kit_release_count',2,
      'non_kit_related_items',jsonb_build_array(
        jsonb_build_object('item_number','94076','name','Poseidon-X Body Parts Set','year',1993,'classification','accessory'),
        jsonb_build_object('item_number','94583','name','Super Mini 4WD Memorial Box Vol. 1','year',2006,'classification','multi-kit-box'),
        jsonb_build_object('item_number','94817','name','Poseidon-X Silver Plated Body Set','year',2011,'classification','accessory'),
        jsonb_build_object('item_number','94804','name','Super II Chassis FRP Reinforcement Set','year',2011,'classification','component-set')
      ),
      'image_gaps',2,
      'market_status','initial_scan_pending'
    )
  )
)
on conflict (id) do nothing;

insert into public.product_releases (
  id,product_id,item_number,release_type,edition_name,release_year,
  chassis,barcode_jan,color,country_market,msrp_jpy,
  notes,discontinued,is_original,rarity,data_source,edition_type,
  verification_status,production_status,status_checked_at,
  description,description_it,catalog_visibility,catalog_visibility_reason,
  catalog_visibility_updated_at
) values
(
  '936ac729-f26b-5a21-bec1-f2620b93c5c4',
  'e8a13fb8-4af2-5f5f-936e-8871d9567289',
  '94584','Original','Poseidon-X Black Special (1993 Original)',1993,
  'Super 1',null,'Black / silver accents','Japan',600,
  '1993 Black Special complete chassis kit, distinct from the earlier 94076 body-only product. November 1993 supported; exact day and original JAN unverified. The 2006 JAN 4950344945849 MUST NOT be assigned to this generation. Exact original-generation photograph and credible attributable modern market evidence remain missing; research_only until the publication gate is passed.',
  true,true,null,'poseidon_x_master_audit_20261010','original',
  'verified','discontinued',now(),
  'Original 1993 Poseidon-X Black Special complete assembly kit on Super 1. Not the original body-only event set.',
  'Kit completo Poseidon-X Black Special del 1993 su Super 1, distinto dal set di sola carrozzeria.',
  'research_only','exact_1993_image_and_market_evidence_pending',now()
),
(
  'c37d4161-aa31-535b-b1de-9040730a4cdd',
  'e8a13fb8-4af2-5f5f-936e-8871d9567289',
  '94584','Reissue','Poseidon-X Black Special (2006 Reissue)',2006,
  'Super 1','4950344945849','Black / silver accents','Japan',900,
  'Reissue confirmed by contemporary December 2006 reporting, contemporary Tamiya specification reproduced by RC Station and HLJ exact JAN. HLJ catalog dates 2006-12-14; contemporary public announcement says around 2006-12-16: store no unqualified day. Historical HLJ retail is discontinued/out of stock, NOT an active ASK. Exact edition-specific photo and current Europe-delivered market scan pending.',
  true,false,null,'poseidon_x_master_audit_20261010','reissue',
  'verified','discontinued',now(),
  '2006 commercial reissue of the 1993 Black Special Super 1 kit, distinguishable by its documented 2006 JAN.',
  'Ristampa commerciale del 2006 della Black Special su Super 1, identificata dal JAN specifico.',
  'public','exact_historical_hlj_retail_provenance_no_current_value',now()
)
on conflict (id) do nothing;

-- Canonical family compatibility fields are derived by the DB trigger from the 1993 kit.
update public.products
set canonical_release_id='936ac729-f26b-5a21-bec1-f2620b93c5c4',
    updated_at=now()
where id='e8a13fb8-4af2-5f5f-936e-8871d9567289'
  and canonical_release_id is distinct from '936ac729-f26b-5a21-bec1-f2620b93c5c4'::uuid;

insert into public.release_identifiers (
  id,release_id,scheme,value,market,is_primary,verification_status,source_url,checked_at
) values (
  gen_random_uuid(),
  'c37d4161-aa31-535b-b1de-9040730a4cdd',
  'JAN','4950344945849','JP',true,'verified',
  'https://www.hlj.com/poseidon-black-special-tam94584','2026-10-10'
)
on conflict (release_id,scheme,value,market) do update
set verification_status='verified',
    source_url=excluded.source_url,
    checked_at=excluded.checked_at;

-- Field-level provenance, never shared without evidence between generations.
insert into public.release_sources (
  id,release_id,source_type,source_url,verified_fields,checked_at,notes
)
select gen_random_uuid(),v.release_id::uuid,v.source_type,v.source_url,v.fields,'2026-10-10',v.notes
from (values
 ('936ac729-f26b-5a21-bec1-f2620b93c5c4','trusted_secondary',
  'https://corocoro-news.jp/special/331657/',
  array['releaseYear','editionName']::text[],
  'Official CoroCoro publisher historical retrospective verifies the 1993 Poseidon-X origin as an event-only BODY SET, excluding that item from complete kits.'),
 ('936ac729-f26b-5a21-bec1-f2620b93c5c4','trusted_secondary',
  'https://response.jp/article/2006/12/06/89096.html',
  array['releaseYear','editionName']::text[],
  'Contemporary reporting independently confirms that 2006 Black Special was a reissue of a previous limited complete kit.'),
 ('936ac729-f26b-5a21-bec1-f2620b93c5c4','trusted_secondary',
  'https://www.tea-league.com/mt/tea/archives/2006/12/x_6.html',
  array['itemNumber','chassis','msrpJPY','color']::text[],
  '2006 collector review explicitly compares the original 1993 price JPY600 with the reissue; the matched ITEM was 94584 and chassis Super 1.'),
 ('c37d4161-aa31-535b-b1de-9040730a4cdd','trusted_secondary',
  'https://www.hlj.com/poseidon-black-special-tam94584',
  array['itemNumber','editionName','releaseYear','barcodeJAN','chassis','productionStatus']::text[],
  'Exact 2006 complete-kit listing: ITEM 94584 / JAN 4950344945849 / 2006-12-14 retailer date; discontinued and out of stock. NOT live market ASK.'),
 ('c37d4161-aa31-535b-b1de-9040730a4cdd','trusted_secondary',
  'https://response.jp/article/2006/12/06/89096.html',
  array['releaseYear','msrpJPY','editionName']::text[],
  'Contemporary 2006 report: reissue expected around 2006-12-16 at JPY945 tax-included = JPY900 pre-tax.'),
 ('c37d4161-aa31-535b-b1de-9040730a4cdd','trusted_secondary',
  'https://myrcstation.com/products/tamiya-94584-poseidon-x-black-special-super-1-chassis-94584',
  array['itemNumber','chassis','color','editionName']::text[],
  '2006 Tamiya specification reproduction: black body, silver highlights, Super 1 chassis, limited reissue.'),
 ('c37d4161-aa31-535b-b1de-9040730a4cdd','trusted_secondary',
  'https://www.tea-league.com/mt/tea/archives/2006/12/x_6.html',
  array['itemNumber','chassis','color']::text[],
  '2006-12-16 hands-on retailer/collector review documents actual reissue packaging and included chassis.')
) as v(release_id,source_type,source_url,fields,notes)
where not exists (
  select 1 from public.release_sources s
  where s.release_id=v.release_id::uuid and s.source_url=v.source_url
);

-- New Releases must be part of the canonical signal pipeline, not merely listed in a queue.
-- Market runners still enforce exact ITEM/JAN and source readiness.
select public.trackdash_enqueue_market_recompute(r.id,'new_complete_unbuilt')
from public.product_releases r
where r.product_id='e8a13fb8-4af2-5f5f-936e-8871d9567289';

select public.trackdash_enroll_release_market_scans(r.id)
from public.product_releases r
where r.product_id='e8a13fb8-4af2-5f5f-936e-8871d9567289';

commit;
