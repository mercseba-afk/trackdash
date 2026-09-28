-- Dash-3 Shooting Star family controlled re-audit — 2026-09-28
--
-- Rebuilds the legacy three-row family under the current TrackDash rules:
-- - removes Memorial Box Vol.1 2005 as a standalone Release;
-- - separates the 1989 Ondawara original from the later ITEM 18019 reissue line;
-- - preserves the canonical ITEM 18630 MS Release and its existing market evidence;
-- - adds ITEM 94820 Blue Plated and four 2015 Shooting Star Dragontail prize colors;
-- - adds one exact vintage Mandarake SOLD observation to the 1989 original;
-- - applies exact-image discipline and shared-ITEM fail-closed eBay behavior.

begin;

update public.products
set canonical_item_number='18019',
    original_release_year=1989,
    series='Dash! Yonkuro',
    chassis='Type 3',
    rarity=null,
    description='Dash-3 Shooting Star is Minami Shinkuro''s Dash! Yonkuro machine. The collector family spans the 1989 Ondawara Type 3 original, the later ITEM 18019 reissue line, the MS redesign, the limited Blue Plated Type 3 kit and four fixed-color Shooting Star Dragontail amusement-prize Releases on Super 1 chassis.',
    description_it='Dash-3 Shooting Star è la macchina di Minami Shinkuro in Dash! Yonkuro. La famiglia collezionistica comprende l''originale Type 3 del 1989 con confezione Ondawara, la successiva linea di ristampa ITEM 18019, il redesign MS, la limited Type 3 Blue Plated e quattro Release premio Shooting Star Dragontail a colore fisso su telaio Super 1.',
    metadata=coalesce(metadata,'{}'::jsonb) || jsonb_build_object(
      'catalog_audit','2026-09-28',
      'canonical_release_count',8,
      'catalog_publication_gate',jsonb_build_object(
        'version','2026-09-28',
        'public_release_count',8,
        'research_only_release_count',0,
        'market_value_required',false
      ),
      'noncanonical_context',jsonb_build_array(
        'Racer Mini 4WD Memorial Box Vol.1 ITEM 94547 (2005-04-30) contains Dash-3 Shooting Star as one component of a five-car set; this is a set/production occurrence, not a standalone collector Release.',
        'Racer Mini 4WD Memorial Box Vol.1 Metallic Plated Body ITEM 94615 contains a plated Shooting Star as part of a five-car set; the box occurrence is context only and is not the autonomous ITEM 94820 Blue Plated kit.',
        'Racer Mini 4WD Memorial Box Nekketsu CoroCoro Special contains the classic Dash machines as a set occurrence and is not duplicated into a standalone Shooting Star Release.',
        'Dash-3 Shooting Star Silver Body is documented as a limited Grade-Up Parts/body-set item rather than a complete autonomous Mini 4WD kit, so it is excluded from the Release family.',
        'Dash-03 S.S.S. Super Shooting Star ITEM 18045 is a distinct successor machine/family and is not merged into Dash-3 Shooting Star.'
      ),
      'shared_identifier_rules',jsonb_build_array(
        jsonb_build_object(
          'identifier','18019',
          'type','item_number',
          'release_years',jsonb_build_array(1989,2007),
          'policy','fail_closed',
          'reason','1989 original and later reissue share the Item Number; unattended Item-only evidence must not choose a generation.'
        ),
        jsonb_build_object(
          'identifier','4950344180196',
          'type','JAN',
          'release_years',jsonb_build_array(1989,2007),
          'policy','ambiguous_shared_identifier',
          'reason','The same JAN is documented for the later reissue and is not a unique generation discriminator.'
        ),
        jsonb_build_object(
          'identifier','4519869512006',
          'type','shared_SK_Japan_code',
          'release_items',jsonb_build_array('92338','92339','92340','92341'),
          'policy','not_promoted_to_unique_release_barcode',
          'reason','Suruga/eBay expose the same code across multiple Dragontail colors; Item Number/color remains the Release discriminator.'
        )
      ),
      'image_audit',jsonb_build_object(
        'version','2026-09-28',
        'covered_release_count',2,
        'canonical_release_count',8,
        'intentional_placeholder_items',jsonb_build_array(
          '18019 Original 1989 Ondawara',
          '94820 Blue Plated Body Specification',
          '92338 Dragontail Red',
          '92339 Dragontail Blue',
          '92340 Dragontail White',
          '92341 Dragontail Black'
        ),
        'notes','Targeted second-pass research found exact pages and visible product imagery for all missing identities, but no additional stable direct asset was accepted during this pass. The current official ITEM 18019 hero is assigned only to the later reissue line, not the 1989 Ondawara original.'
      )
    ),
    updated_at=now()
