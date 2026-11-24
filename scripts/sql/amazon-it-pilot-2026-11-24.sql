-- Data-only enrollment. Run only AFTER the Amazon worker deployment is Ready
-- and TRACKDASH_SCRAPERAPI_KEY exists in Production. No scheduler/DDL changes.
begin;
update price_sources set market_region='global' where slug='amazon_it_public';
update market_source_policies set adapter_status='ready', include_by_default=true,
 default_interval_hours=24, updated_at=now()
where source_id=(select id from price_sources where slug='amazon_it_public');

with verified(release_id,asin,item) as (values
 ('01e1ea1d-0513-5562-8e55-63c11f24fbe5'::uuid,'B083JYP59Y','18094'),
 ('51267c3e-03cc-54c4-8b9b-1c4e413d75b8'::uuid,'B08KR2LXCV','95598'))
insert into market_scan_endpoints(release_id,source_id,endpoint_url,parser_kind,exact_release_verified,enabled)
select r.id,s.id,'https://www.amazon.it/dp/'||v.asin,'generic_product_page',true,true
from verified v join product_releases r on r.id=v.release_id and r.item_number=v.item
cross join price_sources s where s.slug='amazon_it_public'
on conflict(release_id,source_id,endpoint_url) do update set exact_release_verified=true,enabled=true,updated_at=now();
-- Generic endpoint envelope is preserved. Source dispatch in worker.ts routes
-- Amazon exclusively through its fixed structured API, never an HTML fetch.
insert into market_scan_queue(release_id,source_id,scan_scope,enabled,activity_tier,scan_interval_hours,priority,next_scan_at)
select e.release_id,e.source_id,'active_marketplace',true,'normal',24,95,now()
from market_scan_endpoints e join price_sources s on s.id=e.source_id
where s.slug='amazon_it_public' and e.endpoint_url in ('https://www.amazon.it/dp/B083JYP59Y','https://www.amazon.it/dp/B08KR2LXCV')
on conflict(release_id,source_id,scan_scope) do update set enabled=true,scan_interval_hours=24,updated_at=now();
commit;
