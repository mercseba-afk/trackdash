-- Rising Bird controlled family re-audit — 2026-09-28
--
-- Rebuilds the legacy two-row family under the current TrackDash workflow:
-- - keeps the 1989 Japanese original and 2007 reissue UUIDs;
-- - adds the physically distinguishable 1989 USA MRC/Lightning Racers package variant;
-- - records the 2017 plated-kit editorial reference as unresolved context only;
-- - excludes the event Gold Plated Body because it is a GUP/body accessory;
-- - applies exact/high-confidence external image policy;
-- - seeds one indicative vintage SOLD for the 1989 original;
-- - parks all shared ITEM 18017 generations fail-closed for unattended eBay.

begin;

insert into public.price_sources(slug,name,source_type,is_active,origin,ingestion_mode,market_region)
values (
  'aucfan_yahoo_closed_archive',
  'Aucfan / Yahoo Auctions closed-sale archive',
  'market_research',
  false,
  'external_market',
  'manual',
  'japan'
)
on conflict(slug) do nothing;

update public.products
set canonical_item_number='18017',
    original_release_year=1989,
    series='Racing Mini 4WD',
    chassis='Type 3',
    rarity=null,
    description='Rising Bird is the 1989 Dream Attack / Mini 4 Top Racing Mini 4WD and the debut machine for Tamiya''s Type 3 chassis. The collector family includes the Japanese original, the physically distinct USA MRC/Lightning Racers package with bonus booklet, and the 2007 Type 3 reissue.',
    description_it='Rising Bird è la Racing Mini 4WD del progetto Dream Attack / Mini 4 Top del 1989 e la prima macchina Tamiya con telaio Type 3. La famiglia collezionistica comprende l''originale giapponese, la confezione USA MRC/Lightning Racers fisicamente distinta con booklet bonus e la ristampa Type 3 del 2007.',
    metadata=coalesce(metadata,'{}'::jsonb) || jsonb_build_object(
      'catalog_audit','2026-09-28',
      'canonical_release_count',3,
      'catalog_publication_gate',jsonb_build_object(
        'version','2026-09-28',
        'public_release_count',3,
        'research_only_release_count',0,
        'market_value_required',false
      ),
      'shared_identifier_rules',jsonb_build_array(
        jsonb_build_object(
          'identifier','18017',
          'type','item_number',
          'release_years',jsonb_build_array(1989,1989,2007),
          'policy','fail_closed',
          'reason','Japanese original, USA Lightning Racers package and 2007 reissue share ITEM 18017. Item-only evidence must never choose a generation/package automatically.'
        )
      ),
      'noncanonical_context',jsonb_build_array(
        'A limited Rising Bird Gold Plated Body was sold at events as a Grade-Up Parts/body item; it is an accessory, not a complete autonomous Mini 4WD Release.',
        'Tamiya Jr. News No.205 (2017) states that a limited-edition comic release included a Rising Bird plated kit among deluxe bonuses. The exact book/bundle identity and whether it represents an autonomous complete-kit collector Release remain insufficiently resolved, so it is research context only.',
        'Takara Tomy Tomica Premium unlimited Rising Bird (2026) is a die-cast/minicar product, not a Tamiya Mini 4WD kit, and is outside this family.'
      ),
      'image_audit',jsonb_build_object(
        'version','2026-09-28',
        'covered_release_count',1,
        'canonical_release_count',3,
        'intentional_placeholder_items',jsonb_build_array(
          '18017 Original Japan 1989',
          '18017 USA Lightning Racers 1989'
        ),
        'notes','External-source image research applied. The stable Suruga management-ID hero 603015729 is assigned to the 2007 reissue line. Exact marketplace imagery exists for the two 1989 package generations, but no stable direct asset has yet been persisted; placeholders are retained rather than mixing Japanese and USA packaging.'
      )
    ),
    updated_at=now()
where slug='rising-bird-18017';

