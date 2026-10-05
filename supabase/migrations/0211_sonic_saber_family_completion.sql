-- Sonic Saber family completion — 2026-10-05
--
-- Publication gate:
--   * 1994 Original has a documented exact-image gap, but now has exact
--     historical retail context tied to JAN 4950344194025.
--   * 2003 Reissue has an exact/current-generation image.
--   * 2011 Premium has an exact image plus active market context.
--
-- The historical AmiAmi row is context only. It is deliberately NOT inserted
-- into market_offer_states and therefore cannot become a current ASK, retail
-- anchor, SOLD anchor or Market Value.

begin;

insert into public.market_candidates (
  source_id,
  source_record_key,
  external_listing_id,
  original_source,
  original_record_id,
  listing_url,
  title_raw,
  item_number_observed,
  possible_release_ids,
  resolved_release_id,
  price,
  currency,
  shipping_cost,
  shipping_basis,
  observation_type,
  condition_raw,
  condition,
  inner_bags_sealed,
  box_condition,
  is_complete,
  is_lot,
  quantity,
  match_confidence,
  match_evidence,
  seller_fingerprint,
  evidence_group_key,
  decision,
  reason_codes,
  review_notes,
  needs_revalidation,
  raw_payload,
  observed_at,
  first_observed_at,
  last_observed_at,
  updated_at
)
select
  ps.id,
  'amiami:TOY-SCL-3382',
  null,
  'amiami',
  'TOY-SCL-3382',
  'https://www.amiami.jp/top/detail/detail?gcode=TOY-SCL-3382&page=related_item',
  'Sonic Saber [Tamiya] — historical retail page',
  '19402',
  array['e23951fd-63a5-5233-8c53-969c57e98819'::uuid],
  'e23951fd-63a5-5233-8c53-969c57e98819'::uuid,
  450,
  'JPY',
  null,
  'unknown',
  'retail_out_of_stock',
  '販売停止中 / 在庫切れ',
  'new_complete_unbuilt',
  'unknown',
  'unknown',
  true,
  false,
  1,
  'exact',
  array['item_number_exact','verified_endpoint_match','packaging_generation_match'],
  'amiami',
  null,
  'accepted',
  array['HISTORICAL_RETAIL_CONTEXT_ONLY'],
  'Exact historical AmiAmi retail context for JAN 4950344194025. Sold-out/stopped-sale page; price is historical context only and must not drive current ASK, SOLD or MV.',
  false,
  jsonb_build_object(
    'jan','4950344194025',
    'availability','out_of_stock',
    'reference_price_jpy',450,
    'context_only',true,
    'checked_at','2026-10-05'
  ),
  now(),
  now(),
  now(),
  now()
from public.price_sources ps
where ps.slug='amiami_public'
on conflict (source_id,source_record_key) do update set
  listing_url=excluded.listing_url,
  title_raw=excluded.title_raw,
  item_number_observed=excluded.item_number_observed,
  possible_release_ids=excluded.possible_release_ids,
  resolved_release_id=excluded.resolved_release_id,
  price=excluded.price,
  currency=excluded.currency,
  shipping_cost=null,
  shipping_basis='unknown',
  observation_type='retail_out_of_stock',
  condition_raw=excluded.condition_raw,
  condition='new_complete_unbuilt',
  is_complete=true,
  is_lot=false,
  quantity=1,
  match_confidence='exact',
  match_evidence=excluded.match_evidence,
  decision='accepted',
  reason_codes=excluded.reason_codes,
  review_notes=excluded.review_notes,
  needs_revalidation=false,
  raw_payload=excluded.raw_payload,
  last_observed_at=now(),
  updated_at=now();

update public.product_releases
set notes=concat_ws(
      ' ',
      nullif(notes,''),
      'Publication gate 2026-10-05: exact 1994 hero image remains intentionally unavailable; exact historical retail context is documented via AmiAmi JAN 4950344194025. No current ASK/MV is inferred from that sold-out page.'
    ),
    updated_at=now()
where id='e23951fd-63a5-5233-8c53-969c57e98819'::uuid;

update public.products
set metadata =
      coalesce(metadata,'{}'::jsonb)
      || jsonb_build_object(
        'launch_status','available',
        'launch_status_updated_at','2026-10-05',
        'launch_strategy','progressive_public_catalog_v1',
        'family_completion',jsonb_build_object(
          'completed_at','2026-10-05',
          'canonical_release_count',3,
          'exact_or_high_confidence_images',2,
          'documented_image_gaps',1,
          'market_watch_enrolled',true,
          'method','TrackDash current family method'
        )
      ),
    updated_at=now()
where id='896cc70e-3048-594d-9389-cb9808a5ad53'::uuid
  and coalesce(metadata->>'launch_status','available')='coming_soon';

commit;
