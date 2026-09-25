-- Super Dragon Jr. controlled family re-audit — 2026-09-25
--
-- Publication gate:
-- sufficiently verified identity + (exact/high-confidence image OR credible exact-release market evidence)
-- = public; otherwise research_only.
--
-- Canonical researched family: 7 Releases.
-- Intentionally NOT canonicalized:
-- - Lotte Mini 4WD Chocolate prize configuration (customer-selectable body/chassis/wheel/tire colors)
-- - Super Dragon Premium silver-plated Suzuka/event specimen (single weak market trace only)

begin;

update public.products
set canonical_item_number='18007',
    canonical_release_id='855153e5-fa4b-548c-9ae3-464b9fe46e15'::uuid,
    original_release_year=1987,
    series='Racing Mini 4WD',
    chassis='Type 1',
    description='Super Dragon Jr. is Tamiya Racer Mini 4WD No.7, first released in 1987. The collector family includes the Oshika KIT 2907 first production, later ITEM 18007 production, the 1998 Memorial limited reissue, two Year of the Dragon 2000 New Year variants, the 2012 Premium VS redesign and the June 2012 ITEM 18007 spot reissue.',
    description_it='Super Dragon Jr. è la Racer Mini 4WD No.7 di Tamiya, nata nel 1987. La famiglia collezionistica comprende la prima produzione Oshika KIT 2907, la successiva produzione ITEM 18007, la ristampa Memorial 1998, due varianti di Capodanno 2000 per l''Anno del Drago, la Premium 2012 su telaio VS e la spot reissue ITEM 18007 del giugno 2012.',
    metadata=coalesce(metadata,'{}'::jsonb) || jsonb_build_object(
      'catalog_audit','2026-09-25',
      'canonical_release_count',7,
      'catalog_publication_gate',jsonb_build_object(
        'version','2026-09-25',
        'public_release_count',6,
        'research_only_release_count',1,
        'market_value_required',false
      ),
      'unresolved_context',jsonb_build_array(
        'Lotte Racer Mini 4WD Chocolate prize program offered a Super Dragon Jr. with selectable gold/silver body, black/clear chassis, gold/silver wheels and black/red/blue/yellow tires. Because it was a configurable prize rather than one fixed autonomous product identity, it is retained as promotion context only.',
        'A silver-plated Super Dragon Premium attributed to a Suzuka Circuit/event context appears in one closed Yahoo market trace. It remains audit-only until a second authoritative source establishes a standardized autonomous Release.'
      )
    ),
    updated_at=now()
where id='d8c1c423-ae93-5f15-9caa-b7e1b5016760'::uuid;

-- Existing 1987 standard/later-production row.
update public.product_releases
set item_number='18007',
    release_type='Original',
    edition_name='Super Dragon Jr. — 1987 Standard / Later Production',
    release_year=1987,
    release_date=null,
    chassis='Type 1',
    barcode_jan=null,
    color='White body / black Type 1 chassis / white wheels',
    country_market='Global / Japan',
    msrp_jpy=600,
    notes='Controlled re-audit 2026-09-25. Official Tamiya historical material identifies ITEM 18007 / Type 1 / 1987. This row represents later standard production after the collector-distinct Oshika KIT 2907 first batch. Exact stable Suruga image uses the historical 660-yen product record, not the 2012 spot-reissue record.',
    discontinued=true,
    is_original=true,
    data_source='master_reaudit_20260925',
    edition_type='original',
    verification_status='verified',
    production_status='discontinued',
    status_checked_at=now(),
    description='Later standard-production Super Dragon Jr., ITEM 18007 on Type 1 chassis.',
    description_it='Super Dragon Jr. produzione standard successiva, ITEM 18007 su telaio Type 1.',
    catalog_visibility='public',
    catalog_visibility_reason='publication_gate:exact_high_confidence_release_image',
    catalog_visibility_updated_at=now(),
    updated_at=now()
where id='855153e5-fa4b-548c-9ae3-464b9fe46e15'::uuid;