-- 1989 Japanese original.
update public.product_releases
set edition_name='Rising Bird — 1989 Original (Japan / Type 3)',
    release_type='Original',
    edition_type='original',
    release_year=1989,
    release_date=date '1989-06-06',
    chassis='Type 3',
    color='Blue',
    country_market='Japan',
    verification_status='verified',
    production_status='discontinued',
    discontinued=true,
    is_original=true,
    rarity=null,
    data_source='master_reaudit_20260928',
    status_checked_at=now(),
    catalog_visibility='public',
    catalog_visibility_reason='publication_gate:verified_original_identity_and_exact_vintage_market_evidence',
    catalog_visibility_updated_at=now(),
    description='Original Japanese 1989 Rising Bird, ITEM 18017, first Type 3 Mini 4WD generation.',
    description_it='Rising Bird originale giapponese del 1989, ITEM 18017, prima generazione Mini 4WD con telaio Type 3.',
    notes=concat_ws(
      ' ',
      nullif(notes,''),
      'Controlled re-audit 2026-09-28: release date 1989-06-06 is corroborated by specialist historical references; Tamiya historical material confirms ITEM 18017 / Type 3 / 1989. Vintage new/unbuilt market evidence is kept separate from the 2007 reissue and the USA Lightning Racers package.'
    ),
    updated_at=now()
where product_id=(select id from public.products where slug='rising-bird-18017')
  and item_number='18017' and release_year=1989
  and (color is null or color='Blue');

insert into public.release_sources(release_id,source_type,source_url,verified_fields,checked_at,notes)
select r.id,'trusted_secondary','https://w.atwiki.jp/mini4vipwiki/pages/89.html',
       array['itemNumber','releaseDate','releaseYear','chassis','color','specification']::text[],
       date '2026-09-28',
       'Historical Mini 4WD reference records ITEM 18017, original price JPY 600, release date 1989-06-06, Type 3 specification, blue body, red chassis/tires and white wheels.'
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='rising-bird-18017' and r.item_number='18017' and r.release_year=1989 and r.edition_type='original'
  and not exists(select 1 from public.release_sources s where s.release_id=r.id and s.source_url='https://w.atwiki.jp/mini4vipwiki/pages/89.html');

insert into public.release_sources(release_id,source_type,source_url,verified_fields,checked_at,notes)
select r.id,'other','https://aucfan.com/search1/q-~a5e9a5a4a5b8a5f3a5b0a5d0a1bca5c9/s-ya/',
       array['editionName','releaseYear','marketPresence','soldEvidence']::text[],
       date '2026-09-28',
       'Aucfan/Yahoo closed-sale archive shows a 2025-09-05 vintage-era (当時物) unbuilt Rising Bird sale at JPY 12,000. Stored as indicative manual SOLD evidence with shipping unknown.'
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='rising-bird-18017' and r.item_number='18017' and r.release_year=1989 and r.edition_type='original'
  and not exists(select 1 from public.release_sources s where s.release_id=r.id and s.source_url like 'https://aucfan.com/search1/%');

insert into public.release_sources(release_id,source_type,source_url,verified_fields,checked_at,notes)
select r.id,'other','https://www.ebay.com/itm/147214683216',
       array['editionName','releaseYear','packaging','marketPresence','image']::text[],
       date '2026-09-28',
       'Current eBay listing explicitly presents a new 1989 Rising Bird with vintage Japanese box/contents. The listing MPN field is erroneous, so it is identity/image corroboration rather than Item-number metadata authority.'
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='rising-bird-18017' and r.item_number='18017' and r.release_year=1989 and r.edition_type='original'
  and not exists(select 1 from public.release_sources s where s.release_id=r.id and s.source_url='https://www.ebay.com/itm/147214683216');

