-- Magnum Saber family re-audit — 2026-09-30
--
-- Re-audit under the current TrackDash Method Master / Market Method v4.
-- Canonical genealogy remains 9 public collector Releases.
--
-- Key corrections:
-- - ITEM 19401 Original 1994 and 2015 Reissue remain separate via distinct JANs;
-- - the modern Tamiya 19401 hero is no longer accepted as exact 1994 packaging,
--   so the Original intentionally falls back to a documented image gap;
-- - 19431 Premium remains one collector Release across documented production
--   waves; alternate JANs are stored as identifiers, not new Releases;
-- - First Impact shared assortment JAN remains fail-closed and is not promoted
--   to any single color Release barcode;
-- - a new exact Tokyo Anime Center Mercari sold-out observation is persisted as
--   context only because the absolute sold date is unavailable;
-- - canonical recompute/eBay jobs are queued ahead of unrelated due work without
--   altering any non-Magnum queue rows.

begin;

-- ---------------------------------------------------------------------------
-- 1. Re-assert the canonical 9-Release genealogy and current status decisions.
-- ---------------------------------------------------------------------------

update public.product_releases
set verification_status='verified',
    production_status='discontinued',
    discontinued=true,
    status_checked_at=now(),
    updated_at=now(),
    notes=concat_ws(' ',nullif(notes,''),
      'TrackDash re-audit 2026-09-30: canonical 1994 Original identity reconfirmed through exact historical Suruga/Kaitori metadata (ITEM 19401 / JAN 4950344194018). The current Tamiya ITEM 19401 product page is not used as packaging-generation proof for this vintage Release.')
where product_id=(select id from public.products where slug='magnum-saber-19401')
  and item_number='19401' and release_year=1994;

update public.product_releases
set verification_status='verified',
    production_status='discontinued',
    discontinued=true,
    status_checked_at=now(),
    updated_at=now(),
    notes=concat_ws(' ',nullif(notes,''),
      'TrackDash re-audit 2026-09-30: Special Kit identity/status reconfirmed. Official Tamiya USA still identifies ITEM 94618 as discontinued; no Europe-comparable current ASK was promoted during the new Initial Market Challenge.')
where product_id=(select id from public.products where slug='magnum-saber-19401')
  and item_number='94618' and release_year=2007;

update public.product_releases
set verification_status='verified',
    production_status='active',
    discontinued=false,
    status_checked_at=now(),
    updated_at=now(),
    notes=concat_ws(' ',nullif(notes,''),
      'TrackDash re-audit 2026-09-30: ITEM 19431 remains one Premium collector Release across later production waves. Historical JAN 4950344194315 remains the primary Release barcode; later/current channel JANs are preserved as verified aliases rather than split into new Releases.')
where product_id=(select id from public.products where slug='magnum-saber-19401')
  and item_number='19431' and release_year=2010;

update public.product_releases
set verification_status='verified',
    production_status='discontinued',
    discontinued=true,
    status_checked_at=now(),
    updated_at=now(),
    notes=concat_ws(' ',nullif(notes,''),
      'TrackDash re-audit 2026-09-30: 2015 reissue remains a distinct collector Release from the 1994 Original via JAN 4950344061310. Current Japanese catalog/retail handling is not treated as sufficient proof of active manufacturing; Tamiya USA explicitly marks ITEM 19401 discontinued, so status remains conservative.')
where product_id=(select id from public.products where slug='magnum-saber-19401')
  and item_number='19401' and release_year=2015;

update public.product_releases
set verification_status='verified',
    production_status='discontinued',
    discontinued=true,
    status_checked_at=now(),
    updated_at=now(),
    notes=concat_ws(' ',nullif(notes,''),
      'TrackDash re-audit 2026-09-30: First Impact four-color prize identity reconfirmed. JAN 4519869507002 appears in assortment/color metadata and remains deliberately excluded from barcode_jan for automatic color resolution. Current Japan-market observations remain context unless exact condition and Europe-comparable acquisition cost are established.')
where product_id=(select id from public.products where slug='magnum-saber-19401')
  and item_number in ('92318','92319','92320','92321')
  and release_year=2015;

update public.product_releases
set verification_status='verified',
    production_status='active',
    discontinued=false,
    status_checked_at=now(),
    updated_at=now(),
    notes=concat_ws(' ',nullif(notes,''),
      'TrackDash re-audit 2026-09-30: official Tokyo Anime Center / Osaka POP UP availability remains current through 2026-10-06. New marketplace evidence is kept separate from Market Value unless it has an absolute sold date and valuation-compatible condition.')
