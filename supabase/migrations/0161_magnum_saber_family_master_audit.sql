-- Magnum Saber family Master audit — 2026-09-24
-- Canonical collector family after this migration:
-- 19401 Original 1994, 94618 Special Kit 2007, 19431 Premium 2010,
-- 92318/92319/92320/92321 First Impact 2015 prize variants,
-- 19401 Reissue 2015 (same Item Number, distinct JAN),
-- and the 2026 Tokyo Anime Center collaboration.
--
-- The 1994 and 2015 19401 kits are distinct collector Releases because
-- reliable exact-product metadata exposes different JANs:
-- original 4950344194018 vs reissue 4950344061310.
-- ITEM-only scanner resolution must therefore fail closed for 19401.

begin;

update public.products
set series='Fully Cowled Mini 4WD',
    chassis='Super 1',
    original_release_year=1994,
    updated_at=now()
where id='fa551244-1a12-54ec-b937-ad1b5603e8bb'::uuid;

-- Original 1994 commercial release.
update public.product_releases
set item_number='19401',
    release_type='Original',
    edition_name='Magnum Saber',
    release_year=1994,
    release_date=date '1994-09-07',
    chassis='Super 1',
    barcode_jan='4950344194018',
    color='White / Blue',
    country_market='Japan',
    msrp_jpy=660,
    discontinued=true,
    is_original=true,
    rarity='Very Rare',
    data_source='master_reaudit_20260924',
    edition_type='original',
    verification_status='verified',
    production_status='discontinued',
    status_checked_at=now(),
    description='Original 1994 Magnum Saber, the first Fully Cowled Mini 4WD release, on the Super 1 chassis.',
    description_it='Magnum Saber originale del 1994, prima uscita della serie Fully Cowled Mini 4WD, su telaio Super 1.',
    notes=concat_ws(' ',nullif(notes,''),
      'TrackDash Master re-audit 2026-09-24: original 1994 collector Release. Exact historical sources distinguish this Release by JAN 4950344194018. A separate 2015 reissue exists under the same ITEM 19401 but JAN 4950344061310; item-number-only scanner resolution must therefore fail closed and use JAN/edition evidence to disambiguate. Tamiya USA marks the legacy item discontinued.'),
    updated_at=now()
where id='4a1b7d1f-a2f7-5113-9962-21fa14a47968'::uuid;

-- Premium: legacy TrackDash row incorrectly had 2012. Historical Tamiya-show
-- documentation and current official pages establish 2010-12-23 / Super II.
update public.product_releases
set item_number='19431',
    release_type='Premium',
    edition_name='Magnum Saber Premium',
    release_year=2010,
    release_date=date '2010-12-23',
    chassis='Super II',
    barcode_jan='4950344194315',
    color='White / Blue',
    country_market='Japan',
    msrp_jpy=945,
    discontinued=false,
    is_original=false,
    rarity='Common',
    data_source='master_reaudit_20260924',
    edition_type='premium',
    verification_status='verified',
    production_status='active',
    status_checked_at=now(),
    description='2010 Magnum Saber Premium on the reinforced Super II chassis.',
    description_it='Magnum Saber Premium del 2010 su telaio Super II rinforzato.',
    notes=concat_ws(' ',nullif(notes,''),
      'TrackDash Master re-audit 2026-09-24: corrected legacy year 2012 to the verified 2010 release. Contemporary Tamiya show material lists ITEM 19431 for December 2010 at JPY 945; exact release date is 2010-12-23. JAN 4950344194315 and Super II identity are independently corroborated. Current official Tamiya channels still list the model, so production status remains active at this audit.'),
    updated_at=now()
where id='0fdbfd56-f257-5b84-b541-e08a7450cc34'::uuid;