-- 1989 USA MRC / Lightning Racers regional package variant.
-- Same core kit and ITEM, but physically discriminated by MRC/Lightning Racers
-- packaging, English presentation and bonus booklet.
insert into public.product_releases(
  product_id,item_number,release_type,edition_name,release_year,release_date,chassis,barcode_jan,color,
  country_market,msrp_jpy,msrp_eur,notes,discontinued,is_original,rarity,data_source,edition_type,
  verification_status,production_status,status_checked_at,description,description_it,
  catalog_visibility,catalog_visibility_reason,catalog_visibility_updated_at
)
select
  p.id,'18017','Regional Package Variant','Rising Bird — 1989 USA MRC / Lightning Racers Special Pack',1989,null,'Type 3',
  null,'Blue / Lightning Racers package','USA',null,null,
  'Controlled re-audit 2026-09-28. Collector documentation shows ITEM 18017 in an English MRC/Lightning Racers package marked “BONUS 16 PAGE FUN & STUNT CHALLENGE BOOKLET INSIDE”, Parts Made in Japan / Packed in USA / Box Printed in Canada. Contemporary US press documents the Lightning Racers toy line in December 1989. The core car remains Rising Bird Type 3; TrackDash separates this identity because package + booklet are a reliable physical collector discriminator.',
  true,false,null,'master_reaudit_20260928','special','verified','discontinued',now(),
  '1989 USA MRC/Lightning Racers regional Rising Bird package with bonus booklet, ITEM 18017.',
  'Confezione regionale USA MRC/Lightning Racers del Rising Bird 1989 con booklet bonus, ITEM 18017.',
  'public','publication_gate:physical_regional_package_discriminator_and_exact_current_market_evidence',now()
from public.products p
where p.slug='rising-bird-18017'
on conflict on constraint product_releases_identity_unique do update set
  release_type=excluded.release_type,edition_name=excluded.edition_name,release_date=excluded.release_date,
  chassis=excluded.chassis,barcode_jan=excluded.barcode_jan,color=excluded.color,
  country_market=excluded.country_market,notes=excluded.notes,discontinued=excluded.discontinued,
  is_original=excluded.is_original,rarity=excluded.rarity,data_source=excluded.data_source,
  edition_type=excluded.edition_type,verification_status=excluded.verification_status,
  production_status=excluded.production_status,status_checked_at=excluded.status_checked_at,
  description=excluded.description,description_it=excluded.description_it,
  catalog_visibility=excluded.catalog_visibility,catalog_visibility_reason=excluded.catalog_visibility_reason,
  catalog_visibility_updated_at=excluded.catalog_visibility_updated_at,updated_at=now();

insert into public.release_sources(release_id,source_type,source_url,verified_fields,checked_at,notes)
select r.id,'trusted_secondary','https://plaza.rakuten.co.jp/mini4museum/diary/ctgylist/?ctgy=3',
       array['itemNumber','editionName','packaging','countryMarket','format']::text[],
       date '2026-09-28',
       'Collector archive documents ITEM 18017 USA special kit with Lightning Racers branding, bonus 16-page booklet, English packaging, Parts Made in Japan / Packed in USA / Box Printed in Canada.'
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='rising-bird-18017' and r.edition_name like '%Lightning Racers%'
  and not exists(select 1 from public.release_sources s where s.release_id=r.id and s.source_url='https://plaza.rakuten.co.jp/mini4museum/diary/ctgylist/?ctgy=3');

insert into public.release_sources(release_id,source_type,source_url,verified_fields,checked_at,notes)
select r.id,'trusted_secondary','https://www.chrisisoninfiniteearths.com/2020/01/bonus-book-lightning-racers-1990.html',
       array['editionName','packaging','bundleContents']::text[],
       date '2026-09-28',
       'Independent documentation identifies the Lightning Racers comic/booklet as both a standalone giveaway and a Rising Bird model-set pack-in.'
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='rising-bird-18017' and r.edition_name like '%Lightning Racers%'
  and not exists(select 1 from public.release_sources s where s.release_id=r.id and s.source_url='https://www.chrisisoninfiniteearths.com/2020/01/bonus-book-lightning-racers-1990.html');

insert into public.release_sources(release_id,source_type,source_url,verified_fields,checked_at,notes)
select r.id,'trusted_secondary','https://www.deseret.com/1989/12/21/18837680/one-size-fits-all-toys-are-winners-in-stockings/',
       array['releaseYear','countryMarket','marketPresence']::text[],
       date '2026-09-28',
       'Contemporary Associated Press holiday coverage dated 1989-12-21 documents MRC-Tamiya Lightning Racers as a US retail toy line, supporting a 1989 regional program rather than forcing the pack to 1990.'
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='rising-bird-18017' and r.edition_name like '%Lightning Racers%'
  and not exists(select 1 from public.release_sources s where s.release_id=r.id and s.source_url like 'https://www.deseret.com/1989/12/21/%');

