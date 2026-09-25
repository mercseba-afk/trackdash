-- Hornet Jr. controlled family re-audit — 2026-09-25
--
-- Permanent publication gate:
-- verified identity + (exact/high-confidence image OR credible exact-release market evidence)
-- => public; otherwise preserve as research_only.
--
-- Canonical researched family: 7 Releases.
-- The 2009 master-piece messenger-bag bundle remains unresolved context only.

begin;

update public.products
set canonical_item_number='18002',
    canonical_release_id='42ee427f-60ed-598b-bc68-b07c2e2cb195'::uuid,
    original_release_year=1986,
    series='Racing Mini 4WD',
    chassis='Type 1',
    description='Hornet Jr. is Tamiya Racer Mini 4WD No.2, originally released in 1986 from the R/C Hornet. The collector family includes the Oshika first production, a clear-chassis Special, the 1998 Memorial reissue, the 2002 Year of the Horse zodiac edition, the 2018 Hiroshi Tanahashi collaboration and the newly announced 2026 VZ-chassis redesign.',
    description_it='Hornet Jr. è la Racer Mini 4WD No.2 di Tamiya, nata nel 1986 dalla R/C Hornet. La famiglia collezionistica comprende la prima produzione Oshika, la Special con telaio trasparente, la Memorial 1998, la versione zodiacale Anno del Cavallo 2002, la collaborazione Hiroshi Tanahashi del 2018 e la nuova reinterpretazione 2026 su telaio VZ.',
    metadata=coalesce(metadata,'{}'::jsonb) || jsonb_build_object(
      'catalog_audit','2026-09-25',
      'canonical_release_count',7,
      'catalog_publication_gate',jsonb_build_object(
        'version','2026-09-25',
        'public_release_count',5,
        'research_only_release_count',2,
        'market_value_required',false
      ),
      'unresolved_context',jsonb_build_array(
        'Early clear-chassis Hornet Jr. Special packaging exists as KIT 2902 with a special sticker and KIT 2952 instructions before later export KIT 2952 packaging. TrackDash keeps one canonical 2952 Clear Chassis Special until autonomous packaging waves are sufficiently documented.',
        '2009 Tamiya x master-piece messenger-bag promotion reportedly included a master-piece original Hornet Jr. for a limited number of sets. It remains bundle/promotion research context and is not canonicalized as a standalone Release.'
      )
    ),
    updated_at=now()
where id='a508c0d6-651d-5469-92b6-002e86518a1a'::uuid;

-- Existing standard/later-production row.
update public.product_releases
set item_number='18002',
    release_type='Original',
    edition_name='Hornet Jr. — 1986 Standard / Later Production',
    release_year=1986,
    release_date=null,
    chassis='Type 1',
    barcode_jan='4950344992058',
    color='Black body / Type 1 chassis / spike tires',
    country_market='Global / Japan',
    msrp_jpy=700,
    notes='Controlled re-audit 2026-09-25. Official Tamiya identifies ITEM 18002 as Racer Mini 4WD No.2 on Type 1 chassis. Current/later-production JAN 4950344992058 is corroborated by Hobby Search and HLJ; the Oshika first production remains collector-distinct as KIT 2902.',
    discontinued=false,
    is_original=true,
    data_source='master_reaudit_20260925',
    edition_type='original',
    verification_status='verified',
    production_status='active',
    status_checked_at=now(),
    description='Standard/later-production Hornet Jr. ITEM 18002 on Type 1 chassis.',
    description_it='Hornet Jr. standard / produzione successiva, ITEM 18002 su telaio Type 1.',
    catalog_visibility='public',
    catalog_visibility_reason='publication_gate:exact_official_release_image',
    catalog_visibility_updated_at=now(),
    updated_at=now()
where id='42ee427f-60ed-598b-bc68-b07c2e2cb195'::uuid;