-- 2007 Special Kit: distinct limited commercial package with Magnum Saber and
-- Sonic Saber bodies on a reinforced Super 1 chassis.
insert into public.product_releases(
  id,product_id,item_number,release_type,edition_name,release_year,release_date,
  chassis,barcode_jan,color,country_market,msrp_jpy,notes,discontinued,is_original,
  rarity,data_source,edition_type,verification_status,production_status,status_checked_at,
  description,description_it
) values (
  'c55391c4-d9f8-56fe-a6dc-7bd170172268'::uuid,
  'fa551244-1a12-54ec-b937-ad1b5603e8bb'::uuid,
  '94618','Special Edition','Magnum Saber Special Kit',2007,date '2007-09-29',
  'Super 1','4950344946181','White / Blue','Japan',1155,
  'TrackDash Master re-audit 2026-09-24: distinct limited 2007 Special Kit. Tamiya documents two fiberglass-reinforced bodies (Magnum Saber + Sonic Saber) on a reinforced Super 1 chassis. Exact historical launch date 2007-09-29 and JAN 4950344946181 are independently corroborated. Discontinued.',
  true,false,'Rare','master_reaudit_20260924','special','verified','discontinued',now(),
  'Limited 2007 Magnum Saber Special Kit with Magnum Saber and Sonic Saber reinforced bodies on Super 1.',
  'Kit speciale limitato Magnum Saber del 2007 con carrozzerie rinforzate Magnum Saber e Sonic Saber su telaio Super 1.'
)
on conflict(id) do update set
  product_id=excluded.product_id,item_number=excluded.item_number,release_type=excluded.release_type,
  edition_name=excluded.edition_name,release_year=excluded.release_year,release_date=excluded.release_date,
  chassis=excluded.chassis,barcode_jan=excluded.barcode_jan,color=excluded.color,
  country_market=excluded.country_market,msrp_jpy=excluded.msrp_jpy,notes=excluded.notes,
  discontinued=excluded.discontinued,is_original=excluded.is_original,rarity=excluded.rarity,
  data_source=excluded.data_source,edition_type=excluded.edition_type,
  verification_status=excluded.verification_status,production_status=excluded.production_status,
  status_checked_at=excluded.status_checked_at,description=excluded.description,
  description_it=excluded.description_it,updated_at=now();

