-- Boomerang Jr. family controlled re-audit — 2026-09-25
--
-- Publication gate:
-- verified identity + (exact/high-confidence image OR credible exact-release market evidence)
-- = public. Otherwise preserve as research_only.
--
-- Canonicalized here: 7 Releases.
-- NOT canonicalized: a poorly documented "2904 Special" clear-chassis variant
-- that conflicts with the better documented 2954 clear-chassis Special.

begin;

update public.products
set canonical_item_number='18004',
    canonical_release_id='676c2d8e-df56-5b73-9e6e-4ff732b4bbc4'::uuid,
    original_release_year=1986,
    series='Racing Mini 4WD',
    chassis='Type 1',
    description='Boomerang Jr. is the 1986 Racing Mini 4WD adaptation of Tamiya''s Boomerang R/C buggy. The collector family spans the early Oshika production, a clear-chassis Special, the 1995 Hello Mac Pearl Color Special, the 2005 VS-chassis RS, the 2014 RS Black Special and the 2018 Hiroshima Toyo Carp collaboration.',
    description_it='Boomerang Jr. è l''adattamento Racing Mini 4WD del 1986 della buggy R/C Tamiya Boomerang. La famiglia collezionistica comprende la prima produzione Oshika, la Special con telaio trasparente, la Pearl Color Special Hello Mac del 1995, la RS su telaio VS del 2005, la RS Black Special del 2014 e la collaborazione Hiroshima Toyo Carp del 2018.',
    metadata=coalesce(metadata,'{}'::jsonb) || jsonb_build_object(
      'catalog_audit','2026-09-25',
      'canonical_release_count',7,
      'catalog_publication_gate',jsonb_build_object(
        'version','2026-09-25',
        'public_release_count',3,
        'research_only_release_count',4,
        'market_value_required',false
      ),
      'unresolved_context',jsonb_build_array(
        'Early collector lists mention a Boomerang Jr. Special under KIT 2904 in addition to 2954 Special. It is not canonicalized because autonomous product identity/packaging is not sufficiently corroborated beyond secondary family lists.'
      )
    ),
    updated_at=now()
where id='28b59956-2803-5602-ac02-ca3e58abd862'::uuid;

-- Existing row becomes the standard/later-production identity.
update public.product_releases
set item_number='18004',
    release_type='Original',
    edition_name='Boomerang Jr. — 1986 Standard / Later Production',
    release_year=1986,
    release_date=null,
    chassis='Type 1',
    barcode_jan='4950344180042',
    color='White body / black Type 1 chassis / white wheels',
    country_market='Global / Japan',
    msrp_jpy=600,
    notes='Controlled re-audit 2026-09-25. Official Tamiya identifies ITEM 18004 as Racer Mini 4WD No.4 on Type 1 chassis. Hobby Search corroborates JAN 4950344180042. Early Oshika KIT 2904 production is collector-distinct and retained separately.',
    discontinued=false,
    is_original=true,
    data_source='master_reaudit_20260925',
    edition_type='original',
    verification_status='verified',
    production_status='active',
    status_checked_at=now(),
    description='Standard/later-production Boomerang Jr. ITEM 18004 on Type 1 chassis.',
    description_it='Boomerang Jr. standard / produzione successiva, ITEM 18004 su telaio Type 1.',
    catalog_visibility='public',
    catalog_visibility_reason='publication_gate:exact_official_release_image',
    catalog_visibility_updated_at=now(),
    updated_at=now()
where id='676c2d8e-df56-5b73-9e6e-4ff732b4bbc4'::uuid;

