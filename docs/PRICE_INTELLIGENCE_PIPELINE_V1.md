# TrackDash Price Intelligence Data Pipeline v1

Status: implementation work in progress on an isolated branch. No production market data is written by this document.

## Goal

Turn verified market observations into auditable TrackDash evidence using the frozen flow:

`source -> observation -> candidate -> classification/review -> price_point -> estimate`

Release identity remains authoritative. Price never infers identity.

## Pilot scope

The pipeline is generic for the full catalog, but the first end-to-end pilot targets these six item-number families because they exercise both unique and reused Tamiya item numbers:

- 18014 — Avante Jr. (original + 2024 reissue)
- 94717 — Dyna-Hawk GX Super XX Special
- 95087 — Avante Mk.III Japan Cup 2015 Limited Edition
- 18069 — Dash-1 Emperor Premium
- 95464 — Avante Mk.III Azure Clear Special (original + 2023 reissue)
- 95508 — Neo-Tridagger ZMC Carbon Special (original + 2023 reissue)

The reused-number cases are deliberate identity stress tests: an item number alone must not auto-select the wrong Release.

## Source feasibility audit — 9 September 2026

### eBay

- Browse API is usable for current listings and can support secondary active-ask context.
- Marketplace Insights is the relevant sold-history API, but eBay currently marks it restricted and not open to new users.
- Trading `GetMyeBaySelling` can expose sold items for the authenticated seller's own account; it is not a general market-wide sold-history feed.

Decision for v1: do not pretend eBay sold data is programmatically available. Keep market-wide sold ingestion disabled until TrackDash has approved access. A future Browse adapter may ingest `active_listing` observations only; those never become principal Collector Value evidence.

### Yahoo! Auctions Japan

Yahoo!'s public Auction Web API was discontinued. Current Yahoo! JAPAN Shopping/order APIs are seller/store operational APIs and do not provide a public market-wide Yahoo! Auctions sold-history feed.

Decision for v1: no automated Yahoo! Auctions adapter without a licensed/approved data source.

### Mercari Japan

Mercari Shops exposes an API for participating shop operators, but this is not a general public API for market-wide consumer Mercari sold listings.

Decision for v1: no automated general Mercari Japan adapter without approved access/licensing.

### First usable completed-sale source

The first v1 completed-sale ingestion mode is therefore `manual_verified_sales`.

This is not user-entered crowd pricing. Each imported observation must contain a source record key, source URL/provenance where available, a manually reviewed Release identity, completed-sale date, price/currency, shipping basis, condition/completeness facts, and seller fingerprint when known. Unknown facts remain unknown and fail closed.

No unauthorized scraping is part of v1.

## Adapter contract

Every adapter emits the same `SourceObservation` structure. An adapter may supply raw fields, but it may not silently convert ambiguity into certainty.

Allowed ingestion modes remain:

- `api`
- `licensed_feed`
- `manual`
- `internal`
- `disabled`

## Identity classification

Automatic matching is deliberately conservative.

1. Explicit manually reviewed Release ID + `manual_override` may be accepted.
2. Item-number matches are gathered, never blindly selected.
3. If an item number maps to multiple Releases, the candidate stays `needs_review` unless edition-specific evidence disambiguates it.
4. Strong automatic acceptance requires an exact item number plus at least one Release-specific corroborator such as edition name, release year, reissue statement, chassis, color variant, packaging generation, image review, or official reference.
5. Price is never a matching signal.

Controlled match evidence remains exactly the 10 codes defined by migration 0036.

## Condition parsing

The locked Japanese v1 vocabulary is preserved:

Positive evidence:
- 未組立
- 未使用
- 新品
- 内袋未開封
- 欠品なし

Negative evidence:
- 組立済
- 完成品
- 欠品あり

Always-review ambiguity:
- 美品
- 確認のため開封
- ジャンク扱い
- カスタム

