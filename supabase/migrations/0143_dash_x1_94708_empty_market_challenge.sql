-- DASH-X1 Proto-Emperor 94708 Empty Market Challenge — 2026-09-22
-- Persist the exact current eBay context without promoting it into the
-- new_complete_unbuilt European public signal.

insert into public.market_candidates(
  id,source_id,source_record_key,external_listing_id,original_source,original_record_id,
  listing_url,title_raw,item_number_observed,possible_release_ids,resolved_release_id,
  price,currency,shipping_cost,shipping_basis,observation_type,condition_raw,condition,
  inner_bags_sealed,box_condition,is_complete,is_lot,quantity,match_confidence,match_evidence,
  evidence_group_key,observed_at,decision,reason_codes,review_notes,needs_revalidation,
  raw_payload,first_observed_at,last_observed_at
) values (
  gen_random_uuid(),
  '709dcecf-d368-4742-b114-f00f5d7ed646'::uuid,
  'v1|168420036281|0',
  '168420036281',
  'EBAY_US',
  '168420036281',
  'https://www.ebay.com/itm/168420036281',
  'TAMIYA 94708 Mini 4WD DASH-X1 PROTO-EMPEROR (VS Chassis)',
  '94708',
  array['593d8ef0-21ab-52c4-b8dc-15bf726c955a'::uuid],
  '593d8ef0-21ab-52c4-b8dc-15bf726c955a'::uuid,
  100.00,
  'USD',
  null,
  'unknown',
  'active_listing',
  'eBay category Used; seller notes unused, never painted or assembled, no damaged or missing accessories',
  'unknown',
  'unknown',
  'normal',
  true,
  false,
  1,
  'exact',
  array['item_number_exact','edition_name_exact','chassis_stated'],
  'ebay:168420036281',
  now(),
  'needs_review',
  array['EXTRA_EU_LANDED_COST_UNKNOWN'],
  'Empty Market Challenge 2026-09-22: exact current eBay listing exists at USD 100, but platform condition is Used while seller text describes unused/unassembled. Target new_complete_unbuilt condition is therefore not promoted automatically. European/Italy landed cost is not verified. Kept as current global market context, not a public European observed price.',
  false,
  jsonb_build_object(
    'adapter','manual-empty-market-challenge-v1',
    'market_region','global',
    'target_condition','unresolved',
    'landed_cost_europe','unknown',
    'source_crawl_verified','2026-09-22'
  ),
  now(),
  now()
)
on conflict (source_id,source_record_key) do update set
  listing_url=excluded.listing_url,
  title_raw=excluded.title_raw,
  item_number_observed=excluded.item_number_observed,
  possible_release_ids=excluded.possible_release_ids,
  resolved_release_id=excluded.resolved_release_id,
  price=excluded.price,
  currency=excluded.currency,
  shipping_cost=excluded.shipping_cost,
  shipping_basis=excluded.shipping_basis,
  observation_type=excluded.observation_type,
  condition_raw=excluded.condition_raw,
  condition=excluded.condition,
  is_complete=excluded.is_complete,
  is_lot=excluded.is_lot,
  quantity=excluded.quantity,
  match_confidence=excluded.match_confidence,
  match_evidence=excluded.match_evidence,
  decision=excluded.decision,
  reason_codes=excluded.reason_codes,
  review_notes=excluded.review_notes,
  needs_revalidation=false,
  raw_payload=excluded.raw_payload,
  observed_at=excluded.observed_at,
  last_observed_at=excluded.last_observed_at,
  updated_at=now();

update public.product_releases
set notes=case
  when coalesce(notes,'') like '%Empty Market Challenge 2026-09-22%' then notes
  else concat_ws(' ',nullif(notes,''),
    'Empty Market Challenge 2026-09-22: exact current eBay listing observed at USD 100, but platform condition is Used while seller text says unused/unassembled; European landed cost is not verified. RCJAZ exact is out of stock. No current offer qualifies for automatic new_complete_unbuilt European publication.')
  end,
  updated_at=now()
where id='593d8ef0-21ab-52c4-b8dc-15bf726c955a'::uuid;
