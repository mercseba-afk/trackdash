-- Proto Emperor ZX family re-audit — 2026-09-29
--
-- Legacy-family completion under the current TrackDash Master:
-- - preserve the canonical 3-Release genealogy;
-- - refresh verification/production/rarity metadata and bilingual descriptions;
-- - demote the historical 2007 Tamiya MSRP from a false live-retail signal;
-- - add exact/strong recent completed-sale evidence for the 1992 Original and 2017 Premium;
-- - add an exact current Japan ASK for the explicitly identified 2007 spot-production reissue;
-- - add an exact RCJAZ endpoint only for ITEM 95335 (18038 remains fail-closed because reused).
--
-- 1991 Autumn Cup availability remains a pre-sale/distribution wave of the 1992 commercial
-- Release, not a fourth canonical Release.

begin;

-- ---------------------------------------------------------------------------
-- 1. Canonical Release metadata
-- ---------------------------------------------------------------------------

update public.product_releases r
set verification_status = 'verified',
    production_status = 'discontinued',
    rarity = 'Rare',
    status_checked_at = now(),
    description = 'The original 1992 Proto Emperor ZX commercial Release on the Zero chassis. A 1991 Autumn Cup advance sale is documented as a pre-sale wave, not a separate Release.',
    description_it = 'La Release commerciale originale del 1992 della Proto Emperor ZX su telaio Zero. La vendita anticipata all''Autumn Cup 1991 è documentata come pre-sale wave, non come Release separata.',
    notes = 'Original 1992 commercial occurrence of item 18038. CoroCoro documents the first reveal in October 1991 and an Autumn Cup 1991 advance sale before the regular February 1992 release. The 2007 spot-production resale keeps item 18038 but is modeled as a separate TrackDash Release.',
    updated_at = now()
where r.product_id = (select id from public.products where slug='proto-emperor-zx-18714')
  and r.item_number='18038'
  and r.release_year=1992;

update public.product_releases r
set verification_status = 'verified',
    production_status = 'discontinued',
    rarity = 'Rare',
    status_checked_at = now(),
    description = 'The 2007 spot-production reissue of Proto Emperor ZX on the Zero chassis, retaining ITEM 18038 and distinguished from the 1992 Original by its documented reissue date and production context.',
    description_it = 'La ristampa spot-production del 2007 della Proto Emperor ZX su telaio Zero, con ITEM 18038 mantenuto e distinta dall''Originale 1992 tramite data di ristampa e contesto produttivo documentati.',
    notes = 'Official Tamiya and Suruga archives identify the 2007-09-01 occurrence as a spot-production resale/reissue of ITEM 18038. Shared ITEM 18038 must remain fail-closed for unattended marketplace attribution.',
    updated_at = now()
where r.product_id = (select id from public.products where slug='proto-emperor-zx-18714')
  and r.item_number='18038'
  and r.release_year=2007;

update public.product_releases r
set verification_status = 'verified',
    production_status = 'discontinued',
    rarity = 'Uncommon',
    status_checked_at = now(),
    description = 'The 2017 Proto Emperor ZX Premium special-project Release on the Super-II chassis, ITEM 95335.',
    description_it = 'La Release speciale Proto Emperor ZX Premium del 2017 su telaio Super-II, ITEM 95335.',
    notes = coalesce(notes, '2017 Premium special-project Release on Super-II chassis.'),
    updated_at = now()
where r.product_id = (select id from public.products where slug='proto-emperor-zx-18714')
  and r.item_number='95335'
  and r.release_year=2017;

-- Refresh the identity-source audit date.
update public.release_sources rs
set checked_at='2026-09-29'
where rs.release_id in (
  select id from public.product_releases
  where product_id=(select id from public.products where slug='proto-emperor-zx-18714')
);

-- Add the explicit spot-production archive as a discriminator for the 2007 reissue.
insert into public.release_sources(
  release_id, source_type, source_url, verified_fields, checked_at, notes
)
select
  r.id,
  'trusted_secondary',
  'https://www.suruga-ya.jp/product_archives/20070901_45',
  array['itemNumber','releaseDate','releaseYear'],
  '2026-09-29',
  'Suruga release archive explicitly identifies ITEM 18038 Proto Emperor ZX as a spot-production product released on 2007-09-01.'
