# TrackDash Market Audit v1

## Goal

Estimate the market for one exact Release without becoming eBay-dependent, retailer-dependent, or region-dependent.

Market Audit is a lightweight shadow layer. It does not replace R3 yet. It checks whether the evidence behind a public value is broad enough to be believable before the method is rolled out catalog-wide.

## Evidence lanes

1. **Current retail** — exact Release, genuinely purchasable now. One merchant gets one vote even if it has multiple storefronts. Retail is summarized per region first, then across regions.
2. **Current completed sales** — strongest evidence when attribution is exact. Repeated sales from one known seller are real transactions, but not broad market agreement.
3. **Historical retail / sold-out** — useful context and scarcity history. It is retained with date and last observed price, but never pretends to be currently purchasable.
4. **Active marketplace asks** — supply/asking context only. ASK prices never create Market Value on their own.
5. **TrackDash confirmed sales** — first-class completed sales when both sides confirm.

## Independence

- Same merchant across multiple domains/storefronts = one merchant.
- Marketplaces with independent sellers are grouped by seller fingerprint.
- Regions are tracked separately: Europe, Japan, North America, Asia-Pacific, Global, Internal.
- Missing regions lower confidence; they do not mechanically lower the estimated value.

## Shadow publication rules

- Two independent current retailers can establish a retail lane.
- A sold lane is considered broad enough only when there is verified evidence, more than one sold source, or known seller diversity of at least two.
- One known seller with many transactions remains valid sold evidence but cannot reach Medium confidence by itself.
- When qualified current retail and qualified sold anchors disagree by more than 50%, Market Audit returns conflict instead of manufacturing a midpoint.
- Active asks remain context.

## 18069 pilot

The first calibration Release is **18069 — Dash-1 Emperor Premium** because it has much richer evidence than 95467: many observed completed sales plus live/historical retailer coverage across several regions.

The existing 95467 remains the sparse/discontinued counter-test.

## Scalability

The recurring automated scan is intentionally bounded:

- retail: approximately every 7 days;
- active marketplaces: approximately every 3 days;
- sold research: approximately every 14 days;
- exact product URLs are curated once, then rescanned;
- new/unmapped sources stay planned/manual until the parser is proven fail-closed.

This avoids open-ended web crawling while still allowing the source registry to grow over time.


## 18069 live retailer probe — 2026-09-18

The reusable exact-page probe was run from GitHub Actions against the first retailer set.

| Source | Result | Price | Availability | Automation |
| --- | --- | ---: | --- | --- |
| Briosi | exact item + structured offer | EUR 17.70 | in stock | ready candidate |
| iModellini | exact item + meta offer | EUR 17.90 | out of stock | ready candidate; historical context only |
| Plaza Japan | exact item + meta offer | JPY 990 | in stock | ready candidate |
| Pieroni | exact item + structured offer | EUR 18.00 | out of stock | ready candidate; historical context only |
| Tamiya USA | redirected to bot challenge | — | unknown to scanner | manual/planned |
| Tamiya Shop Japan | exact item visible but no reliable machine-readable price in current Shift_JIS page | — | unknown to scanner | manual |
| RCJAZ | HTTP 403 from server-side probe | — | unknown to scanner | planned |

This is useful evidence in itself: the same exact current Release can sit in materially different regional price lanes. TrackDash therefore must not average two strongly divergent regional retail prices into a fake global midpoint. Market Audit now flags a severe two-region split and withholds a global retail-only headline until more regional or completed-sale evidence resolves it.

The source onboarding rule is intentionally simple: a retailer is promoted to automatic scanning only after one exact Release page proves item identity, price and availability fail-closed. Unsupported/bot-blocked sources remain useful manual/reference sources rather than being scraped unreliably.
