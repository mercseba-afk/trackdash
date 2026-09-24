-- Avante Jr. family Master re-audit — 2026-09-24
-- Re-audits the legacy family under the current TrackDash completion method.
--
-- Canonical collector family after this migration:
-- 18014 Original 1988
-- 18506 Black Special Original 1989
-- 18507 Special Version 1990
-- 93001 Champion's Gold (historical date unresolved; identity exact)
-- 18058 Avante RS 2004
-- 92210 Avante RS Purple Special 2009
-- 18014 2012 Reissue
-- 18506 2012 Reissue
-- 95060 Yellow Special 2015
-- 95474 30th Anniversary 2018
-- 95501 Black Special 2019 event reissue
-- 95501 Black Special 2021 commercial reissue, with 2024 as a production wave
-- 18014 2024 Reissue
--
-- Image policy: high-confidence correct image > placeholder > probably wrong image.
-- 18507 and 93001 intentionally remain without Release image rows until an exact
-- stable asset is established. 92210 has an exact RCJAZ item image independently
-- probed through the TrackDash image pipeline before this migration.
--
-- UNKNOWN > INVENTED:
-- Champion's Gold ITEM 93001 is unquestionably a real Release, but historical
-- sources conflict between a 1991 Modelers Gallery occurrence and secondary 1993
-- catalog dating. release_year therefore remains NULL instead of choosing a date.

begin;

-- Product-level cleanup. The old slug came from a legacy unrelated number and
-- the old description over-split mere production waves.
update public.products
set slug='avante-jr-18014',
    canonical_item_number='18014',
    canonical_release_id='cafbb6ca-1aba-5732-946d-0045d054aa5c'::uuid,
    original_release_year=1988,
    chassis='Type 2',
    series='Avante',
    description='The canonical Avante Jr. Mini 4WD collector family: original Type 2 kits, documented special versions, Avante RS/VS variants, anniversary models and later reissues. TrackDash keeps a separate Release only when commercial identity, packaging/JAN, chassis/specification or edition evidence actually distinguishes it; ordinary later production waves remain attached to the same collector Release.',
    description_it='La famiglia collezionistica canonica Avante Jr. Mini 4WD: kit originali Type 2, versioni speciali documentate, varianti Avante RS/VS, modelli anniversario e ristampe successive. TrackDash mantiene una Release separata solo quando identità commerciale, confezione/JAN, telaio/specifiche o edizione la distinguono realmente; le semplici ondate produttive successive restano collegate alla stessa Release.',
    updated_at=now()
where id='82b478fd-21dd-5c93-82fb-bf50461a107d'::uuid;