from public.product_releases r
where r.product_id=(select id from public.products where slug='proto-emperor-zx-18714')
  and r.item_number='18038' and r.release_year=2007
  and not exists (
    select 1 from public.release_sources x
    where x.release_id=r.id
      and x.source_url='https://www.suruga-ya.jp/product_archives/20070901_45'
  );

-- Add RCJAZ as an exact ITEM/JAN identity + availability reference for 95335.
insert into public.release_sources(
  release_id, source_type, source_url, verified_fields, checked_at, notes
)
select
  r.id,
  'trusted_secondary',
  'https://www.rcjaz.com/tamiya-95335-protoemperor-zx-premium-super-ii-chassis-p-90079925.html',
  array['itemNumber','barcodeJAN','editionName','chassis'],
  '2026-09-29',
  'RCJAZ exact product page identifies ITEM 95335 / GTIN 4950344953356 and currently reports the product as Not Available.'
from public.product_releases r
where r.product_id=(select id from public.products where slug='proto-emperor-zx-18714')
  and r.item_number='95335'
  and not exists (
    select 1 from public.release_sources x
    where x.release_id=r.id
      and x.source_url='https://www.rcjaz.com/tamiya-95335-protoemperor-zx-premium-super-ii-chassis-p-90079925.html'
  );

-- ---------------------------------------------------------------------------
-- 2. Correct legacy 2007 Tamiya MSRP evidence
-- ---------------------------------------------------------------------------

update public.market_candidates mc
set observation_type='msrp_reference',
    review_notes='Historical official Tamiya MSRP/reference page. Do not treat the 990 JPY launch price as a current retail offer.',
    updated_at=now()
where mc.resolved_release_id = (
  select id from public.product_releases
  where product_id=(select id from public.products where slug='proto-emperor-zx-18714')
    and item_number='18038' and release_year=2007
)
and mc.source_id=(select id from public.price_sources where slug='tamiya_shop_public')
and mc.listing_url='https://www.tamiya.com/japan/products/18038/index.html';

update public.market_offer_states os
set availability='unknown',
    last_checked_at=now(),
    changed_at=now(),
    updated_at=now()
where os.candidate_id in (
  select mc.id
  from public.market_candidates mc
  where mc.resolved_release_id = (
    select id from public.product_releases
    where product_id=(select id from public.products where slug='proto-emperor-zx-18714')
      and item_number='18038' and release_year=2007
  )
  and mc.source_id=(select id from public.price_sources where slug='tamiya_shop_public')
  and mc.listing_url='https://www.tamiya.com/japan/products/18038/index.html'
);

-- ---------------------------------------------------------------------------
-- 3. 1992 Original — recent exact/strong Yahoo completed sales
-- ---------------------------------------------------------------------------