-- 2015 amusement-prize First Impact family. No exact day is invented:
-- contemporary sources say late July 2015. Shared assortment JAN metadata is
-- not stored as a release-specific barcode.
insert into public.product_releases(
  id,product_id,item_number,release_type,edition_name,release_year,release_date,
  chassis,barcode_jan,color,country_market,notes,discontinued,is_original,
  rarity,data_source,edition_type,verification_status,production_status,status_checked_at,
  description,description_it
) values
(
  '6794b234-e47e-5464-bf91-a90ab40b16df'::uuid,
  'fa551244-1a12-54ec-b937-ad1b5603e8bb'::uuid,
  '92318','Limited Edition','Magnum Saber First Impact (Blue)',2015,null,
  'Super 1',null,'Blue','Japan',
  'TrackDash Master re-audit 2026-09-24: SK Japan/Tamiya amusement-prize First Impact variant, late July 2015. ITEM 92318 is the Blue physical variant; motor included, gold-plated wheels, white Super 1 chassis. No release-specific JAN is stored because secondary catalog metadata exposes the prize assortment barcode across multiple colors.',
  true,false,'Rare','master_reaudit_20260924','limited','verified','discontinued',now(),
  '2015 amusement-prize Magnum Saber First Impact Blue variant on Super 1.',
  'Variante premio amusement Magnum Saber First Impact Blue del 2015 su telaio Super 1.'
),
(
  '5e92792c-9b20-59f3-916f-ce485c555778'::uuid,
  'fa551244-1a12-54ec-b937-ad1b5603e8bb'::uuid,
  '92319','Limited Edition','Magnum Saber First Impact (Red)',2015,null,
  'Super 1',null,'Red','Japan',
  'TrackDash Master re-audit 2026-09-24: SK Japan/Tamiya amusement-prize First Impact variant, late July 2015. ITEM 92319 is the Red physical variant; motor included, gold-plated wheels, white Super 1 chassis. Shared assortment barcode metadata is not promoted into a release-specific JAN.',
  true,false,'Rare','master_reaudit_20260924','limited','verified','discontinued',now(),
  '2015 amusement-prize Magnum Saber First Impact Red variant on Super 1.',
  'Variante premio amusement Magnum Saber First Impact Red del 2015 su telaio Super 1.'
),
(
  'a7ee5c90-da2a-5eb1-92a7-3895082186ff'::uuid,
  'fa551244-1a12-54ec-b937-ad1b5603e8bb'::uuid,
  '92320','Limited Edition','Magnum Saber First Impact (White)',2015,null,
  'Super 1',null,'White','Japan',
  'TrackDash Master re-audit 2026-09-24: SK Japan/Tamiya amusement-prize First Impact variant, late July 2015. ITEM 92320 is the White physical variant with red Super 1 chassis and gold-plated wheels. Suruga exposes JAN 4519869507002, also used by the prize assortment/other color metadata, so TrackDash intentionally leaves barcode_jan null.',
  true,false,'Rare','master_reaudit_20260924','limited','verified','discontinued',now(),
  '2015 amusement-prize Magnum Saber First Impact White variant on Super 1.',
  'Variante premio amusement Magnum Saber First Impact White del 2015 su telaio Super 1.'
),
(
  'cb15faed-3873-58b9-a6c6-5553a556fd57'::uuid,
  'fa551244-1a12-54ec-b937-ad1b5603e8bb'::uuid,
  '92321','Limited Edition','Magnum Saber First Impact (Gray)',2015,null,
  'Super 1',null,'Gray','Japan',
  'TrackDash Master re-audit 2026-09-24: SK Japan/Tamiya amusement-prize First Impact variant, late July 2015. ITEM 92321 is the Gray physical variant with red Super 1 chassis and gold-plated wheels. Suruga exposes JAN 4519869507002, shared with other prize metadata; not used as a release-specific scanner identifier.',
  true,false,'Rare','master_reaudit_20260924','limited','verified','discontinued',now(),
  '2015 amusement-prize Magnum Saber First Impact Gray variant on Super 1.',
  'Variante premio amusement Magnum Saber First Impact Gray del 2015 su telaio Super 1.'
)
on conflict(id) do update set
  product_id=excluded.product_id,item_number=excluded.item_number,release_type=excluded.release_type,
  edition_name=excluded.edition_name,release_year=excluded.release_year,release_date=excluded.release_date,
  chassis=excluded.chassis,barcode_jan=excluded.barcode_jan,color=excluded.color,
  country_market=excluded.country_market,notes=excluded.notes,discontinued=excluded.discontinued,
  is_original=excluded.is_original,rarity=excluded.rarity,data_source=excluded.data_source,
  edition_type=excluded.edition_type,verification_status=excluded.verification_status,
  production_status=excluded.production_status,status_checked_at=excluded.status_checked_at,
  description=excluded.description,description_it=excluded.description_it,updated_at=now();

