# Marketplace deal flow smoke coverage

Before merging this feature, the production Supabase migrations were exercised inside explicit transactions that were rolled back.

Validated state path:

`structured offer -> accepted offer -> seller reports final item price + separate shipping -> buyer confirms -> TrackDash confirmed sale -> collection ownership transfer`

Assertions included:

- accepted offer remains an agreement and not a sale;
- final item price and shipping remain separate fields;
- buyer confirmation moves the sale to `confirmed`;
- accepted offer moves to deal state `confirmed`;
- the seller's public `open_to_offers` share is removed and the conversation safely keeps its history with a null share reference;
- exactly one physical copy leaves the seller's active collection (or decrements a multi-copy row by one);
- the buyer receives a new collection row with quantity `1`, the confirmed condition, sale date and item price, and acquisition source `TrackDash`;
- an immutable `collection_item_transfers` row preserves the seller-side collection snapshot and photo URLs for future ownership/provenance history;
- the smoke transaction was rolled back, so no test offer, sale, transfer or buyer collection item persisted.

The transfer smoke completed successfully against the migrated production schema on 2026-09-11.

This is in addition to the ordinary TrackDash build gates (typecheck, catalog/image/FX/market pipeline/R3/Market Method/public-surface tests) and the dedicated TrackDash sale-evidence regression gate in `pnpm verify`.

## Recheck on 24 November 2026

The deployed Frankfurt database passed the rolled-back integration audit again,
including the real authenticated role and row-level policies. No fixture or test
notification persisted and no push was sent. Checks covered chat requests,
messages in both directions, outsider isolation, offers and counteroffers,
acceptance, sale reporting, buyer confirmation and collection transfer.

Additional assertions executed the SQL extracted from
`lib/db/queries/deal-notifications.ts`: an incoming counteroffer counts for the
buyer and clears after reading the conversation. Offer, counteroffer, acceptance,
buyer confirmation and seller confirmation bell alerts were also verified.

Component regression coverage in `scripts/test-messaging-refresh.mjs` checks
new-request/acceptance refresh, reconnects, return from background, and cleanup.
This validates application logic and database behavior; it is not a two-device
browser or operating-system push-delivery certification. The current scheduled
push sender handles catalog notifications only.
