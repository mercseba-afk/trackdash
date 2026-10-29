-- Retail enrollment guard. Known baseline hash prevents patching an unexpected function.
do $patch$
declare fn text := pg_get_functiondef('public.trackdash_enroll_release_market_scans(uuid)'::regprocedure);
begin
 if md5(fn)<>'7c1ed6cfd06f87ab218f92acbf86125c' then raise exception 'Enrollment definition changed; review before patch'; end if;
 if (length(fn)-length(replace(fn,$old0$when ps.slug = 'ebay_active_public' then v_ebay_identity_eligible
      else true$old0$,'')))/length($old0$when ps.slug = 'ebay_active_public' then v_ebay_identity_eligible
      else true$old0$) <> 2 then raise exception 'Unexpected patch count 0'; end if;
 fn:=replace(fn,$old0$when ps.slug = 'ebay_active_public' then v_ebay_identity_eligible
      else true$old0$,$new0$when ps.slug = 'ebay_active_public' then v_ebay_identity_eligible
      when p.scan_scope = 'retail' then exists (select 1 from public.market_scan_endpoints ep where ep.release_id = p_release_id and ep.source_id = p.source_id and ep.enabled and ep.exact_release_verified)
      else true$new0$);
 if (length(fn)-length(replace(fn,$old1$      else v_now
    end,$old1$,'')))/length($old1$      else v_now
    end,$old1$) <> 2 then raise exception 'Unexpected patch count 1'; end if;
 fn:=replace(fn,$old1$      else v_now
    end,$old1$,$new1$      when p.scan_scope = 'retail' and not exists (select 1 from public.market_scan_endpoints ep where ep.release_id = p_release_id and ep.source_id = p.source_id and ep.enabled and ep.exact_release_verified)
        then v_parked_at
      else v_now
    end,$new1$);
 if (length(fn)-length(replace(fn,$old2$      else public.market_scan_targets.enabled
    end,$old2$,'')))/length($old2$      else public.market_scan_targets.enabled
    end,$old2$) <> 1 then raise exception 'Unexpected patch count 2'; end if;
 fn:=replace(fn,$old2$      else public.market_scan_targets.enabled
    end,$old2$,$new2$      when exists (select 1 from public.market_source_policies rp where rp.source_id = excluded.source_id and rp.scan_scope = 'retail')
        and not exists (select 1 from public.market_scan_endpoints ep where ep.release_id = p_release_id and ep.source_id = excluded.source_id and ep.enabled and ep.exact_release_verified) then false
      else public.market_scan_targets.enabled
    end,$new2$);
 if (length(fn)-length(replace(fn,$old3$      else public.market_scan_targets.next_scan_at
    end,$old3$,'')))/length($old3$      else public.market_scan_targets.next_scan_at
    end,$old3$) <> 1 then raise exception 'Unexpected patch count 3'; end if;
 fn:=replace(fn,$old3$      else public.market_scan_targets.next_scan_at
    end,$old3$,$new3$      when exists (select 1 from public.market_source_policies rp where rp.source_id = excluded.source_id and rp.scan_scope = 'retail')
        and not exists (select 1 from public.market_scan_endpoints ep where ep.release_id = p_release_id and ep.source_id = excluded.source_id and ep.enabled and ep.exact_release_verified) then v_parked_at
      else public.market_scan_targets.next_scan_at
    end,$new3$);
 if (length(fn)-length(replace(fn,$old4$      else public.market_scan_queue.enabled
    end,$old4$,'')))/length($old4$      else public.market_scan_queue.enabled
    end,$old4$) <> 1 then raise exception 'Unexpected patch count 4'; end if;
 fn:=replace(fn,$old4$      else public.market_scan_queue.enabled
    end,$old4$,$new4$      when exists (select 1 from public.market_source_policies rp where rp.source_id = excluded.source_id and rp.scan_scope = 'retail')
        and not exists (select 1 from public.market_scan_endpoints ep where ep.release_id = p_release_id and ep.source_id = excluded.source_id and ep.enabled and ep.exact_release_verified) then false
      else public.market_scan_queue.enabled
    end,$new4$);
 if (length(fn)-length(replace(fn,$old5$      else public.market_scan_queue.next_scan_at
    end,$old5$,'')))/length($old5$      else public.market_scan_queue.next_scan_at
    end,$old5$) <> 1 then raise exception 'Unexpected patch count 5'; end if;
 fn:=replace(fn,$old5$      else public.market_scan_queue.next_scan_at
    end,$old5$,$new5$      when exists (select 1 from public.market_source_policies rp where rp.source_id = excluded.source_id and rp.scan_scope = 'retail')
        and not exists (select 1 from public.market_scan_endpoints ep where ep.release_id = p_release_id and ep.source_id = excluded.source_id and ep.enabled and ep.exact_release_verified) then v_parked_at
      else public.market_scan_queue.next_scan_at
    end,$new5$);
 execute fn;
end $patch$;
-- Park placeholders only. Preserve valid endpoints, previous successes, locks,
-- failures and historical prices. The existing verified-endpoint registration
-- flow explicitly enables a parked row when its page is approved.
update public.market_scan_queue q
set enabled=false,next_scan_at='2099-01-01T00:00:00Z',updated_at=now()
from public.market_source_policies p
where p.source_id=q.source_id and p.scan_scope='retail' and q.scan_scope='retail' and q.enabled
  and not exists (select 1 from public.market_scan_endpoints e where e.source_id=q.source_id and e.release_id=q.release_id and e.enabled and e.exact_release_verified);
update public.market_scan_targets t
set enabled=false,next_scan_at='2099-01-01T00:00:00Z',updated_at=now()
from public.market_source_policies p
where p.source_id=t.source_id and p.scan_scope='retail' and t.enabled
  and not exists (select 1 from public.market_scan_endpoints e where e.source_id=t.source_id and e.release_id=t.release_id and e.enabled and e.exact_release_verified);
