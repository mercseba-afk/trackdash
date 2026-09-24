-- Avante Jr. shared-item market identity audit — 2026-09-24
-- Adds exact UPC/EAN discriminators for shared Item Numbers without promoting
-- non-Italy landed-cost observations into public acquisition pricing.

begin;

-- 18506 2012 reissue: exact EAN discriminator.
update public.product_releases
set barcode_jan='4950344185061',
    updated_at=now()
where id='7f3f7461-0dee-5d6a-b99d-36e2d910f0ef'::uuid;

insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
select gen_random_uuid(),'7f3f7461-0dee-5d6a-b99d-36e2d910f0ef'::uuid,'official_manufacturer',
       'https://www.tamiya.com/japan/products/18506/index.html',
       array['itemNumber','editionName','releaseYear','releaseDate','chassis'],date '2026-09-24',
       'Official Tamiya page confirms ITEM 18506 Black Special reissue, Type 2 chassis and 2012-06-16 release.'
where not exists (
  select 1 from public.release_sources
  where release_id='7f3f7461-0dee-5d6a-b99d-36e2d910f0ef'::uuid
    and source_url='https://www.tamiya.com/japan/products/18506/index.html'
);

insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
select gen_random_uuid(),'7f3f7461-0dee-5d6a-b99d-36e2d910f0ef'::uuid,'trusted_secondary',
       'https://www.ebay.it/itm/286107839351',
       array['barcodeJAN','marketAvailability'],date '2026-09-24',
       'Current exact eBay listing exposes EAN 4950344185061. Shipping shown by the public crawl targets a non-Italy destination, so it is identity/market context only.'
where not exists (
  select 1 from public.release_sources
  where release_id='7f3f7461-0dee-5d6a-b99d-36e2d910f0ef'::uuid
    and source_url='https://www.ebay.it/itm/286107839351'
);

-- Helper pattern: exact active listings for shared Item Numbers remain quarantined
-- as context-only when Italy-delivered cost is not verified. No market_offer_state
-- is created, therefore no "Disponibile da" can be published from these rows.

-- 18014 2024 reissue, exact UPC 4950344080878.
insert into public.market_candidates(
  id,source_id,source_record_key,external_listing_id,original_source,original_record_id,
  listing_url,title_raw,item_number_observed,possible_release_ids,resolved_release_id,
  price,currency,shipping_cost,shipping_basis,observation_type,condition_raw,condition,
  inner_bags_sealed,box_condition,is_complete,is_lot,quantity,match_confidence,
  match_evidence,seller_fingerprint,evidence_group_key,sold_at,sold_on,listing_date,
  observed_at,decision,reason_codes,review_notes,state_hash,needs_revalidation,raw_payload,
  first_observed_at,last_observed_at,updated_at
) values (
  gen_random_uuid(),'709dcecf-d368-4742-b114-f00f5d7ed646'::uuid,
  'v1|355841283752|0','355841283752','EBAY_US','355841283752',
  'https://www.ebay.com/itm/355841283752',
  'Tamiya 18014 1/32 Mini 4WD Car Kit Type 2 Chassis Jr Avante Junior',
  '18014',array['c680423c-a5eb-564c-afa6-953a105e9310'::uuid],null,
  11.50,'USD',11.00,'buyer_paid','active_listing','New','new_complete_unbuilt',
  'unknown','unknown',true,false,1,'exact',
  array['item_number_exact','manual_override'],'ebay:rcjaz',null,null,null,null,
  now(),'needs_review',array['SHARED_ITEM_NUMBER_REQUIRES_RELEASE_REVIEW','EXTRA_EU_LANDED_COST_UNKNOWN'],
  'Manual shared-item audit: UPC 4950344080878 resolves the 2024 18014 reissue exactly. Public crawl shipping is destination-specific outside Italy, so preserve as context only.',
  null,false,
  jsonb_build_object('adapter','manual-shared-item-audit-v1','upc','4950344080878','release_discriminator','2024 modern GTIN','landed_cost_italy','unknown','publication_lane','context_only'),
  now(),now(),now()
)
on conflict (source_id,source_record_key) do update set
  possible_release_ids=excluded.possible_release_ids,resolved_release_id=excluded.resolved_release_id,
  price=excluded.price,currency=excluded.currency,shipping_cost=excluded.shipping_cost,
  shipping_basis=excluded.shipping_basis,decision=excluded.decision,reason_codes=excluded.reason_codes,
  review_notes=excluded.review_notes,match_confidence=excluded.match_confidence,
  match_evidence=excluded.match_evidence,raw_payload=excluded.raw_payload,
  last_observed_at=excluded.last_observed_at,updated_at=excluded.updated_at;

