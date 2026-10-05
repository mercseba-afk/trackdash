-- Sonic Saber family master re-audit — 2026-10-05
--
-- Current-method genealogy:
--   19402 Original 1994 / Super 1 / JAN 4950344194025
--   19402 Reissue 2003 / Super 1 / JAN 4950344061327
--     (later 2015/current production waves remain one collector Release)
--   19432 Premium 2011 / Super II / historical JAN 4950344194322
--     (later/current JANs are aliases, not separate Releases)
--
-- 94618 Magnum Saber Special Kit contains an extra Sonic Saber reinforced body,
-- but remains one commercial Release in the Magnum Saber family; it is not
-- duplicated here.
-- 2026 licensed gold mini-figures are not Mini 4WD assembly kits and remain
-- outside the TrackDash Mini 4WD Release catalog.

begin;

-- Family metadata stays coming_soon until images + initial market scan + QA pass.
update public.products
set series='Fully Cowled Mini 4WD',
    original_release_year=1994,
    description='Sonic Saber collector family: original Super 1 kit, later 19402 reissue generation, and Sonic Saber Premium on Super II.',
    description_it='Famiglia da collezione Sonic Saber: kit originale su Super 1, successiva generazione ristampa 19402 e Sonic Saber Premium su Super II.',
    metadata=jsonb_set(
      jsonb_set(
        coalesce(metadata,'{}'::jsonb),
        '{family_reaudit}',
        jsonb_build_object(
          'checked_at','2026-10-05',
          'canonical_release_count',3,
          'method','TrackDash current family method',
          'related_occurrences',jsonb_build_array(
            jsonb_build_object(
              'item_number','94618',
              'name','Magnum Saber Special Kit',
              'note','Dual-body commercial kit includes a reinforced Sonic Saber body; canonical Release remains in Magnum Saber family and is not duplicated.'
            )
          )
        ),
        true
      ),
      '{launch_status}',
      '"coming_soon"'::jsonb,
      true
    ),
    updated_at=now()
where id='896cc70e-3048-594d-9389-cb9808a5ad53'::uuid;

-- ---------------------------------------------------------------------------
-- 1. Original 1994 collector identity.
-- ---------------------------------------------------------------------------
update public.product_releases
set item_number='19402',
    release_type='Original',
    edition_name='Sonic Saber (1994 Original)',
    release_year=1994,
    release_date=date '1994-09-07',
    chassis='Super 1',
    barcode_jan='4950344194025',
    color='White / Red / Green',
    country_market='Japan',
    msrp_jpy=600,
    discontinued=true,
    is_original=true,
    data_source='master_reaudit_20261005',
    edition_type='original',
    verification_status='verified',
    production_status='discontinued',
    status_checked_at=now(),
    description='Original 1994 Sonic Saber on the Super 1 chassis.',
    description_it='Sonic Saber originale del 1994 su telaio Super 1.',
    notes=concat_ws(' ',nullif(notes,''),
      'TrackDash Master re-audit 2026-10-05: original collector identity reconfirmed as ITEM 19402 / September 1994 / Super 1. Historical channel metadata maps JAN 4950344194025 to this early commercial generation. The current Tamiya ITEM 19402 image is not treated as exact 1994 packaging-generation proof and is moved to the later reissue generation.'),
    updated_at=now()
where id='e23951fd-63a5-5233-8c53-969c57e98819'::uuid;

insert into public.release_identifiers(
  id,release_id,scheme,value,market,is_primary,verification_status,source_url,checked_at
)
select gen_random_uuid(),r.id,'JAN','4950344194025','JP',true,'verified',
       'https://www.amiami.jp/top/detail/detail?gcode=TOY-SCL-3382&page=related_item',
       '2026-10-05'
from public.product_releases r
where r.id='e23951fd-63a5-5233-8c53-969c57e98819'::uuid
on conflict (release_id,scheme,value,market) do update set
  is_primary=true,verification_status='verified',source_url=excluded.source_url,checked_at=excluded.checked_at;

insert into public.release_sources(
  id,release_id,source_type,source_url,verified_fields,checked_at,notes
)
select gen_random_uuid(),r.id,'trusted_secondary',
       'https://www.amiami.jp/top/detail/detail?gcode=TOY-SCL-3382&page=related_item',
       array['itemNumber','barcodeJAN','editionName','chassis'],
       '2026-10-05',
       'Historical retail metadata maps ITEM 19402 Sonic Saber to JAN 4950344194025 and the original Super 1 specification.'
