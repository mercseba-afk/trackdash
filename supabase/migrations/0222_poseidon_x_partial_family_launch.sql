-- Poseidon-X controlled partial launch — 2026-10-10
-- Replays the already-performed one-time coming_soon -> available DB transition
-- on clean installations and is a NO-OP on already-published databases.
-- The existing DB trigger provides exactly one family-available event per user.
-- 1993 original stays research_only. No price/offer/sold data are touched.
begin;
update public.products p
set metadata = coalesce(p.metadata,'{}'::jsonb)
 || jsonb_build_object(
   'launch_status','available',
   'launch_status_updated_at','2026-10-10',
   'launch_strategy','progressive_public_catalog_v1',
   'family_completion',coalesce(p.metadata->'family_completion','{}'::jsonb)
     || jsonb_build_object(
       'status','partial_publication_live',
       'published_at','2026-10-10',
       'public_release_count',1,
       'research_only_release_count',1
     )
 ), updated_at=now()
where p.id='e8a13fb8-4af2-5f5f-936e-8871d9567289'::uuid
 and p.metadata->>'launch_status'='coming_soon'
 and exists (
   select 1 from public.product_releases r
   join public.release_images i on i.release_id=r.id
   join public.market_release_signals s on s.release_id=r.id
   where r.product_id=p.id
     and r.id='c37d4161-aa31-535b-b1de-9040730a4cdd'::uuid
     and r.verification_status='verified'
     and r.catalog_visibility='public'
     and s.condition='new_complete_unbuilt'
     and s.market_method_version='v4'
 )
 and exists (
   select 1 from public.product_releases r
   where r.product_id=p.id
     and r.id='936ac729-f26b-5a21-bec1-f2620b93c5c4'::uuid
     and r.catalog_visibility='research_only'
 );
commit;