insert into public.release_sources(release_id,source_type,source_url,verified_fields,checked_at,notes)
select r.id,'other','https://www.ebay.com/itm/146460684069',
       array['editionName','releaseYear','packaging','condition','marketPresence','image']::text[],
       date '2026-09-28',
       'Current exact new-condition eBay listing shows the MRC/Lightning Racers Rising Bird package and identifies manufactured year 1989; current ASK is USD 166. Used as exact package/market corroboration, not as a Europe-delivered public ASK.'
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='rising-bird-18017' and r.edition_name like '%Lightning Racers%'
  and not exists(select 1 from public.release_sources s where s.release_id=r.id and s.source_url='https://www.ebay.com/itm/146460684069');

-- 2007 reissue.
update public.product_releases
set edition_name='Rising Bird — 2007 Reissue (Type 3)',
    release_type='Reissue',
    edition_type='reissue',
    release_date=date '2007-03-24',
    chassis='Type 3',
    barcode_jan='4950344996643',
    color='Blue',
    country_market='Global / Japan',
    verification_status='verified',
    production_status='unknown',
    discontinued=false,
    is_original=false,
    rarity=null,
    data_source='master_reaudit_20260928',
    status_checked_at=now(),
    catalog_visibility='public',
    catalog_visibility_reason='publication_gate:official_exact_reissue_record_and_exact_retail_image',
    catalog_visibility_updated_at=now(),
    description='2007 Type 3 Rising Bird reissue, ITEM 18017, released 24 March 2007.',
    description_it='Ristampa Rising Bird Type 3 del 2007, ITEM 18017, uscita il 24 marzo 2007.',
    notes=concat_ws(
      ' ',
      nullif(notes,''),
      'Controlled re-audit 2026-09-28: official Tamiya page dates ITEM 18017 to 2007-03-24. Hobby Search exact product record confirms JAN 4950344996643. Stable Suruga management-ID image 603015729 is assigned to this later/reissue identity rather than to either 1989 package generation.'
    ),
    updated_at=now()
where product_id=(select id from public.products where slug='rising-bird-18017')
  and item_number='18017' and release_year=2007;

insert into public.release_sources(release_id,source_type,source_url,verified_fields,checked_at,notes)
select r.id,'trusted_secondary','https://www.1999.co.jp/10086725',
       array['itemNumber','barcodeJAN','editionName','chassis','image']::text[],
       date '2026-09-28',
       'Hobby Search exact product record confirms ITEM 18017, JAN 4950344996643 and Type 3 specification for the modern/reissue catalog product.'
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='rising-bird-18017' and r.item_number='18017' and r.release_year=2007
  and not exists(select 1 from public.release_sources s where s.release_id=r.id and s.source_url='https://www.1999.co.jp/10086725');

insert into public.release_sources(release_id,source_type,source_url,verified_fields,checked_at,notes)
select r.id,'trusted_secondary','https://www.suruga-ya.jp/product/detail/603015729',
       array['itemNumber','editionName','chassis','image','marketPresence']::text[],
       date '2026-09-28',
       'Suruga exact product record management ID 603015729 identifies ITEM 18017 and provides the stable CDN hero used for the 2007 reissue identity.'
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='rising-bird-18017' and r.item_number='18017' and r.release_year=2007
  and not exists(select 1 from public.release_sources s where s.release_id=r.id and s.source_url='https://www.suruga-ya.jp/product/detail/603015729');

insert into public.release_identifiers(release_id,scheme,value,market,is_primary,verification_status,source_url,checked_at)
select r.id,'JAN','4950344996643','JP',true,'verified','https://www.1999.co.jp/10086725',now()
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='rising-bird-18017' and r.item_number='18017' and r.release_year=2007
  and not exists(select 1 from public.release_identifiers x where x.release_id=r.id and x.scheme='JAN' and x.value='4950344996643');

insert into public.release_images(release_id,url,position)
select r.id,'https://cdn.suruga-ya.jp/database/pics_webp/game/603015729.jpg.webp',0
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='rising-bird-18017' and r.item_number='18017' and r.release_year=2007
  and not exists(select 1 from public.release_images ri where ri.release_id=r.id);

