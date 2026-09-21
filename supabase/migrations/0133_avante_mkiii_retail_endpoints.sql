-- Avante Mk.III exact European retail endpoints.
-- Mirrors the proven Manta Ray Mk.II endpoint pattern: only exact Release
-- product pages are enabled for unattended retail scans. Category/search
-- pages are intentionally excluded.

insert into public.market_scan_endpoints
  (id,release_id,source_id,endpoint_url,parser_kind,exact_release_verified,enabled)
select gen_random_uuid(),x.release_id,ps.id,x.endpoint_url,'generic_product_page',true,true
from (
  values
    ('497455cb-838d-5430-97dd-ae0be52e69e4'::uuid,'imodellini_public','https://www.imodellini.it/mini4wd/mini-4wd-avante-mkiii-azure-tamiya-18626?limit=100'),
    ('86763fe4-bfc0-551e-8541-c3fc9c2442b7'::uuid,'pieroni_public','https://www.pieronimodellismo.it/tamiya-18627-avante-mkiii-nero-telaio-ms-mini-4wd-9066.html'),
    ('c91957f4-907f-5f1a-9a49-faeddc3abd8d'::uuid,'pieroni_public','https://www.pieronimodellismo.it/tamiya-avante-mkiii-nero-advancer-pack-telaio-ms-mini-4wd-18662-9541.html'),
    ('cc1fb7fa-67db-5303-9514-80b9705fe732'::uuid,'pieroni_public','https://www.pieronimodellismo.it/95464-tamiya-avante-mkiii-azure-clear-special-body-policarbonato-telaio-ms-mini4wd-9629.html')
) as x(release_id,source_slug,endpoint_url)
join public.price_sources ps on ps.slug=x.source_slug
on conflict (release_id,source_id,endpoint_url)
do update set
  exact_release_verified=true,
  enabled=true,
  parser_kind='generic_product_page',
  updated_at=now();

-- Initial-audit endpoints must be due immediately. This does not mark a scan
-- successful: last_success_at remains untouched until a real fetch succeeds.
update public.market_scan_queue q
set next_scan_at=now(),
    priority=greatest(q.priority,110),
    locked_until=null,
    updated_at=now()
from public.price_sources ps
where ps.id=q.source_id
  and (
    (q.release_id='497455cb-838d-5430-97dd-ae0be52e69e4'::uuid and ps.slug='imodellini_public')
    or
    (q.release_id='86763fe4-bfc0-551e-8541-c3fc9c2442b7'::uuid and ps.slug='pieroni_public')
    or
    (q.release_id='c91957f4-907f-5f1a-9a49-faeddc3abd8d'::uuid and ps.slug='pieroni_public')
    or
    (q.release_id='cc1fb7fa-67db-5303-9514-80b9705fe732'::uuid and ps.slug='pieroni_public')
  );
