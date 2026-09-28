-- Dash-3 Shooting Star exact image backfill — 2026-09-28
--
-- Restores five exact/high-confidence heroes from Suruga's stable CDN.
-- TrackDash already uses this Suruga CDN pattern across multiple completed
-- Mini 4WD families, so these assets are treated consistently with existing
-- production policy.
--
-- Coverage after this migration: 7/8 canonical Releases.
-- Remaining intentional placeholder: 18019 — 1989 Original (Ondawara).

begin;

-- Update product-level image audit metadata.
update public.products
set metadata =
  jsonb_set(
    jsonb_set(
      coalesce(metadata,'{}'::jsonb),
      '{image_audit,covered_release_count}',
      '7'::jsonb,
      true
    ),
    '{image_audit,intentional_placeholder_items}',
    jsonb_build_array('18019 Original 1989 Ondawara'),
    true
  ),
  updated_at=now()
where slug='dash-3-shooting-star-18703';

-- 94820 — Blue Plated Body Specification.
-- Suruga exact record: management ID 603007842.
insert into public.release_sources(
  release_id,source_type,source_url,verified_fields,checked_at,notes
)
select r.id,'trusted_secondary',
       'https://www.suruga-ya.jp/kaitori/kaitori_detail/603007842',
       array['editionName','color','format','image','marketPresence']::text[],
       date '2026-09-28',
       'Exact Suruga Shooting Star Blue Plated full-kit record. The page lists motor/battery kit contents; image asset is served through Suruga management ID 603007842.'
from public.product_releases r
join public.products p on p.id=r.product_id
where p.slug='dash-3-shooting-star-18703'
  and r.item_number='94820'
  and r.release_year=2011
  and not exists(
    select 1 from public.release_sources s
    where s.release_id=r.id
      and s.source_url='https://www.suruga-ya.jp/kaitori/kaitori_detail/603007842'
  );

insert into public.release_images(release_id,url,position)
select r.id,
       'https://cdn.suruga-ya.jp/database/pics_webp/game/603007842.jpg.webp',
       0
from public.product_releases r
join public.products p on p.id=r.product_id
where p.slug='dash-3-shooting-star-18703'
  and r.item_number='94820'
  and r.release_year=2011
  and not exists(
    select 1 from public.release_images ri
    where ri.release_id=r.id
  );

-- 92338 — Dragontail Red.
insert into public.release_images(release_id,url,position)
select r.id,
       'https://cdn.suruga-ya.jp/database/pics_webp/game/603065299.jpg.webp',
       0
from public.product_releases r
join public.products p on p.id=r.product_id
where p.slug='dash-3-shooting-star-18703'
  and r.item_number='92338'
  and r.release_year=2015
  and not exists(
    select 1 from public.release_images ri
    where ri.release_id=r.id
  );

-- 92339 — Dragontail Blue.
insert into public.release_images(release_id,url,position)
select r.id,
       'https://cdn.suruga-ya.jp/database/pics_webp/game/603065300.jpg.webp',
       0
from public.product_releases r
join public.products p on p.id=r.product_id
where p.slug='dash-3-shooting-star-18703'
  and r.item_number='92339'
  and r.release_year=2015
  and not exists(
    select 1 from public.release_images ri
    where ri.release_id=r.id
  );

-- 92340 — Dragontail White.
insert into public.release_images(release_id,url,position)
select r.id,
       'https://cdn.suruga-ya.jp/database/pics_webp/game/603065301.jpg.webp',
       0
from public.product_releases r
join public.products p on p.id=r.product_id
where p.slug='dash-3-shooting-star-18703'
  and r.item_number='92340'
  and r.release_year=2015
  and not exists(
    select 1 from public.release_images ri
    where ri.release_id=r.id
  );

-- 92341 — Dragontail Black.
insert into public.release_images(release_id,url,position)
select r.id,
       'https://cdn.suruga-ya.jp/database/pics_webp/game/603065302.jpg.webp',
       0
from public.product_releases r
join public.products p on p.id=r.product_id
where p.slug='dash-3-shooting-star-18703'
  and r.item_number='92341'
  and r.release_year=2015
  and not exists(
    select 1 from public.release_images ri
    where ri.release_id=r.id
  );

-- Durable notes: explain why these marketplace/retailer images are accepted.
update public.product_releases r
set notes=case
      when coalesce(r.notes,'') like '%Image backfill 2026-09-28:%' then r.notes
      else concat_ws(
        ' ',
        nullif(r.notes,''),
        'Image backfill 2026-09-28: exact Suruga management-ID asset accepted under the current image policy. TrackDash already uses the same stable Suruga CDN pattern for completed Mini 4WD families; exact retailer image is preferred to an intentional placeholder when identity is unambiguous.'
      )
    end,
    updated_at=now()
from public.products p
where r.product_id=p.id
  and p.slug='dash-3-shooting-star-18703'
  and r.item_number in ('94820','92338','92339','92340','92341');

commit;
