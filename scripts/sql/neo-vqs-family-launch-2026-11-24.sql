-- Run after the reviewed foundation import. Existing source adapters and clock.
-- First-scan prioritization applies only to never-attempted Neo-VQS jobs.
begin;
insert into market_scan_endpoints(release_id,source_id,endpoint_url,parser_kind,exact_release_verified,enabled)
select r.id,s.id,x.url,'generic_product_page',true,true
from (values
 ('95598','imodellini_public','https://www.imodellini.it/mini-4wd-neo-vqs-advanced-pack-con-telaio-vz-tamiya-95598'),
 ('95598','tempio_mini4wd_public','https://iltempiodellemini4wd.it/prodotto/mini4wd-neo-vqs-advanced-pack-vz-chassis/'),
 ('18106','pieroni_public','https://www.pieronimodellismo.it/tamiya-18106-neo-vqs-advanced-pack-vz-mini4wd-10279.html')
) x(code,source,url)
join product_releases r on r.item_number=x.code and r.product_id='6f989d2f-58e1-5f0a-be6a-9553f11c85dc'
join price_sources s on s.slug=x.source
on conflict(release_id,source_id,endpoint_url) do nothing;

insert into market_scan_queue(release_id,source_id,scan_scope,enabled,scan_interval_hours,priority,next_scan_at)
select ep.release_id,ep.source_id,'retail',true,672,60,now()
from market_scan_endpoints ep join product_releases r on r.id=ep.release_id
where r.product_id='6f989d2f-58e1-5f0a-be6a-9553f11c85dc'
on conflict(release_id,source_id,scan_scope) do update set
 enabled=true,
 next_scan_at=case when market_scan_queue.last_attempt_at is null then excluded.next_scan_at else market_scan_queue.next_scan_at end,
 updated_at=now();

select trackdash_enroll_release_market_scans(id) from product_releases
where product_id='6f989d2f-58e1-5f0a-be6a-9553f11c85dc';

update market_scan_queue q set next_scan_at='2020-01-01 00:00:00+00',updated_at=now()
from product_releases r,price_sources s
where r.id=q.release_id and s.id=q.source_id
 and r.product_id='6f989d2f-58e1-5f0a-be6a-9553f11c85dc'
 and s.slug='ebay_active_public' and q.enabled and q.last_attempt_at is null;

insert into release_sources(release_id,source_type,source_url,verified_fields,checked_at,notes)
select 'b72112dc-9835-56c4-bccb-ca087f734704','trusted_secondary',
 'https://tamiyablog.com/2024/08/mini-4wd-tamiya-92447-neo-vqs-tokyo-yakult-swallows-collaboration-model/',
 array['itemNumber','editionName','chassis','color'],now(),
 'Contemporary August 2024 exact item identification; corroborated by official Swallows shop and packaging.'
where not exists(select 1 from release_sources where release_id='b72112dc-9835-56c4-bccb-ca087f734704'
 and source_url='https://tamiyablog.com/2024/08/mini-4wd-tamiya-92447-neo-vqs-tokyo-yakult-swallows-collaboration-model/');

insert into release_sources(release_id,source_type,source_url,verified_fields,checked_at,notes)
select '5e030d48-9ca1-5061-a36a-b14e13a42827','trusted_secondary',x.url,
 array['itemNumber','editionName','images'],now(),
 'Exact 95617 packaging reviewed. Out-of-stock/wholesale-only source is not a current consumer quote.'
from (values
 ('https://www.omnimodellismo.it/products/neo-vqs-asia-challenge-2021-special-vz-chassis'),
 ('https://myrcstation.com/products/tamiya-95617-neo-vqs-ac-2021-vz-asia-challenge-edition-95617')
) x(url)
where not exists(select 1 from release_sources where release_id='5e030d48-9ca1-5061-a36a-b14e13a42827' and source_url=x.url);
commit;

-- Execute the existing bounded worker, inspect persisted scan results, then run
-- this guarded visibility transition. It is a no-op on an already-live family.
begin;
do $gate$ begin
 if (select count(*) from product_releases r
  where r.product_id='6f989d2f-58e1-5f0a-be6a-9553f11c85dc'
   and r.verification_status='verified' and r.catalog_visibility='public'
   and r.description is not null and r.description_it is not null
   and exists(select 1 from release_images i where i.release_id=r.id))<>7
 then raise exception 'NEO_VQS_PUBLICATION_GATE'; end if;
 if (select count(*) from product_releases r join market_scan_queue q on q.release_id=r.id
  join price_sources ps on ps.id=q.source_id
  where r.product_id='6f989d2f-58e1-5f0a-be6a-9553f11c85dc'
   and ps.slug='ebay_active_public' and q.enabled and q.last_success_at is not null)<>7
 then raise exception 'NEO_VQS_INITIAL_SCAN_INCOMPLETE'; end if;
end $gate$;
update products set metadata=metadata||jsonb_build_object('launch_status','available',
 'family_audit',jsonb_build_object('checked_at','2026-11-24','kit_release_count',7,
 'initial_ebay_scans_succeeded',7,'exact_image_count',16,'status','published_market_qa')),
 updated_at=now()
where id='6f989d2f-58e1-5f0a-be6a-9553f11c85dc' and metadata->>'launch_status'='coming_soon';
commit;
