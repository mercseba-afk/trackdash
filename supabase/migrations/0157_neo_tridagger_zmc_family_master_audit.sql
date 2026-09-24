-- Neo-Tridagger ZMC family Master audit — 2026-09-24
-- Canonical family after this audit:
-- 19409 original, 94647 Special Kit, four 2014 SK Japan "Next" prize variants
-- (92277/92278/92279/92280), and 95508 Carbon Special.
-- The 2023-08-12 95508 production run is a production wave of the 2019 collector
-- Release, not a distinct Release: same Item Number, same JAN/specification and
-- no reliable physical discriminator.
-- Parts-only body sets such as 15172 / 15480 are intentionally excluded.

begin;

-- Product-level taxonomy: ITEM 19409 is officially Fully Cowled Mini 4WD No.9.
-- Keep the legacy slug unchanged in this migration to avoid breaking bookmarked URLs;
-- canonical item identity is already 19409.
update public.products
set series='Fully Cowled Mini 4WD',
    chassis='Super 1',
    original_release_year=1996,
    updated_at=now()
where id='9793fbe8-dcf7-51c9-9f45-185194a0bc92'::uuid;

-- Original 19409: currently still listed in Tamiya Japan's Fully Cowled catalog
-- and shown as handled by Tamiya Tokyo. Historical exact day remains secondary-
-- source corroborated; no JAN is invented.
update public.product_releases
set release_type='Original',
    edition_type='original',
    production_status='active',
    discontinued=false,
    rarity='Common',
    status_checked_at=now(),
    data_source='master_reaudit_20260924',
    notes=case
      when coalesce(notes,'') like '%TrackDash Master re-audit 2026-09-24%' then notes
      else concat_ws(' ',nullif(notes,''),
        'TrackDash Master re-audit 2026-09-24: official Tamiya Japan classifies ITEM 19409 as Fully Cowled Mini 4WD Series No.9 on Super 1 chassis and still lists it in the current Fully Cowled catalog / Tamiya Tokyo handling. Historical release date 1996-03-06 remains supported by independent archival secondary sources. Barcode/JAN remains intentionally unresolved rather than inferred.')
    end,
    updated_at=now()
where id='fcaf3f82-93b5-5a52-8087-c96e771a030c'::uuid;

-- Safety gate before collapsing the duplicate legacy 2023 95508 row.
-- If any user or market data appeared on the duplicate since the audit, abort
-- rather than silently losing it; only its source/image provenance exists now.
do $$
declare
  legacy_id uuid := 'd9b9392b-d149-52a2-b862-0eafc66af7ef'::uuid;
  ref_count bigint;
begin
  select
    (select count(*) from public.collection_items where release_id=legacy_id) +
    (select count(*) from public.collection_shares where release_id=legacy_id) +
    (select count(*) from public.conversations where release_id=legacy_id) +
    (select count(*) from public.wishlist_items where release_id=legacy_id) +
    (select count(*) from public.market_aggregate_observations where release_id=legacy_id) +
    (select count(*) from public.market_candidates where resolved_release_id=legacy_id) +
    (select count(*) from public.market_estimates where release_id=legacy_id) +
    (select count(*) from public.market_monthly_source_stats where release_id=legacy_id) +
    (select count(*) from public.market_offer_history where release_id=legacy_id) +
    (select count(*) from public.market_offer_states where release_id=legacy_id) +
    (select count(*) from public.market_recompute_queue where release_id=legacy_id) +
    (select count(*) from public.market_release_ask_snapshots where release_id=legacy_id) +
    (select count(*) from public.market_release_monthly_signals where release_id=legacy_id) +
    (select count(*) from public.market_release_signals where release_id=legacy_id) +
    (select count(*) from public.market_scan_endpoints where release_id=legacy_id) +
    (select count(*) from public.market_scan_queue where release_id=legacy_id) +
    (select count(*) from public.market_scan_targets where release_id=legacy_id) +
    (select count(*) from public.market_value_history where release_id=legacy_id) +
    (select count(*) from public.marketplace_offers where release_id=legacy_id) +
    (select count(*) from public.marketplace_sales where release_id=legacy_id) +
    (select count(*) from public.price_points where release_id=legacy_id) +
    (select count(*) from public.release_identifiers where release_id=legacy_id)
  into ref_count;

  if ref_count <> 0 then
    raise exception 'Neo-Tridagger 95508 legacy 2023 row gained % non-provenance references; reconcile before merge', ref_count;
  end if;