where product_id=(select id from public.products where slug='magnum-saber-19401')
  and item_number is null
  and release_year=2026
  and edition_name='Magnum Saber Tokyo Anime Center Model';

-- ---------------------------------------------------------------------------
-- 2. Original 1994 image correction.
-- ---------------------------------------------------------------------------

-- The legacy hero came from the current Tamiya ITEM 19401 page. That asset is
-- not a defensible packaging-generation discriminator for the 1994 Original.
-- Remove it rather than risk showing the 2015/current production presentation.
delete from public.release_images
where release_id=(
  select id from public.product_releases
  where product_id=(select id from public.products where slug='magnum-saber-19401')
    and item_number='19401' and release_year=1994
)
and url='https://www.tamiya.com/japan_contents/img/usr/item/1/19401/19401_1.jpg';

update public.release_sources
set verified_fields=array_remove(verified_fields,'image'),
    checked_at='2026-09-30',
    notes='Official Tamiya ITEM 19401 page confirms model/item/chassis identity, but its current product image is not treated as an exact 1994 packaging-generation hero after the 2026-09-30 re-audit.'
where release_id=(
  select id from public.product_releases
  where product_id=(select id from public.products where slug='magnum-saber-19401')
    and item_number='19401' and release_year=1994
)
and source_url='https://www.tamiya.com/japan/products/19401/index.html';

update public.release_sources
set checked_at='2026-09-30',
    verified_fields=(
      select array_agg(distinct x order by x)
      from unnest(verified_fields || array['image']::text[]) x
    ),
    notes='Exact historical Suruga identity for the 1994 Magnum Saber: ITEM 19401, JAN 4950344194018, release date 1994-09-08 and management ID 603004020. The page contains exact vintage imagery, but no stable direct asset URL was persisted during this audit; documented gap is preferred to the modern sibling image.'
where release_id=(
  select id from public.product_releases
  where product_id=(select id from public.products where slug='magnum-saber-19401')
    and item_number='19401' and release_year=1994
)
and source_url='https://www.suruga-ya.jp/product/detail/603004020';

update public.product_releases
set notes=concat_ws(' ',nullif(notes,''),
  'Image audit 2026-09-30: DOCUMENTED IMAGE GAP. Exact 1994 imagery is visible on Suruga management 603004020, but a stable direct image asset was not verified. Modern Tamiya ITEM 19401 hero removed to avoid Original/Reissue contamination.'),
    updated_at=now()
where product_id=(select id from public.products where slug='magnum-saber-19401')
  and item_number='19401' and release_year=1994;

-- ---------------------------------------------------------------------------
-- 3. ITEM 19431 production-wave JAN aliases.
-- ---------------------------------------------------------------------------

-- Keep the documented 2010 JAN as primary.
insert into public.release_identifiers(
  id,release_id,scheme,value,market,is_primary,verification_status,source_url,checked_at
)
select gen_random_uuid(),r.id,'JAN','4950344194315','JP',true,'verified',
       'https://www.tamiyausa.com/media/files/map-feb-2026-1239-08db.pdf',
       '2026-09-30'
from public.product_releases r
where r.product_id=(select id from public.products where slug='magnum-saber-19401')
  and r.item_number='19431' and r.release_year=2010
on conflict (release_id,scheme,value,market) do update set
  is_primary=true,
  verification_status='verified',
  source_url=excluded.source_url,
  checked_at=excluded.checked_at;

-- Current official Tamiya Japan/Yahoo retail channel JAN.
insert into public.release_identifiers(
  id,release_id,scheme,value,market,is_primary,verification_status,source_url,checked_at
)
select gen_random_uuid(),r.id,'JAN','4950344086887','JP',false,'verified',
       'https://store.shopping.yahoo.co.jp/tamiya/19431.html',
       '2026-09-30'
from public.product_releases r
where r.product_id=(select id from public.products where slug='magnum-saber-19401')
  and r.item_number='19431' and r.release_year=2010
on conflict (release_id,scheme,value,market) do update set
  is_primary=false,
  verification_status='verified',
  source_url=excluded.source_url,
  checked_at=excluded.checked_at;

-- Widely observed later production/retail JAN. It maps to the same ITEM/spec
-- and is not treated as a separate collector Release.
insert into public.release_identifiers(
  id,release_id,scheme,value,market,is_primary,verification_status,source_url,checked_at
)
select gen_random_uuid(),r.id,'JAN','4950344064007','JP',false,'verified',
       'https://store.shopping.yahoo.co.jp/hobbyone/4950344064007.html',
       '2026-09-30'
from public.product_releases r
where r.product_id=(select id from public.products where slug='magnum-saber-19401')
  and r.item_number='19431' and r.release_year=2010
