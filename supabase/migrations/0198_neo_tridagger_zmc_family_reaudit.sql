-- Neo-Tridagger ZMC family re-audit — 2026-09-30
--
-- Re-audit under current TrackDash Master / Market Method v4.
-- Canonical genealogy remains 7 public collector Releases.
--
-- Corrections:
-- - ITEM 19409 JAN is now verified as 4950344194094;
-- - ITEM 94647 exact debut day is normalized to February 2008 because reliable
--   secondary sources disagree on 23 vs 25 February;
-- - Suruga 2012-01-13 is retained as a later production/reissue wave of the
--   same ITEM 94647 / JAN identity, not a second collector Release;
-- - 2014 Next assortment barcode stays fail-closed between color variants;
-- - ITEM 95508 remains one 2019 collector Release with a documented 2023 wave;
-- - all seven Releases are re-enqueued because the shared EU-first market
--   engine changed after their previous canonical signals were computed.

begin;

-- ---------------------------------------------------------------------------
-- 1. ITEM 19409 — exact JAN + current identity/status refresh.
-- ---------------------------------------------------------------------------

update public.product_releases
set barcode_jan='4950344194094',
    verification_status='verified',
    production_status='active',
    discontinued=false,
    status_checked_at=now(),
    updated_at=now(),
    notes=case
      when coalesce(notes,'') like '%TrackDash re-audit 2026-09-30:%' then notes
      else concat_ws(' ',nullif(notes,''),
        'TrackDash re-audit 2026-09-30: canonical ITEM 19409 identity reconfirmed. JAN 4950344194094 is now verified by multiple exact specialist/current marketplace records and is promoted to the Release barcode. Tamiya Japan still lists ITEM 19409 in the current Fully Cowled catalog and Tamiya Tokyo handling, so status remains active/current-handled; this does not claim uninterrupted factory production since 1996.')
    end
where id='fcaf3f82-93b5-5a52-8087-c96e771a030c'::uuid;

insert into public.release_identifiers(
  id,release_id,scheme,value,market,is_primary,verification_status,source_url,checked_at
)
values(
  gen_random_uuid(),
  'fcaf3f82-93b5-5a52-8087-c96e771a030c'::uuid,
  'JAN','4950344194094','JP',true,'verified',
  'https://www.mini4wdstore.it/tamiya-19409-mini-4wd-neo-tridagger-zmc',
  '2026-09-30'
)
on conflict (release_id,scheme,value,market) do update set
  is_primary=true,
  verification_status='verified',
  source_url=excluded.source_url,
  checked_at=excluded.checked_at;

insert into public.release_sources(
  id,release_id,source_type,source_url,verified_fields,checked_at,notes
)
select
  gen_random_uuid(),
  'fcaf3f82-93b5-5a52-8087-c96e771a030c'::uuid,
  'trusted_secondary',
  'https://www.mini4wdstore.it/tamiya-19409-mini-4wd-neo-tridagger-zmc',
  array['itemNumber','barcodeJAN','editionName','chassis'],
  '2026-09-30',
  'Exact specialist product page maps Tamiya ITEM 19409 to EAN/JAN 4950344194094 and Super-1 Neo-Tridagger ZMC identity.'
where not exists (
  select 1 from public.release_sources
  where release_id='fcaf3f82-93b5-5a52-8087-c96e771a030c'::uuid
    and source_url='https://www.mini4wdstore.it/tamiya-19409-mini-4wd-neo-tridagger-zmc'
);

update public.release_sources
set checked_at='2026-09-30',
    verified_fields=(
      select array_agg(distinct x order by x)
      from unnest(verified_fields || array['marketAvailability']::text[]) x
    ),
    notes=concat_ws(' ',nullif(notes,''),
      'Rechecked 2026-09-30: official Tamiya Japan still lists ITEM 19409 in the current Super-1/Fully Cowled catalog and reports Tamiya Tokyo handling. TrackDash treats this as current-handled/active catalog status, not proof of uninterrupted manufacturing.')
where release_id='fcaf3f82-93b5-5a52-8087-c96e771a030c'::uuid
  and source_url='https://www.tamiya.com/japan/products/19409/index.html';

-- ---------------------------------------------------------------------------
-- 2. ITEM 94647 — debut-date normalization + 2012 production wave.
-- ---------------------------------------------------------------------------

update public.product_releases
set release_date=null,
    verification_status='verified',
    production_status='discontinued',
    discontinued=true,
    status_checked_at=now(),
    updated_at=now(),
    notes=case
      when coalesce(notes,'') like '%TrackDash re-audit 2026-09-30:%' then notes
      else concat_ws(' ',nullif(notes,''),
        'TrackDash re-audit 2026-09-30: ITEM 94647 / JAN 4950344946471 remains one Special Kit collector Release. Contemporary Tamiya material establishes February 2008; reliable secondary sources disagree on the exact debut day (around 2008-02-23 vs 2008-02-25), therefore release_date is intentionally unset rather than invented. Suruga records 2012-01-13 for a later occurrence of the same ITEM/spec; this is retained as a production/reissue wave, not a second Release. HLJ marks the kit discontinued.')
    end
