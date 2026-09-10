with updates(item_number,release_year,release_date,source_url,wiki_url,source_note,wiki_note) as (values
 ('19401',1994,date '1994-09-07','https://www.tamiya.com/japan/products/19401/index.html','https://mini-4wd.fandom.com/wiki/Magnum_Saber','Official Tamiya page identifies item 19401 Magnum Saber on Super-1 chassis.','Mini 4WD Wiki dates the original Magnum Saber 19401 to 1994-09-07.'),
 ('19402',1994,date '1994-09-07','https://www.tamiya.com/japan/products/19402/index.html','https://mini-4wd.fandom.com/wiki/Sonic_Saber','Official Tamiya page identifies item 19402 Sonic Saber on Super-1 chassis.','Mini 4WD Wiki dates the original Sonic Saber 19402 to 1994-09-07.'),
 ('19406',1995,date '1995-09-20','https://www.tamiya.com/japan/products/19406/index.html','https://mini-4wd.fandom.com/wiki/Victory_Magnum','Official Tamiya page identifies item 19406 Victory Magnum on Super-1 chassis.','Mini 4WD Wiki dates the original Victory Magnum 19406 to 1995-09-20.')
)
update public.product_releases pr
set verification_status='verified', release_date=u.release_date, updated_at=now()
from updates u where pr.item_number=u.item_number and pr.release_year=u.release_year;

with updates(item_number,release_year,source_url,source_note) as (values
 ('19401',1994,'https://www.tamiya.com/japan/products/19401/index.html','Official Tamiya page identifies item 19401 Magnum Saber on Super-1 chassis.'),
 ('19402',1994,'https://www.tamiya.com/japan/products/19402/index.html','Official Tamiya page identifies item 19402 Sonic Saber on Super-1 chassis.'),
 ('19406',1995,'https://www.tamiya.com/japan/products/19406/index.html','Official Tamiya page identifies item 19406 Victory Magnum on Super-1 chassis.')
), targets as (select pr.id,u.source_url,u.source_note from public.product_releases pr join updates u on u.item_number=pr.item_number and u.release_year=pr.release_year)
insert into public.release_sources (release_id,source_type,source_url,verified_fields,checked_at,notes)
select id,'official_manufacturer',source_url,array['itemNumber','editionName','chassis','image'],date '2026-09-09',source_note from targets
where not exists (select 1 from public.release_sources rs where rs.release_id=targets.id and rs.source_url=targets.source_url);

with updates(item_number,release_year,wiki_url,wiki_note) as (values
 ('19401',1994,'https://mini-4wd.fandom.com/wiki/Magnum_Saber','Mini 4WD Wiki dates the original Magnum Saber 19401 to 1994-09-07.'),
 ('19402',1994,'https://mini-4wd.fandom.com/wiki/Sonic_Saber','Mini 4WD Wiki dates the original Sonic Saber 19402 to 1994-09-07.'),
 ('19406',1995,'https://mini-4wd.fandom.com/wiki/Victory_Magnum','Mini 4WD Wiki dates the original Victory Magnum 19406 to 1995-09-20.')
), targets as (select pr.id,u.wiki_url,u.wiki_note from public.product_releases pr join updates u on u.item_number=pr.item_number and u.release_year=pr.release_year)
insert into public.release_sources (release_id,source_type,source_url,verified_fields,checked_at,notes)
select id,'trusted_secondary',wiki_url,array['itemNumber','releaseDate','releaseYear','chassis'],date '2026-09-09',wiki_note from targets
where not exists (select 1 from public.release_sources rs where rs.release_id=targets.id and rs.source_url=targets.wiki_url);