on conflict (release_id,scheme,value,market) do update set
  is_primary=false,
  verification_status='verified',
  source_url=excluded.source_url,
  checked_at=excluded.checked_at;

insert into public.release_sources(
  id,release_id,source_type,source_url,verified_fields,checked_at,notes
)
select gen_random_uuid(),r.id,'official_manufacturer',
       'https://www.tamiyausa.com/media/files/map-feb-2026-1239-08db.pdf',
       array['itemNumber','barcodeJAN','marketAvailability'],
       '2026-09-30',
       'Tamiya USA MAP list dated 2026-02-04 still lists ITEM 19431 / JAN 4950344194315, corroborating the historical primary JAN and current channel handling.'
from public.product_releases r
where r.product_id=(select id from public.products where slug='magnum-saber-19401')
  and r.item_number='19431' and r.release_year=2010
  and not exists (
    select 1 from public.release_sources x
    where x.release_id=r.id
      and x.source_url='https://www.tamiyausa.com/media/files/map-feb-2026-1239-08db.pdf'
  );

insert into public.release_sources(
  id,release_id,source_type,source_url,verified_fields,checked_at,notes
)
select gen_random_uuid(),r.id,'official_manufacturer',
       'https://store.shopping.yahoo.co.jp/tamiya/19431.html',
       array['itemNumber','barcodeJAN','marketAvailability'],
       '2026-09-30',
       'Official Tamiya Shop Yahoo listing maps ITEM 19431 to JAN 4950344086887 at JPY 1,430. Treated as a later production-wave identifier of the same Premium collector Release.'
from public.product_releases r
where r.product_id=(select id from public.products where slug='magnum-saber-19401')
  and r.item_number='19431' and r.release_year=2010
  and not exists (
    select 1 from public.release_sources x
    where x.release_id=r.id
      and x.source_url='https://store.shopping.yahoo.co.jp/tamiya/19431.html'
  );

insert into public.release_sources(
  id,release_id,source_type,source_url,verified_fields,checked_at,notes
)
select gen_random_uuid(),r.id,'trusted_secondary',
       'https://store.shopping.yahoo.co.jp/hobbyone/4950344064007.html',
       array['itemNumber','barcodeJAN','editionName','chassis'],
       '2026-09-30',
       'Exact retail metadata maps JAN 4950344064007 to ITEM 19431 Magnum Saber Premium / Super-II. Preserved as a non-primary production-wave identifier; no new Release split is created.'
from public.product_releases r
where r.product_id=(select id from public.products where slug='magnum-saber-19401')
  and r.item_number='19431' and r.release_year=2010
  and not exists (
    select 1 from public.release_sources x
    where x.release_id=r.id
      and x.source_url='https://store.shopping.yahoo.co.jp/hobbyone/4950344064007.html'
  );

-- ---------------------------------------------------------------------------
-- 4. Reissue status provenance (conservative).
-- ---------------------------------------------------------------------------

insert into public.release_sources(
  id,release_id,source_type,source_url,verified_fields,checked_at,notes
)
select gen_random_uuid(),r.id,'official_manufacturer',
       'https://www.tamiyausa.com/shop/132-fully-cowled/jr-fully-cowled-magnum-saber/',
       array['itemNumber','editionName','chassis','productionStatus'],
       '2026-09-30',
       'Current Tamiya USA ITEM 19401 page explicitly reports Discontinued. Combined with the 2015 reissue JAN evidence, TrackDash conservatively keeps the modern/reissue production status discontinued despite residual/current Japanese catalog handling.'
from public.product_releases r
where r.product_id=(select id from public.products where slug='magnum-saber-19401')
  and r.item_number='19401' and r.release_year=2015
  and not exists (
    select 1 from public.release_sources x
    where x.release_id=r.id
      and x.source_url='https://www.tamiyausa.com/shop/132-fully-cowled/jr-fully-cowled-magnum-saber/'
  );

-- ---------------------------------------------------------------------------
-- 5. Tokyo Anime Center — new exact sold-out context, not valuation-eligible.
-- ---------------------------------------------------------------------------