-- 2017 plated-kit mention retained on the base product/research history only.
insert into public.release_sources(release_id,source_type,source_url,verified_fields,checked_at,notes)
select r.id,'official_catalog_pdf','https://www.tamiya.com/cms/japan/mini4wd/jr_news/jr_news17/pdf/000205.pdf',
       array['promotionContext']::text[],date '2026-09-28',
       'Tamiya Jr. News No.205 (2017) states that a limited-edition comic release included a Rising Bird plated kit among deluxe bonuses. Exact autonomous Release identity is unresolved; stored as research context only.'
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='rising-bird-18017' and r.item_number='18017' and r.release_year=2007
  and not exists(select 1 from public.release_sources s where s.release_id=r.id and s.source_url='https://www.tamiya.com/cms/japan/mini4wd/jr_news/jr_news17/pdf/000205.pdf');

-- Seed one exact-enough vintage SOLD observation for the Japanese 1989 original.
-- ECB reference 2025-09-05: EUR 1 = JPY 173.09.
-- JPY -> EUR = 1/173.09 ~= 0.005777341267548674.
insert into public.market_candidates(
  id,source_id,source_record_key,original_source,original_record_id,listing_url,title_raw,item_number_observed,
  possible_release_ids,resolved_release_id,price,currency,shipping_cost,shipping_basis,observation_type,
  condition_raw,condition,inner_bags_sealed,box_condition,is_complete,is_lot,quantity,match_confidence,
  match_evidence,evidence_group_key,sold_on,observed_at,decision,reason_codes,review_notes,needs_revalidation,
  raw_payload,first_observed_at,last_observed_at
)
select
  gen_random_uuid(),ps.id,
  'aucfan:rising-bird:vintage-unbuilt:2025-09-05:12000',
  'AUCFAN_YAHOO_ARCHIVE',null,
  'https://aucfan.com/search1/q-~a5e9a5a4a5b8a5f3a5b0a5d0a1bca5c9/s-ya/',
  'Tamiya Mini 4WD Rising Bird — vintage-era / unbuilt (当時物・未組立)',
  '18017',array[r.id],r.id,
  12000,'JPY',null,'unknown','auction_awarded',
  '当時物・未組立','new_complete_unbuilt','unknown','unknown',true,false,1,'strong',
  array['packaging_generation_match','manual_override'],
  'aucfan:rising-bird-original:2025-09-05',
  date '2025-09-05',now(),'accepted',array[]::text[],
  'Aucfan/Yahoo archive result explicitly identifies vintage-era (当時物) and unbuilt condition. Exact Japanese-original attribution is based on vintage-generation wording and manual review; shipping, box condition and inner-bag state are unknown.',
  false,
  jsonb_build_object(
    'adapter','manual-sold-audit-v1',
    'market_region','japan',
    'sale_date','2025-09-05',
    'fx_source','ECB reference rate via EU Official Journal',
    'eur_jpy',173.09,
    'condition_inferred',false,
    'archive','Aucfan/Yahoo Auctions'
  ),
  now(),now()
from public.product_releases r
join public.products p on p.id=r.product_id
join public.price_sources ps on ps.slug='aucfan_yahoo_closed_archive'
where p.slug='rising-bird-18017' and r.item_number='18017' and r.release_year=1989 and r.edition_type='original'
on conflict(source_id,source_record_key) do update set
  resolved_release_id=excluded.resolved_release_id,
  possible_release_ids=excluded.possible_release_ids,
  price=excluded.price,currency=excluded.currency,shipping_cost=excluded.shipping_cost,
  shipping_basis=excluded.shipping_basis,observation_type=excluded.observation_type,
  condition_raw=excluded.condition_raw,condition=excluded.condition,
  inner_bags_sealed=excluded.inner_bags_sealed,box_condition=excluded.box_condition,
  is_complete=excluded.is_complete,is_lot=excluded.is_lot,quantity=excluded.quantity,
  match_confidence=excluded.match_confidence,match_evidence=excluded.match_evidence,
  evidence_group_key=excluded.evidence_group_key,sold_on=excluded.sold_on,
  observed_at=excluded.observed_at,decision=excluded.decision,reason_codes=excluded.reason_codes,
  review_notes=excluded.review_notes,needs_revalidation=false,raw_payload=excluded.raw_payload,
  last_observed_at=excluded.last_observed_at,updated_at=now();