-- Existing 1998 reissue becomes fully verified. One exact recent SOLD is
-- persisted below so this image-less Release passes the publication gate
-- without relying on a vague/unused historical note.
update public.product_releases
set item_number='18002',
    release_type='Limited Reissue',
    edition_name='Hornet Jr. — 1998 Memorial Edition (Limited Reissue)',
    release_year=1998,
    release_date=null,
    chassis='Type 1',
    barcode_jan='4950344180028',
    color='Black body / Memorial Edition packaging',
    country_market='Japan',
    msrp_jpy=null,
    notes='Controlled re-audit 2026-09-25. TEA-League contemporary history places the Memorial Edition in December 1998 and notes the package wording 限定復刻版. Kaitori World independently identifies the exact limited reissue and JAN 4950344180028; its generic 1999/12/31 date is not used.',
    discontinued=true,
    is_original=false,
    data_source='master_reaudit_20260925',
    edition_type='reissue',
    verification_status='verified',
    production_status='discontinued',
    status_checked_at=now(),
    description='1998 Memorial Edition / Limited Reissue of Hornet Jr. retaining ITEM 18002.',
    description_it='Memorial Edition / ristampa limitata 1998 della Hornet Jr., ancora ITEM 18002.',
    catalog_visibility='public',
    catalog_visibility_reason='publication_gate:credible_exact_release_market_evidence',
    catalog_visibility_updated_at=now(),
    updated_at=now()
where id='554acb0b-0987-551b-8619-c3bff7e3bab0'::uuid;

insert into public.product_releases(
  product_id,item_number,release_type,edition_name,release_year,release_date,chassis,barcode_jan,color,
  country_market,msrp_jpy,notes,discontinued,is_original,rarity,data_source,edition_type,
  verification_status,production_status,status_checked_at,description,description_it,
  catalog_visibility,catalog_visibility_reason,catalog_visibility_updated_at
) values
(
  'a508c0d6-651d-5469-92b6-002e86518a1a'::uuid,'2902','First Production',
  'Hornet Jr. — 1986 First Production (Oshika KIT No.2902)',1986,null,'Type 1',null,
  'Black body / early Oshika specification','Japan',null,
  'Collector-distinct initial production documented under KIT 2902. Exact stable image and a clean current market point are still missing from TrackDash, so the Release remains research-only.',
  true,true,null,'master_reaudit_20260925','original','verified','discontinued',now(),
  'Earliest Oshika first-production Hornet Jr., historical KIT No.2902.',
  'Primissima produzione Oshika della Hornet Jr., storico KIT No.2902.',
  'research_only','publication_gate:no_stored_exact_image_and_no_current_credible_market_signal',now()
),
(
  'a508c0d6-651d-5469-92b6-002e86518a1a'::uuid,'2952','Limited Special',
  'Hornet Jr. Special — Clear Chassis Version',null,null,'Type 1',null,
  'Black body / clear Type 1 chassis / yellow spike tires','Japan',null,
  'Mandarake identifies KIT 2952 Hornet Jr. Special with clear chassis. Re-cube documents an early transitional KIT 2902 special-sticker box containing KIT 2952 instructions and a later export KIT 2952 box. Kept as one canonical 2952 Special pending stronger wave evidence.',
  true,false,null,'master_reaudit_20260925','special','verified','discontinued',now(),
  'Historical Hornet Jr. Special with clear Type 1 chassis, canonical KIT 2952.',
  'Storica Hornet Jr. Special con telaio Type 1 trasparente, KIT canonico 2952.',
  'research_only','publication_gate:no_stored_exact_image_and_no_current_credible_market_signal',now()
),
(
  'a508c0d6-651d-5469-92b6-002e86518a1a'::uuid,'94446','Zodiac',
  'Hornet Jr. — 2002 Year of the Horse (Zodiac Mini 4WD)',2002,null,'Type 1',null,
  'White body / silver chassis / clear spike tires / horse driver','Japan',null,
  'Exact autonomous zodiac Release. Suruga identifies ITEM 94446 and its 2002 New Year / Year of the Horse specification. Exact stable Suruga image is stored below.',
  true,false,null,'master_reaudit_20260925','special','verified','discontinued',now(),
  '2002 Year of the Horse New Year Hornet Jr., ITEM 94446.',
  'Hornet Jr. 2002 Anno del Cavallo / edizione di Capodanno, ITEM 94446.',
  'public','publication_gate:exact_high_confidence_release_image',now()
),
(
  'a508c0d6-651d-5469-92b6-002e86518a1a'::uuid,'92412','Official Collaboration',
  'Hornet Jr. — Hiroshi Tanahashi Special',2018,date '2018-12-10','VS','4571386376080',
  'Black-plated body / white VS chassis / red-plated large wheels','Japan',1800,
  'Official Gakken launch release opened orders on 2018-12-10 for a 5,000-unit collaboration, with shipment from early January 2019. ITEM 92412 / GTIN 4571386376080 are corroborated by exact marketplace product metadata.',
  true,false,null,'master_reaudit_20260925','special','verified','discontinued',now(),
  '5,000-unit Hiroshi Tanahashi collaboration Hornet Jr. announced in December 2018, ITEM 92412.',
  'Hornet Jr. speciale Hiroshi Tanahashi in 5.000 esemplari, annunciata a dicembre 2018, ITEM 92412.',
  'public','publication_gate:exact_primary_launch_image',now()
),
(
  'a508c0d6-651d-5469-92b6-002e86518a1a'::uuid,'18107','Modern Redesign',
  'Hornet Jr. — VZ Chassis',2026,null,'VZ','4950344181070',
  'Hornet-inspired body / black VZ chassis / black large-diameter slick tires','Global / Japan',1400,
  'Official Tamiya product announced for December 2026. MSRP JPY 1,400 before tax / JPY 1,540 tax-included. Exact official image and JAN 4950344181070 are verified.',
  false,false,null,'master_reaudit_20260925','reissue','verified','announced',now(),
  '2026 Hornet Jr. redesign on VZ chassis, ITEM 18107, announced for December 2026.',
  'Nuova Hornet Jr. 2026 su telaio VZ, ITEM 18107, annunciata per dicembre 2026.',
  'public','publication_gate:exact_official_release_image',now()
)
on conflict on constraint product_releases_identity_unique do update set
  release_type=excluded.release_type,
  edition_name=excluded.edition_name,
  release_date=excluded.release_date,
  chassis=excluded.chassis,
  barcode_jan=excluded.barcode_jan,
  color=excluded.color,
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