with rel as (
  select id
  from public.product_releases
  where product_id=(select id from public.products where slug='proto-emperor-zx-18714')
    and item_number='18038' and release_year=1992
),
src as (
  select id from public.price_sources where slug='yahoo_auctions_jp_closed'
),
upserted as (
  insert into public.market_candidates(
    source_id, source_record_key, original_source, listing_url, title_raw,
    item_number_observed, possible_release_ids, resolved_release_id,
    price, currency, shipping_cost, shipping_basis, observation_type,
    condition_raw, condition, inner_bags_sealed, box_condition,
    is_complete, is_lot, quantity, match_confidence, match_evidence,
    evidence_group_key, sold_on, observed_at, decision, reason_codes,
    review_notes, needs_revalidation, first_observed_at, last_observed_at
  )
  select
    src.id,
    v.record_key,
    'yahoo_auctions_jp_closed',
    'https://auctions.yahoo.co.jp/closedsearch/closedsearch/%E3%83%97%E3%83%AD%E3%83%88%E3%82%A8%E3%83%B3%E3%83%9A%E3%83%A9%E3%83%BC/0/',
    v.title_raw,
    '18038',
    array[rel.id]::uuid[],
    rel.id,
    v.price_jpy,
    'JPY',
    null,
    'unknown',
    'auction_awarded',
    v.condition_raw,
    'new_complete_unbuilt',
    'unknown',
    'unknown',
    true,
    false,
    1,
    'strong',
    v.match_evidence,
    v.record_key,
    v.sold_on,
    now(),
    'accepted',
    array[]::text[],
    v.review_notes,
    false,
    now(),
    now()
  from rel cross join src
  cross join (values
    (
      'yahoo-auctions:proto-emperor-zx-original:2026-04-13:9250',
      'タミヤ　レーサーミニ四駆〖初版〗原始大帝 プロトエンペラーZX（ジークロス） ゼロシャーシ　PROTO-EMPEROR ZX 当時物　コレクター向き',
      9250::numeric,
      '2026-04-13'::date,
      '未使用 / 初版 / 当時物',
      array['item_number_exact','packaging_generation_match','manual_override']::text[],
      'Yahoo closed result explicitly states first edition / vintage and marks the item unused. Assigned only to the 1992 Original.'
    ),
    (
      'yahoo-auctions:proto-emperor-zx-original:2026-04-13:9500',
      '当時物 プロトエンペラーZX ミニ四駆 タミヤ 未組立 原始大帝',
      9500::numeric,
      '2026-04-13'::date,
      '未使用 / 未組立 / 当時物',
      array['packaging_generation_match','manual_override']::text[],
      'Yahoo closed result explicitly states vintage-era and unassembled/unused. Assigned only to the 1992 Original; generic 18038 sales remain excluded.'
    )
  ) as v(record_key,title_raw,price_jpy,sold_on,condition_raw,match_evidence,review_notes)
  on conflict (source_id,source_record_key) do update set
    listing_url=excluded.listing_url,
    title_raw=excluded.title_raw,
    resolved_release_id=excluded.resolved_release_id,
    possible_release_ids=excluded.possible_release_ids,
    price=excluded.price,
    currency=excluded.currency,
    observation_type=excluded.observation_type,
    condition_raw=excluded.condition_raw,
    condition=excluded.condition,
    is_complete=excluded.is_complete,
    is_lot=excluded.is_lot,
    quantity=excluded.quantity,
    match_confidence=excluded.match_confidence,
    match_evidence=excluded.match_evidence,
    evidence_group_key=excluded.evidence_group_key,
    sold_on=excluded.sold_on,
    decision=excluded.decision,
    reason_codes=excluded.reason_codes,
    review_notes=excluded.review_notes,
    needs_revalidation=false,
    last_observed_at=now(),
    updated_at=now()
  returning id, source_id, resolved_release_id, source_record_key, price, sold_on,
            observation_type, condition, match_confidence, match_evidence,
            evidence_group_key, observed_at
)
insert into public.price_points(
  candidate_id, release_id, source_id, observation_type, condition,
  price, currency, shipping_cost, shipping_basis, valuation_price,
  normalized_price_eur, fx_rate_to_eur, fx_rate_date,
  inner_bags_sealed, box_condition, is_complete, is_lot, quantity,
  match_confidence, match_evidence, evidence_group_key,
  valuation_eligible, status, needs_revalidation, sold_on, observed_at,
  evidence_grade, quality_flags, market_price_eur, market_price_basis
)
select
  u.id, u.resolved_release_id, u.source_id, u.observation_type, u.condition,
  u.price, 'JPY', null, 'unknown', null,
  null, 0.00535475, '2026-04-13',
  'unknown', 'unknown', true, false, 1,
  u.match_confidence, u.match_evidence, u.evidence_group_key,
  true, 'active', false, u.sold_on, u.observed_at,
  'indicative',
  array['seller_unknown','shipping_unknown','inner_bags_unknown','box_condition_unknown']::text[],
  round(u.price * 0.00535475,2), 'raw_sale'
