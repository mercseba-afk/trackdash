-- Thunder Dragon Jr. family re-audit — 2026-09-28
--
-- Re-checks the six researched collector identities against the current
-- TrackDash publication gate. The 1987 4-digit and 5-digit Oshika packages
-- remain separate collector Releases because the printed identifier is a
-- reliable physical discriminator and Mandarake catalogs them separately
-- under the same historical JAN.
--
-- No numeric Market Value / European ASK is manufactured here. Current
-- Japanese collector-market evidence is used only for publication eligibility.

begin;

-- 1987 five-digit Oshika production: neutralize the overly broad "later
-- production" label, persist the historically documented JAN, and promote
-- through exact current-market evidence without creating a numeric price row.
update public.product_releases
set edition_name = 'Thunder Dragon Jr. — 1987 Original (Oshika 5-digit No.18008)',
    barcode_jan = '4950344180080',
    catalog_visibility = 'public',
    catalog_visibility_reason = 'publication_gate:exact_current_collector_market_trace',
    catalog_visibility_updated_at = now(),
    notes = concat_ws(
      ' ',
      nullif(notes,''),
      'Re-audit 2026-09-28: the five-digit Oshika 18008 identity is kept distinct from the four-digit 2908 package because the printed number is a collector-visible physical discriminator. Mandarake catalogs both separately under JAN 4950344180080. A current Japanese marketplace listing explicitly identifies an unassembled Oshika-era Thunder Dragon Jr. as 18008; this is sufficient publication evidence but is not converted into a canonical European ASK because landed cost is not established.'
    ),
    updated_at = now()
where id = 'ef8c9a34-a78f-5f47-9f48-79460a21d40b'::uuid;

insert into public.release_sources (
  release_id, source_type, source_url, verified_fields, checked_at, notes
)
select
  'ef8c9a34-a78f-5f47-9f48-79460a21d40b'::uuid,
  'other',
  'https://fril.jp/brand/17163/category/827',
  array['itemNumber','editionName','marketPresence']::text[],
  date '2026-09-28',
  'Current Japanese marketplace result explicitly titled as an 80s Oshika Tamiya Thunder Dragon Jr. 18008, Japan-made and unassembled. Used only as exact-release current-market/publication evidence; no canonical EUR ASK is persisted because exact landed cost is not established.'
where not exists (
  select 1
  from public.release_sources
  where release_id = 'ef8c9a34-a78f-5f47-9f48-79460a21d40b'::uuid
    and source_url = 'https://fril.jp/brand/17163/category/827'
);

-- 1987 four-digit Oshika package: retain as a separate collector Release but
-- avoid claiming that every first production used 2908. Strong collector
-- documentation identifies a USA/export packaging example; Mandarake also
-- treats 2908 as a separate four-digit Oshika collectible under the same JAN.
update public.product_releases
set edition_name = 'Thunder Dragon Jr. — 1987 Oshika 4-digit KIT No.2908',
    catalog_visibility = 'public',
    catalog_visibility_reason = 'publication_gate:exact_collector_market_identity_and_current_buy_market',
    catalog_visibility_updated_at = now(),
    notes = concat_ws(
      ' ',
      nullif(notes,''),
      'Re-audit 2026-09-28: 2908 is retained as a distinct four-digit Oshika package identity, but the prior blanket label "First Production" is removed because surviving evidence is packaging-specific rather than proof that all earliest domestic production used 2908. Mandarake separately catalogs 2908 and five-digit 18008 under JAN 4950344180080; collector documentation also records a 2908 USA/export box. Exact current buy-market evidence is publication-grade context only and is not a canonical consumer ASK/SOLD signal.'
    ),
    updated_at = now()
where id = '9478e707-8ac2-4f91-8596-280393cbfc34'::uuid;

insert into public.release_sources (
  release_id, source_type, source_url, verified_fields, checked_at, notes
)
select
  '9478e707-8ac2-4f91-8596-280393cbfc34'::uuid,
  'trusted_secondary',
  'https://plaza.rakuten.co.jp/mini4museum/diary/202106070003/',
  array['itemNumber','editionName','packaging']::text[],
  date '2026-09-28',
  'Collector museum entry documents KIT NO.2908 as a Thunder Dragon Jr. USA/export package with Oshika address markings, while separately documenting the ordinary 18008 and 1998 limited reissue. Used to refine the 2908 packaging identity, not to infer a universal first-production chronology.'
where not exists (
  select 1
  from public.release_sources
  where release_id = '9478e707-8ac2-4f91-8596-280393cbfc34'::uuid
    and source_url = 'https://plaza.rakuten.co.jp/mini4museum/diary/202106070003/'
);

-- Product-level audit state. Non-autonomous occurrences stay documented
-- context rather than being inflated into extra catalog Releases.
update public.products
set metadata =
      coalesce(metadata,'{}'::jsonb)
      || jsonb_build_object(
        'catalog_audit','2026-09-28',
        'canonical_release_count',6,
        'unresolved_context',jsonb_build_array(
          'Lotte Racer Mini 4WD Chocolate prize Thunder Dragon Jr. is documented with selectable plated-body/chassis/wheel/tire colors. Because the prize was configurable rather than one fixed autonomous product identity, it is retained as promotion context only.',
          'Racer Mini 4WD Memorial Box Vol.2 (2005) contains a Thunder Dragon Jr. as part of a five-car set. It is retained as a set/production occurrence and is not duplicated as a standalone collector Release.'
        ),
        'catalog_publication_gate',jsonb_build_object(
          'version','2026-09-28',
          'public_release_count',6,
          'research_only_release_count',0,
          'market_value_required',false
        )
      ),
    updated_at = now()
where id = '9babb5d8-f8d0-5741-bb12-22e5a069015a'::uuid;

-- Re-stage only the unique-item eBay jobs for a final post-audit initial scan.
-- Shared ITEM 18008 eBay rows remain disabled/fail-closed.
update public.market_scan_queue
set priority = 130,
    next_scan_at = timestamp with time zone '2000-01-01 00:00:00+00'
where source_id = '709dcecf-d368-4742-b114-f00f5d7ed646'::uuid
  and scan_scope = 'active_marketplace'
  and enabled = true
  and release_id in (
    '9478e707-8ac2-4f91-8596-280393cbfc34'::uuid,
    'bbc9e062-ba69-5cf9-9228-de2de15640a6'::uuid,
    '650fcdc3-c510-4630-bff3-d176a68bf5c0'::uuid
  );

commit;
