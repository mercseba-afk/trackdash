# TrackDash Price Intelligence — Revision 2: broad market evidence

Status: design/implementation branch only. Not yet applied to production.

## Product goal

TrackDash must be able to show real market movement for an exact Mini 4WD Release month by month. The system therefore optimizes for **high recall after Release identity is resolved**, rather than requiring every marketplace record to expose perfect seller, shipping, completeness and packaging metadata.

The identity invariant is unchanged:

> Price never infers Release identity.

## Why Revision 2

The strict v1 eligibility rules were useful to prove fail-closed behavior, but real marketplaces frequently omit seller identity, shipping treatment, explicit completeness or exact packaging facts from historical sold results. Rejecting all such observations makes longitudinal Price Intelligence unusable.

Revision 2 separates **hard blockers** from **quality signals**.

## Hard blockers

An observation cannot contribute to market value/trend when any of these is true:

- Release is unresolved or ambiguous.
- The record is not a completed sale.
- Sale price, currency or source sale date is missing.
- It is known to be a lot / multi-item sale or quantity > 1.
- It is known to be built, incomplete, parts-only or custom in a way that makes it non-comparable to the new/unbuilt benchmark.
- It is a duplicate, reversed record, unresolved revalidation or pending outlier review.
- A non-EUR record cannot be normalized because FX provenance is missing.

These remain non-negotiable.

## Evidence grades

Every usable sale receives one of two grades.

### `verified`

High-detail observation. Typical requirements:

- exact/strong Release match;
- completed sale + sale date;
- single item;
- benchmark condition explicitly supported (`new_complete_unbuilt`);
- completeness explicitly true;
- shipping basis known enough for exact adjustment;
- seller identity available.

### `indicative`

Real completed sale whose Release and transaction are reliable, but one or more secondary fields are missing. Examples:

- seller identity unavailable;
- shipping basis unknown or included-but-unknown;
- completeness not explicitly stated, with no evidence of missing parts;
- condition is compatible/inferred from clear new/unbuilt language but not fully documented.

Indicative does **not** mean guessed Release or guessed transaction. Identity and completed-sale facts remain hard requirements.

## Quality flags

Missing/soft facts are stored explicitly rather than silently converted into certainty. Initial controlled flags:

- `seller_unknown`
- `shipping_unknown`
- `completeness_unconfirmed`
- `condition_inferred`
- `inner_bags_unknown`
- `box_condition_unknown`

The grade can be recomputed from facts and flags.

## Price normalization

For market/trend purposes, every usable sale has a comparable EUR amount:

- `excluded` / `buyer_paid`: sale price;
- `included_exact`: sale price minus exact shipping;
- `included_unknown` / `unknown`: raw sale price, flagged `shipping_unknown` and graded at most `indicative`.

This changes the old v1 behavior where unknown shipping forced the normalized amount to NULL.

Non-EUR observations still require explicit FX provenance. No fake FX rates.

## Unknown seller grouping

Seller identity is no longer a blocker.

Known seller partition remains:

`Release + condition + source + seller + fixed-anchor-7-days`

Unknown seller fallback is deliberately conservative:

`Release + condition + source + UNKNOWN_SELLER + fixed-anchor-7-days`

This means all unknown-seller observations from one source within the same 7-day anchor cluster count as **one independent evidence group**. We lose some independence, but we do not throw the data away or over-count it.

## Collector Value

The existing tier model remains:

- 1 independent group: Last Sale
- 2–4: range
- 5–9: median + min/max
- >=10: median + Q1–Q3

Both `verified` and `indicative` usable evidence may contribute.

Every estimate also exposes evidence composition:

- verified observation count;
- indicative observation count;
- source count;
- quality mix (`verified_only`, `mixed`, `indicative_only`).

This is more informative than pretending a single binary eligibility flag captures data quality.

## Monthly trend

Trend is Release-specific, never Product-level.

Revision 2 adds a service-only monthly source-stat layer for sources that expose historical aggregate research (for example a marketplace research dashboard). Each row represents one Release × source × month and can carry:

- completed sales count;
- seller count when available;
- average sold price;
- sold price low/high;
- average shipping when available;
- normalized EUR values;
- query/provenance fingerprint;
- evidence quality.

This allows TrackDash to ingest hundreds or thousands of historical transactions as monthly market statistics when individual event-level data is not programmatically available.

### Monthly value series

For each Release/month:

1. Prefer granular usable sales when a meaningful sample exists.
2. Otherwise use verified/indicative monthly source statistics.
3. Never mix an aggregate report with its own underlying granular rows as separate independent evidence without explicit dedup/provenance separation.
4. Persist one sanitized monthly Release value in `market_value_history`.

The public chart can therefore show month-by-month Release movement and month-over-month change.

## eBay Product Research

As of September 2026, eBay Product Research exposes up to 3 years of sales data and calculated market metrics, including sales trends, average sold price, sold price range, average shipping cost and seller counts. Marketplace Insights API remains restricted, so Revision 2 treats Product Research as an **aggregate/manual-approved ingestion path**, not as an unofficial API.

## Source strategy

Revision 2 supports two complementary inputs:

1. **Granular sold observations** — Yahoo closed results, Mandarake auctions, permitted/manual sources, future licensed/API feeds.
2. **Monthly aggregate source stats** — eBay Product Research or other approved research/export sources.

The system no longer depends on every marketplace exposing a perfect individual sale record.

## Pilot migration rule

The six current pilot records are preserved. After R2 is validated, they are reclassified from their stored facts:

- unambiguous completed sales can become `indicative` even when seller/shipping/completeness is partially unknown;
- ambiguous reused item numbers (95464 / 95508 unless edition is resolved) remain review-only.

No existing evidence is hard-deleted.