-- Exact identity/source provenance.
insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
select gen_random_uuid(),r.id,s.source_type,s.source_url,s.verified_fields,date '2026-09-25',s.notes
from (
  values
  ('Hornet Jr. — 1986 Standard / Later Production','official_manufacturer','https://www.tamiya.com/japan/products/18002/index.html',array['itemNumber','editionName','chassis','msrp','image'], 'Official Tamiya ITEM 18002 product page.'),
  ('Hornet Jr. — 1986 Standard / Later Production','official_archive','https://www.tamiya.com/cms/japan/mini4wd/jr_news/jr_news16/pdf/000191.pdf',array['itemNumber','releaseYear','chassis'], 'Official Tamiya Jr. News historical catalog identifies ITEM 18002 as a 1986 Type 1 release.'),
  ('Hornet Jr. — 1986 Standard / Later Production','trusted_secondary','https://www.1999.co.jp/10086719',array['itemNumber','barcodeJAN'], 'Hobby Search corroborates current/later-production JAN 4950344992058.'),
  ('Hornet Jr. — 1986 First Production (Oshika KIT No.2902)','trusted_secondary','https://www.mandarake.co.jp/kaitori/cat/car/miniyonku.php',array['itemNumber','editionName'], 'Mandarake collector list identifies early Hornet Jr. KIT 2902.'),
  ('Hornet Jr. Special — Clear Chassis Version','trusted_secondary','https://www.mandarake.co.jp/kaitori/cat/car/miniyonku.php',array['itemNumber','editionName','color'], 'Mandarake independently identifies limited KIT 2952 Hornet Jr. Special with clear chassis.'),
  ('Hornet Jr. Special — Clear Chassis Version','trusted_secondary','https://re-cube.co.jp/toyokawa/new_item/entry-1624.html',array['editionName','color'], 'Exact early transitional clear-chassis example: KIT 2902 stickered box, KIT 2952 instructions, clear chassis and yellow tires.'),
  ('Hornet Jr. — 1998 Memorial Edition (Limited Reissue)','trusted_secondary','https://www.tea-league.com/mt/tea/archives/2000/01/19821999.html',array['editionName','releaseYear'], 'Historical timeline places Hornet Jr. Memorial Edition in December 1998 and records the 限定復刻版 package wording.'),
  ('Hornet Jr. — 1998 Memorial Edition (Limited Reissue)','trusted_secondary','https://www.kaitori-world.jp/products/detail/275947',array['editionName','barcodeJAN'], 'Exact limited-reissue product record corroborates JAN 4950344180028; its generic date is intentionally not used.'),
  ('Hornet Jr. — 2002 Year of the Horse (Zodiac Mini 4WD)','trusted_secondary','https://www.suruga-ya.jp/kaitori/kaitori_detail/603021783',array['itemNumber','editionName','releaseYear','image'], 'Exact Suruga product record: ITEM 94446, Year of the Horse 2002, management ID 603021783.'),
  ('Hornet Jr. — Hiroshi Tanahashi Special','official_archive','https://prtimes.jp/main/html/rd/p/000001951.000002535.html',array['editionName','releaseDate','msrp','color','image'], 'Primary Gakken launch release: 5,000 units, orders from 2018-12-10, JPY 1,800 before tax, January 2019 shipment, exact specification and product image.'),
  ('Hornet Jr. — Hiroshi Tanahashi Special','trusted_secondary','https://www.ebay.com/itm/176623500684',array['itemNumber','barcodeJAN','releaseYear'], 'Exact ITEM 92412 listing metadata corroborates GTIN/UPC 4571386376080 and 2018 manufacture year.'),
  ('Hornet Jr. — VZ Chassis','official_manufacturer','https://www.tamiya.com/japan/products/18107/index.html',array['itemNumber','editionName','releaseYear','chassis','msrp','image'], 'Official Tamiya ITEM 18107 page: VZ chassis, December 2026 planned release, JPY 1,400 before tax.'),
  ('Hornet Jr. — VZ Chassis','trusted_secondary','https://www.1999.co.jp/11470631',array['itemNumber','barcodeJAN','chassis'], 'Hobby Search corroborates ITEM 18107 / JAN 4950344181070.')
) as s(edition_name,source_type,source_url,verified_fields,notes)
join public.product_releases r
  on r.product_id='a508c0d6-651d-5469-92b6-002e86518a1a'::uuid
 and r.edition_name=s.edition_name