from public.product_releases r
where r.id='e23951fd-63a5-5233-8c53-969c57e98819'::uuid
  and not exists (
    select 1 from public.release_sources x
    where x.release_id=r.id
      and x.source_url='https://www.amiami.jp/top/detail/detail?gcode=TOY-SCL-3382&page=related_item'
  );

insert into public.release_sources(
  id,release_id,source_type,source_url,verified_fields,checked_at,notes
)
select gen_random_uuid(),r.id,'official_manufacturer',
       'https://www.tamiya.com/cms/japan/mini4wd/jr_news/jr_news15/pdf/000183.pdf',
       array['itemNumber','editionName','releaseYear','chassis'],
       '2026-10-05',
       'Official Tamiya JR News retrospective identifies Sonic Saber ITEM 19402 as the first Sonic machine released in September 1994 on Super 1.'
from public.product_releases r
where r.id='e23951fd-63a5-5233-8c53-969c57e98819'::uuid
  and not exists (
    select 1 from public.release_sources x
    where x.release_id=r.id
      and x.source_url='https://www.tamiya.com/cms/japan/mini4wd/jr_news/jr_news15/pdf/000183.pdf'
  );

-- Existing current Tamiya source/image belongs to the later/current reissue
-- presentation, not to the 1994 packaging generation.
update public.release_sources
set verified_fields=array_remove(verified_fields,'image'),
    checked_at='2026-10-05',
    notes='Official Tamiya ITEM 19402 page confirms model/item/chassis identity, but its current product image is not used as exact 1994 packaging-generation evidence.'
where release_id='e23951fd-63a5-5233-8c53-969c57e98819'::uuid
  and source_url='https://www.tamiya.com/japan/products/19402/index.html';

-- ---------------------------------------------------------------------------
-- 2. 19402 reissue generation. Same ITEM/spec across later waves; different JAN
-- from the original makes this a distinct collector Release.
-- ---------------------------------------------------------------------------
insert into public.product_releases(
  id,product_id,item_number,release_type,edition_name,release_year,release_date,
  chassis,barcode_jan,color,country_market,msrp_jpy,notes,discontinued,is_original,
  data_source,edition_type,verification_status,production_status,status_checked_at,
  description,description_it,catalog_visibility,catalog_visibility_reason,catalog_visibility_updated_at
)
select
  gen_random_uuid(),
  p.id,
  '19402',
  'Reissue',
  'Sonic Saber (2003 Reissue)',
  2003,
  date '2003-04-22',
  'Super 1',
  '4950344061327',
  'White / Red / Green',
  'Japan',
  780,
  'TrackDash Master re-audit 2026-10-05: distinct later 19402 commercial generation under JAN 4950344061327. HLJ records a 2003-04-22 release under this JAN; Suruga records a 2015-09-30 wave under the same ITEM/JAN/specification, and current Japanese retail still uses the same 4950344061327 identifier. Per TrackDash production-wave policy these are one collector Release with later restock/production waves, not multiple Releases.',
  false,
  false,
  'master_reaudit_20261005',
  'reissue',
  'verified',
  'active',
  now(),
  'Later Sonic Saber 19402 reissue generation on Super 1, distinguished from the 1994 original by JAN.',
  'Generazione ristampa Sonic Saber 19402 su Super 1, distinta dall’originale 1994 tramite JAN.',
  'public',
  'current_method_verified',
  now()
from public.products p
where p.id='896cc70e-3048-594d-9389-cb9808a5ad53'::uuid
  and not exists (
    select 1 from public.product_releases r
    where r.product_id=p.id
      and r.item_number='19402'
      and r.barcode_jan='4950344061327'
  );

update public.product_releases
set release_type='Reissue',
    edition_name='Sonic Saber (2003 Reissue)',
    release_year=2003,
    release_date=date '2003-04-22',
    chassis='Super 1',
    barcode_jan='4950344061327',
    production_status='active',
    discontinued=false,
    verification_status='verified',
    status_checked_at=now(),
    catalog_visibility='public',
    catalog_visibility_reason='current_method_verified',
    catalog_visibility_updated_at=now(),
    updated_at=now()
where product_id='896cc70e-3048-594d-9389-cb9808a5ad53'::uuid
  and item_number='19402'
  and barcode_jan='4950344061327';

insert into public.release_identifiers(
  id,release_id,scheme,value,market,is_primary,verification_status,source_url,checked_at
)
select gen_random_uuid(),r.id,'JAN','4950344061327','JP',true,'verified',
       'https://www.hlj.co.jp/product/TAM19402',
       '2026-10-05'
from public.product_releases r
where r.product_id='896cc70e-3048-594d-9389-cb9808a5ad53'::uuid
  and r.item_number='19402'
  and r.barcode_jan='4950344061327'