-- 18506 2012 reissue, exact EAN 4950344185061.
insert into public.market_candidates(
  id,source_id,source_record_key,external_listing_id,original_source,original_record_id,
  listing_url,title_raw,item_number_observed,possible_release_ids,resolved_release_id,
  price,currency,shipping_cost,shipping_basis,observation_type,condition_raw,condition,
  inner_bags_sealed,box_condition,is_complete,is_lot,quantity,match_confidence,
  match_evidence,seller_fingerprint,evidence_group_key,sold_at,sold_on,listing_date,
  observed_at,decision,reason_codes,review_notes,state_hash,needs_revalidation,raw_payload,
  first_observed_at,last_observed_at,updated_at
) values (
  gen_random_uuid(),'709dcecf-d368-4742-b114-f00f5d7ed646'::uuid,
  'v1|286107839351|0','286107839351','EBAY_IT','286107839351',
  'https://www.ebay.it/itm/286107839351',
  'KIT TAMIYA 1/32 Model AVANTE JUNIOR Black Special Racing Mini 4WD series NEW',
  '18506',array['7f3f7461-0dee-5d6a-b99d-36e2d910f0ef'::uuid],null,
  20.00,'EUR',50.00,'buyer_paid','active_listing','New','new_complete_unbuilt',
  'unknown','unknown',true,false,1,'exact',
  array['item_number_exact','manual_override'],'ebay:giochi-di-gabry-store',null,null,null,null,
  now(),'needs_review',array['SHARED_ITEM_NUMBER_REQUIRES_RELEASE_REVIEW','DELIVERY_DESTINATION_NOT_ITALY_VERIFIED'],
  'Manual shared-item audit: EAN 4950344185061 identifies the 2012 18506 reissue. Seller is in Italy, but the crawl shipping quote targets a non-Italy destination; do not publish it as Italy delivered cost.',
  null,false,
  jsonb_build_object('adapter','manual-shared-item-audit-v1','ean','4950344185061','release_discriminator','2012 EAN','landed_cost_italy','unknown','publication_lane','context_only'),
  now(),now(),now()
)
on conflict (source_id,source_record_key) do update set
  possible_release_ids=excluded.possible_release_ids,resolved_release_id=excluded.resolved_release_id,
  price=excluded.price,currency=excluded.currency,shipping_cost=excluded.shipping_cost,
  shipping_basis=excluded.shipping_basis,decision=excluded.decision,reason_codes=excluded.reason_codes,
  review_notes=excluded.review_notes,match_confidence=excluded.match_confidence,
  match_evidence=excluded.match_evidence,raw_payload=excluded.raw_payload,
  last_observed_at=excluded.last_observed_at,updated_at=excluded.updated_at;

