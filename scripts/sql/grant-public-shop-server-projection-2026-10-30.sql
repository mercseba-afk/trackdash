-- Public mercatino server projection. Idempotent, read-only column grants.
-- RLS and anon/authenticated permissions are unchanged.
begin;
grant select (id,user_id,collection_item_id,product_id,release_id,condition,share_mode,asking_price,asking_currency,updated_at) on public.collection_shares to service_role;
grant select (user_id,username) on public.collector_profiles to service_role;
grant select (id,name,metadata,brand_id) on public.products to service_role;
grant select (id,slug) on public.brands to service_role;
grant select (product_id,url,position) on public.product_images to service_role;
grant select (release_id,url,position) on public.release_images to service_role;
commit;