where not exists (
  select 1 from public.release_sources x
  where x.release_id=r.id and x.source_url=s.source_url
);

-- Exact stable public images.
delete from public.release_images
where release_id in (
  '42ee427f-60ed-598b-bc68-b07c2e2cb195'::uuid,
  (select id from public.product_releases where product_id='a508c0d6-651d-5469-92b6-002e86518a1a'::uuid and item_number='94446' limit 1),
  (select id from public.product_releases where product_id='a508c0d6-651d-5469-92b6-002e86518a1a'::uuid and item_number='92412' limit 1),
  (select id from public.product_releases where product_id='a508c0d6-651d-5469-92b6-002e86518a1a'::uuid and item_number='18107' limit 1)
);

insert into public.release_images(id,release_id,url,position)
values
(
  gen_random_uuid(),
  '42ee427f-60ed-598b-bc68-b07c2e2cb195'::uuid,
  'https://www.tamiya.com/japan_contents/img/usr/item/1/18002/18002_1.jpg',
  0
),
(
  gen_random_uuid(),
  (select id from public.product_releases where product_id='a508c0d6-651d-5469-92b6-002e86518a1a'::uuid and item_number='94446' limit 1),
  'https://cdn.suruga-ya.jp/database/pics_webp/game/603021783.jpg.webp',
  0
),
(
  gen_random_uuid(),
  (select id from public.product_releases where product_id='a508c0d6-651d-5469-92b6-002e86518a1a'::uuid and item_number='92412' limit 1),
  'https://prtimes.jp/i/2535/1951/resize/d2535-1951-173568-3.jpg',
  0
),
(
  gen_random_uuid(),
  (select id from public.product_releases where product_id='a508c0d6-651d-5469-92b6-002e86518a1a'::uuid and item_number='18107' limit 1),
  'https://www.tamiya.com/japan_contents/img/usr/item/1/18107/18107_1.jpg',
  0
);