-- Existing 1998 Memorial row.
update public.product_releases
set item_number='18007',
    release_type='Limited Reissue',
    edition_name='Super Dragon Jr. — 1998 Memorial Edition (Limited Reissue)',
    release_year=1998,
    release_date=null,
    chassis='Type 1',
    barcode_jan=null,
    color='White body / Memorial limited-reissue packaging',
    country_market='Japan',
    msrp_jpy=600,
    notes='Controlled re-audit 2026-09-25. TEA-League historical timeline places the Super Dragon Jr. Memorial Edition in December 1998 and records the package wording 限定復刻版. Suruga independently identifies exact limited-reissue product record 603075297.',
    discontinued=true,
    is_original=false,
    data_source='master_reaudit_20260925',
    edition_type='reissue',
    verification_status='verified',
    production_status='discontinued',
    status_checked_at=now(),
    description='December 1998 Memorial Edition / limited reissue of Super Dragon Jr., retaining ITEM 18007.',
    description_it='Memorial Edition / ristampa limitata del dicembre 1998 della Super Dragon Jr., ancora ITEM 18007.',
    catalog_visibility='public',
    catalog_visibility_reason='publication_gate:exact_high_confidence_release_image_and_sold_evidence',
    catalog_visibility_updated_at=now(),
    updated_at=now()
where id='2514e6f0-9121-55db-899b-03976f4ec11f'::uuid;

-- Existing 2012 ITEM 18007 spot-reissue row.
update public.product_releases
set item_number='18007',
    release_type='Spot Reissue',
    edition_name='Super Dragon Jr. — 2012 Spot Reissue',
    release_year=2012,
    release_date=date '2012-06-16',
    chassis='Type 1',
    barcode_jan='4950344962761',
    color='White body / black Type 1 chassis / white wheels',
    country_market='Global / Japan',
    msrp_jpy=900,
    notes='Controlled re-audit 2026-09-25. Official Tamiya and contemporary TEA-League announce the ITEM 18007 spot reissue for 2012-06-16 at JPY 945 tax-included. Hobby Search corroborates JAN 4950344962761. It remains distinct from both the 1987 production and 1998 Memorial packaging.',
    discontinued=false,
    is_original=false,
    data_source='master_reaudit_20260925',
    edition_type='reissue',
    verification_status='verified',
    production_status='active',
    status_checked_at=now(),
    description='June 2012 spot reissue of the classic Type 1 Super Dragon Jr., ITEM 18007.',
    description_it='Spot reissue del giugno 2012 della classica Super Dragon Jr. su telaio Type 1, ITEM 18007.',
    catalog_visibility='public',
    catalog_visibility_reason='publication_gate:exact_official_release_image',
    catalog_visibility_updated_at=now(),
    updated_at=now()
where id='9ce0c921-2bfe-5c34-b21f-d8b28c430104'::uuid;

-- Existing Premium row.
update public.product_releases
set item_number='18067',
    release_type='Premium',
    edition_name='Super Dragon Premium — VS Chassis',
    release_year=2012,
    release_date=date '2012-02-25',
    chassis='VS',
    barcode_jan='4950344180677',
    color='Pearl white body / light-gunmetal VS chassis / fluorescent-green wheels / black spike tires',
    country_market='Global / Japan',
    msrp_jpy=1000,
    notes='Controlled re-audit 2026-09-25. Official Tamiya confirms ITEM 18067, release 2012-02-25, VS chassis and JPY 1,000 pre-tax MSRP. Hobby Search corroborates JAN 4950344180677.',
    discontinued=false,
    is_original=false,
    data_source='master_reaudit_20260925',
    edition_type='reissue',
    verification_status='verified',
    production_status='active',
    status_checked_at=now(),
    description='2012 performance redesign of Super Dragon on VS chassis, ITEM 18067.',
    description_it='Reinterpretazione Premium del 2012 della Super Dragon su telaio VS, ITEM 18067.',
    catalog_visibility='public',
    catalog_visibility_reason='publication_gate:exact_official_release_image_and_sold_evidence',
    catalog_visibility_updated_at=now(),
    updated_at=now()
where id='a4208dcd-08fa-5391-ad03-3c1ebf481507'::uuid;