where slug='dash-3-shooting-star-18703';

-- 1989 first edition. Collector-market evidence explicitly identifies the
-- Ondawara 18019 generation, so it is collector-distinct from the later reissue.
update public.product_releases
set edition_name='Dash-3 Shooting Star — 1989 Original (Ondawara Type 3)',
    release_type='Original',
    edition_type='original',
    chassis='Type 3',
    release_date=null,
    verification_status='verified',
    production_status='discontinued',
    discontinued=true,
    is_original=true,
    rarity='Rare',
    data_source='master_reaudit_20260928',
    status_checked_at=now(),
    catalog_visibility='public',
    catalog_visibility_reason='publication_gate:exact_vintage_identity_and_mandarake_sold_evidence',
    catalog_visibility_updated_at=now(),
    description='Original 1989 Ondawara-era Dash-3 Shooting Star, ITEM 18019, Type 3 chassis.',
    description_it='Dash-3 Shooting Star originale dell''era Ondawara del 1989, ITEM 18019, telaio Type 3.',
    notes=concat_ws(
      ' ',
      nullif(notes,''),
      'Controlled re-audit 2026-09-28: the original 1989 ITEM 18019 is collector-distinct from the later reissue through first-edition/Ondawara packaging evidence. Official Tamiya states initial release month September 1989. A Mandarake 2025 closed auction explicitly identifies “Ondawara 18019” and issue year 1989.'
    ),
    updated_at=now()
where product_id=(select id from public.products where slug='dash-3-shooting-star-18703')
  and item_number='18019' and release_year=1989;

-- The generic/current Tamiya hero does not discriminate the vintage 1989 box
-- generation from the later reissue, so remove it from the vintage Release.
delete from public.release_images
where release_id=(
  select r.id from public.product_releases r join public.products p on p.id=r.product_id
  where p.slug='dash-3-shooting-star-18703' and r.item_number='18019' and r.release_year=1989
);

insert into public.release_sources(release_id,source_type,source_url,verified_fields,checked_at,notes)
select r.id,'official_manufacturer','https://www.tamiya.com/japan/products/18019/index.html',
       array['itemNumber','releaseYear','chassis']::text[],date '2026-09-28',
       'Official Tamiya ITEM 18019 page states initial release month September 1989 and Type 3 chassis. Current catalog handling/image does not by itself prove vintage packaging, so the hero is not assigned to the 1989 collector identity.'
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='dash-3-shooting-star-18703' and r.item_number='18019' and r.release_year=1989
  and not exists(select 1 from public.release_sources s where s.release_id=r.id and s.source_url='https://www.tamiya.com/japan/products/18019/index.html');

insert into public.release_sources(release_id,source_type,source_url,verified_fields,checked_at,notes)
select r.id,'trusted_secondary','https://ekizo.mandarake.co.jp/auction/item/itemInfoEn.html?index=769503',
       array['itemNumber','releaseYear','packaging','marketPresence','soldEvidence']::text[],date '2026-09-28',
       'Mandarake closed live auction explicitly identifies Dash No.3 Shooting Star (Ondawara 18019), Tamiya, issue year 1989. Auction ended 2025-11-05 at JPY 26,000 after 37 bids.'
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='dash-3-shooting-star-18703' and r.item_number='18019' and r.release_year=1989
  and not exists(select 1 from public.release_sources s where s.release_id=r.id and s.source_url='https://ekizo.mandarake.co.jp/auction/item/itemInfoEn.html?index=769503');

