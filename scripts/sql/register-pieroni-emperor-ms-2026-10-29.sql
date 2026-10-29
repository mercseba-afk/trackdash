begin;
do $check$ begin
 if (select count(*) from product_releases where item_number='18625')<>1 then raise exception 'Ambiguous ITEM 18625'; end if;
 if (select count(*) from product_releases r join products p on p.id=r.product_id where p.slug='dash-1-emperor-18025' and r.item_number='18625' and r.edition_name='Dash-1 Emperor (MS Chassis)')<>1 then raise exception 'Exact release missing'; end if;
end $check$;
insert into market_scan_endpoints(release_id,source_id,endpoint_url,parser_kind,exact_release_verified,enabled)
select r.id,s.id,'https://www.pieronimodellismo.it/tamiya-18625-dash-1-emperor-telaio-ms-mini-4wd-5565.html','generic_product_page',true,true
from product_releases r join products p on p.id=r.product_id cross join price_sources s
where p.slug='dash-1-emperor-18025' and r.item_number='18625' and r.edition_name='Dash-1 Emperor (MS Chassis)' and s.slug='pieroni_public'
on conflict(release_id,source_id,endpoint_url) do update set exact_release_verified=true,enabled=true,updated_at=now();
update market_scan_queue q set enabled=true,next_scan_at=now(),updated_at=now()
from product_releases r,price_sources s
where q.release_id=r.id and q.source_id=s.id and r.item_number='18625' and s.slug='pieroni_public' and q.scan_scope='retail';
update market_scan_targets t set enabled=true,next_scan_at=now(),updated_at=now()
from product_releases r,price_sources s
where t.release_id=r.id and t.source_id=s.id and r.item_number='18625' and s.slug='pieroni_public';
commit;
select r.item_number,s.slug,q.enabled,q.next_scan_at,e.exact_release_verified
from market_scan_queue q join product_releases r on r.id=q.release_id join price_sources s on s.id=q.source_id
join market_scan_endpoints e on e.release_id=q.release_id and e.source_id=q.source_id
where r.item_number='18625' and s.slug='pieroni_public';