-- Missing historical Release: ITEM 18507 Special Version.
insert into public.product_releases(
  id,product_id,item_number,release_type,edition_name,release_year,release_date,
  chassis,barcode_jan,color,country_market,notes,discontinued,is_original,rarity,
  data_source,edition_type,verification_status,production_status,status_checked_at,
  description,description_it
) values (
  'd6ed44c7-86fe-4143-ae9f-8c1e6ac61ec5'::uuid,
  '82b478fd-21dd-5c93-82fb-bf50461a107d'::uuid,
  '18507','Special Version','Avante Jr. Special Version',1990,null,
  'Type 2','4950344185078','Blue / Clear chassis / Yellow tires','Japan',
  'TrackDash Master re-audit 2026-09-24: genuine ITEM 18507 Special Version. Historical catalogs place the Release in July 1990; an exact NOS listing corroborates UPC/JAN 4950344185078, clear Type 2 chassis and yellow tires. No exact day is promoted. Exact stable Release image remains unresolved, so TrackDash must show the placeholder rather than substitute the normal 18014 image.',
  true,false,'Rare','master_reaudit_20260924','special','verified','discontinued',now(),
  '1990 limited Avante Jr. Special Version with clear Type 2 chassis and yellow tires.',
  'Versione limitata Avante Jr. Special Version del 1990 con telaio Type 2 trasparente e pneumatici gialli.'
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

-- Missing historical Release: ITEM 93001 Champion's Gold.
insert into public.product_releases(
  id,product_id,item_number,release_type,edition_name,release_year,release_date,
  chassis,barcode_jan,color,country_market,notes,discontinued,is_original,rarity,
  data_source,edition_type,verification_status,production_status,status_checked_at,
  description,description_it
) values (
  '82690ccb-4b2c-4b4f-af8e-c8c37a859d77'::uuid,
  '82b478fd-21dd-5c93-82fb-bf50461a107d'::uuid,
  '93001','Limited Edition','Avante Jr. Champion''s Gold',null,null,
  'Type 2',null,'Gold plated body / Green wheels / Red tires','Asia / event',
  'TrackDash Master re-audit 2026-09-24: exact ITEM 93001 Champion''s Gold identity is strongly documented by Japanese collector/auction sources. Dating remains intentionally unresolved: a surviving boxed example is documented as purchased at the 1991 Modelers Gallery, while secondary catalogs commonly list 1993. UNKNOWN > INVENTED: release_year and release_date remain NULL until a stronger contemporary source resolves the conflict. Exact stable Release image remains unresolved; use the placeholder rather than sibling art.',
  true,false,'Very Rare','master_reaudit_20260924','special','verified','discontinued',now(),
  'Asia/event-exclusive gold-plated Avante Jr. Champion''s Gold, ITEM 93001. Exact release year remains unresolved.',
  'Avante Jr. Champion''s Gold ITEM 93001, edizione Asia/evento con carrozzeria placcata oro. L''anno esatto di uscita resta volutamente non risolto.'
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

-- Missing documented RS variant: ITEM 92210 Purple Special.
insert into public.product_releases(
  id,product_id,item_number,release_type,edition_name,release_year,release_date,
  chassis,barcode_jan,color,country_market,notes,discontinued,is_original,rarity,
  data_source,edition_type,verification_status,production_status,status_checked_at,
  description,description_it
) values (
  '5fb4db26-c28b-48e6-a505-4fb551fdb829'::uuid,
  '82b478fd-21dd-5c93-82fb-bf50461a107d'::uuid,
  '92210','Color Special','Avante RS Purple Special',2009,date '2009-12-17',
  'VS','4950344922109','Pearl Purple','Japan',
  'TrackDash Master re-audit 2026-09-24: exact ITEM 92210 Avante RS Purple Special. HLJ documents JAN 4950344922109 and 2009-12-17 release; Japanese specialist metadata independently corroborates the Item/JAN. Exact RCJAZ ITEM image was HTTP-probed through the TrackDash image optimizer before publication.',
  true,false,'Rare','master_reaudit_20260924','color_special','verified','discontinued',now(),
  '2009 Avante RS Purple Special on VS chassis, ITEM 92210.',
  'Avante RS Purple Special del 2009 su telaio VS, ITEM 92210.'
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

-- 95501 normalization.
-- 2019 is retained as a distinct event-sale reproduction, with the older GTIN.
update public.product_releases
set release_date=date '2019-07-25',
    barcode_jan='4950344955015',
    country_market='Japan',
    discontinued=true,
    production_status='discontinued',
    verification_status='verified',
    data_source='master_reaudit_20260924',
    notes='TrackDash Master re-audit 2026-09-24: distinct 2019 event-sale reproduction of the 1989 Black Special under ITEM 95501. Tamiya''s Modelers Gallery 2019 announcement states event-limited sales began 2019-07-25 and explicitly describes the discontinued 1989 item being reproduced for the event. Contemporary product metadata corroborates GTIN/UPC 4950344955015. This remains separate from the later 2021 commercial reissue line.',
    updated_at=now()
where id='7fd567d7-4d97-5323-88c4-d501efd3bdac'::uuid;

-- 2021 is the canonical modern commercial 95501 Release.
-- The 2024 retail restart is a production wave of this same collector Release.
update public.product_releases
set release_type='Reissue',
    edition_name='Avante Jr. Black Special (2021 Reissue)',
    release_year=2021,
    release_date=null,
    barcode_jan='4950344080885',
    country_market=null,
    discontinued=false,
    production_status='active',
    verification_status='verified',
    data_source='master_reaudit_20260924',
    notes='TrackDash Master re-audit 2026-09-24: canonical modern ITEM 95501 commercial reissue line. Official 2021 Tamiya USA material confirms ITEM 95501 in the 2021 range; HLJ/Tamiya metadata identifies the initial release month as March 2021. The 2024-09-07 Tamiya Japan release with JAN 4950344080885 is retained as a production wave of this same collector Release, not a second Release.',
    updated_at=now()
where id='aea3091e-b0aa-5258-9aea-e94bf44893c9'::uuid;

-- Fail closed if the legacy 2024 duplicate unexpectedly acquired user-owned or
-- transactional evidence after this audit. Context-only aggregate/source data is
-- explicitly migrated below.
do $$
declare
  v_blockers integer;
begin
  select
    (select count(*) from public.collection_items where release_id='91bcff13-76b4-5a09-a83b-1cfb85400b40'::uuid) +
    (select count(*) from public.collection_shares where release_id='91bcff13-76b4-5a09-a83b-1cfb85400b40'::uuid) +
    (select count(*) from public.conversations where release_id='91bcff13-76b4-5a09-a83b-1cfb85400b40'::uuid) +
    (select count(*) from public.market_candidates where resolved_release_id='91bcff13-76b4-5a09-a83b-1cfb85400b40'::uuid) +
    (select count(*) from public.price_points where release_id='91bcff13-76b4-5a09-a83b-1cfb85400b40'::uuid) +
    (select count(*) from public.market_offer_states where release_id='91bcff13-76b4-5a09-a83b-1cfb85400b40'::uuid) +
    (select count(*) from public.market_offer_history where release_id='91bcff13-76b4-5a09-a83b-1cfb85400b40'::uuid) +
    (select count(*) from public.market_value_history where release_id='91bcff13-76b4-5a09-a83b-1cfb85400b40'::uuid) +
    (select count(*) from public.marketplace_offers where release_id='91bcff13-76b4-5a09-a83b-1cfb85400b40'::uuid) +
    (select count(*) from public.marketplace_sales where release_id='91bcff13-76b4-5a09-a83b-1cfb85400b40'::uuid) +
    (select count(*) from public.wishlist_items where release_id='91bcff13-76b4-5a09-a83b-1cfb85400b40'::uuid)
  into v_blockers;

  if v_blockers <> 0 then
    raise exception 'AVANTE_JR_95501_2024_MERGE_BLOCKED_BY_DEPENDENCIES:%',v_blockers;
  end if;
end $$;

-- Preserve 2024 provenance and context on the canonical 2021 Release.
update public.release_sources
set release_id='aea3091e-b0aa-5258-9aea-e94bf44893c9'::uuid,
    notes=case
      when source_url='https://www.tamiya.com/japan/products/95501/index.html'
        then 'Production-wave provenance: official Tamiya Japan page documents the 2024-09-07 ITEM 95501 production wave. Under the current TrackDash method this supports the canonical 2021 modern 95501 Release rather than creating a separate 2024 collector Release.'
      else coalesce(notes,'') || ' TrackDash re-audit 2026-09-24: source moved from the legacy duplicate 2024 row to the canonical 2021 Release as 2024 production-wave provenance.'
    end
where release_id='91bcff13-76b4-5a09-a83b-1cfb85400b40'::uuid;

update public.market_aggregate_observations
set release_id='aea3091e-b0aa-5258-9aea-e94bf44893c9'::uuid,
    possible_release_ids=array['aea3091e-b0aa-5258-9aea-e94bf44893c9'::uuid],
    raw_payload=coalesce(raw_payload,'{}'::jsonb) || jsonb_build_object(
      'trackdash_reaudit','2026-09-24',
      'production_wave','2024',
      'canonical_release_id','aea3091e-b0aa-5258-9aea-e94bf44893c9'
    ),
    updated_at=now()
where release_id='91bcff13-76b4-5a09-a83b-1cfb85400b40'::uuid;

-- The 2021 row already has the same canonical visual. Remove the duplicate asset,
-- then remove the legacy Release; scan/signal rows cascade by FK.
delete from public.release_images
where release_id='91bcff13-76b4-5a09-a83b-1cfb85400b40'::uuid;

delete from public.product_releases
where id='91bcff13-76b4-5a09-a83b-1cfb85400b40'::uuid;

-- Provenance for the newly inserted historical Releases.
insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
select gen_random_uuid(),'d6ed44c7-86fe-4143-ae9f-8c1e6ac61ec5'::uuid,'trusted_secondary',
       'https://www.ebay.it/itm/336558994539',
       array['itemNumber','editionName','chassis','color','barcodeJAN'],date '2026-09-24',
       'Exact NOS ITEM 18507 listing identifies Avante Jr. Special Version, clear chassis/yellow tires and UPC 4950344185078.'
where not exists (
  select 1 from public.release_sources
  where release_id='d6ed44c7-86fe-4143-ae9f-8c1e6ac61ec5'::uuid
    and source_url='https://www.ebay.it/itm/336558994539'
);

insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
select gen_random_uuid(),'d6ed44c7-86fe-4143-ae9f-8c1e6ac61ec5'::uuid,'trusted_secondary',
       'https://mini-4wd.fandom.com/wiki/Avante_Jr.',
       array['itemNumber','editionName','releaseYear','chassis','color'],date '2026-09-24',
       'Historical community catalog corroborates ITEM 18507 Special Version, July 1990, Type 2, clear chassis/yellow tires. Exact day is intentionally not promoted.'
where not exists (
  select 1 from public.release_sources
  where release_id='d6ed44c7-86fe-4143-ae9f-8c1e6ac61ec5'::uuid
    and source_url='https://mini-4wd.fandom.com/wiki/Avante_Jr.'
);

insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
select gen_random_uuid(),'82690ccb-4b2c-4b4f-af8e-c8c37a859d77'::uuid,'trusted_secondary',
       'https://auctions.yahoo.co.jp/jp/auction/k1122333821',
       array['itemNumber','editionName','color'],date '2026-09-24',
       'Exact completed Yahoo Japan auction confirms ITEM 93001 Avante Jr. Champion''s Gold commercial identity. It is not used to settle the conflicting historical release year.'
where not exists (
  select 1 from public.release_sources
  where release_id='82690ccb-4b2c-4b4f-af8e-c8c37a859d77'::uuid
    and source_url='https://auctions.yahoo.co.jp/jp/auction/k1122333821'
);

insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
select gen_random_uuid(),'82690ccb-4b2c-4b4f-af8e-c8c37a859d77'::uuid,'trusted_secondary',
       'https://plaza.rakuten.co.jp/mini4museum/diary/202106120001/',
       array['itemNumber','editionName'],date '2026-09-24',
       'Collector museum documents a surviving ITEM 93001 box as purchased at the 1991 Modelers Gallery with original-goods sticker. Secondary catalogs also report 1993; TrackDash therefore leaves the canonical year unresolved.'
where not exists (
  select 1 from public.release_sources
  where release_id='82690ccb-4b2c-4b4f-af8e-c8c37a859d77'::uuid
    and source_url='https://plaza.rakuten.co.jp/mini4museum/diary/202106120001/'
);

insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
select gen_random_uuid(),'5fb4db26-c28b-48e6-a505-4fb551fdb829'::uuid,'trusted_secondary',
       'https://www.hlj.com/avante-rs-purple-special-tam92210',
       array['itemNumber','editionName','releaseYear','releaseDate','barcodeJAN'],date '2026-09-24',
       'Exact HLJ product record: TAM92210, JAN 4950344922109, release date 2009-12-17.'
where not exists (
  select 1 from public.release_sources
  where release_id='5fb4db26-c28b-48e6-a505-4fb551fdb829'::uuid
    and source_url='https://www.hlj.com/avante-rs-purple-special-tam92210'
);

insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
select gen_random_uuid(),'5fb4db26-c28b-48e6-a505-4fb551fdb829'::uuid,'trusted_secondary',
       'https://www.1999.co.jp/10190798',
       array['itemNumber','editionName','barcodeJAN','chassis','color'],date '2026-09-24',
       'Japanese specialist product page corroborates ITEM 92210 / JAN 4950344922109 and Purple Special identity.'
where not exists (
  select 1 from public.release_sources
  where release_id='5fb4db26-c28b-48e6-a505-4fb551fdb829'::uuid
    and source_url='https://www.1999.co.jp/10190798'
);

insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
select gen_random_uuid(),'5fb4db26-c28b-48e6-a505-4fb551fdb829'::uuid,'trusted_secondary',
       'https://www.rcjaz.ca/tamiya-92210-avante-rs-purple-special-mini-4wd-limited-p-90013515.html',
       array['itemNumber','editionName','image'],date '2026-09-24',
       'Exact RCJAZ ITEM page used as image provenance. Asset was independently probed through TrackDash Next/Image before publication.'
where not exists (
  select 1 from public.release_sources
  where release_id='5fb4db26-c28b-48e6-a505-4fb551fdb829'::uuid
    and source_url='https://www.rcjaz.ca/tamiya-92210-avante-rs-purple-special-mini-4wd-limited-p-90013515.html'
);

-- 2019 / modern 95501 lineage sources.
insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
select gen_random_uuid(),'7fd567d7-4d97-5323-88c4-d501efd3bdac'::uuid,'official_archive',
       'https://www.tamiya.com/japan/newstopics/2019/06/gallery2019.html',
       array['editionName','releaseYear','releaseDate','countryMarket'],date '2026-09-24',
       'Official Tamiya Modelers Gallery 2019 page: event-limited Avante Jr. Black Special reproduction goes on sale 2019-07-25.'
where not exists (
  select 1 from public.release_sources
  where release_id='7fd567d7-4d97-5323-88c4-d501efd3bdac'::uuid
    and source_url='https://www.tamiya.com/japan/newstopics/2019/06/gallery2019.html'
);

insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
select gen_random_uuid(),'7fd567d7-4d97-5323-88c4-d501efd3bdac'::uuid,'trusted_secondary',
       'https://www.ebay.com/p/19048504943',
       array['itemNumber','editionName','releaseYear','barcodeJAN'],date '2026-09-24',
       'Structured product metadata corroborates 2019 ITEM 95501 and GTIN/UPC 4950344955015.'
where not exists (
  select 1 from public.release_sources
  where release_id='7fd567d7-4d97-5323-88c4-d501efd3bdac'::uuid
    and source_url='https://www.ebay.com/p/19048504943'
);

insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
select gen_random_uuid(),'aea3091e-b0aa-5258-9aea-e94bf44893c9'::uuid,'trusted_secondary',
       'https://www.hlj.com/1-32-scale-avante-jr-black-special-tam95501',
       array['itemNumber','editionName','releaseYear','barcodeJAN','productionWave'],date '2026-09-24',
       'HLJ/Tamiya product metadata states Initial Release Month March 2021 and current JAN 4950344080885; its 2024 listing supports treating 2024 as a later production wave of the modern 95501 line.'
where not exists (
  select 1 from public.release_sources
  where release_id='aea3091e-b0aa-5258-9aea-e94bf44893c9'::uuid
    and source_url='https://www.hlj.com/1-32-scale-avante-jr-black-special-tam95501'
);

-- Exact 92210 image. 18507/93001 deliberately have no image row.
delete from public.release_images
where release_id='5fb4db26-c28b-48e6-a505-4fb551fdb829'::uuid;

insert into public.release_images(id,release_id,url,position)
values (
  gen_random_uuid(),
  '5fb4db26-c28b-48e6-a505-4fb551fdb829'::uuid,
  'https://www.rcjaz.ca/images/tamiya/mini_4wd_series/mini_4wd_car_kit/vs_chassis/b_92210.jpg',
  0
);

-- Baseline v4/r3 signals for the newly inserted Releases. This publishes no MV.
insert into public.market_release_signals(
  release_id,condition,market_regime,market_value_eur,low_eur,high_eur,
  confidence_score,confidence_label,retail_anchor_eur,active_anchor_eur,sold_anchor_eur,
  retail_source_count,active_offer_count,current_offer_count,sold_units,sold_source_count,
  sold_evidence_count,shipping_known_ratio,algorithm_version,market_method_version,computed_at
)
select pr.id,'new_complete_unbuilt','insufficient',null,null,null,0,'low',
       null,null,null,0,0,0,0,0,0,0,'r3','v4',now()
from public.product_releases pr
where pr.id in (
  'd6ed44c7-86fe-4143-ae9f-8c1e6ac61ec5'::uuid,
  '82690ccb-4b2c-4b4f-af8e-c8c37a859d77'::uuid,
  '5fb4db26-c28b-48e6-a505-4fb551fdb829'::uuid
)
on conflict (release_id,condition) do nothing;

-- Enroll/refresh scanner policy. Unique new item numbers may run eBay active;
-- reused 95501 remains parked fail-closed on item number alone.
select public.trackdash_enroll_release_market_scans('d6ed44c7-86fe-4143-ae9f-8c1e6ac61ec5'::uuid);
select public.trackdash_enroll_release_market_scans('82690ccb-4b2c-4b4f-af8e-c8c37a859d77'::uuid);
select public.trackdash_enroll_release_market_scans('5fb4db26-c28b-48e6-a505-4fb551fdb829'::uuid);
select public.trackdash_enroll_release_market_scans('7fd567d7-4d97-5323-88c4-d501efd3bdac'::uuid);
select public.trackdash_enroll_release_market_scans('aea3091e-b0aa-5258-9aea-e94bf44893c9'::uuid);

-- Recompute affected signals after the corrected minimum-current-offer runtime.
select public.trackdash_enqueue_market_recompute('2615c6b3-b497-547e-9d80-bdf9c1eca91b'::uuid,'new_complete_unbuilt');
select public.trackdash_enqueue_market_recompute('d6ed44c7-86fe-4143-ae9f-8c1e6ac61ec5'::uuid,'new_complete_unbuilt');
select public.trackdash_enqueue_market_recompute('82690ccb-4b2c-4b4f-af8e-c8c37a859d77'::uuid,'new_complete_unbuilt');
select public.trackdash_enqueue_market_recompute('5fb4db26-c28b-48e6-a505-4fb551fdb829'::uuid,'new_complete_unbuilt');
select public.trackdash_enqueue_market_recompute('7fd567d7-4d97-5323-88c4-d501efd3bdac'::uuid,'new_complete_unbuilt');
select public.trackdash_enqueue_market_recompute('aea3091e-b0aa-5258-9aea-e94bf44893c9'::uuid,'new_complete_unbuilt');

commit;