with rel as (
  select id
  from public.product_releases
  where product_id=(select id from public.products where slug='magnum-saber-19401')
    and item_number is null
    and release_year=2026
    and edition_name='Magnum Saber Tokyo Anime Center Model'
), src as (
  select id from public.price_sources where slug='mercari_jp_public'
)
insert into public.market_candidates(
  source_id,source_record_key,external_listing_id,original_source,
  listing_url,title_raw,item_number_observed,possible_release_ids,resolved_release_id,
  price,currency,shipping_cost,shipping_basis,observation_type,
  condition_raw,condition,inner_bags_sealed,box_condition,
  is_complete,is_lot,quantity,match_confidence,match_evidence,
  evidence_group_key,sold_on,observed_at,decision,reason_codes,review_notes,
  raw_payload,needs_revalidation,first_observed_at,last_observed_at
)
select
  src.id,
  'mercari:m79435396313',
  'm79435396313',
  'MERCARI_JP',
  'https://jp.mercari.com/item/m79435396313',
  'マグナムセイバー 東京アニメセンターモデル',
  null,
  array[rel.id]::uuid[],
  rel.id,
  22100,
  'JPY',
  455,
  'included_exact',
  'marketplace_sold',
  '新品、未使用 / 新品未開封',
  'new_complete_unbuilt',
  'unknown',
  'unknown',
  true,
  false,
  1,
  'exact',
  array['edition_name_exact','chassis_stated','manual_override']::text[],
  'mercari:m79435396313',
  null,
  now(),
  'accepted',
  array['SOLD_DATE_UNRESOLVED']::text[],
  'Exact sold-out Mercari observation for the Tokyo Anime Center Model at JPY 22,100, new/unopened, with JPY 455 included domestic shipping. The indexed page does not expose an absolute sold date, so this remains SOLD context only and no valuation price_point is created.',
  jsonb_build_object(
    'checked_at','2026-09-30',
    'availability','sold_out',
    'absolute_sold_date',null,
    'domestic_shipping_included_jpy',455
  ),
  false,
  now(),
  now()
from rel cross join src
on conflict (source_id,source_record_key) do update set
  listing_url=excluded.listing_url,
  title_raw=excluded.title_raw,
  resolved_release_id=excluded.resolved_release_id,
  possible_release_ids=excluded.possible_release_ids,
  price=excluded.price,
  currency=excluded.currency,
  shipping_cost=excluded.shipping_cost,
  shipping_basis=excluded.shipping_basis,
  observation_type=excluded.observation_type,
  condition_raw=excluded.condition_raw,
  condition=excluded.condition,
  is_complete=excluded.is_complete,
  is_lot=excluded.is_lot,
  quantity=excluded.quantity,
  match_confidence=excluded.match_confidence,
  match_evidence=excluded.match_evidence,
  decision=excluded.decision,
  reason_codes=excluded.reason_codes,
  review_notes=excluded.review_notes,
  raw_payload=excluded.raw_payload,
  needs_revalidation=false,
  observed_at=now(),
  last_observed_at=now(),
  updated_at=now();

-- ---------------------------------------------------------------------------
-- 6. Queue/recompute safety.
-- ---------------------------------------------------------------------------

select public.trackdash_enroll_release_market_scans(r.id)
from public.product_releases r
where r.product_id=(select id from public.products where slug='magnum-saber-19401');

select public.trackdash_enqueue_market_recompute(r.id,'new_complete_unbuilt')
from public.product_releases r
where r.product_id=(select id from public.products where slug='magnum-saber-19401');

-- Put Magnum recomputes first without changing unrelated queue rows.
update public.market_recompute_queue q
set dirty_at='2000-01-01 00:00:00+00',
    available_at='2000-01-01 00:00:00+00',
    locked_until=null,
    attempts=0,
    last_error=null,
    updated_at=now()
where q.release_id in (
  select id from public.product_releases
  where product_id=(select id from public.products where slug='magnum-saber-19401')
)
and q.condition='new_complete_unbuilt';

-- Unique ITEM eBay jobs: current re-audit scan is due now and deliberately
-- placed ahead of unrelated work. ITEM 19401 and no-ITEM Tokyo stay fail-closed.
update public.market_scan_queue q
set enabled=true,
    priority=180,
    next_scan_at='2000-01-01 00:00:00+00',
    locked_until=null,
    consecutive_failures=0,
    last_error=null,
    updated_at=now()
where q.release_id in (
  select id from public.product_releases
  where product_id=(select id from public.products where slug='magnum-saber-19401')
    and item_number in ('94618','19431','92318','92319','92320','92321')
)
and q.source_id=(select id from public.price_sources where slug='ebay_active_public')
and q.scan_scope='active_marketplace';

update public.market_scan_queue q
set enabled=false,
    next_scan_at='2099-01-01 00:00:00+00',
    locked_until=null,
    last_error=null,
    updated_at=now()
where q.release_id in (
  select id from public.product_releases
  where product_id=(select id from public.products where slug='magnum-saber-19401')
    and (item_number='19401' or item_number is null)
)
and q.source_id=(select id from public.price_sources where slug='ebay_active_public')
and q.scan_scope='active_marketplace';

commit;