-- 2015 reissue of ITEM 19401. Same Item Number and specification family as the
-- original but a distinct commercial reissue with a different verified JAN.
insert into public.product_releases(
  id,product_id,item_number,release_type,edition_name,release_year,release_date,
  chassis,barcode_jan,color,country_market,msrp_jpy,notes,discontinued,is_original,
  rarity,data_source,edition_type,verification_status,production_status,status_checked_at,
  description,description_it
) values (
  'a3a62418-84ad-5828-abab-289afdb43044'::uuid,
  'fa551244-1a12-54ec-b937-ad1b5603e8bb'::uuid,
  '19401','Reissue','Magnum Saber (2015 Reissue)',2015,date '2015-09-05',
  'Super 1','4950344061310','White / Blue','Japan',858,
  'TrackDash Master re-audit 2026-09-24: distinct 2015 reissue of ITEM 19401. Suruga and AmiAmi independently identify the 2015-09-05 / September 2015 reissue under JAN 4950344061310, while the original 1994 collector Release uses JAN 4950344194018. This barcode/packaging discriminator is sufficient for a separate collector Release. ITEM-only scanner resolution must fail closed.',
  true,false,'Rare','master_reaudit_20260924','reissue','verified','discontinued',now(),
  'Official 2015 reissue of the original Magnum Saber on Super 1, distinguished from the 1994 release by JAN.',
  'Ristampa ufficiale 2015 del Magnum Saber originale su Super 1, distinta dalla release 1994 tramite JAN.'
)
on conflict(id) do update set
  product_id=excluded.product_id,item_number=excluded.item_number,release_type=excluded.release_type,
  edition_name=excluded.edition_name,release_year=excluded.release_year,release_date=excluded.release_date,
  chassis=excluded.chassis,barcode_jan=excluded.barcode_jan,color=excluded.color,
  country_market=excluded.country_market,msrp_jpy=excluded.msrp_jpy,notes=excluded.notes,
  discontinued=excluded.discontinued,is_original=excluded.is_original,rarity=excluded.rarity,
  data_source=excluded.data_source,edition_type=excluded.edition_type,
  verification_status=excluded.verification_status,production_status=excluded.production_status,
  status_checked_at=excluded.status_checked_at,description=excluded.description,
  description_it=excluded.description_it,updated_at=now();

-- 2026 Tokyo Anime Center 30th anniversary collaboration. It is based on
-- Magnum Saber Premium but has a unique official sticker design and commercial
-- identity. No autonomous Tamiya Item Number/JAN is invented.
insert into public.product_releases(
  id,product_id,item_number,release_type,edition_name,release_year,release_date,
  chassis,barcode_jan,color,country_market,msrp_jpy,notes,discontinued,is_original,
  rarity,data_source,edition_type,verification_status,production_status,status_checked_at,
  description,description_it
) values (
  '057f6e89-225a-583a-8ec6-390a7e5a0887'::uuid,
  'fa551244-1a12-54ec-b937-ad1b5603e8bb'::uuid,
  null,'Special Edition','Magnum Saber Tokyo Anime Center Model',2026,date '2026-07-03',
  'Super II',null,'Tokyo Anime Center livery','Japan',2860,
  'TrackDash Master re-audit 2026-09-24: official anime 30th-anniversary Tokyo Anime Center collaboration. Based on Magnum Saber Premium (Super II) with a unique black/red/blue/yellow Tokyo Anime Center sticker design. Initial event/online sales began 2026-07-03 at JPY 2,860 standalone. The Osaka POP UP official page still lists this model for sale in limited quantities through 2026-10-06; production/availability is therefore active at this audit date. No autonomous Tamiya Item Number or JAN is claimed.',
  false,false,'Uncommon','master_reaudit_20260924','special','verified','active',now(),
  '2026 Tokyo Anime Center 30th-anniversary collaboration based on Magnum Saber Premium with an exclusive sticker design.',
  'Collaborazione Tokyo Anime Center 2026 per il 30° anniversario, basata sul Magnum Saber Premium con grafiche adesive esclusive.'
)
on conflict(id) do update set
  product_id=excluded.product_id,item_number=excluded.item_number,release_type=excluded.release_type,
  edition_name=excluded.edition_name,release_year=excluded.release_year,release_date=excluded.release_date,
  chassis=excluded.chassis,barcode_jan=excluded.barcode_jan,color=excluded.color,
  country_market=excluded.country_market,msrp_jpy=excluded.msrp_jpy,notes=excluded.notes,
  discontinued=excluded.discontinued,is_original=excluded.is_original,rarity=excluded.rarity,
  data_source=excluded.data_source,edition_type=excluded.edition_type,
  verification_status=excluded.verification_status,production_status=excluded.production_status,
  status_checked_at=excluded.status_checked_at,description=excluded.description,
  description_it=excluded.description_it,updated_at=now();

