-- Synthetic public catalog and sellers only. Market table definitions/constraints
-- and existing recompute triggers are loaded directly from repository DDL.
insert into categories(id,slug,name) values('00000000-0000-4000-8000-000000000001','synthetic','Synthetic');
insert into brands(id,slug,name) values('00000000-0000-4000-8000-000000000002','synthetic','Synthetic');
insert into products(id,category_id,brand_id,slug,name,original_release_year,rarity) values('00000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002','synthetic','Synthetic',2026,'common');
insert into product_releases(id,product_id,item_number,release_type,edition_name,release_year,chassis) values('00000000-0000-4000-8000-000000000009','00000000-0000-4000-8000-000000000003','00001','standard','Synthetic',2026,'Synthetic');
insert into price_sources(id,slug,name,source_type,is_active) values
 ('00000000-0000-4000-8000-000000000004','legacy_provider','Synthetic policy source','marketplace',false),
 ('00000000-0000-4000-8000-000000000005','ebay_legacy_synthetic','Synthetic legacy','marketplace',false),
 ('00000000-0000-4000-8000-000000000006','retail_synthetic','Synthetic retail','retail',false);
insert into market_source_policies(source_id,source_family,scan_scope,independent_key,role,default_interval_hours) values('00000000-0000-4000-8000-000000000004','ebay','active_marketplace','synthetic','primary_marketplace',168);
