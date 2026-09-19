-- Avante Jr. family audit + first clean Market Method v4 enrollment.
--
-- Rules applied:
-- - catalog identity is independent from market coverage;
-- - real Release waves are kept separate even when Tamiya reused an Item Number;
-- - exact release dates stay NULL when only the year/month is sufficiently supported;
-- - historical Releases may use a later official/reissue product photo only when it
--   depicts the exact physical variant; notes never claim archival packaging;
-- - no Market Value is invented. Baseline signals are "insufficient" and simply
--   enroll each Release into the v4 monitoring pipeline.
--
-- Deliberately NOT inserted in this migration:
--   18507 Avante Jr. Special Version (1990)
--   93001 Avante Jr. Champion's Gold (1993)
--   92210 Avante RS Purple Special (2009)
-- Their identities are strongly evidenced, but TrackDash still lacks a durable
-- release-specific image source suitable for the catalog. They remain audit
-- follow-ups rather than being published with guessed/fallback art.

-- Complete the well-supported missing Release waves.
insert into public.product_releases (
  id, product_id, item_number, release_type, edition_name, release_year,
  release_date, chassis, barcode_jan, color, country_market, notes,
  discontinued, is_original, rarity, data_source, edition_type,
  verification_status, production_status, status_checked_at
) values
(
  '934803bc-4ff1-5a5a-9965-b9ed5d448215',
  '82b478fd-21dd-5c93-82fb-bf50461a107d',
  '18506',
  'Color Special',
  'Avante Jr. Black Special (1989 Original)',
  1989,
  null,
  'Type 2',
  null,
  'Smoke / Black',
  null,
  'Original Black Special wave. Tamiya documents the Black Special first-release month as September 1989 and the historical item line as 18506. Exact day is intentionally not inferred. The catalog image is an official Tamiya USA re-release photo of the same Black Special visual specification, not an archival 1989 box photo.',
  true,
  false,
  null,
  'tamiya_official',
  'color_special',
  'verified',
  'discontinued',
  now()
),
(
  '9258d58c-2654-510f-b5ac-9b141ed318dc',
  '82b478fd-21dd-5c93-82fb-bf50461a107d',
  '18058',
  'Chassis Variant',
  'Avante RS',
  2004,
  null,
  'VS',
  '4950344180585',
  'Blue',
  null,
  'Tamiya confirms ITEM 18058 Avante RS, VS chassis and first release in December 2004. Exact day is intentionally left unset because the official source used by TrackDash states the month, not the day.',
  false,
  false,
  null,
  'tamiya_official',
  'other',
  'verified',
  'unknown',
  now()
),
(
  '3338f1a5-609b-507d-8102-2594bc818365',
  '82b478fd-21dd-5c93-82fb-bf50461a107d',
  '18014',
  'Reissue',
  'Avante Jr. (2012 Reissue)',
  2012,
  null,
  'Type 2',
  null,
  'Blue',
  null,
  'Documented 2012 production/reissue wave of ITEM 18014. Secondary contemporary sources disagree on the exact May release day, so TrackDash records the year only. The official current 18014 image depicts the same model specification but is not claimed as archival 2012 packaging.',
  true,
  false,
  null,
  'trusted_secondary',
  'reissue',
  'partial',
  'discontinued',
  now()
),
(
  '2615c6b3-b497-547e-9d80-bdf9c1eca91b',
  '82b478fd-21dd-5c93-82fb-bf50461a107d',
  '95060',
  'Clear Body',
  'Avante Jr. Yellow Special (Clear Body)',
  2015,
  date '2015-03-28',
  'VS',
  '4950344950607',
  'Clear / Yellow',
  null,
  'Tamiya Junior News documents ITEM 95060, the clear PET Avante Jr. body, reinforced white VS chassis and March 28, 2015 release. Special-planning products may be produced intermittently, so TrackDash does not invent a permanent production-status conclusion.',
  false,
  false,
  null,
  'tamiya_official',
  'special',
  'verified',
  'unknown',
  now()
),
(
  '7fd567d7-4d97-5323-88c4-d501efd3bdac',
  '82b478fd-21dd-5c93-82fb-bf50461a107d',
  '95501',
  'Reissue',
  'Avante Jr. Black Special (2019 Reissue)',
  2019,
  null,
  'Type 2',
  null,
  'Smoke / Black',
  'Japan',
  'Documented 2019 Japanese reissue/event wave of the Black Special under ITEM 95501. Secondary historical references conflict on the exact July/August release day, so TrackDash stores only the year. The catalog image is official current Tamiya media of the same 95501 visual specification, not claimed as archival 2019 packaging.',
  true,
  false,
  null,
  'trusted_secondary',
  'reissue',
  'partial',
  'discontinued',
  now()
),
(
  'aea3091e-b0aa-5258-9aea-e94bf44893c9',
  '82b478fd-21dd-5c93-82fb-bf50461a107d',
  '95501',
  'Reissue',
  'Avante Jr. Black Special (2021 Reissue)',
  2021,
  null,
  'Type 2',
  null,
  'Smoke / Black',
  null,
  'Tamiya USA official April 2021 pricing documentation confirms ITEM 95501 Avante Jr. Black Special in the 2021 product line. Secondary historical references place the wave in March 2021; TrackDash leaves the exact day unset until an official day-level source is found. The catalog image is official current Tamiya media of the same 95501 visual specification.',
  true,
  false,
  null,
  'audited_mixed',
  'reissue',
  'partial',
  'discontinued',
  now()
)
on conflict (id) do update set
  product_id = excluded.product_id,
  item_number = excluded.item_number,
  release_type = excluded.release_type,
  edition_name = excluded.edition_name,
  release_year = excluded.release_year,
  release_date = excluded.release_date,
  chassis = excluded.chassis,
  barcode_jan = excluded.barcode_jan,
  color = excluded.color,
  country_market = excluded.country_market,
  notes = excluded.notes,
  discontinued = excluded.discontinued,
  is_original = excluded.is_original,
  rarity = excluded.rarity,
  data_source = excluded.data_source,
  edition_type = excluded.edition_type,
  verification_status = excluded.verification_status,
  production_status = excluded.production_status,
  status_checked_at = excluded.status_checked_at,
  updated_at = now();