-- Memorial Box Vol.1 is a parent-set occurrence, not an autonomous Shooting Star Release.
delete from public.product_releases
where product_id=(select id from public.products where slug='dash-3-shooting-star-18703')
  and item_number='18019'
  and release_year=2005
  and edition_name like '%Memorial Box Vol.1%';

-- Later ITEM 18019 reissue line. Suruga provides an exact 2007-12-01 release
-- record with the same JAN, while the current official Tamiya page supplies the
-- modern/reissue-line product hero.
insert into public.product_releases(
  product_id,item_number,release_type,edition_name,release_year,release_date,chassis,barcode_jan,color,
  country_market,msrp_jpy,msrp_eur,notes,discontinued,is_original,rarity,data_source,edition_type,
  verification_status,production_status,status_checked_at,description,description_it,
  catalog_visibility,catalog_visibility_reason,catalog_visibility_updated_at
)
select
  p.id,'18019','Reissue','Dash-3 Shooting Star — 2007 Reissue (Type 3)',2007,date '2007-12-01','Type 3',
  '4950344180196',null,'Global / Japan',600,null,
  'Controlled re-audit 2026-09-28. Suruga exact-product history records ITEM 18019 / JAN 4950344180196 as released 2007-12-01. It is separated from the 1989 Ondawara first edition using collector-visible packaging-generation evidence, not Item/JAN alone. Current official Tamiya imagery is assigned to this later/current reissue line.',
  false,false,null,'master_reaudit_20260928','reissue','verified','active',now(),
  'Later Type 3 Dash-3 Shooting Star reissue line, ITEM 18019, collector-distinct from the 1989 Ondawara original.',
  'Linea di ristampa successiva della Dash-3 Shooting Star Type 3, ITEM 18019, distinta collezionisticamente dall''originale Ondawara del 1989.',
  'public','publication_gate:exact_reissue_record_and_official_current_image',now()
from public.products p
where p.slug='dash-3-shooting-star-18703'
on conflict on constraint product_releases_identity_unique do update set
  release_type=excluded.release_type,edition_name=excluded.edition_name,release_date=excluded.release_date,
  chassis=excluded.chassis,barcode_jan=excluded.barcode_jan,color=excluded.color,
  country_market=excluded.country_market,msrp_jpy=excluded.msrp_jpy,notes=excluded.notes,
  discontinued=excluded.discontinued,is_original=excluded.is_original,rarity=excluded.rarity,
  data_source=excluded.data_source,edition_type=excluded.edition_type,
  verification_status=excluded.verification_status,production_status=excluded.production_status,
  status_checked_at=excluded.status_checked_at,description=excluded.description,description_it=excluded.description_it,
  catalog_visibility=excluded.catalog_visibility,catalog_visibility_reason=excluded.catalog_visibility_reason,
  catalog_visibility_updated_at=excluded.catalog_visibility_updated_at,updated_at=now();

insert into public.release_sources(release_id,source_type,source_url,verified_fields,checked_at,notes)
select r.id,'trusted_secondary','https://www.suruga-ya.jp/kaitori/kaitori_detail/603007835',
       array['itemNumber','barcodeJAN','releaseDate','releaseYear','editionName']::text[],date '2026-09-28',
       'Suruga exact-product record identifies ITEM 18019, JAN 4950344180196 and release date 2007-12-01.'
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='dash-3-shooting-star-18703' and r.item_number='18019' and r.release_year=2007
  and not exists(select 1 from public.release_sources s where s.release_id=r.id and s.source_url='https://www.suruga-ya.jp/kaitori/kaitori_detail/603007835');