-- Verified identifiers.
insert into public.release_identifiers(id,release_id,scheme,value,market,is_primary,verification_status,source_url,checked_at)
select gen_random_uuid(),r.id,'JAN',v.value,'JP',true,'verified',v.source_url,now()
from (
  values
    ('Hornet Jr. — 1986 Standard / Later Production','4950344992058','https://www.1999.co.jp/10086719'),
    ('Hornet Jr. — 1998 Memorial Edition (Limited Reissue)','4950344180028','https://www.kaitori-world.jp/products/detail/275947'),
    ('Hornet Jr. — Hiroshi Tanahashi Special','4571386376080','https://www.ebay.com/itm/176623500684'),
    ('Hornet Jr. — VZ Chassis','4950344181070','https://www.1999.co.jp/11470631')
) as v(edition_name,value,source_url)
join public.product_releases r
  on r.product_id='a508c0d6-651d-5469-92b6-002e86518a1a'::uuid
 and r.edition_name=v.edition_name
where not exists (
  select 1 from public.release_identifiers x
  where x.release_id=r.id and x.scheme='JAN' and x.value=v.value
);

-- Exact Yahoo closed-sale evidence. Shipping/seller are unavailable; retain
-- raw sale EUR as indicative evidence and do not invent delivered cost.
insert into public.market_candidates(
  id,source_id,source_record_key,original_source,original_record_id,listing_url,title_raw,item_number_observed,
  possible_release_ids,resolved_release_id,price,currency,shipping_cost,shipping_basis,observation_type,
  condition_raw,condition,inner_bags_sealed,box_condition,is_complete,is_lot,quantity,match_confidence,
  match_evidence,evidence_group_key,sold_on,observed_at,decision,reason_codes,review_notes,needs_revalidation,
  raw_payload,first_observed_at,last_observed_at
)
select
  gen_random_uuid(),'d75d5b49-d9e5-58d0-bd2a-3d82f44fda53'::uuid,
  v.source_record_key,'YAHOO_AUCTIONS_JP',null,
  'https://auctions.yahoo.co.jp/closedsearch/closedsearch/%E3%83%9F%E3%83%8B%E5%9B%9B%E9%A7%86%20%E3%83%9B%E3%83%BC%E3%83%8D%E3%83%83%E3%83%88jr/25464',
  v.title_raw,v.item_number_observed,
  array[r.id],r.id,v.price,'JPY',null,'unknown','auction_awarded',
  v.condition_raw,'new_complete_unbuilt','unknown','unknown',true,false,1,v.match_confidence,
  v.match_evidence,v.source_record_key,v.sold_on,now(),'accepted',array[]::text[],
  v.review_notes,false,
  jsonb_build_object('adapter','manual-sold-audit-v1','market_region','japan','sale_date',v.sold_on),
  now(),now()
from (
  values
  (
    'Hornet Jr. — 1998 Memorial Edition (Limited Reissue)',
    'yahoo-auctions:hornet-memorial-1998:2026-04-20:3400',
    '限定復刻版 タミヤ レーサーミニ四駆 No.2 ホーネットJr. The HORNET Jr. TAMIYA Memorial Edition Racing Mini 4WD 未組立',
    '18002',3400::numeric,date '2026-04-20','未組立','strong',
    array['edition_name_exact','reissue_stated','manual_override']::text[],
    'Exact Memorial Edition / 限定復刻版 unassembled closed sale; JPY 3,400. Shipping and seller fingerprint not exposed.'
  ),
  (
    'Hornet Jr. — 2002 Year of the Horse (Zodiac Mini 4WD)',
    'yahoo-auctions:hornet-94446:2026-03-23:7550',
    '☆【御年賀 ミニ四駆】 タミヤ 1/32 ホーネットJr. 2002年新春 御年賀 午 ホワイトカラー ☆',
    '94446',7550::numeric,date '2026-03-23','未使用','strong',
    array['edition_name_exact','release_year_stated','manual_override']::text[],
    'Exact 2002 Year of the Horse New Year edition closed sale; JPY 7,550. Shipping and seller fingerprint not retained.'
  ),
  (
    'Hornet Jr. — 2002 Year of the Horse (Zodiac Mini 4WD)',
    'yahoo-auctions:hornet-94446:2026-02-11:4990',
    '未組立 タミヤ 限定 レーサー ミニ四駆 ホーネットJr. 午年 2002年 御年賀 仕様 ホワイトカラー 干支 馬 94446 プラモデル TAMIYA',
    '94446',4990::numeric,date '2026-02-11','未組立','exact',
    array['item_number_exact','edition_name_exact','release_year_stated','manual_override']::text[],
    'Exact ITEM 94446 Year of the Horse unassembled closed sale; JPY 4,990. Shipping and seller fingerprint not retained.'
  ),
  (
    'Hornet Jr. — Hiroshi Tanahashi Special',
    'yahoo-auctions:hornet-92412:2026-06-07:4500',
    '【棚橋弘至スペシャル】特別仕様 新品未組立 ホーネットJr. ミニ四駆 2018 ブラックメッキボディ仕様',
    '92412',4500::numeric,date '2026-06-07','新品未組立','strong',
    array['edition_name_exact','release_year_stated','manual_override']::text[],
    'Exact Hiroshi Tanahashi Special new/unassembled closed sale; JPY 4,500. Shipping and seller fingerprint not retained.'
  )
) as v(edition_name,source_record_key,title_raw,item_number_observed,price,sold_on,condition_raw,match_confidence,match_evidence,review_notes)
join public.product_releases r
  on r.product_id='a508c0d6-651d-5469-92b6-002e86518a1a'::uuid
 and r.edition_name=v.edition_name
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