end $$;

-- Preserve the 2023 official source as production-wave provenance on the canonical
-- 2019 Release. The duplicate exact image is removed because it is the same asset.
update public.release_sources
set release_id='73dcd8e6-82ab-54c4-961b-f4132bf6d638'::uuid,
    notes=concat_ws(' ',nullif(notes,''),
      'TrackDash 2026-09-24 normalization: this 2023-08-12 official on-sale date is retained as a production/reissue wave of the canonical 2019 ITEM 95508 Release, not as a separate collector Release.')
where release_id='d9b9392b-d149-52a2-b862-0eafc66af7ef'::uuid;

delete from public.release_images
where release_id='d9b9392b-d149-52a2-b862-0eafc66af7ef'::uuid;

delete from public.product_releases
where id='d9b9392b-d149-52a2-b862-0eafc66af7ef'::uuid;

-- Canonical Carbon Special: one Release, first production in Aug 2019 plus the
-- documented 2023-08-12 production wave. Exact 2019 day is intentionally left
-- unset because reliable secondary sources disagree by a small number of days.
update public.product_releases
set item_number='95508',
    release_type='Limited Edition',
    edition_name='Neo-Tridagger ZMC Carbon Special',
    release_year=2019,
    release_date=null,
    chassis='Super II',
    barcode_jan='4950344955084',
    color='Black',
    edition_type='limited',
    verification_status='verified',
    production_status='discontinued',
    discontinued=true,
    rarity='Uncommon',
    status_checked_at=now(),
    data_source='master_reaudit_20260924',
    notes='TrackDash Master re-audit 2026-09-24: ONE collector Release for ITEM 95508 / JAN 4950344955084. Tamiya documents the Carbon Special on Super II chassis; the original release is August 2019, while the current official page records a later 2023-08-12 on-sale/production wave under the same Item identity. No reliable physical discriminator between 2019 and 2023 is documented, so 2023 is production history rather than a separate Release. Exact first-release day remains unset because secondary sources disagree; month/year are verified. Tamiya USA lists ITEM 95508 as discontinued.',
    description='Limited Neo-Tridagger ZMC Carbon Special on the Super II chassis, with carbon-fiber-reinforced nylon body, chassis and wheels. First produced in 2019 with a later 2023 production wave under the same collector identity.',
    description_it='Edizione limitata Neo-Tridagger ZMC Carbon Special su telaio Super II, con carrozzeria, telaio e ruote in nylon rinforzato con fibra di carbonio. Prima produzione nel 2019 e successiva wave produttiva nel 2023 sotto la stessa identità da collezione.',
    updated_at=now()
where id='73dcd8e6-82ab-54c4-961b-f4132bf6d638'::uuid;

-- 94647 Special Kit: distinct 2008 commercial kit with two body shells.
insert into public.product_releases (
  id,product_id,item_number,release_type,edition_name,release_year,release_date,
  chassis,barcode_jan,color,country_market,msrp_jpy,notes,discontinued,is_original,
  rarity,data_source,edition_type,verification_status,production_status,status_checked_at,
  description,description_it
) values (
  '745ce3cb-0738-5fb8-bb1e-3d96ab1ca24a'::uuid,
  '9793fbe8-dcf7-51c9-9f45-185194a0bc92'::uuid,
  '94647','Special Edition','Neo-Tridagger ZMC Special Kit',2008,date '2008-02-23',
  'Super 1','4950344946471','Gun Metal','Japan',1100,
  'TrackDash Master re-audit 2026-09-24: distinct limited Special Kit documented in contemporary 2008 Tamiya promotional material. Includes Neo-Tridagger ZMC and Tridagger X body shells, reinforced Super 1 chassis and special Let''s & Go! packaging. Exact 2008-02-23 date is corroborated by contemporary/archive item records; JAN 4950344946471 is corroborated by Japanese specialist retail. Exact stable direct image URL was not established during the audit, so TrackDash intentionally uses the placeholder rather than a sibling image.',
  true,false,'Rare','master_reaudit_20260924','special','verified','discontinued',now(),
  'Limited 2008 Neo-Tridagger ZMC Special Kit with two interchangeable body shells on a reinforced Super 1 chassis.',
  'Kit speciale limitato Neo-Tridagger ZMC del 2008 con due carrozzerie intercambiabili su telaio Super 1 rinforzato.'
)
on conflict (id) do update set
  product_id=excluded.product_id,item_number=excluded.item_number,release_type=excluded.release_type,
  edition_name=excluded.edition_name,release_year=excluded.release_year,release_date=excluded.release_date,
  chassis=excluded.chassis,barcode_jan=excluded.barcode_jan,color=excluded.color,
  country_market=excluded.country_market,msrp_jpy=excluded.msrp_jpy,notes=excluded.notes,
  discontinued=excluded.discontinued,is_original=excluded.is_original,rarity=excluded.rarity,
  data_source=excluded.data_source,edition_type=excluded.edition_type,
  verification_status=excluded.verification_status,production_status=excluded.production_status,
  status_checked_at=excluded.status_checked_at,description=excluded.description,
  description_it=excluded.description_it,updated_at=now();

