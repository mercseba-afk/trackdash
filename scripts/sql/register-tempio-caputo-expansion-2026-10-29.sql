-- Guarded exact-page adapter fcf589b must already be live.
-- Only five reviewed, purchasable endpoints; no bulk release enrollment.
begin;
insert into price_sources(slug,name,source_type,is_active,origin,ingestion_mode,market_region,merchant_key)
values('caputo_modellismo_public','Caputo Modellismo','retail',true,'external_market','public_web','europe','caputo_modellismo')
on conflict(slug) do nothing;
insert into market_source_policies(source_id,source_family,scan_scope,independent_key,role,include_by_default,current_offer_capable,completed_sale_capable,unavailable_provides_context,default_interval_hours,priority,adapter_status)
select id,'retail:caputo_modellismo','retail','retail:caputo_modellismo','supporting_retail',false,true,false,true,672,60,'ready' from price_sources where slug='caputo_modellismo_public'
on conflict(source_id) do nothing;
with reviewed(source_slug,item_number,edition_name,url,expected_jan) as (values
 ('caputo_modellismo_public','19415','Hurricane Sonic','https://www.caputomodellismo.it/product/19415-hurricane-sonic/',null),
 ('tempio_mini4wd_public','18025','Dash-1 Emperor — 2026 Reissue (Type 3)','https://iltempiodellemini4wd.it/prodotto/mini4wd-dash-1-emperor-chassis-type-3/','4950344089789'),
 ('tempio_mini4wd_public','92470','Avante Mk.III Nero Tamiya Korea Mini 4WD Cup 2026','https://iltempiodellemini4wd.it/prodotto/mini4wd-avante-mk-3-nero-tkmc-2026-ms-chassis/','4950344924707'),
 ('tempio_mini4wd_public','18628','Dash-2 Burning Sun — 2008 MS Chassis','https://iltempiodellemini4wd.it/prodotto/mini4wd-dash-2-burning-sun-ms-chassis/',null),
 ('tempio_mini4wd_public','18014','Avante Jr. (2024 Reissue)','https://iltempiodellemini4wd.it/prodotto/mini4wd-avante-jr-type-2-chassis/','4950344080878')
)
insert into market_scan_endpoints(release_id,source_id,endpoint_url,parser_kind,exact_release_verified,enabled)
select r.id,s.id,v.url,'generic_product_page',true,true from reviewed v
join product_releases r on r.item_number=v.item_number and r.edition_name=v.edition_name and r.catalog_visibility='public' and (v.expected_jan is null or r.barcode_jan=v.expected_jan)
join price_sources s on s.slug=v.source_slug
on conflict(release_id,source_id,endpoint_url) do nothing;
do $check$ begin
 if (select count(*) from market_scan_endpoints e join price_sources s on s.id=e.source_id where s.slug='caputo_modellismo_public' and e.enabled and e.exact_release_verified)<>1 then raise exception 'Unexpected Caputo endpoint count'; end if;
 if (select count(*) from market_scan_endpoints e join price_sources s on s.id=e.source_id where s.slug='tempio_mini4wd_public' and e.enabled and e.exact_release_verified)<>5 then raise exception 'Unexpected Tempio endpoint count'; end if;
end $check$;
insert into market_scan_queue(release_id,source_id,scan_scope,enabled,scan_interval_hours,priority,next_scan_at)
select distinct e.release_id,s.id,'retail',true,672,60,now()
from market_scan_endpoints e join price_sources s on s.id=e.source_id
where s.slug in ('tempio_mini4wd_public','caputo_modellismo_public') and e.enabled and e.exact_release_verified
on conflict(release_id,source_id,scan_scope) do nothing;
commit;
