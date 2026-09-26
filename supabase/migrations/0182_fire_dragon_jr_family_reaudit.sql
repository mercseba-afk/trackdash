-- Fire Dragon Jr. controlled family re-audit — 2026-09-26
--
-- Existing legacy family is retained and normalized to the current TrackDash method.
-- Canonical researched family: 9 Releases.
--
-- Publication gate:
-- verified identity + (exact/high-confidence image OR credible exact-release market evidence)
-- = public. Shared ITEM 18011 generations remain fail-closed for unattended eBay attribution.

begin;

update public.products
set slug='fire-dragon-jr-18011',
    canonical_item_number='18011',
    canonical_release_id='0e24ff2a-70e6-5909-b28d-67400a365c92'::uuid,
    original_release_year=1988,
    series='Racing Mini 4WD',
    chassis='Type 1',
    description='Fire Dragon Jr. is Tamiya Racing Mini 4WD No.11, first released in 1988. The collector family includes the original Type 1 kit, the 1998 Memorial limited reissue, two 2012 releases, four 21st Century prize variants from 2014 and the 2017 Clear Special.',
    description_it='Fire Dragon Jr. è la Racing Mini 4WD No.11 di Tamiya, nata nel 1988. La famiglia collezionistica comprende il kit originale su Type 1, la Memorial Edition limitata del 1998, due uscite del 2012, quattro varianti premio 21st Century del 2014 e la Clear Special del 2017.',
    metadata=coalesce(metadata,'{}'::jsonb) || jsonb_build_object(
      'catalog_audit','2026-09-26',
      'canonical_release_count',9,
      'catalog_publication_gate',jsonb_build_object(
        'version','2026-09-26',
        'public_release_count',9,
        'research_only_release_count',0,
        'market_value_required',false
      )
    ),
    updated_at=now()
where id='65c7f3e3-ebfc-55a6-8855-c0c495164b72'::uuid;

-- Existing original row: the legacy Tamiya image belonged to the 2012 product page.
update public.product_releases
set item_number='18011',
    release_type='Original',
    edition_name='Fire Dragon Jr. — 1988 Original',
    release_year=1988,
    release_date=date '1988-06-16',
    chassis='Type 1',
    barcode_jan='4950344180110',
    color='Red body / black Type 1 chassis / white wheels / black spike tires',
    country_market='Global / Japan',
    msrp_jpy=600,
    notes='Controlled re-audit 2026-09-26. Official Tamiya historical material confirms ITEM 18011 / Type 1 / 1988. Contemporary collector documentation places the original release on 1988-06-16. Suruga record 603066187 has the original JPY 660 tax-included price and exact Type 1 product image.',
    discontinued=true,
    is_original=true,
    rarity='Rare',
    data_source='master_reaudit_20260926',
    edition_type='original',
    verification_status='verified',
    production_status='discontinued',
    status_checked_at=now(),
    description='Original 1988 Fire Dragon Jr. on Type 1 chassis, ITEM 18011.',
    description_it='Fire Dragon Jr. originale del 1988 su telaio Type 1, ITEM 18011.',
    catalog_visibility='public',
    catalog_visibility_reason='publication_gate:exact_high_confidence_release_image',
    catalog_visibility_updated_at=now(),
    updated_at=now()
where id='0e24ff2a-70e6-5909-b28d-67400a365c92'::uuid;

-- Existing Premium row.
update public.product_releases
set item_number='18072',
    release_type='Premium',
    edition_name='Fire Dragon Premium — VS Chassis',
    release_year=2012,
    release_date=date '2012-07-07',
    chassis='VS',
    barcode_jan='4950344180721',
    color='Metallic red body / metallic-gray VS chassis / fluorescent-pink large wheels / black spike tires',
    country_market='Global / Japan',
    msrp_jpy=1000,
    notes='Controlled re-audit 2026-09-26. Official Tamiya confirms ITEM 18072, release 2012-07-07, VS chassis and JPY 1,000 pre-tax MSRP. Hobby Search corroborates JAN 4950344180721.',
    discontinued=false,
    is_original=false,
    rarity='Uncommon',
    data_source='master_reaudit_20260926',
    edition_type='reissue',
    verification_status='verified',
    production_status='active',
    status_checked_at=now(),
    description='2012 Premium redesign of Fire Dragon on VS chassis, ITEM 18072.',
    description_it='Reinterpretazione Premium del 2012 della Fire Dragon su telaio VS, ITEM 18072.',
    catalog_visibility='public',
    catalog_visibility_reason='publication_gate:exact_official_release_image_and_sold_evidence',
    catalog_visibility_updated_at=now(),
    updated_at=now()