-- New canonical rows.
insert into public.product_releases(
  product_id,item_number,release_type,edition_name,release_year,release_date,chassis,barcode_jan,color,
  country_market,msrp_jpy,notes,discontinued,is_original,rarity,data_source,edition_type,
  verification_status,production_status,status_checked_at,description,description_it,
  catalog_visibility,catalog_visibility_reason,catalog_visibility_updated_at
) values
(
  'd8c1c423-ae93-5f15-9caa-b7e1b5016760'::uuid,'2907','First Production',
  'Super Dragon Jr. — 1987 First Production (Oshika KIT No.2907)',1987,date '1987-08-06','Type 1','4950344180073',
  'White body / early Oshika multi-color gears / white wheels','Japan',600,
  'Collector-distinct first production. Mandarake identifies Oshika 4-digit KIT 2907 with multi-color gears and white wheels and independently publishes JAN 4950344180073. Current exact market traces exist, but no accepted TrackDash market row or stable exact image is persisted yet.',
  true,true,null,'master_reaudit_20260925','original','verified','discontinued',now(),
  'Earliest Oshika first-production Super Dragon Jr., historical KIT No.2907.',
  'Primissima produzione Oshika della Super Dragon Jr., storico KIT No.2907.',
  'research_only','publication_gate:no_stored_exact_image_and_no_persisted_credible_market_signal',now()
),
(
  'd8c1c423-ae93-5f15-9caa-b7e1b5016760'::uuid,null,'New Year Limited',
  'Super Dragon Jr. — Year of the Dragon 2000 Gold',2000,null,'Type 1',null,
  'Gold body / Type 1 chassis / 2000 New Year decals','Japan',null,
  'Official Tamiya New Year promotional distribution for the 2000 Year of the Dragon. Suruga exact record 603024760 documents the Gold Color variant, 2000 New Year stickers, original Super Dragon Jr. stickers and Type 1 chassis.',
  true,false,null,'master_reaudit_20260925','special','verified','discontinued',now(),
  '2000 Year of the Dragon New Year Gold Color Super Dragon Jr.',
  'Super Dragon Jr. Gold Color per l''Anno del Drago / Capodanno 2000.',
  'public','publication_gate:exact_high_confidence_release_image',now()
),
(
  'd8c1c423-ae93-5f15-9caa-b7e1b5016760'::uuid,null,'New Year Limited',
  'Super Dragon Jr. — Year of the Dragon 2000 Green Metallic (Second Edition)',2000,null,'Type 1',null,
  'Light green metallic body / Type 1 chassis / 2000 New Year decals','Japan',null,
  'Second 2000 Year of the Dragon New Year variant. Suruga exact record 603021774 identifies the Green Color second edition; Mandarake independently documents the Green Metallic variant as a 2000 New Year Super Dragon Jr.',
  true,false,null,'master_reaudit_20260925','special','verified','discontinued',now(),
  'Second 2000 Year of the Dragon New Year Super Dragon Jr., Green Metallic.',
  'Seconda variante di Capodanno 2000 / Anno del Drago della Super Dragon Jr., Green Metallic.',
  'public','publication_gate:exact_high_confidence_release_image',now()
)
on conflict on constraint product_releases_identity_unique do update set
  release_type=excluded.release_type,
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

