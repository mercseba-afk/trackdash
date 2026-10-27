-- Publish ready Aero Avante core only after actual initial scans and canonical recompute.
-- No code merge/deploy, old database, scheduler or valuation-policy changes.
begin;
do $$ declare v_product constant uuid := 'c8132bd5-23ee-5f36-b3f6-a75ef0c27ea3'; begin
 if (select count(*) from product_releases where product_id=v_product)<>16 then raise exception 'Expected 16 identified complete kits'; end if;
 if exists(select 1 from product_releases r where r.product_id=v_product and (r.verification_status<>'verified' or r.description is null or r.description_it is null or not exists(select 1 from release_images i where i.release_id=r.id))) then raise exception 'Catalog readiness incomplete'; end if;
 if (select count(*) from market_scan_queue q join product_releases r on r.id=q.release_id join price_sources s on s.id=q.source_id where r.product_id=v_product and s.slug='ebay_active_public' and q.last_success_at>='2026-10-23' and q.last_error is null)<>16 then raise exception 'Initial eBay audit not yet completed for every kit'; end if;
 if (select count(*) from market_release_signals m join product_releases r on r.id=m.release_id where r.product_id=v_product and m.condition='new_complete_unbuilt' and m.computed_at>='2026-10-23')<>16 then raise exception 'Canonical recompute incomplete'; end if;
end $$;
insert into release_sources(release_id,source_type,source_url,verified_fields,checked_at,notes)
select r.id,'other',i.url,array['release_images.url'],'2026-10-23','Exact release photo or clearly labelled exact-release box artwork, inspected visually. HTTP 200 verified through Production Next Image with existing allowlist. No license claim. See family audit for source page and matching limits.' from product_releases r join release_images i on i.release_id=r.id where r.product_id='c8132bd5-23ee-5f36-b3f6-a75ef0c27ea3' and not exists(select 1 from release_sources s where s.release_id=r.id and s.source_url=i.url);
update products set metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('launch_status','available','launch_status_updated_at','2026-10-23','family_audit',jsonb_build_object('date','2026-10-23','status','published_core_open_collaboration_research','cataloged_kit_count',16,'public_release_count',16,'document','docs/AERO_AVANTE_FAMILY_AUDIT_2026-10-23.md','open_collaborations',jsonb_build_array('Albirex Niigata 2023','Kashima Antlers 2023','Yokohama FC 2023','Yokohama F. Marinos 2023','Shiga Lakes research candidate','Gamba Osaka research candidate'))),updated_at=now() where id='c8132bd5-23ee-5f36-b3f6-a75ef0c27ea3' and metadata->>'launch_status'='coming_soon';
commit;
select name,metadata->>'launch_status' launch_status from products where id='c8132bd5-23ee-5f36-b3f6-a75ef0c27ea3';