where id='daf1d532-80b5-524f-896e-fb577dae2445'::uuid;

-- Missing canonical Releases.
insert into public.product_releases(
  product_id,item_number,release_type,edition_name,release_year,release_date,chassis,barcode_jan,color,
  country_market,msrp_jpy,notes,discontinued,is_original,rarity,data_source,edition_type,
  verification_status,production_status,status_checked_at,description,description_it,
  catalog_visibility,catalog_visibility_reason,catalog_visibility_updated_at
) values
(
  '65c7f3e3-ebfc-55a6-8855-c0c495164b72'::uuid,'18011','Limited Reissue',
  'Fire Dragon Jr. — 1998 Memorial Edition (Limited Reissue)',1998,null,'Type 1',null,
  'Red body / Memorial limited-reissue packaging','Japan',600,
  'Controlled re-audit 2026-09-26. TEA-League places the Memorial Edition in December 1998 and Mandarake independently identifies the 1998 ITEM 18011 limited reissue. Recent exact Yahoo closed-sale evidence is persisted separately.',
  true,false,'Rare','master_reaudit_20260926','reissue','verified','discontinued',now(),
  '1998 Memorial Edition / limited reissue of Fire Dragon Jr., retaining ITEM 18011.',
  'Memorial Edition / ristampa limitata del 1998 della Fire Dragon Jr., ancora ITEM 18011.',
  'public','publication_gate:credible_exact_release_market_signal',now()
),
(
  '65c7f3e3-ebfc-55a6-8855-c0c495164b72'::uuid,'18011','Spot Reissue',
  'Fire Dragon Jr. — 2012 Reissue',2012,date '2012-08-11','Type 1',null,
  'Red body / black Type 1 chassis / white wheels / black spike tires','Global / Japan',900,
  'Controlled re-audit 2026-09-26. Official Tamiya ITEM 18011 page and Suruga record 603023572 both identify the 2012-08-11 reissue at JPY 900 pre-tax / JPY 990 tax-included.',
  false,false,'Uncommon','master_reaudit_20260926','reissue','verified','active',now(),
  'August 2012 reissue of the classic Type 1 Fire Dragon Jr., ITEM 18011.',
  'Ristampa dell’agosto 2012 della classica Fire Dragon Jr. su Type 1, ITEM 18011.',
  'public','publication_gate:exact_high_confidence_release_image',now()
),
(
  '65c7f3e3-ebfc-55a6-8855-c0c495164b72'::uuid,'92290','Prize Limited',
  'Fire Dragon 21st Century Edition — Clear Red',2014,null,'VS',null,
  'Clear red body / VS chassis / red-plated large wheels','Japan',null,
  'Controlled re-audit 2026-09-26. Exact Tamiya/SK Japan amusement-prize release. Suruga record 603051946 identifies ITEM 92290 and the Clear Red variant.',
  true,false,'Rare','master_reaudit_20260926','special','verified','discontinued',now(),
  '2014 amusement-prize Fire Dragon 21st Century Edition, Clear Red, ITEM 92290.',
  'Fire Dragon 21st Century Edition premio amusement del 2014, Clear Red, ITEM 92290.',
  'public','publication_gate:exact_high_confidence_release_image',now()
),
(
  '65c7f3e3-ebfc-55a6-8855-c0c495164b72'::uuid,'92291','Prize Limited',
  'Fire Dragon 21st Century Edition — Pearl',2014,null,'VS','4519869410005',
  'Pearl-white body / deep-blue VS chassis / red-plated large wheels','Japan',null,
  'Controlled re-audit 2026-09-26. Exact Tamiya/SK Japan amusement-prize release. Suruga record 603051947 identifies ITEM 92291 and the Pearl variant; secondary catalog metadata corroborates the 2014 release.',
  true,false,'Rare','master_reaudit_20260926','special','verified','discontinued',now(),
  '2014 amusement-prize Fire Dragon 21st Century Edition, Pearl, ITEM 92291.',
  'Fire Dragon 21st Century Edition premio amusement del 2014, Pearl, ITEM 92291.',
  'public','publication_gate:exact_high_confidence_release_image',now()
),
(
  '65c7f3e3-ebfc-55a6-8855-c0c495164b72'::uuid,'92292','Prize Limited',
  'Fire Dragon 21st Century Edition — Black',2014,null,'VS',null,
  'Black body / red VS chassis / red-plated large wheels / white spike tires','Japan',null,
  'Controlled re-audit 2026-09-26. Exact Tamiya/SK Japan amusement-prize release. Suruga record 603051948 identifies ITEM 92292 and the Black variant.',
  true,false,'Rare','master_reaudit_20260926','special','verified','discontinued',now(),
  '2014 amusement-prize Fire Dragon 21st Century Edition, Black, ITEM 92292.',
  'Fire Dragon 21st Century Edition premio amusement del 2014, Black, ITEM 92292.',
  'public','publication_gate:exact_high_confidence_release_image',now()
),
(
  '65c7f3e3-ebfc-55a6-8855-c0c495164b72'::uuid,'92293','Prize Limited',
  'Fire Dragon 21st Century Edition — Clear Blue',2014,null,'VS',null,
  'Clear blue body / red VS chassis / red-plated large wheels / white spike tires','Japan',null,
  'Controlled re-audit 2026-09-26. Exact Tamiya/SK Japan amusement-prize release. Suruga record 603051949 identifies ITEM 92293 and the Clear Blue variant.',
  true,false,'Rare','master_reaudit_20260926','special','verified','discontinued',now(),
  '2014 amusement-prize Fire Dragon 21st Century Edition, Clear Blue, ITEM 92293.',
  'Fire Dragon 21st Century Edition premio amusement del 2014, Clear Blue, ITEM 92293.',
  'public','publication_gate:exact_high_confidence_release_image',now()
),
(
  '65c7f3e3-ebfc-55a6-8855-c0c495164b72'::uuid,'95337','Clear Special',
  'Fire Dragon Clear Special — Polycarbonate Body',2017,date '2017-08-05','VS','4950344953370',
  'Clear polycarbonate body / black reinforced VS chassis / black V-spoke wheels / red hard barrel tires','Global / Japan',1200,
  'Controlled re-audit 2026-09-26. Official Tamiya confirms ITEM 95337, release 2017-08-05, VS chassis and JPY 1,200 pre-tax MSRP. Suruga record 603082007 corroborates JAN 4950344953370 and provides the exact stable image.',
  true,false,'Uncommon','master_reaudit_20260926','special','verified','discontinued',now(),
  '2017 Fire Dragon Clear Special with polycarbonate body on reinforced VS chassis, ITEM 95337.',
  'Fire Dragon Clear Special 2017 con carrozzeria in policarbonato e telaio VS rinforzato, ITEM 95337.',
  'public','publication_gate:exact_high_confidence_release_image_and_sold_evidence',now()
)
on conflict on constraint product_releases_identity_unique do update set
  release_type=excluded.release_type,
  release_date=excluded.release_date,
  chassis=excluded.chassis,
  barcode_jan=coalesce(excluded.barcode_jan,public.product_releases.barcode_jan),
  color=excluded.color,
  country_market=excluded.country_market,
  msrp_jpy=excluded.msrp_jpy,
  notes=excluded.notes,
  discontinued=excluded.discontinued,
  is_original=excluded.is_original,
  rarity=excluded.rarity,
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
select gen_random_uuid(),r.id,s.source_type,s.source_url,s.verified_fields,date '2026-09-26',s.notes
from (
  values
  ('Fire Dragon Jr. — 1988 Original','official_archive','https://www.tamiya.com/cms/japan/mini4wd/jr_news/jr_news16/pdf/000191.pdf',array['itemNumber','releaseYear','chassis'], 'Official Tamiya retrospective identifies ITEM 18011 / Type 1 / released in 1988.'),
  ('Fire Dragon Jr. — 1988 Original','trusted_secondary','https://www.suruga-ya.jp/product/detail/603066187',array['itemNumber','chassis','image','barcodeJAN'], 'Original-price Suruga record at JPY 660 tax-included; exact Type 1 image and JAN 4950344180110.'),
  ('Fire Dragon Jr. — 1998 Memorial Edition (Limited Reissue)','trusted_secondary','https://www.tea-league.com/mt/tea/archives/2000/01/19821999.html',array['editionName','releaseYear'], 'Historical timeline places the Fire Dragon Jr. Memorial Edition in December 1998 and records the limited-reissue package wording.'),
  ('Fire Dragon Jr. — 1998 Memorial Edition (Limited Reissue)','trusted_secondary','https://ekizo.mandarake.co.jp/auction/item/itemInfoEn.html?index=769489',array['itemNumber','editionName','releaseYear'], 'Mandarake independently identifies the 1998 ITEM 18011 limited reissue and unassembled contents.'),
  ('Fire Dragon Premium — VS Chassis','official_manufacturer','https://www.tamiya.com/japan/products/18072/index.html',array['itemNumber','editionName','releaseDate','chassis','msrp','image'], 'Official Tamiya ITEM 18072 page: release 2012-07-07, VS chassis, JPY 1,000 pre-tax.'),
  ('Fire Dragon Premium — VS Chassis','trusted_secondary','https://www.1999.co.jp/10183863',array['itemNumber','barcodeJAN','chassis'], 'Hobby Search corroborates ITEM 18072 / JAN 4950344180721.'),
  ('Fire Dragon Jr. — 2012 Reissue','official_manufacturer','https://www.tamiya.com/japan/products/18011/index.html',array['itemNumber','editionName','releaseDate','chassis','msrp','image'], 'Official Tamiya ITEM 18011 page records the 2012-08-11 reissue and JPY 900 pre-tax price.'),
  ('Fire Dragon Jr. — 2012 Reissue','trusted_secondary','https://www.suruga-ya.jp/product/detail/603023572',array['itemNumber','releaseDate','image'], 'Exact Suruga record for the 2012-08-11 ITEM 18011 reissue.'),
  ('Fire Dragon 21st Century Edition — Clear Red','trusted_secondary','https://www.suruga-ya.jp/product/detail/603051946',array['itemNumber','editionName','color','image'], 'Exact Tamiya/SK Japan amusement-prize ITEM 92290 Clear Red record.'),
  ('Fire Dragon 21st Century Edition — Pearl','trusted_secondary','https://www.suruga-ya.jp/product/detail/603051947',array['itemNumber','editionName','color','image'], 'Exact Tamiya/SK Japan amusement-prize ITEM 92291 Pearl record.'),
  ('Fire Dragon 21st Century Edition — Black','trusted_secondary','https://www.suruga-ya.jp/product/detail/603051948',array['itemNumber','editionName','color','image'], 'Exact Tamiya/SK Japan amusement-prize ITEM 92292 Black record.'),
  ('Fire Dragon 21st Century Edition — Clear Blue','trusted_secondary','https://www.suruga-ya.jp/product/detail/603051949',array['itemNumber','editionName','color','image'], 'Exact Tamiya/SK Japan amusement-prize ITEM 92293 Clear Blue record.'),
  ('Fire Dragon 21st Century Edition — Clear Red','trusted_secondary','https://mini-4wd.fandom.com/wiki/Fire_Dragon_Jr.',array['releaseYear','chassis'], 'Secondary genealogy corroborates the 2014 21st Century prize wave and VS chassis.'),
  ('Fire Dragon 21st Century Edition — Pearl','trusted_secondary','https://mini-4wd.fandom.com/wiki/Fire_Dragon_Jr.',array['releaseYear','chassis'], 'Secondary genealogy corroborates the 2014 21st Century prize wave and VS chassis.'),
  ('Fire Dragon 21st Century Edition — Black','trusted_secondary','https://mini-4wd.fandom.com/wiki/Fire_Dragon_Jr.',array['releaseYear','chassis'], 'Secondary genealogy corroborates the 2014 21st Century prize wave and VS chassis.'),
  ('Fire Dragon 21st Century Edition — Clear Blue','trusted_secondary','https://mini-4wd.fandom.com/wiki/Fire_Dragon_Jr.',array['releaseYear','chassis'], 'Secondary genealogy corroborates the 2014 21st Century prize wave and VS chassis.'),
  ('Fire Dragon Clear Special — Polycarbonate Body','official_manufacturer','https://www.tamiya.com/japan/products/95337/index.html',array['itemNumber','editionName','releaseDate','chassis','msrp'], 'Official Tamiya ITEM 95337 page: release 2017-08-05, VS chassis, JPY 1,200 pre-tax.'),
  ('Fire Dragon Clear Special — Polycarbonate Body','trusted_secondary','https://www.suruga-ya.jp/kaitori/kaitori_detail/603082007',array['itemNumber','barcodeJAN','releaseDate','image'], 'Suruga corroborates ITEM 95337 / JAN 4950344953370 / 2017-08-05 and provides exact stable image.')
) as s(edition_name,source_type,source_url,verified_fields,notes)
join public.product_releases r
  on r.product_id='65c7f3e3-ebfc-55a6-8855-c0c495164b72'::uuid
 and r.edition_name=s.edition_name