from upserted u
on conflict (candidate_id) do update set
  release_id=excluded.release_id,
  source_id=excluded.source_id,
  observation_type=excluded.observation_type,
  condition=excluded.condition,
  price=excluded.price,
  currency=excluded.currency,
  shipping_cost=excluded.shipping_cost,
  shipping_basis=excluded.shipping_basis,
  valuation_price=excluded.valuation_price,
  normalized_price_eur=excluded.normalized_price_eur,
  fx_rate_to_eur=excluded.fx_rate_to_eur,
  fx_rate_date=excluded.fx_rate_date,
  is_complete=excluded.is_complete,
  is_lot=excluded.is_lot,
  quantity=excluded.quantity,
  match_confidence=excluded.match_confidence,
  match_evidence=excluded.match_evidence,
  evidence_group_key=excluded.evidence_group_key,
  valuation_eligible=excluded.valuation_eligible,
  status=excluded.status,
  needs_revalidation=excluded.needs_revalidation,
  sold_on=excluded.sold_on,
  observed_at=excluded.observed_at,
  evidence_grade=excluded.evidence_grade,
  quality_flags=excluded.quality_flags,
  market_price_eur=excluded.market_price_eur,
  market_price_basis=excluded.market_price_basis,
  updated_at=now();

-- ---------------------------------------------------------------------------
-- 4. 2017 Premium — recent completed sales
-- ---------------------------------------------------------------------------

with rel as (
  select id
  from public.product_releases
  where product_id=(select id from public.products where slug='proto-emperor-zx-18714')
    and item_number='95335' and release_year=2017
),
src as (
  select id from public.price_sources where slug='yahoo_flea_jp_closed'
),
upserted as (
  insert into public.market_candidates(
    source_id, source_record_key, original_source, listing_url, title_raw,
    item_number_observed, possible_release_ids, resolved_release_id,
    price, currency, shipping_cost, shipping_basis, observation_type,
    condition_raw, condition, inner_bags_sealed, box_condition,
    is_complete, is_lot, quantity, match_confidence, match_evidence,
    evidence_group_key, sold_on, observed_at, decision, reason_codes,
    review_notes, needs_revalidation, first_observed_at, last_observed_at
  )
  select
    src.id,
    v.record_key,
    'yahoo_flea_jp_closed',
    'https://auctions.yahoo.co.jp/closedsearch/closedsearch/%E3%83%97%E3%83%AD%E3%83%88%E3%82%A8%E3%83%B3%E3%83%9A%E3%83%A9%E3%83%BC/0/',
    v.title_raw,
    '95335',
    array[rel.id]::uuid[],
    rel.id,
    v.price_jpy,
    'JPY',
    null,
    'unknown',
    'marketplace_sold',
    v.condition_raw,
    'new_complete_unbuilt',
    'unknown',
    v.box_condition,
    true,
    false,
    1,
    v.match_confidence,
    v.match_evidence,
    v.record_key,
    v.sold_on,
    now(),
    'accepted',
    array[]::text[],
    v.review_notes,
    false,
    now(),
    now()
  from rel cross join src
  cross join (values
    (
      'yahoo-flea:proto-emperor-zx-premium:2026-05-08:4200',
      'タミヤ ミニ四駆 プロトエンペラーZX プレミアム スーパーIIシャーシ',
      4200::numeric,
      '2026-05-08'::date,
      '未使用',
      'unknown',
      'strong',
      array['edition_name_exact','chassis_stated','manual_override']::text[],
      'Yahoo Flea closed result: unused Proto Emperor ZX Premium / Super-II. Unique edition and chassis resolve to ITEM 95335.'
    ),
    (
      'yahoo-flea:proto-emperor-zx-premium-95335:2026-06-01:4200',
      'タミヤ ミニ四駆 プロトエンペラーZX（ジークロス）プレミアム（スーパーIIシャーシ）95335 新品未使用 箱たわみ有',
      4200::numeric,
      '2026-06-01'::date,
      '新品未使用 / 箱たわみ有',
      'significantly_damaged',
      'exact',
      array['item_number_exact','edition_name_exact','chassis_stated','manual_override']::text[],
      'Yahoo Flea closed result explicitly identifies ITEM 95335, Premium, Super-II, unused; box deformation is retained as condition context.'
    )
  ) as v(record_key,title_raw,price_jpy,sold_on,condition_raw,box_condition,match_confidence,match_evidence,review_notes)
  on conflict (source_id,source_record_key) do update set
    listing_url=excluded.listing_url,
    title_raw=excluded.title_raw,
    resolved_release_id=excluded.resolved_release_id,
    possible_release_ids=excluded.possible_release_ids,
    price=excluded.price,
    currency=excluded.currency,
    observation_type=excluded.observation_type,
    condition_raw=excluded.condition_raw,
    condition=excluded.condition,
    box_condition=excluded.box_condition,
    is_complete=excluded.is_complete,
    is_lot=excluded.is_lot,
    quantity=excluded.quantity,
    match_confidence=excluded.match_confidence,
    match_evidence=excluded.match_evidence,
    evidence_group_key=excluded.evidence_group_key,
    sold_on=excluded.sold_on,
    decision=excluded.decision,
    reason_codes=excluded.reason_codes,
    review_notes=excluded.review_notes,
    needs_revalidation=false,
    last_observed_at=now(),
    updated_at=now()
  returning id, source_id, resolved_release_id, source_record_key, price, sold_on,
            observation_type, condition, box_condition, match_confidence,
            match_evidence, evidence_group_key, observed_at
)
insert into public.price_points(
  candidate_id, release_id, source_id, observation_type, condition,
  price, currency, shipping_cost, shipping_basis, valuation_price,
  normalized_price_eur, fx_rate_to_eur, fx_rate_date,
  inner_bags_sealed, box_condition, is_complete, is_lot, quantity,
  match_confidence, match_evidence, evidence_group_key,
  valuation_eligible, status, needs_revalidation, sold_on, observed_at,
  evidence_grade, quality_flags, market_price_eur, market_price_basis
)
select
  u.id, u.resolved_release_id, u.source_id, u.observation_type, u.condition,
  u.price, 'JPY', null, 'unknown', null,
  null,
  case when u.sold_on='2026-05-08' then 0.00542388 else 0.00538387 end,
  case when u.sold_on='2026-05-08' then '2026-05-08'::date else '2026-06-01'::date end,
  'unknown', u.box_condition, true, false, 1,
  u.match_confidence, u.match_evidence, u.evidence_group_key,
  true, 'active', false, u.sold_on, u.observed_at,
  'indicative',
  case
    when u.box_condition='significantly_damaged'
      then array['seller_unknown','shipping_unknown','inner_bags_unknown']::text[]
    else array['seller_unknown','shipping_unknown','inner_bags_unknown','box_condition_unknown']::text[]
  end,
  round(u.price * case when u.sold_on='2026-05-08' then 0.00542388 else 0.00538387 end,2),
  'raw_sale'
