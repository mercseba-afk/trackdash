-- Exact contemporary event photos for the two unnumbered Manta Ray Mk.II
-- metallic Releases whose source pages explicitly identify the pictured car.
-- URLs were HTTP-validated (200) in CI on 2026-09-21.

delete from public.release_images
where release_id in (
  'd0c9c45e-3d75-52d1-92cb-84cf9f5f2a07'::uuid,
  'd6617c26-9ec3-5adf-892f-ebeb1c782b70'::uuid
);

insert into public.release_images (id,release_id,url,position)
values
  (
    gen_random_uuid(),
    'd0c9c45e-3d75-52d1-92cb-84cf9f5f2a07',
    'https://www.tea-league.com/web/tamiyaadv2007026.jpg',
    0
  ),
  (
    gen_random_uuid(),
    'd6617c26-9ec3-5adf-892f-ebeb1c782b70',
    'https://www.tea-league.com/web/jcup20120715039.jpg',
    0
  );
