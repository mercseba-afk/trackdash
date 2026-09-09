# TrackDash Price Intelligence — Revision 2: broad market evidence

Status: implementation branch only. Not yet applied to production.

## Product goal

TrackDash must be able to show real market movement for an exact Mini 4WD Release month by month. The system therefore optimizes for high recall **after Release identity is resolved**, instead of requiring every marketplace record to expose perfect seller, shipping, completeness and packaging metadata.

The identity invariant is unchanged:

> Price never infers Release identity.

## Why Revision 2

The strict v1 eligibility rules proved fail-closed behavior, but historical marketplace results often omit seller identity, shipping treatment, explicit completeness or packaging facts. Rejecting all such observations makes longitudinal Price Intelligence unusable.

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

## Evidence grades

Every usable sale receives one of two grades.

### `verified`

High-detail observation: exact/strong Release identity, completed sale/date, benchmark condition explicit, completeness confirmed, known shipping treatment and seller identity.

### `indicative`

Real completed sale whose Release and transaction are reliable, but one or more secondary fields are missing: seller unavailable, shipping unknown, completeness unconfirmed, or condition inferred from clear new/unbuilt language.

`indicative` never permits guessed Release identity or a guessed completed sale.

## Quality flags

Initial controlled flags:

- `seller_unknown`
- `shipping_unknown`
- `completeness_unconfirmed`
- `condition_inferred`
- `inner_bags_unknown`
- `box_condition_unknown`

Unknown facts are stored explicitly rather than invented.

## Price normalization

For market/trend purposes every usable sale has a comparable EUR amount:

- `excluded` / `buyer_paid`: sale price;
- `included_exact`: sale price minus exact shipping;
- `included_unknown` / `unknown`: raw sale price, flagged `shipping_unknown` and graded at most `indicative`.

Non-EUR observations still require explicit FX provenance.

## Unknown seller grouping

Seller identity is no longer a blocker.

Known seller partition remains:

`Release + condition + source + seller + fixed-anchor-7-days`

Unknown seller fallback is conservative:

`Release + condition + source + UNKNOWN_SELLER + fixed-anchor-7-days`

All unknown-seller observations from the same source inside one fixed 7-day cluster count as one independent evidence group. This under-counts independence rather than over-counting it, while preserving the market data.

## Collector Value

The existing evidence tiers remain:

- 1 independent group: Last Sale
- 2–4: range
- 5–9: median + min/max
- >=10: median + Q1–Q3

Both `verified` and `indicative` usable observations may contribute. Estimates additionally expose evidence composition: verified count, indicative count, source count and quality mix (`verified_only`, `mixed`, `indicative_only`).

## Monthly trend

Trend is Release-specific, never Product-level.

Revision 2 adds a service-only monthly source-stat layer for sources that expose historical aggregate research. Each row represents one Release × source × month and can carry completed sales count, seller count, average sold price, price low/high, average shipping, normalized EUR values, query/provenance fingerprint and evidence quality.

For each Release/month TrackDash can derive one sanitized market-history point. Granular sold observations remain preferred when sufficient; approved aggregate monthly stats can provide continuity and volume where individual event-level data is unavailable.

Aggregate reports are never double-counted against their own underlying granular rows without explicit provenance separation.

## eBay Product Research

As of September 2026, eBay Product Research exposes up to 3 years of sales data and calculated metrics including sales trends, average sold price, sold price range, average shipping cost and seller counts. Marketplace Insights API remains restricted, so Revision 2 treats Product Research as an aggregate/manual-approved ingestion path rather than an unofficial API.

## Pilot migration rule

The six current pilot records are preserved. After R2 validation they are reclassified from stored facts:

- unambiguous completed sales can become `indicative` despite missing seller/shipping/completeness details;
- ambiguous reused item numbers (95464 / 95508 unless edition is resolved) remain review-only.

No evidence is hard-deleted.