-- Source provenance.
insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
select gen_random_uuid(),r.id,s.source_type,s.source_url,s.verified_fields,date '2026-09-25',s.notes
from (
  values
  ('Super Dragon Jr. — 1987 First Production (Oshika KIT No.2907)','trusted_secondary','https://www.mandarake.co.jp/kaitori/cat/car/miniyonku.php',array['itemNumber','editionName','color'], 'Mandarake collector list identifies Oshika first-production KIT 2907 with multi-color gears and white wheels.'),
  ('Super Dragon Jr. — 1987 First Production (Oshika KIT No.2907)','trusted_secondary','https://www.mandarake.co.jp/search/kaitori/list.php?disp=96&keyword=%E3%82%BF%E3%83%92&page=1&sort=price',array['itemNumber','barcodeJAN'], 'Mandarake current buy-list record identifies 4-digit ITEM 2907 and JAN 4950344180073.'),
  ('Super Dragon Jr. — 1987 Standard / Later Production','official_archive','https://www.tamiya.com/cms/japan/mini4wd/jr_news/jr_news16/pdf/000191.pdf',array['itemNumber','releaseYear','chassis'], 'Official Tamiya Jr. News retrospective identifies ITEM 18007 / Type 1 / released in 1987.'),
  ('Super Dragon Jr. — 1987 Standard / Later Production','trusted_secondary','https://www.suruga-ya.jp/product/detail/603015727',array['itemNumber','editionName','image'], 'Historical standard-product Suruga record with JPY 660 tax-included MSRP and exact distinct product image.'),
  ('Super Dragon Jr. — 1998 Memorial Edition (Limited Reissue)','trusted_secondary','https://www.tea-league.com/mt/tea/archives/2000/01/19821999.html',array['editionName','releaseYear'], 'Historical timeline places the Memorial Edition in December 1998 and records 限定復刻版 packaging.'),
  ('Super Dragon Jr. — 1998 Memorial Edition (Limited Reissue)','trusted_secondary','https://www.suruga-ya.jp/product/detail/603075297',array['itemNumber','editionName','image'], 'Exact Suruga limited-reissue record for ITEM 18007.'),
  ('Super Dragon Jr. — Year of the Dragon 2000 Gold','trusted_secondary','https://www.suruga-ya.jp/kaitori/kaitori_detail/603024760',array['editionName','releaseYear','chassis','image'], 'Exact Suruga record for the 2000 New Year Gold Color Super Dragon Jr. distributed by Tamiya.'),
  ('Super Dragon Jr. — Year of the Dragon 2000 Green Metallic (Second Edition)','trusted_secondary','https://www.suruga-ya.jp/product/detail/603021774',array['editionName','releaseYear','image'], 'Exact Suruga record for the Green Color second Year-of-the-Dragon edition.'),
  ('Super Dragon Jr. — Year of the Dragon 2000 Green Metallic (Second Edition)','trusted_secondary','https://ekizo.mandarake.co.jp/auction/item/itemInfoEn.html?index=613962',array['editionName','releaseYear','color'], 'Mandarake independently documents the 2000 New Year Green Metallic variant and confirms Gold and Green variants existed.'),
  ('Super Dragon Premium — VS Chassis','official_manufacturer','https://www.tamiya.com/japan/products/18067/index.html',array['itemNumber','editionName','releaseDate','chassis','msrp','image'], 'Official Tamiya ITEM 18067 page: release 2012-02-25, VS chassis, JPY 1,000 pre-tax.'),
  ('Super Dragon Premium — VS Chassis','trusted_secondary','https://www.1999.co.jp/10167445',array['itemNumber','barcodeJAN'], 'Hobby Search corroborates ITEM 18067 / JAN 4950344180677.'),
  ('Super Dragon Jr. — 2012 Spot Reissue','official_manufacturer','https://www.tamiya.com/japan/products/18007/index.html',array['itemNumber','editionName','releaseDate','chassis','msrp','image'], 'Official Tamiya ITEM 18007 page records the 2012-06-16 reissue and JPY 900 pre-tax price.'),
  ('Super Dragon Jr. — 2012 Spot Reissue','trusted_secondary','https://www.1999.co.jp/10183424',array['itemNumber','barcodeJAN','chassis'], 'Hobby Search corroborates ITEM 18007 / JAN 4950344962761 for the 2012 spot reissue.'),
  ('Super Dragon Jr. — 2012 Spot Reissue','trusted_secondary','https://www.tea-league.com/mt/tea/archives/2012/05/201262jcupfrp.html',array['itemNumber','releaseDate','msrp'], 'Contemporary release announcement confirms 2012-06-16 spot reissue at JPY 945 tax-included.')
) as s(edition_name,source_type,source_url,verified_fields,notes)
join public.product_releases r
  on r.product_id='d8c1c423-ae93-5f15-9caa-b7e1b5016760'::uuid
 and r.edition_name=s.edition_name
where not exists (
  select 1 from public.release_sources x
  where x.release_id=r.id and x.source_url=s.source_url
);

-- Exact stable images for every initially public Release.
delete from public.release_images
where release_id in (
  '855153e5-fa4b-548c-9ae3-464b9fe46e15'::uuid,
  '2514e6f0-9121-55db-899b-03976f4ec11f'::uuid,
  '9ce0c921-2bfe-5c34-b21f-d8b28c430104'::uuid,
  'a4208dcd-08fa-5391-ad03-3c1ebf481507'::uuid,
  (select id from public.product_releases where product_id='d8c1c423-ae93-5f15-9caa-b7e1b5016760'::uuid and edition_name='Super Dragon Jr. — Year of the Dragon 2000 Gold' limit 1),
  (select id from public.product_releases where product_id='d8c1c423-ae93-5f15-9caa-b7e1b5016760'::uuid and edition_name='Super Dragon Jr. — Year of the Dragon 2000 Green Metallic (Second Edition)' limit 1)
);