-- 2014 Neo-Tridagger ZMC Next amusement-prize family. These are four physically
-- distinguishable official Tamiya / SK Japan collector variants with autonomous
-- item numbers. Contemporary material places distribution from mid-September
-- 2014; no exact day is invented. Secondary metadata exposes a shared assortment
-- barcode on more than one color, so barcode_jan is intentionally left null.
insert into public.product_releases (
  id,product_id,item_number,release_type,edition_name,release_year,release_date,
  chassis,barcode_jan,color,country_market,notes,discontinued,is_original,rarity,
  data_source,edition_type,verification_status,production_status,status_checked_at,
  description,description_it
) values
(
  '2c3bb44f-819f-5375-80dc-ae3bc8c9c8f9'::uuid,
  '9793fbe8-dcf7-51c9-9f45-185194a0bc92'::uuid,
  '92277','Limited Edition','Neo-Tridagger ZMC Next (Navy)',2014,null,
  'Super 1',null,'Navy Blue','Japan',
  'TrackDash Master re-audit 2026-09-24: Tamiya / SK Japan amusement-prize Neo-Tridagger ZMC Next, distributed from mid-September 2014. ITEM 92277 is the Navy physical variant. A shared assortment JAN appears in secondary retailer metadata for multiple colors and is therefore not stored as a Release-specific barcode. Exact stable direct image URL was not established after audit; intentional placeholder.',
  true,false,'Rare','master_reaudit_20260924','limited','verified','discontinued',now(),
  '2014 amusement-prize Neo-Tridagger ZMC Next Navy variant on Super 1 chassis.',
  'Variante premio amusement Neo-Tridagger ZMC Next Navy del 2014 su telaio Super 1.'
),
(
  '0d31f75e-f922-567f-9a48-a824450b1ba2'::uuid,
  '9793fbe8-dcf7-51c9-9f45-185194a0bc92'::uuid,
  '92278','Limited Edition','Neo-Tridagger ZMC Next (Clear Red)',2014,null,
  'Super 1',null,'Clear Red','Japan',
  'TrackDash Master re-audit 2026-09-24: Tamiya / SK Japan amusement-prize Neo-Tridagger ZMC Next, distributed from mid-September 2014. ITEM 92278 is the Clear Red physical variant. Shared assortment barcode metadata is not treated as a Release-specific JAN. Exact stable direct image URL was not established after audit; intentional placeholder.',
  true,false,'Rare','master_reaudit_20260924','limited','verified','discontinued',now(),
  '2014 amusement-prize Neo-Tridagger ZMC Next Clear Red variant on Super 1 chassis.',
  'Variante premio amusement Neo-Tridagger ZMC Next Clear Red del 2014 su telaio Super 1.'
),
(
  '581ca254-25b2-57d3-983a-caf0fa722806'::uuid,
  '9793fbe8-dcf7-51c9-9f45-185194a0bc92'::uuid,
  '92279','Limited Edition','Neo-Tridagger ZMC Next (White)',2014,null,
  'Super 1',null,'White','Japan',
  'TrackDash Master re-audit 2026-09-24: Tamiya / SK Japan amusement-prize Neo-Tridagger ZMC Next, distributed from mid-September 2014. ITEM 92279 is the White physical variant. Suruga metadata exposes assortment JAN 4519869409009, also associated with another color, so it is intentionally not used as a Release-specific scanner identifier. Exact stable direct image URL was not established after audit; intentional placeholder.',
  true,false,'Rare','master_reaudit_20260924','limited','verified','discontinued',now(),
  '2014 amusement-prize Neo-Tridagger ZMC Next White variant on Super 1 chassis.',
  'Variante premio amusement Neo-Tridagger ZMC Next White del 2014 su telaio Super 1.'
),
(
  '19b89e91-ffe5-59d6-b213-dae1cdccfa9d'::uuid,
  '9793fbe8-dcf7-51c9-9f45-185194a0bc92'::uuid,
  '92280','Limited Edition','Neo-Tridagger ZMC Next (Smoke)',2014,null,
  'Super 1',null,'Smoke','Japan',
  'TrackDash Master re-audit 2026-09-24: Tamiya / SK Japan amusement-prize Neo-Tridagger ZMC Next, distributed from mid-September 2014. ITEM 92280 is the Smoke physical variant. Shared assortment barcode metadata is not treated as a Release-specific JAN. Exact stable direct image URL was not established after audit; intentional placeholder.',
  true,false,'Rare','master_reaudit_20260924','limited','verified','discontinued',now(),
  '2014 amusement-prize Neo-Tridagger ZMC Next Smoke variant on Super 1 chassis.',
  'Variante premio amusement Neo-Tridagger ZMC Next Smoke del 2014 su telaio Super 1.'
)
on conflict (id) do update set
  product_id=excluded.product_id,item_number=excluded.item_number,release_type=excluded.release_type,
  edition_name=excluded.edition_name,release_year=excluded.release_year,release_date=excluded.release_date,
  chassis=excluded.chassis,barcode_jan=excluded.barcode_jan,color=excluded.color,
  country_market=excluded.country_market,notes=excluded.notes,
  discontinued=excluded.discontinued,is_original=excluded.is_original,rarity=excluded.rarity,
  data_source=excluded.data_source,edition_type=excluded.edition_type,
  verification_status=excluded.verification_status,production_status=excluded.production_status,
  status_checked_at=excluded.status_checked_at,description=excluded.description,
  description_it=excluded.description_it,updated_at=now();

