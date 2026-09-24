-- Avante Mk.II family Master re-audit — 2026-09-24
-- Rebuilds the legacy five-release family under the current TrackDash family-completion method.
-- Canonical commercial family after this audit:
-- 18614 base kit, 94592 Finished Model, 94626 Black Special, 94716 V Special,
-- 95061 Pink Special, 95525 Asia Challenge 2020 Taiwan Final,
-- plus the distinct 2023 J.League collector editions for Gamba Osaka and Cerezo Osaka.
-- 94585 is a body set / parts product and is intentionally NOT a Product Release.

begin;

-- Existing canonical kit: preserve UUID and identity, but document ITEM reuse.
update public.product_releases
set production_status='active',
    discontinued=false,
    rarity='Common',
    status_checked_at=now(),
    notes=case
      when coalesce(notes,'') like '%TrackDash Master re-audit 2026-09-24%' then notes
      else concat_ws(' ',nullif(notes,''),
        'TrackDash Master re-audit 2026-09-24: base ITEM 18614 remains the canonical original Release. The same base Item Number is also used by two physically/commercially distinct 2023 J.League collector editions (Gamba Osaka and Cerezo Osaka), so scanner resolution must fail closed on ITEM 18614 unless edition evidence disambiguates the Release. Conflicting secondary GTIN metadata exists for the base kit, therefore barcode_jan remains intentionally unresolved rather than invented.')
    end,
    updated_at=now()
where id='5a123617-c84c-5012-ab20-1a9d493259e0'::uuid;

-- Black Special: add the independently corroborated JAN.
update public.product_releases
set barcode_jan='4950344946266',
    production_status='discontinued',
    discontinued=true,
    rarity='Rare',
    status_checked_at=now(),
    notes=case
      when coalesce(notes,'') like '%TrackDash Master re-audit 2026-09-24%' then notes
      else concat_ws(' ',nullif(notes,''),
        'TrackDash Master re-audit 2026-09-24: JAN 4950344946266 corroborated by Japanese specialist retail metadata. Official Tamiya USA identifies ITEM 94626 as discontinued.')
    end,
    updated_at=now()
where id='e7f6a362-9bac-53aa-8673-2fa308c50a17'::uuid;

-- Preserve the existing verified special-kit rows while marking the family re-audit.
update public.product_releases
set notes=case
      when coalesce(notes,'') like '%TrackDash Master re-audit 2026-09-24%' then notes
      else concat_ws(' ',nullif(notes,''),'TrackDash Master re-audit 2026-09-24: identity rechecked against the exact-item family inventory; this remains a distinct commercial Release.')
    end,
    updated_at=now()
where id in (
  '6c1d4fcf-7265-5a61-9be9-795e27eec353'::uuid,
  'c819da54-1ebc-5a8b-a24f-77166cf70e8d'::uuid,
  '5489c586-0f2a-5393-9447-dcf36bed8f1a'::uuid
);

-- 94592 is a genuine 2007 commercial Finished Model, not a production wave.
insert into public.product_releases (
  id,product_id,item_number,release_type,edition_name,release_year,release_date,
  chassis,barcode_jan,color,country_market,notes,discontinued,is_original,rarity,
  data_source,edition_type,verification_status,production_status,status_checked_at,
  description,description_it
) values (
  '6d4a4979-c006-5d28-a26c-448fa19d1dcf'::uuid,
  '6dcb6511-5277-561f-a880-95ef828ce44f'::uuid,
  '94592','Finished Model','Avante Mk.II (Finished Model)',2007,date '2007-03-24',
  'MS',null,null,null,
  'TrackDash Master re-audit 2026-09-24: distinct factory-finished commercial Release. Contemporary 2007 Tamiya new-release material lists ITEM 94592 separately from the 94585 Blue Color Plated Body Set; historical exact RCJAZ product page corroborates the Finished Model identity. 94585 remains excluded because it is body/parts only.',
  true,false,'Rare','master_reaudit_20260924','special','verified','discontinued',now(),
  'Factory-finished 2007 Avante Mk.II commercial model on MS chassis.',
  'Modello commerciale Avante Mk.II premontato in fabbrica del 2007 su telaio MS.'
)
on conflict (id) do update set
  product_id=excluded.product_id,item_number=excluded.item_number,release_type=excluded.release_type,
  edition_name=excluded.edition_name,release_year=excluded.release_year,release_date=excluded.release_date,
  chassis=excluded.chassis,barcode_jan=excluded.barcode_jan,color=excluded.color,
  country_market=excluded.country_market,notes=excluded.notes,discontinued=excluded.discontinued,
  is_original=excluded.is_original,rarity=excluded.rarity,data_source=excluded.data_source,
  edition_type=excluded.edition_type,verification_status=excluded.verification_status,
  production_status=excluded.production_status,status_checked_at=excluded.status_checked_at,
  description=excluded.description,description_it=excluded.description_it,updated_at=now();

