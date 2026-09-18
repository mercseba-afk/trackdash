# TrackDash Market Method v3

Status: **public method** for `Valore di mercato stimato` / `Estimated market value`.

Market Method v3 is the result of the 18069, 18074, 95087, 18614 and 95467 shadow audits. It keeps the method scalable: TrackDash scans a controlled registry of exact Release sources and applies the same rules to every Release.

## Public meaning

The headline answers:

> What is the most defensible current value of this exact Release, new / complete / unbuilt, from the market evidence TrackDash can observe?

The public number is an estimate, shown with `≈`. It is not a guaranteed sale price.

## Evidence order

### 1. Completed sales — primary

Completed sales are the preferred Market Value evidence.

For every source TrackDash selects one current sold sample in this order:

1. recent monthly evidence;
2. qualifying rolling window;
3. if neither exists, a **recent broad-history fallback** with at least 5 observed sales.

A full-history fallback is deliberately lower-confidence than a dedicated recent window.

Seller diversity matters. Several transactions from one known seller prove activity, but do not establish broad market agreement by themselves.

### 2. Current retail — corroboration and fallback

Only exact Release pages that are genuinely purchasable now can enter the current retail lane.

Retail is deduplicated by economic merchant and balanced by region before an anchor is calculated. Five shops from one geography must not masquerade as five independent global markets.

When completed sales are strong, retail corroborates them rather than replacing them. When completed sales are insufficient, at least two independent current merchants may define a retail-based value.

A severe split between only two regions is not averaged into a fake global midpoint.

### 3. Sold-out retail — historical context

Sold-out, discontinued, backorder and unknown availability pages remain useful history, but their displayed price is not a current purchasable offer and cannot define Market Value.

### 4. Active marketplace ASK — context only

eBay and other active asking prices describe availability and seller expectations. They can power `Disponibile da`, but never create or inflate Market Value on their own.

## Geography and merchant identity

Sources carry a market region and, where possible, an economic merchant identity.

- same merchant across multiple storefronts = one retail vote;
- regional retail medians are computed first;
- the public retail anchor is based on the regional medians;
- missing regions reduce coverage rather than mechanically changing value.

## Publication safeguards

A sold-based public value requires at least two observed completed units plus one of:

- verified completed-sale evidence;
- at least two sold sources;
- at least two known sellers;
- or, when seller identity is unavailable, at least five observed sold units.

A known single-seller cluster cannot publish on its own unless independently corroborated by current retail.

One verified sale may publish only when independently corroborated by current retail.

When qualified retail strongly conflicts with qualified sold evidence, completed sales remain primary but confidence is reduced instead of averaging the two markets.

## Trend

Trend is independent from Market Value.

A numeric trend is published only from sufficient chronological completed-sale evidence. ASK prices, stock-outs and scarcity never invent a trend.

When chronology is insufficient, the public UI says that trend data is still being collected.

## Public Release UI

The Release page exposes:

- **Valore di mercato stimato ≈ €X**;
- number of observed completed sales;
- observed seller count when known;
- trend + timeframe when defensible;
- observed range when multiple qualified lanes corroborate;
- **Disponibile da €X** only for a fresh, actually purchasable offer.

Detailed internal scoring remains an implementation detail. Public coverage wording describes the strength of the observed evidence rather than promising certainty.

## Scan cadence

The source registry stays bounded and repeatable:

- current retail: about every 7 days;
- active marketplace: about every 3 days when that adapter is released;
- sold research: about every 14 days or through controlled Product Research batches;
- exact retailer endpoints are curated once, then rescanned automatically;
- blocked or unreliable sites remain manual/reference sources rather than being scraped unreliably.

## Versioning discipline

v3 replaces v2 only because the audits demonstrated concrete failure modes: retail dominance on 18069, seller concentration on 95467, strong regional splits on 95087, and the need for a safe historical fallback when recent windows are missing.

Future changes require another demonstrated failure mode and a representative shadow test set.
