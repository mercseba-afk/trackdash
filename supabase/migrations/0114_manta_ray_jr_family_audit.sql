-- Manta Ray Jr. family audit: establish a conservative v4 baseline for the
-- two catalog Releases whose identity and release imagery are already durable.
--
-- Confirmed family variants NOT inserted yet:
--   18512 Manta Ray Jr. Black Special (1991)
--   49563 Manta Ray Jr. Fluorescent Color Special (1994)
--   92239 Manta Ray Jr. Orange Color Version / VS (2012)
--   92323/92324/92325/92326 Manta Ray Jr. Triton prize colors (2015)
-- They are real collector variants, but TrackDash still lacks a durable
-- release-specific catalog image URL for each. They remain audit follow-ups
-- rather than being published with guessed/fallback art.
--
-- Important correction: Black Special is ITEM 18512. ITEM 18513 belongs to
-- Super Astute Jr. Black Special; some community references mislabel it.

update public.product_releases
set
  release_date = date '1991-07-09',
  notes = 'Original Manta Ray Jr. on Zero chassis. The current official Tamiya page verifies ITEM 18035 and the model identity; historical Mini 4WD catalog references place the release on 1991-07-09. barcode_jan remains unset because currently indexed retail JAN data may correspond to later circulation/reproduction of ITEM 18035 rather than proving the barcode carried by the 1991 original package.',
  updated_at = now()
where id = 'b86d459a-bd44-5c68-b104-9ca4cedaf413';

update public.product_releases
set
  barcode_jan = '4950344180530',
  notes = 'Manta Ray Jr. VS-chassis release from February 2003. The official Tamiya product page verifies ITEM 18053 and VS chassis. Secondary historical sources disagree on the exact day (20 vs 24 February), so TrackDash preserves the existing 2003-02-20 catalog date but records the disagreement in provenance rather than claiming universal day-level certainty. JAN 4950344180530 is independently corroborated by Japanese specialist retail metadata.',
  updated_at = now()
where id = '5277616b-91d3-5f0c-b893-d77778beaf95';

update public.products
set
  description = 'The original Manta Ray Jr. Mini 4WD family, beginning with the Zero-chassis 18035 and later returning on VS chassis as 18053. TrackDash treats Black Special, fluorescent-color, Orange Version and Triton prize variants as distinct Releases when their identity and release-specific imagery can be verified.',
  description_it = 'La famiglia originale Manta Ray Jr. Mini 4WD, nata con la 18035 su telaio Zero e tornata successivamente su telaio VS come 18053. TrackDash considera Black Special, fluorescent-color, Orange Version e le varianti premio Triton come Release distinte quando identità e immagine specifica della Release possono essere verificate.',
  updated_at = now()
where id = '0b2e1cf8-6c19-5342-89ef-6a53b3f51af3';

insert into public.release_sources (
  id, release_id, source_type, source_url, verified_fields, checked_at, notes
) values
(
  '28b3676f-b217-4c00-9625-ad8495519195',
  'b86d459a-bd44-5c68-b104-9ca4cedaf413',
  'trusted_secondary',
  'https://w.atwiki.jp/mini4vipwiki/pages/105.html',
  array['releaseDate','releaseYear','chassis'],
  date '2026-09-19',
  'Historical Mini 4WD reference records ITEM 18035, Zero chassis and 1991-07-09 release date.'
),
(
  'd02e8a0c-ebf7-438e-ad22-33ce6b08c1e4',
  '5277616b-91d3-5f0c-b893-d77778beaf95',
  'trusted_secondary',
  'https://w.atwiki.jp/mini4vipwiki/pages/105.html',
  array['releaseDate','releaseYear','chassis'],
  date '2026-09-19',
  'Historical Mini 4WD reference records the VS-chassis 18053 release as 2003-02-20.'
),
(
  '9944fc07-9b6d-4842-8e0b-c8eb2182cb08',
  '5277616b-91d3-5f0c-b893-d77778beaf95',
  'trusted_secondary',
  'https://www.kaitori-world.jp/products/detail/276440',
  array['barcodeJAN','releaseYear','itemNumber'],
  date '2026-09-19',
  'Japanese specialist record corroborates ITEM 18053 and JAN 4950344180530, but lists 2003-02-24; TrackDash keeps this disagreement explicit.'
)
on conflict (id) do update set
  release_id=excluded.release_id,
  source_type=excluded.source_type,
  source_url=excluded.source_url,
  verified_fields=excluded.verified_fields,
  checked_at=excluded.checked_at,
  notes=excluded.notes;

-- Enter both durable Releases into Market Method v4. No valuation is invented.
-- Their Item Numbers are currently unique, so migration 0103 may safely enable
-- unattended eBay Active monitoring. If a future audited production occurrence
-- reuses either Item Number, the uniqueness trigger will automatically park all
-- affected eBay jobs.
insert into public.market_release_signals (
  release_id,
  condition,
  market_regime,
  market_value_eur,
  low_eur,
  high_eur,
  confidence_score,
  confidence_label,
  retail_anchor_eur,
  active_anchor_eur,
  sold_anchor_eur,
  retail_source_count,
  active_offer_count,
  current_offer_count,
  sold_units,
  sold_source_count,
  sold_evidence_count,
  shipping_known_ratio,
  algorithm_version,
  market_method_version,
  computed_at
)
select
  pr.id,
  'new_complete_unbuilt',
  'insufficient',
  null,
  null,
  null,
  0,
  'low',
  null,
  null,
  null,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  'r3',
  'v4',
  now()
from public.product_releases pr
where pr.id in (
  'b86d459a-bd44-5c68-b104-9ca4cedaf413',
  '5277616b-91d3-5f0c-b893-d77778beaf95'
)
on conflict (release_id, condition) do nothing;
