-- Rollback-only production integration checks. No network calls or prices.
begin;
do $checks$
declare missing_id uuid; new_id uuid; valid_id uuid; valid_source uuid; valid_next timestamptz;
begin
 select q.release_id into missing_id from market_scan_queue q join price_sources s on s.id=q.source_id
 where s.slug='imodellini_public' and not exists(select 1 from market_scan_endpoints e where e.release_id=q.release_id and e.enabled and e.exact_release_verified) limit 1;
 if missing_id is null then raise exception 'Missing endpointless fixture'; end if;
 perform trackdash_enroll_release_market_scans(missing_id);
 if exists(select 1 from market_scan_queue q join market_source_policies p on p.source_id=q.source_id where q.release_id=missing_id and p.scan_scope='retail' and q.enabled and not exists(select 1 from market_scan_endpoints e where e.release_id=q.release_id and e.source_id=q.source_id and e.enabled and e.exact_release_verified))
 then raise exception 'Repeated enrollment reactivated a placeholder'; end if;
 select r.id into new_id from product_releases r join products p on p.id=r.product_id join brands b on b.id=p.brand_id
 where b.slug='tamiya' and not exists(select 1 from market_scan_queue q join price_sources s on s.id=q.source_id where q.release_id=r.id and s.slug='imodellini_public')
 and not exists(select 1 from market_scan_endpoints e where e.release_id=r.id and e.enabled and e.exact_release_verified) limit 1;
 if new_id is null then raise exception 'Missing new enrollment fixture'; end if;
 perform trackdash_enroll_release_market_scans(new_id);
 if (select count(*) from market_scan_queue q join price_sources s on s.id=q.source_id where q.release_id=new_id and s.slug in('imodellini_public','pieroni_public') and not q.enabled and q.next_scan_at='2099-01-01T00:00:00Z')<>2
 then raise exception 'New enrollment created executable placeholders'; end if;
 select q.release_id,q.source_id,q.next_scan_at into valid_id,valid_source,valid_next from market_scan_queue q join price_sources s on s.id=q.source_id
 where s.slug='pieroni_public' and q.enabled and q.next_scan_at>now()
 and exists(select 1 from market_scan_endpoints e where e.release_id=q.release_id and e.source_id=q.source_id and e.enabled and e.exact_release_verified) limit 1 for update of q;
 if valid_id is null then raise exception 'Missing configured retail fixture'; end if;
 perform trackdash_enroll_release_market_scans(valid_id);
 if not exists(select 1 from market_scan_queue where release_id=valid_id and source_id=valid_source and enabled and next_scan_at=valid_next) then raise exception 'Configured schedule changed'; end if;
 update market_scan_queue set enabled=false where release_id=valid_id and source_id=valid_source;
 perform trackdash_enroll_release_market_scans(valid_id);
 if exists(select 1 from market_scan_queue where release_id=valid_id and source_id=valid_source and enabled) then raise exception 'Manual pause undone'; end if;
end $checks$;
rollback;
select 'PASS: new placeholders parked; repeated enrollment safe; configured cadence preserved; manual pause preserved; all test writes rolled back' result;
