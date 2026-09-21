-- Resolve previously unknown Manta Ray Mk.II production states from current official Tamiya USA pages.

update public.product_releases
set discontinued=true, production_status='discontinued', status_checked_at=date '2026-09-21'
where id in (
  '6a14c7a3-bd78-57b3-89fe-6c764818991a'::uuid,
  'b2805fb7-cdd3-5dbf-a724-f73d54702844'::uuid
);

insert into public.release_sources
  (id,release_id,source_type,source_url,verified_fields,checked_at,notes)
values
  (
    'ea1acda2-0965-44b3-a666-d2ec8ee55229',
    '6a14c7a3-bd78-57b3-89fe-6c764818991a',
    'official_manufacturer',
    'https://www.tamiyausa.com/shop/132-pro/jr-manta-ray-mkii/',
    array['itemNumber','productionStatus'],
    date '2026-09-21',
    'Official Tamiya USA page marks ITEM 18615 discontinued.'
  ),
  (
    '2ebeb25a-77f6-40cb-abe6-980cfa136793',
    'b2805fb7-cdd3-5dbf-a724-f73d54702844',
    'official_manufacturer',
    'https://www.tamiyausa.com/shop/132-pro/jr-manta-ray-mkii-black-sp-2/',
    array['itemNumber','productionStatus'],
    date '2026-09-21',
    'Official Tamiya USA page marks ITEM 95466 discontinued.'
  )
on conflict (id) do update set
  source_url=excluded.source_url,
  verified_fields=excluded.verified_fields,
  checked_at=excluded.checked_at,
  notes=excluded.notes;
