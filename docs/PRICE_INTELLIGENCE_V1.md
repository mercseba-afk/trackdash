# TrackDash Price Intelligence v1

Status: **REVISION 2 — LIVE. Migration `price_intelligence_v1` applied to Supabase production as version `20260909094146` on 2026-09-09.**

Baseline reviewed before this revision:
- Catalog Foundation v1: 38 Product / 96 Release / 134 stable UUIDs.
- Production market scaffolding: 0 `price_sources`, 0 `price_points`, 0 `market_estimates`.
- Price Intelligence methodology v0.4 is locked; this document translates it into implementation rules rather than reopening it.

## Scope of 0036

Existing registry extended:
- `price_sources`

Existing empty v0 scaffolds rebuilt into the real v1 contract:
- `price_points`
- `market_estimates`

New tables:
- `market_scan_runs`
- `market_scan_targets`
- `market_candidates`
- `market_value_history`
- `market_review_digests`

No source adapter, scraping, cron, valuation job, FX provider, or email provider is activated by 0036.

## Collector Value benchmark

The principal benchmark is:

**New / Unused + Complete + Unbuilt** (`new_complete_unbuilt`).

An opened outer box does not automatically disqualify a kit. `inner_bags_sealed` and `box_condition` are secondary attributes, not silent benchmark substitutions.

Built, incomplete, custom/modified, parts, mixed lots, ambiguous identity, unverified sold state, and unsafe shipping observations do not enter principal Collector Value.

## Source policy

A source may be registered without being enabled. `price_sources.is_active` defaults to false and `ingestion_mode` defaults to `disabled`.

`price_sources.source_type` is retained from the v0 registry for compatibility. 0036 does not invent a new controlled vocabulary for it; v1 evidence classification is controlled by `market_candidates.observation_type`.

Adapters are enabled only after access/API/licensing is actually verified. No assumption is made about Yahoo Auctions, Mercari, Mandarake, Suruga-ya, Vinted, or any other marketplace.

Evidence categories remain distinct. Active asks, retail in-stock, dealer buyback, sold-out and ended-unsold records may be retained as context, but only verified completed sales can be promoted to `price_points` and only eligible price points feed Collector Value.

## Pipeline and lifecycle

`scan → candidate → classification → price_point → estimate`

### Candidate

`market_candidates` stores one **current** row per source record/listing.

Identity is `(source_id, source_record_key)` and repeated scans use UPSERT:
- preserve `first_observed_at`;
- update `last_observed_at`, current fields and `state_hash`;
- do not insert a second candidate for the same source record.

Full listing price/status history is intentionally deferred to v2.

Candidate decisions:
- `accepted`
- `needs_review`
- `rejected`
- `duplicate`

`reason_codes` stays separate. Required known codes include at least `REUSED_ITEM_NUMBER`, `DUPLICATE_SUSPECTED`, and `POSSIBLE_OUTLIER`; it remains extensible because review reasons are not identity primitives.

### Promotion

A listing becomes a `price_point` only when it is a verified completed sale. Active listings/retail/dealer evidence remains in `market_candidates`.

`price_points.candidate_id` is required and unique, so retrying promotion cannot duplicate one real event. If the source later corrects the same sold record, the existing point is re-normalized/revalidated and estimates are recomputed; a second point is not inserted.

`price_points` are never hard-deleted. Invalidated observations move to `excluded` or `reversed`.

## Release match auditability

`match_confidence` is not sufficient on its own. Every accepted candidate and every price point must have at least one controlled `match_evidence` code.

Allowed v1 codes:
- `item_number_exact`
- `edition_name_exact`
- `release_year_stated`
- `reissue_stated`
- `chassis_stated`
- `color_variant_match`
- `packaging_generation_match`
- `image_reviewed`
- `official_reference_match`
- `manual_override`

An accepted candidate additionally requires a resolved Release and `exact` or `strong` match confidence. This requirement is enforced at DB level with explicit non-NULL checks.

Japanese/other-language dictionaries may map explicit terms into normalized condition and match evidence. Ambiguous wording always routes to `needs_review` in v1; no heuristic NLP auto-resolution.

## Sale time: never fabricate precision

TrackDash keeps source sale time separate from observation time:
- `sold_at`: exact timestamp only when the source provides one;
- `sold_on`: source-provided date when only date precision exists;
- `observed_at`: when TrackDash observed the record.

Do not synthesize a fake midnight timestamp from a date-only source. Valuation windows/grouping use `sold_on`; `sold_at` only preserves extra precision and deterministic ordering when the source actually provides it.

## Shipping and normalized value

Shipping is never estimated.

`shipping_basis`:
- `excluded` → `valuation_price = observed price`
- `buyer_paid` → `valuation_price = observed price`
- `included_exact` → `valuation_price = observed price - exact known shipping_cost`
- `included_unknown` → `valuation_price = NULL`, never valuation eligible
- `unknown` → `valuation_price = NULL`, never valuation eligible

For EUR observations, `normalized_price_eur = valuation_price` and no synthetic FX record is stored.

For non-EUR observations, the exact `fx_rate_to_eur` and `fx_rate_date` are required and the DB verifies:

`normalized_price_eur = round(valuation_price × fx_rate_to_eur, 2)`.

## Valuation eligibility