from upserted u
on conflict (candidate_id) do update set
  release_id=excluded.release_id,
  source_id=excluded.source_id,
  observation_type=excluded.observation_type,
  condition=excluded.condition,
  price=excluded.price,
  currency=excluded.currency,
  shipping_cost=excluded.shipping_cost,
  shipping_basis=excluded.shipping_basis,
  valuation_price=excluded.valuation_price,
  normalized_price_eur=excluded.normalized_price_eur,
  fx_rate_to_eur=excluded.fx_rate_to_eur,
  fx_rate_date=excluded.fx_rate_date,
  is_complete=excluded.is_complete,
  is_lot=excluded.is_lot,
  quantity=excluded.quantity,
  match_confidence=excluded.match_confidence,
  match_evidence=excluded.match_evidence,
  evidence_group_key=excluded.evidence_group_key,
  valuation_eligible=excluded.valuation_eligible,
  status=excluded.status,
  needs_revalidation=excluded.needs_revalidation,
  sold_on=excluded.sold_on,
  observed_at=excluded.observed_at,
  evidence_grade=excluded.evidence_grade,
  quality_flags=excluded.quality_flags,
  market_price_eur=excluded.market_price_eur,
  market_price_basis=excluded.market_price_basis,
  box_condition=excluded.box_condition,
  updated_at=now();