-- Improve the currently published 2024 rows with official barcode provenance.
update public.product_releases
set
  barcode_jan = '4950344080878',
  updated_at = now()
where id = 'c680423c-a5eb-564c-afa6-953a105e9310'
  and item_number = '18014'
  and release_year = 2024;

update public.product_releases
set
  barcode_jan = '4950344080885',
  notes = 'Official 2024 Black Special reissue. Tamiya Japan confirms the September 7, 2024 release and Type 2 specification; Tamiya USA official pricing data confirms the current JAN. Release art now uses official Tamiya media rather than the previous retailer fallback.',
  updated_at = now()
where id = '91bcff13-76b4-5a09-a83b-1cfb85400b40'
  and item_number = '95501'
  and release_year = 2024;

update public.products
set
  description = 'The Avante Jr. Mini 4WD family, beginning with the 1988 Type 2 original and expanding through Black Special, RS/VS, clear-body, anniversary and later reissue waves. TrackDash keeps each production wave separate whenever year, Item Number or edition identity distinguishes it.',
  description_it = 'La famiglia Mini 4WD Avante Jr., nata con l’originale Type 2 del 1988 e ampliata nel tempo con Black Special, varianti RS/VS, clear body, anniversari e ristampe successive. TrackDash mantiene separate le diverse ondate produttive quando anno, Item Number o identità dell’edizione permettono di distinguerle.',
  updated_at = now()
where id = '82b478fd-21dd-5c93-82fb-bf50461a107d';

