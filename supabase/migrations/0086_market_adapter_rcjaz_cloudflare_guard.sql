-- Live Vercel preview probe (2026-09-14) received HTTP 403 / Cloudflare
-- challenge from RCJAZ. Keep RCJAZ as a structural market reference, but do
-- not claim it automatically from the TrackDash worker. It can return to
-- `ready` only when we have an approved API/feed or a crawl-compatible path.

update public.market_source_policies p
set adapter_status = 'planned', updated_at = now()
from public.price_sources ps
where p.source_id = ps.id
  and ps.slug = 'rcjaz_public';