-- J.League 30th Anniversary: Gamba Osaka. Official club source documents a
-- 2023-07-07 launch, JPY 2,420 retail price and 600 units per model.
-- The underlying Mini 4WD is ITEM 18614; no autonomous Tamiya Item Number was found.
insert into public.product_releases (
  id,product_id,item_number,release_type,edition_name,release_year,release_date,
  chassis,barcode_jan,color,country_market,notes,discontinued,is_original,rarity,
  data_source,edition_type,verification_status,production_status,status_checked_at,
  description,description_it
) values (
  'e0081f9e-e423-5f90-a30f-968978b36ed0'::uuid,
  '6dcb6511-5277-561f-a880-95ef828ce44f'::uuid,
  '18614','Collaboration',
  'Avante Mk.II Gamba Osaka Special Edition (J.League 30th Anniversary)',
  2023,date '2023-07-07','MS',null,'Gamba Osaka collaboration','Japan',
  'TrackDash Master re-audit 2026-09-24: official Gamba Osaka release for the J.League 30th Anniversary project. Official club announcement sets online sales from 2023-07-07 at JPY 2,420 and 600 units per model across online/stadium allocation. Marketplace evidence identifies base MPN 18614. Distinct collector Release despite shared base Item Number.',
  true,false,'Rare','master_reaudit_20260924','special','verified','discontinued',now(),
  '2023 Gamba Osaka J.League 30th Anniversary collector edition of the Avante Mk.II.',
  'Edizione da collezione Avante Mk.II Gamba Osaka per il 30° anniversario della J.League, 2023.'
)
on conflict (id) do update set
  product_id=excluded.product_id,item_number=excluded.item_number,release_type=excluded.release_type,
  edition_name=excluded.edition_name,release_year=excluded.release_year,release_date=excluded.release_date,
  chassis=excluded.chassis,barcode_jan=excluded.barcode_jan,color=excluded.color,
  country_market=excluded.country_market,notes=excluded.notes,discontinued=excluded.discontinued,
  is_original=excluded.is_original,rarity=excluded.rarity,data_source=excluded.data_source,
  edition_type=excluded.edition_type,verification_status=excluded.verification_status,
  production_status=excluded.production_status,status_checked_at=excluded.status_checked_at,
  description=excluded.description,description_it=excluded.description_it,updated_at=now();

-- J.League 30th Anniversary: Cerezo Osaka. Official club news confirms the
-- distinct Cerezo Osaka Special Edition and JPY 2,420 retail price.
insert into public.product_releases (
  id,product_id,item_number,release_type,edition_name,release_year,release_date,
  chassis,barcode_jan,color,country_market,notes,discontinued,is_original,rarity,
  data_source,edition_type,verification_status,production_status,status_checked_at,
  description,description_it
) values (
  '1bd70c72-417e-5e20-a7e1-0247e38dc608'::uuid,
  '6dcb6511-5277-561f-a880-95ef828ce44f'::uuid,
  '18614','Collaboration',
  'Avante Mk.II Cerezo Osaka Special Edition (J.League 30th Anniversary)',
  2023,null,'MS',null,'Cerezo Osaka collaboration','Japan',
  'TrackDash Master re-audit 2026-09-24: official Cerezo Osaka J.League 30th Anniversary collaboration, documented by the club at JPY 2,420. No autonomous Tamiya Item Number or exact first-sale day was independently established; the base Avante Mk.II ITEM 18614 is retained with shared-Item ambiguity and the release_date intentionally remains unknown.',
  true,false,'Rare','master_reaudit_20260924','special','verified','discontinued',now(),
  '2023 Cerezo Osaka J.League 30th Anniversary collector edition of the Avante Mk.II.',
  'Edizione da collezione Avante Mk.II Cerezo Osaka per il 30° anniversario della J.League, 2023.'
)
on conflict (id) do update set
  product_id=excluded.product_id,item_number=excluded.item_number,release_type=excluded.release_type,
  edition_name=excluded.edition_name,release_year=excluded.release_year,release_date=excluded.release_date,
  chassis=excluded.chassis,barcode_jan=excluded.barcode_jan,color=excluded.color,
  country_market=excluded.country_market,notes=excluded.notes,discontinued=excluded.discontinued,
  is_original=excluded.is_original,rarity=excluded.rarity,data_source=excluded.data_source,
  edition_type=excluded.edition_type,verification_status=excluded.verification_status,
  production_status=excluded.production_status,status_checked_at=excluded.status_checked_at,
  description=excluded.description,description_it=excluded.description_it,updated_at=now();