where not exists (
  select 1 from public.release_sources x
  where x.release_id=r.id and x.source_url=s.source_url
);

-- Exact images. Memorial intentionally remains without a stored hero until a stable
-- direct exact asset is found; it is public because exact market evidence exists.
delete from public.release_images
where release_id in (
  select id from public.product_releases
  where product_id='65c7f3e3-ebfc-55a6-8855-c0c495164b72'::uuid
    and edition_name in (
      'Fire Dragon Jr. — 1988 Original',
      'Fire Dragon Jr. — 2012 Reissue',
      'Fire Dragon 21st Century Edition — Clear Red',
      'Fire Dragon 21st Century Edition — Pearl',
      'Fire Dragon 21st Century Edition — Black',
      'Fire Dragon 21st Century Edition — Clear Blue',
      'Fire Dragon Clear Special — Polycarbonate Body'
    )
);

insert into public.release_images(id,release_id,url,position)
select gen_random_uuid(),r.id,v.url,0
from (
  values
  ('Fire Dragon Jr. — 1988 Original','https://cdn.suruga-ya.jp/database/pics_webp/game/603066187.jpg.webp'),
  ('Fire Dragon Jr. — 2012 Reissue','https://cdn.suruga-ya.jp/database/pics_webp/game/603023572.jpg.webp'),
  ('Fire Dragon 21st Century Edition — Clear Red','https://cdn.suruga-ya.jp/database/pics_webp/game/603051946.jpg.webp'),
  ('Fire Dragon 21st Century Edition — Pearl','https://cdn.suruga-ya.jp/database/pics_webp/game/603051947.jpg.webp'),
  ('Fire Dragon 21st Century Edition — Black','https://cdn.suruga-ya.jp/database/pics_webp/game/603051948.jpg.webp'),
  ('Fire Dragon 21st Century Edition — Clear Blue','https://cdn.suruga-ya.jp/database/pics_webp/game/603051949.jpg.webp'),
  ('Fire Dragon Clear Special — Polycarbonate Body','https://cdn.suruga-ya.jp/database/pics_webp/game/603082007.jpg.webp')
) as v(edition_name,url)
join public.product_releases r
  on r.product_id='65c7f3e3-ebfc-55a6-8855-c0c495164b72'::uuid
 and r.edition_name=v.edition_name;

