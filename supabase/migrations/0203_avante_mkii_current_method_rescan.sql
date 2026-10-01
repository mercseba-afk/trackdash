-- Avante Mk.II current-method re-scan — 2026-10-01
--
-- Existing family genealogy remains canonical at 8 public Releases.
-- This pass revalidates status/current market under the post-Sep30 EU-first
-- engine, preserves persistent collector trends, and adds new exact SOLD
-- evidence discovered during the current audit.

begin;

-- ---------------------------------------------------------------------------
-- 1. Status / identity refresh.
-- ---------------------------------------------------------------------------

update public.product_releases
set production_status='active',
    discontinued=false,
    verification_status='verified',
    status_checked_at=now(),
    updated_at=now(),
    notes=case
      when coalesce(notes,'') like '%TrackDash current-method re-scan 2026-10-01:%' then notes
      else concat_ws(' ',nullif(notes,''),
        'TrackDash current-method re-scan 2026-10-01: canonical 2006 ITEM 18614 base Release remains current-handled in official Tamiya catalog/retail. Multiple JAN aliases are observed across production waves; barcode_jan remains unset rather than arbitrarily choosing one alias. Shared ITEM 18614 with Gamba/Cerezo remains scanner/eBay fail-closed by edition.')
    end
where id='5a123617-c84c-5012-ab20-1a9d493259e0'::uuid;

update public.product_releases
set production_status='discontinued',
    discontinued=true,
    verification_status='verified',
    status_checked_at=now(),
    updated_at=now(),
    notes=case
      when coalesce(notes,'') like '%TrackDash current-method re-scan 2026-10-01:%' then notes
      else concat_ws(' ',nullif(notes,''),
        'TrackDash current-method re-scan 2026-10-01: limited historical V Special remains verified but no evidence supports current manufacturing; normalized to discontinued.')
    end
where id='6c1d4fcf-7265-5a61-9be9-795e27eec353'::uuid;

update public.product_releases
set production_status='discontinued',
    discontinued=true,
    verification_status='verified',
    status_checked_at=now(),
    updated_at=now(),
    notes=case
      when coalesce(notes,'') like '%TrackDash current-method re-scan 2026-10-01:%' then notes
      else concat_ws(' ',nullif(notes,''),
        'TrackDash current-method re-scan 2026-10-01: official Tamiya identifies this as a 2015 limited-sale product; current specialist availability is residual/out-of-stock. Status normalized to discontinued. Existing persistent collector trend remains authoritative and must survive routine recompute.')
    end
where id='c819da54-1ebc-5a8b-a24f-77166cf70e8d'::uuid;

update public.product_releases
set production_status='discontinued',
    discontinued=true,
    verification_status='verified',
    status_checked_at=now(),
    updated_at=now(),
    notes=case
      when coalesce(notes,'') like '%TrackDash current-method re-scan 2026-10-01:%' then notes
      else concat_ws(' ',nullif(notes,''),
        'TrackDash current-method re-scan 2026-10-01: exact ITEM 95525 / JAN 4950344955251 Asia Challenge 2020 Taiwan Final identity remains canonical; current specialist sources are sold out/not available. Status normalized to discontinued. Persistent SOLD-based rising trend remains authoritative until new material directional evidence changes it.')
    end
where id='5489c586-0f2a-5393-9447-dcf36bed8f1a'::uuid;

-- ITEM 18614 production-wave JAN aliases.
insert into public.release_identifiers(
  id,release_id,scheme,value,market,is_primary,verification_status,source_url,checked_at
)
values
(
  gen_random_uuid(),'5a123617-c84c-5012-ab20-1a9d493259e0'::uuid,
  'JAN','4950344064212','JP',false,'verified',
  'https://www.hlj.com/avante-mk-ii-tam18614','2026-10-01'
),
(
  gen_random_uuid(),'5a123617-c84c-5012-ab20-1a9d493259e0'::uuid,
  'JAN','4950344186143','EU',false,'verified',
  'https://www.modellismobaracca.com/auto-mini-4wd/10536-Avante-MK-II.html','2026-10-01'
)
on conflict (release_id,scheme,value,market) do update set
  is_primary=false,
  verification_status='verified',
  source_url=excluded.source_url,
  checked_at=excluded.checked_at;

