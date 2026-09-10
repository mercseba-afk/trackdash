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
- Retail, active marketplace asks and completed sales remain distinct anchors and are reliability-weighted by R3.
- A single secondary-market asking price with no retail and no Release-specific sold evidence is **not** enough to publish a Market Value. It remains evidence only.
- Secondary-only Market Value requires either Release-specific sold evidence or at least two independent active marketplace representatives.
- One genuinely purchasable retail source may still publish a low-confidence retail signal because it is an observable current transaction opportunity, not an unsupported secondary ask.
- Outliers are quarantined when they conflict materially with contemporaneous exact evidence and are not promoted merely because the Release identity is correct.
- The public `Da / From` price is intentionally removed for v1. International low prices may be real but not accessible to every user; reintroducing a localised acquisition price requires a separate shipping/market-access model.

### Completed sales / Product Research

- eBay Seller Hub Product Research is the preferred sold-market aggregate source for eBay.
- Aggregate and granular rows from the same source are never summed together; the most suitable current aggregate grain supersedes overlapping rows.
- Sold freshness and evidence grade affect weight. Old research remains history but cannot create a current trend indefinitely.
- `sales_count` represents observed sold units in the accepted Product Research evidence, not a claim about total worldwide sales.
- If Product Research cannot distinguish two reissues sharing an item number, the aggregate stays at item-code level and contributes to neither Release until attribution can be resolved.

### Confidence

Confidence is evidence quality, not marketing certainty. It increases with independent current sources, completed-sale volume/source diversity, anchor agreement, shipping knowledge and sold freshness. Low-confidence values are permitted only when the publication rules above are satisfied.

## Deployment status

Production storage migrations 0037, 0038 and 0039 are applied. Subsequent catalog/image/market audit migrations are tracked on the current feature branch. The application branch is merged only after `pnpm verify` and the Vercel preview succeed, including the R3 and Market Method v1 regression suites.