-- Keep the healthy official 18072 image but ensure exactly one hero.
delete from public.release_images
where release_id='daf1d532-80b5-524f-896e-fb577dae2445'::uuid
  and position<>0;

update public.release_images
set url='https://www.tamiya.com/japan_contents/img/usr/item/1/18072/18072_1.jpg'
where release_id='daf1d532-80b5-524f-896e-fb577dae2445'::uuid
  and position=0;

-- Verified identifiers where release-specific evidence is clean.
insert into public.release_identifiers(id,release_id,scheme,value,market,is_primary,verification_status,source_url,checked_at)
select gen_random_uuid(),r.id,'JAN',v.value,'JP',true,'verified',v.source_url,now()
from (
  values
  ('Fire Dragon Jr. — 1988 Original','4950344180110','https://www.suruga-ya.jp/product/detail/603066187'),
  ('Fire Dragon Premium — VS Chassis','4950344180721','https://www.1999.co.jp/10183863'),
  ('Fire Dragon Clear Special — Polycarbonate Body','4950344953370','https://www.suruga-ya.jp/kaitori/kaitori_detail/603082007')
) as v(edition_name,value,source_url)
join public.product_releases r
  on r.product_id='65c7f3e3-ebfc-55a6-8855-c0c495164b72'::uuid
 and r.edition_name=v.edition_name
