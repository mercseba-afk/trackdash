-- Finish exact-image coverage for the currently curated Dash-1 Emperor releases.
-- Reissue image reuse is allowed only where sources show the later occurrence is
-- visually the same product configuration. 94818 uses its own exact specialist
-- imagery because the Silver-Plated Type-1 is not the same as the later Memorial.

with target as (
  select id from public.product_releases
  where item_number='18025' and release_year=1990
)
insert into public.release_images (release_id,url,position)
select id,'https://www.tamiya.com/japan_contents/img/usr/item/1/18025/18025_1.jpg',0
from target
where not exists (select 1 from public.release_images ri where ri.release_id=target.id);

with targets as (
  select id from public.product_releases
  where (item_number='94666' and release_year=2008)
     or (item_number='95622' and release_year=2021)
)
insert into public.release_images (release_id,url,position)
select id,'https://cdn11.bigcommerce.com/s-hekrabusyi/images/stencil/1280x1280/products/19611/18859/tam95622__92562.1730904733.jpg?c=1',0
from targets
where not exists (select 1 from public.release_images ri where ri.release_id=targets.id);

with target as (
  select id from public.product_releases
  where item_number='94670' and release_year=2008
)
insert into public.release_images (release_id,url,position)
select id,'https://www.tamiya.com/japan_contents/img/usr/item/1/18625/18625_1.jpg',0
from target
where not exists (select 1 from public.release_images ri where ri.release_id=target.id);

with target as (
  select id from public.product_releases
  where item_number='95296' and release_year=2017
)
insert into public.release_images (release_id,url,position)
select id,'https://www.tamiya.com/japan_contents/img/usr/item/9/95296/95296_1.jpg',0
from target
where not exists (select 1 from public.release_images ri where ri.release_id=target.id);

with target as (
  select id from public.product_releases
  where item_number='94818' and release_year=2011
)
insert into public.release_images (release_id,url,position)
select id,'https://down-id.img.susercontent.com/file/id-11134207-7r98y-ltt9df6yzxtu99',0
from target
where not exists (select 1 from public.release_images ri where ri.release_id=target.id and ri.url='https://down-id.img.susercontent.com/file/id-11134207-7r98y-ltt9df6yzxtu99');

with target as (
  select id from public.product_releases
  where item_number='94818' and release_year=2011
)
insert into public.release_images (release_id,url,position)
select id,'https://img.amiami.jp/images/product/main/112/TOY-SCL2-02636.jpg',1
from target
where not exists (select 1 from public.release_images ri where ri.release_id=target.id and ri.url='https://img.amiami.jp/images/product/main/112/TOY-SCL2-02636.jpg');

update public.product_releases
set verification_status='verified', updated_at=now()
where item_number='94818' and release_year=2011;

with target as (select id from public.product_releases where item_number='18025' and release_year=1990)
insert into public.release_sources (release_id,source_type,source_url,verified_fields,checked_at,notes)
select id,'official_manufacturer','https://www.tamiya.com/japan/products/18025/index.html',array['itemNumber','editionName','chassis','releaseDate','image'],date '2026-09-09','Tamiya states item 18025 is the Dash-1 Emperor Type-3 and that its initial release was January 1990. The current image is used as visual representation of the original Type-3 occurrence.'
from target
where not exists (select 1 from public.release_sources rs where rs.release_id=target.id and rs.source_url='https://www.tamiya.com/japan/products/18025/index.html');

with targets as (select id,item_number from public.product_releases where (item_number='94666' and release_year=2008) or (item_number='95622' and release_year=2021))
insert into public.release_sources (release_id,source_type,source_url,verified_fields,checked_at,notes)
select id,'official_manufacturer','https://www.tamiya.com/japan/products/95622/index.html',array['itemNumber','editionName','chassis','releaseDate','image'],date '2026-09-09',case when item_number='94666' then 'Tamiya identifies 95622 as the reissue of the Special Kit first released in August 2008 as item 94666; the same dual-body Type-3 visual is used for image representation.' else 'Official Tamiya product page for the 2021 Dash-1 Emperor Type-3 Special Kit reissue.' end
from targets
where not exists (select 1 from public.release_sources rs where rs.release_id=targets.id and rs.source_url='https://www.tamiya.com/japan/products/95622/index.html');

with target as (select id from public.product_releases where item_number='94670' and release_year=2008)
insert into public.release_sources (release_id,source_type,source_url,verified_fields,checked_at,notes)
select id,'trusted_secondary','https://www.rcjaz.co.uk/tamiya-94670-dash1-emperor-ms-chassis-finished-model-limited-run-p-90001335.html',array['itemNumber','editionName','chassis','format','image'],date '2026-09-09','RCJAZ identifies 94670 as the factory-finished Dash-1 Emperor on MS chassis. Its visual configuration matches the assembled 18625 MS model, whose official Tamiya image is reused.'
from target
where not exists (select 1 from public.release_sources rs where rs.release_id=target.id and rs.source_url='https://www.rcjaz.co.uk/tamiya-94670-dash1-emperor-ms-chassis-finished-model-limited-run-p-90001335.html');

with target as (select id from public.product_releases where item_number='95296' and release_year=2017)
insert into public.release_sources (release_id,source_type,source_url,verified_fields,checked_at,notes)
select id,'trusted_secondary','https://www.1999.co.jp/10441652',array['itemNumber','editionName','releaseDate','color','image'],date '2026-09-09','HobbySearch documents the February 2017 95296 Dash-1 Emperor Black Special. The official 95296 image is reused across its visually identical reissue occurrences.'
from target
where not exists (select 1 from public.release_sources rs where rs.release_id=target.id and rs.source_url='https://www.1999.co.jp/10441652');

with target as (select id from public.product_releases where item_number='94818' and release_year=2011)
insert into public.release_sources (release_id,source_type,source_url,verified_fields,checked_at,notes)
select id,'trusted_secondary','https://www.1999.co.jp/10146143',array['itemNumber','editionName','releaseDate','color','image'],date '2026-09-09','HobbySearch identifies item 94818 as the April 2011 Dash-1 Emperor Silver-Plated Body Specification.'
from target
where not exists (select 1 from public.release_sources rs where rs.release_id=target.id and rs.source_url='https://www.1999.co.jp/10146143');

with target as (select id from public.product_releases where item_number='94818' and release_year=2011)
insert into public.release_sources (release_id,source_type,source_url,verified_fields,checked_at,notes)
select id,'trusted_secondary','https://www.amiami.jp/top/detail/detail?gcode=TOY-SCL2-02636',array['itemNumber','jan','image','color'],date '2026-09-09','AmiAmi archival listing identifies the exact silver-plated Dash-1 Emperor kit with JAN 4950344948185 and provides exact package imagery.'
from target
where not exists (select 1 from public.release_sources rs where rs.release_id=target.id and rs.source_url='https://www.amiami.jp/top/detail/detail?gcode=TOY-SCL2-02636');