insert into public.product_releases(
  product_id,item_number,release_type,edition_name,release_year,release_date,chassis,barcode_jan,color,
  country_market,msrp_jpy,notes,discontinued,is_original,rarity,data_source,edition_type,
  verification_status,production_status,status_checked_at,description,description_it,
  catalog_visibility,catalog_visibility_reason,catalog_visibility_updated_at
) values
(
  '28b59956-2803-5602-ac02-ca3e58abd862'::uuid,'2904','First Production',
  'Boomerang Jr. — 1986 First Production (Oshika KIT No.2904)',1986,null,'Type 1',null,
  'White body / first-production Oshika parts','Japan',null,
  'Collector-distinct first production documented with Oshika address, KIT No.2904, white gears, white wheels, copper-colored shafts and chassis without guide-roller mounting holes. Exact current image/market evidence is still insufficient for public publication.',
  true,true,null,'master_reaudit_20260925','original','verified','discontinued',now(),
  'Earliest Oshika first-production Boomerang Jr., historical KIT No.2904.',
  'Primissima produzione Oshika della Boomerang Jr., storico KIT No.2904.',
  'research_only','publication_gate:no_stored_exact_image_and_no_current_credible_market_signal',now()
),
(
  '28b59956-2803-5602-ac02-ca3e58abd862'::uuid,'2954','Limited Special',
  'Boomerang Jr. Special — Clear Chassis Version',null,null,'Type 1',null,
  'White body / clear Type 1 chassis / cyan tires','Japan',null,
  'Mandarake independently lists KIT 2954 Boomerang Jr. Special as the clear-chassis limited variant. Exact release year/date are intentionally unresolved. Kept research-only until exact image or credible exact-release market evidence is persisted.',
  true,false,null,'master_reaudit_20260925','special','verified','discontinued',now(),
  'Historical Boomerang Jr. Special with clear Type 1 chassis, KIT 2954.',
  'Storica Boomerang Jr. Special con telaio Type 1 trasparente, KIT 2954.',
  'research_only','publication_gate:no_stored_exact_image_and_no_current_credible_market_signal',now()
),
(
  '28b59956-2803-5602-ac02-ca3e58abd862'::uuid,'94183','Retailer Limited',
  'Boomerang Jr. — Pearl Color Special (Hello Mac Limited)',1995,null,'Type 1',null,
  'Pearl white body / fluorescent yellow wheels / gray spike tires','Japan',null,
  'Hello Mac limited edition independently documented by Mandarake as ITEM 94183, issued in 1995. A closed Mandarake auction on 2025-11-04 for an unassembled example closed at JPY 30,000 with one bid.',
  true,false,null,'master_reaudit_20260925','limited','verified','discontinued',now(),
  '1995 Hello Mac limited Pearl Color Special Boomerang Jr., ITEM 94183.',
  'Boomerang Jr. Pearl Color Special limitata Hello Mac del 1995, ITEM 94183.',
  'public','publication_gate:credible_exact_release_market_evidence',now()
),
(
  '28b59956-2803-5602-ac02-ca3e58abd862'::uuid,'18060','RS',
  'Boomerang Jr. — Boomerang RS',2005,date '2005-04-29','VS','4950344180608',
  'White body / black VS chassis / silver-plated large-diameter wheels','Global / Japan',800,
  'Official Tamiya product page confirms ITEM 18060, Racer Mini 4WD No.60, VS chassis and release date 2005-04-29. JAN 4950344180608 is corroborated by structured specialist product metadata.',
  false,false,null,'master_reaudit_20260925','reissue','verified','unknown',now(),
  '2005 Boomerang RS redesign on VS chassis, ITEM 18060.',
  'Boomerang RS del 2005 su telaio VS, ITEM 18060.',
  'public','publication_gate:exact_official_release_image',now()
),
(
  '28b59956-2803-5602-ac02-ca3e58abd862'::uuid,'95003','Black Special',
  'Boomerang Jr. — Boomerang RS Black Special',2014,date '2014-03-01','VS','4950344950034',
  'Black body / dark-blue VS chassis / black-plated wheels / light-blue tires','Japan',1000,
  'Bic Camera, Sofmap and Hobby Search independently identify ITEM 95003, release 2014-03-01 and JAN 4950344950034. A current exact eBay listing exists, but publication remains research-only until that ASK is persisted through the canonical eBay worker.',
  true,false,null,'master_reaudit_20260925','special','verified','discontinued',now(),
  '2014 limited Boomerang RS Black Special on VS chassis, ITEM 95003.',
  'Boomerang RS Black Special limitata del 2014 su telaio VS, ITEM 95003.',
  'research_only','publication_gate:credible_market_seen_externally_but_not_yet_persisted',now()
),
(
  '28b59956-2803-5602-ac02-ca3e58abd862'::uuid,'92394','Official Collaboration',
  'Boomerang Jr. — Hiroshima Toyo Carp Collaboration Model',2018,null,'VS',null,
  'Red Carp body / black VS chassis / red large-diameter wheels','Japan',null,
  '2018 Tamiya × Hiroshima Toyo Carp collaboration. TEA-League contemporary/historical coverage confirms the 2018 Boomerang Jr. collaboration, while current collector-market references identify ITEM 92394. Exact release date/JAN are not promoted without stronger primary evidence.',
  true,false,null,'master_reaudit_20260925','special','verified','discontinued',now(),
  '2018 Hiroshima Toyo Carp collaboration Boomerang Jr. on VS chassis, ITEM 92394.',
  'Boomerang Jr. collaborazione Hiroshima Toyo Carp del 2018 su telaio VS, ITEM 92394.',
  'research_only','publication_gate:no_stored_exact_image_and_no_new_complete_market_signal',now()
)
on conflict on constraint product_releases_identity_unique do update set
  release_type=excluded.release_type,
  edition_name=excluded.edition_name,
  release_date=excluded.release_date,
  chassis=excluded.chassis,
  barcode_jan=excluded.barcode_jan,
  country_market=excluded.country_market,
  msrp_jpy=excluded.msrp_jpy,
  notes=excluded.notes,
  discontinued=excluded.discontinued,
  is_original=excluded.is_original,
  data_source=excluded.data_source,
  edition_type=excluded.edition_type,
  verification_status=excluded.verification_status,
  production_status=excluded.production_status,
  status_checked_at=excluded.status_checked_at,
  description=excluded.description,
  description_it=excluded.description_it,
  catalog_visibility=excluded.catalog_visibility,
  catalog_visibility_reason=excluded.catalog_visibility_reason,
  catalog_visibility_updated_at=excluded.catalog_visibility_updated_at,
  updated_at=now();