where not exists (
  select 1 from public.release_identifiers x
  where x.release_id=r.id and x.scheme='JAN' and x.value=v.value
);

-- Exact recent completed-sale evidence.
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
  'https://auctions.yahoo.co.jp/closedsearch/closedsearch/%E3%83%95%E3%82%A1%E3%82%A4%E3%83%A4%E3%83%BC%E3%83%89%E3%83%A9%E3%82%B4%E3%83%B3%20%E3%83%9F%E3%83%8B%E5%9B%9B%E9%A7%86/0/',
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
    'Fire Dragon Jr. — 1998 Memorial Edition (Limited Reissue)',
    'yahoo-auctions:fire-dragon-memorial-1998:2026-06-03:2970',
    '1円～ タミヤ レーサーミニ四駆 1/32 ファイヤードラゴンJr. 初期レーサーミニ四駆オリジナル仕様 限定復刻版',
    '18011',2970::numeric,date '2026-06-03','限定復刻版 未組立','unknown','strong',
    array['item_number_exact','edition_name_exact','reissue_stated','manual_override']::text[],
    'Exact 1998-style limited reissue wording; completed JPY 2,970 sale.'
  ),
  (
    'Fire Dragon Jr. — 1998 Memorial Edition (Limited Reissue)',
    'yahoo-auctions:fire-dragon-memorial-1998:2026-05-22:2400',
    'タミヤ ミニ四駆 ファイヤードラゴンJr. 限定復刻版 （未組立品）',
    '18011',2400::numeric,date '2026-05-22','未組立品','unknown','strong',
    array['item_number_exact','edition_name_exact','reissue_stated','manual_override']::text[],
    'Exact limited-reissue unassembled sale; JPY 2,400.'
  ),
  (
    'Fire Dragon Jr. — 1998 Memorial Edition (Limited Reissue)',
    'yahoo-auctions:fire-dragon-memorial-1998:2026-05-01:3300',
    'レーサーミニ四駆シリーズ 1/32 ファイヤードラゴンJr. 限定復刻版 TAMIYA 未組立て',
    '18011',3300::numeric,date '2026-05-01','未組立','unknown','strong',
    array['item_number_exact','edition_name_exact','reissue_stated','manual_override']::text[],
    'Exact limited-reissue unassembled sale; JPY 3,300.'
  ),
  (
    'Fire Dragon Premium — VS Chassis',
    'yahoo-auctions:fire-dragon-18072:2026-04-28:4050',
    '未使用品 TAMIYA 1/32 ファイヤードラゴン プレミアム(VSシャーシ) No.72 [18072] 未組立',
    '18072',4050::numeric,date '2026-04-28','未使用 未組立','unknown','exact',
    array['item_number_exact','edition_name_exact','chassis_stated','manual_override']::text[],
    'Exact ITEM 18072 unused/unassembled completed sale; JPY 4,050.'
  ),
  (
    'Fire Dragon Premium — VS Chassis',
    'yahoo-auctions:fire-dragon-18072:2026-04-24:3050',
    '販売終了品 絶版 タミヤ ミニ四駆 ファイヤードラゴン プレミアム VSシャーシ',
    '18072',3050::numeric,date '2026-04-24','未使用','unknown','exact',
    array['item_number_exact','edition_name_exact','chassis_stated','manual_override']::text[],
    'Exact Fire Dragon Premium VS completed sale; JPY 3,050.'
  ),
  (
    'Fire Dragon Clear Special — Polycarbonate Body',
    'yahoo-auctions:fire-dragon-95337:2026-05-28:4600',
    'TAMIYA レーサーミニ四駆シリーズ特別仕様モデル ファイヤードラゴン クリヤースペシャルのキット ポリカボディ VSシャーシ 未開封品',
    '95337',4600::numeric,date '2026-05-28','未開封品','unknown','strong',
    array['item_number_exact','edition_name_exact','chassis_stated','manual_override']::text[],
    'Exact Clear Special unopened completed sale; JPY 4,600.'
  ),
  (
    'Fire Dragon Clear Special — Polycarbonate Body',
    'yahoo-auctions:fire-dragon-95337:2026-05-02:1500',
    'タミヤ ミニ四駆 ファイヤードラゴン クリヤースペシャル（ポリカボディ） 新品未使用 95337 VSシャーシ 箱潰れ',
    '95337',1500::numeric,date '2026-05-02','新品未使用 箱潰れ','significantly_damaged','exact',
    array['item_number_exact','edition_name_exact','chassis_stated','manual_override']::text[],
    'Exact ITEM 95337 unused completed sale; JPY 1,500; crushed box stated.'
  ),
  (
    'Fire Dragon Clear Special — Polycarbonate Body',
    'yahoo-auctions:fire-dragon-95337:2026-04-30:990',
    'プラモデル 未組立 タミヤ 1/32 ファイヤードラゴン クリヤースペシャル ポリカボディ ミニ四駆特別企画',
    '95337',990::numeric,date '2026-04-30','未組立','unknown','strong',
    array['item_number_exact','edition_name_exact','manual_override']::text[],
    'Exact Clear Special unassembled completed sale; JPY 990.'
  )
) as v(edition_name,source_record_key,title_raw,item_number_observed,price,sold_on,condition_raw,box_condition,match_confidence,match_evidence,review_notes)
join public.product_releases r
  on r.product_id='65c7f3e3-ebfc-55a6-8855-c0c495164b72'::uuid
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
    ('yahoo-auctions:fire-dragon-memorial-1998:2026-06-03:2970'::text,0.00538619::numeric,date '2026-06-03'),
    ('yahoo-auctions:fire-dragon-memorial-1998:2026-05-22:2400'::text,0.00542064::numeric,date '2026-05-20'),
    ('yahoo-auctions:fire-dragon-memorial-1998:2026-05-01:3300'::text,0.00543981::numeric,date '2026-05-04'),
    ('yahoo-auctions:fire-dragon-18072:2026-04-28:4050'::text,0.00536193::numeric,date '2026-04-23'),
    ('yahoo-auctions:fire-dragon-18072:2026-04-24:3050'::text,0.00536193::numeric,date '2026-04-23'),
    ('yahoo-auctions:fire-dragon-95337:2026-05-28:4600'::text,0.00539229::numeric,date '2026-05-29'),
    ('yahoo-auctions:fire-dragon-95337:2026-05-02:1500'::text,0.00543981::numeric,date '2026-05-04'),
    ('yahoo-auctions:fire-dragon-95337:2026-04-30:990'::text,0.00543981::numeric,date '2026-05-04')
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