-- Provenance: Finished Model.
insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
select gen_random_uuid(),'6d4a4979-c006-5d28-a26c-448fa19d1dcf'::uuid,'trusted_secondary',
       'https://tamiyablog.com/2007/02/tamiya-58-spielwarenmesse-international-toy-fair-nurnberg-2007-new-releases/',
       array['itemNumber','editionName','releaseYear'],date '2026-09-24',
       'Contemporary Tamiya new-release list reproduced by TamiyaBlog lists ITEM 94592 Finished Model separately from body set 94585.'
where not exists (
  select 1 from public.release_sources
  where release_id='6d4a4979-c006-5d28-a26c-448fa19d1dcf'::uuid
    and source_url='https://tamiyablog.com/2007/02/tamiya-58-spielwarenmesse-international-toy-fair-nurnberg-2007-new-releases/'
);

insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
select gen_random_uuid(),'6d4a4979-c006-5d28-a26c-448fa19d1dcf'::uuid,'trusted_secondary',
       'https://www.rcjaz.co.uk/tamiya-94592-avante-mkii-132-finished-mini-4wd-collector-model-p-8762.html',
       array['itemNumber','editionName','marketAvailability'],date '2026-09-24',
       'Exact historical RCJAZ product page confirms ITEM 94592 as Avante Mk.II Finished Model; currently Not Available.'
where not exists (
  select 1 from public.release_sources
  where release_id='6d4a4979-c006-5d28-a26c-448fa19d1dcf'::uuid
    and source_url='https://www.rcjaz.co.uk/tamiya-94592-avante-mkii-132-finished-mini-4wd-collector-model-p-8762.html'
);

-- Provenance: Black Special JAN.
insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
select gen_random_uuid(),'e7f6a362-9bac-53aa-8673-2fa308c50a17'::uuid,'trusted_secondary',
       'https://www.1999.co.jp/10087710',
       array['itemNumber','barcodeJAN','editionName'],date '2026-09-24',
       'Japanese specialist retail metadata corroborates ITEM 94626 / JAN 4950344946266.'
where not exists (
  select 1 from public.release_sources
  where release_id='e7f6a362-9bac-53aa-8673-2fa308c50a17'::uuid
    and source_url='https://www.1999.co.jp/10087710'
);

-- Provenance: Gamba Osaka official club release plus exact marketplace identity.
insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
select gen_random_uuid(),'e0081f9e-e423-5f90-a30f-968978b36ed0'::uuid,'official_archive',
       'https://www.gamba-osaka.net/news/index/no/15284/',
       array['editionName','releaseDate','releaseYear','countryMarket','limitedQuantity','retailPrice'],date '2026-09-24',
       'Official Gamba Osaka announcement: sales start 2023-07-07 12:00, JPY 2,420, 600 units per model across online/stadium allocation.'
where not exists (
  select 1 from public.release_sources
  where release_id='e0081f9e-e423-5f90-a30f-968978b36ed0'::uuid
    and source_url='https://www.gamba-osaka.net/news/index/no/15284/'
);

insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
select gen_random_uuid(),'e0081f9e-e423-5f90-a30f-968978b36ed0'::uuid,'trusted_secondary',
       'https://www.ebay.com/itm/166247307960',
       array['itemNumber','editionName','releaseYear','marketAvailability'],date '2026-09-24',
       'Exact current marketplace listing identifies the Gamba Osaka edition, manufactured 2023, with base MPN 18614. Checkout shown by crawl is not Italy-specific, so its delivered cost is not promoted to Europe-first public pricing.'
