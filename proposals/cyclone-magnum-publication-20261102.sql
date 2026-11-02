begin;
do $$declare v uuid:='53791485-2948-5176-8acb-2ec947eafc51';begin
 if (select count(*) from product_releases where product_id=v)<>8 then raise exception 'Expected8kits'; end if;
 if exists(select 1 from product_releases r where r.product_id=v and (r.verification_status<>'verified' or r.barcode_jan is null or r.description is null or r.description_it is null or not exists(select 1 from release_images i where i.release_id=r.id))) then raise exception 'Incomplete catalog'; end if;
 if (select count(*) from market_scan_queue q join product_releases r on r.id=q.release_id join price_sources s on s.id=q.source_id where r.product_id=v and s.slug='ebay_active_public' and q.last_success_at>='2026-11-02' and q.last_error is null)<>8 then raise exception 'Initial scan incomplete'; end if;
 if (select count(*) from market_release_signals m join product_releases r on r.id=m.release_id where r.product_id=v and m.condition='new_complete_unbuilt' and m.computed_at>='2026-11-02')<>8 then raise exception 'Recompute incomplete'; end if;
end$$;
update products set metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('launch_status','available','launch_status_updated_at','2026-11-02','family_audit',jsonb_build_object('date','2026-11-02','status','published_core_open_special_editions_research','document','docs/CYCLONE_MAGNUM_FAMILY_AUDIT_2026-11-02.md','cataloged_kit_count',8,'public_release_count',8,'open_research',jsonb_build_array('21st Century amusement variants92256-92259 and92365-92368','92375 Graha Tamiya','92398 CoroCoro Blue Metallic','XLARGE2021 and Vegalta Sendai2023 collaborations'))),updated_at=now() where id='53791485-2948-5176-8acb-2ec947eafc51' and metadata->>'launch_status'='coming_soon';
commit;
select name,metadata->>'launch_status' status from products where id='53791485-2948-5176-8acb-2ec947eafc51';
