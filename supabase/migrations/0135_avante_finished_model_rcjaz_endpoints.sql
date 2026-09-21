-- Avante Mk.III finished-model exact RCJAZ endpoints.
-- Both pages are exact ITEM matches and currently Not Available; they are
-- preserved as historical retail references, never as current purchasable asks.

insert into public.market_scan_endpoints
  (id,release_id,source_id,endpoint_url,parser_kind,exact_release_verified,enabled)
select gen_random_uuid(),x.release_id,ps.id,x.endpoint_url,'generic_product_page',true,true
from (
  values
    ('921c4346-c48a-5a36-9438-65c9e4781107'::uuid,'rcjaz_public','https://www.rcjaz.co.uk/tamiya-94673-132-avante-mkiii-azure-finished-model-mini-4wd-p-90006533.html'),
    ('f66b9e6e-f7e5-57f2-8395-10125a0ae96c'::uuid,'rcjaz_public','https://www.rcjaz.com/tamiya-94674-132-avante-mkiii-nero-finished-model-kit-p-90006534.html')
) as x(release_id,source_slug,endpoint_url)
join public.price_sources ps on ps.slug=x.source_slug
on conflict (release_id,source_id,endpoint_url)
do update set exact_release_verified=true,enabled=true,updated_at=now();
