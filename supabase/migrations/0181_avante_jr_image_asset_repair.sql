-- Avante Jr. image asset repair — 2026-09-26
-- Fix only broken/missing hero asset URLs identified by live Next Image proxy QA.
-- No genealogy or market data changes.

-- 18506 Black Special (1989 Original): replace dead legacy Tamiya USA asset.
update public.release_images
set url='https://cdn.suruga-ya.jp/database/pics_webp/game/603014086.jpg.webp'
where release_id='934803bc-4ff1-5a5a-9965-b9ed5d448215'::uuid
  and position=0;

-- 95501 Black Special 2019 + 2021 waves: replace dead legacy Tamiya USA asset.
update public.release_images
set url='https://cdn.suruga-ya.jp/database/pics_webp/game/603200437.jpg.webp'
where release_id in (
  '7fd567d7-4d97-5323-88c4-d501efd3bdac'::uuid,
  'aea3091e-b0aa-5258-9aea-e94bf44893c9'::uuid
)
  and position=0;

insert into public.release_sources (
  release_id, source_type, source_url, verified_fields, checked_at, notes
)
select
  '934803bc-4ff1-5a5a-9965-b9ed5d448215'::uuid,
  'trusted_secondary',
  'https://www.suruga-ya.jp/kaitori/kaitori_detail/603014086',
  array['itemNumber','editionName','image']::text[],
  date '2026-09-26',
  'Exact ITEM 18506 Black Special image source used to replace a dead legacy Tamiya USA asset. Not used as release-year authority.'
where not exists (
  select 1 from public.release_sources
  where release_id='934803bc-4ff1-5a5a-9965-b9ed5d448215'::uuid
    and source_url='https://www.suruga-ya.jp/kaitori/kaitori_detail/603014086'
);

insert into public.release_sources (
  release_id, source_type, source_url, verified_fields, checked_at, notes
)
select
  x.release_id,
  'trusted_secondary',
  'https://www.suruga-ya.jp/product/detail/603200437',
  array['itemNumber','editionName','image']::text[],
  date '2026-09-26',
  'Exact ITEM 95501 Black Special visual source used to replace a dead legacy Tamiya USA asset. This later production-wave page verifies the exact item visual only and is not used as release-year authority.'
from (
  values
    ('7fd567d7-4d97-5323-88c4-d501efd3bdac'::uuid),
    ('aea3091e-b0aa-5258-9aea-e94bf44893c9'::uuid)
) as x(release_id)
where not exists (
  select 1 from public.release_sources rs
  where rs.release_id=x.release_id
    and rs.source_url='https://www.suruga-ya.jp/product/detail/603200437'
);
