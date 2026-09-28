-- Dash-2 Burning Sun family controlled re-audit — 2026-09-28
--
-- Rebuilds the legacy five-row family under the current TrackDash rules:
-- - removes Memorial Box Vol.1 2005 as a standalone Release;
-- - keeps the core Type 1 / Type 3 / MS / Finished identities;
-- - adds ITEM 94819 Green Plated, the four 2016 Helios prize colors,
--   and ITEM 92373 Kirin Mets Cola promotional prize;
-- - preserves exact-image discipline (no sibling/fragile asset substitution);
-- - enrolls the canonical family and stages only valuation-compatible unique
--   eBay jobs for the controlled initial scan.

begin;

update public.products
set canonical_item_number='18015',
    original_release_year=1989,
    series='Dash! Yonkuro',
    chassis='Type 1',
    rarity=null,
    description='Dash-2 Burning Sun is Tankuro Toda''s Dash! Yonkuro machine. The collector family spans the original Type 1 kit, the Type 3 chassis version, the MS redesign and finished model, the Green Plated limited kit, four fixed-color Burning Sun Helios amusement-prize Releases, and the 2017 Kirin Mets Cola promotional MS kit.',
    description_it='Dash-2 Burning Sun è la macchina di Tankuro Toda in Dash! Yonkuro. La famiglia collezionistica comprende il kit originale Type 1, la versione Type 3, il redesign MS e il modello finito, la limited Green Plated, le quattro Release premio Burning Sun Helios a colore fisso e la promo MS Kirin Mets Cola del 2017.',
    metadata=coalesce(metadata,'{}'::jsonb) || jsonb_build_object(
      'catalog_audit','2026-09-28',
      'canonical_release_count',10,
      'catalog_publication_gate',jsonb_build_object(
        'version','2026-09-28',
        'public_release_count',10,
        'research_only_release_count',0,
        'market_value_required',false
      ),
      'noncanonical_context',jsonb_build_array(
        'Racer Mini 4WD Memorial Box Vol.1 ITEM 94547 (2005) contains Dash-2 Burning Sun as one component of a five-car set; this is a set/production occurrence, not a standalone collector Release.',
        'Racer Mini 4WD Memorial Box Vol.1 Metallic Plated Body ITEM 94615 contains a green-plated Burning Sun among five plated Dash machines; the box occurrence itself is context only. ITEM 94819 is the later autonomous Green Plated commercial kit.',
        'Lotte Mini 4WD chocolate/ice prize configurations allowed selectable plated body/chassis/wheel/tire combinations; the evidence does not define one fixed autonomous Burning Sun commercial identity, so this remains promotion context only.'
      ),
      'image_audit',jsonb_build_object(
        'version','2026-09-28',
        'covered_release_count',4,
        'canonical_release_count',10,
        'intentional_placeholder_items',jsonb_build_array(
          '94819 Green Plated Body Specification',
          '92343 Burning Sun Helios Red',
          '92344 Burning Sun Helios Silver',
          '92345 Burning Sun Helios White',
          '92346 Burning Sun Helios Black',
          '92373 Kirin Mets Cola Original'
        ),
        'notes','Exact product pages with visible imagery were found for the six missing heroes, but no stable direct asset URL was accepted during this pass. Placeholder is preferred to a fragile page asset or sibling image.'
      )
    ),
    updated_at=now()
where slug='dash-2-burning-sun-18702';

-- Core Type 1 identity. The current official page still handles ITEM 18015
-- with the same Type 1 specification; no physical discriminator justifies a
-- separate modern reissue Release.
update public.product_releases
set edition_name='Dash-2 Burning Sun — 1989 Original / Type 1',
    release_type='Original',
    edition_type='original',
    chassis='Type 1',
    verification_status='verified',
    production_status='active',
    discontinued=false,
    is_original=true,
    rarity=null,
    data_source='master_reaudit_20260928',
    status_checked_at=now(),
    catalog_visibility='public',
    catalog_visibility_reason='publication_gate:official_exact_identity_image_and_current_handling',
    catalog_visibility_updated_at=now(),
    notes=concat_ws(
      ' ',
      nullif(notes,''),
      'Controlled re-audit 2026-09-28: current official Tamiya ITEM 18015 retains the Type 1 specification and is handled by TAMIYA TOKYO. No reliable physical discriminator was found that would justify splitting later stock into a second Release.'
    ),
    updated_at=now()