-- Catalog provenance: original + 2015 reissue.
insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
select gen_random_uuid(),'4a1b7d1f-a2f7-5113-9962-21fa14a47968'::uuid,'trusted_secondary',
       'https://www.suruga-ya.jp/product/detail/603004020',
       array['itemNumber','editionName','releaseYear','msrp'],date '2026-09-24',
       'Exact historical Suruga product identity for the original Magnum Saber collector release.'
where not exists(select 1 from public.release_sources where release_id='4a1b7d1f-a2f7-5113-9962-21fa14a47968'::uuid and source_url='https://www.suruga-ya.jp/product/detail/603004020');

insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
select gen_random_uuid(),'4a1b7d1f-a2f7-5113-9962-21fa14a47968'::uuid,'trusted_secondary',
       'https://www.kaitori-world.jp/products/detail/323717',
       array['itemNumber','barcodeJAN','releaseDate'],date '2026-09-24',
       'Independent exact product metadata corroborates original ITEM 19401 / JAN 4950344194018 and 1994-09-07 release date.'
where not exists(select 1 from public.release_sources where release_id='4a1b7d1f-a2f7-5113-9962-21fa14a47968'::uuid and source_url='https://www.kaitori-world.jp/products/detail/323717');

insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
values
(gen_random_uuid(),'a3a62418-84ad-5828-abab-289afdb43044'::uuid,'trusted_secondary',
 'https://www.suruga-ya.jp/product/detail/603060158',
 array['itemNumber','editionName','releaseDate','barcodeJAN','msrp','image'],date '2026-09-24',
 'Exact Suruga identity for the 2015 ITEM 19401 reissue; management 603060158, date 2015-09-05, JAN 4950344061310. Selected exact-product image asset was independently HTTP-probed.'),
(gen_random_uuid(),'a3a62418-84ad-5828-abab-289afdb43044'::uuid,'trusted_secondary',
 'https://www.amiami.jp/top/detail/detail?gcode=TOY-SCL2-49753',
 array['itemNumber','editionName','releaseYear','barcodeJAN','reissueStatus'],date '2026-09-24',
 'AmiAmi explicitly labels the September 2015 ITEM 19401 product as a reissue and corroborates JAN 4950344061310.')
on conflict do nothing;

-- Premium provenance.
insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
values
(gen_random_uuid(),'0fdbfd56-f257-5b84-b541-e08a7450cc34'::uuid,'official_manufacturer',
 'https://www.tamiyausa.com/shop/132-super/jr-magnum-saber-premium/',
 array['itemNumber','editionName','chassis','marketAvailability'],date '2026-09-24',
 'Current official Tamiya USA exact page confirms ITEM 19431 Magnum Saber Premium, Super II and current retail availability.'),
(gen_random_uuid(),'0fdbfd56-f257-5b84-b541-e08a7450cc34'::uuid,'trusted_secondary',
 'https://www.tea-league.com/mt/tea/archives/2010/10/501pii.html',
 array['itemNumber','editionName','releaseYear','msrp'],date '2026-09-24',
 'Contemporary 2010 Tamiya hobby-show report lists ITEM 19431 Magnum Saber Premium for December 2010 at JPY 945.')
on conflict do nothing;

-- 94618 Special Kit provenance.
insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
values
(gen_random_uuid(),'c55391c4-d9f8-56fe-a6dc-7bd170172268'::uuid,'official_manufacturer',
 'https://www.tamiyausa.com/shop/132-super/jr-magnum-saber-special-kit/',
 array['itemNumber','editionName','chassis','bodyConfiguration','productionStatus'],date '2026-09-24',
 'Official Tamiya USA exact Special Kit page confirms ITEM 94618, reinforced Super 1, two-body configuration and discontinued status.'),
