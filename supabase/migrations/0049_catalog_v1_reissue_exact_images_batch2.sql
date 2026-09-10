-- Reuse official imagery across documented visually-identical reissues.
-- Catalog rule: allowed when the release relationship and unchanged visual
-- configuration are supported by sources.

with target as (select id from public.product_releases where item_number='18014' and release_year=1988)
insert into public.release_images (release_id,url,position)
select id,'https://www.tamiya.com/japan_contents/img/usr/item/1/18014/18014_1.jpg',0 from target
where not exists (select 1 from public.release_images ri where ri.release_id=target.id);

with target as (select id from public.product_releases where item_number='18014' and release_year=1988)
insert into public.release_sources (release_id,source_type,source_url,verified_fields,checked_at,notes)
select id,'official_manufacturer','https://www.tamiya.com/japan/products/18014/index.html',array['itemNumber','editionName','chassis','image'],date '2026-09-09','Official Tamiya product page for item 18014. Current official image is reused as the exact visual representation of the original 1988 occurrence; Tamiya archival material identifies 18014 as the 1988 Avante Jr. on Type-2 chassis.' from target
where not exists (select 1 from public.release_sources rs where rs.release_id=target.id and rs.source_url='https://www.tamiya.com/japan/products/18014/index.html');

with target as (select id from public.product_releases where item_number='18014' and release_year=1988)
insert into public.release_sources (release_id,source_type,source_url,verified_fields,checked_at,notes)
select id,'official_archive','https://www.tamiya.com/cms/japan/mini4wd/jr_news/jr_news16/pdf/000191.pdf',array['itemNumber','releaseYear','chassis'],date '2026-09-09','Tamiya JR News archive identifies Avante Jr. item 18014, Type-2 chassis, released in 1988.' from target
where not exists (select 1 from public.release_sources rs where rs.release_id=target.id and rs.source_url='https://www.tamiya.com/cms/japan/mini4wd/jr_news/jr_news16/pdf/000191.pdf');

with target as (select id from public.product_releases where item_number='18056' and release_year=2003)
insert into public.release_images (release_id,url,position)
select id,'https://www.tamiya.com/japan_contents/img/usr/item/1/18056/18056_1.jpg',0 from target
where not exists (select 1 from public.release_images ri where ri.release_id=target.id);

with target as (select id from public.product_releases where item_number='18056' and release_year=2003)
insert into public.release_sources (release_id,source_type,source_url,verified_fields,checked_at,notes)
select id,'official_manufacturer','https://www.tamiya.com/japan/products/18056/index.html',array['itemNumber','releaseYear','editionName','chassis','color','image'],date '2026-09-09','Tamiya explicitly states the 2013 item 18056 is a spot reissue of the Mad Bull Jr. released in 2003, retaining the black/red body, Super TZ-X chassis and yellow wheels. Official image is reused for the original visual.' from target
where not exists (select 1 from public.release_sources rs where rs.release_id=target.id and rs.source_url='https://www.tamiya.com/japan/products/18056/index.html');

with target as (select id from public.product_releases where item_number='95508' and release_year=2019)
insert into public.release_images (release_id,url,position)
select id,'https://www.tamiya.com/japan_contents/img/usr/item/9/95508/95508_1.jpg',0 from target
where not exists (select 1 from public.release_images ri where ri.release_id=target.id);

with target as (select id from public.product_releases where item_number='95508' and release_year=2019)
insert into public.release_sources (release_id,source_type,source_url,verified_fields,checked_at,notes)
select id,'official_manufacturer','https://www.tamiya.com/japan/products/95508/index.html',array['itemNumber','releaseYear','editionName','chassis','color','image'],date '2026-09-09','Tamiya official 95508 page states the initial release month was August 2019 and documents the same Carbon Special configuration reissued in 2023; official image is reused for the 2019 occurrence.' from target
where not exists (select 1 from public.release_sources rs where rs.release_id=target.id and rs.source_url='https://www.tamiya.com/japan/products/95508/index.html');