insert into public.release_sources(release_id,source_type,source_url,verified_fields,checked_at,notes)
select r.id,'official_manufacturer','https://www.tamiya.com/japan/products/18019/index.html',
       array['itemNumber','chassis','image','msrp','currentHandling']::text[],date '2026-09-28',
       'Current official Tamiya ITEM 18019 catalog page confirms the Type 3 catalog product, current TAMIYA TOKYO handling and supplies the later/current product hero.'
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='dash-3-shooting-star-18703' and r.item_number='18019' and r.release_year=2007
  and not exists(select 1 from public.release_sources s where s.release_id=r.id and s.source_url='https://www.tamiya.com/japan/products/18019/index.html');

insert into public.release_sources(release_id,source_type,source_url,verified_fields,checked_at,notes)
select r.id,'trusted_secondary','https://www.1999.co.jp/10087279',
       array['itemNumber','barcodeJAN','chassis','marketPresence']::text[],date '2026-09-28',
       'Hobby Search exact ITEM 18019 page corroborates JAN 4950344180196 and Type 3 specification.'
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='dash-3-shooting-star-18703' and r.item_number='18019' and r.release_year=2007
  and not exists(select 1 from public.release_sources s where s.release_id=r.id and s.source_url='https://www.1999.co.jp/10087279');

insert into public.release_images(release_id,url,position)
select r.id,'https://www.tamiya.com/japan_contents/img/usr/item/1/18019/18019_1.jpg',0
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='dash-3-shooting-star-18703' and r.item_number='18019' and r.release_year=2007
  and not exists(select 1 from public.release_images ri where ri.release_id=r.id and ri.url='https://www.tamiya.com/japan_contents/img/usr/item/1/18019/18019_1.jpg');

insert into public.release_identifiers(release_id,scheme,value,market,is_primary,verification_status,source_url,checked_at)
select r.id,'JAN','4950344180196','JP',true,'verified',
       'https://www.suruga-ya.jp/kaitori/kaitori_detail/603007835',now()
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='dash-3-shooting-star-18703' and r.item_number='18019' and r.release_year=2007
  and not exists(select 1 from public.release_identifiers x where x.release_id=r.id and x.scheme='JAN' and x.value='4950344180196');

-- Preserve the correct existing MS Release UUID and market evidence.
update public.product_releases
set edition_name='Dash-3 Shooting Star — 2008 MS Chassis',
    release_type='MS Chassis Version',
    edition_type='other',
    chassis='MS',
    release_date=date '2008-12-20',
    verification_status='verified',
    production_status='active',
    discontinued=false,
    rarity=null,
    data_source='master_reaudit_20260928',
    status_checked_at=now(),
    catalog_visibility='public',
    catalog_visibility_reason='publication_gate:official_exact_image_and_active_market',
    catalog_visibility_updated_at=now(),
    notes=concat_ws(
      ' ',
      nullif(notes,''),
      'Controlled re-audit 2026-09-28: official Tamiya documents ITEM 18630 release date 2008-12-20. Japanese/Hobby Search records expose regional code 4950344064311 while Tamiya USA/current western records expose 4950344186303; TrackDash preserves the regional-code distinction rather than silently replacing one with the other.'
    ),
    updated_at=now()
where product_id=(select id from public.products where slug='dash-3-shooting-star-18703')
  and item_number='18630' and release_year=2008;

insert into public.release_sources(release_id,source_type,source_url,verified_fields,checked_at,notes)
select r.id,'official_manufacturer','https://www.tamiya.com/english/products/18630/index.html',
       array['itemNumber','chassis','editionName','image']::text[],date '2026-09-28',
       'Official Tamiya ITEM 18630 page confirms Dash-3 Shooting Star MS Chassis identity and specification.'
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='dash-3-shooting-star-18703' and r.item_number='18630'
  and not exists(select 1 from public.release_sources s where s.release_id=r.id and s.source_url='https://www.tamiya.com/english/products/18630/index.html');

insert into public.release_sources(release_id,source_type,source_url,verified_fields,checked_at,notes)
select r.id,'official_catalog_pdf','https://www.tamiyausa.com/media/files/map-feb-2026-1239-08db.pdf',
       array[]::text[],date '2026-09-28',
       'Official Tamiya USA 2026 MAP list exposes ITEM 18630 with regional identifier 4950344186303. Stored as provenance only; the existing Japanese/Hobby Search code 4950344064311 is not overwritten.'
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='dash-3-shooting-star-18703' and r.item_number='18630'
  and not exists(select 1 from public.release_sources s where s.release_id=r.id and s.source_url='https://www.tamiyausa.com/media/files/map-feb-2026-1239-08db.pdf');