insert into public.release_sources(
  id,release_id,source_type,source_url,verified_fields,checked_at,notes
)
select gen_random_uuid(),
       '5a123617-c84c-5012-ab20-1a9d493259e0'::uuid,
       'trusted_secondary',
       'https://www.hlj.com/avante-mk-ii-tam18614',
       array['itemNumber','barcodeJAN','editionName','chassis','productionWave'],
       '2026-10-01',
       'Exact HLJ TAM18614 page maps JAN 4950344064212 to Avante Mk.II. Stored as a verified non-primary production-wave identifier because another exact retail JAN exists for the same ITEM.'
where not exists (
  select 1 from public.release_sources
  where release_id='5a123617-c84c-5012-ab20-1a9d493259e0'::uuid
    and source_url='https://www.hlj.com/avante-mk-ii-tam18614'
);

insert into public.release_sources(
  id,release_id,source_type,source_url,verified_fields,checked_at,notes
)
select gen_random_uuid(),
       '5a123617-c84c-5012-ab20-1a9d493259e0'::uuid,
       'trusted_secondary',
       'https://www.modellismobaracca.com/auto-mini-4wd/10536-Avante-MK-II.html',
       array['itemNumber','barcodeJAN','editionName','marketAvailability'],
       '2026-10-01',
       'Exact current Italian retailer ITEM 18614 page reports EAN/JAN 4950344186143. Stored as a verified non-primary alias; no barcode_jan is promoted while multiple wave aliases remain valid.'
where not exists (
  select 1 from public.release_sources
  where release_id='5a123617-c84c-5012-ab20-1a9d493259e0'::uuid
    and source_url='https://www.modellismobaracca.com/auto-mini-4wd/10536-Avante-MK-II.html'
);

-- ---------------------------------------------------------------------------
-- 2. New exact granular SOLD evidence.
-- ---------------------------------------------------------------------------

