begin;
insert into market_scan_endpoints(release_id,source_id,endpoint_url,parser_kind,exact_release_verified,enabled)
values('b95ec446-ae17-56c6-b856-0dfe863735d9','3b726a23-c149-4d7b-8a10-520b46eee4fa','https://www.modellismogandolfi.com/prodotto/aero-thunder-shot-advanced-pack-tkc-edition-telaio-ar-edizione-limitata/','generic_product_page',true,true)
on conflict(release_id,source_id,endpoint_url) do nothing;
insert into market_scan_targets(release_id,source_id,enabled,scan_interval_hours,priority,next_scan_at)
values('b95ec446-ae17-56c6-b856-0dfe863735d9','3b726a23-c149-4d7b-8a10-520b46eee4fa',true,672,80,now()) on conflict(release_id,source_id) do nothing;
insert into market_scan_queue(release_id,source_id,scan_scope,enabled,scan_interval_hours,priority,next_scan_at)
values('b95ec446-ae17-56c6-b856-0dfe863735d9','3b726a23-c149-4d7b-8a10-520b46eee4fa','retail',true,672,80,now()) on conflict(release_id,source_id,scan_scope) do nothing;
commit;
select enabled,parser_kind from market_scan_endpoints where release_id='b95ec446-ae17-56c6-b856-0dfe863735d9';

begin;
do $$begin
 if exists(select 1 from product_releases where barcode_jan='4950344952731' and id<>'e96a1769-9b91-55b8-84c4-697799d0b441') then raise exception 'JAN conflict'; end if;
end$$;
update product_releases set barcode_jan='4950344952731',notes='Asia Challenge 2016 kit. Exact box image visually verified against Tamiya Hong Kong edition specifications. JAN verified in exact Chico Hobby product JSON on 2026-11-02.',updated_at=now() where id='e96a1769-9b91-55b8-84c4-697799d0b441';
insert into release_identifiers(release_id,scheme,value,market,is_primary,verification_status,source_url,checked_at)
select 'e96a1769-9b91-55b8-84c4-697799d0b441','JAN','4950344952731',null,true,'verified','https://chicohobby.com/products/95273-aero-thunder-shot-asia-challenge-year-2016-limited-edition-version-ar-chassis.js','2026-11-02'
where not exists(select 1 from release_identifiers where release_id='e96a1769-9b91-55b8-84c4-697799d0b441' and scheme='JAN' and value='4950344952731');
insert into release_sources(release_id,source_type,source_url,verified_fields,checked_at,notes)
values('e96a1769-9b91-55b8-84c4-697799d0b441','trusted_secondary','https://chicohobby.com/products/95273-aero-thunder-shot-asia-challenge-year-2016-limited-edition-version-ar-chassis.js',array['barcode_jan'],'2026-11-02','Exact product SKU 95273, EAN13 checksum valid. available=false: price not ingested.');
commit;

begin;
do $$declare v uuid:='07cc02e9-2626-5a60-92fb-2c2ed2402d7f';begin
 if (select count(*) from product_releases where product_id=v)<>6 then raise exception 'Expected 6 kits'; end if;
 if exists(select 1 from product_releases r where product_id=v and (verification_status<>'verified' or description is null or description_it is null or barcode_jan is null or not exists(select 1 from release_images i where i.release_id=r.id))) then raise exception 'Incomplete catalog readiness'; end if;
 if (select count(*) from market_scan_queue q join product_releases r on r.id=q.release_id join price_sources s on s.id=q.source_id where r.product_id=v and s.slug='ebay_active_public' and q.last_success_at>='2026-11-02' and q.last_error is null)<>6 then raise exception 'Initial scans incomplete'; end if;
 if (select count(*) from market_release_signals m join product_releases r on r.id=m.release_id where r.product_id=v and m.condition='new_complete_unbuilt' and m.computed_at>='2026-11-02')<>6 then raise exception 'Recompute incomplete'; end if;
end$$;
update products set metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('launch_status','available','launch_status_updated_at','2026-11-02','family_audit',jsonb_build_object('date','2026-11-02','status','published_core_open_variant_research','document','docs/AERO_THUNDER_SHOT_FAMILY_AUDIT_2026-11-02.md','cataloged_kit_count',6,'public_release_count',6,'open_research',jsonb_build_array('2022 Fresh Green: shared base ITEM/JAN, requires explicit physical edition matching','Red Metallic event kit: exact identity and distribution not yet established'))),updated_at=now()
where id='07cc02e9-2626-5a60-92fb-2c2ed2402d7f' and metadata->>'launch_status'='coming_soon';
commit;
select name,metadata->>'launch_status' status from products where id='07cc02e9-2626-5a60-92fb-2c2ed2402d7f';
