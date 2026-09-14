-- Source-safety guard for Market Automation v1.1.
-- Hobby Search / 1999 is useful market evidence, but its public site currently
-- advertises crawler restrictions. Keep it registered and endpoint-mapped for
-- manual/reference use, but do not let the automatic worker claim it until an
-- approved feed/API or explicit crawl-compatible path is available.

update public.market_source_policies p
set adapter_status = 'planned', updated_at = now()
from public.price_sources ps
where p.source_id = ps.id
  and ps.slug = 'hobby_search_1999_public';
