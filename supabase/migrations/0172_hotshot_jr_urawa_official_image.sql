-- Hotshot Jr. Urawa Reds exact official image — 2026-09-25
-- Source: official Urawa Red Diamonds collaboration announcement.
-- The image is linked directly under the Hotshot Jr. Urawa Reds Edition entry.

begin;

insert into public.release_images (id, release_id, url, position)
select
  gen_random_uuid(),
  'ace88dc1-f049-49fa-803c-961948e2f733'::uuid,
  'https://www.urawa-reds.co.jp/wp-content/uploads/2023/09/914tamiya_2.jpg',
  0
where not exists (
  select 1
  from public.release_images
  where release_id='ace88dc1-f049-49fa-803c-961948e2f733'::uuid
    and url='https://www.urawa-reds.co.jp/wp-content/uploads/2023/09/914tamiya_2.jpg'
);

update public.release_sources
set verified_fields = case
      when not ('image' = any(verified_fields)) then array_append(verified_fields,'image')
      else verified_fields
    end,
    notes = concat_ws(' ', nullif(notes,''),
      'Exact Release image verified from the official Urawa Red Diamonds collaboration announcement.'),
    checked_at = date '2026-09-25'
where release_id='ace88dc1-f049-49fa-803c-961948e2f733'::uuid
  and source_url='https://www.urawa-reds.co.jp/clubinfo/203696/';

update public.product_releases
set notes=concat_ws(' ',nullif(notes,''),
      'Image audit 2026-09-25: exact official Urawa Reds Edition product image attached from the club launch announcement.'),
    updated_at=now()
where id='ace88dc1-f049-49fa-803c-961948e2f733'::uuid;

commit;
