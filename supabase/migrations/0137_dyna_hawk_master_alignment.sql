-- Dyna-Hawk GX family alignment with current TrackDash Method Master.
-- Keeps Release identity exact while preserving verified visual equivalence
-- between 94717 (2010) and 95467 (2019 reissue), and records the canonical
-- JAN/GTIN for 95467 from Tamiya USA's 2026 MAP list.

begin;

-- 94717 and 95467 are distinct Releases but visually identical in the
-- represented kit configuration. Reuse the same Tamiya visual asset only
-- because the exact 94717 RCJAZ page and exact-market observations verify
-- that equivalence.
insert into public.release_images (id, release_id, url, position)
select
  gen_random_uuid(),
  '1ede5023-9035-5342-b207-6242c5f5190a'::uuid,
  'https://www.tamiya.com/japan_contents/img/usr/item/9/95467/95467_1.jpg',
  0
where not exists (
  select 1
  from public.release_images
  where release_id = '1ede5023-9035-5342-b207-6242c5f5190a'::uuid
    and url = 'https://www.tamiya.com/japan_contents/img/usr/item/9/95467/95467_1.jpg'
);

update public.release_sources
set
  verified_fields = case
    when 'image' = any(verified_fields) then verified_fields
    else array_append(verified_fields, 'image')
  end,
  checked_at = date '2026-09-22',
  notes = 'RCJAZ exact ITEM 94717 page and multiple exact-market observations confirm the 94717 and later 95467 reissue are visually identical in the represented kit configuration. TrackDash therefore permits the same visual asset for 94717 as a verified visual-equivalence representation, while preserving distinct Release identity, year and item number.'
where release_id = '1ede5023-9035-5342-b207-6242c5f5190a'::uuid
  and source_url like '%rcjaz%'
  and source_url like '%94717%';

-- Tamiya USA MAP 2026-02-04 confirms ITEM 95467 / GTIN 4950344954674.
update public.product_releases
set
  barcode_jan = '4950344954674',
  updated_at = now()
where id = 'ace0d1b1-aaf3-589a-977c-a3df07c83c73'::uuid;

insert into public.release_sources (
  id,
  release_id,
  source_type,
  source_url,
  verified_fields,
  checked_at,
  notes
)
select
  gen_random_uuid(),
  'ace0d1b1-aaf3-589a-977c-a3df07c83c73'::uuid,
  'official_manufacturer',
  'https://www.tamiyausa.com/media/files/map-feb-2026-1239-08db.pdf',
  array['itemNumber','barcodeJAN'],
  date '2026-09-22',
  'Tamiya USA MAP price list dated 2026-02-04 lists ITEM 95467 and GTIN/JAN 4950344954674.'
where not exists (
  select 1
  from public.release_sources
  where release_id = 'ace0d1b1-aaf3-589a-977c-a3df07c83c73'::uuid
    and source_url = 'https://www.tamiyausa.com/media/files/map-feb-2026-1239-08db.pdf'
);

commit;
