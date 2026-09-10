# Price Intelligence R3 architecture status

R3 separates catalog identity, current purchasable offers, completed-sale evidence, historical unavailable offers, public market signals, and scan scheduling.

## Frozen v1 operating method

The public value is always **Release-specific** and currently refers to `new_complete_unbuilt` kits unless a separate condition-specific market is explicitly modelled.

### Identity first

- A sold or active observation may affect a Release only when the Release is resolved with exact/strong evidence.
- A reused Tamiya item number is never enough on its own. Year, reissue wording, chassis, edition wording, packaging/image review, or another release-specific discriminator must separate the generations.
- Unresolved reused-code evidence is stored as `item_pool` / `ambiguous_release` and cannot enter a Release Market Value.

### Current offers

- A visible price is not automatically a current offer. Availability must be positively established as `in_stock` or `low_stock`.
- `out_of_stock`, `discontinued`, `backorder`, `preorder`, unknown/contradictory stock, archives and historical pages do not enter the current offer set.
- RCJAZ and other specialist retailers remain valuable catalog/release sources, but their prices enter R3 only when present-day availability is verified.
- Marketplace inventory is rescanned every 72h in normal/cold operation (24h when hot) and expires from the public signal after 96h without revalidation.
- Retail is rescanned every 168h in normal/cold operation (72h when hot) and expires after 192h without revalidation.
- Expired offers remain in audit/history and can return after a successful recheck.

### Market Value publication

- Shipping is stored separately and never added to the collectible's headline Market Value.
- **Completed sales, active seller asks and retail availability are different market concepts and are never presented as if they were the same measurement.**
- A liquid current retail market requires at least **two independent, fresh retail sources**. In that case the public Market Value is the median verified retail price; completed sales act as corroboration and can raise confidence when broadly aligned.
- One retailer alone remains visible evidence, but is not enough to consolidate a Market Value without completed-sale evidence.
- Outside a liquid retail market, Release-specific completed sales define the public **Market Value**. Active marketplace asks remain a separate signal and do not pull that value up or down.
- One or several active marketplace asks without Release-specific sold evidence are useful market activity, but they do **not** create a Market Value. The UI may show an active asking level while stating that the value is not yet consolidated.
- When both sold evidence and active asks exist, the UI may show whether asking prices are above, below or broadly aligned with observed sold value. This is an **ask-position signal**, not a price trend.
- A true `↑ / ↓` trend is derived only from a sufficient, recent time series of completed sales.
- Outliers are quarantined when they conflict materially with contemporaneous exact evidence and are not promoted merely because the Release identity is correct.
- The public `Da / From` price is intentionally removed for v1. International low prices may be real but not accessible to every user; reintroducing a localised acquisition price requires a separate shipping/market-access model.

### Completed sales / Product Research

- eBay Seller Hub Product Research is the preferred sold-market aggregate source for eBay.
- Aggregate and granular rows from the same source are never summed together; the most suitable current aggregate grain supersedes overlapping rows.
- **Sold freshness follows the most recent actual accepted sale, not the end date of the Product Research query window.** Query coverage is stored separately in provenance/raw payload.
- Sold freshness and evidence grade affect weight. Old research remains history but cannot create a current trend indefinitely.
- `sales_count` represents observed sold units in the accepted Product Research evidence, not a claim about total worldwide sales.
- If Product Research cannot distinguish two reissues sharing an item number, the aggregate stays at item-code level and contributes to neither Release until attribution can be resolved.

### Confidence

Confidence is evidence quality, not marketing certainty. For sold-based values it depends on completed-sale volume, source diversity, evidence quality and recency. For retail-based values it depends primarily on independent fresh retail sources, with completed sales used only as corroboration. Active marketplace asks never inflate headline confidence.

## Public UI semantics

The Release market card is designed to be readable without requiring the user to understand the R3 model:

- **Market Value** = current retail median when at least two independent fresh retailers define a liquid market; otherwise demonstrated completed-sale value.
- **Verified retail** = genuinely available current retail pricing, shown separately from secondary asks.
- **Observed sold** = completed-sale anchor used for collector/secondary-market valuation and retail corroboration.
- **Active asks** = current seller expectation, shown separately.
- **Asks above/below sold** = current positioning of seller expectations; never labelled as growth/decline.
- **Sales trend** = actual completed-sale movement over time and appears only with sufficient recent time-series evidence.
- **Market forming / Value not yet consolidated** = real activity exists, but evidence is not yet independent or strong enough to publish Market Value.

The design goal is to stimulate collection activity and future trading by making market activity visible, without using optimistic arrows or asking prices to manufacture appreciation that completed transactions do not support.

## Deployment status

Production storage migrations 0037, 0038 and 0039 are applied. Catalog/image/market audit migrations through 0063 are tracked on the current feature branch and applied to the live Supabase project where noted. The application branch is merged only after `pnpm verify` and the Vercel preview succeed, including the R3 and Market Method v1 regression suites.