-- One additional exact/strong Yahoo Auction Premium sale.
with rel as (
  select id
  from public.product_releases
  where product_id=(select id from public.products where slug='proto-emperor-zx-18714')
    and item_number='95335' and release_year=2017
),
src as (
  select id from public.price_sources where slug='yahoo_auctions_jp_closed'
),
upserted as (
  insert into public.market_candidates(
    source_id, source_record_key, original_source, listing_url, title_raw,
    item_number_observed, possible_release_ids, resolved_release_id,
    price, currency, shipping_basis, observation_type,
    condition_raw, condition, inner_bags_sealed, box_condition,
    is_complete, is_lot, quantity, match_confidence, match_evidence,
    evidence_group_key, sold_on, observed_at, decision, reason_codes,
    review_notes, needs_revalidation, first_observed_at, last_observed_at
  )
  select
    src.id,
    'yahoo-auctions:proto-emperor-zx-premium:2026-05-28:5000',
    'yahoo_auctions_jp_closed',
    'https://auctions.yahoo.co.jp/closedsearch/closedsearch/%E3%83%97%E3%83%AD%E3%83%88%E3%82%A8%E3%83%B3%E3%83%9A%E3%83%A9%E3%83%BC/0/',
    '未組立 長期保管品 タミヤ ミニ四駆 特別仕様 PROTO EMPEROR ZX プロトエンペラーZX プレミアム レーサーミニ四駆',
    '95335',
    array[rel.id]::uuid[],
    rel.id,
    5000,
    'JPY',
    'unknown',
    'auction_awarded',
    '未使用 / 未組立 / 長期保管',
    'new_complete_unbuilt',
    'unknown',
    'unknown',
    true,
    false,
    1,
    'strong',
    array['edition_name_exact','manual_override']::text[],
    'yahoo-auctions:proto-emperor-zx-premium:2026-05-28:5000',
    '2026-05-28',
    now(),
    'accepted',
    array[]::text[],
    'Yahoo closed result identifies the Premium special edition and marks it unused/unassembled. ITEM 95335 attribution follows the unique Premium edition identity.',
    false,
    now(),
    now()
  from rel cross join src
  on conflict (source_id,source_record_key) do update set
    resolved_release_id=excluded.resolved_release_id,
    possible_release_ids=excluded.possible_release_ids,
    price=excluded.price,
    condition_raw=excluded.condition_raw,
    condition=excluded.condition,
    is_complete=excluded.is_complete,
    match_confidence=excluded.match_confidence,
    match_evidence=excluded.match_evidence,
    sold_on=excluded.sold_on,
    decision='accepted',
    review_notes=excluded.review_notes,
    needs_revalidation=false,
    last_observed_at=now(),
    updated_at=now()
  returning id, source_id, resolved_release_id, price, sold_on, observation_type,
            condition, match_confidence, match_evidence, evidence_group_key, observed_at
)
insert into public.price_points(
  candidate_id, release_id, source_id, observation_type, condition,
  price, currency, shipping_basis, valuation_price, normalized_price_eur,
  fx_rate_to_eur, fx_rate_date, inner_bags_sealed, box_condition,
  is_complete, is_lot, quantity, match_confidence, match_evidence,
  evidence_group_key, valuation_eligible, status, needs_revalidation,
  sold_on, observed_at, evidence_grade, quality_flags,
  market_price_eur, market_price_basis
)
select
  u.id, u.resolved_release_id, u.source_id, u.observation_type, u.condition,
  u.price, 'JPY', 'unknown', null, null,
  0.00539229, '2026-05-29',
  'unknown','unknown',true,false,1,
  u.match_confidence,u.match_evidence,u.evidence_group_key,
  true,'active',false,u.sold_on,u.observed_at,'indicative',
  array['seller_unknown','shipping_unknown','inner_bags_unknown','box_condition_unknown']::text[],
  round(u.price * 0.00539229,2),'raw_sale'
