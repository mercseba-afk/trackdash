-- Identity-only recovery: retailer prices/stock are not imported.
begin;
do $check$ begin
 if (select count(*) from product_releases where item_number='18011' and edition_name='Fire Dragon Jr. — 2012 Reissue' and (barcode_jan is null or barcode_jan='4950344962877'))<>1 then raise exception 'Unexpected 2012 release baseline'; end if;
 if exists(select 1 from product_releases where barcode_jan='4950344962877' and not(item_number='18011' and edition_name='Fire Dragon Jr. — 2012 Reissue')) then raise exception 'JAN already assigned elsewhere'; end if;
 if (select barcode_jan from product_releases where item_number='18011' and edition_name='Fire Dragon Jr. — 1988 Original') is distinct from '4950344180110' then raise exception 'Original JAN baseline changed'; end if;
end $check$;
update product_releases set barcode_jan='4950344962877',
notes=coalesce(notes,'') || E'\nIdentity audit 2026-10-29: JAN 4950344962877 corroborated by HobbyLink Japan TAM18011 (2012/08/10 retailer release record), Hobby Search 10087243 and TamTam 69129. Official Tamiya release date 2012-08-11 remains unchanged. This JAN is distinct from the catalogued 1988 original 4950344180110. Retail pages currently out of stock: no retailer price imported. Shared ITEM 18011 still requires exact JAN confirmation in eBay item details.',updated_at=now()
where item_number='18011' and edition_name='Fire Dragon Jr. — 2012 Reissue' and barcode_jan is null;
with evidence(url,note) as (values
('https://www.hlj.co.jp/product/TAM18011','JAN4950344962877 + ITEM18011 + 2012 release corroboration. Retailer lists August10; official August11 retained. Out of stock; identity only.'),
('https://www.1999.co.jp/10087243','JAN4950344962877 and ITEM18011 corroboration. Out of stock; identity only, no price ingestion.'),
('https://hs-tamtam.co.jp/product/detail/69129/','Independent JAN4950344962877 and ITEM18011 corroboration. Out of stock; identity only, no price ingestion.'))
insert into release_sources(release_id,source_type,source_url,verified_fields,checked_at,notes)
select r.id,'trusted_secondary',v.url,array['itemNumber','barcodeJan','editionName'],'2026-10-29',v.note
from product_releases r cross join evidence v where r.item_number='18011' and r.edition_name='Fire Dragon Jr. — 2012 Reissue'
and not exists(select 1 from release_sources rs where rs.release_id=r.id and rs.source_url=v.url);
select public.trackdash_enroll_release_market_scans(id) from product_releases where item_number='18011' and edition_name='Fire Dragon Jr. — 2012 Reissue';
update market_scan_queue q set next_scan_at=now(),updated_at=now()
from product_releases r,price_sources s where q.release_id=r.id and q.source_id=s.id and s.slug='ebay_active_public' and q.enabled and r.item_number='18011' and r.edition_name='Fire Dragon Jr. — 2012 Reissue' and q.last_success_at is null;
update market_scan_targets q set next_scan_at=now(),updated_at=now()
from product_releases r,price_sources s where q.release_id=r.id and q.source_id=s.id and s.slug='ebay_active_public' and q.enabled and r.item_number='18011' and r.edition_name='Fire Dragon Jr. — 2012 Reissue' and q.last_success_at is null;
do $check$ begin
 if not exists(select 1 from market_scan_queue q join product_releases r on r.id=q.release_id join price_sources s on s.id=q.source_id where r.item_number='18011' and r.edition_name='Fire Dragon Jr. — 2012 Reissue' and r.barcode_jan='4950344962877' and s.slug='ebay_active_public' and q.enabled) then raise exception 'Safe scanner enrollment failed'; end if;
end $check$;
commit;
