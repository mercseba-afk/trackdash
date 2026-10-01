-- Manta Ray Mk.II current-method re-scan — 2026-10-01
--
-- Existing genealogy remains canonical at 10 public Releases.
-- This pass refreshes market/status metadata under the post-Sep30 EU-first
-- engine and persistent collector-trend semantics.
--
-- Three event-limited metallic Releases still have no verified autonomous
-- Item Number and therefore remain fail-closed for automatic eBay attribution.

begin;

-- ---------------------------------------------------------------------------
-- 1. Status / identity revalidation.
-- ---------------------------------------------------------------------------

update public.product_releases
set status_checked_at=now(),
    updated_at=now(),
    notes=case
      when coalesce(notes,'') like '%TrackDash current-method re-scan 2026-10-01:%' then notes
      else concat_ws(' ',nullif(notes,''),
        'TrackDash current-method re-scan 2026-10-01: ITEM 18615 / JAN 4950344186150 remains the canonical 2006 Manta Ray Mk.II. Tamiya Japan still maintains the official product page/Tamiya Tokyo handling and a recent Tamiya USA MAP list still includes ITEM 18615, while the Tamiya USA product page marks the model discontinued. TrackDash therefore keeps the conservative discontinued production status while documenting current catalog/handling evidence.')
    end
where id='6a14c7a3-bd78-57b3-89fe-6c764818991a'::uuid;

update public.product_releases
set status_checked_at=now(),
    updated_at=now(),
    notes=case
      when coalesce(notes,'') like '%TrackDash current-method re-scan 2026-10-01:%' then notes
      else concat_ws(' ',nullif(notes,''),
        'TrackDash current-method re-scan 2026-10-01: 2010 event-only Silver Metallic semi-finished model remains a distinct verified event Release. Contemporary Summer GP reporting confirms the model and sale format, but no autonomous Item Number/JAN or exact stable hero image has been verified. Keep identifiers empty and image placeholder rather than borrowing another Manta Ray image.')
    end
where id='9a231f02-7a7e-5489-b44d-b4eb10b60a78'::uuid;

update public.product_releases
set status_checked_at=now(),
    updated_at=now(),
    notes=case
      when coalesce(notes,'') like '%TrackDash current-method re-scan 2026-10-01:%' then notes
      else concat_ws(' ',nullif(notes,''),
        'TrackDash current-method re-scan 2026-10-01: contemporary 2012 Japan Cup reporting explicitly identifies the event-limited Manta Ray Mk.II Black Metallic specification, confirming this is Mk.II rather than Manta Ray Jr. No autonomous Item Number/JAN has been verified, so automatic marketplace attribution remains disabled.')
    end
where id='d6617c26-9ec3-5adf-892f-ebeb1c782b70'::uuid;

update public.product_releases
set status_checked_at=now(),
    updated_at=now(),
    notes=case
      when coalesce(notes,'') like '%TrackDash current-method re-scan 2026-10-01:%' then notes
      else concat_ws(' ',nullif(notes,''),
        'TrackDash current-method re-scan 2026-10-01: ITEM 95462 remains the distinct 2019 White Special reissue. Tamiya Japan still maintains the product/Tamiya Tokyo handling while Tamiya USA explicitly marks it discontinued; conservative discontinued status remains.')
    end
where id='a98fe80b-1f8c-53e1-b26d-404daf93b77d'::uuid;

update public.product_releases
set status_checked_at=now(),
    updated_at=now(),
    notes=case
      when coalesce(notes,'') like '%TrackDash current-method re-scan 2026-10-01:%' then notes
      else concat_ws(' ',nullif(notes,''),
        'TrackDash current-method re-scan 2026-10-01: ITEM 95466 remains one collector Release. Official Tamiya Japan still identifies initial release month March 2019 and a 2023-08-26 production/on-sale wave under the same Item/JAN/specification. Tamiya USA marks it discontinued. No physical collector discriminator supporting a 2019/2023 split has been verified.')
    end
where id='b2805fb7-cdd3-5dbf-a724-f73d54702844'::uuid;

update public.product_releases
set status_checked_at=now(),
    updated_at=now(),
    notes=case
      when coalesce(notes,'') like '%TrackDash current-method re-scan 2026-10-01:%' then notes
      else concat_ws(' ',nullif(notes,''),
        'TrackDash current-method re-scan 2026-10-01: ITEM 95690 City Circuit Special remains the distinct 2025 MA-chassis collaboration Release and stays active/current. Official Tamiya identity and current retail evidence remain consistent.')
    end
where id='4fdb8e31-07be-5907-9530-9a9bbe7edcf2'::uuid;

-- Refresh the checked date on exact official sources already used for current identity.
update public.release_sources
set checked_at='2026-10-01'
where release_id in (
  '6a14c7a3-bd78-57b3-89fe-6c764818991a'::uuid,
  'a98fe80b-1f8c-53e1-b26d-404daf93b77d'::uuid,
  'b2805fb7-cdd3-5dbf-a724-f73d54702844'::uuid,
  '4fdb8e31-07be-5907-9530-9a9bbe7edcf2'::uuid
)
and source_type in ('official_manufacturer','official_catalog_pdf');

