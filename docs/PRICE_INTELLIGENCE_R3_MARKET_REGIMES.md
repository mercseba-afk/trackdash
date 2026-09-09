# TrackDash Price Intelligence R3 — Market Regimes

Status: implementation specification for the R3 market model.

## Goal

TrackDash must estimate the real market position of one exact Tamiya Release and its movement over time. It must not equate "market value" with a single auction result, a stale shop price, or an arbitrary sample threshold.

The immutable identity rule remains:

> Price never infers Release identity.

If an item number was reused and the evidence cannot distinguish the editions, the data is retained as an item-number market pool but is not assigned to a specific Release.

## Four evidence families

### 1. Current retail

Amazon, RCJAZ, official Tamiya shops and specialist stores. A retail price contributes to the current market only when the exact Release is actually purchasable (`in_stock` or `low_stock`).

`out_of_stock`, `discontinued`, `backorder`, `preorder` and `unknown` are preserved but do not anchor the current purchasable market.

### 2. Current fixed-price marketplace

eBay Buy It Now and equivalent active fixed-price marketplace offers. These represent what a collector can buy now, distinct from completed transactions.

### 3. Completed sales

eBay Product Research, Yahoo Auctions, Mandarake and other verified completed-sale sources. These represent what buyers actually paid.

Granular sold events and aggregate research from the same provider must never be double-counted. For an aggregate provider, recent monthly observations are preferred; otherwise the best recent rolling/full-history aggregate is selected. Granular rows from other sources remain independent evidence.

### 4. Historical / unavailable retail

A known price for a product that is currently unavailable stays in history but never becomes a current offer. Price and stock transitions are valuable trend events.

## Shipping

TrackDash stores item price and shipping separately.

- known shipping: `effective_cost = item_price + shipping`;
- free shipping: known shipping is zero;
- unknown shipping: no total is invented; the offer remains `item_only` and receives lower confidence.

When at least one current offer has a known delivered cost, the public starting-price candidate is selected from known delivered costs. This prevents an apparently cheap foreign listing with unknown/large shipping from automatically beating a genuinely cheaper delivered offer.

## Offer history

Repeated scans that find no material change update `last_checked_at` only. History rows are created for:

- initial observation;
- price change;
- shipping change;
- availability change;
- price + availability change.

This avoids generating thousands of duplicate history rows while preserving every meaningful movement.

## Market regimes

R3 decides the commercial state of the Release before combining prices.

### `retail_driven`

At least two independent retail sources currently sell the Release. Retail is the main anchor, while sold and active-marketplace evidence provide secondary confirmation.

Base weights: retail 65%, sold 20%, active marketplace 15%.

A single retail source with no secondary evidence can still produce a low-confidence current signal. There is no artificial sample-count gate.

### `mixed_scarce`

One retail source remains and there is active/sold secondary evidence. The Release appears scarce or transitional.

Base weights: retail 35%, sold 35%, active marketplace 30%.

### `secondary_market_driven`

No currently purchasable retail source remains, but active marketplace and/or sold evidence exists.

Base weights: sold 60%, active marketplace 40%.

### `insufficient`

No current retail, active marketplace or usable sold evidence exists. No market value is invented.

## Robust anchors

Raw observations are not simply averaged together.

- Current retail: one representative offer per source, then weighted median.
- Active marketplace: one representative per source + seller/listing identity, then weighted median.
- Sold market: weighted median of sold evidence.

Sold evidence weight considers:

- sale volume (`sqrt(sales_count)` so large samples matter without overwhelming every other source);
- recency;
- evidence grain;
- verified vs indicative grade.

Recent granular/monthly observations receive maximum grain weight. Rolling windows are slightly discounted. Full-history Product Research summaries remain strong broad evidence but are discounted relative to recent observations.

This is intentionally robust to anomalies. Example: a one-off Yahoo auction at 300 JPY does not define the market when Product Research shows dozens of completed sales near the normal retail cluster.

## Confidence instead of a minimum sample threshold

R3 never says "fewer than N sales means no value". It emits a 0–100 confidence score and `low | medium | high` label based on:

- number of independent retail sources;
- number of active marketplace offers;
- completed-sale volume;
- sold-source diversity;
- agreement/disagreement among channel anchors;
- shipping coverage;
- freshness of sold evidence.

A value based on one real shop is allowed but is explicitly low-confidence. A value supported by several current shops and many completed sales becomes high-confidence.

## Trends

Trend is Release-specific, never Product-level.

Monthly sold aggregates are stored independently. Only complete calendar months are used for public trend calculation; partial current months remain provisional evidence.

When at least six complete months exist, R3 compares the weighted average of the latest three months with the previous three months. With only two or more complete months, it may use month-over-month change. No missing month is fabricated.

Retail and active-market price/availability changes are preserved separately so future versions can expose channel-specific curves alongside the composite market trend.

## Reused item numbers

Examples such as 18014, 95464 and 95508 can represent multiple catalog Releases. Aggregate Product Research data that cannot independently distinguish those editions is stored with:

- `release_id = NULL`;
- `item_number` populated;
- `possible_release_ids` populated;
- `attribution_status = item_pool | ambiguous_release`.

The data remains useful market context but never flows automatically into a Release-specific current value or trend.

## Current starting price

`A partire da` is not a sold price and is not an out-of-stock price. It comes only from a currently purchasable R3 offer.

When shipping is known, TrackDash compares delivered acquisition cost. When shipping is unknown, it may expose the item price with an explicit `+ shipping` treatment in the UI rather than inventing the total.

## Scanner scheduler

The scanner is staggered and adaptive rather than running every source every day.

Normal cadence:

- retail: every 7 days;
- active marketplace: every 7 days;
- Product Research / sold refresh: every 14 days.

Hot cadence:

- retail / active marketplace: every 72 hours;
- sold research: every 7 days.

Cold cadence:

- retail / active marketplace: every 14 days;
- sold research: every 30 days.

A Release may become hot after:

- >=10% price movement;
- availability transition/restock;
- a new completed sale;
- a new active listing.

A Release that has remained stable for about 60 days may move to the cold tier.

Default batch limits prevent one Work/browser run from exhausting resources:

- max 12 retail targets;
- max 12 active-marketplace targets;
- max 6 Product Research targets;
- max 18 total targets per batch.

Product Research full-history bootstrap is performed once. Ongoing refreshes should use a recent reconciliation window rather than repeatedly querying the full three-year history.

## Storage

R3 adds additive storage without removing v1/v2 audit evidence:

- `market_aggregate_observations`: approved aggregate sold research and ambiguous item pools;
- `market_offer_states`: current exact-Release retail/marketplace state;
- `market_offer_history`: material price/stock changes;
- `market_release_signals`: current public R3 market signal;
- `market_release_monthly_signals`: public monthly history;
- `market_scan_queue`: adaptive staggered scan scheduling.

Raw/operational tables remain service-only. Public clients can read only sanitized release signals and monthly signals.

## Acceptance examples

### Tamiya 18069

If the system sees current retail around 18–21 EUR delivered, an active marketplace around 18 EUR, Product Research with 53 units averaging 16.85 EUR, and one Yahoo auction around 1.61 EUR, the one-off auction must not become the Release value. The broader evidence cluster wins and the low sale remains a retained anomaly.

### Scarce Black Special

If an old shop page still says 15 EUR but is out of stock, while current marketplace offers are 39/42 EUR and completed sales cluster around 38 EUR, 15 EUR is historical only. The current market must be secondary-market-driven near the live/sold cluster.

These examples are regression tests, not hard-coded prices.
