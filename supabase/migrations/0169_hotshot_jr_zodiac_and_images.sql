-- Hotshot Jr. family completion follow-up — 2026-09-25
-- Adds the two Hotshot-based Zodiac kits missed by the first pass and improves
-- exact image coverage using stable, independently probed Suruga-ya assets.

begin;

update public.products
set metadata=coalesce(metadata,'{}'::jsonb) || jsonb_build_object(
      'catalog_audit','2026-09-25',
      'canonical_release_count',16,
      'related_noncanonical_products',jsonb_build_array(
        '94580 — assembled/finished 2007 Year of the Boar Hotshot Jr.; related product, intentionally outside the canonical unbuilt-kit Release family'
      )
    ),
    updated_at=now()
where id='a8dddf2c-ba7d-56e8-9816-adde32fd8907'::uuid;

insert into public.product_releases(
  product_id,item_number,release_type,edition_name,release_year,release_date,chassis,barcode_jan,color,
  country_market,msrp_jpy,notes,discontinued,is_original,rarity,data_source,edition_type,
  verification_status,production_status,status_checked_at,description,description_it
) values
(
  'a8dddf2c-ba7d-56e8-9816-adde32fd8907'::uuid,'94510','Zodiac Limited',
  'Hotshot Jr. — 2004 Year of the Monkey (Zodiac Mini 4WD)',2003,date '2003-12-22','Type 1','4950344945108',
  'Pearl blue body / yellow wheels / monkey driver','Japan',null,
  'Officially themed 2004 Zodiac Mini 4WD based on Hotshot Jr. The kit went on sale 2003-12-22 for the 2004 Year of the Monkey. Exact ITEM 94510 and JAN 4950344945108 are independently documented. release_year follows actual commercial release year; the model-year identity remains 2004 in the edition name.',
  true,false,null,'master_reaudit_20260925','limited','verified','discontinued',now(),
  'Hotshot Jr.-based 2004 Year of the Monkey Zodiac Mini 4WD, ITEM 94510.',
  'Mini 4WD Zodiac 2004 Anno della Scimmia basata sulla Hotshot Jr., ITEM 94510.'
),
(
  'a8dddf2c-ba7d-56e8-9816-adde32fd8907'::uuid,'94579','Zodiac Limited',
  'Hotshot Jr. — 2007 Year of the Boar (Zodiac Mini 4WD)',2006,date '2006-12-02','Type 1',null,
  'Light green body / yellow wheels / boar driver','Japan',1100,
  'Official 2007 Zodiac Mini 4WD kit based on Hotshot Jr., released 2006-12-02 for the 2007 Year of the Boar. ITEM 94579 is exact. A separate assembled product 94580 is known but intentionally excluded from TrackDash canonical unbuilt-kit Releases.',
  true,false,null,'master_reaudit_20260925','limited','verified','discontinued',now(),
  'Hotshot Jr.-based 2007 Year of the Boar Zodiac Mini 4WD kit, ITEM 94579.',
  'Kit Mini 4WD Zodiac 2007 Anno del Cinghiale basato sulla Hotshot Jr., ITEM 94579.'
)
on conflict on constraint product_releases_identity_unique do update set
  release_type=excluded.release_type,
  edition_name=excluded.edition_name,
  release_date=excluded.release_date,
  chassis=excluded.chassis,
  barcode_jan=excluded.barcode_jan,
  color=excluded.color,
  country_market=excluded.country_market,
  msrp_jpy=excluded.msrp_jpy,
  notes=excluded.notes,
  discontinued=excluded.discontinued,
  is_original=excluded.is_original,
  data_source=excluded.data_source,
  edition_type=excluded.edition_type,
  verification_status=excluded.verification_status,
  production_status=excluded.production_status,
  status_checked_at=excluded.status_checked_at,
  description=excluded.description,
  description_it=excluded.description_it,
  updated_at=now();

