-- Dyna-Hawk 95467 exact RCJAZ endpoint.
-- RCJAZ is an independent market channel for this Release. Because it is
-- extra-EU, local/free shipping must never be interpreted as landed-to-Europe
-- cost; the Europe-first model keeps it as breadth/context unless a European
-- delivered cost is explicitly known.

insert into public.market_scan_endpoints
  (id,release_id,source_id,endpoint_url,parser_kind,exact_release_verified,enabled)
select
  gen_random_uuid(),
  'ace0d1b1-aaf3-589a-977c-a3df07c83c73'::uuid,
  ps.id,
  'https://www.rcjaz.com/tamiya-95467-dynahawk-gx-super-xx-special-mini-4wd-kit-p-12156.html',
  'generic_product_page',
  true,
  true
from public.price_sources ps
where ps.slug='rcjaz_public'
on conflict (release_id,source_id,endpoint_url)
do update set
  exact_release_verified=true,
  enabled=true,
  parser_kind='generic_product_page',
  updated_at=now();

-- Force one immediate exact-page check as part of the family closeout.
-- This does not fake success; the worker will update last_success_at only after
-- a real fetch/parser result.
update public.market_scan_queue q
set next_scan_at=now(),
    priority=greatest(q.priority,115),
    locked_until=null,
    updated_at=now()
from public.price_sources ps
where ps.id=q.source_id
  and q.release_id='ace0d1b1-aaf3-589a-977c-a3df07c83c73'::uuid
  and ps.slug='rcjaz_public';