where product_id=(select id from public.products where slug='dash-2-burning-sun-18702')
  and item_number='18015' and release_year=1989;

-- Type 3 is a distinct chassis/specification identity, not merely a generic
-- reprint of the Type 1 kit.
update public.product_releases
set edition_name='Dash-2 Burning Sun — 1990 Type 3 Chassis',
    release_type='Chassis Variant',
    edition_type='other',
    chassis='Type 3',
    verification_status='verified',
    production_status='active',
    discontinued=false,
    is_original=false,
    rarity=null,
    data_source='master_reaudit_20260928',
    status_checked_at=now(),
    catalog_visibility='public',
    catalog_visibility_reason='publication_gate:official_exact_identity_image_and_current_handling',
    catalog_visibility_updated_at=now(),
    notes=concat_ws(
      ' ',
      nullif(notes,''),
      'Controlled re-audit 2026-09-28: official Tamiya identifies ITEM 18026 as the Type 3 chassis specification, first released in February 1990, and currently handled by TAMIYA TOKYO.'
    ),
    updated_at=now()
where product_id=(select id from public.products where slug='dash-2-burning-sun-18702')
  and item_number='18026' and release_year=1990;

-- The 2005 Memorial Box is a parent-set occurrence, not an autonomous Release.
delete from public.product_releases
where product_id=(select id from public.products where slug='dash-2-burning-sun-18702')
  and item_number='18015'
  and release_year=2005
  and edition_name like '%Memorial Box Vol.1%';

-- Normalize MS assembly kit and finished model.
update public.product_releases
set edition_name='Dash-2 Burning Sun — 2008 MS Chassis',
    release_type='MS Chassis Version',
    edition_type='other',
    chassis='MS',
    verification_status='verified',
    production_status='active',
    discontinued=false,
    rarity=null,
    data_source='master_reaudit_20260928',
    status_checked_at=now(),
    catalog_visibility='public',
    catalog_visibility_reason='publication_gate:official_exact_image_and_active_market',
    catalog_visibility_updated_at=now(),
    updated_at=now()
where product_id=(select id from public.products where slug='dash-2-burning-sun-18702')
  and item_number='18628' and release_year=2008;

update public.product_releases
set edition_name='Dash-2 Burning Sun — 2009 MS Finished Model',
    release_type='Finished Model',
    edition_type='special',
    chassis='MS',
    verification_status='verified',
    production_status='discontinued',
    discontinued=true,
    rarity=null,
    data_source='master_reaudit_20260928',
    status_checked_at=now(),
    catalog_visibility='public',
    catalog_visibility_reason='publication_gate:exact_identity_and_official_legacy_image',
    catalog_visibility_updated_at=now(),
    notes=concat_ws(
      ' ',
      nullif(notes,''),
      'Controlled re-audit 2026-09-28: factory-finished ITEM 94675 remains a separate collector identity. It is excluded from the automatic new_complete_unbuilt eBay valuation lane because its product format is finished rather than an unbuilt kit.'
    ),
    updated_at=now()
where product_id=(select id from public.products where slug='dash-2-burning-sun-18702')
  and item_number='94675' and release_year=2009;