insert into public.price_points(
  id,candidate_id,release_id,source_id,observation_type,condition,
  price,currency,shipping_cost,shipping_basis,valuation_price,normalized_price_eur,
  fx_rate_to_eur,fx_rate_date,inner_bags_sealed,box_condition,is_complete,is_lot,
  quantity,match_confidence,match_evidence,evidence_group_key,valuation_eligible,
  status,needs_revalidation,sold_at,sold_on,observed_at,evidence_grade,quality_flags,
  market_price_eur,market_price_basis
)
select
  gen_random_uuid(),c.id,c.resolved_release_id,c.source_id,'auction_awarded','new_complete_unbuilt',
  c.price,c.currency,null,'unknown',null,null,
  0.005777341267548674::numeric,date '2025-09-05',
  'unknown','unknown',true,false,1,'strong',
  c.match_evidence,c.evidence_group_key,true,
  'active',false,null,c.sold_on,c.observed_at,'indicative',
  array['seller_unknown','shipping_unknown','inner_bags_unknown','box_condition_unknown'],
  69.33,'raw_sale'
from public.market_candidates c
join public.price_sources ps on ps.id=c.source_id
where ps.slug='aucfan_yahoo_closed_archive'
  and c.source_record_key='aucfan:rising-bird:vintage-unbuilt:2025-09-05:12000'
  and c.decision='accepted'
on conflict(candidate_id) do update set
  release_id=excluded.release_id,source_id=excluded.source_id,
  observation_type=excluded.observation_type,condition=excluded.condition,
  price=excluded.price,currency=excluded.currency,shipping_cost=excluded.shipping_cost,
  shipping_basis=excluded.shipping_basis,valuation_price=excluded.valuation_price,
  normalized_price_eur=excluded.normalized_price_eur,fx_rate_to_eur=excluded.fx_rate_to_eur,
  fx_rate_date=excluded.fx_rate_date,inner_bags_sealed=excluded.inner_bags_sealed,
  box_condition=excluded.box_condition,is_complete=excluded.is_complete,is_lot=excluded.is_lot,
  quantity=excluded.quantity,match_confidence=excluded.match_confidence,
  match_evidence=excluded.match_evidence,evidence_group_key=excluded.evidence_group_key,
  valuation_eligible=excluded.valuation_eligible,status=excluded.status,
  needs_revalidation=excluded.needs_revalidation,sold_on=excluded.sold_on,
  observed_at=excluded.observed_at,evidence_grade=excluded.evidence_grade,
  quality_flags=excluded.quality_flags,market_price_eur=excluded.market_price_eur,
  market_price_basis=excluded.market_price_basis,updated_at=now();

select public.trackdash_enqueue_market_recompute(r.id,'new_complete_unbuilt')
from public.product_releases r join public.products p on p.id=r.product_id
where p.slug='rising-bird-18017' and r.item_number='18017' and r.release_year=1989 and r.edition_type='original';

-- Enroll all canonical Releases, then park every shared ITEM 18017 eBay job.
select public.trackdash_enroll_release_market_scans(r.id)
from public.product_releases r
join public.products p on p.id=r.product_id
where p.slug='rising-bird-18017';

update public.market_scan_queue q
set enabled=false,
    priority=95,
    next_scan_at=timestamptz '2099-01-01 00:00:00+00',
    consecutive_failures=0,
    last_error=null,
    locked_until=null,
    updated_at=now()
where q.source_id=(select id from public.price_sources where slug='ebay_active_public')
  and q.scan_scope='active_marketplace'
  and q.release_id in (
    select r.id from public.product_releases r join public.products p on p.id=r.product_id
    where p.slug='rising-bird-18017' and r.item_number='18017'
  );

update public.market_scan_targets q
set enabled=false,
    priority=95,
    next_scan_at=timestamptz '2099-01-01 00:00:00+00',
    consecutive_failures=0,
    last_error=null,
    locked_until=null,
    updated_at=now()
where q.source_id=(select id from public.price_sources where slug='ebay_active_public')
  and q.release_id in (
    select r.id from public.product_releases r join public.products p on p.id=r.product_id
    where p.slug='rising-bird-18017' and r.item_number='18017'
  );

commit;
