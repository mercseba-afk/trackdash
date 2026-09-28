-- Dash-1 Emperor family controlled re-audit — 2026-09-28
--
-- Rebuilds the collector genealogy under the current TrackDash rules:
-- - removes the 2005 Memorial Box Vol.1 component as a standalone Release;
-- - keeps ITEM 95296 as one Release with a documented 2023 production wave;
-- - separates the post-vintage ITEM 18012 reissue line from the 1988 Oshika original;
-- - adds the four SK Japan / amusement-prize Imperial Force colors;
-- - removes sibling/current-production hero images from vintage/finished identities;
-- - preserves shared-ITEM fail-closed eBay behavior.

begin;

-- Product-level canonical identity and durable audit context.
update public.products
set canonical_item_number = '18012',
    original_release_year = 1988,
    series = 'Racing Mini 4WD',
    chassis = 'Type 1',
    description = 'Dash-1 Emperor is the original Dash! Yonkuro hero machine. The collector family spans the 1988 Oshika Type 1 original, the 1990 Type 3 version, the later Type 1 reissue line, MS/finished/special variants, the four 2014 Imperial Force prize colors, Premium and anniversary editions, and the 2026 Type 3 reissue.',
    description_it = 'Dash-1 Emperor è la macchina simbolo originale di Dash! Yonkuro. La famiglia collezionistica comprende l''originale Oshika Type 1 del 1988, la versione Type 3 del 1990, la successiva linea di ristampa Type 1, le varianti MS/finished/special, i quattro premi Imperial Force del 2014, le edizioni Premium e anniversario e la ristampa Type 3 del 2026.',
    metadata = coalesce(metadata,'{}'::jsonb) || jsonb_build_object(
      'catalog_audit','2026-09-28',
      'canonical_release_count',17,
      'catalog_publication_gate',jsonb_build_object(
        'version','2026-09-28',
        'public_release_count',17,
        'research_only_release_count',0,
        'market_value_required',false
      ),
      'noncanonical_context',jsonb_build_array(
        'Racer Mini 4WD Memorial Box Vol.1 (ITEM 94547, 2005-04-30) contains an ITEM 18012 Dash-1 Emperor component. It is retained as a set/production occurrence and is not a standalone collector Release.',
        'Memorial Box Nekketsu CoroCoro Special (2007) also contains the classic Dash machines. Set occurrence is context only; it is not duplicated as an autonomous Release identity.'
      ),
      'production_waves',jsonb_build_array(
        jsonb_build_object(
          'item_number','95296',
          'canonical_release_year',2017,
          'later_wave_date','2023-05-27',
          'reason','Same ITEM, JAN, chassis, body specification and official product identity; 2023 is a reissue/production wave of the 2017 Black Special.'
        )
      ),
      'image_audit',jsonb_build_object(
        'version','2026-09-28',
        'covered_release_count',10,
        'canonical_release_count',17,
        'intentional_placeholder_items',jsonb_build_array(
          '18012 Original 1988',
          '18025 Original 1990',
          '94670 Finished Model',
          '92267 Imperial Force Pearl',
          '92268 Imperial Force Clear Red',
          '92269 Imperial Force Orange',
          '92270 Imperial Force Smoke'
        )
      )
    ),
    updated_at = now()
where slug = 'dash-1-emperor-18025';

-- 1988 vintage original: preserve exact Oshika SOLD evidence, but remove the
-- current generic Tamiya hero because it does not discriminate vintage from reissue.
update public.product_releases
set release_type = 'Original',
    edition_name = 'Dash-1 Emperor — 1988 Original (Oshika Type 1)',
    chassis = 'Type 1',
    edition_type = 'original',
    verification_status = 'verified',
    production_status = 'discontinued',
    discontinued = true,
    is_original = true,
    rarity = 'Rare',
    data_source = 'master_reaudit_20260928',
    status_checked_at = now(),
    description = 'Original 1988 Oshika-era Dash-1 Emperor on Type 1 chassis, ITEM 18012.',
    description_it = 'Dash-1 Emperor originale dell''era Oshika del 1988 su telaio Type 1, ITEM 18012.',
    catalog_visibility = 'public',
    catalog_visibility_reason = 'publication_gate:exact_oshika_sold_evidence',
    catalog_visibility_updated_at = now(),
    notes = concat_ws(
      ' ',
      nullif(notes,''),
      'Controlled re-audit 2026-09-28: the 1988 original is collector-distinct from later ITEM 18012 reissues through period packaging/instruction discriminators, including the Oshika address and first-lot/middle-band evidence. Existing exact SOLD evidence explicitly identifies Oshika / period-original examples and remains attached to this Release.'
    ),
    updated_at = now()
