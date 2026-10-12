-- TrackDash Phase 0: read-only, repeatable market coverage and operational KPIs.
-- Run against Supabase public schema. NEVER write, auto-publish or relax price gates here.
-- Scope deliberately excludes coming_soon, archived, research_only and partial Release identities.
-- Historical ask snapshots are NOT current ASK evidence.
-- Includes only accepted offers within canonical channel TTL; SOLD and MV remain separate.
-- Usage: run this entire SELECT from Supabase SQL editor / read-only audit.
WITH cohort AS (
  SELECT r.id, r.item_number, r.barcode_jan, r.created_at
  FROM public.product_releases r
  JOIN public.products p ON p.id = r.product_id
  JOIN public.categories cat ON cat.id = p.category_id
  WHERE cat.slug = 'mini4wd'
    AND p.metadata->>'launch_status' = 'available'
    AND r.catalog_visibility = 'public'
    AND r.verification_status = 'verified'
), identity_gate AS (
  SELECT c.id,
    (SELECT COUNT(*) FROM public.product_releases r
      WHERE r.item_number = c.item_number) AS item_siblings,
    (SELECT COUNT(*) FROM public.product_releases r
      WHERE r.barcode_jan = c.barcode_jan AND c.barcode_jan IS NOT NULL
        AND btrim(c.barcode_jan) <> '') AS jan_siblings
  FROM cohort c
), current_ask AS (
  SELECT DISTINCT o.release_id
  FROM public.market_offer_states o
  JOIN cohort c ON c.id = o.release_id
  JOIN public.market_candidates mc ON mc.id = o.candidate_id
    AND mc.decision = 'accepted'
  WHERE o.condition = 'new_complete_unbuilt'
    AND o.item_price_eur > 0
    AND o.availability IN ('in_stock','low_stock')
    AND (
      (o.channel = 'marketplace' AND o.last_checked_at >= now() - interval '360 hours')
      OR
      (o.channel = 'retail' AND o.last_checked_at >= now() - interval '744 hours')
    )
), release_evidence AS (
  SELECT c.id,
    coalesce(s.market_value_eur > 0,false) AS mv,
    coalesce(s.sold_anchor_eur > 0 AND s.sold_units > 0,false) AS sold,
    (a.release_id IS NOT NULL) AS ask
  FROM cohort c
  LEFT JOIN public.market_release_signals s ON s.release_id = c.id
    AND s.condition = 'new_complete_unbuilt'
  LEFT JOIN current_ask a ON a.release_id = c.id
), jobs AS (
  SELECT q.release_id, ps.slug, q.next_scan_at, q.locked_until,
    (
      q.enabled AND sp.adapter_status = 'ready'
      AND q.scan_scope = 'active_marketplace'
      AND ps.slug = 'ebay_active_public'
      AND (i.item_siblings = 1 OR (i.item_siblings > 1 AND i.jan_siblings = 1))
    ) AS ebay_eligible,
    (
      q.enabled AND sp.adapter_status = 'ready'
      AND q.scan_scope = 'retail'
      AND EXISTS (
        SELECT 1 FROM public.market_scan_endpoints ep
        WHERE ep.release_id = q.release_id AND ep.source_id = q.source_id
          AND ep.enabled AND ep.exact_release_verified
      )
    ) AS retail_runnable
  FROM public.market_scan_queue q
  JOIN cohort c ON c.id = q.release_id
  JOIN identity_gate i ON i.id = c.id
  JOIN public.price_sources ps ON ps.id = q.source_id
  LEFT JOIN public.market_source_policies sp ON sp.source_id = q.source_id
), enrollment AS (
  SELECT c.id,
    coalesce(bool_or(j.ebay_eligible),false) AS ebay_enabled,
    coalesce(bool_or(j.retail_runnable),false) AS retail_runnable,
    coalesce(bool_or((j.ebay_eligible OR j.retail_runnable)
      AND j.next_scan_at <= now() - interval '24 hours'
      AND (j.locked_until IS NULL OR j.locked_until <= now())),false) AS overdue_24h,
    max(extract(epoch FROM now() - j.next_scan_at)/3600)
      FILTER (WHERE (j.ebay_eligible OR j.retail_runnable)
        AND j.next_scan_at <= now()
        AND (j.locked_until IS NULL OR j.locked_until <= now())) AS oldest_due_hours
  FROM cohort c LEFT JOIN jobs j ON j.release_id = c.id
  GROUP BY c.id
), validated_inactive AS (
  SELECT DISTINCT ep.release_id
  FROM public.market_scan_endpoints ep
  JOIN cohort c ON c.id = ep.release_id
  JOIN public.market_source_policies sp ON sp.source_id = ep.source_id
  WHERE ep.enabled AND ep.exact_release_verified
    AND sp.scan_scope = 'retail' AND sp.adapter_status <> 'ready'
), source_success AS (
  SELECT ps.slug, max(q.last_success_at) AS last_success_at
  FROM public.market_scan_queue q
  JOIN cohort c ON c.id = q.release_id
  JOIN public.price_sources ps ON ps.id = q.source_id
  GROUP BY ps.slug
), coverage AS (
  SELECT
    count(*) AS coverage_total,
    count(*) FILTER (WHERE mv) AS coverage_mv,
    count(*) FILTER (WHERE sold) AS coverage_sold,
    count(*) FILTER (WHERE ask) AS coverage_current_ask,
    count(*) FILTER (WHERE mv OR sold OR ask) AS coverage_with_any_evidence,
    count(*) FILTER (WHERE NOT (mv OR sold OR ask)) AS coverage_empty
  FROM release_evidence
)
SELECT coverage.*,
  (SELECT count(*) FROM enrollment WHERE ebay_enabled) AS ebay_enabled,
  (SELECT count(*) FROM enrollment WHERE NOT ebay_enabled) AS ebay_parked_identity,
  (SELECT count(*) FROM enrollment WHERE retail_runnable) AS retail_runnable,
  (SELECT count(*) FROM validated_inactive) AS retail_validated_but_inactive,
  (SELECT count(*) FROM enrollment WHERE overdue_24h) AS due_over_24h,
  (SELECT round(max(oldest_due_hours)::numeric,1) FROM enrollment) AS oldest_due_age_hours,
  (SELECT count(*) FROM public.market_scan_runs
    WHERE status = 'failed' AND started_at >= now() - interval '24 hours') AS run_failures_24h,
  (SELECT count(*) FROM public.market_scan_runs
    WHERE status = 'running' AND started_at <= now() - interval '20 minutes') AS stuck_running_20m,
  (SELECT count(*) FROM public.market_candidates mc JOIN cohort c
    ON c.id = mc.resolved_release_id
    WHERE mc.decision = 'needs_review'
      AND mc.last_observed_at >= now() - interval '30 days'
      AND mc.original_source = 'ebay_active_public') AS needs_review_ebay_30d,
  (SELECT max(last_success_at) FROM source_success) AS source_last_success_any,
  (SELECT jsonb_object_agg(slug, last_success_at ORDER BY slug) FROM source_success)
    AS source_last_success_by_slug
FROM coverage;
