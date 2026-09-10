-- Dyna-Hawk GX family audit (2026-09-10).
-- Canonical family after evidence review:
-- 19201 original (1998), 94717 Super XX Special (2010),
-- 95000 Black Special (2013), 95467 Super XX Special reissue (2019).
--
-- This migration deliberately does NOT manufacture values from current asks.
-- It re-attributes the already captured exact eBay Product Research row for
-- 95467 to the correct Release and publishes its demonstrated sold anchor.
-- Trend stays NULL because monthly chronological Product Research has not yet
-- been captured for this family.

insert into public.product_releases (
  id, product_id, item_number, release_type, edition_name, edition_type,
  release_year, release_date, chassis, barcode_jan, color, country_market,
  notes, discontinued, is_original, rarity, verification_status,
  production_status, status_checked_at
) values (
  '67423b20-d880-5e54-a83f-dc06dcba6f75',
  'd3b4ad34-05ac-592e-ad93-fab4cfde0a5a',
  '95000', 'Limited Edition', 'Dyna-Hawk GX Black Special (Super XX Chassis)', 'limited',
  2013, date '2013-12-21', 'Super XX', '4950344950003',
  'Black body / red Super XX chassis / red tires', 'Japan',
  'Documented Dyna-Hawk GX Black Special; exact identity corroborated by Bic Camera and HLJ.',
  true, false, 'Rare', 'verified', 'discontinued', now()
)
on conflict (id) do update set
  item_number=excluded.item_number,
  release_type=excluded.release_type,
  edition_name=excluded.edition_name,
  edition_type=excluded.edition_type,
  release_year=excluded.release_year,
  release_date=excluded.release_date,
  chassis=excluded.chassis,
  barcode_jan=excluded.barcode_jan,
  color=excluded.color,
  country_market=excluded.country_market,
  notes=excluded.notes,
  discontinued=excluded.discontinued,
  rarity=excluded.rarity,
  verification_status=excluded.verification_status,
  production_status=excluded.production_status,
  status_checked_at=excluded.status_checked_at,
  updated_at=now();

-- Stronger catalog provenance for the audited family.
insert into public.release_sources (id,release_id,source_type,source_url,verified_fields,checked_at,notes)
values
  ('a9e1dcba-2a3e-54ee-a921-4d9f2eb06df8','67423b20-d880-5e54-a83f-dc06dcba6f75','trusted_secondary','https://www.biccamera.com/bc/item/1428801/',array['itemNumber','editionName','chassis','releaseYear','releaseDate','color'],date '2026-09-10','Bic Camera Tamiya record identifies ITEM 95000 Black Special, Super XX, manufacturer release date 2013-12-21 and black/red specification.'),
  ('5dfbc8ff-c71a-5375-9637-a1055b4b7d7e','67423b20-d880-5e54-a83f-dc06dcba6f75','trusted_secondary','https://www.hlj.com/dyna-hawk-gx-black-sp-super-xx-tam95000',array['itemNumber','barcodeJAN','chassis','productionStatus'],date '2026-09-10','HLJ corroborates TAM95000 / JAN 4950344950003 and marks the item discontinued. Its 2013-12-19 availability date is not used over the 2013-12-21 manufacturer release date.'),
  ('854ce4c5-1920-57e9-8111-ce1fb07da00f','1ede5023-9035-5342-b207-6242c5f5190a','official_catalog_pdf','https://www.fantasyland.it/wordpress/wp-content/themes/fantasyland/documenti/tamiya/volantini/TA_2010-02.pdf',array['itemNumber','editionName','chassis','releaseYear'],date '2026-09-10','Archived Tamiya Italy February 2010 flyer identifies TA 94717 Dyna-Hawk GX as a limited-edition Super XX kit.'),
  ('4db23491-03cf-5c5d-b94d-f13b6cca2fdb','ace0d1b1-aaf3-589a-977c-a3df07c83c73','official_manufacturer','https://www.tamiyausa.com/shop/132-super/jr-dyna-hawk-gx-super-xx-sp-2/',array['itemNumber','editionName','chassis','productionStatus'],date '2026-09-10','Tamiya USA identifies ITEM 95467 as Dyna-Hawk GX Super XX Special and explicitly marks it Discontinued.')
on conflict (id) do update set
  source_type=excluded.source_type,
  source_url=excluded.source_url,
  verified_fields=excluded.verified_fields,
  checked_at=excluded.checked_at,
  notes=excluded.notes;

update public.product_releases
set discontinued=true,
    production_status='discontinued',
    status_checked_at=now(),
    rarity='Uncommon',
    updated_at=now()
where id='ace0d1b1-aaf3-589a-977c-a3df07c83c73';

update public.product_releases
set rarity='Rare', verification_status='verified', updated_at=now()
where id='1ede5023-9035-5342-b207-6242c5f5190a';

-- Exact 95000 package image. It is deliberately third-party visual evidence;
-- identity is established independently by the release_sources above.
insert into public.release_images (id,release_id,url,position)
values (
  '298572dc-7db3-5ecd-bfdb-a6f576d272a3',
  '67423b20-d880-5e54-a83f-dc06dcba6f75',
  'https://down-my.img.susercontent.com/file/my-11134207-23020-ly1e1975dwnva2',
  0
)
on conflict (id) do update set url=excluded.url, position=excluded.position;