where product_id = (select id from public.products where slug='dash-1-emperor-18025')
  and item_number='18012'
  and release_year=1988;

delete from public.release_images
where release_id = (
  select r.id from public.product_releases r
  join public.products p on p.id=r.product_id
  where p.slug='dash-1-emperor-18025' and r.item_number='18012' and r.release_year=1988
);

insert into public.release_sources(release_id,source_type,source_url,verified_fields,checked_at,notes)
select r.id,'trusted_secondary',
       'https://www.chibakan-yachiyo.net/mini4/%E3%80%90%E3%83%9F%E3%83%8B%E5%9B%9B%E9%A7%86%E8%B2%B7%E5%8F%96%E3%80%91%E3%83%80%E3%83%83%E3%82%B7%E3%83%A51%E5%8F%B7%E7%9A%87%E5%B8%9D%EF%BC%88%E3%82%A8%E3%83%B3%E3%83%9A%E3%83%A9%E3%83%BC%EF%BC%89/',
       array['itemNumber','editionName','releaseYear','packaging']::text[],
       date '2026-09-28',
       'Collector shop article documents an ITEM 18012 first edition and identifies Oshika-address instructions and period packaging as a discriminator from later reissues.'
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='dash-1-emperor-18025' and r.item_number='18012' and r.release_year=1988
  and not exists (
    select 1 from public.release_sources s
    where s.release_id=r.id and s.source_url='https://www.chibakan-yachiyo.net/mini4/%E3%80%90%E3%83%9F%E3%83%8B%E5%9B%9B%E9%A7%86%E8%B2%B7%E5%8F%96%E3%80%91%E3%83%80%E3%83%83%E3%82%B7%E3%83%A51%E5%8F%B7%E7%9A%87%E5%B8%9D%EF%BC%88%E3%82%A8%E3%83%B3%E3%83%9A%E3%83%A9%E3%83%BC%EF%BC%89/'
  );

-- 1990 Type 3 original: current Tamiya page proves the January 1990 first
-- release month, while current exact vintage-market evidence keeps publication valid.
update public.product_releases
set release_type = 'Original',
    edition_name = 'Dash-1 Emperor — 1990 Original (Type 3)',
    chassis = 'Type 3',
    edition_type = 'original',
    verification_status = 'verified',
    production_status = 'discontinued',
    discontinued = true,
    is_original = false,
    rarity = 'Uncommon',
    data_source = 'master_reaudit_20260928',
    status_checked_at = now(),
    description = 'Original 1990 ITEM 18025 Dash-1 Emperor on Type 3 chassis.',
    description_it = 'Dash-1 Emperor ITEM 18025 originale del 1990 su telaio Type 3.',
    catalog_visibility = 'public',
    catalog_visibility_reason = 'publication_gate:official_history_and_exact_vintage_market_evidence',
    catalog_visibility_updated_at = now(),
    notes = concat_ws(
      ' ',
      nullif(notes,''),
      'Controlled re-audit 2026-09-28: official Tamiya records January 1990 as the initial ITEM 18025 release month. The current 2026 Tamiya hero belongs to the modern reissue line and is deliberately not reused for this vintage identity. Exact current vintage listings and a Mandarake 1990 unassembled example corroborate the collector distinction.'
    ),
    updated_at = now()
where product_id = (select id from public.products where slug='dash-1-emperor-18025')
  and item_number='18025'
  and release_year=1990;

delete from public.release_images
where release_id = (
  select r.id from public.product_releases r
  join public.products p on p.id=r.product_id
  where p.slug='dash-1-emperor-18025' and r.item_number='18025' and r.release_year=1990
);

insert into public.release_sources(release_id,source_type,source_url,verified_fields,checked_at,notes)
select r.id,'official_manufacturer','https://www.tamiya.com/japan/products/18025/index.html',
       array['itemNumber','releaseYear','chassis']::text[],date '2026-09-28',
       'Official Tamiya ITEM 18025 page states initial release month January 1990 and Type 3 chassis; current 2026 release art is not reused as a vintage hero.'
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='dash-1-emperor-18025' and r.item_number='18025' and r.release_year=1990
  and not exists (
    select 1 from public.release_sources s
    where s.release_id=r.id and s.source_url='https://www.tamiya.com/japan/products/18025/index.html'
  );