insert into public.market_candidates(
  id,source_id,source_record_key,original_source,original_record_id,listing_url,title_raw,item_number_observed,
  possible_release_ids,resolved_release_id,price,currency,shipping_cost,shipping_basis,observation_type,
  condition_raw,condition,inner_bags_sealed,box_condition,is_complete,is_lot,quantity,match_confidence,
  match_evidence,evidence_group_key,sold_on,observed_at,decision,reason_codes,review_notes,needs_revalidation,
  raw_payload,first_observed_at,last_observed_at
)
values
(
  gen_random_uuid(),
  (select id from public.price_sources where slug='yahoo_auctions_jp_closed'),
  'yahoo-auctions:avante-mkii-18614:2026-06-17:1000',
  'YAHOO_AUCTIONS_JP',null,
  'https://auctions.yahoo.co.jp/closedsearch/closedsearch/%E3%83%9F%E3%83%8B%E5%9B%9B%E9%A7%86%20%E3%82%A2%E3%83%90%E3%83%B3%E3%83%86/0',
  '【タミヤ ミニ四駆PRO】No.14 アバンテ mk.II【店頭在庫・未開封】',
  '18614',
  array['5a123617-c84c-5012-ab20-1a9d493259e0'::uuid],
  '5a123617-c84c-5012-ab20-1a9d493259e0'::uuid,
  1000,'JPY',null,'unknown','auction_awarded',
  '店頭在庫・未開封','new_complete_unbuilt','unknown','unknown',true,false,1,'exact',
  array['item_number_exact','edition_name_exact','base_edition_match','manual_override'],
  'yahoo-auctions:avante-mkii-18614:2026-06-17:1000',
  date '2026-06-17',now(),'accepted',array[]::text[],
  'Exact base ITEM 18614 Avante Mk.II completed Yahoo sale; unopened shop stock. J.League editions are excluded by title/edition identity. Shipping unknown; raw SOLD price is valuation evidence, not Europe-first ASK.',
  false,
  jsonb_build_object('adapter','manual-sold-audit-v1','market_region','japan','sale_date','2026-06-17'),
  now(),now()
),
(
  gen_random_uuid(),
  (select id from public.price_sources where slug='yahoo_auctions_jp_closed'),
  'yahoo-auctions:avante-mkii-94716:2026-05-23:8600',
  'YAHOO_AUCTIONS_JP',null,
  'https://auctions.yahoo.co.jp/closedsearch/closedsearch/%E3%83%9F%E3%83%8B%E5%9B%9B%E9%A7%86%20%E3%82%A2%E3%83%90%E3%83%B3%E3%83%86%20%E9%99%90%E5%AE%9A/0',
  'TAMIYA ミニ四駆 アバンテmk2 Vスペシャル 限定版 94716',
  '94716',
  array['6c1d4fcf-7265-5a61-9be9-795e27eec353'::uuid],
  '6c1d4fcf-7265-5a61-9be9-795e27eec353'::uuid,
  8600,'JPY',null,'unknown','marketplace_sold',
  '未使用','new_complete_unbuilt','unknown','unknown',true,false,1,'exact',
  array['item_number_exact','edition_name_exact','variant_exact','manual_override'],
  'yahoo-auctions:avante-mkii-94716:2026-05-23:8600',
  date '2026-05-23',now(),'accepted',array[]::text[],
  'Exact ITEM 94716 V Special completed Yahoo-market sale; unused. Sale occurred Saturday, so historical normalization uses the previous ECB business-day rate from 2026-05-22. Shipping unknown.',
  false,
  jsonb_build_object('adapter','manual-sold-audit-v1','market_region','japan','sale_date','2026-05-23'),
  now(),now()
)
on conflict (source_id,source_record_key) do update set
  listing_url=excluded.listing_url,
  title_raw=excluded.title_raw,
  item_number_observed=excluded.item_number_observed,
  possible_release_ids=excluded.possible_release_ids,
  resolved_release_id=excluded.resolved_release_id,
  price=excluded.price,
  currency=excluded.currency,
  shipping_cost=excluded.shipping_cost,
  shipping_basis=excluded.shipping_basis,
  observation_type=excluded.observation_type,
  condition_raw=excluded.condition_raw,
  condition=excluded.condition,
  inner_bags_sealed=excluded.inner_bags_sealed,
  box_condition=excluded.box_condition,
  is_complete=excluded.is_complete,
  is_lot=excluded.is_lot,
  quantity=excluded.quantity,
  match_confidence=excluded.match_confidence,
  match_evidence=excluded.match_evidence,
  evidence_group_key=excluded.evidence_group_key,
  sold_on=excluded.sold_on,
  observed_at=excluded.observed_at,
  decision=excluded.decision,
  reason_codes=excluded.reason_codes,
  review_notes=excluded.review_notes,
  needs_revalidation=false,
  raw_payload=excluded.raw_payload,
  last_observed_at=excluded.last_observed_at,
  updated_at=now();

