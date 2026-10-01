-- Aero Manta Ray current-method re-scan — 2026-10-01
--
-- Preserve the audited 7-Release genealogy, refresh exact source evidence,
-- document intentional image gaps, and stage all unique ITEMs for current
-- Market Method v4 / EU-first ASK recompute.

begin;

-- Exact source refresh for the three current hero-image gaps.
insert into public.release_sources(
  id,release_id,source_type,source_url,verified_fields,checked_at,notes
)
select gen_random_uuid(),r.id,'trusted_secondary',
       'https://myrcstation.com/products/tamiya-94972-jr-aero-manta-ray-white-special-ar-chassis-94972',
       array['itemNumber','editionName','chassis','color','imageIdentity']::text[],
       '2026-10-01',
       'Exact product page confirms ITEM 94972 White Special / AR chassis and release-specific imagery. No stable direct hero asset URL is persisted from the page.'
from public.product_releases r
join public.products p on p.id=r.product_id
where p.slug='aero-manta-ray-18703' and r.item_number='94972'
and not exists (
  select 1 from public.release_sources s
  where s.release_id=r.id
    and s.source_url='https://myrcstation.com/products/tamiya-94972-jr-aero-manta-ray-white-special-ar-chassis-94972'
);

insert into public.release_sources(
  id,release_id,source_type,source_url,verified_fields,checked_at,notes
)
select gen_random_uuid(),r.id,'trusted_secondary',
       'https://www.1999.co.jp/10243309',
       array['itemNumber','barcodeJAN','editionName','releasePeriod','chassis','imageIdentity']::text[],
       '2026-10-01',
       'Exact Hobby Search page confirms ITEM 94989 / JAN 4950344963195, Black Metallic identity, mid-December 2013 release period and release-specific imagery. Exact day remains intentionally unset.'
from public.product_releases r
join public.products p on p.id=r.product_id
where p.slug='aero-manta-ray-18703' and r.item_number='94989'
and not exists (
  select 1 from public.release_sources s
  where s.release_id=r.id and s.source_url='https://www.1999.co.jp/10243309'
);

update public.release_sources s
set checked_at='2026-10-01',
    verified_fields=case
      when s.source_url='https://www.suruga-ya.jp/kaitori/kaitori_detail/603046289'
      then array['barcodeJAN','itemNumber','editionName','imageIdentity']::text[]
      else s.verified_fields
    end,
    notes=case
      when s.source_url='https://www.suruga-ya.jp/kaitori/kaitori_detail/603046289'
      then 'Exact Suruga-ya page confirms ITEM 94991 / JAN 4950344963218, Gold Metallic identity and release-specific imagery. Exact release day remains intentionally unset because stronger day-level evidence is not available.'
      else s.notes
    end
where s.release_id in (
  select r.id from public.product_releases r join public.products p on p.id=r.product_id
  where p.slug='aero-manta-ray-18703'
)
and s.source_url in (
  'https://www.tamiya.com/japan/products/18703/index.html',
  'https://store.shopping.yahoo.co.jp/tamiya/18703.html',
  'https://www.suruga-ya.jp/product/detail/603036298',
  'https://www.rcjaz.com/tamiya-94989-jr-aero-manta-ray-black-metallic-sp-ar-chassis-limited-p-90064801.html',
  'https://www.suruga-ya.jp/kaitori/kaitori_detail/603046289',
  'https://www.tamiyausa.com/shop/132-rev/jr-aero-manta-ray-japan-cup/',
  'https://www.tamiya.com/japan/products/95295/index.html',
  'https://www.tamiya.com/japan/products/95419/index.html',
  'https://www.tamiyausa.com/shop/132-rev/jr-aero-manta-ray-black-sp-2/'
);

-- Status check is refreshed without inventing status changes.
update public.product_releases r
set status_checked_at=now(), updated_at=now()
from public.products p
where p.id=r.product_id and p.slug='aero-manta-ray-18703';

-- Honest image-gap notes.
update public.product_releases r
set notes=case
  when coalesce(r.notes,'') like '%Image challenge 2026-10-01:%' then r.notes
  else concat_ws(' ',nullif(r.notes,''),
    'Image challenge 2026-10-01: exact release-specific imagery is available on audited retailer/archive pages, but no stable directly attributable asset URL has been established for release_images. Keep the honest placeholder rather than borrowing a sibling/base Aero Manta Ray image.')
  end,
  updated_at=now()
from public.products p
where p.id=r.product_id and p.slug='aero-manta-ray-18703'
  and r.item_number in ('94972','94989','94991');

-- Document current-basis rebuild for legacy ASK snapshots/trends.
update public.product_releases r
set notes=case
  when coalesce(r.notes,'') like '%TrackDash current-method re-scan 2026-10-01:%' then r.notes
  else concat_ws(' ',nullif(r.notes,''),
    'TrackDash current-method re-scan 2026-10-01: legacy pre-EU-first ASK snapshots/trends are being rebuilt under v4-eu-delivered-2026-10. No ASK movement may be promoted to collector trend without qualifying persistent market history.')
  end,
  updated_at=now()
from public.products p
where p.id=r.product_id and p.slug='aero-manta-ray-18703';

-- Enroll and stage recompute for all 7 Releases.
select public.trackdash_enroll_release_market_scans(r.id)
from public.product_releases r
join public.products p on p.id=r.product_id
where p.slug='aero-manta-ray-18703';

select public.trackdash_enqueue_market_recompute(r.id,'new_complete_unbuilt')
from public.product_releases r
join public.products p on p.id=r.product_id
where p.slug='aero-manta-ray-18703';

update public.market_recompute_queue q
set dirty_at='2000-01-10 00:00:00+00',
    available_at='2000-01-10 00:00:00+00',
    locked_until=null,
    attempts=0,
    last_error=null,
    updated_at=now()
where q.release_id in (
  select r.id from public.product_releases r join public.products p on p.id=r.product_id
  where p.slug='aero-manta-ray-18703'
)
and q.condition='new_complete_unbuilt';

-- All seven ITEMs are globally unique and safe for exact-item eBay Active refresh.
update public.market_scan_queue q
set enabled=true,
    priority=180,
    next_scan_at='2000-01-10 00:00:00+00',
    locked_until=null,
    consecutive_failures=0,
    last_error=null,
    updated_at=now()
where q.release_id in (
  select r.id from public.product_releases r join public.products p on p.id=r.product_id
  where p.slug='aero-manta-ray-18703'
)
and q.source_id=(select id from public.price_sources where slug='ebay_active_public')
and q.scan_scope='active_marketplace';

commit;