where not exists (
  select 1 from public.release_sources
  where release_id='e0081f9e-e423-5f90-a30f-968978b36ed0'::uuid
    and source_url='https://www.ebay.com/itm/166247307960'
);

-- Provenance: Cerezo Osaka official club release.
insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
select gen_random_uuid(),'1bd70c72-417e-5e20-a7e1-0247e38dc608'::uuid,'official_archive',
       'https://www.cerezo.jp/news/2023-0714-1800/',
       array['editionName','releaseYear','countryMarket','retailPrice'],date '2026-09-24',
       'Official Cerezo Osaka announcement confirms the Avante Mk.II Cerezo Osaka Special Edition at JPY 2,420.'
where not exists (
  select 1 from public.release_sources
  where release_id='1bd70c72-417e-5e20-a7e1-0247e38dc608'::uuid
    and source_url='https://www.cerezo.jp/news/2023-0714-1800/'
);

-- Exact-item image audit. The item-scoped Tamiya archive URLs below are
-- independently HTTP-probed by the branch image-audit workflow before merge.
-- Club editions intentionally remain without a canonical image until a stable
-- exact single-product asset can be established; sibling/base images are not substituted.
delete from public.release_images
where release_id in (
  '6d4a4979-c006-5d28-a26c-448fa19d1dcf'::uuid,
  'e7f6a362-9bac-53aa-8673-2fa308c50a17'::uuid,
  '6c1d4fcf-7265-5a61-9be9-795e27eec353'::uuid,
  'c819da54-1ebc-5a8b-a24f-77166cf70e8d'::uuid,
  '5489c586-0f2a-5393-9447-dcf36bed8f1a'::uuid
);

insert into public.release_images(id,release_id,url,position) values
(gen_random_uuid(),'6d4a4979-c006-5d28-a26c-448fa19d1dcf','https://www.tamiya.com/japan_contents/img/usr/item/9/94592/94592_1.jpg',0),
(gen_random_uuid(),'e7f6a362-9bac-53aa-8673-2fa308c50a17','https://www.tamiya.com/japan_contents/img/usr/item/9/94626/94626_1.jpg',0),
(gen_random_uuid(),'6c1d4fcf-7265-5a61-9be9-795e27eec353','https://www.tamiya.com/japan_contents/img/usr/item/9/94716/94716_1.jpg',0),
(gen_random_uuid(),'c819da54-1ebc-5a8b-a24f-77166cf70e8d','https://www.tamiya.com/japan_contents/img/usr/item/9/95061/95061_1.jpg',0),
(gen_random_uuid(),'5489c586-0f2a-5393-9447-dcf36bed8f1a','https://www.tamiya.com/japan_contents/img/usr/item/9/95525/95525_1.jpg',0);

update public.product_releases
set notes=case
      when coalesce(notes,'') like '%Exact club-edition image intentionally unresolved%' then notes
      else concat_ws(' ',nullif(notes,''),
        'Exact club-edition image intentionally unresolved after the 2026-09-24 audit; TrackDash must show the placeholder rather than the base 18614 or another sibling image.')
    end,
    updated_at=now()
where id in (
  'e0081f9e-e423-5f90-a30f-968978b36ed0'::uuid,
  '1bd70c72-417e-5e20-a7e1-0247e38dc608'::uuid
);