-- ITEM 94820 autonomous limited Blue Plated full kit.
insert into public.product_releases(
  product_id,item_number,release_type,edition_name,release_year,release_date,chassis,barcode_jan,color,
  country_market,msrp_jpy,msrp_eur,notes,discontinued,is_original,rarity,data_source,edition_type,
  verification_status,production_status,status_checked_at,description,description_it,
  catalog_visibility,catalog_visibility_reason,catalog_visibility_updated_at
)
select
  p.id,'94820','Color Special','Dash-3 Shooting Star — Blue Plated Body Specification',2011,date '2011-04-28','Type 3',
  null,'Blue Plated','Japan',1000,null,
  'Controlled re-audit 2026-09-28. Autonomous limited full kit ITEM 94820, Blue Plated body, Type 3 chassis. Suruga records release date 2011-04-28 and MSRP JPY 1,100 tax-in. No unverified JAN is invented.',
  true,false,null,'master_reaudit_20260928','color_special','verified','discontinued',now(),
  'Limited Dash-3 Shooting Star Type 3 full kit with Blue Plated body, ITEM 94820.',
  'Kit completo limited Dash-3 Shooting Star Type 3 con carrozzeria Blue Plated, ITEM 94820.',
  'public','publication_gate:exact_retail_identity_and_market_record',now()
from public.products p
where p.slug='dash-3-shooting-star-18703'
on conflict on constraint product_releases_identity_unique do update set
  release_type=excluded.release_type,edition_name=excluded.edition_name,release_date=excluded.release_date,
  chassis=excluded.chassis,barcode_jan=excluded.barcode_jan,color=excluded.color,
  country_market=excluded.country_market,msrp_jpy=excluded.msrp_jpy,notes=excluded.notes,
  discontinued=excluded.discontinued,is_original=excluded.is_original,rarity=excluded.rarity,
  data_source=excluded.data_source,edition_type=excluded.edition_type,
  verification_status=excluded.verification_status,production_status=excluded.production_status,
  status_checked_at=excluded.status_checked_at,description=excluded.description,description_it=excluded.description_it,
  catalog_visibility=excluded.catalog_visibility,catalog_visibility_reason=excluded.catalog_visibility_reason,
  catalog_visibility_updated_at=excluded.catalog_visibility_updated_at,updated_at=now();

insert into public.release_sources(release_id,source_type,source_url,verified_fields,checked_at,notes)
select r.id,'trusted_secondary',
       'https://www.suruga-ya.jp/search?category=&search_word=%E3%83%9F%E3%83%8B%E5%9B%9B%E9%A7%86+%E3%83%80%E3%83%83%E3%82%B7%E3%83%A5',
       array['itemNumber','releaseDate','releaseYear','editionName','color','msrp','marketPresence']::text[],
       date '2026-09-28',
       'Suruga search record identifies autonomous ITEM 94820 Shooting Star Blue Plated Body Specification, release date 2011-04-28, MSRP JPY 1,100 tax-in and current collector-market presence.'
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='dash-3-shooting-star-18703' and r.item_number='94820'
  and not exists(select 1 from public.release_sources s where s.release_id=r.id and s.source_url like 'https://www.suruga-ya.jp/search?category=%');

insert into public.release_sources(release_id,source_type,source_url,verified_fields,checked_at,notes)
select r.id,'trusted_secondary','https://www.modelsale.com/mobile/poprec/cat_detail.php?idx1=1&idx2=9&idx3=1&order_v=&page=6',
       array['itemNumber','editionName','format']::text[],date '2026-09-28',
       'Specialized retailer catalog identifies Tamiya 94820 as a limited 1/32 Dash-3 Shooting Star Blue Coating Body full kit with motor.'
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='dash-3-shooting-star-18703' and r.item_number='94820'
  and not exists(select 1 from public.release_sources s where s.release_id=r.id and s.source_url='https://www.modelsale.com/mobile/poprec/cat_detail.php?idx1=1&idx2=9&idx3=1&order_v=&page=6');

