-- Audited catalog data correction, 2026-10-22. New Frankfurt project only.
-- Preserve the existing 1993 Release UUID and all user references.
-- No SOLD/ASK/Market Value is manufactured. Publication is a separate step.
begin;
do $guard$
begin
  if not exists (select 1 from public.product_releases
    where id='936ac729-f26b-5a21-bec1-f2620b93c5c4'
      and product_id='e8a13fb8-4af2-5f5f-936e-8871d9567289'
      and release_year=1993 and item_number in ('94584','49568')) then
    raise exception 'POSEIDON_ORIGINAL_IDENTITY_CHANGED';
  end if;
  if exists (select 1 from public.product_releases
    where id<>'936ac729-f26b-5a21-bec1-f2620b93c5c4'
      and (item_number='49568' or barcode_jan='4950344495689')) then
    raise exception 'POSEIDON_ORIGINAL_IDENTIFIER_COLLISION';
  end if;
end $guard$;

update public.product_releases
set item_number='49568', barcode_jan='4950344495689',
    data_source='poseidon_x_physical_box_audit_20261022',
    notes='Original 1993 complete Black Special Super 1 kit. Corrected 2026-10-22: the original box explicitly carries ITEM 49568-600 and barcode 4950344495689; 94584/JAN 4950344945849 belong to the 2006 reissue. Physical packaging photos and independent specialist records corroborate the distinction. UUID preserved. November 1993 retained; exact day unverified. The buyback retailer placeholder date 1999-12-31 is not a release date. The photographed current shop item has box wear/near-unused condition; its JPY53960 ASK is not a confirmed sale or automatically eligible sealed-kit valuation.',
    catalog_visibility_reason='exact_original_box_image_verified_initial_refresh_pending',
    updated_at=now()
where id='936ac729-f26b-5a21-bec1-f2620b93c5c4';

-- The old 2006 review never established the original item number.
update public.release_sources
set verified_fields=array_remove(verified_fields,'itemNumber'),
    notes='2006 reissue review supports historical JPY600 original price and comparison of specifications. Original item number corrected separately from physical 49568 packaging on 2026-10-22; do not use this 94584 reissue article to identify the original code.'
where release_id='936ac729-f26b-5a21-bec1-f2620b93c5c4'
  and source_url='https://www.tea-league.com/mt/tea/archives/2006/12/x_6.html';

insert into public.release_identifiers
 (id,release_id,scheme,value,market,is_primary,verification_status,source_url,checked_at)
values (gen_random_uuid(),'936ac729-f26b-5a21-bec1-f2620b93c5c4',
 'JAN','4950344495689','JP',true,'verified',
 'https://jp.mercari.com/shops/product/Bma2YHJceEYaDdXkrCiGPP','2026-10-22')
on conflict (release_id,scheme,value,market) do update
set verification_status=excluded.verification_status,source_url=excluded.source_url,
 checked_at=excluded.checked_at,is_primary=excluded.is_primary;

insert into public.release_sources
 (id,release_id,source_type,source_url,verified_fields,checked_at,notes)
select gen_random_uuid(),'936ac729-f26b-5a21-bec1-f2620b93c5c4',
 v.kind,v.url,v.fields,'2026-10-22',v.note
from (values
 ('trusted_secondary','https://jp.mercari.com/shops/product/Bma2YHJceEYaDdXkrCiGPP',
  array['itemNumber','barcodeJAN','editionName','color','chassis']::text[],
  'Original edition physical-box audit: front image 2JPVsdUFH8LYmEMPHadjyX; box end 2JPVsdUFGxAdFKB5GWKNwV shows 49568-600; rear 2JPVsdUHoMtC3r2Nhea9dP shows barcode 4950344495689. HIGH-CONFIDENCE MATCHED exact original box photo; not the 2006 reissue. Near-unused worn-box ASK only, no SOLD or canonical price inserted.'),
 ('trusted_secondary','https://www.kaitori-world.jp/products/detail/276438',
  array['itemNumber','barcodeJAN','editionName']::text[],
  'Independent specialist buyback catalog corroborates ITEM49568 and JAN4950344495689. Its 1999-12-31 date is not used. JPY12680 is a BUYBACK quote, not retail ASK or completed sale.'),
 ('trusted_secondary','https://corocoro-news.jp/special/331656/',
  array['releaseYear','editionName']::text[],
  'Official publisher reproduces 1993 CoroCoro reporting of the Black Special complete-kit launch and Autumn Cup availability. Separate from the blue body-only accessory.')
) v(kind,url,fields,note)
where not exists (select 1 from public.release_sources s
 where s.release_id='936ac729-f26b-5a21-bec1-f2620b93c5c4' and s.source_url=v.url);

insert into public.release_images(id,release_id,url,position)
select gen_random_uuid(),'936ac729-f26b-5a21-bec1-f2620b93c5c4',
 'https://assets.mercari-shops-static.com/-/large/plain/2JPVsdUFH8LYmEMPHadjyX.jpg@jpg',0
where not exists (select 1 from public.release_images
 where release_id='936ac729-f26b-5a21-bec1-f2620b93c5c4'
 and url='https://assets.mercari-shops-static.com/-/large/plain/2JPVsdUFH8LYmEMPHadjyX.jpg@jpg');

select public.trackdash_enroll_release_market_scans('936ac729-f26b-5a21-bec1-f2620b93c5c4');
select public.trackdash_enqueue_market_recompute('936ac729-f26b-5a21-bec1-f2620b93c5c4','new_complete_unbuilt');

-- A single initial scan, ahead of the existing backlog, using the SAME clock.
-- This changes dispatch order for this Release only, not the recurring cadence.
update public.market_scan_queue q
set next_scan_at=least(now(),coalesce((select min(q2.next_scan_at)-interval '1 second'
 from public.market_scan_queue q2 join public.price_sources p2 on p2.id=q2.source_id
 where p2.slug='ebay_active_public' and q2.enabled and q2.id<>q.id),now())),
 updated_at=now()
from public.price_sources p
where q.source_id=p.id and p.slug='ebay_active_public' and q.enabled
 and q.release_id='936ac729-f26b-5a21-bec1-f2620b93c5c4'
 and q.last_success_at is null;

commit;