insert into public.release_images(id,release_id,url,position)
values
(gen_random_uuid(),'855153e5-fa4b-548c-9ae3-464b9fe46e15'::uuid,'https://cdn.suruga-ya.jp/database/pics_webp/game/603015727.jpg.webp',0),
(gen_random_uuid(),'2514e6f0-9121-55db-899b-03976f4ec11f'::uuid,'https://cdn.suruga-ya.jp/database/pics_webp/game/603075297.jpg.webp',0),
(gen_random_uuid(),
 (select id from public.product_releases where product_id='d8c1c423-ae93-5f15-9caa-b7e1b5016760'::uuid and edition_name='Super Dragon Jr. — Year of the Dragon 2000 Gold' limit 1),
 'https://cdn.suruga-ya.jp/database/pics_webp/game/603024760.jpg.webp',0),
(gen_random_uuid(),
 (select id from public.product_releases where product_id='d8c1c423-ae93-5f15-9caa-b7e1b5016760'::uuid and edition_name='Super Dragon Jr. — Year of the Dragon 2000 Green Metallic (Second Edition)' limit 1),
 'https://cdn.suruga-ya.jp/database/pics_webp/game/603021774.jpg.webp',0),
(gen_random_uuid(),'a4208dcd-08fa-5391-ad03-3c1ebf481507'::uuid,'https://www.tamiya.com/japan_contents/img/usr/item/1/18067/18067_1.jpg',0),
(gen_random_uuid(),'9ce0c921-2bfe-5c34-b21f-d8b28c430104'::uuid,'https://cdn.suruga-ya.jp/database/pics_webp/game/603021027.jpg.webp',0);

-- Verified identifiers where release-specific evidence is clean.
insert into public.release_identifiers(id,release_id,scheme,value,market,is_primary,verification_status,source_url,checked_at)
select gen_random_uuid(),r.id,'JAN',v.value,'JP',true,'verified',v.source_url,now()
from (
  values
  ('Super Dragon Jr. — 1987 First Production (Oshika KIT No.2907)','4950344180073','https://www.mandarake.co.jp/search/kaitori/list.php?disp=96&keyword=%E3%82%BF%E3%83%92&page=1&sort=price'),
  ('Super Dragon Premium — VS Chassis','4950344180677','https://www.1999.co.jp/10167445'),
  ('Super Dragon Jr. — 2012 Spot Reissue','4950344962761','https://www.1999.co.jp/10183424')
) as v(edition_name,value,source_url)
join public.product_releases r
  on r.product_id='d8c1c423-ae93-5f15-9caa-b7e1b5016760'::uuid
 and r.edition_name=v.edition_name
where not exists (
  select 1 from public.release_identifiers x
  where x.release_id=r.id and x.scheme='JAN' and x.value=v.value
);

-- Exact recent Yahoo CLOSED sales for the two unambiguous 18007 Memorial
-- and 18067 Premium identities. Generic 18007 sales are intentionally not
-- assigned to 1987 vs 2012 production.
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
  'https://auctions.yahoo.co.jp/closedsearch/closedsearch/%E3%82%B9%E3%83%BC%E3%83%91%E3%83%BC%E3%83%89%E3%83%A9%E3%82%B4%E3%83%B3%20%E3%82%BF%E3%83%9F%E3%83%A4/0/',
  v.title_raw,v.item_number_observed,
  array[r.id],r.id,v.price,'JPY',null,'unknown','auction_awarded',
  v.condition_raw,'new_complete_unbuilt','unknown',v.box_condition,true,false,1,v.match_confidence,
  v.match_evidence,v.source_record_key,v.sold_on,now(),'accepted',array[]::text[],
  v.review_notes,false,
  jsonb_build_object('adapter','manual-sold-audit-v1','market_region','japan','sale_date',v.sold_on),
  now(),now()