-- Identity/provenance for the Zodiac variants.
insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
select gen_random_uuid(),r.id,s.source_type,s.source_url,s.verified_fields,date '2026-09-25',s.notes
from (
  values
  ('Hotshot Jr. — 2004 Year of the Monkey (Zodiac Mini 4WD)','official_archive',
   'https://d7z22c0gz59ng.cloudfront.net/cms/japan/mini4wd/jr_news/jr_news10/pdf/000113.pdf',
   array['editionName','baseModel','color'],
   'Official Tamiya Jr. News Zodiac retrospective identifies the 2004 Year of the Monkey as Hotshot Jr.-based.'),
  ('Hotshot Jr. — 2004 Year of the Monkey (Zodiac Mini 4WD)','trusted_secondary',
   'https://www.kaitori-world.jp/products/detail/277946',
   array['itemNumber','releaseDate','barcodeJAN'],
   'Specialist product record: ITEM 94510, release 2003-12-22, JAN/EAN 4950344945108.'),
  ('Hotshot Jr. — 2007 Year of the Boar (Zodiac Mini 4WD)','official_archive',
   'https://d7z22c0gz59ng.cloudfront.net/cms/japan/mini4wd/jr_news/jr_news10/pdf/000113.pdf',
   array['editionName','baseModel','color'],
   'Official Tamiya Jr. News Zodiac retrospective identifies the 2007 Year of the Boar as Hotshot Jr.-based.'),
  ('Hotshot Jr. — 2007 Year of the Boar (Zodiac Mini 4WD)','trusted_secondary',
   'https://www.suruga-ya.jp/product/detail/603021779',
   array['itemNumber','releaseDate','editionName','chassis','color','image'],
   'Exact Suruga-ya product record: ITEM 94579, release 2006-12-02, Hotshot Jr. base, Type 1.'),
  ('Hotshot Jr. — 2004 Year of the Monkey (Zodiac Mini 4WD)','trusted_secondary',
   'https://jp.mercari.com/shops/product/AozXxrDxH5wVSZsHw7AhZ6',
   array['itemNumber','releaseDate','editionName'],
   'Suruga-ya Mercari storefront exact product record corroborates ITEM 94510 and 2003-12-22 release.')
) as s(edition_name,source_type,source_url,verified_fields,notes)
join public.product_releases r
  on r.product_id='a8dddf2c-ba7d-56e8-9816-adde32fd8907'::uuid
 and r.edition_name=s.edition_name
where not exists (
  select 1 from public.release_sources existing
  where existing.release_id=r.id and existing.source_url=s.source_url
);

-- Exact Suruga image provenance for five Releases. URLs were independently
-- HTTP-probed through TrackDash Next/Image before insertion.
delete from public.release_images
where release_id in (
  (select id from public.product_releases where product_id='a8dddf2c-ba7d-56e8-9816-adde32fd8907'::uuid and edition_name='Hotshot Jr. — 2004 Year of the Monkey (Zodiac Mini 4WD)' limit 1),
  (select id from public.product_releases where product_id='a8dddf2c-ba7d-56e8-9816-adde32fd8907'::uuid and edition_name='Hotshot Jr. — 2007 Year of the Boar (Zodiac Mini 4WD)' limit 1),
  'b7bcbc9a-eed5-4a45-aab9-020a4e6903bf'::uuid,
  'eb1b538b-5e1a-4966-888f-03545722b9bc'::uuid,
  '111fc325-7423-4e4a-aba3-5cb5c0ee3906'::uuid
);

insert into public.release_images(id,release_id,url,position)
values
(gen_random_uuid(),(select id from public.product_releases where product_id='a8dddf2c-ba7d-56e8-9816-adde32fd8907'::uuid and edition_name='Hotshot Jr. — 2004 Year of the Monkey (Zodiac Mini 4WD)' limit 1),'https://cdn.suruga-ya.jp/database/pics_webp/game/603021736.jpg.webp',0),
(gen_random_uuid(),(select id from public.product_releases where product_id='a8dddf2c-ba7d-56e8-9816-adde32fd8907'::uuid and edition_name='Hotshot Jr. — 2007 Year of the Boar (Zodiac Mini 4WD)' limit 1),'https://cdn.suruga-ya.jp/database/pics_webp/game/603021779.jpg.webp',0),
(gen_random_uuid(),'b7bcbc9a-eed5-4a45-aab9-020a4e6903bf'::uuid,'https://cdn.suruga-ya.jp/database/pics_webp/game/603011883.jpg.webp',0),
(gen_random_uuid(),'eb1b538b-5e1a-4966-888f-03545722b9bc'::uuid,'https://cdn.suruga-ya.jp/database/pics_webp/game/603059028.jpg.webp',0),
(gen_random_uuid(),'111fc325-7423-4e4a-aba3-5cb5c0ee3906'::uuid,'https://cdn.suruga-ya.jp/database/pics_webp/game/603157890.jpg.webp',0);