on conflict (release_id,scheme,value,market) do update set
  is_primary=true,verification_status='verified',source_url=excluded.source_url,checked_at=excluded.checked_at;

insert into public.release_sources(
  id,release_id,source_type,source_url,verified_fields,checked_at,notes
)
select gen_random_uuid(),r.id,'trusted_secondary',
       'https://www.hlj.co.jp/product/TAM19402',
       array['itemNumber','barcodeJAN','releaseDate','editionName','chassis'],
       '2026-10-05',
       'HLJ exact product metadata records ITEM 19402 / JAN 4950344061327 / release date 2003-04-22.'
from public.product_releases r
where r.product_id='896cc70e-3048-594d-9389-cb9808a5ad53'::uuid
  and r.item_number='19402' and r.barcode_jan='4950344061327'
  and not exists (
    select 1 from public.release_sources x where x.release_id=r.id
      and x.source_url='https://www.hlj.co.jp/product/TAM19402'
  );

insert into public.release_sources(
  id,release_id,source_type,source_url,verified_fields,checked_at,notes
)
select gen_random_uuid(),r.id,'trusted_secondary',
       'https://www.suruga-ya.jp/kaitori/kaitori_detail/603060171',
       array['itemNumber','barcodeJAN','releaseDate','editionName','chassis'],
       '2026-10-05',
       'Suruga exact product metadata records a later 2015-09-30 production/reissue wave under the same ITEM 19402 / JAN 4950344061327 / Super 1 specification.'
from public.product_releases r
where r.product_id='896cc70e-3048-594d-9389-cb9808a5ad53'::uuid
  and r.item_number='19402' and r.barcode_jan='4950344061327'
  and not exists (
    select 1 from public.release_sources x where x.release_id=r.id
      and x.source_url='https://www.suruga-ya.jp/kaitori/kaitori_detail/603060171'
  );

insert into public.release_sources(
  id,release_id,source_type,source_url,verified_fields,checked_at,notes
)
select gen_random_uuid(),r.id,'official_manufacturer',
       'https://www.tamiya.com/japan/products/19402/index.html',
       array['itemNumber','editionName','chassis','image','marketAvailability'],
       '2026-10-05',
       'Current official Tamiya ITEM 19402 page confirms the Super 1 specification and current product presentation; page currently reports Tamiya Tokyo handling.'
from public.product_releases r
where r.product_id='896cc70e-3048-594d-9389-cb9808a5ad53'::uuid
  and r.item_number='19402' and r.barcode_jan='4950344061327'
  and not exists (
    select 1 from public.release_sources x where x.release_id=r.id
      and x.source_url='https://www.tamiya.com/japan/products/19402/index.html'
  );

-- Move the current official hero away from the 1994 Original to the later/current
-- reissue generation. The Original intentionally retains a documented image gap.
update public.release_images
set release_id=(
  select id from public.product_releases
  where product_id='896cc70e-3048-594d-9389-cb9808a5ad53'::uuid
    and item_number='19402' and barcode_jan='4950344061327'
  limit 1
)
where release_id='e23951fd-63a5-5233-8c53-969c57e98819'::uuid
  and url='https://www.tamiya.com/japan_contents/img/usr/item/1/19402/19402_1.jpg';

update public.product_releases
set notes=concat_ws(' ',nullif(notes,''),
      'Image audit 2026-10-05: DOCUMENTED IMAGE GAP for exact 1994 packaging generation. The current official Tamiya assembled-product hero was reassigned to the later 19402 reissue/current-production generation rather than risk Original/Reissue contamination.'),
    updated_at=now()
where id='e23951fd-63a5-5233-8c53-969c57e98819'::uuid;

-- ---------------------------------------------------------------------------
-- 3. Premium 19432: one Release, multiple production/channel JANs.
-- ---------------------------------------------------------------------------
update public.product_releases
set item_number='19432',
    release_type='Premium',
    edition_name='Sonic Saber Premium',
    release_year=2011,
    release_date=date '2011-01-22',
    chassis='Super II',
    barcode_jan='4950344194322',
    color='White / Red / Green',
    country_market='Japan',
    msrp_jpy=900,
    discontinued=false,
    is_original=false,
    data_source='master_reaudit_20261005',
    edition_type='premium',
    verification_status='verified',
    production_status='active',
    status_checked_at=now(),
    description='2011 Sonic Saber Premium on the reinforced Super II chassis.',
    description_it='Sonic Saber Premium del 2011 su telaio Super II rinforzato.',
    notes=concat_ws(' ',nullif(notes,''),
      'TrackDash Master re-audit 2026-10-05: official Tamiya establishes launch date 2011-01-22 and Super II identity. Historical JAN 4950344194322 remains the primary collector identifier. Later/current channel JANs 4950344064014 and 4950344086894 map to the same ITEM/specification and are stored as aliases, not split into new Releases. Official Tamiya Shop currently carries ITEM 19432.'),
    updated_at=now()