-- 94647 provenance.
insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
select gen_random_uuid(),'745ce3cb-0738-5fb8-bb1e-3d96ab1ca24a'::uuid,'official_archive',
       'https://www.fantasyland.it/wordpress/wp-content/themes/fantasyland/documenti/tamiya/volantini/TA_2008-02-Nbg.pdf',
       array['itemNumber','editionName','chassis','limitedStatus','bodyConfiguration'],date '2026-09-24',
       'Contemporary February 2008 Tamiya promotional flyer: ITEM 94647 Neo-Tridagger ZMC Special Kit, limited edition, Super 1 chassis, two body shells.'
where not exists (
  select 1 from public.release_sources
  where release_id='745ce3cb-0738-5fb8-bb1e-3d96ab1ca24a'::uuid
    and source_url='https://www.fantasyland.it/wordpress/wp-content/themes/fantasyland/documenti/tamiya/volantini/TA_2008-02-Nbg.pdf'
);

insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
select gen_random_uuid(),'745ce3cb-0738-5fb8-bb1e-3d96ab1ca24a'::uuid,'trusted_secondary',
       'https://joshinweb.jp/hobby/18431/4950344946471.html',
       array['itemNumber','barcodeJAN','editionName','chassis'],date '2026-09-24',
       'Exact Japanese specialist product page corroborates ITEM 94647 / JAN 4950344946471 and the two-body Special Kit configuration.'
where not exists (
  select 1 from public.release_sources
  where release_id='745ce3cb-0738-5fb8-bb1e-3d96ab1ca24a'::uuid
    and source_url='https://joshinweb.jp/hobby/18431/4950344946471.html'
);

-- Shared contemporary provenance for all four 2014 Next prize variants.
insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
select gen_random_uuid(),v.release_id,'trusted_secondary',
       'https://tamiyablog.com/2014/09/neo-tri-dagger-zmc/',
       array['editionName','releaseYear','chassis','countryMarket','distributionType'],date '2026-09-24',
       'Contemporary September 2014 report documents Tamiya / SK Japan Neo-Tridagger ZMC Next prize machines in four colors on Super 1 chassis, distributed nationwide through amusement facilities from mid-September.'
