-- Complete the two remaining Aero Thunder Shot limited releases.

update public.product_releases
set release_year=2013,
    verification_status='verified',
    notes='Aero Thunder Shot Silver Metallic limited edition. HobbySearch records release in mid-December 2013; RCJAZ confirms item 94990 and AR chassis configuration.',
    updated_at=now()
where item_number='94990'
  and edition_name ilike '%Aero Thunder Shot%Silver Metallic%';

with target as (select id from public.product_releases where item_number='94990' and release_year=2013)
insert into public.release_images (release_id,url,position)
select id,'https://cf.shopee.com.my/file/7f707c466ec0b1a57ea9e6699c7b96fe',0 from target
where not exists (select 1 from public.release_images ri where ri.release_id=target.id and ri.url='https://cf.shopee.com.my/file/7f707c466ec0b1a57ea9e6699c7b96fe');

with target as (select id from public.product_releases where item_number='94990' and release_year=2013)
insert into public.release_sources (release_id,source_type,source_url,verified_fields,checked_at,notes)
select id,'trusted_secondary','https://www.rcjaz.co.uk/compact-racer-tamiya-94990-aero-thunder-shot-silver-metallic-ar-chassis-model-kit-p-90064731.html',array['itemNumber','editionName','chassis','color','image'],date '2026-09-09','RCJAZ exact product record for Tamiya 94990 Aero Thunder Shot Silver Metallic AR Chassis.' from target
where not exists (select 1 from public.release_sources rs where rs.release_id=target.id and rs.source_url='https://www.rcjaz.co.uk/compact-racer-tamiya-94990-aero-thunder-shot-silver-metallic-ar-chassis-model-kit-p-90064731.html');

with target as (select id from public.product_releases where item_number='94990' and release_year=2013)
insert into public.release_sources (release_id,source_type,source_url,verified_fields,checked_at,notes)
select id,'trusted_secondary','https://www.1999.co.jp/10243310',array['itemNumber','releaseYear','editionName','jan'],date '2026-09-09','HobbySearch identifies item 94990 and records release in mid-December 2013; JAN 4950344963201.' from target
where not exists (select 1 from public.release_sources rs where rs.release_id=target.id and rs.source_url='https://www.1999.co.jp/10243310');

with target as (select id from public.product_releases where item_number='94990' and release_year=2013)
insert into public.release_sources (release_id,source_type,source_url,verified_fields,checked_at,notes)
select id,'trusted_secondary','https://mini-4wd.fandom.com/wiki/Aero_Thunder_Shot',array['itemNumber','editionName','chassis','color','image'],date '2026-09-09','Mini 4WD Wiki lists 94990 as the Silver Metallic Aero Thunder Shot and documents its exact visual configuration.' from target
where not exists (select 1 from public.release_sources rs where rs.release_id=target.id and rs.source_url='https://mini-4wd.fandom.com/wiki/Aero_Thunder_Shot');

update public.product_releases
set verification_status='verified', updated_at=now()
where item_number='95273' and release_year=2016;

with target as (select id from public.product_releases where item_number='95273' and release_year=2016)
insert into public.release_images (release_id,url,position)
select id,'https://down-my.img.susercontent.com/file/th-11134207-81ztd-mislzv99jjt34f',0 from target
where not exists (select 1 from public.release_images ri where ri.release_id=target.id and ri.url='https://down-my.img.susercontent.com/file/th-11134207-81ztd-mislzv99jjt34f');

with target as (select id from public.product_releases where item_number='95273' and release_year=2016)
insert into public.release_sources (release_id,source_type,source_url,verified_fields,checked_at,notes)
select id,'trusted_secondary','https://www.rcjaz.co.uk/95273-tamiya-aero-thunder-shot-asia-challenge-2016-ar-chassis-p-90073792.html',array['itemNumber','releaseYear','editionName','chassis','color','image','jan'],date '2026-09-09','RCJAZ exact product record for Tamiya 95273 Aero Thunder Shot Asia Challenge 2016, GTIN 4950344952731, with red body, white reinforced AR chassis, red-plated wheels and white hard tires.' from target
where not exists (select 1 from public.release_sources rs where rs.release_id=target.id and rs.source_url='https://www.rcjaz.co.uk/95273-tamiya-aero-thunder-shot-asia-challenge-2016-ar-chassis-p-90073792.html');

with target as (select id from public.product_releases where item_number='95273' and release_year=2016)
insert into public.release_sources (release_id,source_type,source_url,verified_fields,checked_at,notes)
select id,'trusted_secondary','https://mini-4wd.fandom.com/wiki/Aero_Thunder_Shot',array['itemNumber','releaseYear','editionName','chassis','color','image'],date '2026-09-09','Mini 4WD Wiki lists 95273 as the 2016 Asia Challenge variant and documents the same red/white configuration.' from target
where not exists (select 1 from public.release_sources rs where rs.release_id=target.id and rs.source_url='https://mini-4wd.fandom.com/wiki/Aero_Thunder_Shot');
