-- Dyna-Hawk GX family re-audit — 2026-10-01
--
-- Re-audit under current TrackDash Master / Market Method v4.
-- Canonical genealogy remains 4 public collector Releases.
--
-- This pass also creates a clean before/after market checkpoint so the
-- canonical ASK trend can be compared after the refreshed eBay scan.
--
-- Key corrections:
-- - 19201 JAN 4950344192014 verified; 2003 HLJ occurrence retained as a
--   production/reissue wave of the canonical 1998 Release, not a fifth Release;
-- - 94717 JAN 4950344947171 verified;
-- - all four canonical JANs are registered in release_identifiers;
-- - conservative discontinued status is applied to 19201 / 94717;
-- - three exact 95000 Black Special Yahoo closed sales are persisted as
--   granular SOLD evidence with historical ECB FX;
-- - all four eBay Active jobs and recomputes are queued first for a fresh
--   price/trend comparison under the current EU-first engine.

begin;

-- ---------------------------------------------------------------------------
-- 1. Canonical identity / status.
-- ---------------------------------------------------------------------------

update public.product_releases
set barcode_jan='4950344192014',
    production_status='discontinued',
    discontinued=true,
    verification_status='verified',
    status_checked_at=now(),
    updated_at=now(),
    notes=case
      when coalesce(notes,'') like '%TrackDash re-audit 2026-10-01:%' then notes
      else concat_ws(' ',nullif(notes,''),
        'TrackDash re-audit 2026-10-01: canonical ITEM 19201 Original remains the 1998 Super X collector identity. JAN 4950344192014 is verified. HLJ records a 2003-04-22 occurrence under the same ITEM/JAN; without a physical collector discriminator TrackDash treats it as a later production/reissue wave, not a fifth Release. HLJ marks the item discontinued; the surviving Tamiya Japan product page is identity/history evidence, not proof of current manufacturing.')
    end
where id='2af882f6-8c66-5508-9acd-2240aac287ad'::uuid;

update public.product_releases
set barcode_jan='4950344947171',
    production_status='discontinued',
    discontinued=true,
    verification_status='verified',
    status_checked_at=now(),
    updated_at=now(),
    notes=case
      when coalesce(notes,'') like '%TrackDash re-audit 2026-10-01:%' then notes
      else concat_ws(' ',nullif(notes,''),
        'TrackDash re-audit 2026-10-01: ITEM 94717 Super XX Special identity/date remain canonical at 2010-03-13. JAN 4950344947171 is now verified. The 2010 limited-edition kit is retained as discontinued; exact current retail references are out of stock.')
    end
where id='1ede5023-9035-5342-b207-6242c5f5190a'::uuid;

update public.product_releases
set production_status='discontinued',
    discontinued=true,
    verification_status='verified',
    status_checked_at=now(),
    updated_at=now(),
    notes=case
      when coalesce(notes,'') like '%TrackDash re-audit 2026-10-01:%' then notes
      else concat_ws(' ',nullif(notes,''),
        'TrackDash re-audit 2026-10-01: ITEM 95000 Black Special remains the canonical 2013-12-21 Super XX Release, JAN 4950344950003, discontinued. New exact 2026 Yahoo closed-sale evidence is persisted separately through the canonical SOLD evidence model.')
    end
where id='67423b20-d880-5e54-a83f-dc06dcba6f75'::uuid;

update public.product_releases
set production_status='discontinued',
    discontinued=true,
    verification_status='verified',
    status_checked_at=now(),
    updated_at=now(),
    notes=case
      when coalesce(notes,'') like '%TrackDash re-audit 2026-10-01:%' then notes
      else concat_ws(' ',nullif(notes,''),
        'TrackDash re-audit 2026-10-01: ITEM 95467 remains the distinct 2019 Super XX reissue, JAN 4950344954674. Tamiya USA explicitly marks the item discontinued; current residual/secondary availability does not change production status.')
    end
where id='ace0d1b1-aaf3-589a-977c-a3df07c83c73'::uuid;

-- ---------------------------------------------------------------------------
-- 2. Primary JAN identifiers.
-- ---------------------------------------------------------------------------