from (values
  ('2c3bb44f-819f-5375-80dc-ae3bc8c9c8f9'::uuid),
  ('0d31f75e-f922-567f-9a48-a824450b1ba2'::uuid),
  ('581ca254-25b2-57d3-983a-caf0fa722806'::uuid),
  ('19b89e91-ffe5-59d6-b213-dae1cdccfa9d'::uuid)
) as v(release_id)
where not exists (
  select 1 from public.release_sources rs
  where rs.release_id=v.release_id
    and rs.source_url='https://tamiyablog.com/2014/09/neo-tri-dagger-zmc/'
);

-- Exact variant provenance from Suruga product identities.
insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
values
(gen_random_uuid(),'2c3bb44f-819f-5375-80dc-ae3bc8c9c8f9','trusted_secondary',
 'https://www.suruga-ya.jp/product/detail/603052144',array['itemNumber','editionName','color','manufacturer'],date '2026-09-24',
 'Exact Suruga identity for Tamiya/SK Japan ITEM 92277 Next Navy.'),
(gen_random_uuid(),'0d31f75e-f922-567f-9a48-a824450b1ba2','trusted_secondary',
 'https://www.suruga-ya.jp/product/detail/603052145',array['itemNumber','editionName','color','manufacturer'],date '2026-09-24',
 'Exact Suruga identity for Tamiya/SK Japan ITEM 92278 Next Clear Red.'),
(gen_random_uuid(),'581ca254-25b2-57d3-983a-caf0fa722806','trusted_secondary',
 'https://www.suruga-ya.jp/product/detail/603052146',array['itemNumber','editionName','color','manufacturer','distributionType'],date '2026-09-24',
 'Exact Suruga identity for Tamiya/SK Japan ITEM 92279 Next White; page explicitly describes the product as an amusement-only prize.'),
(gen_random_uuid(),'19b89e91-ffe5-59d6-b213-dae1cdccfa9d','trusted_secondary',
 'https://www.suruga-ya.jp/product/detail/603052147',array['itemNumber','editionName','color','manufacturer'],date '2026-09-24',
 'Exact Suruga identity for Tamiya/SK Japan ITEM 92280 Next Smoke.')
on conflict do nothing;

-- Carbon Special provenance: preserve existing Tamiya + RCJAZ sources and add
-- official discontinued status / independent JAN + initial-month corroboration.
insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
select gen_random_uuid(),'73dcd8e6-82ab-54c4-961b-f4132bf6d638'::uuid,'official_manufacturer',
       'https://www.tamiyausa.com/shop/132-super/jr-neo-tridagger-zmc-carbon-sp/',
       array['itemNumber','editionName','chassis','productionStatus'],date '2026-09-24',
       'Tamiya USA exact ITEM 95508 page marks the Carbon Special discontinued and confirms Super II specifications.'
where not exists (
  select 1 from public.release_sources
  where release_id='73dcd8e6-82ab-54c4-961b-f4132bf6d638'::uuid
    and source_url='https://www.tamiyausa.com/shop/132-super/jr-neo-tridagger-zmc-carbon-sp/'
);

insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
select gen_random_uuid(),'73dcd8e6-82ab-54c4-961b-f4132bf6d638'::uuid,'trusted_secondary',
       'https://www.hlj.com/neo-tridagger-zmc-carbon-special-super-ii-chassis-tam95508',
       array['itemNumber','barcodeJAN','releaseYear','releaseMonth'],date '2026-09-24',
       'Exact historical HLJ product metadata corroborates ITEM 95508 / JAN 4950344955084 and the original August 2019 release period. Exact day is not promoted because secondary sources disagree.'
where not exists (
  select 1 from public.release_sources
  where release_id='73dcd8e6-82ab-54c4-961b-f4132bf6d638'::uuid
    and source_url='https://www.hlj.com/neo-tridagger-zmc-carbon-special-super-ii-chassis-tam95508'
);