where id='745ce3cb-0738-5fb8-bb1e-3d96ab1ca24a'::uuid;

insert into public.release_identifiers(
  id,release_id,scheme,value,market,is_primary,verification_status,source_url,checked_at
)
values(
  gen_random_uuid(),
  '745ce3cb-0738-5fb8-bb1e-3d96ab1ca24a'::uuid,
  'JAN','4950344946471','JP',true,'verified',
  'https://www.hlj.com/neo-tridagger-zmc-special-kit-w-tridagger-x-body-tam94647',
  '2026-09-30'
)
on conflict (release_id,scheme,value,market) do update set
  is_primary=true,
  verification_status='verified',
  source_url=excluded.source_url,
  checked_at=excluded.checked_at;

insert into public.release_sources(
  id,release_id,source_type,source_url,verified_fields,checked_at,notes
)
select gen_random_uuid(),
       '745ce3cb-0738-5fb8-bb1e-3d96ab1ca24a'::uuid,
       'trusted_secondary',
       'https://www.hlj.com/neo-tridagger-zmc-special-kit-w-tridagger-x-body-tam94647',
       array['itemNumber','barcodeJAN','editionName','releaseMonth','productionStatus'],
       '2026-09-30',
       'Exact HLJ page: TAM94647 / JAN 4950344946471, February 2008 release metadata and discontinued status. HLJ gives 2008-02-25; TrackDash does not promote that exact day because other contemporary/archive evidence places the release around 2008-02-23.'
where not exists (
  select 1 from public.release_sources
  where release_id='745ce3cb-0738-5fb8-bb1e-3d96ab1ca24a'::uuid
    and source_url='https://www.hlj.com/neo-tridagger-zmc-special-kit-w-tridagger-x-body-tam94647'
);

insert into public.release_sources(
  id,release_id,source_type,source_url,verified_fields,checked_at,notes
)
select gen_random_uuid(),
       '745ce3cb-0738-5fb8-bb1e-3d96ab1ca24a'::uuid,
       'trusted_secondary',
       'https://www.suruga-ya.jp/product/detail/603015451',
       array['itemNumber','editionName','productionWave'],
       '2026-09-30',
       'Exact Suruga ITEM 94647 page records 2012-01-13. Because ITEM/JAN/specification remain the same and no physical collector discriminator is verified, TrackDash stores this as a later production/reissue wave of the canonical 2008 Release.'
where not exists (
  select 1 from public.release_sources
  where release_id='745ce3cb-0738-5fb8-bb1e-3d96ab1ca24a'::uuid
    and source_url='https://www.suruga-ya.jp/product/detail/603015451'
);

-- ---------------------------------------------------------------------------
-- 3. 2014 Next prize variants — identity/status/shared assortment safety.
-- ---------------------------------------------------------------------------

update public.product_releases
set verification_status='verified',
    production_status='discontinued',
    discontinued=true,
    status_checked_at=now(),
    updated_at=now(),
    notes=case
      when coalesce(notes,'') like '%TrackDash re-audit 2026-09-30:%' then notes
      else concat_ws(' ',nullif(notes,''),
        'TrackDash re-audit 2026-09-30: four-color 2014 Tamiya/SK Japan amusement-prize genealogy reconfirmed. JAN 4519869409009 is observed on more than one color (including 92277 Navy and 92279 White), so barcode_jan remains null and scanner attribution stays fail-closed by color/ITEM. Empty Market Challenge found Japan-market used/sold-out/current context but no qualifying Europe-comparable new-complete acquisition price; no public ASK is forced.')
    end
where product_id='9793fbe8-dcf7-51c9-9f45-185194a0bc92'::uuid
  and item_number in ('92277','92278','92279','92280');

-- Explicitly preserve null release-specific barcodes for the shared assortment.
update public.product_releases
set barcode_jan=null,
    updated_at=now()
where product_id='9793fbe8-dcf7-51c9-9f45-185194a0bc92'::uuid
  and item_number in ('92277','92278','92279','92280');

-- ---------------------------------------------------------------------------
-- 4. ITEM 95508 — retain one 2019 identity + 2023 wave, conservative status.
-- ---------------------------------------------------------------------------

