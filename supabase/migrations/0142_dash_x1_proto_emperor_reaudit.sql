-- DASH-X1 Proto-Emperor family re-audit — 2026-09-22
-- Canonical family remains four complete Mini 4WD Releases:
-- 94708 (2009 VS), 18074 Premium (2013), 95450 Black Special (2019),
-- and the distinct Sanfrecce Hiroshima 2023 collector edition based on ITEM 18074.
-- 92063 is a body-parts-only predecessor and is intentionally not a Product Release.

update public.product_releases
set rarity='Rare',
    production_status='discontinued',
    discontinued=true,
    status_checked_at=now(),
    notes=case
      when coalesce(notes,'') like '%TrackDash re-audit 2026-09-22%' then notes
      else concat_ws(' ',nullif(notes,''),
        'TrackDash re-audit 2026-09-22: complete 2009 VS kit confirmed; 92063 remains excluded because it is a body-parts-only predecessor. RCJAZ exact page is out of stock.')
    end,
    updated_at=now()
where id='593d8ef0-21ab-52c4-b8dc-15bf726c955a'::uuid;

update public.product_releases
set barcode_jan='4950344180745',
    production_status='active',
    discontinued=false,
    rarity='Common',
    status_checked_at=now(),
    notes=case
      when coalesce(notes,'') like '%TrackDash re-audit 2026-09-22%' then notes
      else concat_ws(' ',nullif(notes,''),
        'TrackDash re-audit 2026-09-22: standard Premium remains a distinct Release from the 2023 Sanfrecce collaboration despite shared ITEM 18074. Current Tamiya USA 2026 MAP identifies JAN 4950344180745; older/regional retailer metadata also circulates 4950344063888, so scanner identity must continue to fail closed on the shared Item Number.')
    end,
    updated_at=now()
where id='0226dfa5-5e29-5557-b134-ddbad7682e28'::uuid;

update public.product_releases
set barcode_jan='4950344954506',
    rarity='Uncommon',
    status_checked_at=now(),
    notes=case
      when coalesce(notes,'') like '%TrackDash re-audit 2026-09-22%' then notes
      else concat_ws(' ',nullif(notes,''),
        'TrackDash re-audit 2026-09-22: JAN 4950344954506 independently corroborated by Hobby Search, RCJAZ and eBay. Current residual retail stock is observable; production status remains intentionally unknown unless Tamiya documents current production.')
    end,
    updated_at=now()
where id='6168c423-9f3e-5495-9a1d-06185ea7fa34'::uuid;

update public.product_releases
set production_status='discontinued',
    discontinued=true,
    rarity='Rare',
    status_checked_at=now(),
    notes=case
      when coalesce(notes,'') like '%TrackDash re-audit 2026-09-22%' then notes
      else concat_ws(' ',nullif(notes,''),
        'TrackDash re-audit 2026-09-22: official Sanfrecce Hiroshima announcement documents the one-match 2023 collaboration sale on 2023-07-08 at JPY 2,750. It is a distinct collector edition based on ITEM 18074, not a new autonomous Tamiya Item Number.')
    end,
    updated_at=now()
where id='2928fbca-b220-5d72-9b03-417ab13a70d8'::uuid;

insert into public.release_images(id,release_id,url,position)
select gen_random_uuid(),
       '2928fbca-b220-5d72-9b03-417ab13a70d8'::uuid,
       'https://static.www.sanfrecce.co.jp/images/news/2023/07/0703_02_02.jpg',
       0
where not exists (
  select 1
  from public.release_images
  where release_id='2928fbca-b220-5d72-9b03-417ab13a70d8'::uuid
    and url='https://static.www.sanfrecce.co.jp/images/news/2023/07/0703_02_02.jpg'
);

insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
select gen_random_uuid(),
       '0226dfa5-5e29-5557-b134-ddbad7682e28'::uuid,
       'official_catalog_pdf',
       'https://www.tamiyausa.com/media/files/map-feb-2026-1239-08db.pdf',
       array['barcodeJAN','productionStatus'],
       date '2026-09-22',
       'Tamiya USA MAP price list effective 2026-02-04 lists ITEM 18074 at USD 17.10 with JAN 4950344180745 and UPC 044455286206.'
where not exists (
  select 1 from public.release_sources
  where release_id='0226dfa5-5e29-5557-b134-ddbad7682e28'::uuid
    and source_url='https://www.tamiyausa.com/media/files/map-feb-2026-1239-08db.pdf'
);

insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
select gen_random_uuid(),
       '593d8ef0-21ab-52c4-b8dc-15bf726c955a'::uuid,
       'trusted_secondary',
       'https://www.rcjaz.com/tamiya-94708-132-jr-dashx1-proto-emperor-vs-chassis-model-kit-p-90014148.html',
       array['itemNumber','editionName','chassis','marketAvailability'],
       date '2026-09-22',
       'Exact RCJAZ product page confirms ITEM 94708 / VS chassis and historical out-of-stock retail context. No raw image URL is promoted because a stable exact asset URL was not established.'
where not exists (
  select 1 from public.release_sources
  where release_id='593d8ef0-21ab-52c4-b8dc-15bf726c955a'::uuid
    and source_url='https://www.rcjaz.com/tamiya-94708-132-jr-dashx1-proto-emperor-vs-chassis-model-kit-p-90014148.html'
);

insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
select gen_random_uuid(),
       '6168c423-9f3e-5495-9a1d-06185ea7fa34'::uuid,
       'trusted_secondary',
       'https://www.rcjaz.co.uk/protoemperor-premium-black-special-by-tamiya-95450-superii-chassis-mini-4wd-kit-p-12543.html',
       array['itemNumber','editionName','chassis','barcodeJAN','marketAvailability'],
       date '2026-09-22',
       'Exact RCJAZ page confirms ITEM 95450, GTIN 4950344954506, Brand New and current Add to Cart availability. Extra-EU landed cost to Europe remains unknown.'
where not exists (
  select 1 from public.release_sources
  where release_id='6168c423-9f3e-5495-9a1d-06185ea7fa34'::uuid
    and source_url='https://www.rcjaz.co.uk/protoemperor-premium-black-special-by-tamiya-95450-superii-chassis-mini-4wd-kit-p-12543.html'
);

insert into public.market_candidates(
  id,source_id,source_record_key,original_source,original_record_id,listing_url,title_raw,item_number_observed,
  possible_release_ids,resolved_release_id,price,currency,shipping_cost,shipping_basis,observation_type,
  condition_raw,condition,inner_bags_sealed,box_condition,is_complete,is_lot,quantity,match_confidence,
  match_evidence,evidence_group_key,observed_at,decision,reason_codes,review_notes,needs_revalidation,
  raw_payload,first_observed_at,last_observed_at
) values (
  gen_random_uuid(),'c19c7599-69b4-4211-9ef0-f620845a689c'::uuid,'rcjaz:94708','rcjaz_public','94708',
  'https://www.rcjaz.com/tamiya-94708-132-jr-dashx1-proto-emperor-vs-chassis-model-kit-p-90014148.html',
  'Tamiya 94708 JR Dash-X1 Proto Emperor VS Chassis Model Kit','94708',
  array['593d8ef0-21ab-52c4-b8dc-15bf726c955a'::uuid],'593d8ef0-21ab-52c4-b8dc-15bf726c955a'::uuid,
  15.45,'USD',null,'unknown','retail_out_of_stock','Not Available','new_complete_unbuilt','unknown','unknown',
  true,false,1,'exact',array['item_number_exact','edition_name_exact','chassis_stated'],
  'retail:rcjaz:94708',now(),'accepted',array['OUT_OF_STOCK_HISTORICAL_ONLY'],
  'Exact RCJAZ page: USD 15.45, Not Available. Retained only as historical retail context; not a current European offer.',
  false,jsonb_build_object('adapter','manual-reaudit-v1','availability','out_of_stock','market_region','asia_pacific','provenance_kind','exact_product_page'),
  now(),now()
)
on conflict (source_id,source_record_key) do update set
  listing_url=excluded.listing_url,title_raw=excluded.title_raw,item_number_observed=excluded.item_number_observed,
  possible_release_ids=excluded.possible_release_ids,resolved_release_id=excluded.resolved_release_id,price=excluded.price,
  currency=excluded.currency,shipping_cost=excluded.shipping_cost,shipping_basis=excluded.shipping_basis,
  observation_type=excluded.observation_type,condition_raw=excluded.condition_raw,condition=excluded.condition,
  is_complete=excluded.is_complete,is_lot=excluded.is_lot,quantity=excluded.quantity,match_confidence=excluded.match_confidence,
  match_evidence=excluded.match_evidence,decision=excluded.decision,reason_codes=excluded.reason_codes,
  review_notes=excluded.review_notes,needs_revalidation=false,raw_payload=excluded.raw_payload,
  observed_at=excluded.observed_at,last_observed_at=excluded.last_observed_at,updated_at=now();

