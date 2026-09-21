-- Manta Ray Mk.II exact European retail endpoints.
-- Both pages are exact-release matches. Pieroni 95690 is a current Italian
-- retail listing; iModellini 95466 is retained as an exact sold-out reference.

insert into public.market_scan_endpoints
  (id,release_id,source_id,endpoint_url,parser_kind,exact_release_verified,enabled)
select gen_random_uuid(),x.release_id,ps.id,x.endpoint_url,'generic_product_page',true,true
from (
  values
    ('4fdb8e31-07be-5907-9530-9a9bbe7edcf2'::uuid,'pieroni_public','https://www.pieronimodellismo.it/tamiya-manta-ray-mkii-city-circuit-special-telaio-ma-mini4wd-95690-9630.html'),
    ('b2805fb7-cdd3-5dbf-a724-f73d54702844'::uuid,'imodellini_public','https://www.imodellini.it/mini4wd/mini-4wd-pro-manta-ray-mk-ii-black-special-con-telaio-ms-tamiya-95466?limit=40&order=ASC&sort=p.model')
) as x(release_id,source_slug,endpoint_url)
join public.price_sources ps on ps.slug=x.source_slug
on conflict (release_id,source_id,endpoint_url)
do update set exact_release_verified=true,enabled=true,updated_at=now();

update public.market_scan_queue q
set next_scan_at=now(), priority=greatest(q.priority,110), locked_until=null, updated_at=now()
from public.price_sources ps
where ps.id=q.source_id
  and (
    (q.release_id='4fdb8e31-07be-5907-9530-9a9bbe7edcf2' and ps.slug='pieroni_public')
    or
    (q.release_id='b2805fb7-cdd3-5dbf-a724-f73d54702844' and ps.slug='imodellini_public')
  );
