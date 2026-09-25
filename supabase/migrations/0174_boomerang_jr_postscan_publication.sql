-- Boomerang Jr. post-scan publication promotion — 2026-09-25
--
-- 95003 passed the publication gate through exact item-number eBay ASK evidence.
-- 92394 is manually promoted after post-scan review of an exact collaboration
-- listing whose title omits the ITEM number but uniquely names the Tamiya Mini
-- 4WD Hiroshima Toyo Carp collaboration; structured condition is New.
--
-- No Market Value is manufactured from either ASK.

begin;

-- 95003: exact ITEM-number ASK evidence is already canonical and recomputed.
update public.product_releases
set catalog_visibility='public',
    catalog_visibility_reason='publication_gate:credible_exact_release_active_market_evidence',
    catalog_visibility_updated_at=now(),
    notes=concat_ws(' ',nullif(notes,''),
      'Post-scan audit 2026-09-25: exact ITEM 95003 eBay ASK evidence accepted. Four marketplace listings resolve to one seller (inamori-sangyo), so this is one commercial source, sufficient for publication context but not Market Value.'),
    updated_at=now()
where id='ab1cdae0-3284-4d50-a124-1ee028022d09'::uuid;

-- 92394: override the fail-closed automatic ITEM-number rule only after manual
-- review. The exact collaboration title + Tamiya/Mini 4WD/2018 Carp context
-- identifies the release even though "92394" is absent from the listing title.
update public.market_candidates
set possible_release_ids=array['e8196eca-258f-4d8f-9c1d-c54445e43602'::uuid],
    resolved_release_id='e8196eca-258f-4d8f-9c1d-c54445e43602'::uuid,
    item_number_observed=null,
    match_confidence='exact',
    match_evidence=array['edition_name_exact','release_year_stated','official_reference_match','manual_override'],
    evidence_group_key='ebay:sbaku_72:92394',
    decision='accepted',
    reason_codes=array[]::text[],
    review_notes='Manual post-scan audit 2026-09-25: exact Tamiya Mini 4WD Boomerang RS Hiroshima Toyo Carp Collaboration Limited Edition listing. Structured New condition; title uniquely identifies the collaboration despite ITEM 92394 being absent from title. One seller only; ASK context, not Market Value.',
    needs_revalidation=false,
    raw_payload=coalesce(raw_payload,'{}'::jsonb) || jsonb_build_object(
      'manual_review','boomerang_postscan_2026-09-25',
      'identity_basis','exact collaboration title + Tamiya Mini 4WD + 2018 Carp context'
    ),
    updated_at=now()
where id='d7712d59-8461-4af7-bfde-d3b416929b25'::uuid;

insert into public.market_offer_states(
  id,candidate_id,release_id,source_id,condition,channel,availability,seller_fingerprint,
  item_price,shipping_price,currency,item_price_eur,shipping_eur,effective_cost_eur,cost_basis,
  fx_rate_to_eur,fx_rate_date,first_seen_at,last_checked_at,changed_at,created_at,updated_at
)
select
  gen_random_uuid(),
  c.id,
  c.resolved_release_id,
  c.source_id,
  'new_complete_unbuilt',
  'marketplace',
  'in_stock',
  c.seller_fingerprint,
  c.price,
  0,
  c.currency,
  round(c.price * 0.8797396,2),
  0,
  round(c.price * 0.8797396,2),
  'delivered',
  0.8797396,
  date '2026-09-24',
  c.observed_at,
  c.observed_at,
  c.observed_at,
  now(),
  now()
from public.market_candidates c
where c.id='d7712d59-8461-4af7-bfde-d3b416929b25'::uuid
  and c.decision='accepted'
on conflict(candidate_id) do update set
  release_id=excluded.release_id,
  source_id=excluded.source_id,
  condition=excluded.condition,
  channel=excluded.channel,
  availability=excluded.availability,
  seller_fingerprint=excluded.seller_fingerprint,
  item_price=excluded.item_price,
  shipping_price=excluded.shipping_price,
  currency=excluded.currency,
  item_price_eur=excluded.item_price_eur,
  shipping_eur=excluded.shipping_eur,
  effective_cost_eur=excluded.effective_cost_eur,
  cost_basis=excluded.cost_basis,
  fx_rate_to_eur=excluded.fx_rate_to_eur,
  fx_rate_date=excluded.fx_rate_date,
  last_checked_at=excluded.last_checked_at,
  changed_at=excluded.changed_at,
  updated_at=now();

update public.product_releases
set catalog_visibility='public',
    catalog_visibility_reason='publication_gate:credible_manually_reviewed_exact_release_market_evidence',
    catalog_visibility_updated_at=now(),
    notes=concat_ws(' ',nullif(notes,''),
      'Post-scan audit 2026-09-25: exact collaboration ASK manually reviewed and accepted at USD 45 with shipping included. One seller only; publication context only, not Market Value.'),
    updated_at=now()
where id='e8196eca-258f-4d8f-9c1d-c54445e43602'::uuid;

update public.products
set metadata=jsonb_set(
      coalesce(metadata,'{}'::jsonb),
      '{catalog_publication_gate}',
      coalesce(metadata->'catalog_publication_gate','{}'::jsonb) ||
        jsonb_build_object(
          'version','2026-09-25',
          'public_release_count',5,
          'research_only_release_count',2,
          'market_value_required',false
        ),
      true
    ),
    updated_at=now()
where id='28b59956-2803-5602-ac02-ca3e58abd862'::uuid;

select public.trackdash_enqueue_market_recompute(
  'e8196eca-258f-4d8f-9c1d-c54445e43602'::uuid,
  'new_complete_unbuilt'
);

commit;