(gen_random_uuid(),'c55391c4-d9f8-56fe-a6dc-7bd170172268'::uuid,'trusted_secondary',
 'https://www.tea-league.com/mt/tea/archives/2007/09/10.html',
 array['itemNumber','editionName','releaseDate','msrp'],date '2026-09-24',
 'Contemporary September 2007 Mini 4WD release record corroborates 2007-09-29 launch.'),
(gen_random_uuid(),'c55391c4-d9f8-56fe-a6dc-7bd170172268'::uuid,'trusted_secondary',
 'https://shopping.rc-art.net/products//4950344946181/',
 array['itemNumber','barcodeJAN','editionName'],date '2026-09-24',
 'Exact Japanese retail metadata corroborates ITEM 94618 / JAN 4950344946181.')
on conflict do nothing;

-- Shared First Impact family provenance.
insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
select gen_random_uuid(),v.release_id,'trusted_secondary',
       'https://www.gamer.ne.jp/news/201507310013/',
       array['editionName','releaseYear','releasePeriod','colorFamily','distributionType'],date '2026-09-24',
       'Contemporary 2015 report: SK Japan amusement-prize Magnum Saber First Impact, four colors, introduced in late July 2015.'
from (values
 ('6794b234-e47e-5464-bf91-a90ab40b16df'::uuid),
 ('5e92792c-9b20-59f3-916f-ce485c555778'::uuid),
 ('a7ee5c90-da2a-5eb1-92a7-3895082186ff'::uuid),
 ('cb15faed-3873-58b9-a6c6-5553a556fd57'::uuid)
) v(release_id)
where not exists(select 1 from public.release_sources rs where rs.release_id=v.release_id and rs.source_url='https://www.gamer.ne.jp/news/201507310013/');

insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
select gen_random_uuid(),v.release_id,'trusted_secondary',
       'https://w.atwiki.jp/mini4vipwiki/pages/643.html',
       array['itemNumber','editionName','color','chassis','configuration'],date '2026-09-24',
       'Detailed collector reference maps ITEM 92318 Blue / 92319 Red / 92320 White / 92321 Gray and documents Super 1 chassis/color configurations.'
from (values
 ('6794b234-e47e-5464-bf91-a90ab40b16df'::uuid),
 ('5e92792c-9b20-59f3-916f-ce485c555778'::uuid),
 ('a7ee5c90-da2a-5eb1-92a7-3895082186ff'::uuid),
 ('cb15faed-3873-58b9-a6c6-5553a556fd57'::uuid)
) v(release_id)
where not exists(select 1 from public.release_sources rs where rs.release_id=v.release_id and rs.source_url='https://w.atwiki.jp/mini4vipwiki/pages/643.html');

-- Exact Suruga identity for White / Gray.
insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
values
(gen_random_uuid(),'a7ee5c90-da2a-5eb1-92a7-3895082186ff'::uuid,'trusted_secondary',
 'https://www.suruga-ya.jp/product/detail/603059997',
 array['itemNumber','editionName','color','manufacturer','distributionType','image'],date '2026-09-24',
 'Exact Suruga ITEM 92320 White identity. Selected management-number image asset independently returned HTTP 200 image/webp.'),
(gen_random_uuid(),'cb15faed-3873-58b9-a6c6-5553a556fd57'::uuid,'trusted_secondary',
 'https://www.suruga-ya.jp/product/detail/603059998',
 array['itemNumber','editionName','color','manufacturer','distributionType','image'],date '2026-09-24',
 'Exact Suruga ITEM 92321 Gray identity. Selected management-number image asset independently returned HTTP 200 image/webp.')
on conflict do nothing;