-- Recompute exact SOLD-backed Releases.
select public.trackdash_enqueue_market_recompute(r.id,'new_complete_unbuilt')
from public.product_releases r
where r.product_id='65c7f3e3-ebfc-55a6-8855-c0c495164b72'::uuid
  and r.edition_name in (
    'Fire Dragon Jr. — 1998 Memorial Edition (Limited Reissue)',
    'Fire Dragon Premium — VS Chassis',
    'Fire Dragon Clear Special — Polycarbonate Body'
  );

-- Enroll every item-numbered Release.
select public.trackdash_enroll_release_market_scans(r.id)
from public.product_releases r
where r.product_id='65c7f3e3-ebfc-55a6-8855-c0c495164b72'::uuid
  and r.item_number is not null;

-- Shared ITEM 18011 must remain fail-closed for unattended eBay matching.
update public.market_scan_queue q
set enabled=false,
    next_scan_at=timestamptz '2099-01-01 00:00:00+00',
    last_error='DISABLED_SHARED_ITEM_NUMBER_18011',
    locked_until=null,
    updated_at=now()
from public.price_sources ps
where q.source_id=ps.id
  and ps.slug='ebay_active_public'
  and q.release_id in (
    select id from public.product_releases
    where product_id='65c7f3e3-ebfc-55a6-8855-c0c495164b72'::uuid
      and item_number='18011'
  );

-- Unique Item Numbers are safe for exact automatic eBay matching; stage them
-- at the head of the queue for the post-deploy initial scan.
update public.market_scan_queue q
set enabled=true,
    priority=130,
    next_scan_at=timestamptz '2000-01-01 00:00:00+00',
    consecutive_failures=0,
    last_error=null,
    locked_until=null,
    updated_at=now()
from public.price_sources ps
where q.source_id=ps.id
  and ps.slug='ebay_active_public'
  and q.release_id in (
    select id from public.product_releases
    where product_id='65c7f3e3-ebfc-55a6-8855-c0c495164b72'::uuid
      and item_number in ('18072','92290','92291','92292','92293','95337')
  );

commit;
