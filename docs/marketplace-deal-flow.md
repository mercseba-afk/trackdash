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
9. On confirmation, one physical copy automatically leaves the seller's active collection and is created in the buyer's collection with the confirmed item price/date/currency as its acquisition data.

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
- A public collection share with an accepted live deal cannot be removed or edited until the deal is cancelled, disputed/corrected, or confirmed.

## Collection ownership lifecycle

A bilateral confirmation is also an ownership transfer, not only a market event.

- The sold copy is removed from the seller's **active** collection automatically.
- If a row represents more than one identical copy, only one unit is transferred and the seller keeps the remaining quantity.
- The buyer receives a new active collection row with quantity `1`, the sold condition, sale date and final item price. Its acquisition source is `TrackDash`.
- Shipping is not copied into the buyer's market/acquisition item price; it remains a separate sale field.
- The seller's previous ownership data is not discarded: TrackDash stores an immutable snapshot of the sold collection row plus its photo URLs in `collection_item_transfers`, linked to the confirmed sale and the buyer's new collection row.
- The seller's old public listing is removed. The conversation remains as transaction history even though its `collection_share_id` becomes null.

This keeps active collections truthful while retaining the provenance needed for future sale history, realised performance and collector-to-collector item lineage.