-- ITEM 94819 autonomous Green Plated limited kit.
insert into public.product_releases(
  product_id,item_number,release_type,edition_name,release_year,release_date,chassis,barcode_jan,color,
  country_market,msrp_jpy,msrp_eur,notes,discontinued,is_original,rarity,data_source,edition_type,
  verification_status,production_status,status_checked_at,description,description_it,
  catalog_visibility,catalog_visibility_reason,catalog_visibility_updated_at
)
select
  p.id,'94819','Color Special','Dash-2 Burning Sun — Green Plated Body Specification',2011,null,'Type 1',
  '4950344948192','Green Plated','Japan',1000,null,
  'Controlled re-audit 2026-09-28. Autonomous Tamiya limited full kit, distinct from the earlier five-car plated Memorial Box occurrence. Exact retailer records agree on ITEM 94819 and JAN 4950344948192; retailer release timing differs at day/month precision, so only release year 2011 is promoted.',
  true,false,null,'master_reaudit_20260928','color_special','verified','discontinued',now(),
  'Limited Dash-2 Burning Sun Type 1 kit with green-plated body, ITEM 94819.',
  'Kit limited Dash-2 Burning Sun Type 1 con carrozzeria Green Plated, ITEM 94819.',
  'public','publication_gate:exact_retail_identity_and_market_record',now()
from public.products p
where p.slug='dash-2-burning-sun-18702'
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
select r.id,'trusted_secondary','https://www.1999.co.jp/10146145',
       array['itemNumber','barcodeJAN','editionName','releaseYear','color','marketPresence']::text[],
       date '2026-09-28',
       'Hobby Search exact-product record identifies ITEM 94819, JAN 4950344948192 and the Green Plated full kit; it is sold out.'
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='dash-2-burning-sun-18702' and r.item_number='94819' and r.release_year=2011
  and not exists(select 1 from public.release_sources s where s.release_id=r.id and s.source_url='https://www.1999.co.jp/10146145');

insert into public.release_sources(release_id,source_type,source_url,verified_fields,checked_at,notes)
select r.id,'trusted_secondary','https://www.amiami.jp/top/detail/detail?gcode=TOY-SCL2-02637',
       array['itemNumber','barcodeJAN','editionName','releaseYear','color','marketPresence']::text[],
       date '2026-09-28',
       'AmiAmi exact-product record independently confirms JAN 4950344948192 and the autonomous Green Plated Burning Sun kit.'
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='dash-2-burning-sun-18702' and r.item_number='94819' and r.release_year=2011
  and not exists(select 1 from public.release_sources s where s.release_id=r.id and s.source_url='https://www.amiami.jp/top/detail/detail?gcode=TOY-SCL2-02637');

insert into public.release_identifiers(
  release_id,scheme,value,market,is_primary,verification_status,source_url,checked_at
)
select r.id,'JAN','4950344948192','JP',true,'verified','https://www.1999.co.jp/10146145',now()
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='dash-2-burning-sun-18702' and r.item_number='94819' and r.release_year=2011
  and not exists(select 1 from public.release_identifiers x where x.release_id=r.id and x.scheme='JAN' and x.value='4950344948192');

-- 2016 Burning Sun Helios: four fixed-color amusement-prize collector identities.
insert into public.product_releases(
  product_id,item_number,release_type,edition_name,release_year,release_date,chassis,barcode_jan,color,
  country_market,msrp_jpy,msrp_eur,notes,discontinued,is_original,rarity,data_source,edition_type,
  verification_status,production_status,status_checked_at,description,description_it,
  catalog_visibility,catalog_visibility_reason,catalog_visibility_updated_at
)
select p.id,v.item_number,'Prize Limited',v.edition_name,2016,null,'Super 1',v.jan,v.color,
       'Japan',null,null,v.notes,true,false,null,'master_reaudit_20260928','special',
       'verified','discontinued',now(),v.description,v.description_it,
       'public','publication_gate:exact_prize_identity_and_collector_market_record',now()
