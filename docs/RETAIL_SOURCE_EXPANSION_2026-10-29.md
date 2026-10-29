# Tempio and Caputo expansion — 29 October 2026

Only existing public releases with exact-edition identity and a purchasable main-product buy box are enrolled. No new releases, rarity changes, broad source enrollment, schedule changes or deployment.

Reviewed new endpoints:

| Source | Item | Exact edition | Checked item price EUR | Identity |
|---|---|---|---:|---|
| Caputo |19415|Hurricane Sonic, Super TZ|12.00|Unique catalogue item and exact kit product page|
| Tempio |18025|2026 Reissue, Type3|14.00|JAN4950344089789 matches2026 release; never assigned1990 original|
| Tempio |92470|Avante Mk.III Nero TKMC2026, MS|26.00|JAN4950344924707 and exact2026 event title|
| Tempio |18628|Dash-2 Burning Sun, MS|16.50|Unique catalogue item; exact MS kit|
| Tempio |18014|Avante Jr.2024 Reissue, Type2|15.00|JAN4950344080878 matches2024; never assigned1988/2012 editions|

Existing Tempio #18614 pilot remains14.50 and retains its original next scan. Both sources include_by_default=false; only verified endpoints have queue jobs. New jobs use28-day initial cadence; normal worker may adapt it. All shipping values remain unknown unless separately verified, never zero by assumption. Caputo's published delivery policy lists10EUR shipping below149EUR order value; this is not treated as free delivery.

Excluded Caputo prices: #19423, #19434, #19435 and #18706 are out_of_stock on exact pages despite category listing discrepancies. No current-price enrollment for these. Tempio #18625 remains held because its merchant GTIN differs from known external codes; #18630 remains unavailable/uncertain. Category lists are discovery hints only.

Source URLs and reproducible registration are in scripts/sql/register-tempio-caputo-expansion-2026-10-29.sql. Existing guarded adapter is already live at fcf589b; use existing bounded worker and verify each production extraction before counting the source as successful.

## Verified production outcome

Registration dry-run passed with rollback, then the five-endpoint expansion was committed. All five new offers were fetched by the existing production worker (HTTP200), accepted without warning/review codes, and their retail anchors recomputed. Latest evidence timestamps:2026-10-29T15:27:38Z through15:28:47Z (16:27–16:28 Europe/Rome). Existing #18614 was preserved. Next scheduled scans26November; five Tempio jobs and one Caputo job total, include_by_default=false for both. Caputo is now production-tested, not just locally accessible.

Bounded existing GitHub Actions jobs123545639731,123545930207 and123546349734 all succeeded; no batch-size change or automatic retry loop. Prices are current retail asking evidence, with shipping unknown in offer records; no completed sales were manufactured. No Vercel deployment needed for this data-only expansion.

Category discovery covered four Caputo and eight Tempio pages;32 distinct Tempio product links and5 Caputo links matched current catalogue item numbers. Only reviewed available exact-edition matches were promoted. Shared codes18025/18014 resolved via JAN; ambiguous/held endpoints and out-of-stock entries excluded.