-- Blue/Red image provenance is retained transparently as HIGH-CONFIDENCE:
-- adjacent Suruga management assets form the same four-product family; exact
-- item/color identity is supplied by the independent family sources above.
insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
values
(gen_random_uuid(),'6794b234-e47e-5464-bf91-a90ab40b16df'::uuid,'other',
 'https://cdn.suruga-ya.jp/database/pics_webp/game/603059995.jpg.webp',
 array['image'],date '2026-09-24',
 'Image audit 2026-09-24 — HIGH-CONFIDENCE MATCHED. Suruga First Impact family asset 603059995; mapped to ITEM 92318 Blue within the contiguous 603059995–998 four-color family and cross-checked against independent item/color references.'),
(gen_random_uuid(),'5e92792c-9b20-59f3-916f-ce485c555778'::uuid,'other',
 'https://cdn.suruga-ya.jp/database/pics_webp/game/603059996.jpg.webp',
 array['image'],date '2026-09-24',
 'Image audit 2026-09-24 — HIGH-CONFIDENCE MATCHED. Suruga First Impact family asset 603059996; mapped to ITEM 92319 Red within the contiguous 603059995–998 four-color family and cross-checked against independent item/color references.')
on conflict do nothing;

-- Tokyo Anime Center collaboration provenance.
insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
values
(gen_random_uuid(),'057f6e89-225a-583a-8ec6-390a7e5a0887'::uuid,'official_archive',
 'https://tokyoanimecenter.jp/event/letsgo_30exh/',
 array['editionName','releaseDate','chassisBase','stickerDesign','retailPrice','image'],date '2026-09-24',
 'Official Tokyo Anime Center event page documents the Magnum Saber Tokyo Anime Center Model, its exclusive sticker design, Premium/Super II base, JPY 2,860 standalone price and directly embeds the selected tenmen.jpg product image.'),
(gen_random_uuid(),'057f6e89-225a-583a-8ec6-390a7e5a0887'::uuid,'official_archive',
 'https://tokyoanimecenter.jp/event/letsgo_30exh_popup/',
 array['editionName','retailPrice','marketAvailability'],date '2026-09-24',
 'Official Osaka POP UP page lists the collaboration Mini 4WD at JPY 2,860 with limited-quantity sales during the 2026-09-01 to 2026-10-06 event.'),
(gen_random_uuid(),'057f6e89-225a-583a-8ec6-390a7e5a0887'::uuid,'trusted_secondary',
 'https://www.atpress.ne.jp/news/7275106',
 array['editionName','chassisBase','stickerDesign','retailPrice'],date '2026-09-24',
 'Official event press release corroborates that the collaboration is based on Magnum Saber Premium with Tokyo Anime Center-specific stickers and JPY 2,860 standalone pricing.')
on conflict do nothing;

-- Images: existing original + Premium official images remain untouched.
delete from public.release_images
where release_id in (
 'c55391c4-d9f8-56fe-a6dc-7bd170172268'::uuid,
 '6794b234-e47e-5464-bf91-a90ab40b16df'::uuid,
 '5e92792c-9b20-59f3-916f-ce485c555778'::uuid,
 'a7ee5c90-da2a-5eb1-92a7-3895082186ff'::uuid,
 'cb15faed-3873-58b9-a6c6-5553a556fd57'::uuid,
 'a3a62418-84ad-5828-abab-289afdb43044'::uuid,
 '057f6e89-225a-583a-8ec6-390a7e5a0887'::uuid
);