from public.products p
cross join (
  values
  ('92343','Burning Sun Helios — Red',null::text,'Red',
   'Controlled re-audit 2026-09-28. Fixed Red amusement-prize identity, ITEM 92343, Super 1 chassis. Family evidence places the four-color Helios wave in late March 2016; exact day is intentionally unresolved. Current collector-market search contains an exact 92343 listing.',
   '2016 Burning Sun Helios amusement-prize Release, Red body, ITEM 92343, Super 1 chassis.',
   'Release premio amusement Burning Sun Helios 2016, carrozzeria Red, ITEM 92343, telaio Super 1.'),
  ('92344','Burning Sun Helios — Silver',null::text,'Silver',
   'Controlled re-audit 2026-09-28. Fixed Silver amusement-prize identity, ITEM 92344, Super 1 chassis. Family evidence places the four-color Helios wave in late March 2016; exact day is intentionally unresolved. Exact Suruga/Furuichi product records corroborate the identity.',
   '2016 Burning Sun Helios amusement-prize Release, Silver body, ITEM 92344, Super 1 chassis.',
   'Release premio amusement Burning Sun Helios 2016, carrozzeria Silver, ITEM 92344, telaio Super 1.'),
  ('92345','Burning Sun Helios — White','4519869603001','White',
   'Controlled re-audit 2026-09-28. Fixed White amusement-prize identity, ITEM 92345, Super 1 chassis. Suruga records JAN 4519869603001 for this exact item. Family evidence places the wave in late March 2016; exact day is intentionally unresolved.',
   '2016 Burning Sun Helios amusement-prize Release, White body, ITEM 92345, Super 1 chassis.',
   'Release premio amusement Burning Sun Helios 2016, carrozzeria White, ITEM 92345, telaio Super 1.'),
  ('92346','Burning Sun Helios — Black',null::text,'Black',
   'Controlled re-audit 2026-09-28. Fixed Black amusement-prize identity, ITEM 92346, Super 1 chassis. Family evidence places the four-color Helios wave in late March 2016; exact day is intentionally unresolved. Exact Suruga product record corroborates the identity.',
   '2016 Burning Sun Helios amusement-prize Release, Black body, ITEM 92346, Super 1 chassis.',
   'Release premio amusement Burning Sun Helios 2016, carrozzeria Black, ITEM 92346, telaio Super 1.')
) as v(item_number,edition_name,jan,color,notes,description,description_it)
where p.slug='dash-2-burning-sun-18702'
on conflict on constraint product_releases_identity_unique do update set
  release_type=excluded.release_type,edition_name=excluded.edition_name,release_date=excluded.release_date,
  chassis=excluded.chassis,barcode_jan=excluded.barcode_jan,color=excluded.color,
  country_market=excluded.country_market,notes=excluded.notes,discontinued=excluded.discontinued,
  is_original=excluded.is_original,rarity=excluded.rarity,data_source=excluded.data_source,
  edition_type=excluded.edition_type,verification_status=excluded.verification_status,
  production_status=excluded.production_status,status_checked_at=excluded.status_checked_at,
  description=excluded.description,description_it=excluded.description_it,
  catalog_visibility=excluded.catalog_visibility,catalog_visibility_reason=excluded.catalog_visibility_reason,
  catalog_visibility_updated_at=excluded.catalog_visibility_updated_at,updated_at=now();

insert into public.release_sources(release_id,source_type,source_url,verified_fields,checked_at,notes)
select r.id,'trusted_secondary','https://w.atwiki.jp/mini4vipwiki/pages/681.html',
       array['itemNumber','editionName','releaseYear','chassis','color']::text[],date '2026-09-28',
       'Contemporary collector reference documents the four Helios fixed-color ITEMs 92343-92346, Super 1 chassis, and late-March 2016 amusement-prize wave.'
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='dash-2-burning-sun-18702' and r.item_number in ('92343','92344','92345','92346')
  and not exists(select 1 from public.release_sources s where s.release_id=r.id and s.source_url='https://w.atwiki.jp/mini4vipwiki/pages/681.html');