-- 2015 Shooting Star Dragontail: four fixed-color amusement-prize identities.
insert into public.product_releases(
  product_id,item_number,release_type,edition_name,release_year,release_date,chassis,barcode_jan,color,
  country_market,msrp_jpy,msrp_eur,notes,discontinued,is_original,rarity,data_source,edition_type,
  verification_status,production_status,status_checked_at,description,description_it,
  catalog_visibility,catalog_visibility_reason,catalog_visibility_updated_at
)
select p.id,v.item_number,'Prize Limited',v.edition_name,2015,null,'Super 1',null,v.color,
       'Japan',null,null,
       concat(
         'Controlled re-audit 2026-09-28. Fixed-color Shooting Star Dragontail amusement-prize Release, ITEM ',
         v.item_number, ', Super 1 chassis. Contemporary documentation places the wave in late December 2015. ',
         'Suruga/eBay expose shared code 4519869512006 across multiple colors; TrackDash deliberately does not promote that shared code into barcode_jan because Item Number + color is the actual Release discriminator.'
       ),
       true,false,null,'master_reaudit_20260928','special','verified','discontinued',now(),
       concat('2015 Shooting Star Dragontail amusement-prize Release, ',v.color,' body, ITEM ',v.item_number,', Super 1 chassis.'),
       concat('Release premio amusement Shooting Star Dragontail 2015, carrozzeria ',v.color,', ITEM ',v.item_number,', telaio Super 1.'),
       'public','publication_gate:exact_prize_identity_and_collector_market_record',now()
from public.products p
cross join (
  values
    ('92338','Shooting Star Dragontail — Red','Red'),
    ('92339','Shooting Star Dragontail — Blue','Blue'),
    ('92340','Shooting Star Dragontail — White','White'),
    ('92341','Shooting Star Dragontail — Black','Black')
) as v(item_number,edition_name,color)
where p.slug='dash-3-shooting-star-18703'
on conflict on constraint product_releases_identity_unique do update set
  release_type=excluded.release_type,edition_name=excluded.edition_name,release_date=excluded.release_date,
  chassis=excluded.chassis,barcode_jan=excluded.barcode_jan,color=excluded.color,
  country_market=excluded.country_market,notes=excluded.notes,
  discontinued=excluded.discontinued,is_original=excluded.is_original,rarity=excluded.rarity,
  data_source=excluded.data_source,edition_type=excluded.edition_type,
  verification_status=excluded.verification_status,production_status=excluded.production_status,
  status_checked_at=excluded.status_checked_at,description=excluded.description,description_it=excluded.description_it,
  catalog_visibility=excluded.catalog_visibility,catalog_visibility_reason=excluded.catalog_visibility_reason,
  catalog_visibility_updated_at=excluded.catalog_visibility_updated_at,updated_at=now();

insert into public.release_sources(release_id,source_type,source_url,verified_fields,checked_at,notes)
select r.id,'trusted_secondary','https://w.atwiki.jp/mini4vipwiki/pages/662.html',
       array['itemNumber','releaseYear','editionName','chassis','color','format']::text[],
       date '2026-09-28',
       'Contemporary Mini 4WD reference documents the late-December 2015 Dragontail wave, ITEMs 92338-92341, four fixed body colors, Super 1 chassis and amusement-prize format.'
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='dash-3-shooting-star-18703' and r.item_number in ('92338','92339','92340','92341')
  and not exists(select 1 from public.release_sources s where s.release_id=r.id and s.source_url='https://w.atwiki.jp/mini4vipwiki/pages/662.html');