-- Provenance.
insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
select gen_random_uuid(),r.id,s.source_type,s.source_url,s.verified_fields,date '2026-09-25',s.notes
from (
  values
  ('Boomerang Jr. — 1986 Standard / Later Production','official_manufacturer','https://www.tamiya.com/japan/products/18004/index.html',array['itemNumber','editionName','chassis','msrp'], 'Official Tamiya ITEM 18004 / Racer Mini 4WD No.4 product page.'),
  ('Boomerang Jr. — 1986 Standard / Later Production','trusted_secondary','https://www.1999.co.jp/10087218',array['itemNumber','barcodeJAN','chassis'], 'Hobby Search corroborates ITEM 18004 / JAN 4950344180042.'),
  ('Boomerang Jr. — 1986 First Production (Oshika KIT No.2904)','trusted_secondary','https://re-cube.co.jp/toyokawa/new_item/entry-1626.html',array['itemNumber','editionName','color'], 'Exact first-production example documents Oshika address, KIT 2904, white gears/wheels, copper-colored shafts and no guide-roller holes.'),
  ('Boomerang Jr. — 1986 First Production (Oshika KIT No.2904)','trusted_secondary','https://auctions.yahoo.co.jp/jp/auction/1117533976',array['itemNumber','editionName','color'], 'Exact historical Yahoo auction independently documents first-production KIT 2904 characteristics; too old to be promoted as current market evidence.'),
  ('Boomerang Jr. Special — Clear Chassis Version','trusted_secondary','https://www.mandarake.co.jp/kaitori/cat/car/miniyonku.php',array['itemNumber','editionName','color'], 'Mandarake collector list independently identifies limited KIT 2954 Boomerang Jr. Special with clear chassis.'),
  ('Boomerang Jr. — Pearl Color Special (Hello Mac Limited)','trusted_secondary','https://k.mandarake.co.jp/auction/item/itemInfoEn.html?index=769472',array['itemNumber','editionName','releaseYear','color'], 'Mandarake closed auction: Hello Mac limited ITEM 94183, issued 1995, unassembled example.'),
  ('Boomerang Jr. — Boomerang RS','official_manufacturer','https://www.tamiya.com/japan/products/18060/index.html',array['itemNumber','editionName','releaseDate','chassis','msrp'], 'Official Tamiya ITEM 18060, release 2005-04-29, VS chassis.'),
  ('Boomerang Jr. — Boomerang RS','trusted_secondary','https://www.kaitori-world.jp/products/detail/276246',array['itemNumber','barcodeJAN'], 'Kaitori World corroborates ITEM 18060 / JAN 4950344180608; its placeholder release date is not used.'),
  ('Boomerang Jr. — Boomerang RS Black Special','trusted_secondary','https://www.biccamera.com/bc/item/1803572/',array['itemNumber','editionName','releaseDate','msrp'], 'Bic Camera gives ITEM 95003 and 2014-03-01 release.'),
  ('Boomerang Jr. — Boomerang RS Black Special','trusted_secondary','https://www.1999.co.jp/10249779',array['itemNumber','barcodeJAN','chassis'], 'Hobby Search corroborates ITEM 95003 / JAN 4950344950034.'),
  ('Boomerang Jr. — Hiroshima Toyo Carp Collaboration Model','trusted_secondary','https://www.tea-league.com/mt/tea/archives/2018/01/2018_13.html',array['editionName','releaseYear'], 'Contemporary 2018 history records announcement of the Futaba Books × Hiroshima Toyo Carp × Tamiya original Mini 4WD.'),
  ('Boomerang Jr. — Hiroshima Toyo Carp Collaboration Model','trusted_secondary','https://www.tea-league.com/mt/tea/archives/2026/02/2026_27.html',array['editionName','releaseYear'], '2026 retrospective explicitly identifies the 2018 Carp collaboration as Boomerang Jr.'),
  ('Boomerang Jr. — Hiroshima Toyo Carp Collaboration Model','trusted_secondary','https://e-otakara.com/all_list/kaitori_mini4wd/',array['itemNumber','editionName'], 'Current specialist buy list maps ITEM 92394 to the Hiroshima Toyo Carp collaboration model.')
) as s(edition_name,source_type,source_url,verified_fields,notes)
join public.product_releases r
  on r.product_id='28b59956-2803-5602-ac02-ca3e58abd862'::uuid
 and r.edition_name=s.edition_name