insert into public.release_sources(release_id,source_type,source_url,verified_fields,checked_at,notes)
select r.id,'other','https://jp.mercari.com/search?keyword=%E3%83%9F%E3%83%8B%E5%9B%9B%E9%A7%86+%E3%83%90%E3%83%BC%E3%83%8B%E3%83%B3%E3%82%B0%E3%82%B5%E3%83%B3',
       array['itemNumber','editionName','marketPresence']::text[],date '2026-09-28',
       'Current Mercari search contains an exact ITEM 92343 Burning Sun Helios Red collector-market listing. Used for publication/market-presence corroboration only.'
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='dash-2-burning-sun-18702' and r.item_number='92343'
  and not exists(select 1 from public.release_sources s where s.release_id=r.id and s.source_url='https://jp.mercari.com/search?keyword=%E3%83%9F%E3%83%8B%E5%9B%9B%E9%A7%86+%E3%83%90%E3%83%BC%E3%83%8B%E3%83%B3%E3%82%B0%E3%82%B5%E3%83%B3');

insert into public.release_sources(release_id,source_type,source_url,verified_fields,checked_at,notes)
select r.id,'trusted_secondary','https://www.suruga-ya.com/en/product/603071903',
       array['itemNumber','editionName','chassis','color','marketPresence']::text[],date '2026-09-28',
       'Exact Suruga record for ITEM 92344 Burning Sun Helios Silver, amusement-prize product.'
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='dash-2-burning-sun-18702' and r.item_number='92344'
  and not exists(select 1 from public.release_sources s where s.release_id=r.id and s.source_url='https://www.suruga-ya.com/en/product/603071903');

insert into public.release_sources(release_id,source_type,source_url,verified_fields,checked_at,notes)
select r.id,'trusted_secondary','https://www.suruga-ya.jp/kaitori/kaitori_detail/603071904',
       array['itemNumber','barcodeJAN','editionName','chassis','color','marketPresence']::text[],date '2026-09-28',
       'Exact Suruga record for ITEM 92345 Burning Sun Helios White; records JAN 4519869603001 and amusement-prize format.'
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='dash-2-burning-sun-18702' and r.item_number='92345'
  and not exists(select 1 from public.release_sources s where s.release_id=r.id and s.source_url='https://www.suruga-ya.jp/kaitori/kaitori_detail/603071904');

insert into public.release_sources(release_id,source_type,source_url,verified_fields,checked_at,notes)
select r.id,'trusted_secondary','https://www.suruga-ya.com/en/product/603071871',
       array['itemNumber','editionName','chassis','color','marketPresence']::text[],date '2026-09-28',
       'Exact Suruga record for ITEM 92346 Burning Sun Helios Black, amusement-prize product.'
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='dash-2-burning-sun-18702' and r.item_number='92346'
  and not exists(select 1 from public.release_sources s where s.release_id=r.id and s.source_url='https://www.suruga-ya.com/en/product/603071871');

insert into public.release_identifiers(
  release_id,scheme,value,market,is_primary,verification_status,source_url,checked_at
)
select r.id,'JAN','4519869603001','JP',true,'verified',
       'https://www.suruga-ya.jp/kaitori/kaitori_detail/603071904',now()
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='dash-2-burning-sun-18702' and r.item_number='92345'
  and not exists(select 1 from public.release_identifiers x where x.release_id=r.id and x.scheme='JAN' and x.value='4519869603001');

