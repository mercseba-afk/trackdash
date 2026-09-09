# TrackDash Price Intelligence — Revision 2: broad market evidence

Status: storage migrations `0037_price_intelligence_relaxed_evidence` and `0038_price_intelligence_market_fx_provenance` are LIVE on Supabase production. Runtime implementation remains isolated on this branch until final merge validation completes.

## Product goal

TrackDash must show real market movement for an exact Mini 4WD Release month by month. The system therefore optimizes for high recall **after Release identity is resolved**, instead of requiring every marketplace record to expose perfect seller, shipping, completeness and packaging metadata.

The identity invariant is unchanged:

> Price never infers Release identity.

## Hard blockers

An observation cannot contribute when any of these is true:

- Release unresolved or ambiguous;
- not a completed sale;
- sale price, currency or source sale date missing;
- known lot / quantity greater than one;
- known built, incomplete, parts-only or custom item;
- duplicate, reversed record, unresolved revalidation or pending outlier review;
- non-EUR record without historical FX provenance.

## Evidence grades

Usable sales are `verified` or `indicative`.

`verified` means the Release and transaction are solid and secondary facts are sufficiently complete. `indicative` is still a real completed sale with exact/strong Release identity, but one or more secondary facts are unavailable.

Controlled quality flags:

- `seller_unknown`
- `shipping_unknown`
- `completeness_unconfirmed`
- `condition_inferred`
- `inner_bags_unknown`
- `box_condition_unknown`

Unknown facts stay unknown instead of being invented.

## Price normalization

For market/trend purposes every usable sale has `market_price_eur`:

- `excluded` / `buyer_paid`: sold amount;
- `included_exact`: sold amount minus exact shipping;
- `included_unknown` / `unknown`: raw sold amount, flagged `shipping_unknown`.

The old strict `valuation_price` remains available when shipping is known. Migration 0038 explicitly allows historical FX provenance even when the strict valuation amount is NULL because shipping is unknown, and validates the EUR market amount mathematically against price × FX.

## Unknown seller grouping

Seller identity is no longer a blocker.

Known seller partition:

`Release + condition + source + seller + fixed-anchor-7-days`

Unknown seller fallback:

`Release + condition + source + UNKNOWN_SELLER + fixed-anchor-7-days`

This intentionally under-counts independence rather than pretending anonymous sales are different sellers.

## Collector Value and trend

Evidence tiers remain:

- 1 independent group: latest usable sale
- 2–4: range
- 5–9: median + min/max
- >=10: median + Q1–Q3

Both grades may contribute. Estimates/history also store verified count, indicative count, source count and quality mix (`verified_only`, `mixed`, `indicative_only`).

Trend is always Release-specific. The preferred comparison remains recent 90 days vs previous 90 days, falling back to 365 vs previous 365 when needed.

## Monthly source statistics

`market_monthly_source_stats` stores approved aggregate historical datasets by exact Release × source × month × condition × query. It can preserve sales volume, seller count where available, average/range, shipping, currency/FX and provenance.

This is the future ingestion surface for sources such as eBay Product Research without pretending aggregate research rows are individual transactions.

## Pilot

Pilot item-number families:

- 18014
- 94717
- 95087
- 18069
- 95464
- 95508

95464 and 95508 remain review-only whenever the source cannot distinguish original vs reissue. R2 does not relax Release identity.

The four already-normalized pilot sales are preserved and classified as `indicative`; Yahoo JPY observations receive official historical FX provenance before entering grouping/valuation.

## Seller Hub

eBay Seller Hub / Product Research is a future accelerator, not a prerequisite. Until access is available, TrackDash continues collecting auditable Yahoo, Mandarake, public eBay and manually verified evidence. No unauthorized scraping is introduced by R2.