where not exists (
  select 1 from public.release_sources existing
  where existing.release_id=r.id and existing.source_url=s.source_url
);

-- Exact official images for current official product pages.
delete from public.release_images
where release_id in (
  '676c2d8e-df56-5b73-9e6e-4ff732b4bbc4'::uuid,
  (select id from public.product_releases where product_id='28b59956-2803-5602-ac02-ca3e58abd862'::uuid and item_number='18060' limit 1)
);

insert into public.release_images(id,release_id,url,position)
values
(
  gen_random_uuid(),
  '676c2d8e-df56-5b73-9e6e-4ff732b4bbc4'::uuid,
  'https://www.tamiya.com/japan_contents/img/usr/item/1/18004/18004_1.jpg',
  0
),
(
  gen_random_uuid(),
  (select id from public.product_releases where product_id='28b59956-2803-5602-ac02-ca3e58abd862'::uuid and item_number='18060' limit 1),
  'https://www.tamiya.com/japan_contents/img/usr/item/1/18060/18060_1.jpg',
  0
);

-- Verified JAN identifiers.
insert into public.release_identifiers(id,release_id,scheme,value,market,is_primary,verification_status,source_url,checked_at)
select gen_random_uuid(),r.id,'JAN',v.jan,'JP',true,'verified',v.source_url,now()
from (
  values
  ('Boomerang Jr. — 1986 Standard / Later Production','4950344180042','https://www.1999.co.jp/10087218'),
  ('Boomerang Jr. — Boomerang RS','4950344180608','https://www.kaitori-world.jp/products/detail/276246'),
  ('Boomerang Jr. — Boomerang RS Black Special','4950344950034','https://www.1999.co.jp/10249779')
) as v(edition_name,jan,source_url)
join public.product_releases r
  on r.product_id='28b59956-2803-5602-ac02-ca3e58abd862'::uuid
 and r.edition_name=v.edition_name