-- 2017 Kirin Mets Cola campaign prize, autonomous boxed kit ITEM 92373
-- distributed together with Emperor ITEM 92372 in the C-course two-kit prize.
insert into public.product_releases(
  product_id,item_number,release_type,edition_name,release_year,release_date,chassis,barcode_jan,color,
  country_market,msrp_jpy,msrp_eur,notes,discontinued,is_original,rarity,data_source,edition_type,
  verification_status,production_status,status_checked_at,description,description_it,
  catalog_visibility,catalog_visibility_reason,catalog_visibility_updated_at
)
select
  p.id,'92373','Prize Promotional','Dash-2 Burning Sun — Kirin Mets Cola Original',2017,null,'MS',null,'Red',
  'Japan',null,null,
  'Controlled re-audit 2026-09-28. 2017 Kirin Mets Cola “Red and Black Revival Items” C-course promotional prize. Burning Sun ITEM 92373 has a red MS-compatible body, white wheels and dedicated Mets stickers and was distributed together with Emperor ITEM 92372. No individual JAN or standalone numeric set-price allocation is invented.',
  true,false,null,'master_reaudit_20260928','special','verified','discontinued',now(),
  '2017 Kirin Mets Cola promotional Dash-2 Burning Sun, red MS specification, ITEM 92373.',
  'Dash-2 Burning Sun promozionale Kirin Mets Cola 2017, specifica MS rossa, ITEM 92373.',
  'public','publication_gate:exact_campaign_identity_and_current_collector_market_trace',now()
from public.products p
where p.slug='dash-2-burning-sun-18702'
on conflict on constraint product_releases_identity_unique do update set
  release_type=excluded.release_type,edition_name=excluded.edition_name,release_date=excluded.release_date,
  chassis=excluded.chassis,barcode_jan=excluded.barcode_jan,color=excluded.color,
  country_market=excluded.country_market,notes=excluded.notes,discontinued=excluded.discontinued,
  is_original=excluded.is_original,rarity=excluded.rarity,data_source=excluded.data_source,
  edition_type=excluded.edition_type,verification_status=excluded.verification_status,
  production_status=excluded.production_status,status_checked_at=excluded.status_checked_at,
  description=excluded.description,description_it=excluded.description_it,
  catalog_visibility=excluded.catalog_visibility,catalog_visibility_reason=excluded.catalog_visibility_reason,
  catalog_visibility_updated_at=excluded.catalog_visibility_updated_at,updated_at=now();

insert into public.release_sources(release_id,source_type,source_url,verified_fields,checked_at,notes)
select r.id,'trusted_secondary','https://www.suruga-ya.jp/product/detail/603084036',
       array['itemNumber','editionName','releaseYear','chassis','marketPresence']::text[],date '2026-09-28',
       'Suruga exact campaign set record identifies the 2017 C-course prize and item pair 92372/92373; Burning Sun is ITEM 92373.'
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='dash-2-burning-sun-18702' and r.item_number='92373'
  and not exists(select 1 from public.release_sources s where s.release_id=r.id and s.source_url='https://www.suruga-ya.jp/product/detail/603084036');

insert into public.release_sources(release_id,source_type,source_url,verified_fields,checked_at,notes)
select r.id,'trusted_secondary',
       'https://wapachahouse.com/2017/07/08/%E3%83%A1%E3%83%83%E3%83%84%E3%82%B3%E3%83%BC%E3%83%A9%E3%82%AA%E3%83%AA%E3%82%B8%E3%83%8A%E3%83%AB%E3%83%9F%E3%83%8B%E5%9B%9B%E9%A7%86-%E3%83%80%E3%83%83%E3%82%B7%E3%83%A52%E5%8F%B7-%E3%83%90/',
       array['itemNumber','editionName','releaseYear','chassis','color','packaging']::text[],date '2026-09-28',
       'Contemporary owner documentation shows the individual Burning Sun promotional box and identifies ITEM 92373, red body, white wheels, dedicated stickers and MS chassis.'
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='dash-2-burning-sun-18702' and r.item_number='92373'
  and not exists(select 1 from public.release_sources s where s.release_id=r.id and s.source_url like 'https://wapachahouse.com/2017/07/08/%');

