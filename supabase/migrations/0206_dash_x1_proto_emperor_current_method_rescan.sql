-- DASH-X1 Proto-Emperor current-method re-scan — 2026-10-01
--
-- Existing genealogy remains canonical at 4 public Releases.
-- This pass refreshes exact/current source evidence, documents the unresolved
-- 94708 image gap, preserves shared-ITEM 18074 fail-closed behavior, and
-- stages current-basis market recompute/eBay refresh under Market Method v4.

begin;

-- ---------------------------------------------------------------------------
-- 1. Current exact source refresh.
-- ---------------------------------------------------------------------------

insert into public.release_sources(
  id,release_id,source_type,source_url,verified_fields,checked_at,notes
)
select gen_random_uuid(),r.id,'trusted_secondary',
       'https://hs-tamtam.co.jp/product/detail/36064/',
       array['itemNumber','barcodeJAN','editionName','chassis','imageIdentity']::text[],
       '2026-10-01',
       'Exact HSTamTam product page corroborates ITEM 94708, JAN 4950344947089, VS chassis and exact product imagery. The page is out of stock; no stable direct hero asset is persisted from it.'
from public.product_releases r
join public.products p on p.id=r.product_id
where p.slug='dash-x1-proto-emperor-dash-x1-proto-emperor'
  and r.item_number='94708'
  and not exists (
    select 1 from public.release_sources s
    where s.release_id=r.id
      and s.source_url='https://hs-tamtam.co.jp/product/detail/36064/'
  );

update public.release_sources s
set checked_at='2026-10-01'
where s.release_id in (
  select r.id
  from public.product_releases r
  join public.products p on p.id=r.product_id
  where p.slug='dash-x1-proto-emperor-dash-x1-proto-emperor'
)
and s.source_url in (
  'https://www.rcjaz.com/tamiya-94708-132-jr-dashx1-proto-emperor-vs-chassis-model-kit-p-90014148.html',
  'https://www.tamiya.com/japan/products/18074/index.html',
  'https://www.tamiyausa.com/media/files/map-feb-2026-1239-08db.pdf',
  'https://www.tamiya.com/japan/products/95450/index.html',
  'https://www.rcjaz.co.uk/protoemperor-premium-black-special-by-tamiya-95450-superii-chassis-mini-4wd-kit-p-12543.html',
  'https://www.sanfrecce.co.jp/news/goods/8780'
);

-- ---------------------------------------------------------------------------
-- 2. Status / image / identity audit notes.
-- ---------------------------------------------------------------------------

update public.product_releases r
set status_checked_at=now(),
    updated_at=now()
from public.products p
where p.id=r.product_id
  and p.slug='dash-x1-proto-emperor-dash-x1-proto-emperor';

update public.product_releases r
set notes=case
  when coalesce(r.notes,'') like '%Image challenge 2026-10-01:%' then r.notes
  else concat_ws(' ',nullif(r.notes,''),
    'Image challenge 2026-10-01: exact ITEM 94708 imagery is visible on current exact-product retailer/marketplace pages (including HSTamTam, RCJAZ and eBay), but no stable directly attributable asset URL has been established for release_images. Keep the honest placeholder rather than storing a webpage URL or borrowing the 18074/95450 body image.')
  end,
  updated_at=now()
from public.products p
where p.id=r.product_id
  and p.slug='dash-x1-proto-emperor-dash-x1-proto-emperor'
  and r.item_number='94708';

update public.product_releases r
set notes=case
  when coalesce(r.notes,'') like '%TrackDash current-method re-scan 2026-10-01: shared ITEM 18074%' then r.notes
  else concat_ws(' ',nullif(r.notes,''),
    'TrackDash current-method re-scan 2026-10-01: shared ITEM 18074 remains fail-closed for unattended eBay attribution because both the standard Premium and the Sanfrecce Hiroshima collector edition use the same base-kit Item Number. Standard 18074 retains its exact multi-seller SOLD evidence and current official/retail identity evidence; extra-EU item-only retail with unknown European landed cost remains contextual.')
  end,
  updated_at=now()