-- 95501 2019 event reissue, exact UPC 4950344955015.
insert into public.market_candidates(
  id,source_id,source_record_key,external_listing_id,original_source,original_record_id,
  listing_url,title_raw,item_number_observed,possible_release_ids,resolved_release_id,
  price,currency,shipping_cost,shipping_basis,observation_type,condition_raw,condition,
  inner_bags_sealed,box_condition,is_complete,is_lot,quantity,match_confidence,
  match_evidence,seller_fingerprint,evidence_group_key,sold_at,sold_on,listing_date,
  observed_at,decision,reason_codes,review_notes,state_hash,needs_revalidation,raw_payload,
  first_observed_at,last_observed_at,updated_at
) values (
  gen_random_uuid(),'709dcecf-d368-4742-b114-f00f5d7ed646'::uuid,
  'v1|113828254570|0','113828254570','EBAY_IT','113828254570',
  'https://www.ebay.it/itm/113828254570',
  'Tamiya 95501 1/32 Mini 4WD Car Kit Type 2 Chassis Jr Avante Junior Black Special',
  '95501',array['7fd567d7-4d97-5323-88c4-d501efd3bdac'::uuid],null,
  11.90,'USD',11.00,'buyer_paid','active_listing','New','new_complete_unbuilt',
  'unknown','unknown',true,false,1,'exact',
  array['item_number_exact','release_year_stated','manual_override'],'ebay:rcjaz',null,null,null,null,
  now(),'needs_review',array['SHARED_ITEM_NUMBER_REQUIRES_RELEASE_REVIEW','DELIVERY_DESTINATION_NOT_ITALY_VERIFIED'],
  'Manual shared-item audit: listing states Year 2019 and UPC 4950344955015, uniquely resolving the 2019 event reissue. The displayed shipping/import calculation is not Italy-specific, so it remains context only.',
  null,false,
  jsonb_build_object('adapter','manual-shared-item-audit-v1','upc','4950344955015','year',2019,'observed_sold_counter',143,'release_discriminator','2019 UPC + year','landed_cost_italy','unknown','publication_lane','context_only'),
  now(),now(),now()
)
on conflict (source_id,source_record_key) do update set
  possible_release_ids=excluded.possible_release_ids,resolved_release_id=excluded.resolved_release_id,
  price=excluded.price,currency=excluded.currency,shipping_cost=excluded.shipping_cost,
  shipping_basis=excluded.shipping_basis,decision=excluded.decision,reason_codes=excluded.reason_codes,
  review_notes=excluded.review_notes,match_confidence=excluded.match_confidence,
  match_evidence=excluded.match_evidence,raw_payload=excluded.raw_payload,
  last_observed_at=excluded.last_observed_at,updated_at=excluded.updated_at;

-- 95501 modern commercial line (2021 + 2024 production wave), exact UPC 4950344080885.
insert into public.market_candidates(
  id,source_id,source_record_key,external_listing_id,original_source,original_record_id,
  listing_url,title_raw,item_number_observed,possible_release_ids,resolved_release_id,
  price,currency,shipping_cost,shipping_basis,observation_type,condition_raw,condition,
  inner_bags_sealed,box_condition,is_complete,is_lot,quantity,match_confidence,
  match_evidence,seller_fingerprint,evidence_group_key,sold_at,sold_on,listing_date,
  observed_at,decision,reason_codes,review_notes,state_hash,needs_revalidation,raw_payload,
  first_observed_at,last_observed_at,updated_at
) values (
  gen_random_uuid(),'709dcecf-d368-4742-b114-f00f5d7ed646'::uuid,
  'v1|404964386256|0','404964386256','EBAY_IT','404964386256',
  'https://www.ebay.it/itm/404964386256',
  'Tamiya 1/32 JR Avante Black Special Edition Type 2 Chassis Mini 4WD Kit',
  '95501',array['aea3091e-b0aa-5258-9aea-e94bf44893c9'::uuid],null,
  10.00,'USD',null,'unknown','active_listing','New','new_complete_unbuilt',
  'unknown','unknown',true,false,1,'exact',
  array['item_number_exact','manual_override'],'ebay:amain-sports',null,null,null,null,
  now(),'needs_review',array['SHARED_ITEM_NUMBER_REQUIRES_RELEASE_REVIEW','EXTRA_EU_LANDED_COST_UNKNOWN'],
  'Manual shared-item audit: UPC 4950344080885 resolves the modern 95501 line (initial 2021 Release, later 2024 production wave). Italy-delivered cost is not verified, so this is context only.',
  null,false,
  jsonb_build_object('adapter','manual-shared-item-audit-v1','upc','4950344080885','release_discriminator','modern 95501 UPC','landed_cost_italy','unknown','publication_lane','context_only'),
  now(),now(),now()
)
on conflict (source_id,source_record_key) do update set
  possible_release_ids=excluded.possible_release_ids,resolved_release_id=excluded.resolved_release_id,
  price=excluded.price,currency=excluded.currency,shipping_cost=excluded.shipping_cost,
  shipping_basis=excluded.shipping_basis,decision=excluded.decision,reason_codes=excluded.reason_codes,
  review_notes=excluded.review_notes,match_confidence=excluded.match_confidence,
  match_evidence=excluded.match_evidence,raw_payload=excluded.raw_payload,
  last_observed_at=excluded.last_observed_at,updated_at=excluded.updated_at;

commit;