with sold_fx(source_record_key,fx_rate_to_eur,fx_rate_date) as (
  values
    ('yahoo-auctions:hornet-memorial-1998:2026-04-20:3400'::text,0.005351027397260274::numeric,date '2026-04-20'),
    ('yahoo-auctions:hornet-94446:2026-03-23:7550'::text,0.005438920918089851::numeric,date '2026-03-23'),
    ('yahoo-auctions:hornet-94446:2026-02-11:4990'::text,0.005470758794244762::numeric,date '2026-02-11'),
    ('yahoo-auctions:hornet-92412:2026-06-07:4500'::text,0.005374032674118658::numeric,date '2026-06-05')
)
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
  f.fx_rate_to_eur,f.fx_rate_date,c.inner_bags_sealed,c.box_condition,true,false,
  1,c.match_confidence,c.match_evidence,c.evidence_group_key,true,
  'active',false,null,c.sold_on,c.observed_at,'indicative',
  array['shipping_unknown','box_condition_unknown','seller_unknown'],
  round(c.price*f.fx_rate_to_eur,2),'raw_sale'
from sold_fx f
join public.market_candidates c
  on c.source_id='d75d5b49-d9e5-58d0-bd2a-3d82f44fda53'::uuid
 and c.source_record_key=f.source_record_key
where c.decision='accepted'
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

-- Queue canonical recompute for Releases with imported SOLD evidence.
select public.trackdash_enqueue_market_recompute(r.id,'new_complete_unbuilt')
from public.product_releases r
where r.product_id='a508c0d6-651d-5469-92b6-002e86518a1a'::uuid
  and r.edition_name in (
    'Hornet Jr. — 1998 Memorial Edition (Limited Reissue)',
    'Hornet Jr. — 2002 Year of the Horse (Zodiac Mini 4WD)',
    'Hornet Jr. — Hiroshi Tanahashi Special'
  );

-- Enroll all canonical item-numbered Releases. Shared ITEM 18002 is expected
-- to remain fail-closed for unattended eBay matching.
select public.trackdash_enroll_release_market_scans(r.id)
from public.product_releases r
where r.product_id='a508c0d6-651d-5469-92b6-002e86518a1a'::uuid
  and r.item_number in ('2902','18002','2952','94446','92412','18107');

-- Put only enabled eBay initial-scan jobs ahead of the general overdue queue.
update public.market_scan_queue
set priority=130,
    next_scan_at=timestamptz '2000-01-01 00:00:00+00',
    consecutive_failures=0,
    last_error=null,
    locked_until=null,
    updated_at=now()
where source_id='709dcecf-d368-4742-b114-f00f5d7ed646'::uuid
  and enabled=true
  and release_id in (
    select id from public.product_releases
    where product_id='a508c0d6-651d-5469-92b6-002e86518a1a'::uuid
  );

update public.market_scan_targets
set priority=130,
    next_scan_at=timestamptz '2000-01-01 00:00:00+00',
    consecutive_failures=0,
    last_error=null,
    locked_until=null,
    updated_at=now()
where source_id='709dcecf-d368-4742-b114-f00f5d7ed646'::uuid
  and enabled=true
  and release_id in (
    select id from public.product_releases
    where product_id='a508c0d6-651d-5469-92b6-002e86518a1a'::uuid
  );

commit;
