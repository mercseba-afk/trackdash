-- Apply only after the guarded exact-page adapter is live.
begin;
do $check$ begin
 if (select count(*) from product_releases where item_number='18614' and edition_name='Avante Mk.II') <> 1 then raise exception 'Exact standard Avante Mk.II missing or ambiguous'; end if;
end $check$;
insert into price_sources(slug,name,source_type,is_active,origin,ingestion_mode,market_region,merchant_key)
values('tempio_mini4wd_public','Il Tempio delle Mini4WD','retail',true,'external_market','public_web','europe','tempio_mini4wd')
on conflict(slug) do nothing;
insert into market_source_policies(source_id,source_family,scan_scope,independent_key,role,include_by_default,current_offer_capable,completed_sale_capable,unavailable_provides_context,default_interval_hours,priority,adapter_status)
select id,'retail:tempio_mini4wd','retail','retail:tempio_mini4wd','supporting_retail',false,true,false,true,672,60,'ready' from price_sources where slug='tempio_mini4wd_public'
on conflict(source_id) do nothing;
insert into market_scan_endpoints(release_id,source_id,endpoint_url,parser_kind,exact_release_verified,enabled)
select r.id,s.id,'https://iltempiodellemini4wd.it/prodotto/mini4wd-avante-mk-ii-ms-chassis/','generic_product_page',true,true
from product_releases r cross join price_sources s
where r.item_number='18614' and r.edition_name='Avante Mk.II' and s.slug='tempio_mini4wd_public'
on conflict(release_id,source_id,endpoint_url) do nothing;
insert into market_scan_queue(release_id,source_id,scan_scope,enabled,scan_interval_hours,priority,next_scan_at)
select r.id,s.id,'retail',true,672,60,now() from product_releases r cross join price_sources s
where r.item_number='18614' and r.edition_name='Avante Mk.II' and s.slug='tempio_mini4wd_public'
on conflict(release_id,source_id,scan_scope) do nothing;
commit;