-- Provenance for the newly added waves.
insert into public.release_sources (
  id, release_id, source_type, source_url, verified_fields, checked_at, notes
) values
(
  'da0d9ede-bce9-5d7e-a286-75e9f80606e9',
  '934803bc-4ff1-5a5a-9965-b9ed5d448215',
  'official_manufacturer',
  'https://www.tamiya.com/japan/products/95501/index.html',
  array['editionName','releaseYear','chassis','color'],
  date '2026-09-19',
  'Current official Black Special page states the first-release month was September 1989 and confirms the Type 2 / Black Special specification.'
),
(
  '0fb128d3-4ec3-523d-b106-c500e39fd2d2',
  '934803bc-4ff1-5a5a-9965-b9ed5d448215',
  'official_archive',
  'https://tamiya.com/japan/newitems_month/list.html?catalog_open_month=201804&current=198909&genre_item=&sortkey=',
  array['itemNumber','releaseYear'],
  date '2026-09-19',
  'Tamiya historical monthly listing associates ITEM 18506 with the September 1989 Black Special release month.'
),
(
  '1e8f8550-4aa4-570b-ab3f-8963341a31df',
  '9258d58c-2654-510f-b5ac-9b141ed318dc',
  'official_manufacturer',
  'https://www.tamiya.com/japan/products/18058/index.html',
  array['itemNumber','editionName','releaseYear','chassis'],
  date '2026-09-19',
  'Official Tamiya page: ITEM 18058 Avante RS, VS chassis, first release December 2004.'
),
(
  '5b7b423c-0b58-5660-bc92-b81344d85fe3',
  '9258d58c-2654-510f-b5ac-9b141ed318dc',
  'trusted_secondary',
  'https://www.1999.co.jp/eng/search?typ1_c=109&cat=&target=Series&sortid=6&searchkey=Avante+RS+18058',
  array['barcodeJAN'],
  date '2026-09-19',
  'Hobby Search product metadata is used only for the JAN value; identity/year/chassis are backed by Tamiya.'
),
(
  '514fef4c-e6d7-5e6a-8f2d-cd8725d9c52b',
  '3338f1a5-609b-507d-8102-2594bc818365',
  'trusted_secondary',
  'https://webmail.tqrchobbies.com/index.php?Itemid=89&option=com_k2&tag=May+2012&task=tag&view=itemlist',
  array['itemNumber','editionName','releaseYear','chassis'],
  date '2026-09-19',
  'Contemporary 2012 Tamiya new-item copy reproduced by the retailer documents ITEM 18014 Avante Jr. Type 2 in the May 2012 product cycle.'
),
(
  '2ca9eb07-d027-5a10-ba64-3c5f3b78d76d',
  '3338f1a5-609b-507d-8102-2594bc818365',
  'trusted_secondary',
  'https://www.pieronimodellismo.it/tamiya-18014-avante-jr-mini-4wd-8891.html',
  array['releaseYear'],
  date '2026-09-19',
  'Retail product history independently states the prior production wave was 2012. Exact day is intentionally not taken from secondary disagreement.'
),
(
  'e02de5bc-35ef-582e-bc25-4d96a3af595c',
  '2615c6b3-b497-547e-9d80-bdf9c1eca91b',
  'official_catalog_pdf',
  'https://www.tamiya.com/cms/japan/mini4wd/jr_news/jr_news15/pdf/000176.pdf',
  array['itemNumber','editionName','releaseYear','releaseDate','chassis','color'],
  date '2026-09-19',
  'Tamiya Junior News documents ITEM 95060 and March 28 release, clear PET body, reinforced white VS chassis and Yellow Special specification.'
),
(
  '6f2d18a2-a645-55b2-9759-34fa82ea82a6',
  '2615c6b3-b497-547e-9d80-bdf9c1eca91b',
  'trusted_secondary',
  'https://www.amiami.jp/top/detail/detail?gcode=TOY-SCL2-42599-R',
  array['barcodeJAN'],
  date '2026-09-19',
  'AmiAmi metadata used only to corroborate JAN 4950344950607.'
),
(
  '61b7759d-11bd-5881-9ac7-60fad3d82c31',
  '7fd567d7-4d97-5323-88c4-d501efd3bdac',
  'trusted_secondary',
  'https://mini-4wd.fandom.com/wiki/Avante_Jr.',
  array['itemNumber','editionName','releaseYear','chassis','color'],
  date '2026-09-19',
  'Historical community catalog records the 2019 ITEM 95501 Black Special reissue. Exact date is not promoted because secondary references conflict.'
),
(
  'db81a2c6-59ea-50d8-9e60-44f277aed071',
  'aea3091e-b0aa-5258-9aea-e94bf44893c9',
  'official_catalog_pdf',
  'https://www.tamiyausa.com/media/files/map-apr-2021-1116-78cf.pdf',
  array['itemNumber','editionName','releaseYear'],
  date '2026-09-19',
  'Official Tamiya USA April 2021 MAP list contains ITEM 95501 JR Avante Jr. Black Special.'
),
(
  '804385fd-3740-5a32-86d6-8993e51b0cb7',
  'aea3091e-b0aa-5258-9aea-e94bf44893c9',
  'trusted_secondary',
  'https://mini-4wd.fandom.com/wiki/Avante_Jr.',
  array['releaseYear','chassis','color'],
  date '2026-09-19',
  'Historical community catalog corroborates the 2021 reissue wave; exact day remains unset in TrackDash.'
),
(
  '4f16eaee-8217-563d-8a58-b19117ba1c8f',
  '91bcff13-76b4-5a09-a83b-1cfb85400b40',
  'official_catalog_pdf',
  'https://www.tamiyausa.com/media/files/map-feb-2026-1239-08db.pdf',
  array['barcodeJAN'],
  date '2026-09-19',
  'Official Tamiya USA price list confirms JAN 4950344080885 for ITEM 95501.'
)
on conflict (id) do update set
  release_id = excluded.release_id,
  source_type = excluded.source_type,
  source_url = excluded.source_url,
  verified_fields = excluded.verified_fields,
  checked_at = excluded.checked_at,
  notes = excluded.notes;