-- Market audit: exact RCJAZ current/historical observations.
insert into public.market_candidates(
  id,source_id,source_record_key,original_source,original_record_id,listing_url,title_raw,item_number_observed,
  possible_release_ids,resolved_release_id,price,currency,shipping_cost,shipping_basis,observation_type,
  condition_raw,condition,inner_bags_sealed,box_condition,is_complete,is_lot,quantity,match_confidence,
  match_evidence,evidence_group_key,observed_at,decision,reason_codes,review_notes,needs_revalidation,
  raw_payload,first_observed_at,last_observed_at
) values
(
  gen_random_uuid(),'c19c7599-69b4-4211-9ef0-f620845a689c'::uuid,'rcjaz:18614','rcjaz_public','18614',
  'https://www.rcjaz.co.uk/tamiya-18614-avante-mkii-132-mini-4wd-kit-track-tuner-p-8338.html',
  'Tamiya 18614 Avante MK.II 1/32 Mini 4WD Kit','18614',
  array['5a123617-c84c-5012-ab20-1a9d493259e0'::uuid],'5a123617-c84c-5012-ab20-1a9d493259e0'::uuid,
  9.01,'GBP',null,'unknown','retail_in_stock','Brand New','new_complete_unbuilt','unknown','unknown',
  true,false,1,'exact',array['item_number_exact','edition_name_exact','chassis_stated'],
  'retail:rcjaz:18614',now(),'accepted',array['EXTRA_EU_LANDED_COST_UNKNOWN'],
  'Exact RCJAZ page is currently Add to Cart. Extra-EU landed cost to Italy is unknown, so this observation is market breadth/context and must not beat a fully deliverable European effective-cost offer.',
  false,jsonb_build_object('adapter','manual-reaudit-v1','availability','in_stock','market_region','asia_pacific','landed_cost_europe','unknown'),now(),now()
),
(
  gen_random_uuid(),'c19c7599-69b4-4211-9ef0-f620845a689c'::uuid,'rcjaz:94592','rcjaz_public','94592',
  'https://www.rcjaz.co.uk/tamiya-94592-avante-mkii-132-finished-mini-4wd-collector-model-p-8762.html',
  'Tamiya 94592 Avante Mk.II 1/32 Finished Mini 4WD Collector Model','94592',
  array['6d4a4979-c006-5d28-a26c-448fa19d1dcf'::uuid],'6d4a4979-c006-5d28-a26c-448fa19d1dcf'::uuid,
  10.80,'GBP',null,'unknown','retail_out_of_stock','Not Available','new_complete_unbuilt','unknown','unknown',
  true,false,1,'exact',array['item_number_exact','edition_name_exact'],
  'retail:rcjaz:94592',now(),'accepted',array['OUT_OF_STOCK_HISTORICAL_ONLY'],
  'Exact historical RCJAZ page; retained as retail history only, not a current asking price.',
  false,jsonb_build_object('adapter','manual-reaudit-v1','availability','out_of_stock','market_region','asia_pacific'),now(),now()
),
(
  gen_random_uuid(),'c19c7599-69b4-4211-9ef0-f620845a689c'::uuid,'rcjaz:94626','rcjaz_public','94626',
  'https://www.rcjaz.co.uk/tamiya-94626-avante-mkii-black-special-mini-4wd-pro-kit-collector-edition-p-90022367.html',
  'Tamiya 94626 Avante Mk.II Black Special Mini 4WD Pro Kit','94626',
  array['e7f6a362-9bac-53aa-8673-2fa308c50a17'::uuid],'e7f6a362-9bac-53aa-8673-2fa308c50a17'::uuid,
  12.43,'GBP',null,'unknown','retail_out_of_stock','Not Available','new_complete_unbuilt','unknown','unknown',
  true,false,1,'exact',array['item_number_exact','edition_name_exact'],
  'retail:rcjaz:94626',now(),'accepted',array['OUT_OF_STOCK_HISTORICAL_ONLY'],
  'Exact historical RCJAZ page; retained as retail history only, not a current asking price.',
  false,jsonb_build_object('adapter','manual-reaudit-v1','availability','out_of_stock','market_region','asia_pacific'),now(),now()
),
(
  gen_random_uuid(),'c19c7599-69b4-4211-9ef0-f620845a689c'::uuid,'rcjaz:94716','rcjaz_public','94716',
  'https://www.rcjaz.ca/tamiya-jr-avante-mkii-special-ms-chassis-94716-p-90014150.html',
  'Tamiya 94716 Avante Mk.II V Special MS Chassis Mini 4WD','94716',
  array['6c1d4fcf-7265-5a61-9be9-795e27eec353'::uuid],'6c1d4fcf-7265-5a61-9be9-795e27eec353'::uuid,
  23.99,'CAD',null,'unknown','retail_out_of_stock','Not Available','new_complete_unbuilt','unknown','unknown',
  true,false,1,'exact',array['item_number_exact','edition_name_exact','chassis_stated'],
  'retail:rcjaz:94716',now(),'accepted',array['OUT_OF_STOCK_HISTORICAL_ONLY'],
  'Exact historical RCJAZ product page; retained as retail history only, not a current asking price.',
  false,jsonb_build_object('adapter','manual-reaudit-v1','availability','out_of_stock','market_region','asia_pacific'),now(),now()
)
on conflict (source_id,source_record_key) do update set
  listing_url=excluded.listing_url,title_raw=excluded.title_raw,item_number_observed=excluded.item_number_observed,
  possible_release_ids=excluded.possible_release_ids,resolved_release_id=excluded.resolved_release_id,
  price=excluded.price,currency=excluded.currency,shipping_cost=excluded.shipping_cost,
  shipping_basis=excluded.shipping_basis,observation_type=excluded.observation_type,
  condition_raw=excluded.condition_raw,condition=excluded.condition,is_complete=excluded.is_complete,
  is_lot=excluded.is_lot,quantity=excluded.quantity,match_confidence=excluded.match_confidence,
  match_evidence=excluded.match_evidence,evidence_group_key=excluded.evidence_group_key,
  observed_at=excluded.observed_at,decision=excluded.decision,reason_codes=excluded.reason_codes,
  review_notes=excluded.review_notes,needs_revalidation=false,raw_payload=excluded.raw_payload,
  last_observed_at=excluded.last_observed_at,updated_at=now();