-- Suruga image provenance sources for existing Releases.
insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
values
(gen_random_uuid(),'b7bcbc9a-eed5-4a45-aab9-020a4e6903bf'::uuid,'trusted_secondary','https://www.suruga-ya.jp/product/detail/603011883',array['itemNumber','barcodeJAN','editionName','image'],date '2026-09-25','Exact ITEM 94680 product/image provenance.'),
(gen_random_uuid(),'eb1b538b-5e1a-4966-888f-03545722b9bc'::uuid,'trusted_secondary','https://www.suruga-ya.jp/product/other/603059028',array['itemNumber','editionName','image'],date '2026-09-25','Exact ITEM 94687 product/image provenance.'),
(gen_random_uuid(),'111fc325-7423-4e4a-aba3-5cb5c0ee3906'::uuid,'trusted_secondary','https://www.suruga-ya.jp/product/detail/603157890',array['itemNumber','editionName','image'],date '2026-09-25','Exact ITEM 92435 product/image provenance.')
on conflict do nothing;

-- JAN for 94510. 94579 remains NULL until an exact barcode source is found.
insert into public.release_identifiers(id,release_id,scheme,value,market,is_primary,verification_status,source_url,checked_at)
select gen_random_uuid(),r.id,'JAN','4950344945108','JP',true,'verified',
       'https://www.kaitori-world.jp/products/detail/277946',now()
from public.product_releases r
where r.product_id='a8dddf2c-ba7d-56e8-9816-adde32fd8907'::uuid
  and r.edition_name='Hotshot Jr. — 2004 Year of the Monkey (Zodiac Mini 4WD)'
on conflict (release_id,scheme,value,market) do update set
 verification_status=excluded.verification_status,
 source_url=excluded.source_url,
 checked_at=excluded.checked_at;

-- Baseline market signals + source enrollment.
insert into public.market_release_signals(
  release_id,condition,market_regime,market_value_eur,low_eur,high_eur,
  confidence_score,confidence_label,retail_anchor_eur,active_anchor_eur,sold_anchor_eur,
  retail_source_count,active_offer_count,current_offer_count,sold_units,sold_source_count,
  sold_evidence_count,shipping_known_ratio,algorithm_version,market_method_version,computed_at
)
select r.id,'new_complete_unbuilt','insufficient',null,null,null,0,'low',
       null,null,null,0,0,0,0,0,0,0,'r3','v4',now()
from public.product_releases r
where r.product_id='a8dddf2c-ba7d-56e8-9816-adde32fd8907'::uuid
  and r.edition_name in (
    'Hotshot Jr. — 2004 Year of the Monkey (Zodiac Mini 4WD)',
    'Hotshot Jr. — 2007 Year of the Boar (Zodiac Mini 4WD)'
  )
on conflict (release_id,condition) do nothing;

select public.trackdash_enroll_release_market_scans(r.id)
from public.product_releases r
where r.product_id='a8dddf2c-ba7d-56e8-9816-adde32fd8907'::uuid
  and r.edition_name in (
    'Hotshot Jr. — 2004 Year of the Monkey (Zodiac Mini 4WD)',
    'Hotshot Jr. — 2007 Year of the Boar (Zodiac Mini 4WD)'
  );

-- Prioritize the new unique item numbers alongside the six already-safe codes.
update public.market_scan_targets t
set priority=130,next_scan_at='2000-01-01 00:00:00+00'::timestamptz,
    consecutive_failures=0,last_error=null,locked_until=null,updated_at=now()
from public.price_sources ps, public.product_releases r
where t.source_id=ps.id and t.release_id=r.id
  and ps.slug='ebay_active_public'
  and t.enabled
  and r.product_id='a8dddf2c-ba7d-56e8-9816-adde32fd8907'::uuid
  and r.item_number in ('94510','94579');

update public.market_scan_queue q
set priority=130,next_scan_at='2000-01-01 00:00:00+00'::timestamptz,
    consecutive_failures=0,last_error=null,locked_until=null,updated_at=now()
from public.price_sources ps, public.product_releases r
where q.source_id=ps.id and q.release_id=r.id
  and ps.slug='ebay_active_public'
  and q.enabled
  and r.product_id='a8dddf2c-ba7d-56e8-9816-adde32fd8907'::uuid
  and r.item_number in ('94510','94579');

commit;