insert into public.release_sources(release_id,source_type,source_url,verified_fields,checked_at,notes)
select r.id,'trusted_secondary','https://k.mandarake.co.jp/auction/item/itemInfoEn.html?index=769510',
       array['itemNumber','editionName','releaseYear','condition']::text[],date '2026-09-28',
       'Mandarake closed-auction record explicitly identifies a 1990 ITEM 18025 Type 3 unassembled vintage example.'
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='dash-1-emperor-18025' and r.item_number='18025' and r.release_year=1990
  and not exists (
    select 1 from public.release_sources s
    where s.release_id=r.id and s.source_url='https://k.mandarake.co.jp/auction/item/itemInfoEn.html?index=769510'
  );

-- Memorial Box Vol.1 (2005) is a five-car set occurrence, not an autonomous
-- commercial Dash-1 Emperor Release. Restrictive/user references were verified
-- empty before this migration; dependent source/image/queue/signal rows cascade.
delete from public.product_releases
where product_id=(select id from public.products where slug='dash-1-emperor-18025')
  and item_number='18012'
  and release_year=2005
  and edition_name like '%Memorial Box Vol.1%';

-- Canonical later ITEM 18012 reissue line. A 2019 collector-shop comparison
-- explicitly identifies the familiar reissue as a 2007 release and documents
-- physical/address distinctions from the original. The current Tamiya page
-- proves this later specification remains an autonomous catalog product.
insert into public.product_releases(
  product_id,item_number,release_type,edition_name,release_year,release_date,chassis,barcode_jan,color,
  country_market,msrp_jpy,msrp_eur,notes,discontinued,is_original,rarity,data_source,edition_type,
  verification_status,production_status,status_checked_at,description,description_it,
  catalog_visibility,catalog_visibility_reason,catalog_visibility_updated_at
)
select
  p.id,'18012','Reissue','Dash-1 Emperor — 2007 Reissue (Type 1)',2007,null,'Type 1','4950344180127',null,
  'Global / Japan',600,null,
  'Controlled re-audit 2026-09-28. Collector documentation explicitly describes the familiar later ITEM 18012 as a 2007 reissue and distinguishes it from the vintage original by period packaging/address details. Exact day is not promoted. Current official Tamiya ITEM 18012 catalog imagery/specification is assigned to this later reissue line, never to the 1988 Oshika original.',
  false,false,'Uncommon','master_reaudit_20260928','reissue',
  'verified','active',now(),
  'Later Type 1 Dash-1 Emperor reissue line, ITEM 18012, collector-distinct from the 1988 Oshika original.',
  'Linea di ristampa successiva della Dash-1 Emperor Type 1, ITEM 18012, distinta collezionisticamente dall''originale Oshika del 1988.',
  'public','publication_gate:exact_official_current_image_and_reissue_identity',now()
from public.products p
where p.slug='dash-1-emperor-18025'
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

insert into public.release_sources(release_id,source_type,source_url,verified_fields,checked_at,notes)
select r.id,'trusted_secondary',
       'https://www.chibakan-yachiyo.net/mini4/%E3%80%90%E3%83%9F%E3%83%8B%E5%9B%9B%E9%A7%86%E8%B2%B7%E5%8F%96%E3%80%91%E3%83%80%E3%83%83%E3%82%B7%E3%83%A51%E5%8F%B7%E7%9A%87%E5%B8%9D%EF%BC%88%E3%82%A8%E3%83%B3%E3%83%9A%E3%83%A9%E3%83%BC%EF%BC%89/',
       array['itemNumber','editionName','releaseYear','packaging']::text[],date '2026-09-28',
       'Collector-shop comparison explicitly describes the later Dash-1 Emperor as a 2007 reissue and contrasts it with the first-edition Oshika-address example.'
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='dash-1-emperor-18025' and r.item_number='18012' and r.release_year=2007
  and not exists (
    select 1 from public.release_sources s
    where s.release_id=r.id and s.source_url='https://www.chibakan-yachiyo.net/mini4/%E3%80%90%E3%83%9F%E3%83%8B%E5%9B%9B%E9%A7%86%E8%B2%B7%E5%8F%96%E3%80%91%E3%83%80%E3%83%83%E3%82%B7%E3%83%A51%E5%8F%B7%E7%9A%87%E5%B8%9D%EF%BC%88%E3%82%A8%E3%83%B3%E3%83%9A%E3%83%A9%E3%83%BC%EF%BC%89/'
  );

