-- Avante Mk.II 95061 JAN provenance follow-up (2026-09-11).
-- The official Tamiya product page establishes the exact release identity/date/spec,
-- while Hobby Search explicitly exposes JAN 4950344950614. Keep those factual
-- responsibilities separate instead of attributing the JAN to the wrong source.

insert into public.release_sources (
  id, release_id, source_type, source_url, verified_fields, checked_at, notes
) values (
  'd25aca1f-2fe0-50c4-ae52-db2a2077cf72',
  'c819da54-1ebc-5a8b-a24f-77166cf70e8d',
  'trusted_secondary',
  'https://www.1999.co.jp/10314802',
  array['itemNumber','barcodeJAN','editionName','chassis'],
  date '2026-09-11',
  'Hobby Search identifies ITEM 95061 / JAN 4950344950614 as Avante Mk.II Pink Special (Clear Body) on MS chassis.'
)
on conflict (id) do update set
  release_id=excluded.release_id,
  source_type=excluded.source_type,
  source_url=excluded.source_url,
  verified_fields=excluded.verified_fields,
  checked_at=excluded.checked_at,
  notes=excluded.notes;