insert into public.market_candidates(
  id,source_id,source_record_key,original_source,original_record_id,listing_url,title_raw,item_number_observed,
  possible_release_ids,resolved_release_id,price,currency,shipping_cost,shipping_basis,observation_type,
  condition_raw,condition,inner_bags_sealed,box_condition,is_complete,is_lot,quantity,match_confidence,
  match_evidence,evidence_group_key,observed_at,decision,reason_codes,review_notes,needs_revalidation,
  raw_payload,first_observed_at,last_observed_at
) values (
  gen_random_uuid(),'c19c7599-69b4-4211-9ef0-f620845a689c'::uuid,'rcjaz:18074:standard','rcjaz_public','18074',
  'https://www.rcjaz.com/tamiya-18074-jr-dashx1-proto-emperor-premium-super-ii-chassis-p-90059083.html',
  'Tamiya 18074 JR Dash-X1 Proto Emperor Premium Super II Chassis','18074',
  array['0226dfa5-5e29-5557-b134-ddbad7682e28'::uuid],'0226dfa5-5e29-5557-b134-ddbad7682e28'::uuid,
  11.80,'USD',null,'unknown','retail_in_stock','Brand New','new_complete_unbuilt','unknown','unknown',
  true,false,1,'exact',array['item_number_exact','verified_endpoint_match','edition_name_exact','chassis_stated'],
  'retail:rcjaz:18074:standard',now(),'accepted',array['EXTRA_EU_LANDED_COST_UNKNOWN'],
  'Exact verified RCJAZ endpoint for the standard 18074 Premium; current RCJAZ catalog shows USD 11.80 Buy Now. Independent extra-EU breadth context only because European landed cost is unknown.',
  false,jsonb_build_object('adapter','manual-reaudit-v1','availability','in_stock','market_region','asia_pacific','provenance_kind','exact_product_page','landed_cost_europe','unknown'),
  now(),now()
)
on conflict (source_id,source_record_key) do update set
  listing_url=excluded.listing_url,title_raw=excluded.title_raw,item_number_observed=excluded.item_number_observed,
  possible_release_ids=excluded.possible_release_ids,resolved_release_id=excluded.resolved_release_id,price=excluded.price,
  currency=excluded.currency,shipping_cost=excluded.shipping_cost,shipping_basis=excluded.shipping_basis,
  observation_type=excluded.observation_type,condition_raw=excluded.condition_raw,condition=excluded.condition,
  is_complete=excluded.is_complete,is_lot=excluded.is_lot,quantity=excluded.quantity,match_confidence=excluded.match_confidence,
  match_evidence=excluded.match_evidence,decision=excluded.decision,reason_codes=excluded.reason_codes,
  review_notes=excluded.review_notes,needs_revalidation=false,raw_payload=excluded.raw_payload,
  observed_at=excluded.observed_at,last_observed_at=excluded.last_observed_at,updated_at=now();

insert into public.market_candidates(
  id,source_id,source_record_key,original_source,original_record_id,listing_url,title_raw,item_number_observed,
  possible_release_ids,resolved_release_id,price,currency,shipping_cost,shipping_basis,observation_type,
  condition_raw,condition,inner_bags_sealed,box_condition,is_complete,is_lot,quantity,match_confidence,
  match_evidence,evidence_group_key,observed_at,decision,reason_codes,review_notes,needs_revalidation,
  raw_payload,first_observed_at,last_observed_at
) values (
  gen_random_uuid(),'c19c7599-69b4-4211-9ef0-f620845a689c'::uuid,'rcjaz:95450','rcjaz_public','95450',
  'https://www.rcjaz.co.uk/protoemperor-premium-black-special-by-tamiya-95450-superii-chassis-mini-4wd-kit-p-12543.html',
  'Tamiya 95450 Proto-Emperor Premium Black Special Super-II Chassis Mini 4WD Kit','95450',
  array['6168c423-9f3e-5495-9a1d-06185ea7fa34'::uuid],'6168c423-9f3e-5495-9a1d-06185ea7fa34'::uuid,
  10.63,'GBP',null,'unknown','retail_in_stock','Brand New','new_complete_unbuilt','unknown','unknown',
  true,false,1,'exact',array['item_number_exact','edition_name_exact','official_reference_match','chassis_stated'],
  'retail:rcjaz:95450',now(),'accepted',array['EXTRA_EU_LANDED_COST_UNKNOWN'],
  'Exact RCJAZ page shows ITEM 95450, GTIN 4950344954506 and Add to Cart at GBP 10.63. Current extra-EU breadth context only; unknown European landed cost cannot numerically corroborate or lower European Market Value.',
  false,jsonb_build_object('gtin','4950344954506','adapter','manual-reaudit-v1','availability','in_stock','market_region','asia_pacific','provenance_kind','exact_product_page','landed_cost_europe','unknown'),
  now(),now()
)
on conflict (source_id,source_record_key) do update set
  listing_url=excluded.listing_url,title_raw=excluded.title_raw,item_number_observed=excluded.item_number_observed,
  possible_release_ids=excluded.possible_release_ids,resolved_release_id=excluded.resolved_release_id,price=excluded.price,
  currency=excluded.currency,shipping_cost=excluded.shipping_cost,shipping_basis=excluded.shipping_basis,
  observation_type=excluded.observation_type,condition_raw=excluded.condition_raw,condition=excluded.condition,
  is_complete=excluded.is_complete,is_lot=excluded.is_lot,quantity=excluded.quantity,match_confidence=excluded.match_confidence,
  match_evidence=excluded.match_evidence,decision=excluded.decision,reason_codes=excluded.reason_codes,
  review_notes=excluded.review_notes,needs_revalidation=false,raw_payload=excluded.raw_payload,
  observed_at=excluded.observed_at,last_observed_at=excluded.last_observed_at,updated_at=now();