-- Correct the existing broad 18614 eBay hit: it is an exact Gamba Osaka
-- collector-edition listing, not the canonical 18614 base kit. Keep it out of
-- Europe-first public pricing because the displayed checkout is not Italy-specific.
update public.market_candidates
set item_number_observed='18614',
    possible_release_ids=array['e0081f9e-e423-5f90-a30f-968978b36ed0'::uuid],
    resolved_release_id='e0081f9e-e423-5f90-a30f-968978b36ed0'::uuid,
    condition='new_complete_unbuilt',
    is_complete=true,
    is_lot=false,
    quantity=1,
    match_confidence='exact',
    match_evidence=array['edition_name_exact','item_number_exact','manual_override'],
    decision='needs_review',
    reason_codes=array['EXTRA_EU_LANDED_COST_UNKNOWN'],
    review_notes='Re-audited 2026-09-24: exact Gamba Osaka J.League 30th Anniversary edition. Listing is current/new, but displayed shipping/import calculation is not destination-Italy evidence, so it remains global ASK context and must not become the Europe-first minimum effective cost.',
    needs_revalidation=false,
    raw_payload=coalesce(raw_payload,'{}'::jsonb) || jsonb_build_object(
      'manual_reaudit','2026-09-24','target_release','gamba_osaka_2023',
      'market_region','global','landed_cost_italy','unknown'
    ),
    updated_at=now()
where source_id='709dcecf-d368-4742-b114-f00f5d7ed646'::uuid
  and source_record_key='v1|166247307960|0';

-- Cerezo Osaka: one exact recent Japanese closed-auction transaction.
-- A single sale is useful evidence but deliberately insufficient for MV by itself.
insert into public.market_candidates(
  id,source_id,source_record_key,original_source,original_record_id,listing_url,title_raw,item_number_observed,
  possible_release_ids,resolved_release_id,price,currency,shipping_cost,shipping_basis,observation_type,
  condition_raw,condition,inner_bags_sealed,box_condition,is_complete,is_lot,quantity,match_confidence,
  match_evidence,evidence_group_key,observed_at,sold_on,decision,reason_codes,review_notes,needs_revalidation,
  raw_payload,first_observed_at,last_observed_at
) values (
  gen_random_uuid(),'d75d5b49-d9e5-58d0-bd2a-3d82f44fda53'::uuid,
  'yahoo-auctions:avante-mkii-cerezo:2026-06-16:3234','YAHOO_AUCTIONS_JP',null,
  'https://auctions.yahoo.co.jp/closedsearch/closedsearch/%E3%83%9F%E3%83%8B%E5%9B%9B%E9%A7%86%20%E3%82%A2%E3%83%90%E3%83%B3%E3%83%86/0',
  '新品未組立 タミヤ ミニ四駆PROシリーズ アバンテMk.II セレッソ大阪スペシャルエディション',
  '18614',array['1bd70c72-417e-5e20-a7e1-0247e38dc608'::uuid],
  '1bd70c72-417e-5e20-a7e1-0247e38dc608'::uuid,
  3234,'JPY',null,'unknown','auction_awarded','未使用','new_complete_unbuilt','unknown','unknown',
  true,false,1,'exact',array['edition_name_exact','manual_override'],
  'yahoo-auctions:cerezo-avante-mkii:2026-06-16',now(),date '2026-06-16','accepted',array[]::text[],
  'Exact recent closed-sale evidence. One transaction only: retain as SOLD evidence but do not consolidate Market Value without broader independent support.',
  false,jsonb_build_object('adapter','manual-reaudit-v1','market_region','japan','evidence_kind','confirmed_transaction'),now(),now()
)
on conflict (source_id,source_record_key) do update set
  listing_url=excluded.listing_url,title_raw=excluded.title_raw,item_number_observed=excluded.item_number_observed,
  possible_release_ids=excluded.possible_release_ids,resolved_release_id=excluded.resolved_release_id,
  price=excluded.price,currency=excluded.currency,shipping_cost=excluded.shipping_cost,
  shipping_basis=excluded.shipping_basis,observation_type=excluded.observation_type,
  condition_raw=excluded.condition_raw,condition=excluded.condition,is_complete=excluded.is_complete,
  is_lot=excluded.is_lot,quantity=excluded.quantity,match_confidence=excluded.match_confidence,
  match_evidence=excluded.match_evidence,evidence_group_key=excluded.evidence_group_key,
  sold_on=excluded.sold_on,observed_at=excluded.observed_at,decision=excluded.decision,
  reason_codes=excluded.reason_codes,review_notes=excluded.review_notes,needs_revalidation=false,
  raw_payload=excluded.raw_payload,last_observed_at=excluded.last_observed_at,updated_at=now();