where not exists (
  select 1 from public.release_identifiers x
  where x.release_id=r.id and x.scheme='JAN' and x.value=v.jan
);

-- Exact Mandarake closed-auction SOLD for 94183.
insert into public.market_candidates(
  id,source_id,source_record_key,original_source,original_record_id,listing_url,title_raw,item_number_observed,
  possible_release_ids,resolved_release_id,price,currency,shipping_cost,shipping_basis,observation_type,
  condition_raw,condition,inner_bags_sealed,box_condition,is_complete,is_lot,quantity,match_confidence,
  match_evidence,evidence_group_key,sold_on,observed_at,decision,reason_codes,review_notes,needs_revalidation,
  raw_payload,first_observed_at,last_observed_at
)
select
  gen_random_uuid(),'c483891c-1272-5b98-9c04-6f5694f38f0a'::uuid,
  'mandarake:auction:769472','MANDARAKE_AUCTION',null,
  'https://k.mandarake.co.jp/auction/item/itemInfoEn.html?index=769472',
  'Boomerang Jr. Pearl Color Special (Hello Mac Exclusive 94183)',
  '94183',array[r.id],r.id,
  30000,'JPY',null,'unknown','auction_awarded',
  'Box 9 / main item 9 / unassembled','new_complete_unbuilt',
  'unknown','near_mint',true,false,1,'exact',
  array['item_number_exact','edition_name_exact','image_reviewed'],
  'mandarake:auction:769472',
  date '2025-11-04',now(),'accepted',array[]::text[],
  'Mandarake closed auction, one bid, unassembled example; shipping not exposed.',
  false,jsonb_build_object('adapter','manual-sold-audit-v1','auction_index',769472,'market_region','japan','auction_bids',1),
  now(),now()
from public.product_releases r
where r.product_id='28b59956-2803-5602-ac02-ca3e58abd862'::uuid
  and r.item_number='94183'
on conflict(source_id,source_record_key) do update set
  title_raw=excluded.title_raw,item_number_observed=excluded.item_number_observed,
  possible_release_ids=excluded.possible_release_ids,resolved_release_id=excluded.resolved_release_id,
  price=excluded.price,currency=excluded.currency,shipping_cost=excluded.shipping_cost,
  shipping_basis=excluded.shipping_basis,observation_type=excluded.observation_type,
  condition_raw=excluded.condition_raw,condition=excluded.condition,
  inner_bags_sealed=excluded.inner_bags_sealed,box_condition=excluded.box_condition,
  is_complete=excluded.is_complete,is_lot=excluded.is_lot,quantity=excluded.quantity,
  match_confidence=excluded.match_confidence,match_evidence=excluded.match_evidence,
  evidence_group_key=excluded.evidence_group_key,sold_on=excluded.sold_on,
  observed_at=excluded.observed_at,decision=excluded.decision,reason_codes=excluded.reason_codes,
  review_notes=excluded.review_notes,needs_revalidation=false,raw_payload=excluded.raw_payload,
  last_observed_at=excluded.last_observed_at,updated_at=now();