insert into public.release_sources(release_id,source_type,source_url,verified_fields,checked_at,notes)
select r.id,'official_manufacturer','https://www.tamiya.com/japan/products/18012/index.html',
       array['itemNumber','editionName','chassis','image','msrp']::text[],date '2026-09-28',
       'Current official Tamiya ITEM 18012 product page confirms the autonomous Type 1 catalog product and supplies the modern/reissue-line hero image.'
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='dash-1-emperor-18025' and r.item_number='18012' and r.release_year=2007
  and not exists (
    select 1 from public.release_sources s
    where s.release_id=r.id and s.source_url='https://www.tamiya.com/japan/products/18012/index.html'
  );

insert into public.release_images(release_id,url,position)
select r.id,'https://www.tamiya.com/japan_contents/img/usr/item/1/18012/18012_1.jpg',0
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='dash-1-emperor-18025' and r.item_number='18012' and r.release_year=2007
  and not exists (
    select 1 from public.release_images ri
    where ri.release_id=r.id and ri.url='https://www.tamiya.com/japan_contents/img/usr/item/1/18012/18012_1.jpg'
  );

insert into public.release_identifiers(
  release_id,scheme,value,market,is_primary,verification_status,source_url,checked_at
)
select r.id,'JAN','4950344180127','JP',true,'verified',
       'https://www.1999.co.jp/10087245',now()
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='dash-1-emperor-18025' and r.item_number='18012' and r.release_year=2007
  and not exists (
    select 1 from public.release_identifiers x
    where x.release_id=r.id and x.scheme='JAN' and x.value='4950344180127'
  );

-- Finished model 94670: exact identity is valid, but the stored 18625 kit hero
-- is a sibling image and must not survive the current exact-image policy.
update public.product_releases
set release_type='Finished Model',
    edition_type='special',
    production_status='discontinued',
    discontinued=true,
    verification_status='verified',
    rarity='Uncommon',
    data_source='master_reaudit_20260928',
    status_checked_at=now(),
    catalog_visibility='public',
    catalog_visibility_reason='publication_gate:exact_official_identity_and_historical_release_evidence',
    catalog_visibility_updated_at=now(),
    notes=concat_ws(
      ' ',
      nullif(notes,''),
      'Controlled re-audit 2026-09-28: Tamiya USA confirms ITEM 94670 as the discontinued finished Dash-1 Emperor; contemporary TEA-League records the 2008-09-27 planned release. The previously stored ITEM 18625 kit image was a sibling fallback and has been removed.'
    ),
    updated_at=now()
where product_id=(select id from public.products where slug='dash-1-emperor-18025')
  and item_number='94670'
  and release_year=2008;

delete from public.release_images
where release_id=(
  select r.id from public.product_releases r join public.products p on p.id=r.product_id
  where p.slug='dash-1-emperor-18025' and r.item_number='94670' and r.release_year=2008
);

insert into public.release_sources(release_id,source_type,source_url,verified_fields,checked_at,notes)
select r.id,'official_manufacturer','https://www.tamiyausa.com/shop/132-pro/jr-dash-1-emperor/',
       array['itemNumber','editionName','productionStatus']::text[],date '2026-09-28',
       'Official Tamiya USA page identifies ITEM 94670 as the finished Dash-1 Emperor and marks it discontinued.'
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='dash-1-emperor-18025' and r.item_number='94670' and r.release_year=2008
  and not exists (
    select 1 from public.release_sources s
    where s.release_id=r.id and s.source_url='https://www.tamiyausa.com/shop/132-pro/jr-dash-1-emperor/'
  );

insert into public.release_sources(release_id,source_type,source_url,verified_fields,checked_at,notes)
select r.id,'trusted_secondary','https://www.tea-league.com/mt/tea/archives/2008/09/1ms.html',
       array['itemNumber','editionName','releaseDate']::text[],date '2026-09-28',
       'Contemporary 2008 coverage records ITEM 94670 and the September 27, 2008 finished-model release schedule.'
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='dash-1-emperor-18025' and r.item_number='94670' and r.release_year=2008
  and not exists (
    select 1 from public.release_sources s
    where s.release_id=r.id and s.source_url='https://www.tea-league.com/mt/tea/archives/2008/09/1ms.html'
  );