insert into public.release_sources(release_id,source_type,source_url,verified_fields,checked_at,notes)
select r.id,'trusted_secondary',
       case r.item_number
         when '92338' then 'https://www.suruga-ya.jp/product/detail/603065299'
         when '92339' then 'https://www.suruga-ya.jp/product/detail/603065300'
         when '92340' then 'https://www.suruga-ya.jp/product/detail/603065301'
         when '92341' then 'https://www.suruga-ya.jp/product/detail/603065302'
       end,
       array['itemNumber','editionName','color','format','marketPresence']::text[],
       date '2026-09-28',
       concat('Exact Suruga product record for Shooting Star Dragontail ',r.color,' ITEM ',r.item_number,
              '; Tamiya/SK Japan amusement-only kit. Suruga also exposes shared code 4519869512006, retained in audit notes rather than used as a unique Release barcode.')
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='dash-3-shooting-star-18703' and r.item_number in ('92338','92339','92340','92341')
  and not exists(
    select 1 from public.release_sources s
    where s.release_id=r.id and s.source_url=case r.item_number
      when '92338' then 'https://www.suruga-ya.jp/product/detail/603065299'
      when '92339' then 'https://www.suruga-ya.jp/product/detail/603065300'
      when '92340' then 'https://www.suruga-ya.jp/product/detail/603065301'
      when '92341' then 'https://www.suruga-ya.jp/product/detail/603065302'
    end
  );

insert into public.release_sources(release_id,source_type,source_url,verified_fields,checked_at,notes)
select r.id,'other',
       case r.item_number
         when '92338' then 'https://www.ebay.com/itm/165965403697'
         when '92339' then 'https://www.ebay.com/itm/166533938956'
       end,
       array['itemNumber','editionName','color','chassis','condition','marketPresence']::text[],
       date '2026-09-28',
       concat('Current exact eBay listing corroborates ITEM ',r.item_number,' Dragontail ',r.color,
              ' as a new/unassembled Super 1 kit. Used as exact identity/current-market corroboration; extra-EU local shipping is not assumed to be European delivered cost.')
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='dash-3-shooting-star-18703' and r.item_number in ('92338','92339')
  and not exists(
    select 1 from public.release_sources s
    where s.release_id=r.id and s.source_url=case r.item_number
      when '92338' then 'https://www.ebay.com/itm/165965403697'
      when '92339' then 'https://www.ebay.com/itm/166533938956'
    end
  );

-- Exact 1989 vintage SOLD evidence from Mandarake.
-- Banca d'Italia/ECB 2025-11-05 reference: EUR 1 = JPY 176.67,
-- therefore JPY->EUR = 1/176.67 = 0.005660270560932813.
insert into public.market_candidates(
  id,source_id,source_record_key,original_source,original_record_id,listing_url,title_raw,item_number_observed,
  possible_release_ids,resolved_release_id,price,currency,shipping_cost,shipping_basis,observation_type,
  condition_raw,condition,inner_bags_sealed,box_condition,is_complete,is_lot,quantity,match_confidence,
  match_evidence,evidence_group_key,sold_on,observed_at,decision,reason_codes,review_notes,needs_revalidation,
  raw_payload,first_observed_at,last_observed_at
)
select
  gen_random_uuid(),'c483891c-1272-5b98-9c04-6f5694f38f0a'::uuid,
  'mandarake:769503','MANDARAKE_AUCTION','769503',
  'https://ekizo.mandarake.co.jp/auction/item/itemInfoEn.html?index=769503',
  'Dash No.3 Shooting Star (Ondawara 18019)',
  '18019',array[r.id],r.id,
  26000,'JPY',null,'unknown','auction_awarded',
  'Mandarake: Box 9 (side creased), main item 10','new_complete_unbuilt',
  'unknown','unknown',true,false,1,'exact',
  array['item_number_exact','release_year_stated','packaging_generation_match','manual_override'],
  'mandarake:shooting-star-original:769503',
  date '2025-11-05',now(),'accepted',array[]::text[],
  'Exact Mandarake closed auction explicitly identifies Ondawara 18019 and issue year 1989. Assembly/completeness classification is inferred from the boxed model-kit auction record and retained as indicative-quality SOLD evidence; shipping is unknown.',
  false,
  jsonb_build_object(
    'adapter','manual-sold-audit-v1',
    'market_region','japan',
    'auction_bids',37,
    'sale_date','2025-11-05',
    'auction_item_number','8151z130',
    'fx_source','Banca d''Italia / ECB reference rate',
    'eur_jpy',176.67,
    'condition_inferred',true
  ),
  now(),now()
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='dash-3-shooting-star-18703' and r.item_number='18019' and r.release_year=1989
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
  gen_random_uuid(),c.id,c.resolved_release_id,c.source_id,'auction_awarded','new_complete_unbuilt',
  c.price,c.currency,null,'unknown',null,null,
  0.005660270560932813::numeric,date '2025-11-05',
  'unknown','unknown',true,false,1,'exact',
  c.match_evidence,c.evidence_group_key,true,
  'active',false,null,c.sold_on,c.observed_at,'indicative',
  array['seller_unknown','shipping_unknown','completeness_unconfirmed','condition_inferred','inner_bags_unknown','box_condition_unknown'],
  147.17,'raw_sale'