-- Enroll all three newly materialized Releases into the current adaptive
-- Mini 4WD scan architecture. Finished Models use the same canonical
-- new_complete_unbuilt market condition already used by audited 94593/94673/94674.
select public.trackdash_enroll_release_market_scans('6d4a4979-c006-5d28-a26c-448fa19d1dcf'::uuid);
select public.trackdash_enroll_release_market_scans('e0081f9e-e423-5f90-a30f-968978b36ed0'::uuid);
select public.trackdash_enroll_release_market_scans('1bd70c72-417e-5e20-a7e1-0247e38dc608'::uuid);

-- Exact RCJAZ endpoints for continuous retail observation/restock detection.
select public.trackdash_enroll_rcjaz_endpoint(
  '5a123617-c84c-5012-ab20-1a9d493259e0'::uuid,
  'https://www.rcjaz.co.uk/tamiya-18614-avante-mkii-132-mini-4wd-kit-track-tuner-p-8338.html'
);
select public.trackdash_enroll_rcjaz_endpoint(
  '6d4a4979-c006-5d28-a26c-448fa19d1dcf'::uuid,
  'https://www.rcjaz.co.uk/tamiya-94592-avante-mkii-132-finished-mini-4wd-collector-model-p-8762.html'
);
select public.trackdash_enroll_rcjaz_endpoint(
  'e7f6a362-9bac-53aa-8673-2fa308c50a17'::uuid,
  'https://www.rcjaz.co.uk/tamiya-94626-avante-mkii-black-special-mini-4wd-pro-kit-collector-edition-p-90022367.html'
);
select public.trackdash_enroll_rcjaz_endpoint(
  '6c1d4fcf-7265-5a61-9be9-795e27eec353'::uuid,
  'https://www.rcjaz.ca/tamiya-jr-avante-mkii-special-ms-chassis-94716-p-90014150.html'
);
select public.trackdash_enroll_rcjaz_endpoint(
  'c819da54-1ebc-5a8b-a24f-77166cf70e8d'::uuid,
  'https://www.rcjaz.co.uk/95061-tamiya-avante-mkii-pink-special-clear-body-ms-chassis-p-90068272.html'
);

-- Initial audit/recompute: all eight Releases must be evaluated under the
-- current frozen market method. This is not a scan and does not fake success.
select public.trackdash_enqueue_market_recompute(id,'new_complete_unbuilt')
from public.product_releases
where product_id='6dcb6511-5277-561f-a880-95ef828ce44f'::uuid;

-- Force exact retail endpoints for this family due now; do not set last_success_at.
update public.market_scan_queue q
set next_scan_at=now(),
    priority=greatest(q.priority,110),
    locked_until=null,
    updated_at=now()
where q.release_id in (
  select id from public.product_releases
  where product_id='6dcb6511-5277-561f-a880-95ef828ce44f'::uuid
)
and q.scan_scope='retail';

commit;