with sold_fx(source_record_key,fx_rate_to_eur,fx_rate_date) as (
  values
    ('yahoo-auctions:avante-mkii-18614:2026-06-17:1000'::text,0.00538155::numeric,date '2026-06-17'),
    ('yahoo-auctions:avante-mkii-94716:2026-05-23:8600'::text,0.005419173034194982::numeric,date '2026-05-22')
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
  gen_random_uuid(),c.id,c.resolved_release_id,c.source_id,c.observation_type,'new_complete_unbuilt',
  c.price,c.currency,null,'unknown',null,null,
  f.fx_rate_to_eur,f.fx_rate_date,c.inner_bags_sealed,c.box_condition,true,false,
  1,c.match_confidence,c.match_evidence,c.evidence_group_key,true,
  'active',false,null,c.sold_on,c.observed_at,'indicative',
  array['shipping_unknown','box_condition_unknown','seller_unknown'],
  round(c.price * f.fx_rate_to_eur,2),'raw_sale'
from sold_fx f
join public.market_candidates c
  on c.source_id=(select id from public.price_sources where slug='yahoo_auctions_jp_closed')
 and c.source_record_key=f.source_record_key
where c.decision='accepted'
on conflict (candidate_id) do update set
  release_id=excluded.release_id,
  source_id=excluded.source_id,
  observation_type=excluded.observation_type,
  condition=excluded.condition,
  price=excluded.price,
  currency=excluded.currency,
  shipping_cost=excluded.shipping_cost,
  shipping_basis=excluded.shipping_basis,
  fx_rate_to_eur=excluded.fx_rate_to_eur,
  fx_rate_date=excluded.fx_rate_date,
  inner_bags_sealed=excluded.inner_bags_sealed,
  box_condition=excluded.box_condition,
  is_complete=excluded.is_complete,
  is_lot=excluded.is_lot,
  quantity=excluded.quantity,
  match_confidence=excluded.match_confidence,
  match_evidence=excluded.match_evidence,
  evidence_group_key=excluded.evidence_group_key,
  valuation_eligible=true,
  status='active',
  needs_revalidation=false,
  sold_on=excluded.sold_on,
  observed_at=excluded.observed_at,
  evidence_grade=excluded.evidence_grade,
  quality_flags=excluded.quality_flags,
  market_price_eur=excluded.market_price_eur,
  market_price_basis=excluded.market_price_basis,
  updated_at=now();

-- Explicit audit notes for evidence that must NOT become a single-release price.
update public.product_releases
set notes=concat_ws(' ',nullif(notes,''),
  'Market challenge 2026-10-01: a 2026 Yahoo observation containing two Pink Special kits is a lot and is excluded from single-Release valuation.'),
  updated_at=now()
where id='c819da54-1ebc-5a8b-a24f-77166cf70e8d'::uuid;

update public.product_releases
set notes=concat_ws(' ',nullif(notes,''),
  'Market challenge 2026-10-01: observed J.League multi-model set sales are lots and are excluded from single-Release valuation; shared ITEM 18614 remains fail-closed.'),
  updated_at=now()
where id in (
  'e0081f9e-e423-5f90-a30f-968978b36ed0'::uuid,
  '1bd70c72-417e-5e20-a7e1-0247e38dc608'::uuid
);

-- ---------------------------------------------------------------------------
-- 3. Queue current-method refresh.
-- ---------------------------------------------------------------------------

select public.trackdash_enroll_release_market_scans(r.id)
from public.product_releases r
where r.product_id='6dcb6511-5277-561f-a880-95ef828ce44f'::uuid;

select public.trackdash_enqueue_market_recompute(r.id,'new_complete_unbuilt')
from public.product_releases r
where r.product_id='6dcb6511-5277-561f-a880-95ef828ce44f'::uuid;

update public.market_recompute_queue q
set dirty_at='2000-01-06 00:00:00+00',
    available_at='2000-01-06 00:00:00+00',
    locked_until=null,
    attempts=0,
    last_error=null,
    updated_at=now()
where q.release_id in (
  select id from public.product_releases
  where product_id='6dcb6511-5277-561f-a880-95ef828ce44f'::uuid
)
and q.condition='new_complete_unbuilt';

-- Only unique ITEM-number Releases are safe for automatic eBay keyword scans.
update public.market_scan_queue q
set enabled=true,
    priority=180,
    next_scan_at='2000-01-06 00:00:00+00',
    locked_until=null,
    consecutive_failures=0,
    last_error=null,
    updated_at=now()
where q.release_id in (
  '6d4a4979-c006-5d28-a26c-448fa19d1dcf'::uuid,
  'e7f6a362-9bac-53aa-8673-2fa308c50a17'::uuid,
  '6c1d4fcf-7265-5a61-9be9-795e27eec353'::uuid,
  'c819da54-1ebc-5a8b-a24f-77166cf70e8d'::uuid,
  '5489c586-0f2a-5393-9447-dcf36bed8f1a'::uuid
)
and q.source_id=(select id from public.price_sources where slug='ebay_active_public')
and q.scan_scope='active_marketplace';

-- Shared ITEM 18614 Release jobs remain parked/fail-closed.
update public.market_scan_queue q
set enabled=false,
    next_scan_at='2099-01-01 00:00:00+00',
    locked_until=null,
    updated_at=now()
where q.release_id in (
  '5a123617-c84c-5012-ab20-1a9d493259e0'::uuid,
  'e0081f9e-e423-5f90-a30f-968978b36ed0'::uuid,
  '1bd70c72-417e-5e20-a7e1-0247e38dc608'::uuid
)
and q.source_id=(select id from public.price_sources where slug='ebay_active_public')
and q.scan_scope='active_marketplace';

commit;