from public.products p
where p.id=r.product_id
  and p.slug='dash-x1-proto-emperor-dash-x1-proto-emperor'
  and r.item_number='18074'
  and r.edition_name='Dash-X1 Proto-Emperor Premium';

update public.product_releases r
set notes=case
  when coalesce(r.notes,'') like '%TrackDash current-method re-scan 2026-10-01: legacy ASK +327.94%' then r.notes
  else concat_ws(' ',nullif(r.notes,''),
    'TrackDash current-method re-scan 2026-10-01: legacy ASK +327.94% is pre-EU-first and must be rebuilt under v4-eu-delivered-2026-10. Preserve the exact SOLD anchor while keeping Market Value gated by seller concentration: the latest audited annual SOLD window has 7 units but only 1 seller.')
  end,
  updated_at=now()
from public.products p
where p.id=r.product_id
  and p.slug='dash-x1-proto-emperor-dash-x1-proto-emperor'
  and r.item_number='95450';

update public.product_releases r
set notes=case
  when coalesce(r.notes,'') like '%TrackDash current-method re-scan 2026-10-01: Sanfrecce%' then r.notes
  else concat_ws(' ',nullif(r.notes,''),
    'TrackDash current-method re-scan 2026-10-01: Sanfrecce Hiroshima remains a distinct collector edition with official 2023-07-08 sale evidence, but no autonomous Tamiya Item Number. Its shared base ITEM 18074 therefore remains disabled for unattended eBay attribution; exact edition-specific SOLD evidence is retained separately.')
  end,
  updated_at=now()
from public.products p
where p.id=r.product_id
  and p.slug='dash-x1-proto-emperor-dash-x1-proto-emperor'
  and r.item_number='18074'
  and r.edition_name like '%Sanfrecce Hiroshima%';

-- ---------------------------------------------------------------------------
-- 3. Current-method queue refresh.
-- ---------------------------------------------------------------------------

select public.trackdash_enroll_release_market_scans(r.id)
from public.product_releases r
join public.products p on p.id=r.product_id
where p.slug='dash-x1-proto-emperor-dash-x1-proto-emperor';

select public.trackdash_enqueue_market_recompute(r.id,'new_complete_unbuilt')
from public.product_releases r
join public.products p on p.id=r.product_id
where p.slug='dash-x1-proto-emperor-dash-x1-proto-emperor';

update public.market_recompute_queue q
set dirty_at='2000-01-09 00:00:00+00',
    available_at='2000-01-09 00:00:00+00',
    locked_until=null,
    attempts=0,
    last_error=null,
    updated_at=now()
where q.release_id in (
  select r.id
  from public.product_releases r
  join public.products p on p.id=r.product_id
  where p.slug='dash-x1-proto-emperor-dash-x1-proto-emperor'
)
and q.condition='new_complete_unbuilt';

-- Only globally unique ITEM identities are safe for unattended eBay Active.
update public.market_scan_queue q
set enabled=true,
    priority=180,
    next_scan_at='2000-01-09 00:00:00+00',
    locked_until=null,
    consecutive_failures=0,
    last_error=null,
    updated_at=now()
where q.release_id in (
  select r.id
  from public.product_releases r
  join public.products p on p.id=r.product_id
  where p.slug='dash-x1-proto-emperor-dash-x1-proto-emperor'
    and r.item_number in ('94708','95450')
)
and q.source_id=(select id from public.price_sources where slug='ebay_active_public')
and q.scan_scope='active_marketplace';

-- Shared ITEM 18074 stays fail-closed for both collector Releases.
update public.market_scan_queue q
set enabled=false,
    next_scan_at='2099-01-01 00:00:00+00',
    locked_until=null,
    consecutive_failures=0,
    last_error=null,
    updated_at=now()
where q.release_id in (
  select r.id
  from public.product_releases r
  join public.products p on p.id=r.product_id
  where p.slug='dash-x1-proto-emperor-dash-x1-proto-emperor'
    and r.item_number='18074'
)
and q.source_id=(select id from public.price_sources where slug='ebay_active_public')
and q.scan_scope='active_marketplace';

commit;
