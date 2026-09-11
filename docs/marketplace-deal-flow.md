# TrackDash marketplace deal flow

Status: MVP contract for off-platform collector-to-collector deals.

## Flow

1. A collector opens a conversation for one exact shared collection item.
2. Once the owner accepts the conversation request, either participant can send a structured offer.
3. The buyer gets quick actions from the public asking price: full price, -10%, -20%, or a custom amount. Either participant can counter with a custom amount.
4. An accepted offer records an agreement only. It is **not** a completed sale and does not influence Market Value or trend.
5. Three days after acceptance the seller gets an in-app follow-up: Sale completed / Not yet / Cancelled. Not yet snoozes the follow-up for four days.
6. For a completed sale, the seller records the final item price, optional shipping and sale date. Shipping is always separate from the item price.
7. The buyer confirms the sale details or flags them as incorrect.
8. Only a bilateral confirmed sale becomes TrackDash completed-sale evidence.

## Market evidence

- Market Value uses the final **item price excluding shipping**.
- Foreign-currency sales use the historical ECB rate for the sale date when available.
- A seller report without buyer confirmation is not market evidence.
- An accepted offer is not market evidence.
- Confirmed TrackDash sales join the same Market Method v2 sold evidence used by external completed-sale sources.
- Confirmed sales also feed chronological monthly evidence for trend after a calendar month is complete.

## Anti-manipulation

- Repeated confirmed transactions between the same unordered buyer/seller pair inside a 30-day cluster count as one independent market observation.
- The cluster price is the median of its confirmed item-only prices.
- This preserves reported transactions for audit while preventing one pair of accounts from manufacturing volume.
- One physical collection share may have multiple interested conversations but only one live accepted deal at a time.

## Listing lifecycle

When the buyer confirms the sale, the public share is closed from `open_to_offers` to `showcase` and its asking price is cleared. The private seller collection row is intentionally left untouched in this MVP; ownership-transfer/removal UX can be handled as a separate explicit collector action.