insert into public.release_identifiers(
  id,release_id,scheme,value,market,is_primary,verification_status,source_url,checked_at
)
values
(
  gen_random_uuid(),'2af882f6-8c66-5508-9acd-2240aac287ad'::uuid,
  'JAN','4950344192014','JP',true,'verified',
  'https://www.hlj.com/dyna-hawk-gx-tam19201','2026-10-01'
),
(
  gen_random_uuid(),'1ede5023-9035-5342-b207-6242c5f5190a'::uuid,
  'JAN','4950344947171','JP',true,'verified',
  'https://hs-tamtam.co.jp/product/detail/36140/','2026-10-01'
),
(
  gen_random_uuid(),'67423b20-d880-5e54-a83f-dc06dcba6f75'::uuid,
  'JAN','4950344950003','JP',true,'verified',
  'https://www.hlj.com/dyna-hawk-gx-black-sp-super-xx-tam95000','2026-10-01'
),
(
  gen_random_uuid(),'ace0d1b1-aaf3-589a-977c-a3df07c83c73'::uuid,
  'JAN','4950344954674','JP',true,'verified',
  'https://www.tamiyausa.com/media/files/map-feb-2026-1239-08db.pdf','2026-10-01'
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
       '2af882f6-8c66-5508-9acd-2240aac287ad'::uuid,
       'trusted_secondary',
       'https://www.hlj.com/dyna-hawk-gx-tam19201',
       array['itemNumber','barcodeJAN','chassis','productionStatus','productionWave'],
       '2026-10-01',
       'Exact HLJ TAM19201 page maps JAN 4950344192014 to Dyna-Hawk GX / Super X, marks the item discontinued and records a 2003-04-22 availability occurrence. TrackDash preserves the canonical 1998 collector Release and treats the 2003 occurrence as a later production/reissue wave.'
where not exists (
  select 1 from public.release_sources
  where release_id='2af882f6-8c66-5508-9acd-2240aac287ad'::uuid
    and source_url='https://www.hlj.com/dyna-hawk-gx-tam19201'
);

insert into public.release_sources(
  id,release_id,source_type,source_url,verified_fields,checked_at,notes
)
select gen_random_uuid(),
       '1ede5023-9035-5342-b207-6242c5f5190a'::uuid,
       'trusted_secondary',
       'https://hs-tamtam.co.jp/product/detail/36140/',
       array['itemNumber','barcodeJAN','editionName','marketAvailability'],
       '2026-10-01',
       'Exact TamTam ITEM 94717 page maps JAN 4950344947171 to Dyna-Hawk GX Super XX Special and is currently out of stock.'
where not exists (
  select 1 from public.release_sources
  where release_id='1ede5023-9035-5342-b207-6242c5f5190a'::uuid
    and source_url='https://hs-tamtam.co.jp/product/detail/36140/'
);

-- ---------------------------------------------------------------------------
-- 3. ITEM 95000 — exact granular 2026 Yahoo SOLD.
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
  'yahoo-auctions:dyna-hawk-95000:2026-03-16:2000',
  'YAHOO_AUCTIONS_JP',null,
  'https://auctions.yahoo.co.jp/closedsearch/closedsearch/special%E3%82%B9%E3%83%9A%E3%82%B7%E3%83%A3%E3%83%AB/2084250966',
  'TAMIYA DYNA-HAWK GX BLACK SPECIAL 95000 新品未使用未開封',
  '95000',
  array['67423b20-d880-5e54-a83f-dc06dcba6f75'::uuid],
  '67423b20-d880-5e54-a83f-dc06dcba6f75'::uuid,
  2000,'JPY',null,'unknown','auction_awarded',
  '新品未使用未開封','new_complete_unbuilt','yes','unknown',true,false,1,'exact',
  array['item_number_exact','edition_name_exact','color_variant_match','manual_override'],
  'yahoo-auctions:dyna-hawk-95000:2026-03-16:2000',
  date '2026-03-16',now(),'accepted',array[]::text[],
  'Exact ITEM 95000 Black Special closed Yahoo auction; new/unused/unopened, 6 bids. Shipping unknown; raw SOLD price remains usable while European ASK/landed-cost logic stays separate.',
  false,
  jsonb_build_object('adapter','manual-sold-audit-v1','market_region','japan','auction_bids',6,'sale_date','2026-03-16'),
  now(),now()
),
(
  gen_random_uuid(),
  (select id from public.price_sources where slug='yahoo_auctions_jp_closed'),
  'yahoo-auctions:dyna-hawk-95000:2026-03-30:3200',
  'YAHOO_AUCTIONS_JP',null,
  'https://auctions.yahoo.co.jp/closedsearch/closedsearch/special%E3%82%B9%E3%83%9A%E3%82%B7%E3%83%A3%E3%83%AB/2084250966',
  'TAMIYA DYNA-HAWK GX BLACK SPECIAL 95000 新品未使用',
  '95000',
  array['67423b20-d880-5e54-a83f-dc06dcba6f75'::uuid],
  '67423b20-d880-5e54-a83f-dc06dcba6f75'::uuid,
  3200,'JPY',null,'unknown','auction_awarded',
  '新品未使用','new_complete_unbuilt','unknown','unknown',true,false,1,'exact',
  array['item_number_exact','edition_name_exact','color_variant_match','manual_override'],
  'yahoo-auctions:dyna-hawk-95000:2026-03-30:3200',
  date '2026-03-30',now(),'accepted',array[]::text[],
  'Exact ITEM 95000 Black Special closed Yahoo auction; new/unused, 18 bids. Shipping unknown; seller identity not exposed by indexed evidence.',
  false,
  jsonb_build_object('adapter','manual-sold-audit-v1','market_region','japan','auction_bids',18,'sale_date','2026-03-30'),
  now(),now()
),
(
  gen_random_uuid(),
  (select id from public.price_sources where slug='yahoo_auctions_jp_closed'),
  'yahoo-auctions:dyna-hawk-95000:2026-06-28:2000',
  'YAHOO_AUCTIONS_JP',null,
  'https://auctions.yahoo.co.jp/closedsearch/closedsearch/%E3%83%9F%E3%83%8B%E5%9B%9B%E9%A7%86%20%E7%B5%B6%E7%89%88/0',
  'TAMIYA ITEM 95000 DYNA-HAWK GX BLACK SPECIAL 未使用',
  '95000',
  array['67423b20-d880-5e54-a83f-dc06dcba6f75'::uuid],
  '67423b20-d880-5e54-a83f-dc06dcba6f75'::uuid,
  2000,'JPY',null,'unknown','auction_awarded',
  '未使用','new_complete_unbuilt','unknown','unknown',true,false,1,'exact',
  array['item_number_exact','edition_name_exact','color_variant_match','manual_override'],
  'yahoo-auctions:dyna-hawk-95000:2026-06-28:2000',
  date '2026-06-28',now(),'accepted',array[]::text[],
  'Exact ITEM 95000 Black Special closed Yahoo auction; unused, 1 bid. Sunday sale uses previous ECB business-day FX (2026-06-26).',
  false,
  jsonb_build_object('adapter','manual-sold-audit-v1','market_region','japan','auction_bids',1,'sale_date','2026-06-28'),
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
    ('yahoo-auctions:dyna-hawk-95000:2026-03-16:2000'::text,0.005474652359575167::numeric,date '2026-03-16'),
    ('yahoo-auctions:dyna-hawk-95000:2026-03-30:3200'::text,0.005460899956312801::numeric,date '2026-03-30'),
    ('yahoo-auctions:dyna-hawk-95000:2026-06-28:2000'::text,0.005425935973955507::numeric,date '2026-06-26')
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
  gen_random_uuid(),c.id,c.resolved_release_id,c.source_id,'auction_awarded','new_complete_unbuilt',
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
  valuation_eligible=excluded.valuation_eligible,
  status=excluded.status,
  needs_revalidation=false,
  sold_on=excluded.sold_on,
  observed_at=excluded.observed_at,
  evidence_grade=excluded.evidence_grade,
  quality_flags=excluded.quality_flags,
  market_price_eur=excluded.market_price_eur,
  market_price_basis=excluded.market_price_basis,
  updated_at=now();

-- ---------------------------------------------------------------------------
-- 4. Re-scan + recompute. Trend is canonical engine output; never manually set.
-- ---------------------------------------------------------------------------

select public.trackdash_enroll_release_market_scans(r.id)
from public.product_releases r
where r.product_id='d3b4ad34-05ac-592e-ad93-fab4cfde0a5a'::uuid;

select public.trackdash_enqueue_market_recompute(r.id,'new_complete_unbuilt')
from public.product_releases r
where r.product_id='d3b4ad34-05ac-592e-ad93-fab4cfde0a5a'::uuid;

update public.market_recompute_queue q
set dirty_at='2000-01-03 00:00:00+00',
    available_at='2000-01-03 00:00:00+00',
    locked_until=null,
    attempts=0,
    last_error=null,
    updated_at=now()
where q.release_id in (
  select id from public.product_releases
  where product_id='d3b4ad34-05ac-592e-ad93-fab4cfde0a5a'::uuid
)
and q.condition='new_complete_unbuilt';

update public.market_scan_queue q
set enabled=true,
    priority=180,
    next_scan_at='2000-01-03 00:00:00+00',
    locked_until=null,
    consecutive_failures=0,
    last_error=null,
    updated_at=now()
where q.release_id in (
  select id from public.product_releases
  where product_id='d3b4ad34-05ac-592e-ad93-fab4cfde0a5a'::uuid
)
and q.source_id=(select id from public.price_sources where slug='ebay_active_public')
and q.scan_scope='active_marketplace';

commit;