where id='62cca367-8a73-5280-b2a2-0aa9497d093d'::uuid;

insert into public.release_identifiers(
  id,release_id,scheme,value,market,is_primary,verification_status,source_url,checked_at
)
values
(gen_random_uuid(),'62cca367-8a73-5280-b2a2-0aa9497d093d'::uuid,'JAN','4950344194322','JP',true,'verified',
 'https://shopping.yahoo.co.jp/products/079eec7594','2026-10-05'),
(gen_random_uuid(),'62cca367-8a73-5280-b2a2-0aa9497d093d'::uuid,'JAN','4950344064014','JP',false,'verified',
 'https://www.1999.co.jp/10132100','2026-10-05'),
(gen_random_uuid(),'62cca367-8a73-5280-b2a2-0aa9497d093d'::uuid,'JAN','4950344086894','JP',false,'verified',
 'https://store.shopping.yahoo.co.jp/tamiya/19432.html','2026-10-05')
on conflict (release_id,scheme,value,market) do update set
  is_primary=excluded.is_primary,verification_status='verified',source_url=excluded.source_url,checked_at=excluded.checked_at;

insert into public.release_sources(
  id,release_id,source_type,source_url,verified_fields,checked_at,notes
)
values
(gen_random_uuid(),'62cca367-8a73-5280-b2a2-0aa9497d093d'::uuid,'official_manufacturer',
 'https://www.tamiya.com/japan/products/19432/index.html',
 array['itemNumber','editionName','releaseDate','chassis','image','productionStatus'],'2026-10-05',
 'Official Tamiya exact page confirms ITEM 19432, launch date 2011-01-22, Super II specification and current catalog handling.'),
(gen_random_uuid(),'62cca367-8a73-5280-b2a2-0aa9497d093d'::uuid,'trusted_secondary',
 'https://shopping.yahoo.co.jp/products/079eec7594',
 array['itemNumber','barcodeJAN','releaseDate'],'2026-10-05',
 'Historical product metadata corroborates JAN 4950344194322 and 2011-01-22 launch.'),
(gen_random_uuid(),'62cca367-8a73-5280-b2a2-0aa9497d093d'::uuid,'trusted_secondary',
 'https://www.1999.co.jp/10132100',
 array['itemNumber','barcodeJAN','editionName','chassis'],'2026-10-05',
 'Hobby Search maps later production/channel JAN 4950344064014 to the same ITEM 19432 Sonic Saber Premium specification.'),
(gen_random_uuid(),'62cca367-8a73-5280-b2a2-0aa9497d093d'::uuid,'official_manufacturer',
 'https://store.shopping.yahoo.co.jp/tamiya/19432.html',
 array['itemNumber','barcodeJAN','marketAvailability'],'2026-10-05',
 'Official Tamiya Yahoo store maps current channel JAN 4950344086894 to ITEM 19432 and currently offers the product.')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 4. Make all three canonical Releases enter Price Intelligence while the
-- family remains coming_soon. Publication promotion happens only after market
-- and image QA.
-- ---------------------------------------------------------------------------
select public.trackdash_enqueue_market_recompute(r.id,'new_complete_unbuilt')
from public.product_releases r
where r.product_id='896cc70e-3048-594d-9389-cb9808a5ad53'::uuid;

-- A first signal is the durable Market Watch enrollment boundary. Let the
-- canonical recompute create/update signals; the queue functions are also
-- called explicitly to ensure newly inserted Release targets exist.
select public.trackdash_enroll_release_market_scans(r.id)
from public.product_releases r
where r.product_id='896cc70e-3048-594d-9389-cb9808a5ad53'::uuid;

-- Re-audit eBay scans are due now only for the Sonic family. Shared ITEM 19402
-- jobs are safe because each canonical generation has a globally unique JAN,
-- and the worker still requires structured JAN confirmation.
update public.market_scan_queue q
set enabled=true,
    activity_tier='normal',
    scan_interval_hours=1008,
    priority=180,
    next_scan_at='2000-01-01 00:00:00+00',
    locked_until=null,
    consecutive_failures=0,
    last_error=null,
    updated_at=now()
where q.release_id in (
  select id from public.product_releases
  where product_id='896cc70e-3048-594d-9389-cb9808a5ad53'::uuid
)
and q.source_id=(select id from public.price_sources where slug='ebay_active_public')
and q.scan_scope='active_marketplace';

commit;
