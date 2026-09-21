-- Exact RCJAZ endpoint for Avante Mk.III Azure Clear Blue Special ITEM 94777.
insert into public.market_scan_endpoints
  (id,release_id,source_id,endpoint_url,parser_kind,exact_release_verified,enabled)
select gen_random_uuid(),
       '3495bf78-89ab-57c4-84fc-f6f300c85a4e'::uuid,
       ps.id,
       'https://www.rcjaz.com/tamiya-94777-avante-iii-azure-clear-blue-sp-p-90022364.html',
       'generic_product_page',true,true
from public.price_sources ps
where ps.slug='rcjaz_public'
on conflict (release_id,source_id,endpoint_url)
do update set exact_release_verified=true,enabled=true,updated_at=now();