from upserted u
on conflict (candidate_id) do update set
  release_id=excluded.release_id,
  source_id=excluded.source_id,
  observation_type=excluded.observation_type,
  condition=excluded.condition,
  price=excluded.price,
  currency=excluded.currency,
  shipping_basis=excluded.shipping_basis,
  valuation_price=excluded.valuation_price,
  normalized_price_eur=excluded.normalized_price_eur,
  fx_rate_to_eur=excluded.fx_rate_to_eur,
  fx_rate_date=excluded.fx_rate_date,
  is_complete=excluded.is_complete,
  is_lot=excluded.is_lot,
  quantity=excluded.quantity,
  match_confidence=excluded.match_confidence,
  match_evidence=excluded.match_evidence,
  evidence_group_key=excluded.evidence_group_key,
  valuation_eligible=excluded.valuation_eligible,
  status=excluded.status,
  needs_revalidation=excluded.needs_revalidation,
  sold_on=excluded.sold_on,
  observed_at=excluded.observed_at,
  evidence_grade=excluded.evidence_grade,
  quality_flags=excluded.quality_flags,
  market_price_eur=excluded.market_price_eur,
  market_price_basis=excluded.market_price_basis,
  updated_at=now();

-- ---------------------------------------------------------------------------
-- 5. 2007 Reissue — exact current spot-production ASK (Japan-local context)
-- ---------------------------------------------------------------------------

with rel as (
  select id
  from public.product_releases
  where product_id=(select id from public.products where slug='proto-emperor-zx-18714')
    and item_number='18038' and release_year=2007
),
src as (
  select id from public.price_sources where slug='mercari_jp_public'
),
upserted as (
  insert into public.market_candidates(
    source_id, source_record_key, external_listing_id, original_source,
    listing_url, title_raw, item_number_observed, possible_release_ids,
    resolved_release_id, price, currency, shipping_cost, shipping_basis,
    observation_type, condition_raw, condition, inner_bags_sealed,
    box_condition, is_complete, is_lot, quantity, match_confidence,
    match_evidence, evidence_group_key, observed_at, decision, reason_codes,
    review_notes, raw_payload, needs_revalidation,
    first_observed_at, last_observed_at
  )
  select
    src.id,
    'mercari-shops:2JJTTsabbhZmAHzwytvmY6',
    '2JJTTsabbhZmAHzwytvmY6',
    'mercari_jp_public',
    'https://jp.mercari.com/shops/product/2JJTTsabbhZmAHzwytvmY6',
    'タミヤ レーサーミニ四駆 スポット生産版 原始大帝 プロトエンペラーZX(ゼロシャーシ) 18038SP',
    '18038',
    array[rel.id]::uuid[],
    rel.id,
    7370,
    'JPY',
    null,
    'unknown',
    'active_listing',
    '未組立 / パッケージいたみ',
    'new_complete_unbuilt',
    'unknown',
    'unknown',
    null,
    false,
    1,
    'exact',
    array['item_number_exact','reissue_stated','packaging_generation_match','manual_override']::text[],
    'mercari-shops:2JJTTsabbhZmAHzwytvmY6',
    now(),
    'accepted',
    array[]::text[],
    'Current Mercari Shops listing explicitly states spot-production version and 18038SP. Shipping is a range (JPY 660–1320), so the canonical offer remains item-only rather than inventing a delivered cost.',
    jsonb_build_object('shipping_range_jpy',jsonb_build_array(660,1320),'checked_at','2026-09-29'),
    false,
    now(),
    now()
  from rel cross join src
  on conflict (source_id,source_record_key) do update set
    external_listing_id=excluded.external_listing_id,
    listing_url=excluded.listing_url,
    title_raw=excluded.title_raw,
    resolved_release_id=excluded.resolved_release_id,
    possible_release_ids=excluded.possible_release_ids,
    price=excluded.price,
    currency=excluded.currency,
    shipping_cost=excluded.shipping_cost,
    shipping_basis=excluded.shipping_basis,
    observation_type=excluded.observation_type,
    condition_raw=excluded.condition_raw,
    condition=excluded.condition,
    match_confidence=excluded.match_confidence,
    match_evidence=excluded.match_evidence,
    evidence_group_key=excluded.evidence_group_key,
    observed_at=now(),
    decision='accepted',
    review_notes=excluded.review_notes,
    raw_payload=excluded.raw_payload,
    needs_revalidation=false,
    last_observed_at=now(),
    updated_at=now()
  returning id, source_id, resolved_release_id, price
)
insert into public.market_offer_states(
  candidate_id, release_id, source_id, condition, channel, availability,
  seller_fingerprint, item_price, shipping_price, currency,
  item_price_eur, shipping_eur, effective_cost_eur, cost_basis,
  fx_rate_to_eur, fx_rate_date, first_seen_at, last_checked_at,
  changed_at
)
select
  u.id,u.resolved_release_id,u.source_id,'new_complete_unbuilt','marketplace','in_stock',
  null,u.price,null,'JPY',
  round(u.price * 0.00556483,2),null,null,'item_only',
  0.00556483,'2026-09-25',now(),now(),now()