-- ITEM 95296: one canonical Release, with 2023 treated as a later production
-- wave because official Tamiya documents the initial 2017 release and current
-- 2023 reissue under the same ITEM/specification.
update public.product_releases
set edition_name='Dash-1 Emperor (MS Chassis) Black Special — 2017 Release / 2023 Production Wave',
    production_status='discontinued',
    discontinued=true,
    verification_status='verified',
    rarity='Uncommon',
    data_source='master_reaudit_20260928',
    status_checked_at=now(),
    catalog_visibility='public',
    catalog_visibility_reason='publication_gate:exact_official_image_and_production_wave_identity',
    catalog_visibility_updated_at=now(),
    notes=concat_ws(
      ' ',
      nullif(notes,''),
      'Controlled re-audit 2026-09-28: official Tamiya records ITEM 95296 as first released in February 2017 and reissued on 2023-05-27. Same ITEM, JAN 4950344952960, MS chassis and specification: one collector Release with a later 2023 production wave, not two Releases.'
    ),
    updated_at=now()
where product_id=(select id from public.products where slug='dash-1-emperor-18025')
  and item_number='95296'
  and release_year=2017;

insert into public.release_sources(release_id,source_type,source_url,verified_fields,checked_at,notes)
select r.id,'official_manufacturer','https://www.tamiya.com/japan/products/95296/index.html',
       array['itemNumber','editionName','releaseYear','releaseDate','chassis','image']::text[],date '2026-09-28',
       'Official Tamiya page documents the 2023-05-27 reissue and the initial February 2017 release under the same ITEM 95296 identity.'
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='dash-1-emperor-18025' and r.item_number='95296' and r.release_year=2017
  and not exists (
    select 1 from public.release_sources s
    where s.release_id=r.id and s.source_url='https://www.tamiya.com/japan/products/95296/index.html'
  );

delete from public.product_releases
where product_id=(select id from public.products where slug='dash-1-emperor-18025')
  and item_number='95296'
  and release_year=2023;

-- Four fixed-color 2014 Imperial Force amusement-prize Releases. These are
-- autonomous collector identities with distinct ITEM numbers, not configurable
-- prize variations. Exact day is intentionally unresolved; contemporary evidence
-- places the wave in June 2014.
insert into public.product_releases(
  product_id,item_number,release_type,edition_name,release_year,release_date,chassis,barcode_jan,color,
  country_market,msrp_jpy,msrp_eur,notes,discontinued,is_original,rarity,data_source,edition_type,
  verification_status,production_status,status_checked_at,description,description_it,
  catalog_visibility,catalog_visibility_reason,catalog_visibility_updated_at
)
select p.id,v.item_number,'Prize Limited',v.edition_name,2014,null,'VS',null,v.color,
       'Japan',null,null,v.notes,true,false,'Rare','master_reaudit_20260928','special',
       'verified','discontinued',now(),v.description,v.description_it,
       'public','publication_gate:credible_exact_release_market_evidence',now()
