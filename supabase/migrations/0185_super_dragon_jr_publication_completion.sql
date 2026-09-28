-- Super Dragon Jr. publication-gate completion — 2026-09-28
--
-- The only research-only canonical Release (2907 Oshika first production)
-- now has multiple independent exact-release current-market traces.
-- These are retained as audit/source evidence only: no fake European ASK and
-- no new_complete_unbuilt Market Value is manufactured from them.

begin;

insert into public.release_sources(
  id,release_id,source_type,source_url,verified_fields,checked_at,notes
)
values
(
  gen_random_uuid(),
  'd7dd507c-e2a2-47ee-b36a-85b10b796464'::uuid,
  'other',
  'https://www.ebay.com/itm/406840808096',
  array['itemNumber','editionName'],
  date '2026-09-28',
  'Exact current eBay listing titled "Tamiya Super Dragon Jr. Mini 4WD No.2907". Condition is Used, so it is identity/market-presence evidence only and is not inserted into the new_complete_unbuilt Price Engine.'
),
(
  gen_random_uuid(),
  'd7dd507c-e2a2-47ee-b36a-85b10b796464'::uuid,
  'other',
  'https://auctions.yahoo.co.jp/search/search/%E3%82%B9%E3%83%BC%E3%83%91%E3%83%BC%E3%83%89%E3%83%A9%E3%82%B4%E3%83%B3jr./2084250966/',
  array['itemNumber','editionName','releaseYear'],
  date '2026-09-28',
  'Current Yahoo Auctions search exposes an exact active listing "Qp574 Vtg 1987 TAMIYA KIT 2907 MINI 4WD SUPER DRAGON JUNIOR ... 小鹿" at JPY 11,000. Used only as exact-release current-market corroboration; not a canonical Price Engine row.'
),
(
  gen_random_uuid(),
  'd7dd507c-e2a2-47ee-b36a-85b10b796464'::uuid,
  'other',
  'https://jp.mercari.com/search?keyword=%E3%83%9F%E3%83%8B%E5%9B%9B%E9%A7%86%E3%80%80%E5%B0%8F%E9%B9%BF',
  array['editionName','releaseYear'],
  date '2026-09-28',
  'Current Mercari Japan search independently exposes an unassembled Oshika Super Dragon Jr. and a "超初期2907 / 穴無し / 日本製" listing. Search-level evidence corroborates current market presence but is deliberately excluded from numeric Price Engine output.'
)
on conflict do nothing;

update public.product_releases
set catalog_visibility='public',
    catalog_visibility_reason='publication_gate:multiple_exact_current_market_traces_without_canonical_numeric_signal',
    catalog_visibility_updated_at=now(),
    notes=concat_ws(
      ' ',
      nullif(notes,''),
      'Publication-gate review 2026-09-28: multiple independent exact current-market traces now exist for KIT 2907 (Yahoo, Mercari, eBay). Release promoted to public. No numeric new_complete_unbuilt signal is forced because the cleanest specific eBay listing is Used and the Japanese search-level ASK evidence is not persisted as a canonical delivered offer.'
    ),
    updated_at=now()
where id='d7dd507c-e2a2-47ee-b36a-85b10b796464'::uuid;

update public.products
set metadata=jsonb_set(
      coalesce(metadata,'{}'::jsonb),
      '{catalog_publication_gate}',
      coalesce(metadata->'catalog_publication_gate','{}'::jsonb)
        || jsonb_build_object(
          'version','2026-09-28',
          'public_release_count',7,
          'research_only_release_count',0,
          'market_value_required',false
        ),
      true
    ),
    updated_at=now()
where id='d8c1c423-ae93-5f15-9caa-b7e1b5016760'::uuid;

commit;
