-- Hotshot Jr. family Master re-audit — 2026-09-25
-- Rebuilds the legacy two-row family under the current TrackDash collector-
-- release method. Exact identity first; unresolved dates/images remain fail-closed.
--
-- Canonical collector family after this migration: 14 Releases.
-- A reported 2012 Momoi event bundle remains documented as unresolved context
-- and is intentionally NOT canonicalized as a Release yet.

begin;

update public.products
set canonical_item_number='18001',
    canonical_release_id='aae2febe-da13-55d0-a5c7-3151c2b16778'::uuid,
    original_release_year=1986,
    series='Racing Mini 4WD',
    chassis='Type 1',
    description='Hotshot Jr. is the founding Racing Mini 4WD family, beginning with the 1986 Type 1 kit and later spanning memorial, anniversary, MS-chassis, collaboration and regional limited editions. TrackDash separates first-production packaging and later special editions only where collector identity is materially distinguishable.',
    description_it='Hotshot Jr. è la famiglia fondativa delle Racing Mini 4WD: nasce nel 1986 con il telaio Type 1 e prosegue con ristampe Memorial e Anniversary, versione MS e diverse collaborazioni/limited regionali. TrackDash separa la primissima produzione e le edizioni successive solo quando l’identità collezionistica è materialmente distinguibile.',
    metadata=coalesce(metadata,'{}'::jsonb) || jsonb_build_object(
      'catalog_audit','2026-09-25',
      'canonical_release_count',14,
      'unresolved_context',jsonb_build_array(
        '2012 Japan Cup Momoi Special Ver.2 special-kit/bundle: reported gold-plated body + clear-pink body + purple-plated wheels; not canonicalized until exact autonomous packaging/product identity is established.'
      )
    ),
    updated_at=now()
where id='a8dddf2c-ba7d-56e8-9816-adde32fd8907'::uuid;

-- Existing canonical 18001 becomes the later/standard 1986 production identity.
update public.product_releases
set item_number='18001',
    release_type='Original',
    edition_name='Hotshot Jr. — 1986 Standard / Later Production',
    release_year=1986,
    release_date=null,
    chassis='Type 1',
    barcode_jan='4950344180011',
    color='Red / white wheels (later production)',
    country_market='Global / Japan',
    notes='TrackDash Master re-audit 2026-09-25: official Tamiya ITEM 18001 / Racer Mini 4WD No.1, Type 1, 1986. Collector evidence distinguishes the earliest Oshika KIT No.2901 production (white gears, gray/silver wheels, copper-colored shafts and early packaging) from later 18001 production. This row represents the standard/later 18001 collector identity. JAN 4950344180011 is verified on specialist retail metadata.',
    discontinued=false,
    is_original=true,
    data_source='master_reaudit_20260925',
    edition_type='original',
    verification_status='verified',
    production_status='active',
    status_checked_at=now(),
    description='The standard/later-production 1986 Hotshot Jr. ITEM 18001 on Type 1 chassis.',
    description_it='Hotshot Jr. standard / produzione successiva del 1986, ITEM 18001 su telaio Type 1.',
    updated_at=now()
where id='aae2febe-da13-55d0-a5c7-3151c2b16778'::uuid;

-- Existing 1998 row is real: contemporary timeline + Mandarake identify the
-- December 1998 Memorial / limited reissue.
update public.product_releases
set item_number='18001',
    release_type='Memorial Reissue',
    edition_name='Hotshot Jr. — 1998 Memorial Edition (Limited Reissue)',
    release_year=1998,
    release_date=null,
    chassis='Type 1',
    color='Red / Memorial Edition packaging',
    country_market='Japan',
    notes='TrackDash Master re-audit 2026-09-25: verified December 1998 Memorial Edition / 限定復刻版. TEA-League contemporary historical timeline lists Hotshot Jr. among the December 1998 Memorial reproductions; Mandarake independently identifies the limited reissue as 18001 and documents package/parts differences from the original. Exact day and JAN remain unresolved.',
    discontinued=true,
    is_original=false,
    data_source='master_reaudit_20260925',
    edition_type='reissue',
    verification_status='verified',
    production_status='discontinued',
    status_checked_at=now(),
    description='December 1998 limited Memorial reproduction of Hotshot Jr., retaining ITEM 18001.',
    description_it='Ristampa Memorial limitata di dicembre 1998 della Hotshot Jr., con ITEM 18001.',
    updated_at=now()