from public.products p
cross join (
  values
  ('92267','Dash-1 Emperor Imperial Force — Pearl','Pearl',
   'Controlled re-audit 2026-09-28. SK Japan/Tamiya amusement-prize Imperial Force fixed Pearl color, ITEM 92267, VS chassis. Family/set and exact current collector-market evidence confirm autonomous identity. June 2014 wave; exact day intentionally unresolved.',
   '2014 amusement-prize Dash-1 Emperor Imperial Force Pearl, ITEM 92267, VS chassis.',
   'Dash-1 Emperor Imperial Force Pearl premio amusement del 2014, ITEM 92267, telaio VS.'),
  ('92268','Dash-1 Emperor Imperial Force — Clear Red','Clear Red',
   'Controlled re-audit 2026-09-28. SK Japan/Tamiya amusement-prize Imperial Force fixed Clear Red color, ITEM 92268, VS chassis. Exact Suruga evidence confirms autonomous identity. June 2014 wave; exact day intentionally unresolved.',
   '2014 amusement-prize Dash-1 Emperor Imperial Force Clear Red, ITEM 92268, VS chassis.',
   'Dash-1 Emperor Imperial Force Clear Red premio amusement del 2014, ITEM 92268, telaio VS.'),
  ('92269','Dash-1 Emperor Imperial Force — Orange','Orange',
   'Controlled re-audit 2026-09-28. SK Japan/Tamiya amusement-prize Imperial Force fixed Orange color, ITEM 92269, VS chassis. Exact Suruga evidence confirms autonomous identity. June 2014 wave; exact day intentionally unresolved.',
   '2014 amusement-prize Dash-1 Emperor Imperial Force Orange, ITEM 92269, VS chassis.',
   'Dash-1 Emperor Imperial Force Orange premio amusement del 2014, ITEM 92269, telaio VS.'),
  ('92270','Dash-1 Emperor Imperial Force — Smoke','Smoke',
   'Controlled re-audit 2026-09-28. SK Japan/Tamiya amusement-prize Imperial Force fixed Smoke color, ITEM 92270, VS chassis. Family/set and current collector-market evidence confirm autonomous identity. June 2014 wave; exact day intentionally unresolved.',
   '2014 amusement-prize Dash-1 Emperor Imperial Force Smoke, ITEM 92270, VS chassis.',
   'Dash-1 Emperor Imperial Force Smoke premio amusement del 2014, ITEM 92270, telaio VS.')
) as v(item_number,edition_name,color,notes,description,description_it)
where p.slug='dash-1-emperor-18025'
on conflict on constraint product_releases_identity_unique do update set
  release_type=excluded.release_type,
  edition_name=excluded.edition_name,
  release_date=excluded.release_date,
  chassis=excluded.chassis,
  barcode_jan=excluded.barcode_jan,
  country_market=excluded.country_market,
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

-- Shared family-level Imperial Force provenance.
insert into public.release_sources(release_id,source_type,source_url,verified_fields,checked_at,notes)
select r.id,'trusted_secondary','https://www.suruga-ya.jp/product/detail/603046990',
       array['itemNumber','editionName','chassis','color']::text[],date '2026-09-28',
       'Suruga catalogs the complete four-color Tamiya/SK Japan Emperor Imperial Force amusement-prize set and identifies VS chassis.'
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='dash-1-emperor-18025' and r.item_number in ('92267','92268','92269','92270')
  and not exists (
    select 1 from public.release_sources s
    where s.release_id=r.id and s.source_url='https://www.suruga-ya.jp/product/detail/603046990'
  );

insert into public.release_sources(release_id,source_type,source_url,verified_fields,checked_at,notes)
select r.id,'trusted_secondary','https://satumaya.blog.fc2.com/?page=1',
       array['editionName','releaseYear','chassis','color']::text[],date '2026-09-28',
       'Contemporary June 2014 amusement/prize coverage documents Emperor Imperial Force as four colors on VS chassis; exact day is not promoted.'
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='dash-1-emperor-18025' and r.item_number in ('92267','92268','92269','92270')
  and not exists (
    select 1 from public.release_sources s
    where s.release_id=r.id and s.source_url='https://satumaya.blog.fc2.com/?page=1'
  );

insert into public.release_sources(release_id,source_type,source_url,verified_fields,checked_at,notes)
select r.id,'other','https://jp.mercari.com/item/m51116714287',
       array['itemNumber','editionName','marketPresence']::text[],date '2026-09-28',
       'Exact ITEM 92267 Pearl collector-market listing/sale. Used for identity/publication evidence only; no canonical new-complete European numeric signal is manufactured.'
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='dash-1-emperor-18025' and r.item_number='92267' and r.release_year=2014
  and not exists (
    select 1 from public.release_sources s where s.release_id=r.id and s.source_url='https://jp.mercari.com/item/m51116714287'
  );

insert into public.release_sources(release_id,source_type,source_url,verified_fields,checked_at,notes)
select r.id,'trusted_secondary','https://www.suruga-ya.jp/product/detail/603046988',
       array['itemNumber','editionName','chassis','color','marketPresence']::text[],date '2026-09-28',
       'Exact Suruga ITEM 92268 Clear Red record/current market page, VS chassis.'
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='dash-1-emperor-18025' and r.item_number='92268' and r.release_year=2014
  and not exists (
    select 1 from public.release_sources s where s.release_id=r.id and s.source_url='https://www.suruga-ya.jp/product/detail/603046988'
  );