insert into public.release_sources(
  id,release_id,source_type,source_url,verified_fields,checked_at,notes
)
select gen_random_uuid(),
       '6a14c7a3-bd78-57b3-89fe-6c764818991a'::uuid,
       'official_catalog_pdf',
       'https://www.tamiyausa.com/media/files/map-price-list-july-752-c17c.pdf',
       array['itemNumber'],
       '2026-10-01',
       'Recent Tamiya USA MAP list still includes ITEM 18615. This is current catalog/price-list evidence, not sufficient by itself to override the conservative discontinued status from the Tamiya USA product page.'
where not exists (
  select 1 from public.release_sources
  where release_id='6a14c7a3-bd78-57b3-89fe-6c764818991a'::uuid
    and source_url='https://www.tamiyausa.com/media/files/map-price-list-july-752-c17c.pdf'
);

-- ---------------------------------------------------------------------------
-- 2. Market challenge notes for non-ITEM event Releases / SOLD research.
-- ---------------------------------------------------------------------------

update public.product_releases
set updated_at=now(),
    notes=concat_ws(' ',nullif(notes,''),
      'Market challenge 2026-10-01: no exact current Europe-comparable new-complete ASK or sufficiently attributable recent SOLD was found under a safe autonomous identifier. Keep public market signal empty/in observation until exact evidence appears.')
where id in (
  'd0c9c45e-3d75-52d1-92cb-84cf9f5f2a07'::uuid,
  '9a231f02-7a7e-5489-b44d-b4eb10b60a78'::uuid,
  'd6617c26-9ec3-5adf-892f-ebeb1c782b70'::uuid
)
and coalesce(notes,'') not like '%Market challenge 2026-10-01:%';

update public.product_releases
set updated_at=now(),
    notes=concat_ws(' ',nullif(notes,''),
      'Market challenge 2026-10-01: current eBay listings with quantity-sold counters were observed during manual research, but no completed-event date/price pair was sufficiently attributable to create new granular SOLD evidence. Sell-through context is not promoted into a valuation point.')
where id='b2805fb7-cdd3-5dbf-a724-f73d54702844'::uuid
  and coalesce(notes,'') not like '%quantity-sold counters%';

-- ---------------------------------------------------------------------------
-- 3. Current-method queue refresh.
-- ---------------------------------------------------------------------------

select public.trackdash_enroll_release_market_scans(r.id)
from public.product_releases r
where r.product_id='277030d7-5caa-517a-b3d1-bd52d9c48815'::uuid;

select public.trackdash_enqueue_market_recompute(r.id,'new_complete_unbuilt')
from public.product_releases r
where r.product_id='277030d7-5caa-517a-b3d1-bd52d9c48815'::uuid;

update public.market_recompute_queue q
set dirty_at='2000-01-07 00:00:00+00',
    available_at='2000-01-07 00:00:00+00',
    locked_until=null,
    attempts=0,
    last_error=null,
    updated_at=now()
where q.release_id in (
  select id from public.product_releases
  where product_id='277030d7-5caa-517a-b3d1-bd52d9c48815'::uuid
)
and q.condition='new_complete_unbuilt';

-- Seven unique Item Numbers are safe for automatic exact-item eBay attribution.
update public.market_scan_queue q
set enabled=true,
    priority=180,
    next_scan_at='2000-01-07 00:00:00+00',
    locked_until=null,
    consecutive_failures=0,
    last_error=null,
    updated_at=now()
where q.release_id in (
  '6a14c7a3-bd78-57b3-89fe-6c764818991a'::uuid,
  '3eb8e671-b09a-5b2d-bb87-729676bd1237'::uuid,
  'eeb02308-6a9a-5d0c-88ee-5a0fc127a0e8'::uuid,
  'f1372ca5-e4ad-5994-b31b-2ccb9fc99b6f'::uuid,
  'a98fe80b-1f8c-53e1-b26d-404daf93b77d'::uuid,
  'b2805fb7-cdd3-5dbf-a724-f73d54702844'::uuid,
  '4fdb8e31-07be-5907-9530-9a9bbe7edcf2'::uuid
)
and q.source_id=(select id from public.price_sources where slug='ebay_active_public')
and q.scan_scope='active_marketplace';

-- Event-only Releases without autonomous Item Number remain fail-closed.
update public.market_scan_queue q
set enabled=false,
    next_scan_at='2099-01-01 00:00:00+00',
    locked_until=null,
    updated_at=now()
where q.release_id in (
  'd0c9c45e-3d75-52d1-92cb-84cf9f5f2a07'::uuid,
  '9a231f02-7a7e-5489-b44d-b4eb10b60a78'::uuid,
  'd6617c26-9ec3-5adf-892f-ebeb1c782b70'::uuid
)
and q.source_id=(select id from public.price_sources where slug='ebay_active_public')
and q.scan_scope='active_marketplace';

commit;