where id='24ecf550-ce34-5bed-a192-31ec8e857ea6'::uuid;

-- Add the collector-distinct first production and documented specials.
insert into public.product_releases(
  product_id,item_number,release_type,edition_name,release_year,release_date,chassis,barcode_jan,color,
  country_market,msrp_jpy,notes,discontinued,is_original,rarity,data_source,edition_type,
  verification_status,production_status,status_checked_at,description,description_it
) values
(
  'a8dddf2c-ba7d-56e8-9816-adde32fd8907'::uuid,'2901','First Production',
  'Hotshot Jr. — 1986 First Production (Oshika KIT No.2901)',1986,date '1986-06-16','Type 1',null,
  'Red / gray-silver wheels / first-production parts','Japan',600,
  'Collector-distinct earliest Oshika production. Mandarake separately values KIT No.2901 and specifies white gears, gray wheels, center band and copper-colored shafts. 2901 is a historical KIT number rather than a later five-digit ITEM code. Kept separate because packaging/parts and collector market materially differ from later 18001 production.',
  true,false,null,'master_reaudit_20260925','original','verified','discontinued',now(),
  'Earliest 1986 Oshika first-production Hotshot Jr., historical KIT No.2901.',
  'Primissima produzione Oshika del 1986, Hotshot Jr. con storico KIT No.2901.'
),
(
  'a8dddf2c-ba7d-56e8-9816-adde32fd8907'::uuid,'2951','Limited Special',
  'Hotshot Jr. Special — Clear Chassis Version',null,null,'Type 1',null,
  'Red body / clear Type 1 chassis','Japan',null,
  'Exact limited ITEM/KIT 2951 Hotshot Jr. Special with clear chassis is verified by Mandarake collector-market documentation. Secondary dating conflicts around the earliest limited-production period; UNKNOWN > INVENTED, so canonical release_year/date remain NULL.',
  true,false,null,'master_reaudit_20260925','special','verified','discontinued',now(),
  'Historical Hotshot Jr. Special with clear Type 1 chassis, code 2951; exact year unresolved.',
  'Storica Hotshot Jr. Special con telaio Type 1 trasparente, codice 2951; anno esatto non risolto.'
),
(
  'a8dddf2c-ba7d-56e8-9816-adde32fd8907'::uuid,'94596','Anniversary',
  'Hotshot Jr. — Mini 4WD 25th Anniversary',2007,date '2007-03-24','Type 1','4950344945962',
  'Red / anniversary packaging','Japan',945,
  'Limited 25th Anniversary reproduction. Contemporary TEA-League documentation gives 2007-03-24, ITEM 94596 and JPY 945; specialist product metadata corroborates JAN 4950344945962.',
  true,false,null,'master_reaudit_20260925','anniversary','verified','discontinued',now(),
  '2007 Mini 4WD 25th Anniversary limited Hotshot Jr. reproduction.',
  'Ristampa limitata Hotshot Jr. per il 25° anniversario Mini 4WD, 2007.'
),
(
  'a8dddf2c-ba7d-56e8-9816-adde32fd8907'::uuid,'18624','MS Chassis Version',
  'Hotshot Jr. — MS Chassis',2008,date '2008-05-31','MS','4950344186242',
  'Red / black MS chassis / white wheels','Global / Japan',null,
  'Official Tamiya ITEM 18624, Mini 4WD PRO No.24, released 2008-05-31 on MS chassis. JAN 4950344186242 is independently corroborated by structured product metadata.',
  false,false,null,'master_reaudit_20260925','other','verified','active',now(),
  'Official 2008 Hotshot Jr. redesign for the MS chassis, ITEM 18624.',
  'Versione ufficiale Hotshot Jr. del 2008 ridisegnata per telaio MS, ITEM 18624.'
),
(
  'a8dddf2c-ba7d-56e8-9816-adde32fd8907'::uuid,'94680','Collaboration Special',
  'Hotshot Jr. — Halko Momoi Special Ver.2',2008,date '2008-11-29','MS','4950344946808',
  'Orange body / fluorescent orange MS / gold wheels','Japan',1365,
  'Contemporary product announcement confirms ITEM 94680 and 2008-11-29 release; specialist retailers corroborate JAN 4950344946808. Distinct collaboration packaging and specification.',
  true,false,null,'master_reaudit_20260925','special','verified','discontinued',now(),
  '2008 Halko Momoi Special Ver.2 collaboration, ITEM 94680.',
  'Collaborazione Halko Momoi Special Ver.2 del 2008, ITEM 94680.'
),
(
  'a8dddf2c-ba7d-56e8-9816-adde32fd8907'::uuid,null,'Event Special',
  'Hotshot Jr. — Halko Momoi Special Ver.2 Gold Plated Event Edition',2009,null,'MS',null,
  'Gold-plated body','Japan',1575,
  'Distinct event-only special kit documented at Summer GP / Modelers Gallery 2009 and Wonder Festival 2009 Summer. No autonomous Tamiya ITEM number has been established; do not inherit/invent 94680 for scanner identity. Later event sales are production/event waves of this same gold-plated edition.',
  true,false,null,'master_reaudit_20260925','special','verified','discontinued',now(),
  '2009 event-only gold-plated Hotshot Jr. Momoi Special Ver.2 variant.',
  'Variante evento 2009 con carrozzeria gold plated della Hotshot Jr. Momoi Special Ver.2.'
),
(
  'a8dddf2c-ba7d-56e8-9816-adde32fd8907'::uuid,null,'Event Special',
  'Hotshot Jr. — Halko Momoi Special Ver.2 Orange Plated Event Edition',2009,date '2009-07-26','MS',null,
  'Orange-plated body','Japan',1575,
  'Distinct event-only special kit documented as sold at Wonder Festival 2009 Summer on 2009-07-26. No autonomous Tamiya ITEM number has been established; item_number intentionally remains NULL.',
  true,false,null,'master_reaudit_20260925','special','verified','discontinued',now(),
  'Wonder Festival 2009 Summer orange-plated Hotshot Jr. Momoi Special Ver.2.',
  'Hotshot Jr. Momoi Special Ver.2 con carrozzeria orange plated, Wonder Festival 2009 Summer.'
),
(
  'a8dddf2c-ba7d-56e8-9816-adde32fd8907'::uuid,'94687','Collaboration Special',
  'Hotshot Jr. — Yomiuri Giants Special',2009,date '2009-06-27','MS','4950344946877',
  'Giants black/orange team specification','Japan',1365,
  'Contemporary June 2009 announcement confirms 2009-06-27 release and ITEM 94687; Hobby Search corroborates JAN 4950344946877.',
  true,false,null,'master_reaudit_20260925','special','verified','discontinued',now(),
  '2009 Yomiuri Giants collaboration Hotshot Jr. on MS chassis.',
  'Hotshot Jr. collaborazione Yomiuri Giants del 2009 su telaio MS.'
),
(
  'a8dddf2c-ba7d-56e8-9816-adde32fd8907'::uuid,'94688','Collaboration Special',
  'Hotshot Jr. — Hanshin Tigers Special',2009,date '2009-06-27','MS','4950344946884',
  'Tigers black/yellow team specification','Japan',1365,
  'Contemporary June 2009 announcement confirms 2009-06-27 release and ITEM 94688; Hobby Search corroborates JAN 4950344946884.',
  true,false,null,'master_reaudit_20260925','special','verified','discontinued',now(),
  '2009 Hanshin Tigers collaboration Hotshot Jr. on MS chassis.',
  'Hotshot Jr. collaborazione Hanshin Tigers del 2009 su telaio MS.'
),
(
  'a8dddf2c-ba7d-56e8-9816-adde32fd8907'::uuid,'92435','Regional Limited',
  'Hotshot Jr. — SMC Mall Limited Edition',2021,null,'MS','4950344924356',
  'Clear orange body / yellow MS chassis','South Korea',null,
  'Korea SMC Mall limited edition based on ITEM 18624. SMC Mall and European specialist retail pages verify product identity; EAN/JAN 4950344924356 is independently corroborated. Secondary history places first sale in 2021; exact day is not promoted here.',
  false,false,null,'master_reaudit_20260925','limited','verified','active',now(),
  'South Korea SMC Mall limited Hotshot Jr. on MS chassis, ITEM 92435.',
  'Hotshot Jr. limited SMC Mall Korea su telaio MS, ITEM 92435.'
),
(
  'a8dddf2c-ba7d-56e8-9816-adde32fd8907'::uuid,null,'Official Collaboration',
  'Hotshot Jr. — Kashima Antlers Special Edition',2023,date '2023-07-14','MS',null,
  'Kashima Antlers club-color sleeve/stickers','Japan',2420,
  'Official Kashima Antlers × Tamiya collaboration based on the Hotshot Jr. MS kit. Official club announcement: sale 2023-07-14, 500 units, JPY 2,420. No autonomous Tamiya ITEM/JAN established; item_number intentionally NULL.',
  true,false,null,'master_reaudit_20260925','special','verified','discontinued',now(),
  'Official 500-unit Kashima Antlers × Tamiya Hotshot Jr. collaboration from 2023.',
  'Collaborazione ufficiale Kashima Antlers × Tamiya Hotshot Jr. del 2023, 500 esemplari.'
),
(
  'a8dddf2c-ba7d-56e8-9816-adde32fd8907'::uuid,null,'Official Collaboration',
  'Hotshot Jr. — Urawa Red Diamonds Edition',2023,date '2023-09-14','MS',null,
  'Urawa Reds club-color sleeve/stickers','Japan',2420,
  'Official Urawa Red Diamonds × Tamiya collaboration. Official club announcement: sale 2023-09-14, 800 units, JPY 2,420, original club-color sleeve and body stickers. No autonomous Tamiya ITEM/JAN established; item_number intentionally NULL.',
  true,false,null,'master_reaudit_20260925','special','verified','discontinued',now(),
  'Official 800-unit Urawa Red Diamonds × Tamiya Hotshot Jr. collaboration from 2023.',
  'Collaborazione ufficiale Urawa Red Diamonds × Tamiya Hotshot Jr. del 2023, 800 esemplari.'
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
  updated_at=now();

-- Provenance helper: use exact edition name to resolve IDs after idempotent insert/update.
insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
select gen_random_uuid(),r.id,s.source_type,s.source_url,s.verified_fields,date '2026-09-25',s.notes
from (
  values
  ('Hotshot Jr. — 1986 First Production (Oshika KIT No.2901)','trusted_secondary','https://www.mandarake.co.jp/kaitori/cat/car/miniyonku.php',array['editionName','itemNumber','color'], 'Mandarake separately lists Oshika first-production KIT 2901 and its first-batch parts specification.'),
  ('Hotshot Jr. — 1986 Standard / Later Production','official_manufacturer','https://www.tamiya.com/japan/products/18001/index.html',array['itemNumber','editionName','chassis'], 'Official Tamiya ITEM 18001 / Racer Mini 4WD No.1 product page.'),
  ('Hotshot Jr. — 1986 Standard / Later Production','official_archive','https://www.tamiya.com/cms/japan/mini4wd/jr_news/jr_news16/pdf/000191.pdf',array['releaseYear','itemNumber','chassis'], 'Official Tamiya historical retrospective: ITEM 18001, Type 1, 1986.'),
  ('Hotshot Jr. — 1986 Standard / Later Production','trusted_secondary','https://www.1999.co.jp/10087216',array['barcodeJAN'], 'Hobby Search corroborates JAN 4950344180011 for ITEM 18001.'),
  ('Hotshot Jr. Special — Clear Chassis Version','trusted_secondary','https://www.mandarake.co.jp/kaitori/cat/car/miniyonku.php',array['itemNumber','editionName','color'], 'Mandarake collector list separately identifies limited 2951 Hotshot Jr. Special with clear chassis.'),
  ('Hotshot Jr. — 1998 Memorial Edition (Limited Reissue)','trusted_secondary','https://www.tea-league.com/mt/tea/archives/2000/01/19821999.html',array['editionName','releaseYear'], 'Historical timeline lists Hotshot Jr. Memorial Edition among December 1998 limited reproductions.'),
  ('Hotshot Jr. — 1998 Memorial Edition (Limited Reissue)','trusted_secondary','https://k.mandarake.co.jp/auction/item/itemInfoEn.html?index=769459',array['itemNumber','editionName','releaseYear'], 'Mandarake closed auction identifies 1998 limited reissue retaining 18001 and documents packaging/parts differences.'),
  ('Hotshot Jr. — Mini 4WD 25th Anniversary','trusted_secondary','https://www.tea-league.com/mt/tea/archives/2007/03/jr25_1.html',array['itemNumber','editionName','releaseDate'], 'Contemporary release documentation: 2007-03-24, ITEM 94596.'),
  ('Hotshot Jr. — Mini 4WD 25th Anniversary','trusted_secondary','https://www.rcjaz.com/tamiya-94596-132-hotshot-jr-25th-anniversary-model-kit-p-8868.html',array['itemNumber','editionName','chassis'], 'Exact RCJAZ product page corroborates ITEM 94596 / 25th Anniversary.'),
  ('Hotshot Jr. — MS Chassis','official_manufacturer','https://www.tamiya.com/japan/products/18624/index.html',array['itemNumber','editionName','releaseDate','chassis'], 'Official Tamiya: ITEM 18624, released 2008-05-31, MS chassis.'),
  ('Hotshot Jr. — Halko Momoi Special Ver.2','trusted_secondary','https://www.tea-league.com/mt/tea/archives/2008/11/special_ver2_jrms.html',array['itemNumber','editionName','releaseDate'], 'Contemporary announcement: ITEM 94680, release 2008-11-29.'),
  ('Hotshot Jr. — Halko Momoi Special Ver.2','trusted_secondary','https://www.1999.co.jp/10095969',array['itemNumber','barcodeJAN'], 'Hobby Search corroborates ITEM 94680 / JAN 4950344946808.'),
  ('Hotshot Jr. — Halko Momoi Special Ver.2 Gold Plated Event Edition','trusted_secondary','https://www.tea-league.com/mt/tea/archives/2007/03/special_15.html',array['editionName','releaseYear','color'], 'TEA-League documents Gold Plated special-kit sales at Summer GP/Modelers Gallery and Wonder Festival 2009.'),
  ('Hotshot Jr. — Halko Momoi Special Ver.2 Orange Plated Event Edition','trusted_secondary','https://www.tea-league.com/mt/tea/archives/2007/03/special_15.html',array['editionName','releaseDate','color'], 'TEA-League documents Orange Plated special kit at Wonder Festival 2009 Summer on 2009-07-26.'),
  ('Hotshot Jr. — Yomiuri Giants Special','trusted_secondary','https://www.tea-league.com/mt/tea/archives/2009/06/index.php?page=all',array['itemNumber','editionName','releaseDate'], 'Contemporary June 2009 announcement: ITEM 94687, release 2009-06-27.'),
  ('Hotshot Jr. — Yomiuri Giants Special','trusted_secondary','https://www.1999.co.jp/10088684',array['itemNumber','barcodeJAN'], 'Hobby Search corroborates JAN 4950344946877.'),
  ('Hotshot Jr. — Hanshin Tigers Special','trusted_secondary','https://www.tea-league.com/mt/tea/archives/2009/06/index.php?page=all',array['itemNumber','editionName','releaseDate'], 'Contemporary June 2009 announcement: ITEM 94688, release 2009-06-27.'),
  ('Hotshot Jr. — Hanshin Tigers Special','trusted_secondary','https://www.1999.co.jp/10088685',array['itemNumber','barcodeJAN'], 'Hobby Search corroborates JAN 4950344946884.'),
  ('Hotshot Jr. — SMC Mall Limited Edition','trusted_secondary','https://smc-mall.com/product/%ED%83%80%EB%AF%B8%EC%95%BC-%EB%AF%B8%EB%8B%88%EC%B9%B4-92435-hotshot-jr-smcmall-limited-edition-tamiya-mini4wd/2456',array['itemNumber','editionName','countryMarket'], 'Exact SMC Mall Korea product page for the standard Tamiya edition; merchant-made Aurora coating is explicitly excluded from canonical Releases.'),
  ('Hotshot Jr. — SMC Mall Limited Edition','trusted_secondary','https://www.modellismogianni.it/products/TAM92435_offerta-prendi-2-paghi-1-hotshot-jr-smc-mall-limited-telaio-ms-mini4wd-tamiya.php',array['itemNumber','barcodeJAN','chassis'], 'European specialist retail corroborates ITEM 92435 / JAN 4950344924356 and MS specification.'),
  ('Hotshot Jr. — Kashima Antlers Special Edition','official_archive','https://www.antlers.co.jp/blogs/news/94622',array['editionName','releaseDate','msrp','countryMarket'], 'Official Kashima Antlers announcement: Tamiya collaboration, 2023-07-14, JPY 2,420, 500 units.'),
  ('Hotshot Jr. — Urawa Red Diamonds Edition','official_archive','https://www.urawa-reds.co.jp/clubinfo/203696/',array['editionName','releaseDate','msrp','countryMarket'], 'Official Urawa Reds announcement: Tamiya collaboration, 2023-09-14, JPY 2,420, 800 units.')
) as s(edition_name,source_type,source_url,verified_fields,notes)
join public.product_releases r
  on r.product_id='a8dddf2c-ba7d-56e8-9816-adde32fd8907'::uuid
 and r.edition_name=s.edition_name
where not exists (
  select 1 from public.release_sources existing
  where existing.release_id=r.id and existing.source_url=s.source_url
);

-- Exact Release-level images. Special packages stay placeholder until an exact,
-- stable image URL is independently validated.
delete from public.release_images
where release_id in (
  'aae2febe-da13-55d0-a5c7-3151c2b16778'::uuid,
  (select id from public.product_releases where product_id='a8dddf2c-ba7d-56e8-9816-adde32fd8907'::uuid and edition_name='Hotshot Jr. — MS Chassis' limit 1),
  (select id from public.product_releases where product_id='a8dddf2c-ba7d-56e8-9816-adde32fd8907'::uuid and edition_name='Hotshot Jr. — Mini 4WD 25th Anniversary' limit 1)
);

insert into public.release_images(id,release_id,url,position)
values
(gen_random_uuid(),'aae2febe-da13-55d0-a5c7-3151c2b16778'::uuid,'https://www.tamiya.com/japan_contents/img/usr/item/1/18001/18001_1.jpg',0),
(gen_random_uuid(),(select id from public.product_releases where product_id='a8dddf2c-ba7d-56e8-9816-adde32fd8907'::uuid and edition_name='Hotshot Jr. — MS Chassis' limit 1),'https://www.tamiya.com/japan_contents/img/usr/item/1/18624/18624_1.jpg',0),
(gen_random_uuid(),(select id from public.product_releases where product_id='a8dddf2c-ba7d-56e8-9816-adde32fd8907'::uuid and edition_name='Hotshot Jr. — Mini 4WD 25th Anniversary' limit 1),'https://www.tea-league.com/web/rox200703022.jpg',0);

-- Release identifiers for exact barcode/JAN resolution.
insert into public.release_identifiers(id,release_id,scheme,value,market,is_primary,verification_status,source_url,checked_at)
select gen_random_uuid(),r.id,'JAN',v.jan,v.market,true,'verified',v.source_url,now()
from (
 values
 ('Hotshot Jr. — 1986 Standard / Later Production','4950344180011','JP','https://www.1999.co.jp/10087216'),
 ('Hotshot Jr. — Mini 4WD 25th Anniversary','4950344945962','JP','https://www.rcjaz.com/tamiya-94596-132-hotshot-jr-25th-anniversary-model-kit-p-8868.html'),
 ('Hotshot Jr. — MS Chassis','4950344186242','JP','https://www.tamiya.com/japan/products/18624/index.html'),
 ('Hotshot Jr. — Halko Momoi Special Ver.2','4950344946808','JP','https://www.1999.co.jp/10095969'),
 ('Hotshot Jr. — Yomiuri Giants Special','4950344946877','JP','https://www.1999.co.jp/10088684'),
 ('Hotshot Jr. — Hanshin Tigers Special','4950344946884','JP','https://www.1999.co.jp/10088685'),
 ('Hotshot Jr. — SMC Mall Limited Edition','4950344924356','KR','https://www.modellismogianni.it/products/TAM92435_offerta-prendi-2-paghi-1-hotshot-jr-smc-mall-limited-telaio-ms-mini4wd-tamiya.php')
) as v(edition_name,jan,market,source_url)
join public.product_releases r
  on r.product_id='a8dddf2c-ba7d-56e8-9816-adde32fd8907'::uuid and r.edition_name=v.edition_name
on conflict (release_id,scheme,value,market) do update set
 is_primary=excluded.is_primary,
 verification_status=excluded.verification_status,
 source_url=excluded.source_url,
 checked_at=excluded.checked_at;

-- Baseline v4/r3 signals: never invent Market Value.
insert into public.market_release_signals(
  release_id,condition,market_regime,market_value_eur,low_eur,high_eur,
  confidence_score,confidence_label,retail_anchor_eur,active_anchor_eur,sold_anchor_eur,
  retail_source_count,active_offer_count,current_offer_count,sold_units,sold_source_count,
  sold_evidence_count,shipping_known_ratio,algorithm_version,market_method_version,computed_at
)
select r.id,'new_complete_unbuilt','insufficient',null,null,null,0,'low',
       null,null,null,0,0,0,0,0,0,0,'r3','v4',now()
from public.product_releases r
where r.product_id='a8dddf2c-ba7d-56e8-9816-adde32fd8907'::uuid
on conflict (release_id,condition) do nothing;

-- Enroll all Releases in the source plan. Shared/no-ITEM identities are
-- automatically parked for eBay by the global fail-closed enrollment function.
select public.trackdash_enroll_release_market_scans(r.id)
from public.product_releases r
where r.product_id='a8dddf2c-ba7d-56e8-9816-adde32fd8907'::uuid;

-- Historical four-digit KIT codes are too generic for unattended eBay matching.
update public.market_scan_targets t
set enabled=false,next_scan_at='2099-01-01 00:00:00+00'::timestamptz,updated_at=now()
from public.price_sources ps, public.product_releases r
where t.source_id=ps.id and t.release_id=r.id
  and ps.slug='ebay_active_public'
  and r.product_id='a8dddf2c-ba7d-56e8-9816-adde32fd8907'::uuid
  and r.item_number in ('2901','2951');

update public.market_scan_queue q
set enabled=false,next_scan_at='2099-01-01 00:00:00+00'::timestamptz,updated_at=now()
from public.price_sources ps, public.product_releases r
where q.source_id=ps.id and q.release_id=r.id
  and ps.slug='ebay_active_public'
  and r.product_id='a8dddf2c-ba7d-56e8-9816-adde32fd8907'::uuid
  and r.item_number in ('2901','2951');

-- Prioritize the six safe unique modern item numbers for the first family scan.
update public.market_scan_targets t
set priority=130,next_scan_at='2000-01-01 00:00:00+00'::timestamptz,
    consecutive_failures=0,last_error=null,locked_until=null,updated_at=now()
from public.price_sources ps, public.product_releases r
where t.source_id=ps.id and t.release_id=r.id
  and ps.slug='ebay_active_public'
  and t.enabled
  and r.product_id='a8dddf2c-ba7d-56e8-9816-adde32fd8907'::uuid
  and r.item_number in ('94596','18624','94680','94687','94688','92435');

update public.market_scan_queue q
set priority=130,next_scan_at='2000-01-01 00:00:00+00'::timestamptz,
    consecutive_failures=0,last_error=null,locked_until=null,updated_at=now()
from public.price_sources ps, public.product_releases r
where q.source_id=ps.id and q.release_id=r.id
  and ps.slug='ebay_active_public'
  and q.enabled
  and r.product_id='a8dddf2c-ba7d-56e8-9816-adde32fd8907'::uuid
  and r.item_number in ('94596','18624','94680','94687','94688','92435');

commit;