insert into public.market_candidates(
  id,source_id,source_record_key,external_listing_id,original_source,original_record_id,listing_url,title_raw,
  item_number_observed,possible_release_ids,resolved_release_id,price,currency,shipping_cost,shipping_basis,
  observation_type,condition_raw,condition,inner_bags_sealed,box_condition,is_complete,is_lot,quantity,
  match_confidence,match_evidence,evidence_group_key,observed_at,decision,reason_codes,review_notes,
  needs_revalidation,raw_payload,first_observed_at,last_observed_at
) values (
  gen_random_uuid(),'709dcecf-d368-4742-b114-f00f5d7ed646'::uuid,'v1|206562162850|0','206562162850',
  'EBAY_US','206562162850','https://www.ebay.com/itm/206562162850',
  'TAMIYA Mini 4WD Proto Emperor Sanfrecce Hiroshima SP [Box only] 10 pieces','18074',
  array['2928fbca-b220-5d72-9b03-417ab13a70d8'::uuid],'2928fbca-b220-5d72-9b03-417ab13a70d8'::uuid,
  195.99,'USD',0,'included_exact','active_listing','Box only, 10 pieces','unknown','unknown','unknown',
  false,true,10,'exact',array['edition_name_exact','manual_override'],
  'ebay:206562162850',now(),'rejected',array['BOX_ONLY','LOT_NOT_UNIT_PRICEABLE'],
  'Exact Sanfrecce identity but the listing is explicitly box-only and a 10-piece lot; excluded from current kit pricing and Market Value.',
  false,jsonb_build_object('adapter','manual-reaudit-v1','listing_kind','box_only_lot','quantity',10),
  now(),now()
)
on conflict (source_id,source_record_key) do update set
  external_listing_id=excluded.external_listing_id,listing_url=excluded.listing_url,title_raw=excluded.title_raw,
  resolved_release_id=excluded.resolved_release_id,price=excluded.price,currency=excluded.currency,
  shipping_cost=excluded.shipping_cost,shipping_basis=excluded.shipping_basis,observation_type=excluded.observation_type,
  condition_raw=excluded.condition_raw,condition=excluded.condition,is_complete=excluded.is_complete,
  is_lot=excluded.is_lot,quantity=excluded.quantity,match_confidence=excluded.match_confidence,
  match_evidence=excluded.match_evidence,decision=excluded.decision,reason_codes=excluded.reason_codes,
  review_notes=excluded.review_notes,needs_revalidation=false,raw_payload=excluded.raw_payload,
  observed_at=excluded.observed_at,last_observed_at=excluded.last_observed_at,updated_at=now();

-- Unique Item Numbers auto-enroll safely; shared ITEM 18074 remains tied only to
-- the previously curated exact standard-Premium endpoint.
select public.trackdash_enroll_rcjaz_endpoint(
  '593d8ef0-21ab-52c4-b8dc-15bf726c955a'::uuid,
  'https://www.rcjaz.com/tamiya-94708-132-jr-dashx1-proto-emperor-vs-chassis-model-kit-p-90014148.html'
);
select public.trackdash_enroll_rcjaz_endpoint(
  '6168c423-9f3e-5495-9a1d-06185ea7fa34'::uuid,
  'https://www.rcjaz.co.uk/protoemperor-premium-black-special-by-tamiya-95450-superii-chassis-mini-4wd-kit-p-12543.html'
);

-- Re-evaluate all four Releases with the frozen current Market Method.
select public.trackdash_enqueue_market_recompute(id,'new_complete_unbuilt')
from public.product_releases
where product_id='1acf7850-c8a9-5627-b104-54db6e235ba2'::uuid;