`valuation_eligible = true` is allowed only when every required fact is explicit:
- completed sale;
- Release match `exact`/`strong` with structured evidence;
- condition `new_complete_unbuilt`;
- `is_complete = true`;
- `is_lot = false`;
- `quantity = 1`;
- clean shipping basis and reproducible item-only price;
- normalized EUR value available;
- independent evidence-group key available;
- `status = active`;
- `needs_revalidation = false`;
- source sale date (`sold_on`) known; exact time (`sold_at`) remains optional.

Unknown values fail closed rather than being inferred.

## Evidence grouping — deterministic v1 algorithm

The independent-evidence rule is:

**same Release + normalized condition + source + seller fingerprint + fixed-anchor 7-day cluster**.

Algorithm:
1. Work only on otherwise eligible completed sales for the same Release, condition, source and non-NULL `seller_fingerprint`.
2. Sort by `sold_on`, then exact `sold_at` when available, then stable `source_record_key` as tie-breaker.
3. The earliest unassigned `sold_on` becomes the cluster anchor.
4. Subsequent sales with `sold_on < anchor + 7 days` join the same group.
5. The first sale on/after that boundary starts the next group.
6. `evidence_group_key` is a deterministic hash/string of `release|condition|source|seller_fingerprint|cluster_anchor_date`.
7. Backfill/revalidation recomputes group keys before estimates.

This is deliberately **not** a calendar-week bucket: week boundaries would make two nearly simultaneous sales look independent. It is also not an indefinitely rolling chain: the seven days remain anchored to the first sale in the group.

If seller identity cannot be fingerprinted, `evidence_group_key` remains NULL and the sale cannot increase the independent-evidence tier.

## Cross-source duplicate handling

If a stable original record/event identifier is known, it can identify the same event across sources.

Otherwise a plausible duplicate is marked `DUPLICATE_SUSPECTED` and routed to `needs_review`. v1 never auto-merges an uncertain cross-source duplicate.

## Estimation window and tiers

Every recomputation begins from the most recent **365 days**. The 730-day set is used only if it raises the evidence tier available at 365 days (0 → 1, 1 → 2–4, 2–4 → 5–9, or 5–9 → ≥10). If 730 days would leave the release in the same tier, keep the fresher 365-day estimate. Every later recomputation starts from 365 again, so fresh evidence automatically contracts a previously expanded estimate.

The statistic is the median; no average-based Collector Value.

Independent evidence groups:
- **0** → no `market_estimates` row
- **1** → **Last Verified Sale** only
- **2–4** → **Estimated Range** only; no headline value/median exposed; `range_method=cleaned_min_max`
- **5–9** → median + conservative range; `range_method=cleaned_min_max`
- **≥10** → median + **Typical Range (Q1–Q3)**; `range_method=q1_q3`

For 5–9, “conservative range” means **min/max of eligible independent groups after duplicates, excluded/reversed points, revalidation-required rows and flagged outliers are removed**. No new percentile is invented at this small sample size. `range_method` is persisted specifically so the database can reject Q1–Q3 below 10 groups and reject min/max when the >=10 tier claims a Typical Range.

The primary UI does not display raw sample/evidence counts.

## Outliers

Outlier review runs only when at least 3 prior independent groups exist for the comparable Release/condition evidence set.

A new group greater than `3×` the prior median or lower than `1/3×` the prior median becomes `POSSIBLE_OUTLIER` / `needs_review` and does not enter valuation until reviewed.

Zero prior evidence is explicitly exempt: the first sale can never be rejected merely for being an outlier.

## Trend

Preferred comparison:
- most recent 90 days vs previous 90 days;
- minimum 3 independent groups in **each** period.

Fallback:
- most recent 365 days vs previous 365 days;
- same minimum 3 groups in each period.

Otherwise no public trend is stored/displayed.

## Freshness timestamps

Keep these meanings separate:
- `last_scanned_at`: latest market scan touching the Release;
- `last_verified_sale_at` / `last_verified_sale_on`: source time/date of the latest eligible verified sale;
- `last_valuation_change_at`: last time the published valuation materially changed;
- `computed_at`: latest estimate recomputation.

A fresh scan is not automatically fresh valuation evidence.

## Catalog correction / revalidation

When Release identity is corrected:
1. affected `market_candidates` and `price_points` become `needs_revalidation = true`;
2. affected points become `valuation_eligible = false`;
3. Release matching and evidence-group keys are recomputed;
4. `market_estimates` is recomputed before publication.

For direct changes to `market_candidates.resolved_release_id`, steps 1–2 are enforced automatically by the `market_candidates_release_revalidation` DB trigger before the composite FK cascade moves the normalized point to the corrected Release.

No evidence is hard-deleted to hide a prior catalog state. The automatic catalog-change trigger/job may be implemented after 0036; the required state exists now.

## Scanner cadence

Target granularity is **Release × Source**.

Default target cadence is roughly weekly (`168h`) so the whole catalog is distributed across about 7 days instead of scanned simultaneously. Hot Releases may later use about `72h`. Atomic target acquisition must use conditional UPDATE / `SKIP LOCKED`, never read-then-write.

## Review digest

`market_review_digests` is a thin idempotency/send log only:
- covered period;
- digest kind;
- pending/sent/failed state;
- send timestamp/error.

No rendered email body and no recipient is stored. The digest is sent only when meaningful review items/errors exist.

## Explicitly deferred

- marketplace adapters until access/licensing is verified;
- full listing price/status history;
- automatic periodic reprocessing of rejected candidates;
- advanced Japanese NLP/OCR classification;
- source-weighting formula;
- wash-trading/first-party marketplace fraud engine;
- evidence-group anti-gaming beyond the v1 seller grouping;
- formal review SLA/backoff policy.