-- Image audit: retain the two exact official Tamiya assets already present.
-- The five added historical/prize releases intentionally remain placeholders
-- until a stable direct exact-release image asset is verified.
delete from public.release_images
where release_id in (
  '745ce3cb-0738-5fb8-bb1e-3d96ab1ca24a'::uuid,
  '2c3bb44f-819f-5375-80dc-ae3bc8c9c8f9'::uuid,
  '0d31f75e-f922-567f-9a48-a824450b1ba2'::uuid,
  '581ca254-25b2-57d3-983a-caf0fa722806'::uuid,
  '19b89e91-ffe5-59d6-b213-dae1cdccfa9d'::uuid
);

-- Exact historical retail evidence: 94647 / 95508 RCJAZ.
insert into public.market_candidates(
  id,source_id,source_record_key,original_source,original_record_id,listing_url,title_raw,item_number_observed,
  possible_release_ids,resolved_release_id,price,currency,shipping_cost,shipping_basis,observation_type,
  condition_raw,condition,inner_bags_sealed,box_condition,is_complete,is_lot,quantity,match_confidence,
  match_evidence,evidence_group_key,observed_at,decision,reason_codes,review_notes,needs_revalidation,
  raw_payload,first_observed_at,last_observed_at
) values
(
  gen_random_uuid(),'c19c7599-69b4-4211-9ef0-f620845a689c'::uuid,
  'rcjaz:94647','rcjaz_public','94647',
  'https://www.rcjaz.ca/tamiya-neo-tridagger-zmc-special-kit-94647-p-80003593.html',
  'Tamiya 94647 Neo-Tridagger ZMC Mini 4WD Special Kit','94647',
  array['745ce3cb-0738-5fb8-bb1e-3d96ab1ca24a'::uuid],
  '745ce3cb-0738-5fb8-bb1e-3d96ab1ca24a'::uuid,
  26.91,'CAD',null,'unknown','retail_out_of_stock','Not Available','new_complete_unbuilt',
  'unknown','unknown',true,false,1,'exact',array['item_number_exact','edition_name_exact'],
  'retail:rcjaz:94647',now(),'accepted',array['OUT_OF_STOCK_HISTORICAL_ONLY'],
  'Exact RCJAZ historical product page. Retain as historical retail evidence only; it is currently Not Available and cannot define a current asking price.',
  false,jsonb_build_object('adapter','manual-reaudit-v1','availability','out_of_stock','market_region','asia_pacific'),now(),now()
),
(
  gen_random_uuid(),'c19c7599-69b4-4211-9ef0-f620845a689c'::uuid,
  'rcjaz:95508','rcjaz_public','95508',
  'https://www.rcjaz.com/tamiya-95508-neotridagger-zmc-carbon-special-superii-mini-4wd-kit-p-14563.html',
  'Tamiya 95508 Neo-Tridagger ZMC Carbon Special Super-II Mini 4WD Kit','95508',
  array['73dcd8e6-82ab-54c4-961b-f4132bf6d638'::uuid],
  '73dcd8e6-82ab-54c4-961b-f4132bf6d638'::uuid,
  29.90,'USD',null,'unknown','retail_out_of_stock','Not Available','new_complete_unbuilt',
  'unknown','unknown',true,false,1,'exact',array['item_number_exact','edition_name_exact'],
  'retail:rcjaz:95508',now(),'accepted',array['OUT_OF_STOCK_HISTORICAL_ONLY'],
  'Exact RCJAZ product page with JAN 4950344955084. Currently Not Available; historical retail reference only.',
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

-- Current-market challenge context. These observations prove real current market
-- activity but are deliberately not promoted to Europe-first public ASK because
-- Italy delivered cost and/or canonical sealed condition are unresolved.
insert into public.market_candidates(
  id,source_id,source_record_key,original_source,original_record_id,listing_url,title_raw,item_number_observed,
  possible_release_ids,resolved_release_id,price,currency,shipping_cost,shipping_basis,observation_type,
  condition_raw,condition,inner_bags_sealed,box_condition,is_complete,is_lot,quantity,match_confidence,
  match_evidence,evidence_group_key,observed_at,decision,reason_codes,review_notes,needs_revalidation,
  raw_payload,first_observed_at,last_observed_at
) values
(
  gen_random_uuid(),'709dcecf-d368-4742-b114-f00f5d7ed646'::uuid,
  'manual-ebay:306865123925:20260924','EBAY_US','306865123925',
  'https://www.ebay.com/itm/306865123925',
  'Tamiya Mini 4WD - 19409 - Neo-Tridagger - ZMC No.9 - Brand New','19409',
  array['fcaf3f82-93b5-5a52-8087-c96e771a030c'::uuid],
  'fcaf3f82-93b5-5a52-8087-c96e771a030c'::uuid,
  70.00,'USD',null,'unknown','active_listing','New','new_complete_unbuilt',
  'unknown','unknown',true,false,1,'exact',array['item_number_exact','edition_name_exact'],
  'ebay:19409:306865123925',now(),'needs_review',
  array['EXTRA_EU_LANDED_COST_UNKNOWN'],
  'Exact current new eBay listing. Search crawl shows non-Italy shipping context, so Italy landed cost is unresolved and this must not define the Europe-first public minimum.',
  false,jsonb_build_object('adapter','manual-empty-market-challenge-v1','market_region','north_america','landed_cost_italy','unknown'),now(),now()
),
(
  gen_random_uuid(),'38859ae9-7071-4b18-95b2-035fed8e4eed'::uuid,
  'mercari-search:94647:20260924','MERCARI_JP',null,
  'https://jp.mercari.com/search?keyword=94647%20%E3%83%8D%E3%82%AA%E3%83%88%E3%83%A9%E3%82%A4%E3%83%80%E3%82%AC%E3%83%BC',
  'タミヤ フルカウルミニ四駆 スペシャルキット No.5 ネオトライダガーZMC 94647','94647',
  array['745ce3cb-0738-5fb8-bb1e-3d96ab1ca24a'::uuid],
  '745ce3cb-0738-5fb8-bb1e-3d96ab1ca24a'::uuid,
  8250,'JPY',null,'unknown','active_listing','Search result condition not fully exposed','unknown',
  'unknown','unknown',true,false,1,'exact',array['item_number_exact','edition_name_exact'],
  'mercari-search:94647:20260924',now(),'needs_review',
  array['CONDITION_UNRESOLVED','EXTRA_EU_LANDED_COST_UNKNOWN','SEARCH_RESULT_ONLY'],
  'Current exact Mercari search observation. Condition and Italy landed cost remain unresolved; market activity context only.',
  false,jsonb_build_object('adapter','manual-empty-market-challenge-v1','market_region','japan','search_result_only',true,'landed_cost_italy','unknown'),now(),now()
),
(
  gen_random_uuid(),'38859ae9-7071-4b18-95b2-035fed8e4eed'::uuid,
  'mercari:92278:m15829754498','MERCARI_JP','m15829754498',
  'https://jp.mercari.com/item/m15829754498',
  'ネオトライダガーZMC ネクスト(クリヤーレッド) 未組立・非売品','92278',
  array['0d31f75e-f922-567f-9a48-a824450b1ba2'::uuid],
  '0d31f75e-f922-567f-9a48-a824450b1ba2'::uuid,
  8599,'JPY',null,'included_unknown','active_listing','Unassembled / prize item','unknown',
  'unknown','unknown',true,false,1,'exact',array['item_number_exact','edition_name_exact','color_variant_match'],
  'mercari:92278:m15829754498',now(),'needs_review',
  array['SEALED_STATE_UNRESOLVED','EXTRA_EU_LANDED_COST_UNKNOWN'],
  'Exact current Mercari Japan ITEM 92278 listing. Unassembled condition is stated, but sealed/inner-bag state and Italy landed cost are unresolved; current market context only.',
  false,jsonb_build_object('adapter','manual-empty-market-challenge-v1','market_region','japan','domestic_shipping_included',true,'landed_cost_italy','unknown'),now(),now()
),
(
  gen_random_uuid(),'38859ae9-7071-4b18-95b2-035fed8e4eed'::uuid,
  'mercari:92280:m62676061261','MERCARI_JP','m62676061261',
  'https://jp.mercari.com/item/m62676061261',
  'ネオトライダガーZMC ネクスト（スモーク）未組立・非売品','92280',
  array['19b89e91-ffe5-59d6-b213-dae1cdccfa9d'::uuid],
  '19b89e91-ffe5-59d6-b213-dae1cdccfa9d'::uuid,
  9699,'JPY',null,'included_unknown','active_listing','Unassembled / prize item','unknown',
  'unknown','unknown',true,false,1,'exact',array['item_number_exact','edition_name_exact','color_variant_match'],
  'mercari:92280:m62676061261',now(),'needs_review',
  array['SEALED_STATE_UNRESOLVED','EXTRA_EU_LANDED_COST_UNKNOWN'],
  'Exact current Mercari Japan ITEM 92280 listing. Unassembled condition is stated, but sealed/inner-bag state and Italy landed cost are unresolved; current market context only.',
  false,jsonb_build_object('adapter','manual-empty-market-challenge-v1','market_region','japan','domestic_shipping_jpy',450,'landed_cost_italy','unknown'),now(),now()
),
(
  gen_random_uuid(),'709dcecf-d368-4742-b114-f00f5d7ed646'::uuid,
  'manual-ebay:256570136882:20260924','EBAY_US','256570136882',
  'https://www.ebay.com/itm/256570136882',
  'Tamiya Mini 4WD - 95508 - Neo-Tridagger ZMC Carbon Special','95508',
  array['73dcd8e6-82ab-54c4-961b-f4132bf6d638'::uuid],
  '73dcd8e6-82ab-54c4-961b-f4132bf6d638'::uuid,
  69.99,'USD',null,'unknown','active_listing','New','new_complete_unbuilt',
  'unknown','unknown',true,false,1,'exact',array['item_number_exact','edition_name_exact'],
  'ebay:95508:256570136882',now(),'needs_review',
  array['EXTRA_EU_LANDED_COST_UNKNOWN'],
  'Exact current new listing; listing history reports substantial sell-through, but TrackDash does not convert listing sold-count into granular SOLD transactions. Italy delivered cost is unresolved, so this remains current global ASK context pending the canonical eBay worker.',
  false,jsonb_build_object('adapter','manual-empty-market-challenge-v1','market_region','north_america','landed_cost_italy','unknown','listing_reports_sold_count',29),now(),now()
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

-- Explicit Empty Market Challenge notes for the two 2014 colors for which the
-- current audit found only sold-out/used/opened market context, not a publishable
-- canonical new current offer.
update public.product_releases
set notes=case
  when coalesce(notes,'') like '%Empty Market Challenge 2026-09-24%' then notes
  else concat_ws(' ',nullif(notes,''),
    case item_number
      when '92277' then 'Empty Market Challenge 2026-09-24: exact current/specialist searches found sold-out or opened/unassembled Japanese examples, but no valid current sealed/new offer with Italy-effective cost. Do not invent a public asking price.'
      when '92279' then 'Empty Market Challenge 2026-09-24: exact Suruga identity/current search is sold out and available observations are used/secondary-market context; no valid current sealed/new Europe-effective offer established. Do not invent a public asking price.'
      else null
    end)
end,
updated_at=now()
where item_number in ('92277','92279')
  and product_id='9793fbe8-dcf7-51c9-9f45-185194a0bc92'::uuid;

-- Enrollment: all seven canonical Releases enter the adaptive market workers.
select public.trackdash_enroll_release_market_scans(id)
from public.product_releases
where product_id='9793fbe8-dcf7-51c9-9f45-185194a0bc92'::uuid;

-- Exact RCJAZ endpoints where a true exact product page exists.
select public.trackdash_enroll_rcjaz_endpoint(
  '745ce3cb-0738-5fb8-bb1e-3d96ab1ca24a'::uuid,
  'https://www.rcjaz.ca/tamiya-neo-tridagger-zmc-special-kit-94647-p-80003593.html'
);
select public.trackdash_enroll_rcjaz_endpoint(
  '73dcd8e6-82ab-54c4-961b-f4132bf6d638'::uuid,
  'https://www.rcjaz.com/tamiya-95508-neotridagger-zmc-carbon-special-superii-mini-4wd-kit-p-14563.html'
);

-- Initial canonical recompute after identity/evidence normalization.
select public.trackdash_enqueue_market_recompute(id,'new_complete_unbuilt')
from public.product_releases
where product_id='9793fbe8-dcf7-51c9-9f45-185194a0bc92'::uuid;

-- Force this family to the front of the next canonical Admin/cron scan batches.
-- Do not fake success timestamps.
update public.market_scan_queue q
set next_scan_at=now(),
    priority=greatest(q.priority,120),
    locked_until=null,
    updated_at=now()
where q.release_id in (
  select id from public.product_releases
  where product_id='9793fbe8-dcf7-51c9-9f45-185194a0bc92'::uuid
);

commit;
