-- Poseidon-X 2006 reissue exact-product image — 2026-10-10
-- Audited at 800x800 JPEG, displaying the black Poseidon-X Black Special kit
-- with matching product identity on specialist retailer SKU page.
-- Source identifies the 2006 commercial reissue; do not reuse for 1993 original.
-- Domain and exact pathname are constrained in next.config.mjs.

begin;

insert into public.release_images(id,release_id,url,position)
select gen_random_uuid(),
  'c37d4161-aa31-535b-b1de-9040730a4cdd',
  'https://myrcstation.com/cdn/shop/products/96b79938ea5aeb7c1d696355af5e2d88_1200x1200.jpg?v=1630399392',
  0
where not exists (
  select 1 from public.release_images
  where release_id='c37d4161-aa31-535b-b1de-9040730a4cdd'
    and url='https://myrcstation.com/cdn/shop/products/96b79938ea5aeb7c1d696355af5e2d88_1200x1200.jpg?v=1630399392'
);

update public.products
set metadata=jsonb_set(coalesce(metadata,'{}'::jsonb),'{family_audit,image_gaps}','1'::jsonb,true),
    updated_at=now()
where id='e8a13fb8-4af2-5f5f-936e-8871d9567289'
  and metadata->>'launch_status'='coming_soon';

commit;