from (
  values
  (
    'Super Dragon Jr. — 1998 Memorial Edition (Limited Reissue)',
    'yahoo-auctions:super-dragon-memorial-1998:2026-04-20:3380',
    '限定復刻版 タミヤ レーサーミニ四駆 スーパードラゴンJr. TAMIYA Racing Mini 4WD Super Dragon Jr. Memorial Edition 未組立',
    '18007',3380::numeric,date '2026-04-20','未組立','unknown','strong',
    array['edition_name_exact','reissue_stated','manual_override']::text[],
    'Exact Memorial Edition / 限定復刻版 unassembled closed sale; JPY 3,380. Shipping/seller not exposed.'
  ),
  (
    'Super Dragon Jr. — 1998 Memorial Edition (Limited Reissue)',
    'yahoo-auctions:super-dragon-memorial-1998:2026-04-24:3200',
    'タミヤ ミニ四駆 スーパードラゴンJr メモリアルエディション 限定復刻版 未組立品 箱傷み汚れ有り',
    '18007',3200::numeric,date '2026-04-24','未組立 箱傷み汚れ有り','significantly_damaged','strong',
    array['edition_name_exact','reissue_stated','manual_override']::text[],
    'Exact Memorial Edition limited reissue unassembled closed sale; JPY 3,200. Box wear stated; shipping/seller not exposed.'
  ),
  (
    'Super Dragon Jr. — 1998 Memorial Edition (Limited Reissue)',
    'yahoo-auctions:super-dragon-memorial-1998:2026-05-03:6000',
    '未組立 1/32 スーパードラゴンJr. 限定復刻版 レーサーミニ四駆シリーズ No.7 タミヤ',
    '18007',6000::numeric,date '2026-05-03','未組立','unknown','strong',
    array['edition_name_exact','reissue_stated','manual_override']::text[],
    'Exact 限定復刻版 unassembled closed sale; JPY 6,000. Shipping/seller not exposed.'
  ),
  (
    'Super Dragon Premium — VS Chassis',
    'yahoo-auctions:super-dragon-18067:2026-02-12:2500',
    '★未使用 タミヤ ミニ四駆 スーパードラゴン プレミアム (VSシャーシ) 18067 箱痛み大',
    '18067',2500::numeric,date '2026-02-12','未使用 箱痛み大','significantly_damaged','exact',
    array['item_number_exact','edition_name_exact','manual_override']::text[],
    'Exact ITEM 18067 unused closed sale; JPY 2,500. Box heavily worn; shipping/seller not exposed.'
  ),
  (
    'Super Dragon Premium — VS Chassis',
    'yahoo-auctions:super-dragon-18067:2026-04-18:3500',
    'タミヤ ミニ四駆 スーパードラゴン プレミアム VSシャーシ 未組立',
    '18067',3500::numeric,date '2026-04-18','未組立','unknown','strong',
    array['item_number_exact','edition_name_exact','manual_override']::text[],
    'Exact ITEM 18067 Premium unassembled closed sale; JPY 3,500. Shipping/seller not exposed.'
  )
) as v(edition_name,source_record_key,title_raw,item_number_observed,price,sold_on,condition_raw,box_condition,match_confidence,match_evidence,review_notes)
join public.product_releases r
  on r.product_id='d8c1c423-ae93-5f15-9caa-b7e1b5016760'::uuid
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
    ('yahoo-auctions:super-dragon-memorial-1998:2026-04-20:3380'::text,0.00535103::numeric,date '2026-04-20'),
    ('yahoo-auctions:super-dragon-memorial-1998:2026-04-24:3200'::text,0.00536193::numeric,date '2026-04-23'),
    ('yahoo-auctions:super-dragon-memorial-1998:2026-05-03:6000'::text,0.00543981::numeric,date '2026-05-04'),
    ('yahoo-auctions:super-dragon-18067:2026-02-12:2500'::text,0.00547076::numeric,date '2026-02-11'),
    ('yahoo-auctions:super-dragon-18067:2026-04-18:3500'::text,0.00535103::numeric,date '2026-04-20')
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
  array['shipping_unknown','seller_unknown'],
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

-- Queue canonical recomputes for exact sold-backed Releases.
select public.trackdash_enqueue_market_recompute(r.id,'new_complete_unbuilt')
from public.product_releases r
where r.product_id='d8c1c423-ae93-5f15-9caa-b7e1b5016760'::uuid
  and r.edition_name in (
    'Super Dragon Jr. — 1998 Memorial Edition (Limited Reissue)',
    'Super Dragon Premium — VS Chassis'
  );

-- Enroll item-numbered canonical Releases. Shared ITEM 18007 is expected to
-- remain fail-closed for unattended eBay matching; 2907 and 18067 are unique.
select public.trackdash_enroll_release_market_scans(r.id)
from public.product_releases r
where r.product_id='d8c1c423-ae93-5f15-9caa-b7e1b5016760'::uuid
  and r.item_number in ('2907','18007','18067');

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
    where product_id='d8c1c423-ae93-5f15-9caa-b7e1b5016760'::uuid
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
    where product_id='d8c1c423-ae93-5f15-9caa-b7e1b5016760'::uuid
  );

commit;