-- The Seller Hub pilot searched 94717 and returned an exact 95467 row. It was
-- correctly excluded from 94717 as OTHER_ITEM_NUMBER. Re-attribute that exact
-- row to 95467: 37 sold, average item price EUR 13.25, last sale 2026-08-20.
with src as (
  select id from public.price_sources where slug='ebay_product_research'
)
insert into public.market_aggregate_observations (
  source_id, release_id, item_number, possible_release_ids, attribution_status,
  grain, period_start, period_end, condition, query_key, query_description,
  sales_count, seller_count, average_item_price, average_shipping, currency,
  market_average_eur, evidence_grade, provenance_url, raw_payload, captured_at
)
select
  src.id,
  'ace0d1b1-aaf3-589a-977c-a3df07c83c73',
  '95467',
  array['ace0d1b1-aaf3-589a-977c-a3df07c83c73'::uuid],
  'release_exact',
  'full_history',
  date '2023-09-10',
  date '2026-08-20',
  'new_complete_unbuilt',
  'ebay-pr:95467:3y-new:2026-09-09',
  'eBay Seller Hub Product Research exact 95467 row recovered from the 94717 pilot query.',
  37, 1, 13.25, 9.46, 'EUR', 13.25, 'indicative',
  'https://www.ebay.it/sh/research?marketplace=ALL&keywords=Tamiya+94717&dayRange=1095&endDate=1788965171537&startDate=1694357171537&categoryId=0&conditionId=1000&offset=0&limit=50&tabName=SOLD&tz=Europe%2FRome',
  jsonb_build_object(
    'source','ebay_product_research_pilot',
    'listing_id','113590230950',
    'listing_title','Tamiya 95467 1/32 JR Mini 4WD Car Kit Super XX Chassis Dyna-Hawk GX Special',
    'query_period_end','2026-09-09',
    'true_last_sale_date','2026-08-20',
    'sales_count',37,
    'average_item_price_eur',13.25,
    'average_shipping_eur',9.46,
    'note','Originally captured in a 94717 query and excluded from 94717 because the title specifies ITEM 95467; now attributed to the correct Release.'
  ),
  now()
from src
on conflict (source_id,query_key,period_start,period_end,item_number) do update set
  release_id=excluded.release_id,
  possible_release_ids=excluded.possible_release_ids,
  attribution_status=excluded.attribution_status,
  grain=excluded.grain,
  condition=excluded.condition,
  query_description=excluded.query_description,
  sales_count=excluded.sales_count,
  seller_count=excluded.seller_count,
  average_item_price=excluded.average_item_price,
  average_shipping=excluded.average_shipping,
  currency=excluded.currency,
  market_average_eur=excluded.market_average_eur,
  evidence_grade=excluded.evidence_grade,
  provenance_url=excluded.provenance_url,
  raw_payload=excluded.raw_payload,
  captured_at=excluded.captured_at,
  updated_at=now();

-- Frozen Market Method v1 result for the exact 95467 evidence above.
-- One fresh Product Research aggregate is sold evidence, not an ask; with no
-- two-source liquid retail anchor, the demonstrated sold anchor is the headline.
insert into public.market_release_signals (
  release_id,condition,market_regime,market_value_eur,low_eur,high_eur,
  confidence_score,confidence_label,retail_anchor_eur,active_anchor_eur,sold_anchor_eur,
  starting_offer_candidate_id,starting_item_price_eur,starting_shipping_eur,
  starting_effective_cost_eur,starting_cost_basis,retail_source_count,
  active_offer_count,current_offer_count,sold_units,sold_source_count,
  sold_evidence_count,shipping_known_ratio,trend_percent,trend_window_months,
  algorithm_version,computed_at
) values (
  'ace0d1b1-aaf3-589a-977c-a3df07c83c73','new_complete_unbuilt',
  'secondary_market_driven',13.25,13.25,13.25,
  69,'medium',null,null,13.25,
  null,null,null,null,null,0,0,0,37,1,1,0,null,null,'r3',now()
)
on conflict (release_id,condition) do update set
  market_regime=excluded.market_regime,
  market_value_eur=excluded.market_value_eur,
  low_eur=excluded.low_eur,
  high_eur=excluded.high_eur,
  confidence_score=excluded.confidence_score,
  confidence_label=excluded.confidence_label,
  retail_anchor_eur=excluded.retail_anchor_eur,
  active_anchor_eur=excluded.active_anchor_eur,
  sold_anchor_eur=excluded.sold_anchor_eur,
  starting_offer_candidate_id=null,
  starting_item_price_eur=null,
  starting_shipping_eur=null,
  starting_effective_cost_eur=null,
  starting_cost_basis=null,
  retail_source_count=0,
  active_offer_count=0,
  current_offer_count=0,
  sold_units=37,
  sold_source_count=1,
  sold_evidence_count=1,
  shipping_known_ratio=0,
  trend_percent=null,
  trend_window_months=null,
  algorithm_version='r3',
  computed_at=now();
