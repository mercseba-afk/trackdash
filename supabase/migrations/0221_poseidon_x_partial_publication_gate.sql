-- Poseidon-X staged catalog family representative image and audited first scan.
-- 2026-10-10; no public launch or per-Release price mutation.
-- The product-level image is a representative 2006 Black Special photo;
-- it is NOT assigned to the image-less 1993 original release.
begin;
insert into public.product_images(id,product_id,url,position)
select gen_random_uuid(),
 'e8a13fb8-4af2-5f5f-936e-8871d9567289',
 'https://myrcstation.com/cdn/shop/products/96b79938ea5aeb7c1d696355af5e2d88_1200x1200.jpg?v=1630399392',0
where not exists (
  select 1 from public.product_images
  where product_id='e8a13fb8-4af2-5f5f-936e-8871d9567289'
  and url='https://myrcstation.com/cdn/shop/products/96b79938ea5aeb7c1d696355af5e2d88_1200x1200.jpg?v=1630399392'
);
update public.products
set metadata=coalesce(metadata,'{}'::jsonb) || jsonb_build_object(
 'family_audit',coalesce(metadata->'family_audit','{}'::jsonb) || jsonb_build_object(
 'initial_ebay_scan_at','2026-10-10T20:23:25Z',
 'initial_ebay_scan_result','2006 scanned successfully; 1 unassigned 94584 needs_review, no edition-qualified accepted candidates',
 'canonical_recompute_at','2026-10-10T20:23:09Z',
 'canonical_recompute_method','v4',
 'public_release_count',1,
 'research_only_release_count',1,
 'image_gaps',1,
 'market_status','thin_market_challenged_no_eligible_current_signal',
 'publication_eligibility','only_2006_photo_based; 1993_research_only'
 ),
 'family_completion',jsonb_build_object(
   'status','partial_publication_ready',
   'method','TrackDash current family method',
   'public_release_count',1,
   'research_only_release_count',1,
   'exact_or_high_confidence_images',1,
   'documented_image_gaps',1,
   'market_watch_enrolled',true,
   'market_signal_method','v4',
   'verified_at','2026-10-10'
 )
),
 updated_at=now()
where id='e8a13fb8-4af2-5f5f-936e-8871d9567289'
 and metadata->>'launch_status'='coming_soon';
commit;