update public.product_releases
set verification_status='verified',
    production_status='discontinued',
    discontinued=true,
    status_checked_at=now(),
    updated_at=now(),
    notes=case
      when coalesce(notes,'') like '%TrackDash re-audit 2026-09-30:%' then notes
      else concat_ws(' ',nullif(notes,''),
        'TrackDash re-audit 2026-09-30: canonical ITEM 95508 / JAN 4950344955084 remains one collector Release. Official Tamiya Japan confirms initial release month August 2019 and a later specified on-sale date 2023-08-12 under the same identity; no physical discriminator supports a split. Tamiya USA explicitly marks ITEM 95508 discontinued, so TrackDash keeps discontinued status despite current Japanese catalog/Tamiya Tokyo handling.')
    end
where id='73dcd8e6-82ab-54c4-961b-f4132bf6d638'::uuid;

insert into public.release_identifiers(
  id,release_id,scheme,value,market,is_primary,verification_status,source_url,checked_at
)
values(
  gen_random_uuid(),
  '73dcd8e6-82ab-54c4-961b-f4132bf6d638'::uuid,
  'JAN','4950344955084','JP',true,'verified',
  'https://www.hlj.com/neo-tridagger-zmc-carbon-special-super-ii-chassis-tam95508',
  '2026-09-30'
)
on conflict (release_id,scheme,value,market) do update set
  is_primary=true,
  verification_status='verified',
  source_url=excluded.source_url,
  checked_at=excluded.checked_at;

update public.release_sources
set checked_at='2026-09-30',
    notes=concat_ws(' ',nullif(notes,''),
      'Rechecked 2026-09-30: official Japan page still preserves the 2023-08-12 on-sale wave and Tamiya Tokyo handling; this does not override Tamiya USA discontinued status or create a second Release.')
where release_id='73dcd8e6-82ab-54c4-961b-f4132bf6d638'::uuid
  and source_url='https://www.tamiya.com/japan/products/95508/index.html';

update public.release_sources
set checked_at='2026-09-30',
    notes=concat_ws(' ',nullif(notes,''),
      'Rechecked 2026-09-30: Tamiya USA continues to mark ITEM 95508 discontinued.')
where release_id='73dcd8e6-82ab-54c4-961b-f4132bf6d638'::uuid
  and source_url='https://www.tamiyausa.com/shop/132-super/jr-neo-tridagger-zmc-carbon-sp/';

-- ---------------------------------------------------------------------------
-- 5. Re-audit market challenge note for the empty releases.
-- ---------------------------------------------------------------------------

update public.product_releases
set notes=concat_ws(' ',nullif(notes,''),
      'Market challenge 2026-09-30: no qualifying current Europe-comparable new-complete ASK was found. Exact/current evidence found is extra-EU, used, sold-out, condition-unresolved or historical and remains context only.'),
    updated_at=now()
where product_id='9793fbe8-dcf7-51c9-9f45-185194a0bc92'::uuid
  and item_number in ('94647','92277','92278','92279');

-- 92280 already has a recent exact SOLD; the same current-price challenge still
-- yields no qualifying Europe-comparable ASK.
update public.product_releases
set notes=concat_ws(' ',nullif(notes,''),
      'Market challenge 2026-09-30: recent exact SOLD remains valid; current Japan-market observations do not provide a qualifying Europe-comparable new-complete acquisition price, so no ASK is forced.'),
    updated_at=now()
where id='19b89e91-ffe5-59d6-b213-dae1cdccfa9d'::uuid;

-- ---------------------------------------------------------------------------
-- 6. Queue refresh after the current shared-engine changes.
-- ---------------------------------------------------------------------------

select public.trackdash_enroll_release_market_scans(r.id)
from public.product_releases r
where r.product_id='9793fbe8-dcf7-51c9-9f45-185194a0bc92'::uuid;

select public.trackdash_enqueue_market_recompute(r.id,'new_complete_unbuilt')
from public.product_releases r
where r.product_id='9793fbe8-dcf7-51c9-9f45-185194a0bc92'::uuid;

-- Recompute all seven under the current deployed EU-first engine.
update public.market_recompute_queue q
set dirty_at='2000-01-02 00:00:00+00',
    available_at='2000-01-02 00:00:00+00',
    locked_until=null,
    attempts=0,
    last_error=null,
    updated_at=now()
where q.release_id in (
  select id from public.product_releases
  where product_id='9793fbe8-dcf7-51c9-9f45-185194a0bc92'::uuid
)
and q.condition='new_complete_unbuilt';

-- All seven canonical Releases have unique item numbers, so refreshed exact
-- eBay Active discovery is safe. Put only this family's jobs ahead of unrelated
-- due work; no other queue rows are modified.
update public.market_scan_queue q
set enabled=true,
    priority=180,
    next_scan_at='2000-01-02 00:00:00+00',
    locked_until=null,
    consecutive_failures=0,
    last_error=null,
    updated_at=now()
where q.release_id in (
  select id from public.product_releases
  where product_id='9793fbe8-dcf7-51c9-9f45-185194a0bc92'::uuid
)
and q.source_id=(select id from public.price_sources where slug='ebay_active_public')
and q.scan_scope='active_marketplace';

commit;