from upserted u
on conflict (candidate_id) do update set
  release_id=excluded.release_id,
  source_id=excluded.source_id,
  condition=excluded.condition,
  channel=excluded.channel,
  availability=excluded.availability,
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

-- ---------------------------------------------------------------------------
-- 6. Exact RCJAZ endpoint for 95335 + safe queue alignment
-- ---------------------------------------------------------------------------

insert into public.market_scan_endpoints(
  release_id, source_id, endpoint_url, parser_kind, exact_release_verified, enabled
)
select
  r.id,
  ps.id,
  'https://www.rcjaz.com/tamiya-95335-protoemperor-zx-premium-super-ii-chassis-p-90079925.html',
  'rcjaz_product_page',
  true,
  true
from public.product_releases r
cross join public.price_sources ps
where r.product_id=(select id from public.products where slug='proto-emperor-zx-18714')
  and r.item_number='95335'
  and ps.slug='rcjaz_public'
on conflict (release_id,source_id,endpoint_url) do update set
  parser_kind='rcjaz_product_page',
  exact_release_verified=true,
  enabled=true,
  updated_at=now();

update public.market_scan_queue q
set enabled=true,
    priority=140,
    next_scan_at='2000-01-01 00:00:00+00',
    locked_until=null,
    consecutive_failures=0,
    last_error=null,
    updated_at=now()
where q.release_id=(
  select id from public.product_releases
  where product_id=(select id from public.products where slug='proto-emperor-zx-18714')
    and item_number='95335'
)
and q.source_id=(select id from public.price_sources where slug='rcjaz_public')
and q.scan_scope='retail';

-- Keep shared ITEM 18038 eBay Active fail-closed for both historical Releases.
update public.market_scan_queue q
set enabled=false,
    next_scan_at='2099-01-01 00:00:00+00',
    locked_until=null,
    last_error=null,
    updated_at=now()
where q.release_id in (
  select id from public.product_releases
  where product_id=(select id from public.products where slug='proto-emperor-zx-18714')
    and item_number='18038'
)
and q.source_id=(select id from public.price_sources where slug='ebay_active_public');

-- ---------------------------------------------------------------------------
-- 7. Recompute + cron enrollment
-- ---------------------------------------------------------------------------

select public.trackdash_enqueue_market_recompute(
  r.id,'new_complete_unbuilt'
)
from public.product_releases r
where r.product_id=(select id from public.products where slug='proto-emperor-zx-18714');

select public.trackdash_enroll_release_market_scans(r.id)
from public.product_releases r
where r.product_id=(select id from public.products where slug='proto-emperor-zx-18714');

-- Reassert the exact endpoint/queue state after generic enrollment.
update public.market_scan_queue q
set enabled=true,
    priority=140,
    next_scan_at='2000-01-01 00:00:00+00',
    locked_until=null,
    consecutive_failures=0,
    last_error=null,
    updated_at=now()
where q.release_id=(
  select id from public.product_releases
  where product_id=(select id from public.products where slug='proto-emperor-zx-18714')
    and item_number='95335'
)
and q.source_id=(select id from public.price_sources where slug='rcjaz_public')
and q.scan_scope='retail';

update public.market_scan_queue q
set enabled=false,
    next_scan_at='2099-01-01 00:00:00+00',
    locked_until=null,
    updated_at=now()
where q.release_id in (
  select id from public.product_releases
  where product_id=(select id from public.products where slug='proto-emperor-zx-18714')
    and item_number='18038'
)
and q.source_id=(select id from public.price_sources where slug='ebay_active_public');

commit;
