-- Correct the Avante Mk.III Azure Clear Special release line.
-- 94741 = original 2010 occurrence; 95464 = 2018 re-release + 2023 reissue.
-- Visual configuration is documented as identical across 94741/95464, so the
-- official 95464 image is intentionally reused for the 2010 original.

update public.product_releases
set item_number = '94741',
    release_date = date '2010-10-02',
    notes = 'Original Azure Clear Special. RCJAZ and Mini 4WD Wiki identify item 94741; release date 2010-10-02. Later item 95464 re-releases the same visual configuration.',
    updated_at = now()
where id = '9d9d9015-81e5-5388-9d36-3e8b3b223b54';

delete from public.release_sources
where release_id = '9d9d9015-81e5-5388-9d36-3e8b3b223b54'
  and source_url in (
    'https://www.tamiya.com/japan/products/95464/index.html',
    'https://www.rcjaz.com/tamiya-95464-avante-mkiii-azure-clear-special-polycarbonate-body-ms-chassis-p-12108.html'
  );

insert into public.release_images (release_id, url, position)
select '9d9d9015-81e5-5388-9d36-3e8b3b223b54'::uuid,
       'https://www.tamiya.com/japan_contents/img/usr/item/9/95464/95464_1.jpg', 0
where not exists (
  select 1 from public.release_images
  where release_id='9d9d9015-81e5-5388-9d36-3e8b3b223b54'
    and url='https://www.tamiya.com/japan_contents/img/usr/item/9/95464/95464_1.jpg'
);

insert into public.release_sources (release_id,source_type,source_url,verified_fields,checked_at,notes)
select '9d9d9015-81e5-5388-9d36-3e8b3b223b54'::uuid,'trusted_secondary',
       'https://www.rcjaz.co.uk/tamiya-94741-132-avante-mkiii-azure-clear-special-polycarbonate-body-p-90022521.html',
       array['itemNumber','editionName','chassis','image'],date '2026-09-09',
       'RCJAZ identifies the original Azure Clear Special as item 94741 on MS chassis.'
where not exists (select 1 from public.release_sources where release_id='9d9d9015-81e5-5388-9d36-3e8b3b223b54' and source_url='https://www.rcjaz.co.uk/tamiya-94741-132-avante-mkiii-azure-clear-special-polycarbonate-body-p-90022521.html');

insert into public.release_sources (release_id,source_type,source_url,verified_fields,checked_at,notes)
select '9d9d9015-81e5-5388-9d36-3e8b3b223b54'::uuid,'trusted_secondary',
       'https://mini-4wd.fandom.com/wiki/Avante_Mk.III',
       array['itemNumber','releaseDate','editionName','chassis','color','image'],date '2026-09-09',
       'Mini 4WD Wiki lists 94741 as Azure Clear Special released 2010-10-02 and groups 94741/95464 under the same technical/visual configuration.'
where not exists (select 1 from public.release_sources where release_id='9d9d9015-81e5-5388-9d36-3e8b3b223b54' and source_url='https://mini-4wd.fandom.com/wiki/Avante_Mk.III');

insert into public.product_releases
  (product_id,item_number,release_type,edition_type,edition_name,release_year,release_date,chassis,barcode_jan,color,data_source,verification_status,production_status,discontinued,is_original)
select 'de719716-e50a-5811-b99d-18bbb153b166'::uuid,'95464','Reissue','reissue',
       'Avante Mk.III Azure Clear Special (2018 Reissue)',2018,date '2018-12-22','MS','4950344954643','Clear/Azure','manual','verified','unknown',false,false
where not exists (select 1 from public.product_releases where product_id='de719716-e50a-5811-b99d-18bbb153b166' and item_number='95464' and release_year=2018);

with target as (select id from public.product_releases where product_id='de719716-e50a-5811-b99d-18bbb153b166' and item_number='95464' and release_year=2018)
insert into public.release_images (release_id,url,position)
select id,'https://www.tamiya.com/japan_contents/img/usr/item/9/95464/95464_1.jpg',0 from target
where not exists (select 1 from public.release_images ri where ri.release_id=target.id and ri.url='https://www.tamiya.com/japan_contents/img/usr/item/9/95464/95464_1.jpg');

with target as (select id from public.product_releases where product_id='de719716-e50a-5811-b99d-18bbb153b166' and item_number='95464' and release_year=2018)
insert into public.release_sources (release_id,source_type,source_url,verified_fields,checked_at,notes)
select id,'trusted_secondary','https://product.rakuten.co.jp/product/-/726ba4f4958649aded5caff160afb326/?l2-id=pdt_ranking',array['itemNumber','releaseDate','jan','editionName'],date '2026-09-09','Rakuten product record identifies Tamiya 95464, release date 2018-12-22 and JAN 4950344954643.' from target
where not exists (select 1 from public.release_sources rs where rs.release_id=target.id and rs.source_url='https://product.rakuten.co.jp/product/-/726ba4f4958649aded5caff160afb326/?l2-id=pdt_ranking');

with target as (select id from public.product_releases where product_id='de719716-e50a-5811-b99d-18bbb153b166' and item_number='95464' and release_year=2018)
insert into public.release_sources (release_id,source_type,source_url,verified_fields,checked_at,notes)
select id,'trusted_secondary','https://tamiyablog.com/2018/11/tamiya-new-item-release-list-for-december-2018/',array['itemNumber','releaseYear','editionName'],date '2026-09-09','TamiyaBlog December 2018 release list includes item 95464 Avante Mk.III Azure Clear Special.' from target
where not exists (select 1 from public.release_sources rs where rs.release_id=target.id and rs.source_url='https://tamiyablog.com/2018/11/tamiya-new-item-release-list-for-december-2018/');

update public.market_candidates mc
set possible_release_ids = array[
      (select id from public.product_releases where product_id='de719716-e50a-5811-b99d-18bbb153b166' and item_number='95464' and release_year=2018),
      (select id from public.product_releases where product_id='de719716-e50a-5811-b99d-18bbb153b166' and item_number='95464' and release_year=2023)
    ]::uuid[],
    review_notes = 'ITEM 95464 is reused by the 2018 and 2023 Azure Clear Special occurrences. The public sale evidence does not identify which packaging/release was sold, so Release identity remains intentionally unresolved.',
    updated_at = now()
where mc.id='31d507ea-8002-42cb-838e-f45a61750559';
