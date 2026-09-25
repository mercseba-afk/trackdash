-- Hornet Jr. 1998 Memorial exact image backfill — 2026-09-25

begin;

insert into public.release_images(id,release_id,url,position)
select
  gen_random_uuid(),
  '554acb0b-0987-551b-8619-c3bff7e3bab0'::uuid,
  'https://img.mandarake.co.jp/aucimg/5/1/4/5/0002715145.jpeg',
  0
where not exists (
  select 1 from public.release_images
  where release_id='554acb0b-0987-551b-8619-c3bff7e3bab0'::uuid
    and url='https://img.mandarake.co.jp/aucimg/5/1/4/5/0002715145.jpeg'
);

insert into public.release_sources(
  id,release_id,source_type,source_url,verified_fields,checked_at,notes
)
values(
  gen_random_uuid(),
  '554acb0b-0987-551b-8619-c3bff7e3bab0'::uuid,
  'trusted_secondary',
  'https://ekizo.mandarake.co.jp/auction/item/itemInfoEn.html?index=769463',
  array['editionName','image'],
  date '2026-09-25',
  'Exact Hornet Jr. reissue-box archive; first auction image asset 0002715145.jpeg is stored as the canonical Release image.'
)
on conflict do nothing;

update public.product_releases
set notes=concat_ws(' ',nullif(notes,''),
      'Image backfill 2026-09-25: exact Mandarake archive image added from auction index 769463.'),
    updated_at=now()
where id='554acb0b-0987-551b-8619-c3bff7e3bab0'::uuid;

commit;
