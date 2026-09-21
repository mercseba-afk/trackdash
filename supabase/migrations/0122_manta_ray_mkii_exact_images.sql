-- Manta Ray Mk.II exact official release images.
-- Every URL below was HTTP-validated against Tamiya's item-scoped image
-- archive before insertion. Specific Releases never inherit a family/sibling
-- image when their exact image is unavailable.

delete from public.release_images
where release_id in (
  '6a14c7a3-bd78-57b3-89fe-6c764818991a',
  '3eb8e671-b09a-5b2d-bb87-729676bd1237',
  'eeb02308-6a9a-5d0c-88ee-5a0fc127a0e8',
  'f1372ca5-e4ad-5994-b31b-2ccb9fc99b6f',
  'a98fe80b-1f8c-53e1-b26d-404daf93b77d',
  'b2805fb7-cdd3-5dbf-a724-f73d54702844',
  '4fdb8e31-07be-5907-9530-9a9bbe7edcf2'
);

insert into public.release_images (id, release_id, url, position)
values
(gen_random_uuid(),'6a14c7a3-bd78-57b3-89fe-6c764818991a','https://www.tamiya.com/japan_contents/img/usr/item/1/18615/18615_1.jpg',0),
(gen_random_uuid(),'3eb8e671-b09a-5b2d-bb87-729676bd1237','https://www.tamiya.com/japan_contents/img/usr/item/9/94593/94593_1.jpg',0),
(gen_random_uuid(),'eeb02308-6a9a-5d0c-88ee-5a0fc127a0e8','https://www.tamiya.com/japan_contents/img/usr/item/9/94665/94665_1.jpg',0),
(gen_random_uuid(),'f1372ca5-e4ad-5994-b31b-2ccb9fc99b6f','https://www.tamiya.com/japan_contents/img/usr/item/9/94709/94709_1.jpg',0),
(gen_random_uuid(),'a98fe80b-1f8c-53e1-b26d-404daf93b77d','https://www.tamiya.com/japan_contents/img/usr/item/9/95462/95462_1.jpg',0),
(gen_random_uuid(),'b2805fb7-cdd3-5dbf-a724-f73d54702844','https://www.tamiya.com/japan_contents/img/usr/item/9/95466/95466_1.jpg',0),
(gen_random_uuid(),'4fdb8e31-07be-5907-9530-9a9bbe7edcf2','https://www.tamiya.com/japan_contents/img/usr/item/9/95690/95690_1.jpg',0);
