# Retail availability audit — 29 October 2026

Current stock and historical catalogue references remain separate. Current anchors require in_stock/low_stock. Unknown, preorder, backorder, out_of_stock and discontinued states are excluded. Sold-out retail is never completed-sale evidence. Existing 15-day marketplace/31-day retail freshness windows remain unchanged.

## Adapter safeguards

- Negated stock labels are checked before InStock substring matching.
- Product structured data with a different product URL is excluded: related products cannot supply the main item's cheaper price or stock.
- Tempio and Caputo additionally require a main-product checkout control. The buy box is scoped after the main heading and before product metadata, excluding recommendations. Explicit out-of-stock overrides InStock metadata; absent or disabled checkout leaves availability unknown. Unverified observations remain context only.
- Existing Briosi exact-variant stock guard remains intact.

## Direct HTTP checks

All requests used ordinary public HTTP with TrackDashMarketBot, outside Vercel. No checkout/order was submitted.

- Tempio, Avante Mk.II standard #18614: EUR14.50, structured InStock, active main-product checkout, SKU TA18614, GTIN4950344064212. Distinct from Gamba/Cerezo variants sharing the item number. Single-endpoint production pilot prepared; include_by_default=false, 28-day interval, existing bounded worker.
  https://iltempiodellemini4wd.it/prodotto/mini4wd-avante-mk-ii-ms-chassis/
- Tempio, Dash-1 Emperor MS #18625: EUR16.50 and checkout present, but merchant GTIN4950344086290 differs from other known #18625 codes. Held for identity corroboration; not enrolled.
  https://iltempiodellemini4wd.it/prodotto/mini4wd-pro-dash-1-emperor-ms-chassis/
- Tempio, Dash-3 Shooting Star MS #18630: EUR16.50, guarded availability unknown. Not enrolled as current stock.
  https://iltempiodellemini4wd.it/prodotto/mini4wd-pro-dash-3-shooting-star-ms-chassis/
- Caputo, Vanguard Sonic Premium #19435: EUR12.00, product explicitly Esaurito/out_of_stock despite category showing Disponibile. Excluded from current prices; no source activation.
  https://www.caputomodellismo.it/product/19435-mini4wd-vanguard-sonic-premium-telaio-carbon-super-ll/

Tempio's recommended-product stock labels initially looked like main-product conflicts. Scoping the buy box corrected that diagnosis; the actual category/product conflict was confirmed on Caputo #19435.

Shipping remains separate and unknown unless verified; no assumption of free shipping. RCJaz remains planned/inactive for scanning, with Asia-Pacific origin and no new price import. Its 10 stored observations are historical (September), outside current retail TTL. No scheduler, frequency increase or eBay budget change.

Validation: existing exact-page tests18, new availability guards10, market-model/publication tests33, TypeScript check. Deployment and production pilot results must be verified separately.