insert into public.price_points(
  id,candidate_id,release_id,source_id,observation_type,condition,
  price,currency,shipping_cost,shipping_basis,valuation_price,normalized_price_eur,
  fx_rate_to_eur,fx_rate_date,inner_bags_sealed,box_condition,is_complete,is_lot,
  quantity,match_confidence,match_evidence,evidence_group_key,valuation_eligible,
  status,needs_revalidation,sold_at,sold_on,observed_at,evidence_grade,quality_flags,
  market_price_eur,market_price_basis
)
select
  gen_random_uuid(),c.id,c.resolved_release_id,c.source_id,c.observation_type,c.condition,
  c.price,c.currency,null,'unknown',null,null,
  0.00566926,date '2025-11-04',c.inner_bags_sealed,c.box_condition,true,false,
  1,c.match_confidence,c.match_evidence,c.evidence_group_key,true,
  'active',false,null,c.sold_on,c.observed_at,'indicative',
  array['shipping_unknown','seller_unknown'],
  round(c.price*0.00566926,2),'raw_sale'
from public.market_candidates c
where c.source_id='c483891c-1272-5b98-9c04-6f5694f38f0a'::uuid
  and c.source_record_key='mandarake:auction:769472'
  and c.decision='accepted'
on conflict(candidate_id) do update set
  release_id=excluded.release_id,source_id=excluded.source_id,
  observation_type=excluded.observation_type,condition=excluded.condition,
  price=excluded.price,currency=excluded.currency,shipping_cost=excluded.shipping_cost,
  shipping_basis=excluded.shipping_basis,valuation_price=excluded.valuation_price,
  normalized_price_eur=excluded.normalized_price_eur,fx_rate_to_eur=excluded.fx_rate_to_eur,
  fx_rate_date=excluded.fx_rate_date,inner_bags_sealed=excluded.inner_bags_sealed,
  box_condition=excluded.box_condition,is_complete=excluded.is_complete,is_lot=excluded.is_lot,
  quantity=excluded.quantity,match_confidence=excluded.match_confidence,
  match_evidence=excluded.match_evidence,evidence_group_key=excluded.evidence_group_key,
  valuation_eligible=excluded.valuation_eligible,status=excluded.status,
  needs_revalidation=excluded.needs_revalidation,sold_on=excluded.sold_on,
  observed_at=excluded.observed_at,evidence_grade=excluded.evidence_grade,
  quality_flags=excluded.quality_flags,market_price_eur=excluded.market_price_eur,
  market_price_basis=excluded.market_price_basis,updated_at=now();

select public.trackdash_enqueue_market_recompute(
  (select id from public.product_releases where product_id='28b59956-2803-5602-ac02-ca3e58abd862'::uuid and item_number='94183' limit 1),
  'new_complete_unbuilt'
);

-- Enroll every item-numbered canonical Release for initial eBay audit.
select public.trackdash_enroll_release_market_scans(r.id)
from public.product_releases r
where r.product_id='28b59956-2803-5602-ac02-ca3e58abd862'::uuid
  and r.item_number in ('2904','18004','2954','94183','18060','95003','92394');

-- Put this family ahead of the general overdue queue for the initial scan only.
update public.market_scan_queue
set priority=130,
    next_scan_at=timestamptz '2000-01-01 00:00:00+00',
    consecutive_failures=0,
    last_error=null,
    locked_until=null,
    updated_at=now()
where source_id='709dcecf-d368-4742-b114-f00f5d7ed646'::uuid
  and release_id in (
    select id from public.product_releases
    where product_id='28b59956-2803-5602-ac02-ca3e58abd862'::uuid
      and item_number in ('2904','18004','2954','94183','18060','95003','92394')
  );

update public.market_scan_targets
set priority=130,
    next_scan_at=timestamptz '2000-01-01 00:00:00+00',
    consecutive_failures=0,
    last_error=null,
    locked_until=null,
    updated_at=now()
where source_id='709dcecf-d368-4742-b114-f00f5d7ed646'::uuid
  and release_id in (
    select id from public.product_releases
    where product_id='28b59956-2803-5602-ac02-ca3e58abd862'::uuid
      and item_number in ('2904','18004','2954','94183','18060','95003','92394')
  );

commit;
