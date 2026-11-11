begin;
insert into product_releases(id,product_id,item_number,release_type,edition_type,edition_name,release_year,chassis,barcode_jan,color,description,description_it,discontinued,is_original,data_source,verification_status,production_status,catalog_visibility,catalog_visibility_reason)
values('3877b2d2-bbe3-4236-8f95-1e8fcdc92855','d341ec22-c1f9-5a03-906d-444f8eee5401','95500','Color Special','color_special','DCR-01 Clear Blue Special (MA Chassis)',2019,'MA','4950344955008','Clear Blue','Limited complete DCR-01 kit with a three-part clear blue body on the MA chassis.','Kit completo in edizione speciale con carrozzeria blu trasparente in tre parti e telaio MA.',false,false,'family_audit_20261111','verified','unknown','public','Exact complete kit documented by Tamiya USA')
on conflict(id) do nothing;
update product_releases set barcode_jan=case item_number when '18646' then '4950344064458' when '95372' then '4950344953721' end,updated_at=now()
where product_id='d341ec22-c1f9-5a03-906d-444f8eee5401' and item_number in ('18646','95372') and barcode_jan is null;
update release_images set url='https://www.tamiya.com/japan_contents/img/usr/item/1/18646/18646_1.jpg'
where release_id='d32c3468-4ce4-5968-ba4e-d1e47e30eb01' and url='https://www.chrishouse.ca/cdn/shop/files/tam18646.jpg?v=1767906575&width=1445';
insert into release_images(release_id,url,position)
select '3877b2d2-bbe3-4236-8f95-1e8fcdc92855','https://www.rcjaz.com/images/tamiya/mini_4wd_series/mini_4wd_car_kit/ma_chassis/b_95500.jpg',0
where not exists(select 1 from release_images where release_id='3877b2d2-bbe3-4236-8f95-1e8fcdc92855');
insert into release_identifiers(release_id,scheme,value,is_primary,verification_status,source_url,checked_at)
select r.id,'JAN',x.jan,x.primary_jan,'verified',x.source,current_date
from (values ('18646','4950344064458',true,'https://www.1999.co.jp/10459704'),('18646','4950344186464',false,'https://www.tamiyausa.com/media/files/map-feb-2026-1239-08db.pdf'),('95372','4950344953721',true,'https://hs-tamtam.co.jp/product/detail/245430/'),('95500','4950344955008',true,'https://www.modellismobaracca.com/auto-mini-4wd/11307-Pro-DCR-01-Clear-Blue-Special-MA.html')) x(item,jan,primary_jan,source)
join product_releases r on r.item_number=x.item and r.product_id='d341ec22-c1f9-5a03-906d-444f8eee5401'
where not exists(select 1 from release_identifiers i where i.release_id=r.id and i.scheme='JAN' and i.value=x.jan);
insert into release_sources(release_id,source_type,source_url,verified_fields,checked_at,notes)
select '3877b2d2-bbe3-4236-8f95-1e8fcdc92855',x.kind,x.url,x.fields,current_date,x.notes
from (values ('official_manufacturer','https://www.tamiyausa.com/shop/132-pro/jr-dcr-01-clear-blue-special/',array['itemNumber','editionName','chassis'],'Tamiya USA identifies the complete limited kit.'),('trusted_secondary','https://www.rcjaz.com/tamiya-95500-132-dcr01-clear-blue-special-ma-chassis-model-kit-p-15427.html',array['image','barcode_jan'],'Exact image visually inspected and JAN confirmed. Retail stock unavailable, price not imported.')) x(kind,url,fields,notes)
where not exists(select 1 from release_sources s where s.release_id='3877b2d2-bbe3-4236-8f95-1e8fcdc92855' and s.source_url=x.url);
update products set metadata=metadata||jsonb_build_object('launch_status','available','launch_status_updated_at','2026-11-11'),updated_at=now() where id='d341ec22-c1f9-5a03-906d-444f8eee5401' and metadata->>'catalog_visibility'='public';
select trackdash_enroll_release_market_scans(id) from product_releases where product_id='d341ec22-c1f9-5a03-906d-444f8eee5401' and item_number in ('18646','95372','95500');
update market_scan_queue q set next_scan_at=now(),updated_at=now() from product_releases r,price_sources s where q.release_id=r.id and q.source_id=s.id and r.product_id='d341ec22-c1f9-5a03-906d-444f8eee5401' and r.item_number in ('18646','95372','95500') and s.slug='ebay_active_public' and q.enabled and q.last_attempt_at is null;
commit;
select r.item_number,r.barcode_jan,q.enabled,q.next_scan_at from product_releases r join market_scan_queue q on q.release_id=r.id join price_sources s on s.id=q.source_id where r.product_id='d341ec22-c1f9-5a03-906d-444f8eee5401' and s.slug='ebay_active_public';