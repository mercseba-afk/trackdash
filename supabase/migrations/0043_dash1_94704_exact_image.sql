-- Exact image/provenance fix for Dash-1 Emperor 94704 Black Special.
--
-- The catalog resolver was correctly falling back to the Product image because
-- this release had no release_images row. RCJAZ identifies 94704 as the original
-- Black Special Limited Edition, while a 2011 collector photo predates the later
-- 95296 reissues and is therefore suitable as exact visual evidence.

with target as (
  select id
  from public.product_releases
  where product_id = '2972e27d-7c75-5534-9ed4-1603ef4a6655'
    and item_number = '94704'
    and release_year = 2009
)
insert into public.release_images (release_id, url, position)
select target.id,
       'https://4.bp.blogspot.com/-jiqms0lWhXk/TqRZFR_0evI/AAAAAAAAJsc/V4-PSLTpvaI/s1600/DSC_0267.JPG',
       0
from target
where not exists (
  select 1
  from public.release_images ri
  where ri.release_id = target.id
    and ri.url = 'https://4.bp.blogspot.com/-jiqms0lWhXk/TqRZFR_0evI/AAAAAAAAJsc/V4-PSLTpvaI/s1600/DSC_0267.JPG'
);

update public.product_releases
set verification_status = 'verified',
    updated_at = now()
where product_id = '2972e27d-7c75-5534-9ed4-1603ef4a6655'
  and item_number = '94704'
  and release_year = 2009;

with target as (
  select id
  from public.product_releases
  where product_id = '2972e27d-7c75-5534-9ed4-1603ef4a6655'
    and item_number = '94704'
    and release_year = 2009
)
insert into public.release_sources
  (release_id, source_type, source_url, verified_fields, checked_at, notes)
select target.id,
       'trusted_secondary',
       'https://www.rcjaz.co.uk/tamiya-94704-dash1-emperor-black-special-collector-kit-p-90014090.html',
       array['itemNumber','editionName','chassis','color'],
       date '2026-09-09',
       'RCJAZ identifies item 94704 as the Dash-1 Emperor Black Special MS Chassis Limited Edition; its 95296 page separately identifies 95296 as the re-release of 94704.'
from target
where not exists (
  select 1 from public.release_sources rs
  where rs.release_id = target.id
    and rs.source_url = 'https://www.rcjaz.co.uk/tamiya-94704-dash1-emperor-black-special-collector-kit-p-90014090.html'
);

with target as (
  select id
  from public.product_releases
  where product_id = '2972e27d-7c75-5534-9ed4-1603ef4a6655'
    and item_number = '94704'
    and release_year = 2009
)
insert into public.release_sources
  (release_id, source_type, source_url, verified_fields, checked_at, notes)
select target.id,
       'trusted_secondary',
       'https://toysinsideme.blogspot.com/2011/10/dash-yonkuro-dash-1-emperor-black.html',
       array['image','editionName','color'],
       date '2026-09-09',
       'Contemporary 2011 collector photo of the Dash-1 Emperor Black Special, predating the 95296 reissues and therefore suitable as exact visual evidence for the 94704 occurrence.'
from target
where not exists (
  select 1 from public.release_sources rs
  where rs.release_id = target.id
    and rs.source_url = 'https://toysinsideme.blogspot.com/2011/10/dash-yonkuro-dash-1-emperor-black.html'
);