insert into public.release_images(id,release_id,url,position) values
(gen_random_uuid(),'c55391c4-d9f8-56fe-a6dc-7bd170172268','https://www.tamiya.com/japan_contents/img/usr/item/9/94618/94618_1.jpg',0),
(gen_random_uuid(),'6794b234-e47e-5464-bf91-a90ab40b16df','https://cdn.suruga-ya.jp/database/pics_webp/game/603059995.jpg.webp',0),
(gen_random_uuid(),'5e92792c-9b20-59f3-916f-ce485c555778','https://cdn.suruga-ya.jp/database/pics_webp/game/603059996.jpg.webp',0),
(gen_random_uuid(),'a7ee5c90-da2a-5eb1-92a7-3895082186ff','https://cdn.suruga-ya.jp/database/pics_webp/game/603059997.jpg.webp',0),
(gen_random_uuid(),'cb15faed-3873-58b9-a6c6-5553a556fd57','https://cdn.suruga-ya.jp/database/pics_webp/game/603059998.jpg.webp',0),
(gen_random_uuid(),'a3a62418-84ad-5828-abab-289afdb43044','https://cdn.suruga-ya.jp/database/pics_webp/game/603060158.jpg.webp',0),
(gen_random_uuid(),'057f6e89-225a-583a-8ec6-390a7e5a0887','https://tokyoanimecenter.jp/uploads/letsgo_30exh/tenmen.jpg',0);

-- Explicit image-confidence audit trail.
update public.product_releases
set notes=concat_ws(' ',nullif(notes,''),
  case id
    when 'c55391c4-d9f8-56fe-a6dc-7bd170172268'::uuid then 'Image audit 2026-09-24: EXACT VERIFIED official Tamiya ITEM 94618 asset.'
    when '6794b234-e47e-5464-bf91-a90ab40b16df'::uuid then 'Image audit 2026-09-24: HIGH-CONFIDENCE MATCHED Suruga First Impact Blue asset.'
    when '5e92792c-9b20-59f3-916f-ce485c555778'::uuid then 'Image audit 2026-09-24: HIGH-CONFIDENCE MATCHED Suruga First Impact Red asset.'
    when 'a7ee5c90-da2a-5eb1-92a7-3895082186ff'::uuid then 'Image audit 2026-09-24: EXACT VERIFIED Suruga ITEM 92320 White asset.'
    when 'cb15faed-3873-58b9-a6c6-5553a556fd57'::uuid then 'Image audit 2026-09-24: EXACT VERIFIED Suruga ITEM 92321 Gray asset.'
    when 'a3a62418-84ad-5828-abab-289afdb43044'::uuid then 'Image audit 2026-09-24: EXACT VERIFIED Suruga 2015 reissue asset.'
    when '057f6e89-225a-583a-8ec6-390a7e5a0887'::uuid then 'Image audit 2026-09-24: EXACT VERIFIED Tokyo Anime Center official product image.'
    else null
  end),
  updated_at=now()
where id in (
 'c55391c4-d9f8-56fe-a6dc-7bd170172268'::uuid,
 '6794b234-e47e-5464-bf91-a90ab40b16df'::uuid,
 '5e92792c-9b20-59f3-916f-ce485c555778'::uuid,
 'a7ee5c90-da2a-5eb1-92a7-3895082186ff'::uuid,
 'cb15faed-3873-58b9-a6c6-5553a556fd57'::uuid,
 'a3a62418-84ad-5828-abab-289afdb43044'::uuid,
 '057f6e89-225a-583a-8ec6-390a7e5a0887'::uuid
);

-- Adaptive market enrollment for all canonical Magnum Saber Releases.
select public.trackdash_enroll_release_market_scans(id)
from public.product_releases
where product_id='fa551244-1a12-54ec-b937-ad1b5603e8bb'::uuid;

select public.trackdash_enqueue_market_recompute(id,'new_complete_unbuilt')
from public.product_releases
where product_id='fa551244-1a12-54ec-b937-ad1b5603e8bb'::uuid;

update public.market_scan_queue q
set next_scan_at=now(),
    priority=greatest(q.priority,120),
    locked_until=null,
    updated_at=now()
where q.release_id in (
 select id from public.product_releases
 where product_id='fa551244-1a12-54ec-b937-ad1b5603e8bb'::uuid
);

commit;