`専用` must not auto-accept. Placeholder/display-only prices must be reviewed.

## Candidate lifecycle

- `(source_id, source_record_key)` is the idempotent source-record identity.
- Re-scanning a listing updates its current candidate state rather than creating another candidate.
- Exact cross-source duplicate IDs may be deduplicated.
- Uncertain cross-source similarity is only `DUPLICATE_SUSPECTED` / review; it is never auto-merged.
- Accepted candidates require a resolved Release, exact/strong confidence, and non-empty controlled match evidence.

## Promotion to price_points

Only completed sales may be promoted:

- `sold_confirmed`
- `auction_awarded`
- `marketplace_sold`

Active asks, retail stock, dealer buyback, sold-out records and ended-unsold listings remain candidates only.

Promotion is one-per-candidate and must preserve candidate/source/Release identity.

## Shipping and FX

Shipping fails closed exactly as migration 0036 enforces.

- `excluded` / `buyer_paid`: valuation price = observed price.
- `included_exact`: valuation price = price - exact shipping.
- `included_unknown` / `unknown`: no valuation price.
- No estimated shipping.

EUR observations need no synthetic FX provenance. Non-EUR valuation requires a positive rate and its source date; otherwise the observation cannot become a normalized price point yet.

## Evidence groups

Independence partition:

`Release + normalized condition + source + seller_fingerprint`

Unknown seller => `evidence_group_key = NULL` and therefore never principal Collector Value evidence.

Fixed-anchor 7-day clustering:

1. sort by `sold_on`, then real `sold_at` when present, then stable source identity;
2. earliest unassigned `sold_on` becomes the anchor;
3. later sales with `sold_on < anchor + 7 days` join that group;
4. the first sale on/after the boundary starts the next group;
5. the key is deterministic from Release, condition, source, seller fingerprint and anchor date.

Each evidence group contributes one representative value: the median of its active valuation-eligible EUR points.

## Outliers

Outlier review starts only when at least three prior independent evidence groups exist.

A new group is flagged `POSSIBLE_OUTLIER` when its representative is:

- greater than 3x the prior-group median, or
- less than 1/3 of the prior-group median.

Flagged groups remain out of valuation until reviewed. The first evidence is never rejected merely for being extreme.

## Collector Value tiers

Primary window: 365 days. Re-evaluate from 365 on every recompute. Expand to 730 only if it raises the evidence tier.

- 0 groups: no estimate row.
- 1 group: Last Verified Sale.
- 2–4 groups: Estimated Range = cleaned min/max of independent group representatives.
- 5–9 groups: Collector Value = median; range = cleaned min/max.
- >=10 groups: Collector Value = median; Typical Range = Q1–Q3.

For >=10, v1 concretizes “standard statistical Q1/Q3” as the same continuous linear-interpolation percentile semantics as PostgreSQL `percentile_cont(0.25)` / `percentile_cont(0.75)`. This is deterministic and avoids switching definitions between TypeScript and PostgreSQL implementations.

## Trend

Preferred comparison:
- recent 90 days vs previous 90 days;
- at least 3 independent groups in each period.

Fallback:
- recent 365 days vs previous 365 days;
- at least 3 groups in each period.

Otherwise public trend stays absent.

## Review digest

The review digest remains a thin send log. A weekly review is only sent when review-worthy candidates/errors exist; scanner failures can trigger the failure digest. No rendered mail body or recipient is persisted in the market schema.

## Security/runtime boundary

Raw/operational market tables remain server-only. Browser/client code must never receive an elevated Supabase secret/service-role key. The pipeline runner uses a backend-only credential and the table grants already established by migration 0036.

## Phase gates

1. Pure pipeline rules + deterministic tests.
2. Service-only repository/runner.
3. Seed source registry with automation disabled except manually verified ingestion.
4. Transactional live-Postgres validation with rollback.
5. PR review/build.
6. Only after validation: activate the pilot and ingest real evidence.