-- Release-level images. Historical reused-photo rows are explicitly documented
-- above as visual references to the same physical variant, never archival claims.
insert into public.release_images (id, release_id, url, position) values
(
  'edc169fa-aa7d-5688-b290-699a3026afc1',
  '934803bc-4ff1-5a5a-9965-b9ed5d448215',
  'https://www.tamiyausa.com/media/CACHE/images/products/jr-avante-blk-special-jr-avante-blk-special-18506-1.jpg-aefa/48376c07ed43a3880a146fe07242e508.jpg',
  0
),
(
  'b67644e9-7764-5d74-9c25-faaabcca1779',
  '9258d58c-2654-510f-b5ac-9b141ed318dc',
  'https://www.tamiya.com/japan_contents/img/usr/item/1/18058/18058_1.jpg',
  0
),
(
  'f98ecaf2-a31d-5ad8-bac7-e0741c86bba3',
  '3338f1a5-609b-507d-8102-2594bc818365',
  'https://www.tamiya.com/japan_contents/img/usr/item/1/18014/18014_1.jpg',
  0
),
(
  '442c9c2d-e2dc-54f2-b012-24209001a40f',
  '2615c6b3-b497-547e-9d80-bdf9c1eca91b',
  'https://www.tamiya.com/japan_contents/img/usr/item/9/95060/95060_1.jpg',
  0
),
(
  '681b986d-382c-51bc-85a4-cb80cea5ba04',
  '7fd567d7-4d97-5323-88c4-d501efd3bdac',
  'https://www.tamiyausa.com/media/CACHE/images/products/jr-avante-jr-black-special-none-3-de2c/4cd9f686698a6b6e7831025ecf711b31.jpg',
  0
),
(
  '09822f96-366d-5d17-8912-704da99fa063',
  'aea3091e-b0aa-5258-9aea-e94bf44893c9',
  'https://www.tamiyausa.com/media/CACHE/images/products/jr-avante-jr-black-special-none-3-de2c/4cd9f686698a6b6e7831025ecf711b31.jpg',
  0
)
on conflict (id) do update set
  release_id = excluded.release_id,
  url = excluded.url,
  position = excluded.position;

-- Replace the 2024 retailer fallback with official Tamiya media.
update public.release_images
set url = 'https://www.tamiyausa.com/media/CACHE/images/products/jr-avante-jr-black-special-none-3-de2c/4cd9f686698a6b6e7831025ecf711b31.jpg',
    position = 0
where id = '9649bf57-de88-4e13-a5b5-7ca3c4b4d941'
  and release_id = '91bcff13-76b4-5a09-a83b-1cfb85400b40';

-- Every audited Avante Jr. Release enters Price Intelligence, even when there is
-- currently zero market evidence. This is intentionally NOT a valuation.
-- The INSERT trigger from migration 0103 automatically creates scan targets:
-- unique Item Numbers can run eBay Active unattended; reused Item Numbers are
-- parked fail-closed.
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
where pr.product_id = '82b478fd-21dd-5c93-82fb-bf50461a107d'
on conflict (release_id, condition) do nothing;