-- Add explicit non-canonical set context to the surviving base Release sources.
insert into public.release_sources(release_id,source_type,source_url,verified_fields,checked_at,notes)
select r.id,'trusted_secondary','https://www.suruga-ya.jp/product/detail/603007008',
       array['setOccurrence']::text[],date '2026-09-28',
       'Racer Mini 4WD Memorial Box Vol.1 ITEM 94547 contains Burning Sun as one of five kits; retained as set occurrence only, not a separate Release.'
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='dash-2-burning-sun-18702' and r.item_number='18015' and r.release_year=1989
  and not exists(select 1 from public.release_sources s where s.release_id=r.id and s.source_url='https://www.suruga-ya.jp/product/detail/603007008');

insert into public.release_sources(release_id,source_type,source_url,verified_fields,checked_at,notes)
select r.id,'trusted_secondary','https://www.hlj.com/racer-mini-4wd-memorial-box-1-metallic-plated-bod-tam94615',
       array['setOccurrence','color']::text[],date '2026-09-28',
       'HLJ documents discontinued Memorial Box ITEM 94615 with green-plated Burning Sun among five plated Dash cars. The set occurrence is context only; autonomous ITEM 94819 is cataloged separately.'
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='dash-2-burning-sun-18702' and r.item_number='94819'
  and not exists(select 1 from public.release_sources s where s.release_id=r.id and s.source_url='https://www.hlj.com/racer-mini-4wd-memorial-box-1-metallic-plated-bod-tam94615');

-- Ensure all canonical Releases participate in the market scheduling system.
select public.trackdash_enroll_release_market_scans(r.id)
from public.product_releases r
join public.products p on p.id=r.product_id
where p.slug='dash-2-burning-sun-18702';

-- Finished model is a separate product format and must not flow through the
-- new_complete_unbuilt eBay valuation lane.
update public.market_scan_queue q
set enabled=false,
    priority=90,
    next_scan_at=timestamptz '2099-01-01 00:00:00+00',
    consecutive_failures=0,
    last_error=null,
    locked_until=null,
    updated_at=now()
where q.source_id=(select id from public.price_sources where slug='ebay_active_public')
  and q.scan_scope='active_marketplace'
  and q.release_id=(
    select r.id from public.product_releases r join public.products p on p.id=r.product_id
    where p.slug='dash-2-burning-sun-18702' and r.item_number='94675' and r.release_year=2009
  );

update public.market_scan_targets q
set enabled=false,
    priority=90,
    next_scan_at=timestamptz '2099-01-01 00:00:00+00',
    consecutive_failures=0,
    last_error=null,
    locked_until=null,
    updated_at=now()
where q.source_id=(select id from public.price_sources where slug='ebay_active_public')
  and q.release_id=(
    select r.id from public.product_releases r join public.products p on p.id=r.product_id
    where p.slug='dash-2-burning-sun-18702' and r.item_number='94675' and r.release_year=2009
  );

-- Stage the nine valuation-compatible unique ITEMs at the head of the eBay queue.
update public.market_scan_queue q
set enabled=true,
    priority=140,
    next_scan_at=timestamptz '2000-01-01 00:00:00+00',
    consecutive_failures=0,
    last_error=null,
    locked_until=null,
    updated_at=now()
where q.source_id=(select id from public.price_sources where slug='ebay_active_public')
  and q.scan_scope='active_marketplace'
  and q.release_id in (
    select r.id from public.product_releases r join public.products p on p.id=r.product_id
    where p.slug='dash-2-burning-sun-18702'
      and r.item_number in ('18015','18026','18628','94819','92343','92344','92345','92346','92373')
  );

update public.market_scan_targets q
set enabled=true,
    priority=140,
    next_scan_at=timestamptz '2000-01-01 00:00:00+00',
    consecutive_failures=0,
    last_error=null,
    locked_until=null,
    updated_at=now()
where q.source_id=(select id from public.price_sources where slug='ebay_active_public')
  and q.release_id in (
    select r.id from public.product_releases r join public.products p on p.id=r.product_id
    where p.slug='dash-2-burning-sun-18702'
      and r.item_number in ('18015','18026','18628','94819','92343','92344','92345','92346','92373')
  );

commit;