from public.market_candidates c
where c.source_id='c483891c-1272-5b98-9c04-6f5694f38f0a'::uuid
  and c.source_record_key='mandarake:769503'
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
  r.id,'new_complete_unbuilt'
)
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='dash-3-shooting-star-18703'
  and r.item_number='18019' and r.release_year=1989;

-- Enroll every canonical Release in the market scheduling system.
select public.trackdash_enroll_release_market_scans(r.id)
from public.product_releases r
join public.products p on p.id=r.product_id
where p.slug='dash-3-shooting-star-18703';

-- Shared ITEM 18019 must remain fail-closed for unattended eBay generation attribution.
update public.market_scan_queue q
set enabled=false,
    priority=95,
    next_scan_at=timestamptz '2099-01-01 00:00:00+00',
    consecutive_failures=0,
    last_error=null,
    locked_until=null,
    updated_at=now()
where q.source_id=(select id from public.price_sources where slug='ebay_active_public')
  and q.scan_scope='active_marketplace'
  and q.release_id in (
    select r.id from public.product_releases r join public.products p on p.id=r.product_id
    where p.slug='dash-3-shooting-star-18703' and r.item_number='18019'
  );

update public.market_scan_targets q
set enabled=false,
    priority=95,
    next_scan_at=timestamptz '2099-01-01 00:00:00+00',
    consecutive_failures=0,
    last_error=null,
    locked_until=null,
    updated_at=now()
where q.source_id=(select id from public.price_sources where slug='ebay_active_public')
  and q.release_id in (
    select r.id from public.product_releases r join public.products p on p.id=r.product_id
    where p.slug='dash-3-shooting-star-18703' and r.item_number='18019'
  );

-- Stage six unique valuation-compatible Releases at the head of the eBay queue.
update public.market_scan_queue q
set enabled=true,
    priority=150,
    next_scan_at=timestamptz '2000-01-01 00:00:00+00',
    consecutive_failures=0,
    last_error=null,
    locked_until=null,
    updated_at=now()
where q.source_id=(select id from public.price_sources where slug='ebay_active_public')
  and q.scan_scope='active_marketplace'
  and q.release_id in (
    select r.id from public.product_releases r join public.products p on p.id=r.product_id
    where p.slug='dash-3-shooting-star-18703'
      and r.item_number in ('18630','94820','92338','92339','92340','92341')
  );

update public.market_scan_targets q
set enabled=true,
    priority=150,
    next_scan_at=timestamptz '2000-01-01 00:00:00+00',
    consecutive_failures=0,
    last_error=null,
    locked_until=null,
    updated_at=now()
where q.source_id=(select id from public.price_sources where slug='ebay_active_public')
  and q.release_id in (
    select r.id from public.product_releases r join public.products p on p.id=r.product_id
    where p.slug='dash-3-shooting-star-18703'
      and r.item_number in ('18630','94820','92338','92339','92340','92341')
  );

commit;