insert into public.release_sources(release_id,source_type,source_url,verified_fields,checked_at,notes)
select r.id,'trusted_secondary','https://www.suruga-ya.jp/kaitori/kaitori_detail/603046986',
       array['itemNumber','editionName','chassis','color','marketPresence']::text[],date '2026-09-28',
       'Exact Suruga ITEM 92269 Orange record, VS chassis. The observed SK Japan set/prize code is not promoted as an individual Tamiya JAN.'
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='dash-1-emperor-18025' and r.item_number='92269' and r.release_year=2014
  and not exists (
    select 1 from public.release_sources s where s.release_id=r.id and s.source_url='https://www.suruga-ya.jp/kaitori/kaitori_detail/603046986'
  );

insert into public.release_sources(release_id,source_type,source_url,verified_fields,checked_at,notes)
select r.id,'other','https://www.suruga-ya.jp/search?search_word=92270',
       array['itemNumber','editionName','marketPresence']::text[],date '2026-09-28',
       'Current Suruga search evidence resolves ITEM 92270 Smoke. Used as exact-release market-presence corroboration only.'
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='dash-1-emperor-18025' and r.item_number='92270' and r.release_year=2014
  and not exists (
    select 1 from public.release_sources s where s.release_id=r.id and s.source_url='https://www.suruga-ya.jp/search?search_word=92270'
  );

-- Normalize the current 2026 Type 3 row as a reissue and keep its current
-- official hero/JAN separated from the 1990 vintage original.
update public.product_releases
set release_type='Reissue',
    edition_name='Dash-1 Emperor — 2026 Reissue (Type 3)',
    edition_type='reissue',
    verification_status='verified',
    production_status='active',
    discontinued=false,
    rarity='Common',
    data_source='master_reaudit_20260928',
    status_checked_at=now(),
    catalog_visibility='public',
    catalog_visibility_reason='publication_gate:exact_official_current_release_image',
    catalog_visibility_updated_at=now(),
    notes=concat_ws(
      ' ',
      nullif(notes,''),
      'Controlled re-audit 2026-09-28: official Tamiya releases ITEM 18025 again around 2026-08-29 with JAN 4950344089789. This current production is kept separate from the 1990 original; its official current image belongs here.'
    ),
    updated_at=now()
where product_id=(select id from public.products where slug='dash-1-emperor-18025')
  and item_number='18025'
  and release_year=2026;

-- Ensure all canonical Releases are enrolled across the market pipeline.
select public.trackdash_enroll_release_market_scans(r.id)
from public.product_releases r
join public.products p on p.id=r.product_id
where p.slug='dash-1-emperor-18025';

-- Shared ITEM 18012 and 18025 generations must fail closed for unattended eBay.
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
    where p.slug='dash-1-emperor-18025' and r.item_number in ('18012','18025')
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
  and q.scan_scope='active_marketplace'
  and q.release_id in (
    select r.id from public.product_releases r join public.products p on p.id=r.product_id
    where p.slug='dash-1-emperor-18025' and r.item_number in ('18012','18025')
  );

-- Re-stage only genuinely due/new/error unique-item targets for the post-audit
-- pass. Four Imperial Force additions plus overdue/missing/error lanes total ten
-- eBay jobs; existing fresh jobs keep their normal cadence.
update public.market_scan_queue q
set enabled=true,
    priority=130,
    next_scan_at=timestamptz '2000-01-01 00:00:00+00',
    consecutive_failures=0,
    last_error=null,
    locked_until=null,
    updated_at=now()
where q.source_id=(select id from public.price_sources where slug='ebay_active_public')
  and q.scan_scope='active_marketplace'
  and q.release_id in (
    select r.id from public.product_releases r join public.products p on p.id=r.product_id
    where p.slug='dash-1-emperor-18025'
      and r.item_number in ('18625','94670','18069','92267','92268','92269','92270','95296','95110','95622')
  );

update public.market_scan_targets q
set enabled=true,
    priority=130,
    next_scan_at=timestamptz '2000-01-01 00:00:00+00',
    consecutive_failures=0,
    last_error=null,
    locked_until=null,
    updated_at=now()
where q.source_id=(select id from public.price_sources where slug='ebay_active_public')
  and q.scan_scope='active_marketplace'
  and q.release_id in (
    select r.id from public.product_releases r join public.products p on p.id=r.product_id
    where p.slug='dash-1-emperor-18025'
      and r.item_number in ('18625','94670','18069','92267','92268','92269','92270','95296','95110','95622')
  );

commit;
