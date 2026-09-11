# TrackDash Market Method v2

Status: **frozen methodology** for the public `Valore attuale stimato` / `Estimated current value`.

The purpose of v2 is to estimate the **current market value of one exact Release**, not the historical average of one marketplace and not the seller's asking price.

## 1. Core principle

TrackDash observes only part of the market. eBay Product Research, retailers, marketplaces and future TrackDash transactions are samples of a larger market. Missing sources must lower certainty or coverage; they must not mechanically push the value down.

The public Market Value answers:

> What is the most defensible current price of the item itself, for this exact Release and condition, from the market evidence TrackDash can observe today?

Shipping, taxes and duties are not part of Market Value. They may be stored separately for personal acquisition cost and landed-cost analysis.

## 2. Evidence hierarchy

### A. Completed sales — primary evidence

Completed transactions are the strongest evidence. Recent sales are preferred over older history when the recent sample is large enough to stand on its own.

Examples: exact eBay Product Research sales; future bilateral TrackDash Confirmed Sales; other sources that expose a real completed transaction.

Rules:

- exact Release and compatible condition only;
- item price only for Market Value; shipping stays separate;
- recent windows supersede broad history from the same source when they contain enough sales;
- one isolated sale does not establish a public Market Value by itself;
- old sales remain historical context and a fallback when recent evidence is too thin.

### B. Current retail — strong current evidence

Two or more independent retailers with the exact Release genuinely purchasable can define the headline value using the median item price.

One retailer alone remains visible evidence but cannot define the headline without completed-sale corroboration.

Out-of-stock and discontinued pages are historical/scarcity evidence. Their displayed price is **not** treated as a currently purchasable price.

### C. Active marketplace asks — context, not value

Current eBay/Vinted/marketplace asking prices describe seller expectations and supply. They may be shown separately and contribute to market context, but they do not manufacture or inflate Market Value.

### D. TrackDash community purchases — controlled evidence

A purchase price typed into a personal collection is not automatically a market sale.

Future community ingestion must aggregate by independent account before the evidence reaches the valuation engine. Ten copies entered by one account remain one contributor, not ten independent market sources.

Unverified community purchase clusters may contribute only after a minimum number of independent users and coherent recent prices. Their weight must remain below verified completed sales.

### E. TrackDash Confirmed Sales — first-class completed sales

A future TrackDash transaction becomes high-quality completed-sale evidence only after the sale is confirmed by both buyer and seller.

The evidence stored for valuation is the final **item price excluding shipping**, exact Release, condition, currency and sale date. Shipping is stored separately.

Repeated transactions between the same pair of accounts must be grouped/capped for independence so wash trading cannot create artificial volume.

Seller-only reports remain indicative evidence and cannot independently establish Market Value.

## 3. Recency policy

Within each source, TrackDash chooses the most useful current sold sample before combining sources.

Priority:

1. recent monthly evidence when available;
2. a rolling window with at least 5 sales within roughly 120 days;
3. otherwise a rolling window with at least 3 sales within roughly 210 days;
4. otherwise a rolling window with at least 3 sales within roughly 400 days;
5. broad/full-history evidence only as fallback.

A qualifying recent window **supersedes**, rather than duplicates, the broad history from the same source. This prevents double counting and prevents years of old transactions from overwhelming a current move.

For monthly data, v2 prefers the latest six observed months when they contain at least three sales; otherwise it can widen to the latest twelve months.

## 4. Publication gates

A public sold-based Market Value requires:

- at least two completed sold units in the selected evidence; or
- one verified completed sale corroborated by one current retailer at a broadly compatible price.

One indicative sale alone remains evidence but the headline stays unconsolidated.

Two independent current retailers can publish a retail-based headline even when completed-sale evidence is absent.

## 5. Trend

Market Value and trend are related but different.

- Market Value asks "what is it worth now?"
- Trend asks "which direction are demonstrated prices moving?"

A numeric trend must come from chronological observed price evidence. Scarcity, discontinued status, stock-outs and asking prices may support interpretation but can never invent a percentage.

The collector UI keeps the existing neutral band of +/-1% as Stable.

## 6. Retail availability and stock-outs

TrackDash stores price and availability changes over time.

A sequence such as `EUR 13 in stock -> EUR 17 in stock -> EUR 21.79 out of stock` is useful market context, but an out-of-stock price is not converted into a sale and does not directly become Market Value.

Stock-outs can increase scarcity/activity signals and scan priority. They never invent unknown sales volume.

## 7. Anti-manipulation rules for future TrackDash data

- personal collection entries are private accounting first, market evidence second;
- one account is one independent contributor per Release/time cluster, regardless of quantity entered;
- bilateral Confirmed Sales are stronger than self-reported purchases;
- repeated buyer/seller pairs are grouped or capped;
- offers, accepted offers and messages do not count as completed sales;
- only a completed transaction contributes as completed-sale evidence;
- suspicious or extreme evidence remains stored for audit but may require review before promotion.

## 8. Product UX

The complexity stays behind the scenes. Public collector surfaces continue to emphasize:

- `Valore attuale stimato` / `Estimated current value`;
- direction and timeframe when a defensible trend exists;
- rarity and current availability context.

Confidence and evidence provenance remain internal publication controls unless a dedicated details view is useful.

## 9. Versioning discipline

This document defines **Market Method v2**. Changes to the public valuation method must be versioned and justified by a demonstrated failure mode or materially better evidence, not by tuning one Release to a preferred number.

Before a future method replaces v2, it must be run in shadow against a representative set of liquid, sparse, discontinued, rising, falling and insufficient-data Releases.
