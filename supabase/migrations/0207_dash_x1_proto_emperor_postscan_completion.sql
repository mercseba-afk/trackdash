-- DASH-X1 Proto-Emperor post-scan completion — 2026-10-01
--
-- Classifies the already-audited 94708 listing that cannot represent the
-- new_complete_unbuilt Europe-first public target because condition remains
-- contradictory and European landed cost is unknown.

begin;

update public.market_candidates
set decision='rejected',
    reason_codes=array['CONDITION_UNRESOLVED','EXTRA_EU_LANDED_COST_UNKNOWN']::text[],
    review_notes='Completion Gate 2026-10-01: exact ITEM 94708 identity is retained as market context, but eBay platform condition is Used while seller text says unused/unassembled. The new_complete_unbuilt condition is unresolved and Italy/Europe landed cost is unknown. Excluded from public ASK/MV computation; candidate retained for audit provenance.',
    needs_revalidation=false,
    updated_at=now()
where id='eec1057c-1ff6-4cd6-a42e-33206c5a13b0'::uuid
  and resolved_release_id='593d8ef0-21ab-52c4-b8dc-15bf726c955a'::uuid;

commit;
